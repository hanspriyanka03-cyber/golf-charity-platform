from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class ScoreCreate(BaseModel):
    score: int = Field(..., ge=1, le=45, description="Stableford score between 1 and 45")
    date_played: date


class ScoreUpdate(BaseModel):
    score: Optional[int] = Field(None, ge=1, le=45)
    date_played: Optional[date] = None


class ScoreResponse(BaseModel):
    id: str
    user_id: str
    score: int
    date_played: date
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScoreListResponse(BaseModel):
    scores: List[ScoreResponse]
    total: int
