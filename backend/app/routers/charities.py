from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.schemas.charity import CharityCreate, CharityUpdate, CharityResponse, DonationRequest
from app.services.auth_service import get_current_active_user
from app.services.stripe_service import stripe_service
from app.database import get_supabase
from app.models.user import User

router = APIRouter(prefix="/charities", tags=["charities"])


@router.get("", response_model=List[CharityResponse])
async def list_charities(
    search: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
):
    db = get_supabase()
    query = db.table("charities").select("*").eq("is_active", True)

    if featured is not None:
        query = query.eq("is_featured", featured)

    result = query.order("is_featured", desc=True).execute()
    charities = result.data or []

    if search:
        search_lower = search.lower()
        charities = [
            c for c in charities
            if search_lower in c.get("name", "").lower()
            or search_lower in (c.get("description") or "").lower()
        ]

    return charities


@router.get("/{charity_id}", response_model=CharityResponse)
async def get_charity(charity_id: str):
    db = get_supabase()
    result = db.table("charities").select("*").eq("id", charity_id).eq("is_active", True).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Charity not found")
    return result.data


@router.post("/donate")
async def donate(
    request: DonationRequest,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    # Validate charity
    charity = db.table("charities").select("id, name").eq("id", request.charity_id).eq("is_active", True).single().execute()
    if not charity.data:
        raise HTTPException(status_code=404, detail="Charity not found")

    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    # Create payment intent via Stripe
    payment_intent = stripe_service.create_payment_intent(
        amount=request.amount,
        currency="gbp",
        metadata={
            "user_id": current_user.id,
            "charity_id": request.charity_id,
            "charity_name": charity.data["name"],
            "type": "independent_donation",
        },
    )

    # Record donation
    donation_data = {
        "user_id": current_user.id,
        "charity_id": request.charity_id,
        "amount": request.amount,
        "stripe_payment_intent_id": payment_intent.id,
        "status": "pending",
    }
    db.table("donations").insert(donation_data).execute()

    return {
        "client_secret": payment_intent.client_secret,
        "payment_intent_id": payment_intent.id,
        "amount": request.amount,
        "charity_name": charity.data["name"],
    }
