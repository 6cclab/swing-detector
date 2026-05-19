"""
Inference wrappers — bridge between trained models and the analysis pipeline.

Each function takes raw pose data and returns results in the format
expected by the pipeline/orchestrator.
"""

import torch
import numpy as np

from app.ml.data.dataset import (
    FAULT_NAMES,
    PHASE_NAMES,
    FEATURE_DIM,
    landmarks_to_tensor,
    normalize_sequence,
)
from app.ml.registry import ModelRegistry
from app.pipeline.phase_detector import PhaseRange
from app.schemas.analysis import PoseFrame, SwingPhase


def _pose_frames_to_tensor(pose_frames: list[PoseFrame]) -> tuple[torch.Tensor, int]:
    """Convert PoseFrames to model input tensor."""
    frames = []
    for pf in pose_frames:
        lm_data = [[lm.x, lm.y, lm.z, lm.visibility] for lm in pf.landmarks]
        frames.append(landmarks_to_tensor(lm_data))
    seq = torch.stack(frames)
    seq = normalize_sequence(seq)
    length = seq.shape[0]
    return seq.unsqueeze(0), length  # add batch dim


def ml_detect_phases(
    pose_frames: list[PoseFrame],
) -> list[PhaseRange] | None:
    """
    Use trained phase classifier to detect swing phases.
    Returns None if no trained model is available (falls back to rule-based).
    """
    registry = ModelRegistry.get()
    model = registry.phase_classifier()
    if model is None:
        return None

    seq, length = _pose_frames_to_tensor(pose_frames)
    lengths = torch.tensor([length])

    with torch.no_grad():
        logits = model(seq, lengths)
        preds = logits.argmax(dim=-1).squeeze(0)  # (T,)

    # Convert per-frame predictions to PhaseRange objects
    preds = preds[:length].numpy()
    phases: list[PhaseRange] = []
    current_phase = preds[0]
    start = 0

    for i in range(1, len(preds)):
        if preds[i] != current_phase:
            phase_name = PHASE_NAMES.get(int(current_phase), "address")
            phases.append(PhaseRange(
                phase=phase_name,
                start_frame=start,
                end_frame=i - 1,
            ))
            current_phase = preds[i]
            start = i

    # Add final phase
    phase_name = PHASE_NAMES.get(int(current_phase), "follow_through")
    phases.append(PhaseRange(
        phase=phase_name,
        start_frame=start,
        end_frame=len(preds) - 1,
    ))

    return phases


def ml_score_quality(
    pose_frames: list[PoseFrame],
) -> float | None:
    """
    Use trained quality scorer to rate the swing.
    Returns None if no trained model is available.
    """
    registry = ModelRegistry.get()
    model = registry.quality_scorer()
    if model is None:
        return None

    seq, length = _pose_frames_to_tensor(pose_frames)
    lengths = torch.tensor([length])

    with torch.no_grad():
        score = model(seq, lengths)

    return float(score.item() * 100.0)


def ml_detect_faults(
    pose_frames: list[PoseFrame],
    threshold: float = 0.5,
) -> list[dict] | None:
    """
    Use trained fault detector to identify swing faults.
    Returns None if no trained model is available.

    Returns list of {"fault": str, "confidence": float} for detected faults.
    """
    registry = ModelRegistry.get()
    model = registry.fault_detector()
    if model is None:
        return None

    seq, length = _pose_frames_to_tensor(pose_frames)
    lengths = torch.tensor([length])

    with torch.no_grad():
        probs = model(seq, lengths).squeeze(0)  # (num_faults,)

    faults = []
    for i, prob in enumerate(probs):
        if prob.item() >= threshold:
            faults.append({
                "fault": FAULT_NAMES[i],
                "confidence": round(prob.item(), 3),
            })

    return sorted(faults, key=lambda f: f["confidence"], reverse=True)


def ml_compute_embedding(
    pose_frames: list[PoseFrame],
) -> list[float] | None:
    """
    Use trained embedder to compute a swing embedding vector.
    Returns None if no trained model is available.
    """
    registry = ModelRegistry.get()
    model = registry.swing_embedder()
    if model is None:
        return None

    seq, length = _pose_frames_to_tensor(pose_frames)
    lengths = torch.tensor([length])

    with torch.no_grad():
        embedding = model(seq, lengths).squeeze(0)

    return embedding.tolist()
