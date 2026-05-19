#!/usr/bin/env python3
"""Train the Swing Fault Detector model."""

import argparse
import sys

sys.path.insert(0, ".")

import torch

from app.ml.data.dataset import FaultDataset, FAULT_NAMES
from app.ml.models.fault_detector import SwingFaultDetector, fault_loss
from app.ml.training.trainer import TrainConfig, train_model


def loss_fn(model, batch):
    sequences, labels, lengths = batch
    predicted = model(sequences, lengths)
    return fault_loss(predicted, labels)


def compute_metrics(model, val_loader, device):
    """Compute per-fault precision, recall, and F1."""
    all_preds = []
    all_targets = []

    model.eval()
    with torch.no_grad():
        for sequences, labels, lengths in val_loader:
            sequences = sequences.to(device)
            lengths = lengths.to(device)

            predicted = model(sequences, lengths)
            all_preds.append(predicted.cpu())
            all_targets.append(labels)

    preds = torch.cat(all_preds, dim=0)
    targets = torch.cat(all_targets, dim=0)

    # Threshold at 0.5
    binary_preds = (preds > 0.5).float()

    # Macro F1
    tp = (binary_preds * targets).sum(dim=0)
    fp = (binary_preds * (1 - targets)).sum(dim=0)
    fn = ((1 - binary_preds) * targets).sum(dim=0)

    precision = tp / (tp + fp + 1e-9)
    recall = tp / (tp + fn + 1e-9)
    f1 = 2 * precision * recall / (precision + recall + 1e-9)

    return {
        "macro_f1": f1.mean().item(),
        "macro_precision": precision.mean().item(),
        "macro_recall": recall.mean().item(),
    }


def main():
    parser = argparse.ArgumentParser(description="Train fault detector")
    parser.add_argument("--data-dir", required=True, help="Directory with annotated JSON files")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--max-seq-len", type=int, default=300)
    parser.add_argument("--checkpoint-dir", default="./checkpoints")
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()

    dataset = FaultDataset(args.data_dir, max_seq_len=args.max_seq_len)
    print(f"Loaded {len(dataset)} samples from {args.data_dir}")

    model = SwingFaultDetector(hidden_dim=args.hidden_dim)
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
        model_name="fault_detector",
        compute_metrics_fn=compute_metrics,
    )


if __name__ == "__main__":
    main()
