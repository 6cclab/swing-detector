from typing import Literal

from app.benchmarks.pro_benchmarks import ANGLE_WEIGHTS, PRO_BENCHMARKS
from app.schemas.analysis import AngleFeedback, PhaseAngles, SwingPhase


def _severity(delta: float) -> Literal["good", "minor", "moderate", "major"]:
    abs_delta = abs(delta)
    if abs_delta <= 5.0:
        return "good"
    elif abs_delta <= 12.0:
        return "minor"
    elif abs_delta <= 22.0:
        return "moderate"
    return "major"


def _angle_score(delta: float, weight: float) -> float:
    abs_delta = abs(delta)
    if abs_delta <= 5.0:
        return weight * 100.0
    elif abs_delta <= 12.0:
        return weight * 80.0
    elif abs_delta <= 22.0:
        return weight * 50.0
    return weight * 20.0


def compare_phase(
    phase: SwingPhase,
    angles: PhaseAngles,
) -> tuple[list[AngleFeedback], float]:
    benchmarks = PRO_BENCHMARKS.get(phase, {})
    if not benchmarks:
        return [], 100.0

    feedback: list[AngleFeedback] = []
    total_score = 0.0
    total_weight = 0.0

    angles_dict = angles.model_dump()

    for angle_name, (pro_min, pro_max) in benchmarks.items():
        measured = angles_dict.get(angle_name)
        if measured is None:
            continue

        midpoint = (pro_min + pro_max) / 2
        if measured < pro_min:
            delta = measured - pro_min
        elif measured > pro_max:
            delta = measured - pro_max
        else:
            delta = 0.0

        weight = ANGLE_WEIGHTS.get(angle_name, 0.05)
        total_score += _angle_score(delta, weight)
        total_weight += weight

        feedback.append(
            AngleFeedback(
                angle_name=angle_name,
                measured=round(measured, 1),
                pro_min=pro_min,
                pro_max=pro_max,
                delta=round(delta, 1),
                severity=_severity(delta),
                coaching_tip="",  # filled by coaching engine
            )
        )

    phase_score = (total_score / total_weight) if total_weight > 0 else 100.0
    return feedback, round(phase_score, 1)
