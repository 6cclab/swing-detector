#!/usr/bin/env python3
"""Train the Swing Phase Classifier model."""

import argparse
import sys

sys.path.insert(0, ".")

import torch

from app.ml.data.dataset import PhaseDataset
from app.ml.models.phase_classifier import SwingPhaseClassifier, phase_loss
from app.ml.training.trainer import TrainConfig, train_model


def loss_fn(model, batch):
    sequences, labels, lengths = batch
    logits = model(sequences, lengths)
    return phase_loss(logits, labels, lengths)


def compute_metrics(model, val_loader, device):
    """Compute per-frame accuracy (ignoring padding)."""
    correct = 0
    total = 0

    model.eval()
    with torch.no_grad():
        for sequences, labels, lengths in val_loader:
            sequences = sequences.to(device)
            labels = labels.to(device)
            lengths = lengths.to(device)

            logits = model(sequences, lengths)
            preds = logits.argmax(dim=-1)

            # Align lengths after pack/unpack
            labels = labels[:, :preds.shape[1]]
            mask = labels != -1
            correct += (preds[mask] == labels[mask]).sum().item()
            total += mask.sum().item()

    return {"accuracy": correct / max(total, 1)}


def main():
    parser = argparse.ArgumentParser(description="Train phase classifier")
    parser.add_argument("--data-dir", required=True, help="Directory with annotated JSON files")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--num-layers", type=int, default=2)
    parser.add_argument("--max-seq-len", type=int, default=300)
    parser.add_argument("--checkpoint-dir", default="./checkpoints")
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()

    dataset = PhaseDataset(args.data_dir, max_seq_len=args.max_seq_len)
    print(f"Loaded {len(dataset)} samples from {args.data_dir}")

    model = SwingPhaseClassifier(
        hidden_dim=args.hidden_dim,
        num_layers=args.num_layers,
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
        model_name="phase_classifier",
        compute_metrics_fn=compute_metrics,
    )


if __name__ == "__main__":
    main()
