export type SwingPhase =
  | "address"
  | "backswing"
  | "top_of_backswing"
  | "downswing"
  | "impact"
  | "follow_through";

export type Severity = "good" | "minor" | "moderate" | "major";

export type Landmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type PoseFrame = {
  frame_index: number;
  timestamp_ms: number;
  landmarks: Landmark[];
};

export type PhaseAngles = {
  hip_rotation_deg: number | null;
  shoulder_rotation_deg: number | null;
  spine_angle_deg: number | null;
  lead_knee_flex_deg: number | null;
  trail_knee_flex_deg: number | null;
  wrist_hinge_deg: number | null;
  elbow_angle_deg: number | null;
  weight_transfer_ratio: number | null;
};

export type AngleFeedback = {
  angle_name: string;
  measured: number;
  pro_min: number;
  pro_max: number;
  delta: number;
  severity: Severity;
  coaching_tip: string;
};

export type SwingPhaseResult = {
  phase: SwingPhase;
  start_frame: number;
  end_frame: number;
  angles: PhaseAngles;
  angle_feedback: AngleFeedback[];
  phase_score: number;
};

export type SwingAnalysisResult = {
  swing_id: string;
  user_id: string;
  recorded_at: string;
  duration_ms: number;
  frame_count: number;
  overall_score: number;
  phases_detected: SwingPhaseResult[];
  coaching_summary: string[];
  pose_frames: PoseFrame[];
};
