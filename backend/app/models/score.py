from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class Score(BaseModel):
    id: str
    user_id: str
    score: int = Field(..., ge=1, le=45)
    date_played: date
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
