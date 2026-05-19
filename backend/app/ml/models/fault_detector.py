"""
Swing Fault Detector — Multi-label classifier detecting specific swing faults.

Input:  (batch, seq_len, 132) — pose landmark features per frame
Output: (batch, num_faults)   — per-fault probabilities

Detects common swing faults:
  - Early extension (hips thrust toward ball)
  - Over the top (outside-in swing path)
  - Casting (early release of wrist angle)
  - Sway (lateral hip movement in backswing)
  - Slide (lateral hip movement in downswing)
  - Chicken wing (lead elbow bends through impact)
  - Loss of posture (spine angle changes during swing)
  - Flat shoulder plane
  - Reverse spine angle
  - Hanging back (weight stays on trail side)
"""

import torch
import torch.nn as nn

from app.ml.data.dataset import FEATURE_DIM, NUM_FAULTS


class SwingFaultDetector(nn.Module):
    def __init__(
        self,
        input_dim: int = FEATURE_DIM,
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        num_faults: int = NUM_FAULTS,
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

        # Per-fault attention heads — each fault looks at different parts of the swing
        self.fault_attention = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden_dim * 2, 1),
            )
            for _ in range(num_faults)
        ])

        self.fault_classifiers = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden_dim * 2, hidden_dim // 2),
                nn.ReLU(),
                nn.Dropout(dropout),
                nn.Linear(hidden_dim // 2, 1),
            )
            for _ in range(num_faults)
        ])

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
            fault_probs: (batch, num_faults) — sigmoid probabilities
        """
        b, t, _ = x.shape
        x = self.input_proj(x)

        if lengths is not None:
            x = nn.utils.rnn.pack_padded_sequence(
                x, lengths.cpu().clamp(min=1), batch_first=True, enforce_sorted=False
            )

        lstm_out, _ = self.lstm(x)

        if lengths is not None:
            lstm_out, _ = nn.utils.rnn.pad_packed_sequence(
                lstm_out, batch_first=True, total_length=t
            )

        # Create mask
        if lengths is not None:
            mask = torch.arange(t, device=lstm_out.device).unsqueeze(0) < lengths.unsqueeze(1)
        else:
            mask = torch.ones(b, t, dtype=torch.bool, device=lstm_out.device)

        # Per-fault attention + classification
        fault_logits = []
        for attn, clf in zip(self.fault_attention, self.fault_classifiers):
            # Attention weights
            scores = attn(lstm_out).squeeze(-1)  # (B, T)
            scores = scores.masked_fill(~mask, float("-inf"))
            weights = torch.softmax(scores, dim=-1)  # (B, T)

            # Weighted context
            context = torch.bmm(weights.unsqueeze(1), lstm_out).squeeze(1)  # (B, H*2)
            logit = clf(context)  # (B, 1)
            fault_logits.append(logit)

        logits = torch.cat(fault_logits, dim=-1)  # (B, num_faults)
        return torch.sigmoid(logits)


def fault_loss(
    predicted: torch.Tensor,
    target: torch.Tensor,
) -> torch.Tensor:
    """Binary cross-entropy for multi-label fault detection."""
    return nn.functional.binary_cross_entropy(predicted, target)
