import numpy as np

from app.pipeline.phase_detector import _wrist_positions, _wrist_velocity, _smooth
from app.schemas.analysis import PoseFrame


def detect_swing_boundaries(
    pose_frames: list[PoseFrame],
    handedness: str = "right",
    min_segment_frames: int = 45,
    min_separation_frames: int = 90,
    peak_threshold: float = 0.40,
) -> list[tuple[int, int]]:
    """Detect individual swing segments in a multi-swing video.

    Returns list of (start_idx, end_idx) pairs as indices into pose_frames.
    For single-swing videos, returns one segment covering the whole clip.
    """
    n = len(pose_frames)
    if n < min_segment_frames:
        return [(0, n - 1)]

    wrist_pos = _wrist_positions(pose_frames, handedness)
    wrist_vel = _smooth(_wrist_velocity(wrist_pos), window=21)

    max_vel = np.max(wrist_vel)
    if max_vel <= 0:
        return [(0, n - 1)]

    # Two-pass peak detection: first find candidates with a low threshold,
    # then use the median peak velocity as the reference for the real threshold.
    # This prevents a single outlier (phone pickup, walking) from suppressing
    # all real swing peaks.
    low_threshold = 0.15 * max_vel
    candidate_peaks = _find_peaks_above(wrist_vel, low_threshold)
    candidate_peaks = _filter_close_peaks(candidate_peaks, wrist_vel, min_separation_frames)

    if len(candidate_peaks) <= 1:
        return [(0, n - 1)]

    median_peak_vel = np.median([wrist_vel[p] for p in candidate_peaks])
    threshold = peak_threshold * median_peak_vel

    peaks = [p for p in candidate_peaks if wrist_vel[p] >= threshold]

    if len(peaks) <= 1:
        return [(0, n - 1)]

    segments = _peaks_to_segments(peaks, n)
    segments = [(s, e) for s, e in segments if (e - s + 1) >= min_segment_frames]

    if len(segments) == 0:
        return [(0, n - 1)]

    return segments


def _find_peaks_above(velocity: np.ndarray, threshold: float) -> list[int]:
    """Find local peaks in velocity signal above a threshold."""
    above = velocity > threshold
    edges = np.diff(np.concatenate([[0], above.astype(int), [0]]))
    run_starts = np.where(edges == 1)[0]
    run_ends = np.where(edges == -1)[0]

    peaks = []
    for s, e in zip(run_starts, run_ends):
        peak_idx = s + int(np.argmax(velocity[s:e]))
        peaks.append(peak_idx)
    return peaks


def _filter_close_peaks(
    peaks: list[int],
    velocity: np.ndarray,
    min_separation: int,
) -> list[int]:
    """Remove peaks that are too close, keeping the higher one."""
    if len(peaks) <= 1:
        return peaks

    sorted_peaks = sorted(peaks, key=lambda p: velocity[p], reverse=True)
    kept = []
    for p in sorted_peaks:
        if all(abs(p - k) >= min_separation for k in kept):
            kept.append(p)

    return sorted(kept)


def _peaks_to_segments(
    peaks: list[int],
    total_frames: int,
) -> list[tuple[int, int]]:
    """Convert sorted peak positions to non-overlapping segment boundaries."""
    segments = []
    for i, peak in enumerate(peaks):
        if i == 0:
            start = 0
        else:
            start = (peaks[i - 1] + peak) // 2

        if i == len(peaks) - 1:
            end = total_frames - 1
        else:
            end = (peak + peaks[i + 1]) // 2 - 1

        segments.append((start, end))

    return segments
