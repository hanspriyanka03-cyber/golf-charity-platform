from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timezone
from app.schemas.user import UserResponse, AdminUserUpdate
from app.schemas.draw import DrawCreate, DrawResponse, DrawResultResponse, WinnerSummary
from app.schemas.charity import CharityCreate, CharityUpdate, CharityResponse
from app.schemas.winner import WinnerResponse, WinnerVerificationUpdate
from app.services.auth_service import require_admin
from app.services.draw_engine import DrawEngine
from app.services.prize_pool import PrizePoolService
from app.services.email_service import email_service
from app.database import get_supabase
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])
draw_engine = DrawEngine()
prize_pool_svc = PrizePoolService()


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    search: Optional[str] = Query(None),
    subscription_status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(require_admin),
):
    db = get_supabase()
    query = db.table("profiles").select("*")

    if subscription_status:
        query = query.eq("subscription_status", subscription_status)
    if role:
        query = query.eq("role", role)

    result = query.range(skip, skip + limit - 1).execute()
    users = result.data or []

    if search:
        search_lower = search.lower()
        users = [
            u for u in users
            if search_lower in u.get("email", "").lower()
            or search_lower in (u.get("full_name") or "").lower()
        ]

    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, admin: User = Depends(require_admin)):
    db = get_supabase()
    result = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update: AdminUserUpdate,
    admin: User = Depends(require_admin),
):
    db = get_supabase()
    update_data = update.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("profiles").update(update_data).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]


@router.put("/users/{user_id}/scores")
async def admin_update_user_scores(
    user_id: str,
    scores: List[dict],
    admin: User = Depends(require_admin),
):
    """Admin can edit a user's scores. Replaces all scores for the user."""
    db = get_supabase()

    # Delete existing scores
    db.table("golf_scores").delete().eq("user_id", user_id).execute()

    # Insert new scores (max 5)
    new_scores = []
    for s in scores[:5]:
        new_scores.append({
            "user_id": user_id,
            "score": s.get("score"),
            "date_played": s.get("date_played"),
        })

    if new_scores:
        result = db.table("golf_scores").insert(new_scores).execute()
        return {"message": "Scores updated", "scores": result.data}
    return {"message": "All scores removed"}


# ─── Subscriptions ─────────────────────────────────────────────────────────────

@router.get("/subscriptions")
async def list_subscriptions(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
):
    db = get_supabase()
    query = db.table("subscriptions").select("*, profiles(email, full_name)")

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.range(skip, skip + limit - 1).order("created_at", desc=True).execute()
    return result.data or []


# ─── Draws ─────────────────────────────────────────────────────────────────────

@router.get("/draws", response_model=List[DrawResponse])
async def list_draws(
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: User = Depends(require_admin),
):
    db = get_supabase()
    query = db.table("draws").select("*")
    if status_filter:
        query = query.eq("status", status_filter)
    result = query.order("month", desc=True).execute()
    return result.data or []


@router.post("/draws", response_model=DrawResponse, status_code=status.HTTP_201_CREATED)
async def create_draw(
    data: DrawCreate,
    admin: User = Depends(require_admin),
):
    db = get_supabase()

    # Check for existing draw this month
    existing = db.table("draws").select("id").eq("month", data.month).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail=f"Draw for {data.month} already exists")

    # Calculate prize pool
    active_subs = db.table("subscriptions").select("prize_pool_contribution").eq("status", "active").execute()
    prize_pool_total = sum(
        float(s.get("prize_pool_contribution") or 0) for s in (active_subs.data or [])
    )

    # Get previous unpaid jackpot rollover
    prev_draws = (
        db.table("draws")
        .select("jackpot_rollover")
        .eq("status", "published")
        .order("month", desc=True)
        .limit(1)
        .execute()
    )
    jackpot_rollover = 0.0
    if prev_draws.data:
        jackpot_rollover = float(prev_draws.data[0].get("jackpot_rollover") or 0)

    draw_data = {
        "month": data.month,
        "draw_type": data.draw_type,
        "status": "draft",
        "drawn_numbers": [],
        "prize_pool_total": prize_pool_total,
        "jackpot_amount": round(prize_pool_total * 0.40 + jackpot_rollover, 2),
        "five_match_pool": round(prize_pool_total * 0.40, 2),
        "four_match_pool": round(prize_pool_total * 0.35, 2),
        "three_match_pool": round(prize_pool_total * 0.25, 2),
        "jackpot_rollover": jackpot_rollover,
    }

    result = db.table("draws").insert(draw_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create draw")
    return result.data[0]


@router.post("/draws/{draw_id}/simulate")
async def simulate_draw(draw_id: str, admin: User = Depends(require_admin)):
    db = get_supabase()

    draw = db.table("draws").select("*").eq("id", draw_id).single().execute()
    if not draw.data:
        raise HTTPException(status_code=404, detail="Draw not found")

    draw_data = draw.data
    score_frequencies = draw_engine.get_score_frequencies(db)
    all_user_scores = draw_engine.get_all_user_scores(db)

    simulation = draw_engine.simulate_draw(
        draw_type=draw_data["draw_type"],
        score_frequencies=score_frequencies,
        all_user_scores=all_user_scores,
        prize_pool_total=float(draw_data.get("prize_pool_total") or 0),
        jackpot_rollover=float(draw_data.get("jackpot_rollover") or 0),
    )

    # Save simulation results
    db.table("draws").update({
        "simulation_results": simulation,
        "drawn_numbers": simulation["drawn_numbers"],
        "status": "simulated",
    }).eq("id", draw_id).execute()

    return simulation


@router.post("/draws/{draw_id}/publish")
async def publish_draw(draw_id: str, admin: User = Depends(require_admin)):
    db = get_supabase()

    draw = db.table("draws").select("*").eq("id", draw_id).execute()
    if not draw.data:
        raise HTTPException(status_code=404, detail="Draw not found")

    draw_data = draw.data[0]
    if draw_data["status"] == "published":
        raise HTTPException(status_code=400, detail="Draw already published")

    # Ensure draw has numbers (simulate if not done yet)
    drawn_numbers = draw_data.get("drawn_numbers") or []
    if not drawn_numbers:
        score_frequencies = draw_engine.get_score_frequencies(db)
        if draw_data["draw_type"] == "algorithmic":
            drawn_numbers = draw_engine.generate_algorithmic_draw(score_frequencies)
        else:
            drawn_numbers = draw_engine.generate_random_draw()

    # Get all participating user scores
    all_user_scores = draw_engine.get_all_user_scores(db)

    # Calculate winners
    winners = draw_engine.calculate_winners(drawn_numbers, all_user_scores)

    prize_pool_total = float(draw_data.get("prize_pool_total") or 0)
    jackpot_rollover = float(draw_data.get("jackpot_rollover") or 0)

    prize_breakdown = draw_engine.calculate_prize_amounts(
        prize_pool_total, winners, jackpot_rollover
    )

    # Create winner records
    now = datetime.now(timezone.utc).isoformat()
    winner_records = []

    for user_id in winners["5_match"]:
        winner_records.append({
            "draw_id": draw_id,
            "user_id": user_id,
            "match_count": 5,
            "prize_amount": prize_breakdown["prize_per_5_winner"],
            "verification_status": "pending",
            "payment_status": "pending",
        })

    for user_id in winners["4_match"]:
        winner_records.append({
            "draw_id": draw_id,
            "user_id": user_id,
            "match_count": 4,
            "prize_amount": prize_breakdown["prize_per_4_winner"],
            "verification_status": "pending",
            "payment_status": "pending",
        })

    for user_id in winners["3_match"]:
        winner_records.append({
            "draw_id": draw_id,
            "user_id": user_id,
            "match_count": 3,
            "prize_amount": prize_breakdown["prize_per_3_winner"],
            "verification_status": "pending",
            "payment_status": "pending",
        })

    if winner_records:
        db.table("winners").insert(winner_records).execute()

    # Update draw record
    db.table("draws").update({
        "status": "published",
        "drawn_numbers": drawn_numbers,
        "five_match_pool": prize_breakdown["five_match_pool"],
        "four_match_pool": prize_breakdown["four_match_pool"],
        "three_match_pool": prize_breakdown["three_match_pool"],
        "jackpot_rollover": prize_breakdown["jackpot_rollover_to_next"],
        "published_at": now,
    }).eq("id", draw_id).execute()

    # Send notifications to winners
    for wr in winner_records:
        profile = db.table("profiles").select("email, full_name").eq("id", wr["user_id"]).single().execute()
        if profile.data:
            try:
                email_service.send_winner_notification(
                    user_email=profile.data["email"],
                    user_name=profile.data.get("full_name") or profile.data["email"],
                    draw_month=draw_data["month"],
                    match_count=wr["match_count"],
                    prize_amount=wr["prize_amount"],
                )
            except Exception:
                pass

    return {
        "message": "Draw published successfully",
        "drawn_numbers": drawn_numbers,
        "winners": winners,
        "prize_breakdown": prize_breakdown,
        "total_winner_records": len(winner_records),
    }


# ─── Charities ─────────────────────────────────────────────────────────────────

@router.post("/charities", response_model=CharityResponse, status_code=status.HTTP_201_CREATED)
async def create_charity(data: CharityCreate, admin: User = Depends(require_admin)):
    db = get_supabase()
    result = db.table("charities").insert(data.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create charity")
    return result.data[0]


@router.put("/charities/{charity_id}", response_model=CharityResponse)
async def update_charity(
    charity_id: str,
    data: CharityUpdate,
    admin: User = Depends(require_admin),
):
    db = get_supabase()
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("charities").update(update_data).eq("id", charity_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Charity not found")
    return result.data[0]


@router.delete("/charities/{charity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_charity(charity_id: str, admin: User = Depends(require_admin)):
    db = get_supabase()
    db.table("charities").update({"is_active": False}).eq("id", charity_id).execute()
    return None


# ─── Winners ───────────────────────────────────────────────────────────────────

@router.get("/winners")
async def list_winners(
    verification_status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
):
    db = get_supabase()
    query = db.table("winners").select("*, profiles(email, full_name), draws(month)")

    if verification_status:
        query = query.eq("verification_status", verification_status)
    if payment_status:
        query = query.eq("payment_status", payment_status)

    result = query.range(skip, skip + limit - 1).order("created_at", desc=True).execute()
    winners = []
    for w in (result.data or []):
        user_info = w.get("profiles") or {}
        draw_info = w.get("draws") or {}
        winners.append({
            **{k: v for k, v in w.items() if k not in ("profiles", "draws")},
            "user_email": user_info.get("email"),
            "user_name": user_info.get("full_name"),
            "draw_month": draw_info.get("month"),
        })
    return winners


@router.put("/winners/{winner_id}/verify")
async def verify_winner(
    winner_id: str,
    data: WinnerVerificationUpdate,
    admin: User = Depends(require_admin),
):
    db = get_supabase()

    winner = db.table("winners").select("*, profiles(email, full_name)").eq("id", winner_id).single().execute()
    if not winner.data:
        raise HTTPException(status_code=404, detail="Winner not found")

    if data.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")

    update_data = {"verification_status": data.status}
    if data.admin_notes:
        update_data["admin_notes"] = data.admin_notes

    db.table("winners").update(update_data).eq("id", winner_id).execute()

    # Notify user
    user_info = winner.data.get("profiles") or {}
    if data.status == "approved" and user_info.get("email"):
        try:
            email_service.send_verification_approved(
                user_email=user_info["email"],
                user_name=user_info.get("full_name") or user_info["email"],
                prize_amount=float(winner.data.get("prize_amount") or 0),
            )
        except Exception:
            pass

    return {"message": f"Winner {data.status}", "winner_id": winner_id}


@router.put("/winners/{winner_id}/payout")
async def mark_payout(winner_id: str, admin: User = Depends(require_admin)):
    db = get_supabase()

    winner = db.table("winners").select("*").eq("id", winner_id).single().execute()
    if not winner.data:
        raise HTTPException(status_code=404, detail="Winner not found")

    if winner.data.get("verification_status") != "approved":
        raise HTTPException(status_code=400, detail="Winner must be verified before payout")

    db.table("winners").update({"payment_status": "paid"}).eq("id", winner_id).execute()
    return {"message": "Winner marked as paid", "winner_id": winner_id}


# ─── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports")
async def get_reports(admin: User = Depends(require_admin)):
    db = get_supabase()

    # Total users
    users = db.table("profiles").select("id", count="exact").execute()
    total_users = users.count or 0

    # Active subscribers
    active_subs = db.table("subscriptions").select("id, prize_pool_contribution, charity_contribution", count="exact").eq("status", "active").execute()
    active_subscribers = active_subs.count or 0
    total_prize_pool = sum(float(s.get("prize_pool_contribution") or 0) for s in (active_subs.data or []))

    # Charity contributions
    all_subs = db.table("subscriptions").select("charity_contribution").eq("status", "active").execute()
    total_charity = sum(float(s.get("charity_contribution") or 0) for s in (all_subs.data or []))

    # Draws
    draws = db.table("draws").select("id, status", count="exact").execute()
    published_draws = len([d for d in (draws.data or []) if d.get("status") == "published"])

    # Winners
    winners = db.table("winners").select("prize_amount, payment_status", count="exact").execute()
    total_paid = sum(float(w.get("prize_amount") or 0) for w in (winners.data or []) if w.get("payment_status") == "paid")

    # Donations
    donations = db.table("donations").select("amount").eq("status", "completed").execute()
    total_donations = sum(float(d.get("amount") or 0) for d in (donations.data or []))

    return {
        "total_users": total_users,
        "active_subscribers": active_subscribers,
        "total_prize_pool": round(total_prize_pool, 2),
        "total_charity_contributions": round(total_charity, 2),
        "total_independent_donations": round(total_donations, 2),
        "draws_count": draws.count or 0,
        "published_draws": published_draws,
        "total_prizes_paid": round(total_paid, 2),
        "total_winners": winners.count or 0,
    }
