import cv2
import numpy as np

from app.pipeline.ghost_pose import generate_ghost_pose
from app.schemas.analysis import Landmark

# MediaPipe pose skeleton connections
CONNECTIONS = [
    (11, 12), (11, 23), (12, 24), (23, 24),  # torso
    (11, 13), (13, 15),  # left arm
    (12, 14), (14, 16),  # right arm
    (23, 25), (25, 27),  # left leg
    (24, 26), (26, 28),  # right leg
]

KEY_LANDMARKS = {11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28}


def render_skeleton_on_frame(
    frame: np.ndarray,
    landmarks: list[Landmark],
    color: tuple[int, int, int] = (37, 99, 235),  # blue
    thickness: int = 2,
    dot_radius: int = 4,
) -> np.ndarray:
    h, w = frame.shape[:2]
    overlay = frame.copy()

    def to_px(lm: Landmark) -> tuple[int, int]:
        return int(lm.x * w), int(lm.y * h)

    # Draw connections
    for a, b in CONNECTIONS:
        if a >= len(landmarks) or b >= len(landmarks):
            continue
        lm_a, lm_b = landmarks[a], landmarks[b]
        if lm_a.visibility < 0.5 or lm_b.visibility < 0.5:
            continue
        cv2.line(overlay, to_px(lm_a), to_px(lm_b), color, thickness, cv2.LINE_AA)

    # Draw key landmark dots
    for i in KEY_LANDMARKS:
        if i >= len(landmarks):
            continue
        lm = landmarks[i]
        if lm.visibility < 0.5:
            continue
        pt = to_px(lm)
        cv2.circle(overlay, pt, dot_radius, (255, 255, 255), -1, cv2.LINE_AA)
        cv2.circle(overlay, pt, dot_radius, color, 1, cv2.LINE_AA)

    return overlay


def render_ghost_overlay(
    frame: np.ndarray,
    ghost_landmarks: list[Landmark],
    alpha: float = 0.4,
    color: tuple[int, int, int] = (0, 230, 118),
) -> np.ndarray:
    """Render a semi-transparent ghost skeleton showing ideal form."""
    overlay = frame.copy()
    overlay = render_skeleton_on_frame(overlay, ghost_landmarks, color=color, thickness=3, dot_radius=5)
    return cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)


def render_key_frames(
    video_path: str,
    pose_frames_data: list[dict],
    phase_key_frames: dict[str, int],
    max_width: int = 640,
    handedness: str = "right",
    target_fps: int = 30,
) -> dict[str, bytes]:
    """Render skeleton overlay on key frames for each phase.

    Draws a green ghost skeleton showing ideal pro form, then the
    user's actual skeleton on top in blue.

    Returns dict mapping phase name -> JPEG bytes.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {}

    original_fps = cap.get(cv2.CAP_PROP_FPS)
    if original_fps <= 0:
        original_fps = 30.0
    frame_interval = max(1, round(original_fps / target_fps))

    landmarks_by_frame: dict[int, list[Landmark]] = {}
    for pf in pose_frames_data:
        idx = pf["frame_index"]
        landmarks_by_frame[idx] = [Landmark(**lm) for lm in pf["landmarks"]]

    results: dict[str, bytes] = {}

    for phase, frame_idx in phase_key_frames.items():
        video_frame_idx = frame_idx * frame_interval
        cap.set(cv2.CAP_PROP_POS_FRAMES, video_frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue

        h, w = frame.shape[:2]
        if w > max_width:
            scale = max_width / w
            frame = cv2.resize(frame, (max_width, int(h * scale)))

        landmarks = landmarks_by_frame.get(frame_idx)
        if landmarks:
            ghost = generate_ghost_pose(landmarks, phase, handedness)
            if ghost:
                frame = render_ghost_overlay(frame, ghost)
            frame = render_skeleton_on_frame(frame, landmarks)

        _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        results[phase] = jpeg.tobytes()

    cap.release()
    return results
