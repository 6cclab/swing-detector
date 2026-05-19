"""
Swing Phase Classifier — Bi-LSTM that classifies each frame into one of 6 swing phases.

Input:  (batch, seq_len, 132) — pose landmark features per frame
Output: (batch, seq_len, 6)   — per-frame phase logits

Replaces the rule-based phase_detector.py when trained.
"""

import torch
import torch.nn as nn

from app.ml.data.dataset import FEATURE_DIM

NUM_PHASES = 6


class SwingPhaseClassifier(nn.Module):
    def __init__(
        self,
        input_dim: int = FEATURE_DIM,
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        num_phases: int = NUM_PHASES,
    ):
        super().__init__()
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        self.lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0,
        )

        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, num_phases),
        )

    def forward(
        self,
        x: torch.Tensor,
        lengths: torch.Tensor | None = None,
    ) -> torch.Tensor:
        """
        Args:
            x: (batch, seq_len, input_dim)
            lengths: (batch,) original sequence lengths for masking

        Returns:
            logits: (batch, seq_len, num_phases)
        """
        x = self.input_proj(x)

        if lengths is not None:
            x = nn.utils.rnn.pack_padded_sequence(
                x, lengths.cpu().clamp(min=1), batch_first=True, enforce_sorted=False
            )

        lstm_out, _ = self.lstm(x)

        if lengths is not None:
            lstm_out, _ = nn.utils.rnn.pad_packed_sequence(
                lstm_out, batch_first=True
            )

        logits = self.classifier(lstm_out)
        return logits


def phase_loss(
    logits: torch.Tensor,
    targets: torch.Tensor,
    lengths: torch.Tensor | None = None,
) -> torch.Tensor:
    """Cross-entropy loss ignoring padded frames (label == -1)."""
    # logits: (B, T, C), targets: (B, T)
    b, t, c = logits.shape
    logits_flat = logits.reshape(-1, c)
    targets_flat = targets.reshape(-1)

    return nn.functional.cross_entropy(
        logits_flat, targets_flat, ignore_index=-1
    )
