"""
Generate a 'ghost' skeleton representing ideal pro form.

Takes the user's actual landmarks and applies small, clamped corrections
to joints that fall outside pro benchmark ranges. Only adjusts the
distal (child) joint of each angle — never moves the whole skeleton.
"""

import copy
import math

import numpy as np

from app.benchmarks.pro_benchmarks import PRO_BENCHMARKS
from app.schemas.analysis import Landmark

LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28

MAX_CORRECTION_DEG = 15.0


def _to_np(lm: Landmark) -> np.ndarray:
    return np.array([lm.x, lm.y])


def _from_np(arr: np.ndarray, lm: Landmark) -> Landmark:
    return Landmark(x=float(arr[0]), y=float(arr[1]), z=lm.z, visibility=lm.visibility)


def _rotate_point(point: np.ndarray, pivot: np.ndarray, angle_rad: float) -> np.ndarray:
    cos_a, sin_a = math.cos(angle_rad), math.sin(angle_rad)
    d = point - pivot
    rotated = np.array([d[0] * cos_a - d[1] * sin_a, d[0] * sin_a + d[1] * cos_a])
    return pivot + rotated


def _three_point_angle_2d(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    ba = a - b
    bc = c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-9)
    return float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))


def _correction_for_range(measured: float, pro_min: float, pro_max: float) -> float:
    """Return the clamped correction needed to bring measured into pro range."""
    if measured < pro_min:
        return min(pro_min - measured, MAX_CORRECTION_DEG)
    if measured > pro_max:
        return -min(measured - pro_max, MAX_CORRECTION_DEG)
    return 0.0


def _adjust_joint(
    landmarks: list[Landmark],
    anchor_idx: int,
    pivot_idx: int,
    moving_idx: int,
    pro_min: float,
    pro_max: float,
) -> list[Landmark]:
    """Rotate moving_idx around pivot_idx to bring the angle closer to pro range."""
    anchor = _to_np(landmarks[anchor_idx])
    pivot = _to_np(landmarks[pivot_idx])
    moving = _to_np(landmarks[moving_idx])

    current = _three_point_angle_2d(anchor, pivot, moving)
    correction = _correction_for_range(current, pro_min, pro_max)
    if abs(correction) < 1.0:
        return landmarks

    new_pos = _rotate_point(moving, pivot, math.radians(correction))
    landmarks[moving_idx] = _from_np(new_pos, landmarks[moving_idx])
    return landmarks


def generate_ghost_pose(
    landmarks: list[Landmark],
    phase: str,
    handedness: str = "right",
) -> list[Landmark] | None:
    """Generate adjusted landmarks matching pro benchmarks for the given phase.

    Only adjusts joints that are outside the pro range, with corrections
    clamped to MAX_CORRECTION_DEG to avoid wild distortions.
    """
    benchmarks = PRO_BENCHMARKS.get(phase)
    if not benchmarks:
        return None

    ghost = copy.deepcopy(landmarks)
    lead_knee = LEFT_KNEE if handedness == "right" else RIGHT_KNEE
    lead_ankle = LEFT_ANKLE if handedness == "right" else RIGHT_ANKLE
    lead_hip = LEFT_HIP if handedness == "right" else RIGHT_HIP
    lead_elbow = LEFT_ELBOW if handedness == "right" else RIGHT_ELBOW
    lead_wrist = LEFT_WRIST if handedness == "right" else RIGHT_WRIST
    lead_shoulder = LEFT_SHOULDER if handedness == "right" else RIGHT_SHOULDER

    if "lead_knee_flex_deg" in benchmarks:
        pro_min, pro_max = benchmarks["lead_knee_flex_deg"]
        flex_min, flex_max = 180.0 - pro_max, 180.0 - pro_min
        ghost = _adjust_joint(ghost, lead_hip, lead_knee, lead_ankle, flex_min, flex_max)

    if "elbow_angle_deg" in benchmarks:
        pro_min, pro_max = benchmarks["elbow_angle_deg"]
        ghost = _adjust_joint(ghost, lead_shoulder, lead_elbow, lead_wrist, pro_min, pro_max)

    if "wrist_hinge_deg" in benchmarks:
        pro_min, pro_max = benchmarks["wrist_hinge_deg"]
        ghost = _adjust_joint(ghost, lead_elbow, lead_wrist, lead_shoulder, pro_min, pro_max)

    return ghost
