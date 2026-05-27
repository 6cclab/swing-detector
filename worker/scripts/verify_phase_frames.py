#!/usr/bin/env python3
"""Render phase frames and optionally verify with Claude vision.

Runs analysis, renders skeleton-overlay frames for each phase, saves to disk,
and optionally sends them to Claude for automated verification.

Usage:
    cd worker
    uv run python scripts/verify_phase_frames.py --video path/to/video.mov --output-dir /tmp/frames
    uv run python scripts/verify_phase_frames.py --video path/to/video.mov --skip-verify

Options:
    --video         Path to a .mov/.mp4 swing video (required)
    --handedness    right (default) or left
    --output-dir    Directory to save rendered JPEG frames
    --skip-verify   Skip Claude API verification (just render and save)
"""
import argparse
import base64
import json
import os
import sys
import time

sys.path.insert(0, ".")

from app.pipeline.orchestrator import analyze_swing
from app.pipeline.frame_renderer import render_key_frames


PHASE_ORDER = [
    "address", "backswing", "top_of_backswing",
    "downswing", "impact", "follow_through",
]


def main():
    parser = argparse.ArgumentParser(description="Verify phase frame mapping with Claude vision")
    parser.add_argument("--video", required=True, help="Path to video file")
    parser.add_argument("--handedness", default="right", choices=["right", "left"])
    parser.add_argument("--output-dir", default=None, help="Save frames to this directory")
    parser.add_argument("--skip-verify", action="store_true", help="Only render, don't call Claude")
    args = parser.parse_args()

    print(f"Analyzing: {args.video}")
    # Force rule-based detector to avoid ML classifier issues
    import app.pipeline.orchestrator as _orch
    _orig = _orch.ml_detect_phases if hasattr(_orch, "ml_detect_phases") else None
    try:
        # Block ML import so orchestrator falls back to rule-based
        import app.ml.inference as _inf
        _save = _inf.ml_detect_phases
        _inf.ml_detect_phases = lambda *a, **k: None
    except (ImportError, AttributeError):
        _save = None
    result = analyze_swing(video_path=args.video, handedness=args.handedness)
    if _save:
        _inf.ml_detect_phases = _save
    analysis = result.model_dump(mode="json")

    phases_detected = analysis["phases_detected"]
    pose_frames = analysis["pose_frames"]

    phase_key_frames = {}
    for phase in phases_detected:
        start = phase["start_frame"]
        end = phase["end_frame"]
        mid = (start + end) // 2
        if mid < len(pose_frames):
            phase_key_frames[phase["phase"]] = pose_frames[mid]["frame_index"]

    print(f"\nPhase key frame mapping (extracted frame indices):")
    for phase in PHASE_ORDER:
        if phase in phase_key_frames:
            print(f"  {phase:20s} -> frame {phase_key_frames[phase]}")

    rendered = render_key_frames(
        video_path=args.video,
        pose_frames_data=pose_frames,
        phase_key_frames=phase_key_frames,
        handedness=args.handedness,
    )

    if args.output_dir:
        os.makedirs(args.output_dir, exist_ok=True)
        for phase, jpeg_bytes in rendered.items():
            path = os.path.join(args.output_dir, f"{phase}.jpg")
            with open(path, "wb") as f:
                f.write(jpeg_bytes)
            print(f"Saved: {path}")

    if args.skip_verify:
        print("\nSkipped Claude verification (--skip-verify)")
        return

    try:
        import anthropic
    except ImportError:
        print("\nInstall anthropic SDK to verify: pip install anthropic")
        sys.exit(1)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\nSet ANTHROPIC_API_KEY to verify with Claude")
        sys.exit(1)

    client = anthropic.Anthropic()

    content = [
        {
            "type": "text",
            "text": (
                "You are verifying golf swing phase frame extraction. "
                "I'll show you images labeled with their detected swing phase. "
                "For each image, tell me:\n"
                "1. What phase the golfer ACTUALLY appears to be in\n"
                "2. Whether it matches the label (MATCH or MISMATCH)\n\n"
                "Golf swing phases in order:\n"
                "- Address: standing still, club behind ball, ready to swing\n"
                "- Backswing: club moving back, arms rising\n"
                "- Top of Backswing: club at highest point behind, shoulders fully rotated\n"
                "- Downswing: club coming down toward ball\n"
                "- Impact: club striking the ball, arms extended down\n"
                "- Follow Through: after contact, club wrapping around body\n\n"
                "Be strict — if the image is off by even one phase, mark it MISMATCH.\n"
                "End with a summary line: X/Y phases correct."
            ),
        }
    ]

    for phase in PHASE_ORDER:
        if phase not in rendered:
            continue
        b64 = base64.standard_b64encode(rendered[phase]).decode()
        label = phase.replace("_", " ").title()
        content.append({"type": "text", "text": f"\n### Label: {label}"})
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
        })

    print("\nSending to Claude for verification...")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": content}],
    )

    print("\n" + "=" * 60)
    print("CLAUDE VERIFICATION RESULT")
    print("=" * 60)
    print(response.content[0].text)


if __name__ == "__main__":
    main()
