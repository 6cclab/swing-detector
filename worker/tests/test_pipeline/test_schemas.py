from datetime import datetime, timezone

from app.schemas.analysis import (
    AngleFeedback,
    Landmark,
    PhaseAngles,
    PoseFrame,
    SwingAnalysisResult,
    SwingPhaseResult,
)


def test_landmark_creation():
    lm = Landmark(x=0.5, y=0.3, z=0.1, visibility=0.95)
    assert lm.x == 0.5
    assert lm.visibility == 0.95


def test_phase_angles_defaults():
    angles = PhaseAngles()
    assert angles.hip_rotation_deg is None
    assert angles.spine_angle_deg is None


def test_swing_analysis_result_serialization():
    result = SwingAnalysisResult(
        swing_id="test-123",
        user_id="user-1",
        recorded_at=datetime.now(timezone.utc),
        duration_ms=2500.0,
        frame_count=75,
        overall_score=72.5,
        phases_detected=[],
        coaching_summary=["Tip 1"],
        pose_frames=[],
    )
    data = result.model_dump(mode="json")
    assert data["swing_id"] == "test-123"
    assert data["overall_score"] == 72.5
    assert isinstance(data["coaching_summary"], list)


def test_angle_feedback_model():
    fb = AngleFeedback(
        angle_name="hip_rotation_deg",
        measured=30.0,
        pro_min=35.0,
        pro_max=50.0,
        delta=-5.0,
        severity="minor",
        coaching_tip="Rotate more",
    )
    assert fb.severity == "minor"
    assert fb.delta == -5.0
