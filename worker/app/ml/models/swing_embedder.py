"""
Swing Embedder — Produces fixed-size embeddings for swing comparison.

Input:  (batch, seq_len, 132) — pose landmark features per frame
Output: (batch, embed_dim)    — normalized embedding vector

Trained with contrastive loss: swings from similar skill levels should have
similar embeddings, enabling nearest-neighbor comparison to pro reference swings.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

from app.ml.data.dataset import FEATURE_DIM


class SwingEmbedder(nn.Module):
    def __init__(
        self,
        input_dim: int = FEATURE_DIM,
        hidden_dim: int = 128,
        embed_dim: int = 64,
        num_conv_layers: int = 3,
        kernel_size: int = 7,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.embed_dim = embed_dim

        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
        )

        # Temporal convolutions with increasing dilation for multi-scale patterns
        conv_layers = []
        for i in range(num_conv_layers):
            dilation = 2 ** i
            padding = (kernel_size - 1) * dilation // 2
            conv_layers.extend([
                nn.Conv1d(
                    hidden_dim, hidden_dim, kernel_size,
                    padding=padding, dilation=dilation
                ),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout),
            ])
        self.conv_stack = nn.Sequential(*conv_layers)

        # Dual pooling: max + avg for richer representation
        self.projection = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
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
            embedding: (batch, embed_dim) — L2 normalized
        """
        b, t, _ = x.shape
        x = self.input_proj(x)  # (B, T, H)

        # Conv: (B, H, T)
        x = x.transpose(1, 2)
        x = self.conv_stack(x)
        x = x.transpose(1, 2)  # (B, T, H)

        # Mask padded positions
        if lengths is not None:
            mask = torch.arange(t, device=x.device).unsqueeze(0) < lengths.unsqueeze(1)
            mask = mask.unsqueeze(-1)  # (B, T, 1)
            x = x * mask.float()

            # Masked average pooling
            avg_pool = x.sum(dim=1) / lengths.unsqueeze(1).float().clamp(min=1)
        else:
            avg_pool = x.mean(dim=1)

        # Max pooling (masked)
        if lengths is not None:
            x_masked = x.masked_fill(~mask, float("-inf"))
            max_pool = x_masked.max(dim=1).values
        else:
            max_pool = x.max(dim=1).values

        # Concatenate pooling strategies
        pooled = torch.cat([avg_pool, max_pool], dim=-1)  # (B, H*2)

        # Project to embedding space
        embedding = self.projection(pooled)  # (B, embed_dim)

        # L2 normalize
        embedding = F.normalize(embedding, p=2, dim=-1)
        return embedding


def contrastive_loss(
    emb_a: torch.Tensor,
    emb_b: torch.Tensor,
    labels: torch.Tensor,
    margin: float = 0.5,
) -> torch.Tensor:
    """
    Contrastive loss for pairs.

    labels: 1.0 = similar (same skill level), 0.0 = dissimilar
    """
    distances = F.pairwise_distance(emb_a, emb_b)

    # Similar pairs: minimize distance
    pos_loss = labels * distances.pow(2)
    # Dissimilar pairs: maximize distance up to margin
    neg_loss = (1 - labels) * F.relu(margin - distances).pow(2)

    return (pos_loss + neg_loss).mean()


def cosine_similarity_score(
    swing_embedding: torch.Tensor,
    reference_embeddings: torch.Tensor,
) -> torch.Tensor:
    """
    Compute cosine similarity between a swing and a set of reference pro swings.

    Args:
        swing_embedding: (embed_dim,) or (1, embed_dim)
        reference_embeddings: (N, embed_dim)

    Returns:
        similarities: (N,) cosine similarity scores
    """
    if swing_embedding.dim() == 1:
        swing_embedding = swing_embedding.unsqueeze(0)
    return F.cosine_similarity(
        swing_embedding.expand_as(reference_embeddings),
        reference_embeddings,
    )
