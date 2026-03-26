from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class User(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"  # user | admin
    subscription_status: str = "inactive"
    charity_id: Optional[str] = None
    charity_percentage: int = 10
    stripe_customer_id: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
