#!/usr/bin/env python3
"""
Download publicly available golf swing datasets for training.

Datasets:
  1. GolfDB     — 1,400 pro swing videos with 8 event annotations
  2. CaddieSet  — 1,757 shots with joint keypoints and ball data
  3. Penn Action — ~150 golf swing clips with 13 body joint annotations

Usage:
  python scripts/download_datasets.py --dataset golfdb --output-dir ./data/raw
  python scripts/download_datasets.py --dataset caddieset --output-dir ./data/raw
  python scripts/download_datasets.py --dataset penn-action --output-dir ./data/raw
  python scripts/download_datasets.py --dataset all --output-dir ./data/raw
"""

import argparse
import os
import subprocess
import sys
import urllib.request
import zipfile
import tarfile


def download_file(url: str, dest: str, desc: str = ""):
    if os.path.exists(dest):
        print(f"  Already exists: {dest}")
        return
    print(f"  Downloading {desc or url}...")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    urllib.request.urlretrieve(url, dest)
    print(f"  Saved: {dest} ({os.path.getsize(dest) / 1e6:.1f} MB)")


def clone_repo(url: str, dest: str):
    if os.path.exists(dest):
        print(f"  Already cloned: {dest}")
        return
    print(f"  Cloning {url}...")
    subprocess.run(["git", "clone", "--depth", "1", url, dest], check=True)


def download_golfdb(output_dir: str):
    """
    GolfDB — 1,400 HD golf swing videos from YouTube.
    Paper: McNally et al., CVPR Workshops 2019
    Repo: https://github.com/wmcnally/golfdb

    Downloads the repo with annotations. Videos must be fetched from YouTube
    using the provided CSV of URLs (requires yt-dlp).
    """
    print("\n=== GolfDB ===")
    dest = os.path.join(output_dir, "golfdb")
    clone_repo("https://github.com/wmcnally/golfdb.git", dest)

    print("\n  To download the actual video clips, install yt-dlp and run:")
    print(f"    cd {dest}")
    print("    pip install yt-dlp pandas")
    print("    python -c \"")
    print("      import pandas as pd")
    print("      import subprocess")
    print("      df = pd.read_csv('data/val.pkl') if ... else pd.read_csv(...)  # see repo")
    print("      # Use yt-dlp to download each video URL")
    print("    \"")
    print()
    print("  Or download preprocessed 160x160 clips from Kaggle:")
    print("    pip install kaggle")
    print("    kaggle datasets download -d marcmarais/videos-160")
    print(f"    unzip videos-160.zip -d {dest}/videos_160")
    print()
    print("  Annotations include: 8 swing events, club type, view angle, player info")


def download_caddieset(output_dir: str):
    """
    CaddieSet — 1,757 golf shots with joint keypoints and ball metrics.
    Paper: CVPR 2025 CVSports Workshop
    Repo: https://github.com/damilab/CaddieSet
    """
    print("\n=== CaddieSet ===")
    dest = os.path.join(output_dir, "caddieset")
    clone_repo("https://github.com/damilab/CaddieSet.git", dest)

    print("  Contains:")
    print("    - 924 face-on + 833 down-the-line shots")
    print("    - Per-frame joint keypoints across 8 swing phases")
    print("    - 15 ball trajectory metrics per shot")
    print("    - 8 players of varying skill levels")
    print(f"  Check {dest}/README.md for dataset access instructions")


def download_penn_action(output_dir: str):
    """
    Penn Action — 2,326 clips across 15 actions including golf swing.
    ~150 golf swing clips with 13 body joint annotations per frame.
    """
    print("\n=== Penn Action ===")
    dest_dir = os.path.join(output_dir, "penn_action")
    archive = os.path.join(output_dir, "Penn_Action.tar.gz")

    if os.path.exists(dest_dir) and os.listdir(dest_dir):
        print(f"  Already exists: {dest_dir}")
        return

    download_file(
        "https://dreamdragon.github.io/PennAction/Penn_Action.tar.gz",
        archive,
        "Penn Action dataset (~2 GB)",
    )

    print("  Extracting...")
    os.makedirs(dest_dir, exist_ok=True)
    with tarfile.open(archive, "r:gz") as tar:
        tar.extractall(dest_dir)

    print(f"  Extracted to: {dest_dir}")
    print("  Contains: ~150 golf swing clips with 13 body joints per frame")
    print("  Format: MATLAB .mat files with joint positions + visibility")


def show_summary():
    print("\n" + "=" * 60)
    print("DATASET SUMMARY")
    print("=" * 60)
    print("""
Recommended training pipeline:

1. Start with GolfDB (largest, best annotated):
   - 1,400 pro swing videos with 8 swing phase labels
   - Download preprocessed clips from Kaggle for quick start
   - Process through our pipeline to generate training JSONs

2. Add CaddieSet for skill-level diversity:
   - Mix of pro and amateur swings
   - Pre-computed joint keypoints (saves MediaPipe step)
   - Ball flight data for future quality correlation

3. Use Penn Action for quick prototyping:
   - Small but clean dataset with body joint annotations
   - Direct download, no API keys needed
   - Good for initial model validation

Convert any dataset to our training format:
   python scripts/prepare_training_data.py \\
     --video-dir ./data/raw/golfdb/videos \\
     --output-dir ./data/training \\
     --skill-level pro

Additional data sources:
   - Kaggle: kaggle datasets download marcmarais/golfdb-entire-image
   - Kaggle: kaggle datasets download thomassimm/golfdb3
   - Roboflow: golf swing keypoint datasets (image-level)
   - YouTube: PGA Tour slow-motion playlists (use yt-dlp)
""")


def main():
    parser = argparse.ArgumentParser(description="Download golf swing training datasets")
    parser.add_argument(
        "--dataset",
        required=True,
        choices=["golfdb", "caddieset", "penn-action", "all", "info"],
        help="Which dataset to download",
    )
    parser.add_argument(
        "--output-dir",
        default="./data/raw",
        help="Directory to save downloaded data",
    )
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    if args.dataset == "info":
        show_summary()
        return

    if args.dataset in ("golfdb", "all"):
        download_golfdb(args.output_dir)

    if args.dataset in ("caddieset", "all"):
        download_caddieset(args.output_dir)

    if args.dataset in ("penn-action", "all"):
        download_penn_action(args.output_dir)

    show_summary()


if __name__ == "__main__":
    main()
