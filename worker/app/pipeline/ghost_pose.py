"""
Generate a 'ghost' skeleton representing ideal pro form.

Takes the user's actual landmarks and adjusts joint positions so that
key angles match pro benchmark midpoints. The result can be rendered
as a semi-transparent overlay showing where joints *should* be.
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


def _adjust_three_point(
    landmarks: list[Landmark],
    pivot_idx: int,
    moving_idx: int,
    anchor_idx: int,
    target_angle: float,
) -> list[Landmark]:
    """Rotate the moving landmark around the pivot to achieve target_angle."""
    anchor = _to_np(landmarks[anchor_idx])
    pivot = _to_np(landmarks[pivot_idx])
    moving = _to_np(landmarks[moving_idx])

    current = _three_point_angle_2d(anchor, pivot, moving)
    delta = math.radians(target_angle - current)

    new_pos = _rotate_point(moving, pivot, delta)
    landmarks[moving_idx] = _from_np(new_pos, landmarks[moving_idx])
    return landmarks


def _adjust_spine(landmarks: list[Landmark], target_angle: float) -> list[Landmark]:
    """Adjust shoulder positions to achieve target spine angle."""
    hip_mid = (_to_np(landmarks[LEFT_HIP]) + _to_np(landmarks[RIGHT_HIP])) / 2
    shoulder_mid = (_to_np(landmarks[LEFT_SHOULDER]) + _to_np(landmarks[RIGHT_SHOULDER])) / 2

    spine_vec = shoulder_mid - hip_mid
    current_angle = math.degrees(math.atan2(spine_vec[0], -spine_vec[1]))
    delta = math.radians(target_angle - abs(current_angle))
    sign = 1 if current_angle >= 0 else -1

    for idx in [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW, LEFT_WRIST, RIGHT_WRIST]:
        pt = _to_np(landmarks[idx])
        new_pt = _rotate_point(pt, hip_mid, sign * delta * 0.3)
        landmarks[idx] = _from_np(new_pt, landmarks[idx])

    return landmarks


def generate_ghost_pose(
    landmarks: list[Landmark],
    phase: str,
    handedness: str = "right",
) -> list[Landmark] | None:
    """Generate adjusted landmarks matching pro benchmarks for the given phase."""
    benchmarks = PRO_BENCHMARKS.get(phase)
    if not benchmarks:
        return None

    ghost = copy.deepcopy(landmarks)
    lead_side = "left" if handedness == "right" else "right"

    if "spine_angle_deg" in benchmarks:
        target = sum(benchmarks["spine_angle_deg"]) / 2
        ghost = _adjust_spine(ghost, target)

    if "lead_knee_flex_deg" in benchmarks:
        target_flex = sum(benchmarks["lead_knee_flex_deg"]) / 2
        target_angle = 180.0 - target_flex
        if lead_side == "left":
            ghost = _adjust_three_point(ghost, LEFT_KNEE, LEFT_ANKLE, LEFT_HIP, target_angle)
        else:
            ghost = _adjust_three_point(ghost, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_HIP, target_angle)

    if "elbow_angle_deg" in benchmarks:
        target = sum(benchmarks["elbow_angle_deg"]) / 2
        if lead_side == "left":
            ghost = _adjust_three_point(ghost, LEFT_ELBOW, LEFT_WRIST, LEFT_SHOULDER, target)
        else:
            ghost = _adjust_three_point(ghost, RIGHT_ELBOW, RIGHT_WRIST, RIGHT_SHOULDER, target)

    return ghost
