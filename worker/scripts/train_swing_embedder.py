#!/usr/bin/env python3
"""Train the Swing Embedder model with contrastive learning."""

import argparse
import sys

sys.path.insert(0, ".")

import torch

from app.ml.data.dataset import EmbeddingDataset
from app.ml.models.swing_embedder import SwingEmbedder, contrastive_loss
from app.ml.training.trainer import TrainConfig, train_model


def loss_fn(model, batch):
    seq_a, seq_b, labels, len_a, len_b = batch
    emb_a = model(seq_a, len_a)
    emb_b = model(seq_b, len_b)
    return contrastive_loss(emb_a, emb_b, labels)


def compute_metrics(model, val_loader, device):
    """Compute average distance for positive and negative pairs."""
    pos_distances = []
    neg_distances = []

    model.eval()
    with torch.no_grad():
        for seq_a, seq_b, labels, len_a, len_b in val_loader:
            seq_a = seq_a.to(device)
            seq_b = seq_b.to(device)
            len_a = len_a.to(device)
            len_b = len_b.to(device)

            emb_a = model(seq_a, len_a)
            emb_b = model(seq_b, len_b)
            distances = torch.nn.functional.pairwise_distance(emb_a, emb_b)

            for d, l in zip(distances, labels):
                if l.item() == 1.0:
                    pos_distances.append(d.item())
                else:
                    neg_distances.append(d.item())

    avg_pos = sum(pos_distances) / max(len(pos_distances), 1)
    avg_neg = sum(neg_distances) / max(len(neg_distances), 1)

    return {
        "avg_pos_dist": avg_pos,
        "avg_neg_dist": avg_neg,
        "separation": avg_neg - avg_pos,
    }


def main():
    parser = argparse.ArgumentParser(description="Train swing embedder")
    parser.add_argument("--data-dir", required=True, help="Directory with annotated JSON files")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--embed-dim", type=int, default=64)
    parser.add_argument("--max-seq-len", type=int, default=300)
    parser.add_argument("--checkpoint-dir", default="./checkpoints")
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()

    dataset = EmbeddingDataset(args.data_dir, max_seq_len=args.max_seq_len)
    print(f"Loaded {len(dataset)} samples from {args.data_dir}")
    print(f"  Pro: {len(dataset.pro_indices)}, Amateur: {len(dataset.amateur_indices)}")

    model = SwingEmbedder(
        hidden_dim=args.hidden_dim,
        embed_dim=args.embed_dim,
    )
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")

    config = TrainConfig(
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        checkpoint_dir=args.checkpoint_dir,
        device=args.device,
    )

    train_model(
        model=model,
        dataset=dataset,
        loss_fn=loss_fn,
        config=config,
        model_name="swing_embedder",
        compute_metrics_fn=compute_metrics,
    )


if __name__ == "__main__":
    main()
