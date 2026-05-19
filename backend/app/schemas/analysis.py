from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class Landmark(BaseModel):
    x: float
    y: float
    z: float
    visibility: float


class PoseFrame(BaseModel):
    frame_index: int
    timestamp_ms: float
    landmarks: list[Landmark]


class PhaseAngles(BaseModel):
    hip_rotation_deg: float | None = None
    shoulder_rotation_deg: float | None = None
    spine_angle_deg: float | None = None
    lead_knee_flex_deg: float | None = None
    trail_knee_flex_deg: float | None = None
    wrist_hinge_deg: float | None = None
    elbow_angle_deg: float | None = None
    weight_transfer_ratio: float | None = None


class AngleFeedback(BaseModel):
    angle_name: str
    measured: float
    pro_min: float
    pro_max: float
    delta: float
    severity: Literal["good", "minor", "moderate", "major"]
    coaching_tip: str


SwingPhase = Literal[
    "address",
    "backswing",
    "top_of_backswing",
    "downswing",
    "impact",
    "follow_through",
]


class SwingPhaseResult(BaseModel):
    phase: SwingPhase
    start_frame: int
    end_frame: int
    angles: PhaseAngles
    angle_feedback: list[AngleFeedback]
    phase_score: float


class DetectedFault(BaseModel):
    fault: str
    confidence: float


class SwingAnalysisResult(BaseModel):
    swing_id: str
    user_id: str
    recorded_at: datetime
    duration_ms: float
    frame_count: int
    overall_score: float
    phases_detected: list[SwingPhaseResult]
    coaching_summary: list[str]
    pose_frames: list[PoseFrame]
    detected_faults: list[DetectedFault] | None = None
    swing_embedding: list[float] | None = None
