from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import Optional, List
from datetime import datetime, timezone
from app.schemas.subscription import SubscriptionResponse, CheckoutRequest, PlanResponse
from app.services.auth_service import get_current_active_user
from app.services.stripe_service import stripe_service
from app.services.prize_pool import PrizePoolService
from app.database import get_supabase
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/subscription", tags=["subscriptions"])
prize_pool_svc = PrizePoolService()


@router.get("/plans", response_model=List[PlanResponse])
async def get_plans():
    """Get available subscription plans."""
    return [
        PlanResponse(
            plan_type="monthly",
            price=9.99,
            currency="gbp",
            interval="month",
            price_id=settings.stripe_monthly_price_id,
            description="Monthly subscription",
            features=[
                "5 score entries per month",
                "Participate in monthly draws",
                "Choose your charity",
                "Win cash prizes",
                "Min 10% to charity",
            ],
        ),
        PlanResponse(
            plan_type="yearly",
            price=99.99,
            currency="gbp",
            interval="year",
            price_id=settings.stripe_yearly_price_id,
            description="Yearly subscription (save 17%)",
            features=[
                "Everything in monthly",
                "Save £19.89 per year",
                "Priority support",
                "Early draw access",
            ],
        ),
    ]


@router.get("", response_model=Optional[SubscriptionResponse])
async def get_subscription(current_user: User = Depends(get_current_active_user)):
    db = get_supabase()
    result = (
        db.table("subscriptions")
        .select("*")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return SubscriptionResponse(**result.data[0])


@router.post("/checkout")
async def create_checkout(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    # Get Stripe customer ID
    profile = db.table("profiles").select("stripe_customer_id").eq("id", current_user.id).single().execute()
    stripe_customer_id = profile.data.get("stripe_customer_id") if profile.data else None

    if not stripe_customer_id:
        # Create Stripe customer if not exists
        customer = stripe_service.create_customer(current_user.email, current_user.full_name or current_user.email)
        stripe_customer_id = customer.id
        db.table("profiles").update({"stripe_customer_id": stripe_customer_id}).eq("id", current_user.id).execute()

    price_id = (
        settings.stripe_monthly_price_id
        if request.plan_type == "monthly"
        else settings.stripe_yearly_price_id
    )

    success_url = f"{settings.frontend_url}/dashboard?subscription=success"
    cancel_url = f"{settings.frontend_url}/dashboard?subscription=cancelled"

    session = stripe_service.create_subscription(
        customer_id=stripe_customer_id,
        price_id=price_id,
        plan_type=request.plan_type,
        success_url=success_url,
        cancel_url=cancel_url,
    )

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_active_user)):
    db = get_supabase()

    sub = (
        db.table("subscriptions")
        .select("*")
        .eq("user_id", current_user.id)
        .eq("status", "active")
        .single()
        .execute()
    )

    if not sub.data:
        raise HTTPException(status_code=404, detail="No active subscription found")

    stripe_sub_id = sub.data.get("stripe_subscription_id")
    if stripe_sub_id:
        stripe_service.cancel_subscription(stripe_sub_id)

    db.table("subscriptions").update({"status": "cancelled"}).eq("id", sub.data["id"]).execute()
    db.table("profiles").update({"subscription_status": "inactive"}).eq("id", current_user.id).execute()

    return {"message": "Subscription cancelled successfully"}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
):
    payload = await request.body()

    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    event = stripe_service.handle_webhook(payload, stripe_signature)
    db = get_supabase()

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        customer_id = data.get("customer")
        subscription_id = data.get("subscription")
        plan_type = data.get("metadata", {}).get("plan_type", "monthly")

        # Find user by Stripe customer ID
        profile = db.table("profiles").select("*").eq("stripe_customer_id", customer_id).single().execute()
        if not profile.data:
            return {"received": True}

        user_id = profile.data["id"]
        charity_percentage = profile.data.get("charity_percentage", 10)

        # Get subscription details from Stripe
        sub_details = stripe_service.get_subscription_status(subscription_id)

        # Calculate contributions
        split = prize_pool_svc.calculate_per_subscription_split(plan_type, charity_percentage)

        # Upsert subscription record
        sub_data = {
            "user_id": user_id,
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id,
            "plan_type": plan_type,
            "status": "active",
            "current_period_start": datetime.fromtimestamp(
                sub_details["current_period_start"], tz=timezone.utc
            ).isoformat(),
            "current_period_end": datetime.fromtimestamp(
                sub_details["current_period_end"], tz=timezone.utc
            ).isoformat(),
            "prize_pool_contribution": split["prize_pool_contribution"],
            "charity_contribution": split["charity_contribution"],
        }
        db.table("subscriptions").insert(sub_data).execute()
        db.table("profiles").update({"subscription_status": "active"}).eq("id", user_id).execute()

    elif event_type == "customer.subscription.updated":
        subscription_id = data.get("id")
        new_status = data.get("status")

        sub = db.table("subscriptions").select("*").eq("stripe_subscription_id", subscription_id).single().execute()
        if sub.data:
            mapped_status = "active" if new_status == "active" else (
                "lapsed" if new_status == "past_due" else "cancelled"
            )
            db.table("subscriptions").update({"status": mapped_status}).eq("stripe_subscription_id", subscription_id).execute()
            db.table("profiles").update({"subscription_status": mapped_status}).eq("id", sub.data["user_id"]).execute()

    elif event_type == "customer.subscription.deleted":
        subscription_id = data.get("id")
        sub = db.table("subscriptions").select("user_id").eq("stripe_subscription_id", subscription_id).single().execute()
        if sub.data:
            db.table("subscriptions").update({"status": "cancelled"}).eq("stripe_subscription_id", subscription_id).execute()
            db.table("profiles").update({"subscription_status": "inactive"}).eq("id", sub.data["user_id"]).execute()

    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        profile = db.table("profiles").select("id").eq("stripe_customer_id", customer_id).single().execute()
        if profile.data:
            db.table("profiles").update({"subscription_status": "lapsed"}).eq("id", profile.data["id"]).execute()
            db.table("subscriptions").update({"status": "lapsed"}).eq("user_id", profile.data["id"]).execute()

    return {"received": True}
