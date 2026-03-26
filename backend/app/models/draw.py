from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class Draw(BaseModel):
    id: str
    month: str  # YYYY-MM
    draw_type: str  # random | algorithmic
    status: str = "draft"  # draft | simulated | published
    drawn_numbers: List[int] = []
    prize_pool_total: float = 0.0
    jackpot_amount: float = 0.0
    five_match_pool: float = 0.0
    four_match_pool: float = 0.0
    three_match_pool: float = 0.0
    jackpot_rollover: float = 0.0
    simulation_results: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True
