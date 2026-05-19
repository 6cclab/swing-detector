"""
Generic training loop with checkpointing, logging, and early stopping.
Used by all four model training scripts.
"""

import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset, random_split


@dataclass
class TrainConfig:
    epochs: int = 50
    batch_size: int = 16
    learning_rate: float = 1e-3
    weight_decay: float = 1e-4
    patience: int = 10
    val_split: float = 0.2
    checkpoint_dir: str = "./checkpoints"
    device: str = "cpu"
    num_workers: int = 0


@dataclass
class TrainResult:
    best_epoch: int = 0
    best_val_loss: float = float("inf")
    train_losses: list[float] = field(default_factory=list)
    val_losses: list[float] = field(default_factory=list)
    val_metrics: list[dict] = field(default_factory=list)
    checkpoint_path: str = ""
    elapsed_seconds: float = 0.0


def train_model(
    model: nn.Module,
    dataset: Dataset,
    loss_fn,
    config: TrainConfig,
    model_name: str,
    compute_metrics_fn=None,
    collate_fn=None,
) -> TrainResult:
    """
    Train a model with validation, checkpointing, and early stopping.

    Args:
        model: The PyTorch model to train
        dataset: Full dataset (will be split into train/val)
        loss_fn: Function(model_output, batch) -> loss tensor
        config: Training configuration
        model_name: Name for checkpoint files
        compute_metrics_fn: Optional function(model, val_loader, device) -> dict
        collate_fn: Optional custom collate function for DataLoader
    """
    device = torch.device(config.device)
    model = model.to(device)

    # Split dataset
    val_size = max(1, int(len(dataset) * config.val_split))
    train_size = len(dataset) - val_size
    train_dataset, val_dataset = random_split(
        dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42),
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=config.batch_size,
        shuffle=True,
        num_workers=config.num_workers,
        collate_fn=collate_fn,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=config.batch_size,
        shuffle=False,
        num_workers=config.num_workers,
        collate_fn=collate_fn,
    )

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5
    )

    # Ensure checkpoint dir exists
    checkpoint_dir = Path(config.checkpoint_dir) / model_name
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    result = TrainResult()
    start_time = time.time()
    patience_counter = 0

    print(f"\nTraining {model_name}")
    print(f"  Train samples: {train_size}, Val samples: {val_size}")
    print(f"  Device: {device}, Epochs: {config.epochs}, LR: {config.learning_rate}")
    print("-" * 60)

    for epoch in range(1, config.epochs + 1):
        # --- Train ---
        model.train()
        train_loss_sum = 0.0
        train_batches = 0

        for batch in train_loader:
            batch = _to_device(batch, device)
            optimizer.zero_grad()
            loss = loss_fn(model, batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss_sum += loss.item()
            train_batches += 1

        train_loss = train_loss_sum / max(train_batches, 1)

        # --- Validate ---
        model.eval()
        val_loss_sum = 0.0
        val_batches = 0

        with torch.no_grad():
            for batch in val_loader:
                batch = _to_device(batch, device)
                loss = loss_fn(model, batch)
                val_loss_sum += loss.item()
                val_batches += 1

        val_loss = val_loss_sum / max(val_batches, 1)
        scheduler.step(val_loss)

        result.train_losses.append(train_loss)
        result.val_losses.append(val_loss)

        # Compute additional metrics
        metrics = {}
        if compute_metrics_fn:
            metrics = compute_metrics_fn(model, val_loader, device)
        result.val_metrics.append(metrics)

        metrics_str = " | ".join(f"{k}: {v:.4f}" for k, v in metrics.items())
        lr = optimizer.param_groups[0]["lr"]
        print(
            f"  Epoch {epoch:3d}/{config.epochs} | "
            f"train: {train_loss:.4f} | val: {val_loss:.4f} | "
            f"lr: {lr:.2e} | {metrics_str}"
        )

        # Checkpoint best model
        if val_loss < result.best_val_loss:
            result.best_val_loss = val_loss
            result.best_epoch = epoch
            patience_counter = 0

            ckpt_path = checkpoint_dir / f"{model_name}_best.pt"
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": val_loss,
                "metrics": metrics,
            }, ckpt_path)
            result.checkpoint_path = str(ckpt_path)
        else:
            patience_counter += 1
            if patience_counter >= config.patience:
                print(f"  Early stopping at epoch {epoch} (patience={config.patience})")
                break

    result.elapsed_seconds = time.time() - start_time

    # Save training history
    history_path = checkpoint_dir / f"{model_name}_history.json"
    with open(history_path, "w") as f:
        json.dump({
            "best_epoch": result.best_epoch,
            "best_val_loss": result.best_val_loss,
            "train_losses": result.train_losses,
            "val_losses": result.val_losses,
            "val_metrics": result.val_metrics,
            "elapsed_seconds": result.elapsed_seconds,
        }, f, indent=2)

    print(f"\nDone. Best val loss: {result.best_val_loss:.4f} at epoch {result.best_epoch}")
    print(f"Checkpoint: {result.checkpoint_path}")
    print(f"Time: {result.elapsed_seconds:.1f}s\n")

    return result


def _to_device(batch, device):
    """Move a batch (tuple of tensors) to device."""
    if isinstance(batch, (list, tuple)):
        return tuple(
            t.to(device) if isinstance(t, torch.Tensor) else t for t in batch
        )
    if isinstance(batch, torch.Tensor):
        return batch.to(device)
    return batch


def load_checkpoint(
    model: nn.Module,
    checkpoint_path: str,
    device: str = "cpu",
) -> dict:
    """Load a model checkpoint. Returns the checkpoint dict."""
    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=True)
    model.load_state_dict(ckpt["model_state_dict"])
    return ckpt
