"""
Preprocessing utilities to convert raw video + analysis results into training data.

This bridges the existing pipeline (MediaPipe poses) with the ML training datasets.
"""

import json
import os
import uuid

from app.pipeline.orchestrator import analyze_swing
from app.ml.data.dataset import PHASE_LABELS


def video_to_training_sample(
    video_path: str,
    quality_score: float | None = None,
    faults: list[str] | None = None,
    skill_level: str = "amateur",
    handedness: str = "right",
    phase_labels: list[int] | None = None,
) -> dict:
    """
    Process a video through the existing pipeline and produce a training sample dict.

    If phase_labels is not provided, uses the rule-based detector to generate them
    (useful for bootstrapping training data, but manual labels are better).
    """
    result = analyze_swing(
        video_path=video_path,
        handedness=handedness,
    )

    # Build pose sequence in training format
    pose_sequence = []
    for pf in result.pose_frames:
        pose_sequence.append({
            "frame_index": pf.frame_index,
            "landmarks": [[lm.x, lm.y, lm.z, lm.visibility] for lm in pf.landmarks],
        })

    # Generate phase labels from rule-based detector if not provided
    if phase_labels is None:
        phase_labels = _generate_phase_labels(result)

    sample = {
        "video_path": video_path,
        "handedness": handedness,
        "pose_sequence": pose_sequence,
        "phase_labels": phase_labels,
        "quality_score": quality_score if quality_score is not None else result.overall_score,
        "faults": faults or [],
        "skill_level": skill_level,
    }

    return sample


def _generate_phase_labels(result) -> list[int]:
    """Generate per-frame phase labels from rule-based detection results."""
    num_frames = result.frame_count
    labels = [0] * num_frames  # default to address

    for phase_result in result.phases_detected:
        phase_idx = PHASE_LABELS.get(phase_result.phase, 0)
        for i in range(phase_result.start_frame, min(phase_result.end_frame + 1, num_frames)):
            labels[i] = phase_idx

    return labels


def save_training_sample(sample: dict, output_dir: str) -> str:
    """Save a training sample as a JSON file. Returns the file path."""
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}.json"
    path = os.path.join(output_dir, filename)
    with open(path, "w") as f:
        json.dump(sample, f)
    return path


def batch_process_videos(
    video_dir: str,
    output_dir: str,
    skill_level: str = "amateur",
    handedness: str = "right",
) -> list[str]:
    """Process all videos in a directory and save as training samples."""
    paths = []
    for filename in sorted(os.listdir(video_dir)):
        if not filename.lower().endswith((".mp4", ".mov", ".avi")):
            continue
        video_path = os.path.join(video_dir, filename)
        try:
            sample = video_to_training_sample(
                video_path=video_path,
                skill_level=skill_level,
                handedness=handedness,
            )
            path = save_training_sample(sample, output_dir)
            paths.append(path)
            print(f"Processed: {filename} -> {path}")
        except Exception as e:
            print(f"Failed: {filename} — {e}")
    return paths
