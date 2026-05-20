"""
Dataset classes for swing analysis models.

Annotation format (JSON):
{
    "video_path": "path/to/video.mp4",
    "handedness": "right",
    "pose_sequence": [                    # list of frames
        {
            "frame_index": 0,
            "landmarks": [[x,y,z,vis], ...],  # 33 landmarks x 4 values
        },
        ...
    ],
    "phase_labels": [0, 0, 1, 1, ...],   # per-frame phase label (0-5)
    "quality_score": 78.5,                # 0-100 overall quality
    "faults": ["early_extension", "casting"],  # list of fault labels
    "skill_level": "amateur"              # or "pro"
}
"""

import json
import os
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

# Phase label mapping
PHASE_LABELS = {
    "address": 0,
    "backswing": 1,
    "top_of_backswing": 2,
    "downswing": 3,
    "impact": 4,
    "follow_through": 5,
}

PHASE_NAMES = {v: k for k, v in PHASE_LABELS.items()}

# Fault label mapping
FAULT_LABELS = {
    "early_extension": 0,
    "over_the_top": 1,
    "casting": 2,
    "sway": 3,
    "slide": 4,
    "chicken_wing": 5,
    "loss_of_posture": 6,
    "flat_shoulder_plane": 7,
    "reverse_spine": 8,
    "hanging_back": 9,
}

FAULT_NAMES = {v: k for k, v in FAULT_LABELS.items()}
NUM_FAULTS = len(FAULT_LABELS)

# MediaPipe provides 33 landmarks, each with x, y, z, visibility
NUM_LANDMARKS = 33
LANDMARK_DIM = 4  # x, y, z, visibility
FEATURE_DIM = NUM_LANDMARKS * LANDMARK_DIM  # 132


def landmarks_to_tensor(landmarks: list[list[float]]) -> torch.Tensor:
    """Convert list of [x,y,z,vis] landmarks to flat tensor of shape (132,)."""
    arr = np.array(landmarks, dtype=np.float32).flatten()
    return torch.from_numpy(arr)


def sequence_to_tensor(pose_sequence: list[dict]) -> torch.Tensor:
    """Convert a pose sequence to tensor of shape (T, 132)."""
    frames = []
    for frame in pose_sequence:
        lm = frame["landmarks"]
        frames.append(landmarks_to_tensor(lm))
    return torch.stack(frames)


def pad_sequence(tensor: torch.Tensor, max_len: int) -> tuple[torch.Tensor, int]:
    """Pad or truncate sequence to max_len. Returns (padded, original_len)."""
    t = tensor.shape[0]
    if t >= max_len:
        return tensor[:max_len], max_len
    pad = torch.zeros(max_len - t, tensor.shape[1])
    return torch.cat([tensor, pad], dim=0), t


def normalize_sequence(tensor: torch.Tensor) -> torch.Tensor:
    """Normalize each feature to zero mean, unit variance across time."""
    mean = tensor.mean(dim=0, keepdim=True)
    std = tensor.std(dim=0, keepdim=True).clamp(min=1e-6)
    return (tensor - mean) / std


class SwingDataset(Dataset):
    """Base dataset that loads annotated swing data from a directory of JSON files."""

    def __init__(
        self,
        data_dir: str,
        max_seq_len: int = 300,
        normalize: bool = True,
    ):
        self.data_dir = Path(data_dir)
        self.max_seq_len = max_seq_len
        self.normalize = normalize
        self.samples: list[dict] = []

        for f in sorted(self.data_dir.glob("*.json")):
            with open(f) as fp:
                sample = json.load(fp)
                # Skip samples with empty pose sequences
                if not sample.get("pose_sequence"):
                    continue
                sample["_file"] = str(f)
                self.samples.append(sample)

    def __len__(self) -> int:
        return len(self.samples)

    def _get_sequence(self, idx: int) -> tuple[torch.Tensor, int]:
        """Get normalized, padded pose sequence and original length."""
        sample = self.samples[idx]
        seq = sequence_to_tensor(sample["pose_sequence"])
        if self.normalize:
            seq = normalize_sequence(seq)
        seq, length = pad_sequence(seq, self.max_seq_len)
        return seq, length


class PhaseDataset(SwingDataset):
    """Dataset for per-frame phase classification."""

    def __getitem__(self, idx: int):
        seq, length = self._get_sequence(idx)
        sample = self.samples[idx]

        labels = sample["phase_labels"]
        # Pad labels to max_seq_len
        padded_labels = labels[:self.max_seq_len]
        padded_labels += [-1] * (self.max_seq_len - len(padded_labels))
        labels_tensor = torch.tensor(padded_labels, dtype=torch.long)

        return seq, labels_tensor, length


class QualityDataset(SwingDataset):
    """Dataset for swing quality scoring (0-100)."""

    def __getitem__(self, idx: int):
        seq, length = self._get_sequence(idx)
        sample = self.samples[idx]
        score = torch.tensor(sample["quality_score"] / 100.0, dtype=torch.float32)
        return seq, score, length


class FaultDataset(SwingDataset):
    """Dataset for multi-label fault detection."""

    def __getitem__(self, idx: int):
        seq, length = self._get_sequence(idx)
        sample = self.samples[idx]

        labels = torch.zeros(NUM_FAULTS, dtype=torch.float32)
        for fault in sample.get("faults", []):
            if fault in FAULT_LABELS:
                labels[FAULT_LABELS[fault]] = 1.0

        return seq, labels, length


class EmbeddingDataset(SwingDataset):
    """Dataset for contrastive learning — returns pairs with similarity labels."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._build_index()

    def _build_index(self):
        """Index samples by skill level for pair sampling."""
        self.pro_indices = [
            i for i, s in enumerate(self.samples) if s.get("skill_level") == "pro"
        ]
        self.amateur_indices = [
            i for i, s in enumerate(self.samples) if s.get("skill_level") != "pro"
        ]

    def __getitem__(self, idx: int):
        seq_a, len_a = self._get_sequence(idx)
        sample_a = self.samples[idx]
        is_pro_a = sample_a.get("skill_level") == "pro"

        # 50% chance of positive pair (same skill level), 50% negative
        if torch.rand(1).item() > 0.5:
            # Positive pair
            pool = self.pro_indices if is_pro_a else self.amateur_indices
            if len(pool) < 2:
                pool = list(range(len(self.samples)))
            pair_idx = pool[torch.randint(len(pool), (1,)).item()]
            label = 1.0
        else:
            # Negative pair
            pool = self.amateur_indices if is_pro_a else self.pro_indices
            if not pool:
                pool = list(range(len(self.samples)))
            pair_idx = pool[torch.randint(len(pool), (1,)).item()]
            label = 0.0

        seq_b, len_b = self._get_sequence(pair_idx)
        return seq_a, seq_b, torch.tensor(label, dtype=torch.float32), len_a, len_b
