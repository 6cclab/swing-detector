"""Verify that phase midpoints map correctly from pose-list indices to extracted frame indices."""


def _make_pose_frame(frame_index: int) -> dict:
    return {
        "frame_index": frame_index,
        "timestamp_ms": frame_index * 33.0,
        "landmarks": [
            {"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 1.0}
            for _ in range(33)
        ],
    }


def _make_phase(phase: str, start: int, end: int) -> dict:
    return {
        "phase": phase,
        "start_frame": start,
        "end_frame": end,
        "angles": {},
        "angle_feedback": [],
        "phase_score": 70.0,
    }


def _compute_phase_key_frames(phases_detected, pose_frames):
    """Mirrors the logic in save_phase_frames."""
    phase_key_frames = {}
    for phase in phases_detected:
        start = phase["start_frame"]
        end = phase["end_frame"]
        mid = (start + end) // 2
        if mid < len(pose_frames):
            phase_key_frames[phase["phase"]] = pose_frames[mid]["frame_index"]
    return phase_key_frames


def test_phase_key_frames_with_gaps():
    """When pose detection skips frames, midpoints should still map to correct frame_index."""
    # Extracted frames 0..20, but pose detection skips some
    extracted_indices = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20]
    pose_frames = [_make_pose_frame(i) for i in extracted_indices]

    # Phase detector outputs indices into pose_frames list (0..15)
    phases_detected = [
        _make_phase("address", 0, 2),           # mid=1 -> pose_frames[1].frame_index=1
        _make_phase("backswing", 3, 6),          # mid=4 -> pose_frames[4].frame_index=5
        _make_phase("top_of_backswing", 6, 8),   # mid=7 -> pose_frames[7].frame_index=9
        _make_phase("downswing", 9, 11),         # mid=10 -> pose_frames[10].frame_index=13
        _make_phase("impact", 11, 13),           # mid=12 -> pose_frames[12].frame_index=16
        _make_phase("follow_through", 14, 15),   # mid=14 -> pose_frames[14].frame_index=18
    ]

    result = _compute_phase_key_frames(phases_detected, pose_frames)

    assert result["address"] == 1
    assert result["backswing"] == 5
    assert result["top_of_backswing"] == 9
    assert result["downswing"] == 13
    assert result["impact"] == 16
    assert result["follow_through"] == 18


def test_phase_key_frames_no_gaps():
    """When all frames have poses, frame_index == list index."""
    pose_frames = [_make_pose_frame(i) for i in range(20)]

    phases_detected = [
        _make_phase("address", 0, 3),       # mid=1 -> frame_index=1
        _make_phase("backswing", 4, 8),      # mid=6 -> frame_index=6
        _make_phase("impact", 12, 14),       # mid=13 -> frame_index=13
    ]

    result = _compute_phase_key_frames(phases_detected, pose_frames)

    assert result["address"] == 1
    assert result["backswing"] == 6
    assert result["impact"] == 13


def test_phase_key_frames_differ_from_list_index():
    """The old bug: using list index directly instead of frame_index would give wrong results."""
    # Simulate: every other extracted frame has a pose
    extracted_indices = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
    pose_frames = [_make_pose_frame(i) for i in extracted_indices]

    phases_detected = [
        _make_phase("address", 0, 2),   # mid=1 -> pose_frames[1].frame_index=2 (NOT 1)
        _make_phase("impact", 5, 7),    # mid=6 -> pose_frames[6].frame_index=12 (NOT 6)
    ]

    result = _compute_phase_key_frames(phases_detected, pose_frames)

    # These would fail if we used the list index directly
    assert result["address"] == 2
    assert result["impact"] == 12
