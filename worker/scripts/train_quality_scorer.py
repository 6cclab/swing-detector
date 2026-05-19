#!/usr/bin/env python3
"""Train the Swing Quality Scorer model."""

import argparse
import sys

sys.path.insert(0, ".")

import torch

from app.ml.data.dataset import QualityDataset
from app.ml.models.quality_scorer import SwingQualityScorer, quality_loss
from app.ml.training.trainer import TrainConfig, train_model


def loss_fn(model, batch):
    sequences, scores, lengths = batch
    predicted = model(sequences, lengths)
    return quality_loss(predicted, scores)


def compute_metrics(model, val_loader, device):
    """Compute MAE and R^2 on validation set."""
    all_preds = []
    all_targets = []

    model.eval()
    with torch.no_grad():
        for sequences, scores, lengths in val_loader:
            sequences = sequences.to(device)
            lengths = lengths.to(device)

            predicted = model(sequences, lengths).squeeze(-1)
            all_preds.extend(predicted.cpu().tolist())
            all_targets.extend(scores.tolist())

    preds = torch.tensor(all_preds)
    targets = torch.tensor(all_targets)

    mae = (preds - targets).abs().mean().item() * 100  # scale back to 0-100
    ss_res = ((targets - preds) ** 2).sum()
    ss_tot = ((targets - targets.mean()) ** 2).sum()
    r2 = 1 - (ss_res / (ss_tot + 1e-9))

    return {"mae": mae, "r2": r2.item()}


def main():
    parser = argparse.ArgumentParser(description="Train quality scorer")
    parser.add_argument("--data-dir", required=True, help="Directory with annotated JSON files")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--max-seq-len", type=int, default=300)
    parser.add_argument("--checkpoint-dir", default="./checkpoints")
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()

    dataset = QualityDataset(args.data_dir, max_seq_len=args.max_seq_len)
    print(f"Loaded {len(dataset)} samples from {args.data_dir}")

    model = SwingQualityScorer(hidden_dim=args.hidden_dim)
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
        model_name="quality_scorer",
        compute_metrics_fn=compute_metrics,
    )


if __name__ == "__main__":
    main()
