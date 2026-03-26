from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Winner(BaseModel):
    id: str
    draw_id: str
    user_id: str
    match_count: int  # 3 | 4 | 5
    prize_amount: Optional[float] = None
    verification_status: str = "pending"  # pending | approved | rejected
    payment_status: str = "pending"  # pending | paid
    proof_url: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
