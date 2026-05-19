"""
Swing Quality Scorer — 1D-CNN + Attention that scores overall swing quality.

Input:  (batch, seq_len, 132) — pose landmark features per frame
Output: (batch, 1)            — quality score in [0, 1] (multiply by 100 for display)

Learns to rate swing quality from labeled examples rather than using
static benchmark comparisons.
"""

import torch
import torch.nn as nn

from app.ml.data.dataset import FEATURE_DIM


class TemporalAttention(nn.Module):
    """Attention mechanism to weight important frames in the sequence."""

    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.Tanh(),
            nn.Linear(hidden_dim // 2, 1),
        )

    def forward(
        self,
        x: torch.Tensor,
        mask: torch.Tensor | None = None,
    ) -> torch.Tensor:
        """
        Args:
            x: (batch, seq_len, hidden_dim)
            mask: (batch, seq_len) — True for valid positions

        Returns:
            context: (batch, hidden_dim) — weighted sum
        """
        scores = self.attention(x).squeeze(-1)  # (B, T)

        if mask is not None:
            scores = scores.masked_fill(~mask, float("-inf"))

        weights = torch.softmax(scores, dim=-1)  # (B, T)
        context = torch.bmm(weights.unsqueeze(1), x).squeeze(1)  # (B, H)
        return context


class SwingQualityScorer(nn.Module):
    def __init__(
        self,
        input_dim: int = FEATURE_DIM,
        hidden_dim: int = 128,
        num_conv_layers: int = 3,
        kernel_size: int = 5,
        dropout: float = 0.3,
    ):
        super().__init__()

        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
        )

        # Stacked 1D convolutions for temporal pattern extraction
        conv_layers = []
        for i in range(num_conv_layers):
            conv_layers.extend([
                nn.Conv1d(hidden_dim, hidden_dim, kernel_size, padding=kernel_size // 2),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout),
            ])
        self.conv_stack = nn.Sequential(*conv_layers)

        self.attention = TemporalAttention(hidden_dim)

        self.scorer = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, 1),
            nn.Sigmoid(),
        )

    def forward(
        self,
        x: torch.Tensor,
        lengths: torch.Tensor | None = None,
    ) -> torch.Tensor:
        """
        Args:
            x: (batch, seq_len, input_dim)
            lengths: (batch,) original sequence lengths

        Returns:
            score: (batch, 1) in [0, 1]
        """
        b, t, _ = x.shape

        # Project input features
        x = self.input_proj(x)  # (B, T, H)

        # Conv expects (B, C, T)
        x = x.transpose(1, 2)
        x = self.conv_stack(x)
        x = x.transpose(1, 2)  # back to (B, T, H)

        # Create mask from lengths
        mask = None
        if lengths is not None:
            mask = torch.arange(t, device=x.device).unsqueeze(0) < lengths.unsqueeze(1)

        # Attention pooling
        context = self.attention(x, mask)  # (B, H)

        # Score
        score = self.scorer(context)  # (B, 1)
        return score


def quality_loss(
    predicted: torch.Tensor,
    target: torch.Tensor,
) -> torch.Tensor:
    """MSE loss + smoothness penalty."""
    return nn.functional.mse_loss(predicted.squeeze(-1), target)
