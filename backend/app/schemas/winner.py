from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WinnerVerificationUpdate(BaseModel):
    status: str  # approved | rejected
    admin_notes: Optional[str] = None


class ProofUploadResponse(BaseModel):
    proof_url: str
    message: str


class WinnerResponse(BaseModel):
    id: str
    draw_id: str
    user_id: str
    match_count: int
    prize_amount: Optional[float] = None
    verification_status: str
    payment_status: str
    proof_url: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    # Joined fields
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    draw_month: Optional[str] = None

    class Config:
        from_attributes = True
