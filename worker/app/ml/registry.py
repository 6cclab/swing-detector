"""
Model registry — loads trained model checkpoints and provides inference methods.

The pipeline checks for available trained models and uses them when present,
falling back to rule-based approaches when no trained model exists.
"""

import os
from pathlib import Path

import torch
import torch.nn as nn

from app.ml.models.phase_classifier import SwingPhaseClassifier
from app.ml.models.quality_scorer import SwingQualityScorer
from app.ml.models.fault_detector import SwingFaultDetector
from app.ml.models.swing_embedder import SwingEmbedder


_CHECKPOINT_DIR = os.environ.get(
    "MODEL_CHECKPOINT_DIR",
    os.path.join(os.path.dirname(__file__), "..", "..", "checkpoints"),
)


class ModelRegistry:
    """Singleton registry that loads and caches trained models."""

    _instance = None

    def __init__(self, checkpoint_dir: str = _CHECKPOINT_DIR):
        self.checkpoint_dir = Path(checkpoint_dir)
        self._models: dict[str, nn.Module] = {}
        self._device = torch.device("cpu")

    @classmethod
    def get(cls) -> "ModelRegistry":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self, name: str, model_class, **kwargs) -> nn.Module | None:
        """Load a model from checkpoint if available."""
        if name in self._models:
            return self._models[name]

        ckpt_path = self.checkpoint_dir / name / f"{name}_best.pt"
        if not ckpt_path.exists():
            return None

        model = model_class(**kwargs)
        ckpt = torch.load(ckpt_path, map_location=self._device, weights_only=True)
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        model.to(self._device)

        self._models[name] = model
        return model

    def phase_classifier(self) -> SwingPhaseClassifier | None:
        return self._load_model("phase_classifier", SwingPhaseClassifier)

    def quality_scorer(self) -> SwingQualityScorer | None:
        return self._load_model("quality_scorer", SwingQualityScorer)

    def fault_detector(self) -> SwingFaultDetector | None:
        return self._load_model("fault_detector", SwingFaultDetector)

    def swing_embedder(self) -> SwingEmbedder | None:
        return self._load_model("swing_embedder", SwingEmbedder)

    def available_models(self) -> list[str]:
        """List which models have trained checkpoints."""
        available = []
        for name in ["phase_classifier", "quality_scorer", "fault_detector", "swing_embedder"]:
            ckpt_path = self.checkpoint_dir / name / f"{name}_best.pt"
            if ckpt_path.exists():
                available.append(name)
        return available
