import math

import numpy as np

from app.schemas.analysis import Landmark, PhaseAngles, PoseFrame

# MediaPipe Pose landmark indices
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_INDEX = 19
RIGHT_INDEX = 20
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28


def _vec(a: Landmark, b: Landmark) -> np.ndarray:
    return np.array([b.x - a.x, b.y - a.y, b.z - a.z])


def _three_point_angle(a: Landmark, b: Landmark, c: Landmark) -> float:
    ba = _vec(b, a)
    bc = _vec(b, c)
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-9)
    return float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))


def _midpoint(a: Landmark, b: Landmark) -> Landmark:
    return Landmark(
        x=(a.x + b.x) / 2,
        y=(a.y + b.y) / 2,
        z=(a.z + b.z) / 2,
        visibility=min(a.visibility, b.visibility),
    )


def _rotation_angle_xz(left: Landmark, right: Landmark) -> float:
    dx = right.x - left.x
    dz = right.z - left.z
    return float(math.degrees(math.atan2(dz, dx)))


def compute_spine_angle(landmarks: list[Landmark]) -> float:
    hip_mid = _midpoint(landmarks[LEFT_HIP], landmarks[RIGHT_HIP])
    shoulder_mid = _midpoint(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER])
    spine_vec = _vec(hip_mid, shoulder_mid)
    vertical = np.array([0.0, -1.0, 0.0])  # y-axis points down in image coords
    cos_angle = np.dot(spine_vec, vertical) / (
        np.linalg.norm(spine_vec) + 1e-9
    )
    return float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))


def compute_hip_rotation(landmarks: list[Landmark]) -> float:
    return _rotation_angle_xz(landmarks[LEFT_HIP], landmarks[RIGHT_HIP])


def compute_shoulder_rotation(landmarks: list[Landmark]) -> float:
    return _rotation_angle_xz(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER])


def compute_knee_flex(
    landmarks: list[Landmark], side: str
) -> float:
    if side == "left":
        return _three_point_angle(
            landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]
        )
    return _three_point_angle(
        landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]
    )


def compute_elbow_angle(
    landmarks: list[Landmark], side: str
) -> float:
    if side == "left":
        return _three_point_angle(
            landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]
        )
    return _three_point_angle(
        landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]
    )


def compute_wrist_hinge(
    landmarks: list[Landmark], side: str
) -> float:
    if side == "left":
        return _three_point_angle(
            landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST], landmarks[LEFT_INDEX]
        )
    return _three_point_angle(
        landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST], landmarks[RIGHT_INDEX]
    )


def compute_weight_transfer(landmarks: list[Landmark]) -> float:
    left_hip_x = landmarks[LEFT_HIP].x
    right_hip_x = landmarks[RIGHT_HIP].x
    hip_width = abs(right_hip_x - left_hip_x)
    if hip_width < 1e-6:
        return 0.5
    mid_x = (left_hip_x + right_hip_x) / 2
    # For a right-handed golfer (default), lead side is the left side
    # Ratio > 0.5 means weight is shifting toward lead (left) side
    left_bias = (mid_x - min(left_hip_x, right_hip_x)) / hip_width
    return float(np.clip(left_bias, 0.0, 1.0))


def compute_all_angles(
    landmarks: list[Landmark],
    handedness: str = "right",
) -> PhaseAngles:
    lead = "left" if handedness == "right" else "right"
    trail = "right" if handedness == "right" else "left"

    return PhaseAngles(
        hip_rotation_deg=compute_hip_rotation(landmarks),
        shoulder_rotation_deg=compute_shoulder_rotation(landmarks),
        spine_angle_deg=compute_spine_angle(landmarks),
        lead_knee_flex_deg=180.0 - compute_knee_flex(landmarks, lead),
        trail_knee_flex_deg=180.0 - compute_knee_flex(landmarks, trail),
        wrist_hinge_deg=compute_wrist_hinge(landmarks, lead),
        elbow_angle_deg=compute_elbow_angle(landmarks, lead),
        weight_transfer_ratio=compute_weight_transfer(landmarks),
    )


def compute_angles_for_frames(
    pose_frames: list[PoseFrame],
    handedness: str = "right",
) -> list[PhaseAngles]:
    return [
        compute_all_angles(pf.landmarks, handedness)
        for pf in pose_frames
    ]
