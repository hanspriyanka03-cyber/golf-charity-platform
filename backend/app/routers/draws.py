from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.schemas.draw import DrawResponse, DrawResultResponse, WinnerSummary
from app.services.auth_service import get_current_active_user
from app.database import get_supabase
from app.models.user import User

router = APIRouter(prefix="/draws", tags=["draws"])


@router.get("", response_model=List[DrawResponse])
async def list_draws():
    """List all published draws (public)."""
    db = get_supabase()
    result = (
        db.table("draws")
        .select("*")
        .eq("status", "published")
        .order("month", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/my-results")
async def my_draw_results(current_user: User = Depends(get_current_active_user)):
    """Get current user's draw participation history."""
    db = get_supabase()

    # Get user's scores
    scores_result = (
        db.table("golf_scores")
        .select("score")
        .eq("user_id", current_user.id)
        .execute()
    )
    user_scores = [r["score"] for r in (scores_result.data or [])]

    # Get all published draws
    draws_result = (
        db.table("draws")
        .select("*")
        .eq("status", "published")
        .order("month", desc=True)
        .execute()
    )
    draws = draws_result.data or []

    # Get user's winner records
    winners_result = (
        db.table("winners")
        .select("*")
        .eq("user_id", current_user.id)
        .execute()
    )
    user_wins = {w["draw_id"]: w for w in (winners_result.data or [])}

    results = []
    for draw in draws:
        drawn_numbers = draw.get("drawn_numbers", [])
        matched = len(set(drawn_numbers) & set(user_scores))
        win_record = user_wins.get(draw["id"])

        results.append({
            "draw": draw,
            "user_scores": user_scores,
            "numbers_matched": matched,
            "is_winner": win_record is not None,
            "win_details": win_record,
        })

    return results


@router.get("/{draw_id}", response_model=DrawResultResponse)
async def get_draw(draw_id: str):
    """Get draw details and results."""
    db = get_supabase()

    draw_result = (
        db.table("draws")
        .select("*")
        .eq("id", draw_id)
        .eq("status", "published")
        .single()
        .execute()
    )
    if not draw_result.data:
        raise HTTPException(status_code=404, detail="Draw not found")

    draw = draw_result.data

    # Get winners
    winners_result = (
        db.table("winners")
        .select("*, profiles(email, full_name)")
        .eq("draw_id", draw_id)
        .execute()
    )
    winners = winners_result.data or []

    winners_5 = [
        WinnerSummary(
            user_id=w["user_id"],
            match_count=w["match_count"],
            prize_amount=w.get("prize_amount", 0),
        )
        for w in winners if w["match_count"] == 5
    ]
    winners_4 = [
        WinnerSummary(
            user_id=w["user_id"],
            match_count=w["match_count"],
            prize_amount=w.get("prize_amount", 0),
        )
        for w in winners if w["match_count"] == 4
    ]
    winners_3 = [
        WinnerSummary(
            user_id=w["user_id"],
            match_count=w["match_count"],
            prize_amount=w.get("prize_amount", 0),
        )
        for w in winners if w["match_count"] == 3
    ]

    return DrawResultResponse(
        draw=DrawResponse(**draw),
        winners_5=winners_5,
        winners_4=winners_4,
        winners_3=winners_3,
        total_winners=len(winners),
    )
