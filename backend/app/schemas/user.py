from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    subscription_status: str
    charity_id: Optional[str] = None
    charity_percentage: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    charity_id: Optional[str] = None
    charity_percentage: Optional[int] = None


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    subscription_status: Optional[str] = None
    charity_id: Optional[str] = None
    charity_percentage: Optional[int] = None
    is_active: Optional[bool] = None
