from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class DrawCreate(BaseModel):
    month: str  # YYYY-MM
    draw_type: str  # random | algorithmic


class DrawResponse(BaseModel):
    id: str
    month: str
    draw_type: str
    status: str
    drawn_numbers: List[int]
    prize_pool_total: float
    jackpot_amount: float
    five_match_pool: float
    four_match_pool: float
    three_match_pool: float
    jackpot_rollover: float
    simulation_results: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DrawSimulateRequest(BaseModel):
    draw_id: str


class DrawPublishRequest(BaseModel):
    draw_id: str
    prize_pool_total: float
    jackpot_rollover: float = 0.0


class WinnerSummary(BaseModel):
    user_id: str
    match_count: int
    prize_amount: float


class DrawResultResponse(BaseModel):
    draw: DrawResponse
    winners_5: List[WinnerSummary] = []
    winners_4: List[WinnerSummary] = []
    winners_3: List[WinnerSummary] = []
    total_winners: int
