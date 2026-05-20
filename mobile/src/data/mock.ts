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

export interface DrillStep {
  title: string;
  instruction: string;
  tip?: string;
}

export interface Drill {
  id: string;
  title: string;
  target: MetricKey;
  focus: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  steps: DrillStep[];
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
    steps: [
      { title: 'Setup', instruction: 'Stand with your back and glutes touching a wall. Take your normal address position with a club.', tip: 'Your head doesn\'t need to touch the wall.' },
      { title: 'Backswing', instruction: 'Make a slow backswing. Your trail hip should stay in contact with the wall throughout.', tip: 'Focus on rotating, not sliding away.' },
      { title: 'Downswing', instruction: 'Start the downswing. Keep your glutes pressed against the wall — this prevents early extension.', tip: 'If your hips come off the wall, you\'re thrusting toward the ball.' },
      { title: 'Through impact', instruction: 'Swing through to a finish position. Your lead hip should rotate open while maintaining wall contact.', tip: 'Repeat 10-15 times, then hit balls without the wall.' },
    ],
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
    steps: [
      { title: 'Address', instruction: 'Take your normal setup with a mid-iron. Focus on relaxed grip pressure — about 4 out of 10.', tip: 'Light grip helps you feel the club head.' },
      { title: 'To the top', instruction: 'Make a full backswing to the top. Pause for a full second. Feel the wrist hinge — your lead wrist should be flat.', tip: 'Check: can you feel weight in your trail foot?' },
      { title: 'Pump down', instruction: 'Start the downswing halfway, then pull the club back to the top. Repeat 3 times. Maintain wrist angle each time.', tip: 'The angle should not change during the pump.' },
      { title: 'Release', instruction: 'On the 4th downswing, complete the full swing through impact. The wrist hinge releases naturally at the ball.', tip: 'Do 5 sets. This builds lag without forcing it.' },
    ],
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
    steps: [
      { title: 'Feet together', instruction: 'Start with both feet touching, ball positioned in the center. Hold a mid-iron.', tip: 'This will feel unstable — that\'s the point.' },
      { title: 'Small backswing', instruction: 'Make a three-quarter backswing. As you reach the top, lift your lead foot slightly off the ground.', tip: 'Keep your balance centered.' },
      { title: 'Step and swing', instruction: 'Step your lead foot toward the target as you begin the downswing. Plant it firmly before impact.', tip: 'The step triggers proper weight transfer.' },
      { title: 'Follow through', instruction: 'Finish with 90% of weight on your lead foot. Hold the finish for 3 seconds.', tip: 'If you fall off balance, slow down the tempo.' },
      { title: 'Progress', instruction: 'Start with half swings, then work up to full speed. Hit 20 balls this way.', tip: 'Film yourself to check your weight shift.' },
    ],
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
    steps: [
      { title: 'Build the gate', instruction: 'Place two tees in the ground about 1 inch wider than your clubhead, just in front of the ball on the target line.', tip: 'Use bright tees so you can see them clearly.' },
      { title: 'Slow swings', instruction: 'Make slow half-swings, focusing on swinging the club straight through the gate without touching either tee.', tip: 'If you hit the outside tee, your path is too in-to-out.' },
      { title: 'Add speed', instruction: 'Gradually increase to three-quarter speed. Keep the club tracking through the gate cleanly.', tip: 'Hitting the inside tee means you\'re coming over the top.' },
      { title: 'Full swings', instruction: 'Work up to full speed. Hit 15-20 balls through the gate. Track your success rate.', tip: 'Aim for 80%+ clean passes before narrowing the gate.' },
    ],
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
    steps: [
      { title: 'Set your tempo', instruction: 'Open a metronome app and set it to 72 BPM. Each beat is one count.', tip: 'Tour average is roughly a 3:1 ratio.' },
      { title: 'Count the backswing', instruction: 'Say "one-two-three" as you take the club back. Each count matches one metronome beat. Reach the top on "three".', tip: 'Don\'t rush — most amateurs go too fast.' },
      { title: 'Transition', instruction: 'On the next beat, say "one" and start the downswing. This single count covers the entire downswing through impact.', tip: 'The transition should feel smooth, not jerky.' },
      { title: 'Repeat', instruction: 'Hit 20 balls with the metronome. Focus on matching the rhythm, not on where the ball goes.', tip: 'Once it feels natural, try without the metronome.' },
    ],
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
    steps: [
      { title: 'Stance', instruction: 'Place your feet together, touching. Tee the ball up slightly. Use a 7 or 8 iron.', tip: 'This removes lateral movement from your swing.' },
      { title: 'Half swings', instruction: 'Start with smooth half swings. Focus on rotating your body around a fixed center point.', tip: 'If you lose balance, you\'re using too much lateral motion.' },
      { title: 'Three-quarter', instruction: 'Increase to three-quarter swings. Maintain balance throughout — you should be able to hold your finish.', tip: 'The ball won\'t go as far — that\'s fine.' },
      { title: 'Full swings', instruction: 'Work up to full swings. Hit 15 balls. If you can hold your finish on 12+, your sequencing is solid.', tip: 'This is one of the best drills for advanced players.' },
    ],
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
