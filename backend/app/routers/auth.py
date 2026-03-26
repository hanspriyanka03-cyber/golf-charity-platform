from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, PasswordChangeRequest
from app.schemas.user import UserResponse
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_active_user,
)
from app.services.stripe_service import stripe_service
from app.services.email_service import email_service
from app.database import get_supabase
from app.models.user import User
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    db = get_supabase()

    # Check if email already exists
    existing = db.table("profiles").select("id").eq("email", request.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create Stripe customer
    try:
        stripe_customer = stripe_service.create_customer(request.email, request.full_name)
        stripe_customer_id = stripe_customer.id
    except Exception:
        stripe_customer_id = None

    # Create user profile
    user_id = str(uuid.uuid4())
    hashed = hash_password(request.password)

    profile_data = {
        "id": user_id,
        "email": request.email,
        "full_name": request.full_name,
        "role": "user",
        "subscription_status": "inactive",
        "charity_id": request.charity_id,
        "charity_percentage": request.charity_percentage,
        "stripe_customer_id": stripe_customer_id,
        "is_active": True,
        "password_hash": hashed,
    }

    result = db.table("profiles").insert(profile_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_data = result.data[0]
    user = User(**user_data)

    # Send welcome email (non-blocking)
    try:
        email_service.send_welcome_email(user.email, user.full_name or user.email)
    except Exception:
        pass

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**user_data),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    db = get_supabase()

    result = db.table("profiles").select("*").eq("email", request.email).single().execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_data = result.data
    password_hash = user_data.get("password_hash", "")

    if not verify_password(request.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user_data.get("is_active", True):
        raise HTTPException(status_code=400, detail="Account is inactive")

    token = create_access_token({"sub": user_data["id"], "role": user_data["role"]})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**user_data),
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    # JWT is stateless; client should delete the token
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return UserResponse(**current_user.model_dump())


@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    result = db.table("profiles").select("password_hash").eq("id", current_user.id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(request.current_password, result.data["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = hash_password(request.new_password)
    db.table("profiles").update({"password_hash": new_hash}).eq("id", current_user.id).execute()

    return {"message": "Password changed successfully"}
