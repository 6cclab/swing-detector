#!/usr/bin/env python3
"""
Prepare training data from video files.

Usage:
  # Process pro swing videos
  python scripts/prepare_training_data.py \
    --video-dir ./data/pro_swings \
    --output-dir ./data/training \
    --skill-level pro

  # Process amateur swing videos
  python scripts/prepare_training_data.py \
    --video-dir ./data/amateur_swings \
    --output-dir ./data/training \
    --skill-level amateur

  # Process a single video with manual annotations
  python scripts/prepare_training_data.py \
    --video ./data/my_swing.mp4 \
    --output-dir ./data/training \
    --quality-score 65 \
    --faults early_extension,casting \
    --skill-level amateur
"""

import argparse
import sys

sys.path.insert(0, ".")

from app.ml.data.preprocessing import (
    batch_process_videos,
    save_training_sample,
    video_to_training_sample,
)


def main():
    parser = argparse.ArgumentParser(description="Prepare training data from videos")
    parser.add_argument("--video", help="Single video file to process")
    parser.add_argument("--video-dir", help="Directory of video files to batch process")
    parser.add_argument("--output-dir", required=True, help="Output directory for JSON samples")
    parser.add_argument("--skill-level", default="amateur", choices=["pro", "amateur"])
    parser.add_argument("--handedness", default="right", choices=["right", "left"])
    parser.add_argument("--quality-score", type=float, help="Manual quality score (0-100)")
    parser.add_argument("--faults", help="Comma-separated fault labels")
    args = parser.parse_args()

    if args.video:
        faults = args.faults.split(",") if args.faults else []
        sample = video_to_training_sample(
            video_path=args.video,
            quality_score=args.quality_score,
            faults=faults,
            skill_level=args.skill_level,
            handedness=args.handedness,
        )
        path = save_training_sample(sample, args.output_dir)
        print(f"Saved: {path}")
        print(f"  Frames: {len(sample['pose_sequence'])}")
        print(f"  Score: {sample['quality_score']}")
        print(f"  Faults: {sample['faults']}")

    elif args.video_dir:
        paths = batch_process_videos(
            video_dir=args.video_dir,
            output_dir=args.output_dir,
            skill_level=args.skill_level,
            handedness=args.handedness,
        )
        print(f"\nProcessed {len(paths)} videos")

    else:
        parser.error("Provide either --video or --video-dir")


if __name__ == "__main__":
    main()
