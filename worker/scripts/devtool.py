#!/usr/bin/env python3
"""Interactive devtool — scrub through a swing video and see every pipeline decision.

Runs the full analysis pipeline on a video, then serves a local web UI at
http://localhost:8787 where you can inspect every frame with skeleton overlays,
velocity curves, segment boundaries, and phase labels.

Usage:
    cd worker
    uv run python scripts/devtool.py --video path/to/video.mov
    uv run python scripts/devtool.py --video path/to/video.mov --port 9000
    uv run python scripts/devtool.py --video path/to/video.mov --handedness left

Options:
    --video         Path to a .mov/.mp4 swing video (required)
    --handedness    right (default) or left
    --port          HTTP port for the UI (default: 8787)

Controls:
    ← →             Step one frame forward/back
    Space            Play/pause at ~30fps
    1-9              Jump to segment N
    Click timeline   Scrub to that position
    Drag timeline    Continuous scrubbing
    Drag slider      Frame-level scrubbing

What it shows:
    - Skeleton overlay: orange = your pose, green = ghost pro form (when visible)
    - Sidebar: frame number, time, velocity, acceleration, wrist position,
      current segment, current phase
    - Timeline: velocity curves (narrow=transparent, wide=solid), colored segment
      regions (bright=valid swing, dim=rejected), white playhead
    - Segment list: click to jump, shows phase breakdown and valid/invalid status
"""
import argparse
import io
import json
import os
import sys
import tempfile
import time

sys.path.insert(0, ".")

import cv2
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Global state — populated after analysis
STATE = {}


def analyze(video_path: str, handedness: str = "right"):
    from app.pipeline.video_processor import extract_frames
    from app.pipeline.pose_estimator import estimate_poses
    from app.pipeline.phase_detector import (
        _wrist_positions, _wrist_velocity, _smooth, detect_phases,
    )
    from app.pipeline.swing_splitter import detect_swing_boundaries
    from app.pipeline.frame_renderer import render_skeleton_on_frame, render_ghost_overlay
    from app.pipeline.ghost_pose import generate_ghost_pose
    from app.pipeline.orchestrator import (
        _validate_segments, MIN_ADDRESS_FRAMES, MIN_BACKSWING_FRAMES, MIN_SWING_CORE_FRAMES,
    )
    from app.schemas.analysis import Landmark

    print("Extracting frames...")
    ext = extract_frames(video_path)
    fi = max(1, round(ext.original_fps / 30))

    print("Running pose estimation...")
    poses = estimate_poses(ext.frames, ext.timestamps_ms)

    print("Computing velocity & phases...")
    wrist_pos = _wrist_positions(poses, handedness)
    wrist_vel = _smooth(_wrist_velocity(wrist_pos), window=5)
    wrist_vel_wide = _smooth(_wrist_velocity(wrist_pos), window=21)
    accel = np.diff(wrist_vel)

    segments = detect_swing_boundaries(poses, handedness)
    valid_segments = _validate_segments(segments, poses, handedness)

    # Per-segment phase info
    seg_phases = {}
    for si, (s, e) in enumerate(segments):
        try:
            ph = detect_phases(poses[s:e + 1], handedness)
            seg_phases[si] = [(p.phase, p.start_frame + s, p.end_frame + s) for p in ph]
        except ValueError:
            seg_phases[si] = []

    # Pre-render skeleton frames
    print("Pre-rendering skeleton frames...")
    skeleton_cache = {}
    for idx, pf in enumerate(poses):
        frame = ext.frames[pf.frame_index].copy()
        lms = pf.landmarks

        # Find which segment/phase this frame belongs to
        phase_name = None
        for si, (s, e) in enumerate(segments):
            if s <= idx <= e:
                for ph_name, ph_start, ph_end in seg_phases.get(si, []):
                    if ph_start <= idx <= ph_end:
                        phase_name = ph_name
                        break
                break

        # Draw ghost overlay if available
        if phase_name:
            ghost = generate_ghost_pose(lms, phase_name, handedness)
            if ghost:
                frame = render_ghost_overlay(frame, ghost)

        # Draw user skeleton
        frame = render_skeleton_on_frame(frame, lms)

        _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        skeleton_cache[idx] = jpeg.tobytes()

    # Build timeline data
    timeline = []
    for idx in range(len(poses)):
        t_sec = poses[idx].frame_index * fi / ext.original_fps
        entry = {
            "t": round(t_sec, 3),
            "vel": round(float(wrist_vel[idx]), 5),
            "vel_wide": round(float(wrist_vel_wide[idx]), 5),
            "wrist_x": round(float(wrist_pos[idx, 0]), 4),
            "wrist_y": round(float(wrist_pos[idx, 1]), 4),
        }
        if idx < len(accel):
            entry["accel"] = round(float(accel[idx]), 5)
        timeline.append(entry)

    # Segment data
    seg_data = []
    valid_set = set((s, e) for s, e in valid_segments)
    for si, (s, e) in enumerate(segments):
        phases_list = [{"phase": p, "start": ps, "end": pe} for p, ps, pe in seg_phases.get(si, [])]
        seg_data.append({
            "idx": si + 1,
            "start": s, "end": e,
            "t_start": round(poses[s].frame_index * fi / ext.original_fps, 2),
            "t_end": round(poses[e].frame_index * fi / ext.original_fps, 2),
            "valid": (s, e) in valid_set,
            "phases": phases_list,
        })

    STATE.update({
        "skeleton_cache": skeleton_cache,
        "timeline": timeline,
        "segments": seg_data,
        "n_poses": len(poses),
        "fps": ext.original_fps,
        "duration": ext.timestamps_ms[-1] / 1000 if ext.timestamps_ms else 0,
    })


def _parse_multipart_file(body: bytes, boundary: bytes, field_name: str) -> tuple:
    """Extract a file from multipart form data. Returns (filename, data) or (None, None)."""
    delimiter = b"--" + boundary
    parts = body.split(delimiter)
    for part in parts:
        if b"Content-Disposition" not in part:
            continue
        header_end = part.find(b"\r\n\r\n")
        if header_end == -1:
            continue
        header = part[:header_end].decode(errors="ignore")
        if f'name="{field_name}"' not in header:
            continue
        payload = part[header_end + 4:]
        if payload.endswith(b"\r\n"):
            payload = payload[:-2]
        if payload.endswith(b"--"):
            payload = payload[:-2]
        if payload.endswith(b"\r\n"):
            payload = payload[:-2]
        filename = "upload.mov"
        if 'filename="' in header:
            filename = header.split('filename="')[1].split('"')[0]
        return filename, payload
    return None, None


class DevToolHandler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == "/":
            self._html()
        elif path == "/api/data":
            if not STATE.get("n_poses"):
                self._json({"empty": True})
            else:
                self._json({
                    "timeline": STATE["timeline"],
                    "segments": STATE["segments"],
                    "n_poses": STATE["n_poses"],
                    "duration": STATE["duration"],
                    "video_name": STATE.get("video_name", ""),
                })
        elif path == "/api/frame":
            idx = int(params.get("idx", [0])[0])
            self._jpeg(idx)
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == "/api/upload":
            self._handle_upload()
        else:
            self.send_error(404)

    def _handle_upload(self):
        content_type = self.headers.get("Content-Type", "")
        content_length = int(self.headers.get("Content-Length", 0))

        if "multipart/form-data" not in content_type or "boundary=" not in content_type:
            self._json({"error": "Expected multipart/form-data"})
            return

        boundary = content_type.split("boundary=")[1].strip().encode()
        body = self.rfile.read(content_length)

        filename, file_data = _parse_multipart_file(body, boundary, "video")
        if file_data is None:
            self._json({"error": "No video file found in upload"})
            return

        ext = os.path.splitext(filename)[1] or ".mov"
        tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
        tmp.write(file_data)
        tmp.close()

        size_mb = len(file_data) / 1024 / 1024
        print(f"\nProcessing uploaded file: {filename} ({size_mb:.1f}MB)")
        try:
            analyze(tmp.name, "right")
            STATE["video_name"] = filename
            print(f"Ready — {STATE['n_poses']} frames, {len(STATE['segments'])} segments")
            self._json({"ok": True, "n_poses": STATE["n_poses"]})
        except Exception as e:
            print(f"Analysis failed: {e}")
            self._json({"error": str(e)})
        finally:
            os.unlink(tmp.name)

    def _json(self, data):
        body = json.dumps(data, default=lambda o: int(o) if isinstance(o, np.integer) else float(o) if isinstance(o, np.floating) else o).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _jpeg(self, idx):
        jpeg = STATE["skeleton_cache"].get(idx)
        if not jpeg:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", len(jpeg))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(jpeg)

    def _html(self):
        body = HTML.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)


HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Swing DevTool</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body { background: #111; color: #ddd; font-family: -apple-system, sans-serif; display: flex; overflow: hidden; }
#sidebar { width: 340px; border-right: 1px solid #333; padding: 16px; overflow-y: auto; flex-shrink: 0; min-height: 0; }
#main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
#frame-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #000; position: relative; min-height: 0; overflow: hidden; }
#frame-img { max-width: 100%; max-height: 100%; object-fit: contain; }
#frame-overlay { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); padding: 8px 12px; border-radius: 8px; font-size: 12px; font-family: monospace; }
#controls { padding: 12px 16px; border-top: 1px solid #333; background: #1a1a1a; }
#timeline-canvas { width: 100%; height: 120px; cursor: crosshair; display: block; }
#scrubber { width: 100%; height: 24px; margin-top: 4px; accent-color: #BDB76B; cursor: pointer; -webkit-appearance: none; appearance: none; background: transparent; }
#scrubber::-webkit-slider-runnable-track { height: 6px; background: #333; border-radius: 3px; }
#scrubber::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #BDB76B; margin-top: -5px; cursor: grab; }
#scrubber::-webkit-slider-thumb:active { cursor: grabbing; background: #ddd; }
h2 { font-size: 14px; color: #BDB76B; margin: 16px 0 8px; }
h2:first-child { margin-top: 0; }
.seg { padding: 8px; margin: 4px 0; border-radius: 6px; border: 1px solid #333; cursor: pointer; font-size: 12px; }
.seg:hover { border-color: #666; }
.seg.valid { border-left: 3px solid #4CAF50; }
.seg.invalid { border-left: 3px solid #ef5350; opacity: 0.6; }
.seg.active { background: #222; border-color: #BDB76B; }
.phase-list { font-size: 11px; color: #888; margin-top: 4px; }
.stat-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; border-bottom: 1px solid #1a1a1a; }
.stat-label { color: #888; }
.stat-val { font-family: monospace; color: #ddd; }
.keys { font-size: 11px; color: #666; margin-top: 12px; }
.keys kbd { background: #222; border: 1px solid #444; border-radius: 3px; padding: 1px 5px; font-size: 10px; }
#landing { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; }
#drop-zone { width: 400px; height: 240px; border: 2px dashed #444; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
#drop-zone:hover, #drop-zone.drag-over { border-color: #BDB76B; background: rgba(189,183,107,0.05); }
#drop-zone * { pointer-events: none; }
#drop-zone .icon { font-size: 48px; opacity: 0.4; }
#drop-zone .label { color: #888; font-size: 14px; }
#drop-zone .sublabel { color: #555; font-size: 12px; }
#loading-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; z-index: 100; }
#loading-overlay .spinner { width: 32px; height: 32px; border: 3px solid #333; border-top-color: #BDB76B; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.open-btn { background: none; border: 1px solid #444; color: #888; padding: 4px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; margin-top: 8px; }
.open-btn:hover { border-color: #BDB76B; color: #BDB76B; }
#video-name { color: #BDB76B; font-size: 12px; margin-bottom: 8px; font-family: monospace; }
</style>
</head>
<body>
<div id="loading-overlay" style="display:none">
    <div class="spinner"></div>
    <div style="color:#888;font-size:14px" id="loading-text">Analyzing video...</div>
</div>
<input type="file" id="file-input" accept="video/*,.mov,.mp4,.avi,.mkv" style="display:none">
<div id="sidebar">
    <div id="video-name"></div>
    <h2>Frame Info</h2>
    <div id="frame-info"></div>
    <h2>Segments</h2>
    <div id="segments"></div>
    <div class="keys">
        <kbd>←</kbd> <kbd>→</kbd> step frames &nbsp;
        <kbd>Space</kbd> play/pause<br>
        <kbd>1-6</kbd> jump to phase &nbsp;
        <kbd>Shift+1-9</kbd> jump to segment
    </div>
    <button class="open-btn" id="open-btn" onclick="document.getElementById('file-input').click()">Open another file</button>
</div>
<div id="main">
    <div id="frame-container">
        <div id="landing">
            <div id="drop-zone">
                <div class="icon">🎬</div>
                <div class="label">Drop a swing video here</div>
                <div class="sublabel">or click to browse</div>
            </div>
        </div>
        <img id="frame-img" src="" style="display:none">
        <div id="frame-overlay" style="display:none"></div>
    </div>
    <div id="controls" style="display:none">
        <canvas id="timeline-canvas"></canvas>
        <input type="range" id="scrubber" min="0" max="1" value="0" step="1">
    </div>
</div>

<script>
let data = null;
let currentIdx = 0;
let playing = false;
let playTimer = null;

async function init() {
    const res = await fetch('/api/data');
    const payload = await res.json();

    if (payload.empty) {
        showLanding();
    } else {
        loadData(payload);
    }

    const scrubber = document.getElementById('scrubber');
    scrubber.addEventListener('input', e => goToFrame(+e.target.value));
    scrubber.addEventListener('change', () => scrubber.blur());
    document.getElementById('timeline-canvas').addEventListener('click', onTimelineClick);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => { if (data) drawTimeline(); });

    // File input
    document.getElementById('file-input').addEventListener('change', e => {
        if (e.target.files[0]) uploadFile(e.target.files[0]);
    });

    // Drop zone
    const dz = document.getElementById('drop-zone');
    if (dz) {
        dz.addEventListener('click', () => document.getElementById('file-input').click());
        dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
        dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
        dz.addEventListener('drop', e => {
            e.preventDefault();
            dz.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
        });
    }

    // Also allow drop on the whole window when a video is loaded
    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', e => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
    });
}

function showLanding() {
    document.getElementById('landing').style.display = 'flex';
    document.getElementById('frame-img').style.display = 'none';
    document.getElementById('frame-overlay').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('open-btn').style.display = 'none';
}

function showPlayer() {
    document.getElementById('landing').style.display = 'none';
    document.getElementById('frame-img').style.display = '';
    document.getElementById('frame-overlay').style.display = '';
    document.getElementById('controls').style.display = '';
    document.getElementById('open-btn').style.display = '';
}

async function uploadFile(file) {
    document.getElementById('loading-overlay').style.display = 'flex';
    document.getElementById('loading-text').textContent = 'Analyzing ' + file.name + '...';

    const form = new FormData();
    form.append('video', file);

    try {
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const result = await res.json();
        if (result.error) {
            alert('Analysis failed: ' + result.error);
        } else {
            const dataRes = await fetch('/api/data');
            loadData(await dataRes.json());
        }
    } catch (e) {
        alert('Upload failed: ' + e.message);
    }
    document.getElementById('loading-overlay').style.display = 'none';
}

function loadData(payload) {
    data = payload;
    document.getElementById('scrubber').max = data.n_poses - 1;
    document.getElementById('video-name').textContent = data.video_name || '';
    showPlayer();
    renderSegments();
    drawTimeline();
    goToFrame(0);
}

function goToFrame(idx) {
    idx = Math.max(0, Math.min(idx, data.n_poses - 1));
    currentIdx = idx;
    document.getElementById('frame-img').src = '/api/frame?idx=' + idx;
    document.getElementById('scrubber').value = idx;
    updateInfo();
    drawTimeline();
}

function updateInfo() {
    const d = data.timeline[currentIdx];
    if (!d) return;

    // Find segment & phase
    let segLabel = 'none', phaseLabel = 'none', segValid = false;
    for (const seg of data.segments) {
        if (currentIdx >= seg.start && currentIdx <= seg.end) {
            segLabel = 'Seg ' + seg.idx + (seg.valid ? ' ✓' : ' ✗');
            segValid = seg.valid;
            for (const ph of seg.phases) {
                if (currentIdx >= ph.start && currentIdx <= ph.end) {
                    phaseLabel = ph.phase.replace(/_/g, ' ');
                    break;
                }
            }
            break;
        }
    }

    const rows = [
        ['Frame', currentIdx + ' / ' + data.n_poses],
        ['Time', d.t.toFixed(2) + 's'],
        ['Velocity', d.vel.toFixed(4)],
        ['Vel (wide)', d.vel_wide.toFixed(4)],
        ['Accel', (d.accel || 0).toFixed(5)],
        ['Wrist X', d.wrist_x.toFixed(3)],
        ['Wrist Y', d.wrist_y.toFixed(3)],
        ['Segment', segLabel],
        ['Phase', phaseLabel],
    ];

    document.getElementById('frame-info').innerHTML = rows.map(([l, v]) =>
        `<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`
    ).join('');

    document.getElementById('frame-overlay').innerHTML =
        `<span style="color:#BDB76B">Frame ${currentIdx}</span> ${d.t.toFixed(2)}s ` +
        `<span style="color:${segValid ? '#4CAF50' : '#ef5350'}">${segLabel}</span> ` +
        `<span style="color:#FFD700">${phaseLabel}</span>`;

    // Highlight active segment
    document.querySelectorAll('.seg').forEach(el => el.classList.remove('active'));
    for (const seg of data.segments) {
        if (currentIdx >= seg.start && currentIdx <= seg.end) {
            const el = document.getElementById('seg-' + seg.idx);
            if (el) el.classList.add('active');
        }
    }
}

function renderSegments() {
    const html = data.segments.map(seg => {
        const cls = seg.valid ? 'valid' : 'invalid';
        const phases = seg.phases.map(p => p.phase.replace(/_/g,' ')).join(' → ');
        return `<div class="seg ${cls}" id="seg-${seg.idx}" onclick="goToFrame(${seg.start})">
            <b>Segment ${seg.idx}</b> ${seg.valid ? '✓' : '✗'}
            <span style="float:right;color:#888">${seg.t_start}s – ${seg.t_end}s</span>
            <div class="phase-list">${phases}</div>
        </div>`;
    }).join('');
    document.getElementById('segments').innerHTML = html;
}

function drawTimeline() {
    const canvas = document.getElementById('timeline-canvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const n = data.n_poses;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Segment regions
    const segColors = ['#4CAF50','#2196F3','#FF9800','#9C27B0','#00BCD4','#F44336','#8BC34A','#FF5722','#3F51B5'];
    data.segments.forEach((seg, i) => {
        const x1 = seg.start / n * w, x2 = seg.end / n * w;
        ctx.fillStyle = segColors[i % segColors.length];
        ctx.globalAlpha = seg.valid ? 0.15 : 0.05;
        ctx.fillRect(x1, 0, x2 - x1, h);
    });
    ctx.globalAlpha = 1;

    // Velocity curves
    const maxVel = Math.max(...data.timeline.map(d => d.vel), 0.001);
    const maxVelW = Math.max(...data.timeline.map(d => d.vel_wide), 0.001);

    // Narrow velocity
    ctx.strokeStyle = 'rgba(189,183,107,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    data.timeline.forEach((d, i) => {
        const x = i / n * w;
        const y = h - (d.vel / maxVel) * h * 0.9;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Wide velocity
    ctx.strokeStyle = '#BDB76B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.timeline.forEach((d, i) => {
        const x = i / n * w;
        const y = h - (d.vel_wide / maxVelW) * h * 0.9;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Playhead
    const px = currentIdx / n * w;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
}

let draggingTimeline = false;

function scrubTimeline(e) {
    const canvas = document.getElementById('timeline-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    goToFrame(Math.round(x * (data.n_poses - 1)));
}

function onTimelineClick(e) { scrubTimeline(e); }

document.addEventListener('mousedown', e => {
    if (e.target.id === 'timeline-canvas') { draggingTimeline = true; scrubTimeline(e); }
});
document.addEventListener('mousemove', e => { if (draggingTimeline) scrubTimeline(e); });
document.addEventListener('mouseup', () => { draggingTimeline = false; });

function onKey(e) {
    if (!data) return;
    const key = e.key;
    if (key === 'ArrowRight') { e.preventDefault(); goToFrame(currentIdx + 1); }
    else if (key === 'ArrowLeft') { e.preventDefault(); goToFrame(currentIdx - 1); }
    else if (key === ' ') { e.preventDefault(); togglePlay(); }
    else {
        // e.code is "Digit1"-"Digit9" regardless of shift
        const digitMatch = e.code && e.code.match(/^Digit(\d)$/);
        if (!digitMatch) return;
        const num = parseInt(digitMatch[1]);

        if (e.shiftKey) {
            // Shift+number jumps to segment
            if (num >= 1 && num <= data.segments.length) {
                e.preventDefault();
                goToFrame(data.segments[num - 1].start);
            }
        } else {
            // Number jumps to phase within current segment
            const seg = data.segments.find(s => currentIdx >= s.start && currentIdx <= s.end);
            if (seg && num >= 1 && num <= seg.phases.length) {
                e.preventDefault();
                const ph = seg.phases[num - 1];
                goToFrame(Math.floor((ph.start + ph.end) / 2));
            }
        }
    }
}

function togglePlay() {
    playing = !playing;
    if (playing) {
        playTimer = setInterval(() => {
            if (currentIdx >= data.n_poses - 1) { playing = false; clearInterval(playTimer); return; }
            goToFrame(currentIdx + 1);
        }, 33);
    } else {
        clearInterval(playTimer);
    }
}

init();
</script>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser(description="Interactive swing devtool")
    parser.add_argument("--video", default=None, help="Path to video (optional — can also drop files in the UI)")
    parser.add_argument("--handedness", default="right", choices=["right", "left"])
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()

    if args.video:
        print(f"Processing {args.video}...")
        t0 = time.time()
        analyze(args.video, args.handedness)
        STATE["video_name"] = os.path.basename(args.video)
        print(f"Ready in {time.time() - t0:.1f}s — {STATE['n_poses']} frames cached")
    else:
        print("No video specified — drop a file in the browser to start")

    print(f"\n  → http://localhost:{args.port}\n")
    print("Controls: ←→ step, Space play/pause, 1-9 jump to segment, drag to scrub, drop files to load")

    server = HTTPServer(("127.0.0.1", args.port), DevToolHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
