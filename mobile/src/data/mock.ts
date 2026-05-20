// ─── Types ────────────────────────────────────────────────────────────────────

export type Severity = 'good' | 'warning' | 'danger';

export interface SwingPhase {
  id: string;
  label: string;
  short: string;
}

export interface ProRange {
  min: number;
  max: number;
  unit: string;
  label: string;
}

export type MetricKey =
  | 'shoulder_turn'
  | 'hip_turn'
  | 'spine_tilt'
  | 'wrist_cock'
  | 'swing_plane'
  | 'weight_shift';

export type MetricValues = Record<MetricKey, number>;

export interface CoachingTip {
  severity: Severity;
  title: string;
  body: string;
}

export interface Drill {
  id: string;
  title: string;
  target: MetricKey;
  focus: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
}

export interface Swing {
  id: string;
  date: Date;
  score: number;
  club: string;
  label: string;
  tips: number[];
  metrics: MetricValues;
  phaseScores: number[];
}

export interface User {
  name: string;
  email: string;
  handedness: 'right' | 'left';
  handicap: number;
  joined: Date;
}

// ─── Swing Phases ─────────────────────────────────────────────────────────────

export const SWING_PHASES: SwingPhase[] = [
  { id: 'address',    label: 'Address',    short: 'ADD' },
  { id: 'takeaway',   label: 'Takeaway',   short: 'TAK' },
  { id: 'backswing',  label: 'Backswing',  short: 'BCK' },
  { id: 'transition', label: 'Transition', short: 'TRN' },
  { id: 'downswing',  label: 'Downswing',  short: 'DWN' },
  { id: 'impact',     label: 'Impact',     short: 'IMP' },
];

// ─── Pro Ranges ───────────────────────────────────────────────────────────────

export const PRO_RANGES: Record<MetricKey, ProRange> = {
  shoulder_turn: { min: 85,  max: 105, unit: '°', label: 'Shoulder turn' },
  hip_turn:      { min: 40,  max: 55,  unit: '°', label: 'Hip turn'      },
  spine_tilt:    { min: 20,  max: 30,  unit: '°', label: 'Spine tilt'    },
  wrist_cock:    { min: 85,  max: 100, unit: '°', label: 'Wrist cock'    },
  swing_plane:   { min: 55,  max: 65,  unit: '°', label: 'Swing plane'   },
  weight_shift:  { min: 80,  max: 95,  unit: '%', label: 'Weight shift'  },
};

// ─── Coaching Tips Pool ───────────────────────────────────────────────────────

export const COACHING_TIPS_POOL: CoachingTip[] = [
  // index 0
  {
    severity: 'good',
    title: 'Great shoulder rotation',
    body: 'Your shoulder turn is within the pro range. Keep maintaining this coil through the backswing for consistent power.',
  },
  // index 1
  {
    severity: 'warning',
    title: 'Increase hip clearance',
    body: 'Your hips are slightly under-rotating in the downswing. Focus on leading with your left hip (for right-handers) to improve power transfer.',
  },
  // index 2
  {
    severity: 'danger',
    title: 'Hip turn too restricted',
    body: 'Your hip turn is well below the pro range. A wall drill can help you feel the correct amount of rotation without swaying.',
  },
  // index 3
  {
    severity: 'warning',
    title: 'Maintain spine tilt',
    body: 'Your spine tilt is at the low end. Try to feel more side bend away from the target at address and maintain it through impact.',
  },
  // index 4
  {
    severity: 'danger',
    title: 'Wrist cock too early',
    body: 'Your wrists are hinging too quickly in the takeaway, causing an overly steep swing plane. Work on a one-piece takeaway for the first 18 inches.',
  },
  // index 5
  {
    severity: 'warning',
    title: 'Swing plane slightly flat',
    body: 'Your swing plane is a touch below the ideal range. Imagine swinging through a pane of glass tilted at your shoulder angle to find a better path.',
  },
];

// ─── Drills ───────────────────────────────────────────────────────────────────

export const DRILLS: Drill[] = [
  {
    id: 'wall-drill',
    title: 'Wall Drill',
    target: 'hip_turn',
    focus: 'Hip rotation & early extension',
    duration: '10 min',
    level: 'Beginner',
    description:
      'Stand with your back against a wall during practice swings. Your glutes should maintain contact through the downswing to prevent early extension.',
  },
  {
    id: 'pump-drill',
    title: 'Pump Drill',
    target: 'wrist_cock',
    focus: 'Wrist retention & lag',
    duration: '15 min',
    level: 'Intermediate',
    description:
      'Take the club to the top, pause, then pump halfway down and back to the top three times before completing the swing. Builds wrist retention.',
  },
  {
    id: 'step-through',
    title: 'Step-Through',
    target: 'weight_shift',
    focus: 'Hip rotation & weight transfer',
    duration: '10 min',
    level: 'Beginner',
    description:
      'Start with feet together. Step toward the target with your lead foot as you begin the downswing. Promotes proper hip rotation and weight transfer.',
  },
  {
    id: 'tee-gate',
    title: 'Tee Gate',
    target: 'swing_plane',
    focus: 'Club path & swing plane',
    duration: '20 min',
    level: 'Intermediate',
    description:
      'Place two tees just wider than your clubhead on the target line. Swing through without hitting either tee to groove a square path.',
  },
  {
    id: '3-to-1-tempo',
    title: '3-to-1 Tempo',
    target: 'shoulder_turn',
    focus: 'Tempo & full rotation',
    duration: '10 min',
    level: 'Beginner',
    description:
      "Count '1-2-3' on the backswing, '1' on the downswing. Use a metronome app at 72 BPM for the backswing beat.",
  },
  {
    id: 'feet-together',
    title: 'Feet Together',
    target: 'spine_tilt',
    focus: 'Balance & sequencing',
    duration: '15 min',
    level: 'Advanced',
    description:
      'Hit balls with your feet touching. Forces you to maintain balance and proper sequencing without relying on lateral movement.',
  },
];

// ─── Phase Score Generator ────────────────────────────────────────────────────

/**
 * Generates 6 phase scores proportional to the overall swing score,
 * each with a small deterministic per-phase variance so they look natural.
 */
function generatePhaseScores(overallScore: number, swingIndex: number): number[] {
  // Per-phase offsets that sum near zero, creating plausible variance
  const offsets = [4, -6, 2, -3, 5, -2];
  return SWING_PHASES.map((_, i) => {
    const raw = overallScore + offsets[i] + ((swingIndex * 3 + i * 7) % 5) - 2;
    return Math.min(100, Math.max(0, Math.round(raw)));
  });
}

// ─── Swings ───────────────────────────────────────────────────────────────────

export const SWINGS: Swing[] = [
  {
    id: 's8',
    date: new Date('2025-05-18T14:09:00'),
    score: 84,
    club: '7i',
    label: 'Range · Driving',
    tips: [0, 3, 1],
    metrics: {
      shoulder_turn: 96,
      hip_turn: 48,
      spine_tilt: 22,
      wrist_cock: 92,
      swing_plane: 61,
      weight_shift: 86,
    },
    phaseScores: generatePhaseScores(84, 7),
  },
  {
    id: 's7',
    date: new Date('2025-05-17T18:42:00'),
    score: 78,
    club: 'Driver',
    label: 'Range · Driving',
    tips: [3, 1, 5],
    metrics: {
      shoulder_turn: 91,
      hip_turn: 44,
      spine_tilt: 20,
      wrist_cock: 88,
      swing_plane: 58,
      weight_shift: 82,
    },
    phaseScores: generatePhaseScores(78, 6),
  },
  {
    id: 's6',
    date: new Date('2025-05-15T09:21:00'),
    score: 71,
    club: '7i',
    label: 'Course · Hole 4',
    tips: [2, 5, 1],
    metrics: {
      shoulder_turn: 88,
      hip_turn: 42,
      spine_tilt: 19,
      wrist_cock: 84,
      swing_plane: 56,
      weight_shift: 78,
    },
    phaseScores: generatePhaseScores(71, 5),
  },
  {
    id: 's5',
    date: new Date('2025-05-13T16:55:00'),
    score: 62,
    club: 'Driver',
    label: 'Range · Driving',
    tips: [4, 2, 5],
    metrics: {
      shoulder_turn: 84,
      hip_turn: 38,
      spine_tilt: 17,
      wrist_cock: 80,
      swing_plane: 52,
      weight_shift: 72,
    },
    phaseScores: generatePhaseScores(62, 4),
  },
  {
    id: 's4',
    date: new Date('2025-05-11T15:10:00'),
    score: 58,
    club: '9i',
    label: 'Range · Driving',
    tips: [4, 2, 5],
    metrics: {
      shoulder_turn: 80,
      hip_turn: 36,
      spine_tilt: 16,
      wrist_cock: 78,
      swing_plane: 50,
      weight_shift: 68,
    },
    phaseScores: generatePhaseScores(58, 3),
  },
  {
    id: 's3',
    date: new Date('2025-05-09T13:30:00'),
    score: 49,
    club: 'Driver',
    label: 'Range · Driving',
    tips: [4, 2, 5],
    metrics: {
      shoulder_turn: 76,
      hip_turn: 34,
      spine_tilt: 15,
      wrist_cock: 74,
      swing_plane: 48,
      weight_shift: 64,
    },
    phaseScores: generatePhaseScores(49, 2),
  },
  {
    id: 's2',
    date: new Date('2025-05-06T11:15:00'),
    score: 54,
    club: '7i',
    label: 'Range · Driving',
    tips: [2, 4, 5],
    metrics: {
      shoulder_turn: 78,
      hip_turn: 35,
      spine_tilt: 16,
      wrist_cock: 76,
      swing_plane: 49,
      weight_shift: 66,
    },
    phaseScores: generatePhaseScores(54, 1),
  },
  {
    id: 's1',
    date: new Date('2025-05-03T17:48:00'),
    score: 41,
    club: 'Driver',
    label: 'Range · First session',
    tips: [4, 2],
    metrics: {
      shoulder_turn: 72,
      hip_turn: 30,
      spine_tilt: 14,
      wrist_cock: 70,
      swing_plane: 45,
      weight_shift: 61,
    },
    phaseScores: generatePhaseScores(41, 0),
  },
];

// ─── User ─────────────────────────────────────────────────────────────────────

export const USER: User = {
  name: 'Andre Pato',
  email: 'andre@example.com',
  handedness: 'right',
  handicap: 14,
  joined: new Date('2025-05-03'),
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns a Severity based on a 0-100 swing score.
 *  ≥ 75  → good
 *  ≥ 55  → warning
 *  < 55  → danger
 */
export function scoreSeverity(score: number): Severity {
  if (score >= 75) return 'good';
  if (score >= 55) return 'warning';
  return 'danger';
}

/**
 * Returns a human-readable label for a score severity.
 */
export function scoreSeverityLabel(score: number): string {
  const severity = scoreSeverity(score);
  switch (severity) {
    case 'good':    return 'Good';
    case 'warning': return 'Fair';
    case 'danger':  return 'Needs Work';
  }
}

// ─── Drill Recommender ────────────────────────────────────────────────────────

/**
 * Given a set of metric values, returns the top 3 recommended drills
 * ordered by how far each metric deviates from the center of its pro range.
 */
export function recommendDrills(metrics: MetricValues): Drill[] {
  // Compute deviation score for each metric (absolute distance from range center)
  const deviations = (Object.keys(metrics) as MetricKey[]).map((key) => {
    const range = PRO_RANGES[key];
    const center = (range.min + range.max) / 2;
    const deviation = Math.abs(metrics[key] - center);
    return { key, deviation };
  });

  // Sort metrics by deviation descending (worst first)
  deviations.sort((a, b) => b.deviation - a.deviation);

  // Pick the drill whose target matches each metric in order, deduplicated
  const picked: Drill[] = [];
  const usedDrillIds = new Set<string>();

  for (const { key } of deviations) {
    if (picked.length >= 3) break;
    const drill = DRILLS.find((d) => d.target === key && !usedDrillIds.has(d.id));
    if (drill) {
      picked.push(drill);
      usedDrillIds.add(drill.id);
    }
  }

  // If we still need more drills, fill from remaining unused drills
  if (picked.length < 3) {
    for (const drill of DRILLS) {
      if (picked.length >= 3) break;
      if (!usedDrillIds.has(drill.id)) {
        picked.push(drill);
        usedDrillIds.add(drill.id);
      }
    }
  }

  return picked;
}
