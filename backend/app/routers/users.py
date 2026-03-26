from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.charity import CharityUpdateRequest
from app.services.auth_service import get_current_active_user
from app.database import get_supabase
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    return UserResponse(**current_user.model_dump())


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()
    update_data = update.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.table("profiles")
        .update(update_data)
        .eq("id", current_user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")

    return UserResponse(**result.data[0])


@router.put("/me/charity", response_model=UserResponse)
async def update_charity(
    request: CharityUpdateRequest,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    # Validate charity exists
    charity = db.table("charities").select("id").eq("id", request.charity_id).eq("is_active", True).single().execute()
    if not charity.data:
        raise HTTPException(status_code=404, detail="Charity not found")

    if request.charity_percentage < 10:
        raise HTTPException(status_code=400, detail="Minimum charity percentage is 10%")

    result = (
        db.table("profiles")
        .update({
            "charity_id": request.charity_id,
            "charity_percentage": request.charity_percentage,
        })
        .eq("id", current_user.id)
        .execute()
    )

    return UserResponse(**result.data[0])
