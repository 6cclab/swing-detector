"""Tests for multi-swing boundary detection."""
import numpy as np

from app.pipeline.swing_splitter import (
    detect_swing_boundaries,
    _filter_close_peaks,
    _peaks_to_segments,
)
from app.schemas.analysis import Landmark, PoseFrame


def _make_pose_frames_with_velocity(velocity_profile: list[float]) -> list[PoseFrame]:
    """Create synthetic PoseFrames where the lead wrist x-position follows
    the integral of the given velocity profile."""
    frames = []
    x = 0.5
    for i, v in enumerate(velocity_profile):
        x += v * 0.01
        landmarks = [
            Landmark(x=0.5, y=0.5, z=0.0, visibility=1.0)
            for _ in range(33)
        ]
        landmarks[15] = Landmark(x=x, y=0.5, z=0.0, visibility=1.0)
        frames.append(PoseFrame(
            frame_index=i,
            timestamp_ms=i * 33.0,
            landmarks=landmarks,
        ))
    return frames


def test_single_swing():
    """Single velocity peak returns one segment covering the full clip."""
    vel = [0.0] * 30 + [0.5, 1.0, 2.0, 3.0, 2.0, 1.0, 0.5] + [0.0] * 30
    frames = _make_pose_frames_with_velocity(vel)
    segments = detect_swing_boundaries(frames)
    assert len(segments) == 1
    assert segments[0] == (0, len(frames) - 1)


def test_three_swings():
    """Three distinct velocity peaks produce three segments."""
    gap = [0.0] * 80
    swing = [0.0] * 20 + [0.5, 1.0, 2.0, 3.0, 2.0, 1.0, 0.5] + [0.0] * 20
    vel = swing + gap + swing + gap + swing
    frames = _make_pose_frames_with_velocity(vel)
    segments = detect_swing_boundaries(
        frames,
        min_segment_frames=30,
        min_separation_frames=40,
    )
    assert len(segments) == 3
    for start, end in segments:
        assert end - start + 1 >= 30


def test_two_swings_close_peaks_merged():
    """Two peaks closer than min_separation should result in one segment."""
    vel = [0.0] * 20 + [3.0] * 5 + [0.0] * 10 + [3.0] * 5 + [0.0] * 20
    frames = _make_pose_frames_with_velocity(vel)
    segments = detect_swing_boundaries(
        frames,
        min_separation_frames=50,
        min_segment_frames=10,
    )
    assert len(segments) == 1


def test_short_video_returns_full():
    """Video shorter than min_segment_frames returns single full segment."""
    vel = [1.0] * 20
    frames = _make_pose_frames_with_velocity(vel)
    segments = detect_swing_boundaries(frames, min_segment_frames=45)
    assert len(segments) == 1
    assert segments[0] == (0, 19)


def test_filter_close_peaks():
    vel = np.array([0, 0, 5, 0, 0, 4, 0, 0, 0, 0, 0, 6, 0, 0])
    peaks = [2, 5, 11]
    kept = _filter_close_peaks(peaks, vel, min_separation=5)
    assert 2 not in kept or 5 not in kept
    assert 11 in kept


def test_peaks_to_segments():
    segments = _peaks_to_segments([50, 150, 250], total_frames=300)
    assert len(segments) == 3
    assert segments[0][0] == 0
    assert segments[2][1] == 299
    assert segments[0][1] < segments[1][0]
    assert segments[1][1] < segments[2][0]


def test_no_velocity_returns_full():
    """All-zero velocity returns single segment."""
    vel = [0.0] * 100
    frames = _make_pose_frames_with_velocity(vel)
    segments = detect_swing_boundaries(frames)
    assert len(segments) == 1
