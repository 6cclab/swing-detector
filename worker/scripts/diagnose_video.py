#!/usr/bin/env python3
"""Static HTML diagnostic report — visualizes every pipeline decision for a swing video.

Generates a self-contained HTML file with velocity charts, peak detection breakdown,
segment validation details, and rendered phase frames for each valid swing.

Usage:
    cd worker
    uv run python scripts/diagnose_video.py --video path/to/video.mov
    uv run python scripts/diagnose_video.py --video path/to/video.mov --output my_report.html

Options:
    --video         Path to a .mov/.mp4 swing video (required)
    --handedness    right (default) or left
    --output        Output HTML path (default: /tmp/swing_diagnosis.html)
"""
import argparse
import base64
import io
import json
import os
import sys
import time

sys.path.insert(0, ".")

import cv2
import numpy as np


def main():
    parser = argparse.ArgumentParser(description="Diagnose swing video pipeline decisions")
    parser.add_argument("--video", required=True)
    parser.add_argument("--handedness", default="right", choices=["right", "left"])
    parser.add_argument("--output", default=None, help="Output HTML path (default: /tmp/swing_diagnosis.html)")
    args = parser.parse_args()

    if args.output is None:
        args.output = "/tmp/swing_diagnosis.html"

    print(f"Analyzing: {args.video}")
    start = time.time()

    from app.pipeline.video_processor import extract_frames
    from app.pipeline.pose_estimator import estimate_poses
    from app.pipeline.phase_detector import (
        _wrist_positions, _wrist_velocity, _smooth, detect_phases,
    )
    from app.pipeline.swing_splitter import (
        detect_swing_boundaries, _find_peaks_above, _filter_close_peaks,
    )
    from app.pipeline.frame_renderer import render_key_frames
    from app.pipeline.orchestrator import (
        MIN_ADDRESS_FRAMES, MIN_BACKSWING_FRAMES, MIN_SWING_CORE_FRAMES,
    )

    # --- Step 1: Extract & Pose ---
    ext = extract_frames(args.video)
    poses = estimate_poses(ext.frames, ext.timestamps_ms)
    fi = max(1, round(ext.original_fps / 30))

    cap = cv2.VideoCapture(args.video)
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()

    elapsed_extract = time.time() - start

    # --- Step 2: Velocity analysis ---
    wrist_pos = _wrist_positions(poses, args.handedness)
    wrist_vel_narrow = _smooth(_wrist_velocity(wrist_pos), window=5)
    wrist_vel_wide = _smooth(_wrist_velocity(wrist_pos), window=21)
    max_vel = np.max(wrist_vel_wide)

    accel = np.diff(wrist_vel_narrow)

    # --- Step 3: Peak detection (reproduce splitter logic) ---
    low_threshold = 0.15 * max_vel
    candidate_peaks = _find_peaks_above(wrist_vel_wide, low_threshold)
    candidate_peaks_filtered = _filter_close_peaks(candidate_peaks, wrist_vel_wide, min_separation=90)

    median_peak_vel = np.median([wrist_vel_wide[p] for p in candidate_peaks_filtered]) if candidate_peaks_filtered else max_vel
    final_threshold = 0.40 * median_peak_vel
    final_peaks = [p for p in candidate_peaks_filtered if wrist_vel_wide[p] >= final_threshold]

    segments = detect_swing_boundaries(poses, args.handedness)

    # --- Step 4: Validate segments ---
    segment_details = []
    for i, (s, e) in enumerate(segments):
        seg = poses[s:e + 1]
        t_start = poses[s].frame_index * fi / ext.original_fps
        t_end = poses[e].frame_index * fi / ext.original_fps
        detail = {
            "idx": i + 1,
            "start": s, "end": e,
            "t_start": t_start, "t_end": t_end,
            "n_poses": len(seg),
            "valid": False,
            "reason": "",
            "phases": [],
        }
        try:
            phases = detect_phases(seg, args.handedness)
            pm = {p.phase: p for p in phases}
            addr_len = pm["address"].end_frame - pm["address"].start_frame + 1 if "address" in pm else 0
            bs_len = pm["backswing"].end_frame - pm["backswing"].start_frame + 1 if "backswing" in pm else 0
            core = sum(
                (pm[p].end_frame - pm[p].start_frame + 1)
                for p in ["backswing", "top_of_backswing", "downswing", "impact"] if p in pm
            )

            detail["phases"] = [
                {"phase": p.phase, "start": p.start_frame, "end": p.end_frame,
                 "frames": p.end_frame - p.start_frame + 1}
                for p in phases
            ]
            detail["addr_len"] = addr_len
            detail["bs_len"] = bs_len
            detail["core_len"] = core

            if addr_len < MIN_ADDRESS_FRAMES:
                detail["reason"] = f"address too short ({addr_len} < {MIN_ADDRESS_FRAMES})"
            elif bs_len < MIN_BACKSWING_FRAMES:
                detail["reason"] = f"backswing too short ({bs_len} < {MIN_BACKSWING_FRAMES})"
            elif core < MIN_SWING_CORE_FRAMES:
                detail["reason"] = f"swing core too short ({core} < {MIN_SWING_CORE_FRAMES})"
            else:
                detail["valid"] = True
                detail["reason"] = "passed"
        except ValueError as ex:
            detail["reason"] = f"phase detection failed: {ex}"

        segment_details.append(detail)

    # --- Step 5: Render key frames for valid segments ---
    valid_segments = [d for d in segment_details if d["valid"]]
    for seg_detail in valid_segments:
        s, e = seg_detail["start"], seg_detail["end"]
        seg_poses = poses[s:e + 1]

        phase_key_frames = {}
        for pd in seg_detail["phases"]:
            mid = (pd["start"] + pd["end"]) // 2
            if mid < len(seg_poses):
                phase_key_frames[pd["phase"]] = seg_poses[mid].frame_index

        from app.schemas.analysis import Landmark
        pose_data = [
            {"frame_index": pf.frame_index, "landmarks": [
                {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
                for lm in pf.landmarks
            ]}
            for pf in seg_poses
        ]
        rendered = render_key_frames(args.video, pose_data, phase_key_frames, handedness=args.handedness)
        seg_detail["frame_images"] = {
            phase: base64.b64encode(jpeg).decode() for phase, jpeg in rendered.items()
        }

    elapsed_total = time.time() - start

    # --- Generate HTML ---
    html = _build_html(
        video_path=args.video,
        original_fps=ext.original_fps,
        total_video_frames=total_video_frames,
        n_extracted=len(ext.frames),
        n_poses=len(poses),
        frame_interval=fi,
        elapsed_extract=elapsed_extract,
        elapsed_total=elapsed_total,
        wrist_vel_wide=wrist_vel_wide,
        wrist_vel_narrow=wrist_vel_narrow,
        accel=accel,
        max_vel=max_vel,
        low_threshold=low_threshold,
        candidate_peaks=candidate_peaks,
        candidate_peaks_filtered=candidate_peaks_filtered,
        median_peak_vel=median_peak_vel,
        final_threshold=final_threshold,
        final_peaks=final_peaks,
        segments=segments,
        segment_details=segment_details,
        poses=poses,
        fi=fi,
        fps=ext.original_fps,
    )

    with open(args.output, "w") as f:
        f.write(html)

    n_valid = len(valid_segments)
    print(f"Done in {elapsed_total:.1f}s — {len(segments)} raw segments, {n_valid} valid swings")
    print(f"Report: {args.output}")


def _svg_chart(
    data: np.ndarray,
    width: int = 900,
    height: int = 200,
    color: str = "#8B8B00",
    markers: list = None,
    h_lines: list = None,
    regions: list = None,
) -> str:
    """Generate an inline SVG line chart."""
    if len(data) == 0:
        return "<p>No data</p>"

    pad = 40
    w = width - 2 * pad
    h = height - 2 * pad
    max_val = np.max(np.abs(data)) or 1
    min_val = np.min(data)
    val_range = max_val - min_val or 1

    def tx(i):
        return pad + (i / max(len(data) - 1, 1)) * w

    def ty(v):
        return pad + h - ((v - min_val) / val_range) * h

    parts = [f'<svg width="{width}" height="{height}" style="background:#1a1a1a;border-radius:8px;">']

    if regions:
        for rs, re, rc, rl in regions:
            x1, x2 = tx(rs), tx(re)
            parts.append(f'<rect x="{x1}" y="{pad}" width="{x2-x1}" height="{h}" fill="{rc}" opacity="0.15"/>')
            parts.append(f'<text x="{(x1+x2)/2}" y="{pad+12}" text-anchor="middle" fill="{rc}" font-size="9" opacity="0.7">{rl}</text>')

    if h_lines:
        for val, lc, ll in h_lines:
            y = ty(val)
            parts.append(f'<line x1="{pad}" y1="{y}" x2="{pad+w}" y2="{y}" stroke="{lc}" stroke-dasharray="4,4" opacity="0.5"/>')
            parts.append(f'<text x="{pad+w+4}" y="{y+4}" fill="{lc}" font-size="9">{ll}</text>')

    points = " ".join(f"{tx(i)},{ty(data[i])}" for i in range(len(data)))
    parts.append(f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="1.5" opacity="0.8"/>')

    # Zero line
    if min_val < 0:
        y0 = ty(0)
        parts.append(f'<line x1="{pad}" y1="{y0}" x2="{pad+w}" y2="{y0}" stroke="#555" stroke-width="0.5"/>')

    if markers:
        for idx, mc, ml in markers:
            if 0 <= idx < len(data):
                cx, cy = tx(idx), ty(data[idx])
                parts.append(f'<circle cx="{cx}" cy="{cy}" r="4" fill="{mc}"/>')
                parts.append(f'<text x="{cx}" y="{cy-8}" text-anchor="middle" fill="{mc}" font-size="9">{ml}</text>')

    # Axes
    parts.append(f'<line x1="{pad}" y1="{pad}" x2="{pad}" y2="{pad+h}" stroke="#555" stroke-width="0.5"/>')
    parts.append(f'<line x1="{pad}" y1="{pad+h}" x2="{pad+w}" y2="{pad+h}" stroke="#555" stroke-width="0.5"/>')

    parts.append("</svg>")
    return "\n".join(parts)


def _build_html(**ctx) -> str:
    poses = ctx["poses"]
    fi = ctx["fi"]
    fps = ctx["fps"]

    def t(idx):
        if idx < len(poses):
            return f"{poses[idx].frame_index * fi / fps:.1f}s"
        return "?"

    css = """
    body { background: #111; color: #ddd; font-family: -apple-system, sans-serif; padding: 20px; max-width: 960px; margin: auto; }
    h1 { color: #BDB76B; font-size: 22px; }
    h2 { color: #8B8B00; font-size: 16px; margin-top: 32px; border-bottom: 1px solid #333; padding-bottom: 6px; }
    h3 { color: #9a9a60; font-size: 14px; }
    .card { background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 16px; margin: 12px 0; }
    .stat { display: inline-block; margin-right: 24px; }
    .stat-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .stat-value { font-size: 20px; font-weight: 700; color: #ddd; }
    .valid { color: #4CAF50; } .invalid { color: #ef5350; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #222; }
    th { color: #888; font-size: 11px; text-transform: uppercase; }
    .phase-bar { display: inline-block; height: 8px; border-radius: 4px; margin-right: 2px; }
    .frames-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .frame-card { text-align: center; }
    .frame-card img { height: 180px; border-radius: 6px; border: 1px solid #333; }
    .frame-card .label { font-size: 10px; color: #888; margin-top: 4px; text-transform: capitalize; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .tag-valid { background: #1b5e20; color: #81c784; }
    .tag-invalid { background: #4a1515; color: #ef9a9a; }
    """

    parts = [f"<html><head><style>{css}</style></head><body>"]
    parts.append(f"<h1>Swing Diagnosis</h1>")
    parts.append(f'<p style="color:#888">{os.path.basename(ctx["video_path"])} &middot; {ctx["elapsed_total"]:.1f}s analysis time</p>')

    # Overview stats
    parts.append('<div class="card">')
    for label, val in [
        ("FPS", f'{ctx["original_fps"]:.0f}'),
        ("Video Frames", ctx["total_video_frames"]),
        ("Extracted", ctx["n_extracted"]),
        ("Pose Frames", ctx["n_poses"]),
        ("Frame Interval", ctx["frame_interval"]),
        ("Duration", f'{ctx["total_video_frames"]/ctx["original_fps"]:.1f}s'),
    ]:
        parts.append(f'<div class="stat"><div class="stat-label">{label}</div><div class="stat-value">{val}</div></div>')
    parts.append("</div>")

    # Velocity chart
    parts.append("<h2>Wrist Velocity (wide smooth w=21)</h2>")
    markers = []
    for p in ctx["candidate_peaks"]:
        markers.append((p, "#666", t(p)))
    for p in ctx["final_peaks"]:
        markers.append((p, "#FFD700", t(p)))

    seg_regions = []
    phase_colors = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#00BCD4", "#F44336", "#8BC34A", "#FF5722", "#3F51B5"]
    for i, d in enumerate(ctx["segment_details"]):
        c = phase_colors[i % len(phase_colors)]
        label = f'Seg {d["idx"]}' + (" ✓" if d["valid"] else " ✗")
        seg_regions.append((d["start"], d["end"], c, label))

    svg = _svg_chart(
        ctx["wrist_vel_wide"],
        markers=markers,
        h_lines=[
            (ctx["low_threshold"], "#555", f'low={ctx["low_threshold"]:.4f}'),
            (ctx["final_threshold"], "#FFD700", f'final={ctx["final_threshold"]:.4f}'),
        ],
        regions=seg_regions,
    )
    parts.append(svg)
    parts.append(f'<p style="font-size:12px;color:#888">Gold dots = final peaks. Gray dots = candidates filtered out. Colored regions = detected segments.</p>')

    # Acceleration chart
    parts.append("<h2>Wrist Acceleration (narrow smooth w=5)</h2>")
    svg2 = _svg_chart(ctx["accel"], color="#ef5350")
    parts.append(svg2)

    # Peak detection details
    parts.append("<h2>Peak Detection</h2>")
    parts.append('<div class="card">')
    parts.append(f'<p>Max velocity: <b>{ctx["max_vel"]:.4f}</b></p>')
    parts.append(f'<p>Low threshold (15% of max): <b>{ctx["low_threshold"]:.4f}</b> → {len(ctx["candidate_peaks"])} candidates</p>')
    parts.append(f'<p>After separation filter (90 frames): {len(ctx["candidate_peaks_filtered"])} peaks</p>')
    parts.append(f'<p>Median peak velocity: <b>{ctx["median_peak_vel"]:.4f}</b></p>')
    parts.append(f'<p>Final threshold (40% of median): <b>{ctx["final_threshold"]:.4f}</b> → <b>{len(ctx["final_peaks"])} peaks</b></p>')
    parts.append("</div>")

    # Segment validation
    parts.append("<h2>Segment Validation</h2>")
    for d in ctx["segment_details"]:
        tag_cls = "tag-valid" if d["valid"] else "tag-invalid"
        tag_text = "VALID" if d["valid"] else "REJECTED"
        parts.append(f'<div class="card">')
        parts.append(f'<h3>Segment {d["idx"]} <span class="tag {tag_cls}">{tag_text}</span></h3>')
        parts.append(f'<p>Time: {d["t_start"]:.1f}s – {d["t_end"]:.1f}s ({d["n_poses"]} poses)</p>')
        parts.append(f'<p>Verdict: <b>{d["reason"]}</b></p>')

        if d["phases"]:
            parts.append("<table><tr><th>Phase</th><th>Frames</th><th>Duration</th><th>Bar</th></tr>")
            total_f = d["n_poses"]
            for pd in d["phases"]:
                pct = pd["frames"] / total_f * 100 if total_f else 0
                bar_color = {"address": "#888", "backswing": "#4CAF50", "top_of_backswing": "#8BC34A",
                             "downswing": "#FF9800", "impact": "#F44336", "follow_through": "#2196F3"}.get(pd["phase"], "#666")
                parts.append(f'<tr><td>{pd["phase"]}</td><td>{pd["frames"]}</td><td>{pd["start"]}–{pd["end"]}</td>'
                             f'<td><span class="phase-bar" style="width:{max(pct, 2)}%;background:{bar_color}"></span> {pct:.0f}%</td></tr>')
            parts.append("</table>")

        if d.get("frame_images"):
            parts.append('<div class="frames-row">')
            for phase in ["address", "backswing", "top_of_backswing", "downswing", "impact", "follow_through"]:
                if phase in d["frame_images"]:
                    parts.append(f'<div class="frame-card"><img src="data:image/jpeg;base64,{d["frame_images"][phase]}"/><div class="label">{phase.replace("_", " ")}</div></div>')
            parts.append("</div>")

        parts.append("</div>")

    # Summary
    n_valid = sum(1 for d in ctx["segment_details"] if d["valid"])
    parts.append("<h2>Summary</h2>")
    parts.append(f'<div class="card"><p style="font-size:18px;font-weight:700">{n_valid} valid swing(s) detected from {len(ctx["segment_details"])} raw segments</p></div>')

    parts.append("</body></html>")
    return "\n".join(parts)


if __name__ == "__main__":
    main()
