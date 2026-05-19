from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class ExtractedFrames:
    frames: list[np.ndarray]
    timestamps_ms: list[float]
    original_fps: float
    width: int
    height: int


def extract_frames(
    video_path: str,
    target_fps: int = 30,
    max_width: int = 640,
) -> ExtractedFrames:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    original_fps = cap.get(cv2.CAP_PROP_FPS)
    if original_fps <= 0:
        original_fps = 30.0

    frame_interval = max(1, round(original_fps / target_fps))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if width > max_width:
        scale = max_width / width
        width = max_width
        height = int(height * scale)

    frames: list[np.ndarray] = []
    timestamps_ms: list[float] = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_interval == 0:
            if frame.shape[1] != width:
                frame = cv2.resize(frame, (width, height))
            frames.append(frame)
            timestamps_ms.append(cap.get(cv2.CAP_PROP_POS_MSEC))

        frame_idx += 1

    cap.release()

    if not frames:
        raise ValueError(f"No frames extracted from: {video_path}")

    return ExtractedFrames(
        frames=frames,
        timestamps_ms=timestamps_ms,
        original_fps=original_fps,
        width=width,
        height=height,
    )
