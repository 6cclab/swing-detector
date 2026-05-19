from app.schemas.analysis import SwingPhase

# Professional benchmark ranges: {phase: {angle_name: (min, max)}}
PRO_BENCHMARKS: dict[SwingPhase, dict[str, tuple[float, float]]] = {
    "address": {
        "spine_angle_deg": (38.0, 45.0),
        "lead_knee_flex_deg": (20.0, 30.0),
        "trail_knee_flex_deg": (20.0, 30.0),
        "hip_rotation_deg": (-5.0, 5.0),
        "shoulder_rotation_deg": (-5.0, 5.0),
        "weight_transfer_ratio": (0.45, 0.55),
    },
    "backswing": {
        "hip_rotation_deg": (35.0, 50.0),
        "shoulder_rotation_deg": (70.0, 95.0),
        "spine_angle_deg": (38.0, 46.0),
        "wrist_hinge_deg": (80.0, 100.0),
        "elbow_angle_deg": (155.0, 175.0),
        "weight_transfer_ratio": (0.65, 0.80),
    },
    "top_of_backswing": {
        "hip_rotation_deg": (45.0, 55.0),
        "shoulder_rotation_deg": (90.0, 110.0),
        "spine_angle_deg": (38.0, 46.0),
        "wrist_hinge_deg": (85.0, 100.0),
        "elbow_angle_deg": (85.0, 100.0),
        "weight_transfer_ratio": (0.70, 0.85),
    },
    "downswing": {
        "hip_rotation_deg": (30.0, 50.0),
        "shoulder_rotation_deg": (50.0, 75.0),
        "weight_transfer_ratio": (0.55, 0.70),
    },
    "impact": {
        "hip_rotation_deg": (38.0, 50.0),
        "shoulder_rotation_deg": (10.0, 25.0),
        "spine_angle_deg": (35.0, 44.0),
        "lead_knee_flex_deg": (5.0, 15.0),
        "weight_transfer_ratio": (0.75, 0.90),
        "wrist_hinge_deg": (10.0, 30.0),
    },
    "follow_through": {
        "hip_rotation_deg": (70.0, 90.0),
        "shoulder_rotation_deg": (75.0, 95.0),
        "spine_angle_deg": (30.0, 40.0),
        "weight_transfer_ratio": (0.90, 1.00),
    },
}

# Scoring weight per angle (sums to 1.0)
ANGLE_WEIGHTS: dict[str, float] = {
    "hip_rotation_deg": 0.20,
    "shoulder_rotation_deg": 0.18,
    "spine_angle_deg": 0.18,
    "weight_transfer_ratio": 0.15,
    "lead_knee_flex_deg": 0.10,
    "trail_knee_flex_deg": 0.07,
    "wrist_hinge_deg": 0.07,
    "elbow_angle_deg": 0.05,
}
