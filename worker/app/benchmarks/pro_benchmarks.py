from app.schemas.analysis import SwingPhase

# Professional benchmark ranges: {phase: {angle_name: (min, max)}}
PRO_BENCHMARKS: dict[SwingPhase, dict[str, tuple[float, float]]] = {
    "address": {
        "spine_angle_deg": (35.0, 48.0),
        "lead_knee_flex_deg": (15.0, 35.0),
        "trail_knee_flex_deg": (15.0, 35.0),
        "hip_rotation_deg": (-60.0, 60.0),
        "shoulder_rotation_deg": (-60.0, 60.0),
        "weight_transfer_ratio": (0.40, 0.60),
    },
    "backswing": {
        "hip_rotation_deg": (-150.0, 150.0),
        "shoulder_rotation_deg": (-150.0, 150.0),
        "spine_angle_deg": (35.0, 50.0),
        "wrist_hinge_deg": (70.0, 110.0),
        "elbow_angle_deg": (145.0, 180.0),
        "weight_transfer_ratio": (0.55, 0.85),
    },
    "top_of_backswing": {
        "hip_rotation_deg": (-150.0, 150.0),
        "shoulder_rotation_deg": (-150.0, 150.0),
        "spine_angle_deg": (35.0, 50.0),
        "wrist_hinge_deg": (75.0, 110.0),
        "elbow_angle_deg": (75.0, 110.0),
        "weight_transfer_ratio": (0.60, 0.90),
    },
    "downswing": {
        "hip_rotation_deg": (-150.0, 150.0),
        "shoulder_rotation_deg": (-150.0, 150.0),
        "weight_transfer_ratio": (0.45, 0.75),
    },
    "impact": {
        "hip_rotation_deg": (-150.0, 150.0),
        "shoulder_rotation_deg": (-150.0, 150.0),
        "spine_angle_deg": (30.0, 48.0),
        "lead_knee_flex_deg": (0.0, 20.0),
        "weight_transfer_ratio": (0.65, 0.95),
        "wrist_hinge_deg": (5.0, 40.0),
    },
    "follow_through": {
        "hip_rotation_deg": (-150.0, 150.0),
        "shoulder_rotation_deg": (-150.0, 150.0),
        "spine_angle_deg": (25.0, 45.0),
        "weight_transfer_ratio": (0.80, 1.00),
    },
}

# Scoring weight per angle (sums to 1.0)
ANGLE_WEIGHTS: dict[str, float] = {
    "spine_angle_deg": 0.25,
    "lead_knee_flex_deg": 0.18,
    "elbow_angle_deg": 0.15,
    "wrist_hinge_deg": 0.15,
    "trail_knee_flex_deg": 0.12,
    "weight_transfer_ratio": 0.10,
    "hip_rotation_deg": 0.03,
    "shoulder_rotation_deg": 0.02,
}
