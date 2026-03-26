from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.score import ScoreCreate, ScoreUpdate, ScoreResponse, ScoreListResponse
from app.services.auth_service import get_current_active_user
from app.database import get_supabase
from app.models.user import User

router = APIRouter(prefix="/scores", tags=["scores"])

MAX_SCORES = 5


@router.get("", response_model=ScoreListResponse)
async def get_scores(current_user: User = Depends(get_current_active_user)):
    db = get_supabase()
    result = (
        db.table("golf_scores")
        .select("*")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
        .limit(MAX_SCORES)
        .execute()
    )
    scores = result.data or []
    return ScoreListResponse(scores=scores, total=len(scores))


@router.post("", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
async def add_score(
    score_data: ScoreCreate,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    # Get current scores ordered by creation time (oldest first)
    existing = (
        db.table("golf_scores")
        .select("*")
        .eq("user_id", current_user.id)
        .order("created_at", desc=False)
        .execute()
    )
    current_scores = existing.data or []

    # Rolling window: if already at max, delete the oldest
    if len(current_scores) >= MAX_SCORES:
        oldest = current_scores[0]
        db.table("golf_scores").delete().eq("id", oldest["id"]).execute()

    # Insert new score
    new_score = {
        "user_id": current_user.id,
        "score": score_data.score,
        "date_played": score_data.date_played.isoformat(),
    }
    result = db.table("golf_scores").insert(new_score).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add score")

    return ScoreResponse(**result.data[0])


@router.put("/{score_id}", response_model=ScoreResponse)
async def update_score(
    score_id: str,
    score_data: ScoreUpdate,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    # Verify ownership
    existing = (
        db.table("golf_scores")
        .select("*")
        .eq("id", score_id)
        .eq("user_id", current_user.id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Score not found")

    update_data = score_data.model_dump(exclude_none=True)
    if "date_played" in update_data:
        update_data["date_played"] = update_data["date_played"].isoformat()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.table("golf_scores")
        .update(update_data)
        .eq("id", score_id)
        .eq("user_id", current_user.id)
        .execute()
    )

    return ScoreResponse(**result.data[0])


@router.delete("/{score_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_score(
    score_id: str,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    existing = (
        db.table("golf_scores")
        .select("id")
        .eq("id", score_id)
        .eq("user_id", current_user.id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Score not found")

    db.table("golf_scores").delete().eq("id", score_id).execute()
    return None
