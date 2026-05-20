#!/usr/bin/env python3
"""
Convert GolfDB annotations + downloaded videos into training samples.

GolfDB provides 8 swing events per video:
  0: Address, 1: Toe-up, 2: Mid-backswing, 3: Top,
  4: Mid-downswing, 5: Impact, 6: Mid-follow-through, 7: Finish

We map these to our 6 phases:
  address (0), backswing (1-2), top_of_backswing (3),
  downswing (4), impact (5), follow_through (6-7)

Usage:
  python scripts/convert_golfdb.py \
    --golfdb-dir ./data/raw/golfdb \
    --output-dir ./data/training \
    --max-swings 100
"""

import argparse
import json
import os
import sys
import uuid

import cv2
import numpy as np
import pandas as pd

sys.path.insert(0, ".")

PHASE_MAP = {
    0: 0,  # Address -> address
    1: 1,  # Toe-up -> backswing
    2: 1,  # Mid-backswing -> backswing
    3: 2,  # Top -> top_of_backswing
    4: 3,  # Mid-downswing -> downswing
    5: 4,  # Impact -> impact
    6: 5,  # Mid-follow-through -> follow_through
    7: 5,  # Finish -> follow_through
}


def extract_swing_clip(video_path, events, fps=30):
    """Extract frames for a single swing from a video."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None, None

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    start_frame = events[0]
    end_frame = events[-1]

    frames = []
    frame_indices = []
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    for frame_idx in range(start_frame, end_frame + 1):
        ret, frame = cap.read()
        if not ret:
            break
        # Resize to max 640px wide
        h, w = frame.shape[:2]
        if w > 640:
            scale = 640 / w
            frame = cv2.resize(frame, (640, int(h * scale)))
        frames.append(frame)
        frame_indices.append(frame_idx)

    cap.release()
    return frames, frame_indices


def frames_to_phase_labels(frame_indices, events):
    """Generate per-frame phase labels from GolfDB event timestamps."""
    labels = []
    for idx in frame_indices:
        phase = 0
        for event_idx in range(len(events) - 1):
            if idx >= events[event_idx]:
                phase = PHASE_MAP.get(event_idx, 0)
        labels.append(phase)
    return labels


def process_swing(video_path, events, skill_level="pro"):
    """Process a single swing into a training sample (without MediaPipe for speed)."""
    frames, frame_indices = extract_swing_clip(video_path, events)
    if frames is None or len(frames) < 10:
        return None

    # For now, create a minimal sample without pose estimation
    # The full pipeline can be run later with prepare_training_data.py
    phase_labels = frames_to_phase_labels(frame_indices, events)

    return {
        "video_path": video_path,
        "handedness": "right",
        "pose_sequence": [],  # Will be filled by MediaPipe later
        "phase_labels": phase_labels,
        "quality_score": None,  # Unknown for GolfDB
        "faults": [],
        "skill_level": skill_level,
        "frame_count": len(frames),
        "source": "golfdb",
        "needs_pose_extraction": True,
    }


def main():
    parser = argparse.ArgumentParser(description="Convert GolfDB to training format")
    parser.add_argument("--golfdb-dir", default="./data/raw/golfdb")
    parser.add_argument("--output-dir", default="./data/training")
    parser.add_argument("--max-swings", type=int, default=100)
    parser.add_argument("--run-mediapipe", action="store_true",
                        help="Run MediaPipe pose extraction (slow but complete)")
    args = parser.parse_args()

    df = pd.read_pickle(os.path.join(args.golfdb_dir, "data", "golfDB.pkl"))
    video_dir = os.path.join(args.golfdb_dir, "videos")

    if not os.path.exists(video_dir):
        print(f"No videos found at {video_dir}")
        print("Download videos first: yt-dlp --batch-file urls.txt ...")
        return

    os.makedirs(args.output_dir, exist_ok=True)

    available_videos = {
        os.path.splitext(f)[0]: os.path.join(video_dir, f)
        for f in os.listdir(video_dir)
        if f.endswith((".mp4", ".webm", ".mkv"))
    }

    print(f"GolfDB: {len(df)} swings, {len(available_videos)} videos downloaded")

    processed = 0
    for _, row in df.iterrows():
        if processed >= args.max_swings:
            break

        yt_id = row["youtube_id"]
        if yt_id not in available_videos:
            continue

        video_path = available_videos[yt_id]
        events = list(row["events"])

        if len(events) < 8:
            continue

        if args.run_mediapipe:
            # Full processing with pose extraction
            from app.ml.data.preprocessing import video_to_training_sample, save_training_sample
            try:
                sample = video_to_training_sample(
                    video_path=video_path,
                    skill_level="pro",
                    phase_labels=frames_to_phase_labels(
                        list(range(events[0], events[-1] + 1)), events
                    ),
                )
                save_training_sample(sample, args.output_dir)
                processed += 1
                print(f"  [{processed}] {row['player']} ({row['club']}) — {len(sample['pose_sequence'])} frames")
            except Exception as e:
                print(f"  SKIP {row['player']}: {e}")
        else:
            # Quick mode — just save metadata + phase labels
            sample = process_swing(video_path, events, skill_level="pro")
            if sample is None:
                continue

            sample["player"] = row["player"]
            sample["club"] = row["club"]
            sample["view"] = row["view"]

            filename = f"golfdb_{yt_id}_{uuid.uuid4().hex[:8]}.json"
            path = os.path.join(args.output_dir, filename)
            with open(path, "w") as f:
                json.dump(sample, f)

            processed += 1
            print(f"  [{processed}] {row['player']} ({row['club']}, {row['view']}) — {sample['frame_count']} frames")

    print(f"\nProcessed {processed} swings → {args.output_dir}")
    if not args.run_mediapipe:
        print("Note: Pose sequences are empty. Run with --run-mediapipe to extract poses,")
        print("or use prepare_training_data.py on the individual videos.")


if __name__ == "__main__":
    main()
