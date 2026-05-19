import os

import cv2
import mediapipe as mp
import numpy as np

from app.schemas.analysis import Landmark, PoseFrame

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
_MODEL_FILES = {
    0: "pose_landmarker_lite.task",
    1: "pose_landmarker_full.task",
    2: "pose_landmarker_heavy.task",
}


def _get_model_path(model_complexity: int) -> str:
    filename = _MODEL_FILES.get(model_complexity, _MODEL_FILES[1])
    path = os.path.join(_MODEL_DIR, filename)
    if not os.path.exists(path):
        # Fall back to whichever model file exists
        for f in _MODEL_FILES.values():
            fallback = os.path.join(_MODEL_DIR, f)
            if os.path.exists(fallback):
                return fallback
        raise FileNotFoundError(
            f"No pose landmarker model found in {_MODEL_DIR}. "
            "Download from https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models"
        )
    return path


def estimate_poses(
    frames: list[np.ndarray],
    timestamps_ms: list[float],
    model_complexity: int = 1,
) -> list[PoseFrame]:
    BaseOptions = mp.tasks.BaseOptions
    PoseLandmarker = mp.tasks.vision.PoseLandmarker
    PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
    RunningMode = mp.tasks.vision.RunningMode

    model_path = _get_model_path(model_complexity)

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    pose_frames: list[PoseFrame] = []

    with PoseLandmarker.create_from_options(options) as landmarker:
        for idx, frame in enumerate(frames):
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

            ts_ms = int(timestamps_ms[idx]) if idx < len(timestamps_ms) else idx * 33
            # VIDEO mode requires strictly increasing timestamps
            result = landmarker.detect_for_video(mp_image, ts_ms)

            if not result.pose_landmarks or not result.pose_landmarks[0]:
                continue

            landmarks = [
                Landmark(
                    x=lm.x,
                    y=lm.y,
                    z=lm.z,
                    visibility=lm.visibility,
                )
                for lm in result.pose_landmarks[0]
            ]

            pose_frames.append(
                PoseFrame(
                    frame_index=idx,
                    timestamp_ms=float(ts_ms),
                    landmarks=landmarks,
                )
            )

    return pose_frames
