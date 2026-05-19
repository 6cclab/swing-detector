import logging
import uuid
from datetime import datetime, timezone

from app.pipeline.benchmark_comparator import compare_phase
from app.pipeline.coaching_engine import generate_coaching_summary, generate_coaching_tip
from app.pipeline.metrics_engine import aggregate_phase_angles
from app.pipeline.phase_detector import detect_phases
from app.pipeline.pose_estimator import estimate_poses
from app.pipeline.video_processor import extract_frames
from app.schemas.analysis import DetectedFault, SwingAnalysisResult, SwingPhaseResult

logger = logging.getLogger(__name__)


def analyze_swing(
    video_path: str,
    user_id: str = "anonymous",
    swing_id: str | None = None,
    handedness: str = "right",
    target_fps: int = 30,
    model_complexity: int = 1,
) -> SwingAnalysisResult:
    if swing_id is None:
        swing_id = str(uuid.uuid4())

    # 1. Extract frames from video
    extracted = extract_frames(video_path, target_fps=target_fps)

    # 2. Run pose estimation on all frames
    pose_frames = estimate_poses(
        extracted.frames,
        extracted.timestamps_ms,
        model_complexity=model_complexity,
    )

    if len(pose_frames) < 10:
        raise ValueError(
            f"Only {len(pose_frames)} frames had detectable poses. "
            "Ensure the golfer is clearly visible in the video."
        )

    # 3. Detect swing phases — use ML model if trained, else rule-based
    phases = None
    try:
        from app.ml.inference import ml_detect_phases
        phases = ml_detect_phases(pose_frames)
        if phases:
            logger.info("Using ML phase classifier")
    except ImportError:
        pass

    if phases is None:
        phases = detect_phases(pose_frames, handedness=handedness)
        logger.info("Using rule-based phase detector")

    # 4. For each phase, compute angles, compare to benchmarks, generate feedback
    phase_results: list[SwingPhaseResult] = []
    phase_feedbacks = []

    for phase in phases:
        angles = aggregate_phase_angles(pose_frames, phase, handedness=handedness)
        feedback_list, phase_score = compare_phase(phase.phase, angles)

        for fb in feedback_list:
            if fb.severity != "good":
                fb.coaching_tip = generate_coaching_tip(
                    fb.angle_name, fb, phase.phase
                )

        phase_feedbacks.append((phase.phase, feedback_list))

        phase_results.append(
            SwingPhaseResult(
                phase=phase.phase,
                start_frame=phase.start_frame,
                end_frame=phase.end_frame,
                angles=angles,
                angle_feedback=feedback_list,
                phase_score=phase_score,
            )
        )

    # 5. Compute overall score — use ML scorer if trained, else average phase scores
    ml_score = None
    try:
        from app.ml.inference import ml_score_quality
        ml_score = ml_score_quality(pose_frames)
        if ml_score is not None:
            logger.info(f"ML quality score: {ml_score:.1f}")
    except ImportError:
        pass

    if ml_score is not None:
        overall_score = ml_score
    elif phase_results:
        overall_score = sum(pr.phase_score for pr in phase_results) / len(phase_results)
    else:
        overall_score = 0.0

    # 6. Detect faults using ML model if available
    detected_faults = None
    try:
        from app.ml.inference import ml_detect_faults
        detected_faults = ml_detect_faults(pose_frames)
        if detected_faults:
            logger.info(f"ML faults detected: {[f['fault'] for f in detected_faults]}")
    except ImportError:
        pass

    # 7. Compute swing embedding if model available
    swing_embedding = None
    try:
        from app.ml.inference import ml_compute_embedding
        swing_embedding = ml_compute_embedding(pose_frames)
    except ImportError:
        pass

    # 8. Generate prioritized coaching summary
    coaching_summary = generate_coaching_summary(phase_feedbacks)

    # Add fault-based coaching tips if faults detected
    if detected_faults:
        fault_tips = _faults_to_coaching_tips(detected_faults)
        coaching_summary = fault_tips + coaching_summary
        coaching_summary = coaching_summary[:7]  # keep top 7

    # 9. Compute duration
    if extracted.timestamps_ms:
        duration_ms = extracted.timestamps_ms[-1] - extracted.timestamps_ms[0]
    else:
        duration_ms = 0.0

    fault_models = None
    if detected_faults:
        fault_models = [DetectedFault(**f) for f in detected_faults]

    return SwingAnalysisResult(
        swing_id=swing_id,
        user_id=user_id,
        recorded_at=datetime.now(timezone.utc),
        duration_ms=duration_ms,
        frame_count=len(pose_frames),
        overall_score=round(overall_score, 1),
        phases_detected=phase_results,
        coaching_summary=coaching_summary,
        pose_frames=pose_frames,
        detected_faults=fault_models,
        swing_embedding=swing_embedding,
    )


FAULT_COACHING_TIPS = {
    "early_extension": "Early extension detected — your hips are thrusting toward the ball during the downswing. Focus on maintaining your spine angle and hip depth through impact.",
    "over_the_top": "Over-the-top swing path detected — your club is coming from outside to inside. Work on dropping the club into the slot by starting the downswing with your lower body.",
    "casting": "Casting detected — you're releasing your wrist angle too early in the downswing, losing lag and power. Focus on maintaining wrist hinge longer into the downswing.",
    "sway": "Lateral sway detected in your backswing — your hips are moving laterally instead of rotating. Focus on rotating your hips around a stable center.",
    "slide": "Lateral slide detected in your downswing — your hips are sliding toward the target instead of rotating open. Focus on clearing your lead hip.",
    "chicken_wing": "Chicken wing detected — your lead elbow is bending through impact. Work on extending both arms through the hitting zone.",
    "loss_of_posture": "Loss of posture detected — your spine angle is changing significantly during the swing. Focus on maintaining your address posture throughout.",
    "flat_shoulder_plane": "Flat shoulder plane detected — your shoulders are turning too level. Allow your lead shoulder to work down in the backswing.",
    "reverse_spine": "Reverse spine angle detected — you're leaning toward the target at the top of your backswing. Focus on loading into your trail side.",
    "hanging_back": "Hanging back detected — your weight is staying on your trail side through impact. Focus on transferring pressure to your lead foot in the downswing.",
}


def _faults_to_coaching_tips(faults: list[dict]) -> list[str]:
    """Convert detected faults to coaching tip strings."""
    tips = []
    for fault in faults:
        tip = FAULT_COACHING_TIPS.get(fault["fault"])
        if tip:
            confidence = fault["confidence"]
            if confidence >= 0.8:
                tips.append(tip)
            else:
                tips.append(f"(Possible) {tip}")
    return tips
