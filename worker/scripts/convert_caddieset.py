#!/usr/bin/env python3
"""
Convert CaddieSet CSV into training samples.

CaddieSet provides pre-extracted joint features per swing phase (no videos needed).
Each row is one golf shot with features across 8 phases.

Columns like '0-SHOULDER-ANGLE' = phase 0 (address), '5-HIP-ROTATION' = phase 5 (impact).

We map these features into our training format for the quality scorer and fault detector.

Usage:
  python scripts/convert_caddieset.py \
    --csv ./data/raw/caddieset/data/CaddieSet.csv \
    --output-dir ./data/training
"""

import argparse
import csv
import json
import os
import uuid


# CaddieSet phase mapping (0-7 events)
# We'll use features from key phases: 0=address, 3=top, 5=impact, 7=finish
CADDIESET_PHASES = {
    0: "address",
    1: "backswing",
    2: "backswing",
    3: "top_of_backswing",
    4: "downswing",
    5: "impact",
    6: "follow_through",
    7: "follow_through",
}

# Features we care about, mapped to our metric names
FEATURE_MAP = {
    "SHOULDER-ANGLE": "shoulder_rotation_deg",
    "HIP-ROTATION": "hip_rotation_deg",
    "SPINE-ANGLE": "spine_angle_deg",
    "WEIGHT-SHIFT": "weight_transfer_ratio",
    "LEFT-ARM-ANGLE": "elbow_angle_deg",
    "RIGHT-ARM-ANGLE": "wrist_hinge_deg",
}


def estimate_quality_score(row):
    """Estimate a quality score from ball flight data."""
    try:
        distance = float(row.get("Distance", 0) or 0)
        carry = float(row.get("Carry", 0) or 0)
        direction = abs(float(row.get("DirectionAngle", 0) or 0))
        spin_side = abs(float(row.get("SpinSide", 0) or 0))

        # Higher distance + carry is better, lower direction angle + side spin is better
        # Normalize to 0-100 range
        dist_score = min(distance / 300 * 100, 100) if distance > 0 else 50
        dir_score = max(0, 100 - direction * 5)
        spin_score = max(0, 100 - spin_side / 10)

        return round(dist_score * 0.4 + dir_score * 0.35 + spin_score * 0.25, 1)
    except (ValueError, TypeError):
        return None


def detect_faults(row):
    """Detect common faults from CaddieSet features."""
    faults = []

    try:
        # Early extension: large hip shift at impact
        hip_shift_5 = float(row.get("5-HIP-SHIFTED", 0) or 0)
        if abs(hip_shift_5) > 0.5:
            faults.append("early_extension")

        # Loss of posture: spine angle change from address to impact
        spine_0 = float(row.get("0-SPINE-ANGLE", 0) or 0)
        spine_5 = float(row.get("5-SPINE-ANGLE", 0) or 0)
        if spine_0 != 0 and abs(spine_5 - spine_0) > 8:
            faults.append("loss_of_posture")

        # Hanging back: weight not transferred at impact
        weight_5 = float(row.get("5-WEIGHT-SHIFT", 0) or 0)
        if weight_5 < -0.3:
            faults.append("hanging_back")

        # Sway: lateral hip movement in backswing
        hip_shift_2 = float(row.get("2-HIP-SHIFTED", 0) or 0)
        if abs(hip_shift_2) > 0.4:
            faults.append("sway")

    except (ValueError, TypeError):
        pass

    return faults


def convert_row(row, golfer_skill):
    """Convert a CaddieSet row to a training sample."""
    quality_score = estimate_quality_score(row)
    faults = detect_faults(row)

    # Build a synthetic pose sequence from the phase features
    # (not real pose data, but structured for the quality scorer and fault detector)
    pose_sequence = []
    phase_labels = []

    for phase_idx in range(8):
        prefix = f"{phase_idx}-"
        features = {}
        for col, val in row.items():
            if col.startswith(prefix):
                feat_name = col[len(prefix):]
                try:
                    features[feat_name] = float(val) if val else 0.0
                except ValueError:
                    features[feat_name] = 0.0

        if not features:
            continue

        # Create a synthetic landmark array from features
        # Each "frame" gets 33 landmarks x 4 values = 132 features
        # We pack the extracted features into the first few slots
        landmarks = [[0.0, 0.0, 0.0, 1.0]] * 33

        # Map key features into landmark positions for consistency
        for feat_name, metric_name in FEATURE_MAP.items():
            if feat_name in features:
                val = features[feat_name]
                # Normalize to 0-1 range roughly
                normalized = (val + 180) / 360 if "ANGLE" in feat_name else val
                idx = list(FEATURE_MAP.keys()).index(feat_name)
                if idx < 33:
                    landmarks[idx] = [normalized, val / 180, 0.0, 1.0]

        pose_sequence.append({
            "frame_index": phase_idx,
            "landmarks": landmarks,
        })
        phase_labels.append(CADDIESET_PHASES.get(phase_idx, 0))

    # Map phase labels to numeric
    phase_map = {
        "address": 0, "backswing": 1, "top_of_backswing": 2,
        "downswing": 3, "impact": 4, "follow_through": 5,
    }
    numeric_labels = [phase_map.get(p, 0) for p in phase_labels]

    return {
        "video_path": "",
        "handedness": "right",
        "pose_sequence": pose_sequence,
        "phase_labels": numeric_labels,
        "quality_score": quality_score,
        "faults": faults,
        "skill_level": golfer_skill,
        "source": "caddieset",
        "view": row.get("View", ""),
        "club": row.get("ClubType", ""),
        "golfer_id": row.get("GolferId", ""),
    }


def main():
    parser = argparse.ArgumentParser(description="Convert CaddieSet to training format")
    parser.add_argument("--csv", default="./data/raw/caddieset/data/CaddieSet.csv")
    parser.add_argument("--output-dir", default="./data/training")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    # Rough skill mapping by golfer ID (CaddieSet has 8 golfers of varying skill)
    # Without explicit skill labels, we'll classify by ball distance
    processed = 0
    skipped = 0

    with open(args.csv, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                distance = float(row.get("Distance", 0) or 0)
                # Rough skill estimate: >200 yards with driver = decent
                club = row.get("ClubType", "")
                if club.startswith("W") and distance > 220:
                    skill = "pro"
                elif distance > 150:
                    skill = "amateur"
                else:
                    skill = "amateur"

                sample = convert_row(row, skill)
                if sample["quality_score"] is None:
                    skipped += 1
                    continue

                filename = f"caddieset_{uuid.uuid4().hex[:8]}.json"
                path = os.path.join(args.output_dir, filename)
                with open(path, "w") as out:
                    json.dump(sample, out)

                processed += 1
                if processed % 200 == 0:
                    print(f"  Processed {processed} swings...")

            except Exception as e:
                skipped += 1
                continue

    print(f"\nConverted {processed} swings, skipped {skipped}")
    print(f"Output: {args.output_dir}")


if __name__ == "__main__":
    main()
