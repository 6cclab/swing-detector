#!/usr/bin/env python3
import argparse
import json
import sys
import time

sys.path.insert(0, ".")

from app.pipeline.orchestrator import analyze_swing


def main():
    parser = argparse.ArgumentParser(description="Analyze a golf swing video")
    parser.add_argument("--video", required=True, help="Path to video file (MP4/MOV)")
    parser.add_argument("--handedness", default="right", choices=["right", "left"])
    parser.add_argument("--fps", type=int, default=30, help="Target FPS for extraction")
    parser.add_argument(
        "--model-complexity",
        type=int,
        default=1,
        choices=[0, 1, 2],
        help="MediaPipe model complexity (0=lite, 1=full, 2=heavy)",
    )
    parser.add_argument(
        "--no-frames",
        action="store_true",
        help="Exclude pose frame data from output (smaller JSON)",
    )
    args = parser.parse_args()

    print(f"Analyzing: {args.video}")
    print(f"Handedness: {args.handedness}, FPS: {args.fps}, Model: {args.model_complexity}")
    print("---")

    start = time.time()
    result = analyze_swing(
        video_path=args.video,
        handedness=args.handedness,
        target_fps=args.fps,
        model_complexity=args.model_complexity,
    )
    elapsed = time.time() - start

    output = result.model_dump(mode="json")
    if args.no_frames:
        output.pop("pose_frames", None)

    print(json.dumps(output, indent=2))
    print(f"\n--- Analysis completed in {elapsed:.1f}s ---")
    print(f"Overall Score: {result.overall_score}/100")
    print(f"Phases detected: {len(result.phases_detected)}")
    print(f"Frames processed: {result.frame_count}")

    if result.coaching_summary:
        print("\nTop coaching tips:")
        for i, tip in enumerate(result.coaching_summary, 1):
            print(f"  {i}. {tip}")


if __name__ == "__main__":
    main()
