import numpy as np

from app.pipeline.angle_calculator import compute_all_angles
from app.pipeline.phase_detector import PhaseRange
from app.schemas.analysis import PhaseAngles, PoseFrame


def aggregate_phase_angles(
    pose_frames: list[PoseFrame],
    phase: PhaseRange,
    handedness: str = "right",
) -> PhaseAngles:
    phase_poses = [
        pf for pf in pose_frames
        if phase.start_frame <= pf.frame_index <= phase.end_frame
    ]

    if not phase_poses:
        return PhaseAngles()

    all_angles = [compute_all_angles(pf.landmarks, handedness) for pf in phase_poses]

    def _median(values: list[float | None]) -> float | None:
        valid = [v for v in values if v is not None]
        return float(np.median(valid)) if valid else None

    return PhaseAngles(
        hip_rotation_deg=_median([a.hip_rotation_deg for a in all_angles]),
        shoulder_rotation_deg=_median([a.shoulder_rotation_deg for a in all_angles]),
        spine_angle_deg=_median([a.spine_angle_deg for a in all_angles]),
        lead_knee_flex_deg=_median([a.lead_knee_flex_deg for a in all_angles]),
        trail_knee_flex_deg=_median([a.trail_knee_flex_deg for a in all_angles]),
        wrist_hinge_deg=_median([a.wrist_hinge_deg for a in all_angles]),
        elbow_angle_deg=_median([a.elbow_angle_deg for a in all_angles]),
        weight_transfer_ratio=_median([a.weight_transfer_ratio for a in all_angles]),
    )
