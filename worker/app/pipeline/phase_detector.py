from dataclasses import dataclass

import numpy as np

from app.schemas.analysis import PoseFrame, SwingPhase

LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12


@dataclass
class PhaseRange:
    phase: SwingPhase
    start_frame: int
    end_frame: int


def _wrist_positions(pose_frames: list[PoseFrame], handedness: str) -> np.ndarray:
    wrist_idx = LEFT_WRIST if handedness == "right" else RIGHT_WRIST
    return np.array([
        [pf.landmarks[wrist_idx].x, pf.landmarks[wrist_idx].y]
        for pf in pose_frames
    ])


def _wrist_velocity(positions: np.ndarray) -> np.ndarray:
    if len(positions) < 2:
        return np.zeros(len(positions))
    velocity = np.linalg.norm(np.diff(positions, axis=0), axis=1)
    return np.concatenate([[0.0], velocity])


def _shoulder_rotation_series(
    pose_frames: list[PoseFrame],
) -> np.ndarray:
    rotations = []
    for pf in pose_frames:
        dx = pf.landmarks[RIGHT_SHOULDER].x - pf.landmarks[LEFT_SHOULDER].x
        dz = pf.landmarks[RIGHT_SHOULDER].z - pf.landmarks[LEFT_SHOULDER].z
        rotations.append(np.degrees(np.arctan2(dz, dx)))
    return np.array(rotations)


def _hip_rotation_series(pose_frames: list[PoseFrame]) -> np.ndarray:
    rotations = []
    for pf in pose_frames:
        dx = pf.landmarks[RIGHT_HIP].x - pf.landmarks[LEFT_HIP].x
        dz = pf.landmarks[RIGHT_HIP].z - pf.landmarks[LEFT_HIP].z
        rotations.append(np.degrees(np.arctan2(dz, dx)))
    return np.array(rotations)


def _smooth(arr: np.ndarray, window: int = 5) -> np.ndarray:
    if len(arr) < window:
        return arr
    kernel = np.ones(window) / window
    return np.convolve(arr, kernel, mode="same")


def detect_phases(
    pose_frames: list[PoseFrame],
    handedness: str = "right",
) -> list[PhaseRange]:
    if len(pose_frames) < 10:
        raise ValueError("Too few frames for swing detection (need at least 10)")

    n = len(pose_frames)
    wrist_pos = _wrist_positions(pose_frames, handedness)
    wrist_vel = _smooth(_wrist_velocity(wrist_pos))
    shoulder_rot = _smooth(_shoulder_rotation_series(pose_frames))
    hip_rot = _smooth(_hip_rotation_series(pose_frames))

    # Normalize velocity for thresholding
    max_vel = np.max(wrist_vel) if np.max(wrist_vel) > 0 else 1.0
    norm_vel = wrist_vel / max_vel

    # 1. Find address: first frames where wrist velocity is very low
    address_end = 0
    for i in range(min(n // 3, n)):
        if norm_vel[i] > 0.15:
            address_end = max(i - 1, 0)
            break
    else:
        address_end = n // 6

    # 2. Find top of backswing: frame with highest lead wrist y-position
    #    (in image coords, lower y = higher position)
    #    Search must end before the velocity peak (impact area) so follow-through
    #    frames don't get picked — the wrist goes higher in follow-through.
    velocity_peak = int(np.argmax(wrist_vel))
    search_end = max(velocity_peak, address_end + 2)
    backswing_region = wrist_pos[address_end:search_end, 1]
    if len(backswing_region) > 0:
        top_idx = address_end + int(np.argmin(backswing_region))
    else:
        top_idx = n // 3

    # 3. Find impact: max deceleration in tight window after velocity peak
    #    Ball strike causes sharp hand deceleration 1-3 frames after peak speed
    accel = np.diff(wrist_vel)
    decel_start = velocity_peak
    decel_end = min(len(accel), velocity_peak + 5)
    if decel_start < decel_end:
        impact_idx = decel_start + int(np.argmin(accel[decel_start:decel_end])) + 1
    else:
        impact_idx = velocity_peak
    impact_idx = max(impact_idx, top_idx + 2)

    # 4. Downswing is between top and impact
    # 5. Backswing is between address_end and top
    # 6. Follow-through is after impact

    # Build phase boundaries with minimum frame counts
    backswing_start = address_end + 1
    downswing_start = top_idx + 1
    follow_through_start = impact_idx + 1

    phases: list[PhaseRange] = []

    if address_end >= 0:
        phases.append(PhaseRange("address", 0, address_end))

    if backswing_start < top_idx:
        phases.append(PhaseRange("backswing", backswing_start, top_idx - 1))

    phases.append(PhaseRange("top_of_backswing", max(top_idx - 1, backswing_start), top_idx + 1))

    if downswing_start < impact_idx:
        phases.append(PhaseRange("downswing", downswing_start, impact_idx - 1))

    phases.append(PhaseRange("impact", max(impact_idx - 1, downswing_start), min(impact_idx + 1, n - 1)))

    if follow_through_start < n:
        phases.append(PhaseRange("follow_through", follow_through_start, n - 1))

    return phases
