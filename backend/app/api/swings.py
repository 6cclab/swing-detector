import json
import logging
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.auth import get_current_user_id
from app.db.session import get_db
from app.models.swing import Swing
from app.pipeline.orchestrator import analyze_swing
from app.schemas.swing import SwingListResponse, SwingSummary, SwingUploadResponse
from app.storage.video_store import save_video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/swings", tags=["swings"])


def _process_swing(swing_id: str, db_url: str):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session as SA_Session
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        swing = db.query(Swing).filter(Swing.id == swing_id).first()
        if not swing:
            return

        swing.status = "processing"
        db.commit()

        result = analyze_swing(
            video_path=swing.video_path,
            user_id=swing.user_id,
            swing_id=swing.id,
            handedness=swing.handedness,
        )

        swing.status = "complete"
        swing.overall_score = result.overall_score
        swing.analysis_json = result.model_dump_json()
        db.commit()
    except Exception as e:
        logger.exception(f"Failed to process swing {swing_id}")
        swing = db.query(Swing).filter(Swing.id == swing_id).first()
        if swing:
            swing.status = "failed"
            swing.error_message = str(e)[:500]
            db.commit()
    finally:
        db.close()
        engine.dispose()


@router.post("/upload", response_model=SwingUploadResponse, status_code=202)
async def upload_swing(
    video: UploadFile,
    background_tasks: BackgroundTasks,
    handedness: str = "right",
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if video.content_type and not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    data = await video.read()
    ext = os.path.splitext(video.filename or ".mp4")[1] or ".mp4"
    video_path = save_video(data, extension=ext)

    swing = Swing(
        user_id=user_id,
        video_path=video_path,
        handedness=handedness,
        status="pending",
    )
    db.add(swing)
    db.commit()
    db.refresh(swing)

    from app.config import settings

    background_tasks.add_task(_process_swing, swing.id, settings.database_url)

    return SwingUploadResponse(swing_id=swing.id, status="processing")


@router.get("/{swing_id}")
def get_swing(
    swing_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    swing = (
        db.query(Swing)
        .filter(Swing.id == swing_id, Swing.user_id == user_id)
        .first()
    )
    if not swing:
        raise HTTPException(status_code=404, detail="Swing not found")

    if swing.status != "complete" or not swing.analysis_json:
        return {
            "swing_id": swing.id,
            "status": swing.status,
            "error_message": swing.error_message,
        }

    return json.loads(swing.analysis_json)


@router.get("")
def list_swings(
    page: int = 1,
    page_size: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(Swing).filter(Swing.user_id == user_id)
    total = query.count()

    swings = (
        query.order_by(Swing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return SwingListResponse(
        items=[SwingSummary.model_validate(s) for s in swings],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{swing_id}/frames/{phase}")
def get_swing_frame(
    swing_id: str,
    phase: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a key frame with skeleton overlay for a specific phase."""
    swing = (
        db.query(Swing)
        .filter(Swing.id == swing_id, Swing.user_id == user_id)
        .first()
    )
    if not swing or swing.status != "complete" or not swing.analysis_json:
        raise HTTPException(status_code=404, detail="Swing not found or not complete")

    analysis = json.loads(swing.analysis_json)

    # Find the key frame for the requested phase (midpoint of phase range)
    phase_data = None
    for p in analysis.get("phases_detected", []):
        if p["phase"] == phase:
            phase_data = p
            break

    if not phase_data:
        raise HTTPException(status_code=404, detail=f"Phase '{phase}' not found")

    key_frame_idx = (phase_data["start_frame"] + phase_data["end_frame"]) // 2

    from app.pipeline.frame_renderer import render_key_frames

    frames = render_key_frames(
        video_path=swing.video_path,
        pose_frames_data=analysis.get("pose_frames", []),
        phase_key_frames={phase: key_frame_idx},
    )

    jpeg_bytes = frames.get(phase)
    if not jpeg_bytes:
        raise HTTPException(status_code=404, detail="Frame not available")

    return Response(content=jpeg_bytes, media_type="image/jpeg")


@router.get("/{swing_id}/frames")
def list_swing_frames(
    swing_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List available phase frames for a swing."""
    swing = (
        db.query(Swing)
        .filter(Swing.id == swing_id, Swing.user_id == user_id)
        .first()
    )
    if not swing or swing.status != "complete" or not swing.analysis_json:
        raise HTTPException(status_code=404, detail="Swing not found or not complete")

    analysis = json.loads(swing.analysis_json)
    phases = [p["phase"] for p in analysis.get("phases_detected", [])]

    from app.config import settings

    base_url = f"/api/swings/{swing_id}/frames"
    return {
        "swing_id": swing_id,
        "frames": [
            {"phase": phase, "url": f"{base_url}/{phase}"}
            for phase in phases
        ],
    }
