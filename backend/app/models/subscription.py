from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class Subscription(BaseModel):
    id: str
    user_id: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    plan_type: str  # monthly | yearly
    status: str  # active | inactive | cancelled | lapsed | past_due
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    prize_pool_contribution: Optional[float] = None
    charity_contribution: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
