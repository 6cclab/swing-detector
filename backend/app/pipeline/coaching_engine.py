from app.schemas.analysis import AngleFeedback, SwingPhase

COACHING_TEMPLATES: dict[str, dict[str, str]] = {
    "hip_rotation_deg": {
        "low": (
            "Your hips are under-rotating during {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Focus on driving your lead hip toward "
            "the target to generate more power."
        ),
        "high": (
            "Your hips are over-rotating during {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). This can cause loss of lag and "
            "inconsistent contact. Try to control your hip turn."
        ),
    },
    "shoulder_rotation_deg": {
        "low": (
            "Your shoulder turn is restricted in {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Work on turning your trail shoulder "
            "fully behind you for a wider arc."
        ),
        "high": (
            "Your shoulders are rotating too far in {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). This can cause swing path issues "
            "and loss of control."
        ),
    },
    "spine_angle_deg": {
        "low": (
            "Your spine angle is too upright at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Tilt forward more from the hips "
            "to maintain proper posture throughout the swing."
        ),
        "high": (
            "You're bending too far over at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). This can restrict rotation and "
            "lead to early extension. Stand a bit taller at address."
        ),
    },
    "lead_knee_flex_deg": {
        "low": (
            "Your lead knee is too straight at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Maintain a slight athletic flex "
            "for better stability and ground force."
        ),
        "high": (
            "Your lead knee has too much flex at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Try to firm up your lead leg "
            "through impact for better energy transfer."
        ),
    },
    "trail_knee_flex_deg": {
        "low": (
            "Your trail knee is too straight at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Maintain knee flex to store "
            "power during the backswing."
        ),
        "high": (
            "Your trail knee has excessive flex at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). This can cause sway. Keep your "
            "trail knee stable over your trail foot."
        ),
    },
    "wrist_hinge_deg": {
        "low": (
            "Your wrist hinge is insufficient at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Focus on setting your wrists "
            "earlier in the backswing to create lag."
        ),
        "high": (
            "Your wrists are over-hinged at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). This can lead to inconsistent "
            "release timing. Work on a more controlled wrist set."
        ),
    },
    "elbow_angle_deg": {
        "low": (
            "Your lead elbow is too bent at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). Try to keep your lead arm "
            "straighter for a wider swing arc and more power."
        ),
        "high": (
            "Your lead arm is too rigid at {phase} ({measured:.0f}° vs "
            "{pro_min:.0f}-{pro_max:.0f}°). A slight natural bend is "
            "acceptable — focus on rhythm over rigidity."
        ),
    },
    "weight_transfer_ratio": {
        "low": (
            "Your weight is too far back at {phase} (ratio {measured:.2f} vs "
            "{pro_min:.2f}-{pro_max:.2f}). Focus on shifting pressure toward "
            "your lead foot through the downswing and impact."
        ),
        "high": (
            "Your weight is shifting too early to your lead side at {phase} "
            "(ratio {measured:.2f} vs {pro_min:.2f}-{pro_max:.2f}). Load into "
            "your trail side more during the backswing before transitioning."
        ),
    },
}


def generate_coaching_tip(
    angle_name: str,
    feedback: AngleFeedback,
    phase: SwingPhase,
) -> str:
    templates = COACHING_TEMPLATES.get(angle_name)
    if not templates:
        return f"Review your {angle_name.replace('_', ' ')} during {phase}."

    direction = "low" if feedback.delta < 0 else "high"
    template = templates.get(direction, templates.get("low", ""))

    phase_display = phase.replace("_", " ")
    return template.format(
        phase=phase_display,
        measured=feedback.measured,
        pro_min=feedback.pro_min,
        pro_max=feedback.pro_max,
        delta=abs(feedback.delta),
    )


def generate_coaching_summary(
    phase_feedbacks: list[tuple[SwingPhase, list[AngleFeedback]]],
    max_tips: int = 5,
) -> list[str]:
    from app.benchmarks.pro_benchmarks import ANGLE_WEIGHTS

    all_issues: list[tuple[float, str]] = []

    for phase, feedbacks in phase_feedbacks:
        for fb in feedbacks:
            if fb.severity == "good":
                continue
            weight = ANGLE_WEIGHTS.get(fb.angle_name, 0.05)
            severity_multiplier = {"minor": 1, "moderate": 2, "major": 3}
            priority = weight * severity_multiplier.get(fb.severity, 1)
            tip = generate_coaching_tip(fb.angle_name, fb, phase)
            all_issues.append((priority, tip))

    all_issues.sort(key=lambda x: x[0], reverse=True)
    return [tip for _, tip in all_issues[:max_tips]]
