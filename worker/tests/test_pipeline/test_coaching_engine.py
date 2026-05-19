from app.pipeline.coaching_engine import generate_coaching_tip, generate_coaching_summary
from app.schemas.analysis import AngleFeedback


def _make_feedback(angle="hip_rotation_deg", delta=-15.0, severity="moderate"):
    return AngleFeedback(
        angle_name=angle,
        measured=20.0,
        pro_min=35.0,
        pro_max=50.0,
        delta=delta,
        severity=severity,
        coaching_tip="",
    )


def test_generate_coaching_tip_low():
    fb = _make_feedback(delta=-15.0)
    tip = generate_coaching_tip("hip_rotation_deg", fb, "backswing")
    assert "hip" in tip.lower()
    assert "backswing" in tip.lower()
    assert len(tip) > 20


def test_generate_coaching_tip_high():
    fb = _make_feedback(delta=15.0)
    tip = generate_coaching_tip("hip_rotation_deg", fb, "backswing")
    assert "hip" in tip.lower()


def test_generate_coaching_summary_prioritizes():
    feedbacks = [
        ("backswing", [
            _make_feedback("hip_rotation_deg", -15.0, "moderate"),
            _make_feedback("spine_angle_deg", -8.0, "minor"),
        ]),
        ("impact", [
            _make_feedback("shoulder_rotation_deg", -25.0, "major"),
        ]),
    ]
    tips = generate_coaching_summary(feedbacks, max_tips=3)
    assert len(tips) <= 3
    assert len(tips) > 0


def test_generate_coaching_summary_skips_good():
    feedbacks = [
        ("address", [
            _make_feedback("hip_rotation_deg", 0.0, "good"),
        ]),
    ]
    tips = generate_coaching_summary(feedbacks)
    assert len(tips) == 0
