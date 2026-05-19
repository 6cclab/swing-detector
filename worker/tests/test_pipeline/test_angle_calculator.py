from app.schemas.analysis import Landmark
from app.pipeline.angle_calculator import (
    compute_all_angles,
    compute_spine_angle,
    compute_hip_rotation,
    compute_shoulder_rotation,
    _three_point_angle,
)


def _make_landmark(x=0.0, y=0.0, z=0.0, vis=1.0):
    return Landmark(x=x, y=y, z=z, visibility=vis)


def _make_landmarks(count=33):
    """Create 33 default landmarks at origin."""
    return [_make_landmark() for _ in range(count)]


def test_three_point_angle_straight():
    a = _make_landmark(0, 0, 0)
    b = _make_landmark(1, 0, 0)
    c = _make_landmark(2, 0, 0)
    angle = _three_point_angle(a, b, c)
    assert abs(angle - 180.0) < 1.0


def test_three_point_angle_right():
    a = _make_landmark(0, 1, 0)
    b = _make_landmark(0, 0, 0)
    c = _make_landmark(1, 0, 0)
    angle = _three_point_angle(a, b, c)
    assert abs(angle - 90.0) < 1.0


def test_compute_all_angles_returns_phase_angles():
    lms = _make_landmarks()
    # Place shoulders and hips at reasonable positions
    lms[11] = _make_landmark(0.4, 0.3, 0)  # left shoulder
    lms[12] = _make_landmark(0.6, 0.3, 0)  # right shoulder
    lms[23] = _make_landmark(0.4, 0.6, 0)  # left hip
    lms[24] = _make_landmark(0.6, 0.6, 0)  # right hip
    lms[25] = _make_landmark(0.4, 0.8, 0)  # left knee
    lms[26] = _make_landmark(0.6, 0.8, 0)  # right knee
    lms[27] = _make_landmark(0.4, 1.0, 0)  # left ankle
    lms[28] = _make_landmark(0.6, 1.0, 0)  # right ankle
    lms[13] = _make_landmark(0.3, 0.4, 0)  # left elbow
    lms[14] = _make_landmark(0.7, 0.4, 0)  # right elbow
    lms[15] = _make_landmark(0.2, 0.5, 0)  # left wrist
    lms[16] = _make_landmark(0.8, 0.5, 0)  # right wrist
    lms[19] = _make_landmark(0.15, 0.55, 0)  # left index
    lms[20] = _make_landmark(0.85, 0.55, 0)  # right index

    angles = compute_all_angles(lms, handedness="right")
    assert angles.hip_rotation_deg is not None
    assert angles.shoulder_rotation_deg is not None
    assert angles.spine_angle_deg is not None
    assert angles.lead_knee_flex_deg is not None
    assert angles.trail_knee_flex_deg is not None
    assert angles.wrist_hinge_deg is not None
    assert angles.elbow_angle_deg is not None
    assert angles.weight_transfer_ratio is not None


def test_weight_transfer_centered():
    lms = _make_landmarks()
    lms[23] = _make_landmark(0.4, 0.6, 0)
    lms[24] = _make_landmark(0.6, 0.6, 0)
    from app.pipeline.angle_calculator import compute_weight_transfer
    wt = compute_weight_transfer(lms)
    assert abs(wt - 0.5) < 0.1
