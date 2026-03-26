from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    stripe_subscription_id: Optional[str] = None
    plan_type: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    prize_pool_contribution: Optional[float] = None
    charity_contribution: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    plan_type: str  # monthly | yearly


class PlanResponse(BaseModel):
    plan_type: str
    price: float
    currency: str
    interval: str
    price_id: str
    description: str
    features: list
