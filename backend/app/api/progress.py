import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user_id
from app.db.session import get_db
from app.models.swing import Swing
from app.schemas.swing import AngleTrend, ProgressPoint, ProgressResponse

router = APIRouter(prefix="/api/users/me", tags=["progress"])


@router.get("/progress", response_model=ProgressResponse)
def get_progress(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    swings = (
        db.query(Swing)
        .filter(
            Swing.user_id == user_id,
            Swing.status == "complete",
            Swing.overall_score.isnot(None),
        )
        .order_by(Swing.created_at.asc())
        .all()
    )

    scores = [
        ProgressPoint(date=s.created_at, score=s.overall_score)
        for s in swings
        if s.overall_score is not None
    ]

    # Extract angle trends from analysis JSON
    angle_data: dict[str, dict[str, list]] = {}
    tracked_angles = [
        "hip_rotation_deg",
        "shoulder_rotation_deg",
        "spine_angle_deg",
        "weight_transfer_ratio",
    ]

    for s in swings:
        if not s.analysis_json:
            continue
        try:
            analysis = json.loads(s.analysis_json)
        except (json.JSONDecodeError, TypeError):
            continue

        for phase_result in analysis.get("phases_detected", []):
            if phase_result.get("phase") != "impact":
                continue
            angles = phase_result.get("angles", {})
            for angle_name in tracked_angles:
                val = angles.get(angle_name)
                if val is None:
                    continue
                if angle_name not in angle_data:
                    angle_data[angle_name] = {"values": [], "dates": []}
                angle_data[angle_name]["values"].append(val)
                angle_data[angle_name]["dates"].append(s.created_at)

    angle_trends = [
        AngleTrend(angle_name=name, values=data["values"], dates=data["dates"])
        for name, data in angle_data.items()
    ]

    return ProgressResponse(scores=scores, angle_trends=angle_trends)
