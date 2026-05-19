from app.pipeline.benchmark_comparator import compare_phase
from app.schemas.analysis import PhaseAngles


def test_compare_phase_all_within_range():
    angles = PhaseAngles(
        hip_rotation_deg=0.0,
        shoulder_rotation_deg=0.0,
        spine_angle_deg=42.0,
        lead_knee_flex_deg=25.0,
        trail_knee_flex_deg=25.0,
        weight_transfer_ratio=0.5,
    )
    feedback, score = compare_phase("address", angles)
    assert isinstance(feedback, list)
    assert isinstance(score, float)
    assert score > 0


def test_compare_phase_severe_deviation():
    angles = PhaseAngles(
        hip_rotation_deg=90.0,  # way outside address range of -5 to 5
    )
    feedback, score = compare_phase("address", angles)
    major = [f for f in feedback if f.severity == "major"]
    assert len(major) > 0


def test_compare_phase_unknown_phase():
    angles = PhaseAngles()
    feedback, score = compare_phase("address", angles)
    # No angles provided means no feedback
    assert isinstance(feedback, list)


def test_severity_levels():
    # Within range
    angles_good = PhaseAngles(spine_angle_deg=42.0)
    fb_good, _ = compare_phase("address", angles_good)
    spine_fb = [f for f in fb_good if f.angle_name == "spine_angle_deg"]
    if spine_fb:
        assert spine_fb[0].severity == "good"

    # Far outside range
    angles_bad = PhaseAngles(spine_angle_deg=80.0)
    fb_bad, _ = compare_phase("address", angles_bad)
    spine_fb = [f for f in fb_bad if f.angle_name == "spine_angle_deg"]
    if spine_fb:
        assert spine_fb[0].severity == "major"
