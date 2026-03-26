import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from app.schemas.winner import WinnerResponse, ProofUploadResponse
from app.services.auth_service import get_current_active_user
from app.database import get_supabase
from app.models.user import User

router = APIRouter(prefix="/winners", tags=["winners"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.get("/me", response_model=List[WinnerResponse])
async def my_winnings(current_user: User = Depends(get_current_active_user)):
    """Get current user's winning history."""
    db = get_supabase()

    result = (
        db.table("winners")
        .select("*, draws(month)")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
        .execute()
    )

    winners = []
    for w in (result.data or []):
        draw_month = w.get("draws", {}).get("month") if w.get("draws") else None
        winners.append(
            WinnerResponse(
                id=w["id"],
                draw_id=w["draw_id"],
                user_id=w["user_id"],
                match_count=w["match_count"],
                prize_amount=w.get("prize_amount"),
                verification_status=w.get("verification_status", "pending"),
                payment_status=w.get("payment_status", "pending"),
                proof_url=w.get("proof_url"),
                admin_notes=w.get("admin_notes"),
                created_at=w.get("created_at"),
                draw_month=draw_month,
            )
        )
    return winners


@router.get("/{winner_id}", response_model=WinnerResponse)
async def get_winner(
    winner_id: str,
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    result = (
        db.table("winners")
        .select("*, draws(month)")
        .eq("id", winner_id)
        .eq("user_id", current_user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Winner record not found")

    w = result.data
    draw_month = w.get("draws", {}).get("month") if w.get("draws") else None
    return WinnerResponse(
        id=w["id"],
        draw_id=w["draw_id"],
        user_id=w["user_id"],
        match_count=w["match_count"],
        prize_amount=w.get("prize_amount"),
        verification_status=w.get("verification_status", "pending"),
        payment_status=w.get("payment_status", "pending"),
        proof_url=w.get("proof_url"),
        admin_notes=w.get("admin_notes"),
        created_at=w.get("created_at"),
        draw_month=draw_month,
    )


@router.post("/{winner_id}/upload-proof", response_model=ProofUploadResponse)
async def upload_proof(
    winner_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    db = get_supabase()

    # Verify ownership
    winner = (
        db.table("winners")
        .select("*")
        .eq("id", winner_id)
        .eq("user_id", current_user.id)
        .single()
        .execute()
    )
    if not winner.data:
        raise HTTPException(status_code=404, detail="Winner record not found")

    if winner.data.get("verification_status") == "approved":
        raise HTTPException(status_code=400, detail="Already verified")

    # Validate file
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, WebP, GIF)")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    # Save file locally (in production, upload to S3/Supabase Storage)
    upload_dir = "/tmp/proofs"
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{winner_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # In production, upload to Supabase Storage or S3 and get public URL
    proof_url = f"/proofs/{filename}"

    db.table("winners").update({"proof_url": proof_url}).eq("id", winner_id).execute()

    return ProofUploadResponse(
        proof_url=proof_url,
        message="Proof uploaded successfully. Awaiting admin verification.",
    )
