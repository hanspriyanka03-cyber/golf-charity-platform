from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class Charity(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    website: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    events: List[Any] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
