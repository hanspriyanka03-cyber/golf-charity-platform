from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class CharityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    website: Optional[str] = None
    is_featured: bool = False
    events: List[Any] = []


class CharityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    website: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    events: Optional[List[Any]] = None


class CharityResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    website: Optional[str] = None
    is_featured: bool
    is_active: bool
    events: List[Any] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DonationRequest(BaseModel):
    charity_id: str
    amount: float


class CharityUpdateRequest(BaseModel):
    charity_id: str
    charity_percentage: int
