import React from "react";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
  Text,
} from "react-native-svg";

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

interface IllustrationProps {
  size?: number;
  color: string;
}

const STROKE = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// ---------------------------------------------------------------------------
// Golfer proportion reference (side view, facing LEFT)
//
// ViewBox: 0 0 200 200
// Ground line: y=175
// Total figure height ~120px (head top ~y=43 to feet y=175)
//
// HEAD:        cx=85, cy=53, r=10
// NECK top:    (85, 63)
// SPINE:       (85,63) → (100,113)  — ~30° forward tilt from hips
// SHOULDER:    30% down spine ≈ (90, 78)
// HIP POINT:   (100, 113)
// LEAD LEG:    hip(100,113) → knee(90,147) → foot(85,175)
// TRAIL LEG:   hip(100,113) → knee(113,147) → foot(118,175)
// ARMS:        shoulder(90,78) → hands(80,125)
// CLUB:        hands(80,125) → ball(72,175)
// BALL:        cx=72, cy=175, r=4
//
// For FRONT-VIEW drills the figure is centred differently — see per-drill notes.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// WALL DRILL — side view, golfer faces LEFT, wall on RIGHT
// ---------------------------------------------------------------------------

/** Side view: address position. Butt touching wall on the right. */
export function WallSetup({ size = 200, color }: IllustrationProps) {
  // Golfer faces LEFT. Wall on RIGHT. Butt (hip) touches wall.
  // Figure fills most of the frame: head ~y=30, feet ~y=180
  const W = 155; // wall x
  const G = 180; // ground y
  // Hip at wall
  const hip = { x: W - 4, y: 110 };
  // Spine tilts forward ~35° from hip
  const neck = { x: hip.x - 35, y: 55 };
  const head = { x: neck.x - 2, y: 38 };
  const shoulder = { x: neck.x + 5, y: 70 };
  // Hands in front, below shoulder
  const hands = { x: shoulder.x - 25, y: 118 };
  // Legs: slight knee flex
  const lKnee = { x: hip.x - 20, y: 148 };
  const lFoot = { x: hip.x - 28, y: G };
  const tKnee = { x: hip.x + 5, y: 148 };
  const tFoot = { x: hip.x + 8, y: G };
  const ball = { x: hands.x - 8, y: G };

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Wall */}
      <Rect x={W} y={10} width={16} height={G - 10} fill={color} opacity={0.1} rx={2} />
      <Line x1={W} y1={10} x2={W} y2={G} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Ground */}
      <Line x1={15} y1={G} x2={185} y2={G} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={head.x} cy={head.y} r={12} stroke={color} strokeWidth={2.5} fill="none" />
      {/* Spine */}
      <Line x1={neck.x} y1={neck.y} x2={hip.x} y2={hip.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Shoulder → hands (arm) */}
      <Line x1={shoulder.x} y1={shoulder.y} x2={hands.x} y2={hands.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Club */}
      <Line x1={hands.x} y1={hands.y} x2={ball.x} y2={ball.y} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg */}
      <Line x1={hip.x} y1={hip.y} x2={lKnee.x} y2={lKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={lKnee.x} y1={lKnee.y} x2={lFoot.x} y2={lFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Trail leg */}
      <Line x1={hip.x} y1={hip.y} x2={tKnee.x} y2={tKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={tKnee.x} y1={tKnee.y} x2={tFoot.x} y2={tFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Ball */}
      <Circle cx={ball.x} cy={ball.y} r={4} fill={color} />

      {/* Contact indicator: hip touching wall */}
      <Line x1={hip.x} y1={hip.y} x2={W} y2={hip.y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
      <Circle cx={W} cy={hip.y} r={3} fill={color} opacity={0.4} />
    </Svg>
  );
}

/** Backswing — hip still touching wall, club raised behind. */
export function WallBackswing({ size = 200, color }: IllustrationProps) {
  const W = 155; const G = 180;
  const hip = { x: W - 4, y: 110 };
  const neck = { x: hip.x - 30, y: 55 };
  const head = { x: neck.x + 5, y: 38 };
  const shoulder = { x: neck.x + 5, y: 70 };
  // Arms raised behind for backswing
  const hands = { x: shoulder.x + 15, y: 42 };
  const clubEnd = { x: hands.x + 25, y: 35 };
  const lKnee = { x: hip.x - 20, y: 148 };
  const lFoot = { x: hip.x - 28, y: G };
  const tKnee = { x: hip.x + 5, y: 148 };
  const tFoot = { x: hip.x + 8, y: G };

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Rect x={W} y={10} width={16} height={G - 10} fill={color} opacity={0.1} rx={2} />
      <Line x1={W} y1={10} x2={W} y2={G} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={15} y1={G} x2={185} y2={G} stroke={color} strokeWidth={2} {...STROKE} />
      <Circle cx={head.x} cy={head.y} r={12} stroke={color} strokeWidth={2.5} fill="none" />
      <Line x1={neck.x} y1={neck.y} x2={hip.x} y2={hip.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={shoulder.x} y1={shoulder.y} x2={hands.x} y2={hands.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={hands.x} y1={hands.y} x2={clubEnd.x} y2={clubEnd.y} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={hip.x} y1={hip.y} x2={lKnee.x} y2={lKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={lKnee.x} y1={lKnee.y} x2={lFoot.x} y2={lFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={hip.x} y1={hip.y} x2={tKnee.x} y2={tKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={tKnee.x} y1={tKnee.y} x2={tFoot.x} y2={tFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Hip touching wall */}
      <Line x1={hip.x} y1={hip.y} x2={W} y2={hip.y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
      <Circle cx={W} cy={hip.y} r={3} fill={color} opacity={0.4} />
    </Svg>
  );
}

/** Downswing — glutes still against wall, hips starting to rotate. */
export function WallDownswing({ size = 200, color }: IllustrationProps) {
  const W = 155; const G = 180;
  const hip = { x: W - 4, y: 110 };
  const neck = { x: hip.x - 33, y: 55 };
  const head = { x: neck.x, y: 38 };
  const shoulder = { x: neck.x + 5, y: 70 };
  const hands = { x: shoulder.x - 15, y: 100 };
  const clubEnd = { x: hands.x - 20, y: 140 };
  const lKnee = { x: hip.x - 22, y: 148 };
  const lFoot = { x: hip.x - 30, y: G };
  const tKnee = { x: hip.x + 5, y: 148 };
  const tFoot = { x: hip.x + 8, y: G };

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Rect x={W} y={10} width={16} height={G - 10} fill={color} opacity={0.1} rx={2} />
      <Line x1={W} y1={10} x2={W} y2={G} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={15} y1={G} x2={185} y2={G} stroke={color} strokeWidth={2} {...STROKE} />
      <Circle cx={head.x} cy={head.y} r={12} stroke={color} strokeWidth={2.5} fill="none" />
      <Line x1={neck.x} y1={neck.y} x2={hip.x} y2={hip.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={shoulder.x} y1={shoulder.y} x2={hands.x} y2={hands.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={hands.x} y1={hands.y} x2={clubEnd.x} y2={clubEnd.y} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={hip.x} y1={hip.y} x2={lKnee.x} y2={lKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={lKnee.x} y1={lKnee.y} x2={lFoot.x} y2={lFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={hip.x} y1={hip.y} x2={tKnee.x} y2={tKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={tKnee.x} y1={tKnee.y} x2={tFoot.x} y2={tFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Hip touching wall */}
      <Line x1={hip.x} y1={hip.y} x2={W} y2={hip.y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
      <Circle cx={W} cy={hip.y} r={3} fill={color} opacity={0.4} />
      {/* Rotation arrow */}
      <Path d="M 130 100 Q 137 90 145 98" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Path d="M 142 95 L 145 98 L 141 101" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
    </Svg>
  );
}

/** Follow-through — hips open, weight on lead side, butt still near wall. */
export function WallImpact({ size = 200, color }: IllustrationProps) {
  const W = 155; const G = 180;
  const hip = { x: W - 8, y: 110 };
  const neck = { x: hip.x - 28, y: 52 };
  const head = { x: neck.x - 5, y: 35 };
  const shoulder = { x: neck.x + 2, y: 68 };
  // Arms wrapped up in finish
  const hands = { x: shoulder.x + 10, y: 45 };
  const clubEnd = { x: hands.x + 18, y: 30 };
  const lKnee = { x: hip.x - 25, y: 145 };
  const lFoot = { x: hip.x - 32, y: G };
  // Trail heel up
  const tKnee = { x: hip.x + 3, y: 145 };
  const tFoot = { x: hip.x + 6, y: 168 };

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Rect x={W} y={10} width={16} height={G - 10} fill={color} opacity={0.1} rx={2} />
      <Line x1={W} y1={10} x2={W} y2={G} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={15} y1={G} x2={185} y2={G} stroke={color} strokeWidth={2} {...STROKE} />
      <Circle cx={head.x} cy={head.y} r={12} stroke={color} strokeWidth={2.5} fill="none" />
      <Line x1={neck.x} y1={neck.y} x2={hip.x} y2={hip.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={shoulder.x} y1={shoulder.y} x2={hands.x} y2={hands.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={hands.x} y1={hands.y} x2={clubEnd.x} y2={clubEnd.y} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={hip.x} y1={hip.y} x2={lKnee.x} y2={lKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={lKnee.x} y1={lKnee.y} x2={lFoot.x} y2={lFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={hip.x} y1={hip.y} x2={tKnee.x} y2={tKnee.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={tKnee.x} y1={tKnee.y} x2={tFoot.x} y2={tFoot.y} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Hip near wall */}
      <Line x1={hip.x} y1={hip.y} x2={W} y2={hip.y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
      <Circle cx={W} cy={hip.y} r={3} fill={color} opacity={0.4} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// PUMP DRILL — side view, golfer faces LEFT
// ---------------------------------------------------------------------------

/** Address — proper golf posture side view, club behind ball. */
export function PumpAddress({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={175} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={85} cy={53} r={10} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE — forward tilt */}
      <Line x1={85} y1={63} x2={100} y2={113} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — down to hands at address */}
      <Line x1={90} y1={78} x2={78} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB — hands to ball */}
      <Line x1={78} y1={122} x2={70} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={100} y1={113} x2={90} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={90} y1={147} x2={85} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={100} y1={113} x2={113} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={113} y1={147} x2={118} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* BALL */}
      <Circle cx={68} cy={175} r={4} fill={color} />
    </Svg>
  );
}

/** Top of backswing — wrists fully hinged, club at 90°, pause dots. */
export function PumpTop({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={175} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD — rotated slightly with shoulder turn */}
      <Circle cx={88} cy={55} r={10} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={88} y1={65} x2={102} y2={115} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — lead arm raised into backswing */}
      <Line x1={93} y1={80} x2={68} y2={58} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB at top — wrist hinge makes club point ~horizontal */}
      <Line x1={68} y1={58} x2={42} y2={52} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Wrist hinge angle arc */}
      <Path d="M 76 52 A 10 10 0 0 0 62 65" stroke={color} strokeWidth={1.5} fill="none" />

      {/* LEAD LEG */}
      <Line x1={102} y1={115} x2={91} y2={148} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={91} y1={148} x2={86} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={102} y1={115} x2={115} y2={148} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={115} y1={148} x2={120} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* PAUSE dots */}
      <Circle cx={148} cy={38} r={3.5} fill={color} opacity={0.7} />
      <Circle cx={160} cy={38} r={3.5} fill={color} opacity={0.7} />
      <Circle cx={172} cy={38} r={3.5} fill={color} opacity={0.7} />
    </Svg>
  );
}

/** Pump motion — halfway down, wrist angle preserved (lag), pump arrows. */
export function PumpDown({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={175} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={86} cy={54} r={10} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={86} y1={64} x2={101} y2={114} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — mid downswing, hands lower but lag maintained */}
      <Line x1={91} y1={79} x2={72} y2={95} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB — wrist hinge angle preserved (lag — club still points back) */}
      <Line x1={72} y1={95} x2={55} y2={80} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Lag angle arc */}
      <Path d="M 79 88 A 10 10 0 0 0 66 100" stroke={color} strokeWidth={1.5} fill="none" />

      {/* Pump arrows — up and down beside figure */}
      <Line x1={38} y1={78} x2={38} y2={128} stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
      <Path d="M 35 125 L 38 132 L 41 125" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Line x1={28} y1={128} x2={28} y2={78} stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
      <Path d="M 25 81 L 28 74 L 31 81" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={101} y1={114} x2={90} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={90} y1={147} x2={85} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={101} y1={114} x2={114} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={114} y1={147} x2={119} y2={175} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

/** Release — through impact, wrist releasing, club extended toward target. */
export function PumpRelease({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={175} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={84} cy={53} r={10} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE — slightly more upright at impact */}
      <Line x1={84} y1={63} x2={97} y2={112} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — extended through impact zone */}
      <Line x1={89} y1={78} x2={68} y2={112} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB — extended through ball, releasing */}
      <Line x1={68} y1={112} x2={58} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Release arc — dotted curve showing club path */}
      <Path d="M 74 105 Q 64 138 60 168" stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="3 2" />

      {/* BALL */}
      <Circle cx={56} cy={175} r={4} fill={color} />

      {/* LEAD LEG */}
      <Line x1={97} y1={112} x2={86} y2={146} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={86} y1={146} x2={80} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={97} y1={112} x2={112} y2={146} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={112} y1={146} x2={118} y2={175} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// STEP THROUGH — front-ish view (slight 3/4)
// ---------------------------------------------------------------------------

/** Feet touching, ball in front, club at address. */
export function StepStance({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={100} cy={48} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE — slight forward tilt (3/4 view) */}
      <Line x1={100} y1={59} x2={104} y2={112} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS */}
      <Line x1={78} y1={76} x2={122} y2={76} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — down and slightly in front */}
      <Line x1={78} y1={76} x2={84} y2={118} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={122} y1={76} x2={112} y2={116} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB — hands to ball */}
      <Line x1={96} y1={117} x2={93} y2={172} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HIP (narrow — just a short line) */}
      <Line x1={96} y1={112} x2={114} y2={112} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG (left) */}
      <Line x1={96} y1={112} x2={94} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={94} y1={147} x2={91} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG (right) — feet touching */}
      <Line x1={114} y1={112} x2={110} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={110} y1={147} x2={108} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Feet-together bracket */}
      <Line x1={86} y1={179} x2={86} y2={183} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={86} y1={181} x2={114} y2={181} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={114} y1={179} x2={114} y2={183} stroke={color} strokeWidth={2} {...STROKE} />

      {/* BALL */}
      <Circle cx={91} cy={172} r={4} fill={color} />
    </Svg>
  );
}

/** Three-quarter backswing — lead foot slightly raised, dashed. */
export function StepBackswing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={102} cy={50} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={102} y1={61} x2={106} y2={113} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS — rotated backswing (lead shoulder drops) */}
      <Line x1={78} y1={75} x2={126} y2={82} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — lead arm raised backswing */}
      <Line x1={78} y1={75} x2={60} y2={56} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={126} y1={82} x2={110} y2={94} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB — 3/4 position */}
      <Line x1={60} y1={56} x2={44} y2={42} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HIP */}
      <Line x1={96} y1={113} x2={116} y2={113} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG (right) — grounded */}
      <Line x1={116} y1={113} x2={120} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={120} y1={147} x2={124} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG (left) — slightly lifted off ground */}
      <Line x1={96} y1={113} x2={90} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={90} y1={147} x2={86} y2={165} stroke={color} strokeWidth={2} strokeDasharray="4 3" />
    </Svg>
  );
}

/** Lead foot stepping toward target — arrow, transition moment. */
export function StepSwing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={100} cy={51} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={100} y1={62} x2={104} y2={113} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS — starting to square */}
      <Line x1={78} y1={78} x2={124} y2={78} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — downswing starting */}
      <Line x1={78} y1={78} x2={68} y2={104} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={124} y1={78} x2={110} y2={92} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB — coming down, lag still present */}
      <Line x1={68} y1={104} x2={54} y2={90} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HIP */}
      <Line x1={96} y1={113} x2={114} y2={113} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG — still back */}
      <Line x1={114} y1={113} x2={118} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={118} y1={147} x2={122} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG — stepping forward (left) */}
      <Line x1={96} y1={113} x2={78} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={78} y1={147} x2={70} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Step arrow — toward target */}
      <Path d="M 78 163 L 58 163" stroke={color} strokeWidth={2} fill="none" {...STROKE} />
      <Path d="M 62 159 L 55 163 L 62 167" stroke={color} strokeWidth={2} fill="none" {...STROKE} />
    </Svg>
  );
}

/** Finish — weight fully on lead foot, trail foot stepped through. */
export function StepFinish({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD — facing target */}
      <Circle cx={96} cy={48} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE — more upright in finish */}
      <Line x1={96} y1={59} x2={98} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS — open, wrapped */}
      <Line x1={74} y1={74} x2={120} y2={70} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — wrapped high in finish */}
      <Line x1={74} y1={74} x2={66} y2={52} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={120} y1={70} x2={108} y2={80} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB — over shoulder finish */}
      <Line x1={66} y1={52} x2={54} y2={38} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HIP — open */}
      <Line x1={84} y1={110} x2={110} y2={106} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG — weight bearing, planted forward */}
      <Line x1={84} y1={110} x2={74} y2={145} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={74} y1={145} x2={68} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG — stepped through, heel up */}
      <Line x1={110} y1={106} x2={112} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={112} y1={140} x2={118} y2={158} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Balance check arrow */}
      <Line x1={68} y1={172} x2={68} y2={155} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      <Path d="M 65 158 L 68 150 L 71 158" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
    </Svg>
  );
}

/** Progress — small half-swing figure on left, full swing on right, arrow between. */
export function StepProgress({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={10} y1={175} x2={190} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEFT: compact figure — half swing (scale ~0.65) */}
      {/* Head */}
      <Circle cx={52} cy={55} r={8} stroke={color} strokeWidth={1.5} fill="none" />
      {/* Spine */}
      <Line x1={52} y1={63} x2={60} y2={98} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Shoulders */}
      <Line x1={38} y1={74} x2={66} y2={74} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Arms half raised */}
      <Line x1={38} y1={74} x2={28} y2={60} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={28} y1={60} x2={20} y2={54} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={66} y1={74} x2={58} y2={84} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Hip */}
      <Line x1={52} y1={98} x2={66} y2={98} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Lead leg */}
      <Line x1={52} y1={98} x2={48} y2={135} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={48} y1={135} x2={44} y2={175} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Trail leg */}
      <Line x1={66} y1={98} x2={70} y2={135} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={70} y1={135} x2={74} y2={175} stroke={color} strokeWidth={1.5} {...STROKE} />

      {/* Arrow pointing right */}
      <Line x1={88} y1={100} x2={110} y2={100} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Path d="M 107 95 L 114 100 L 107 105" stroke={color} strokeWidth={2.5} fill="none" {...STROKE} />

      {/* RIGHT: full figure — full swing finish */}
      {/* Head */}
      <Circle cx={148} cy={48} r={9} stroke={color} strokeWidth={1.5} fill="none" />
      {/* Spine */}
      <Line x1={148} y1={57} x2={154} y2={106} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Shoulders — open finish */}
      <Line x1={128} y1={72} x2={170} y2={68} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Arms wrapped high */}
      <Line x1={128} y1={72} x2={120} y2={52} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={120} y1={52} x2={112} y2={40} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={170} y1={68} x2={160} y2={78} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Hip */}
      <Line x1={140} y1={106} x2={162} y2={102} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Lead leg */}
      <Line x1={140} y1={106} x2={132} y2={140} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={132} y1={140} x2={126} y2={175} stroke={color} strokeWidth={1.5} {...STROKE} />
      {/* Trail leg — heel up */}
      <Line x1={162} y1={102} x2={164} y2={136} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={164} y1={136} x2={168} y2={154} stroke={color} strokeWidth={1.5} {...STROKE} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// TEE GATE — top-down view
// ---------------------------------------------------------------------------

/** Top-down: two tees flanking ball, target line, club head positioned. */
export function GateSetup({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line — dashed, top to bottom */}
      <Line x1={100} y1={12} x2={100} y2={188} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee INSIDE (target-side, left of ball) */}
      <Circle cx={82} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={110} x2={82} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee OUTSIDE (right of ball) */}
      <Circle cx={118} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={110} x2={118} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* BALL — centered between tees */}
      <Circle cx={100} cy={118} r={6} fill={color} />

      {/* Club head — top-down ellipse */}
      <Ellipse
        cx={100}
        cy={85}
        rx={14}
        ry={7}
        stroke={color}
        strokeWidth={2}
        fill="none"
        transform="rotate(-10, 100, 85)"
      />
      {/* Club shaft */}
      <Line x1={112} y1={80} x2={148} y2={58} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Gate width dimension */}
      <Line x1={82} y1={130} x2={118} y2={130} stroke={color} strokeWidth={1} />
      <Line x1={82} y1={126} x2={82} y2={134} stroke={color} strokeWidth={1} />
      <Line x1={118} y1={126} x2={118} y2={134} stroke={color} strokeWidth={1} />
    </Svg>
  );
}

/** Top-down: slow rehearsal swing — curved path through gate, SLOW label. */
export function GateSlow({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line */}
      <Line x1={100} y1={12} x2={100} y2={188} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee INSIDE */}
      <Circle cx={82} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={110} x2={82} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee OUTSIDE */}
      <Circle cx={118} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={110} x2={118} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* BALL */}
      <Circle cx={100} cy={118} r={6} fill={color} />

      {/* Slow club path — gentle arc through gate */}
      <Path
        d="M 148 58 Q 112 75 100 95 Q 88 115 100 138 Q 110 155 120 172"
        stroke={color}
        strokeWidth={2}
        fill="none"
        {...STROKE}
      />
      <Path d="M 114 169 L 120 176 L 125 168" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* SLOW label */}
      <Text x={154} y={108} fontSize={13} fontWeight="bold" fill={color} textAnchor="middle">
        SLOW
      </Text>
    </Svg>
  );
}

/** Top-down: faster swing — wider arc, speed lines from club head. */
export function GateSpeed({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line */}
      <Line x1={100} y1={12} x2={100} y2={188} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee INSIDE */}
      <Circle cx={82} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={110} x2={82} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee OUTSIDE */}
      <Circle cx={118} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={110} x2={118} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* BALL */}
      <Circle cx={100} cy={118} r={6} fill={color} />

      {/* Wider faster arc */}
      <Path
        d="M 158 48 Q 118 70 100 93 Q 82 115 100 140 Q 114 158 128 176"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        {...STROKE}
      />
      <Path d="M 122 173 L 128 180 L 133 173" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* Speed lines near start of arc */}
      <Line x1={156} y1={45} x2={163} y2={40} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={159} y1={52} x2={168} y2={50} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={161} y1={59} x2={170} y2={60} stroke={color} strokeWidth={1.5} {...STROKE} />
    </Svg>
  );
}

/** Top-down: full swing — ball trajectory straight up target line, check mark. */
export function GateFull({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line */}
      <Line x1={100} y1={12} x2={100} y2={188} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee INSIDE */}
      <Circle cx={82} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={110} x2={82} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee OUTSIDE */}
      <Circle cx={118} cy={105} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={110} x2={118} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* BALL */}
      <Circle cx={100} cy={118} r={6} fill={color} />

      {/* Full arc */}
      <Path
        d="M 162 42 Q 120 66 100 90 Q 80 114 100 140 Q 115 158 130 178"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        {...STROKE}
      />
      <Path d="M 124 175 L 130 182 L 135 175" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* Ball flight — straight up target */}
      <Line x1={100} y1={112} x2={100} y2={22} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      <Path d="M 97 25 L 100 17 L 103 25" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />

      {/* Check mark */}
      <Path d="M 150 32 L 157 42 L 172 22" stroke={color} strokeWidth={2.5} fill="none" {...STROKE} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// TEMPO (3-to-1) — mix of metronome + side-view golfer
// ---------------------------------------------------------------------------

/** Metronome body with pendulum, 72 BPM label. */
export function TempoMetronome({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Metronome body — triangle */}
      <Path d="M 100 28 L 158 170 L 42 170 Z" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* Base rectangle */}
      <Rect x={48} y={164} width={104} height={20} rx={3} stroke={color} strokeWidth={2} fill="none" />

      {/* Centre vertical reference line */}
      <Line x1={100} y1={170} x2={100} y2={52} stroke={color} strokeWidth={1} strokeDasharray="3 2" />

      {/* Pendulum — angled to the right */}
      <Line x1={100} y1={170} x2={134} y2={78} stroke={color} strokeWidth={2.5} {...STROKE} />

      {/* Pendulum weight (small rect) */}
      <Rect x={127} y={70} width={16} height={12} rx={2} stroke={color} strokeWidth={2} fill="none" />

      {/* Pivot dot */}
      <Circle cx={100} cy={170} r={4} fill={color} />

      {/* BPM label */}
      <Text x={100} y={150} fontSize={12} fontWeight="bold" fill={color} textAnchor="middle">
        72 BPM
      </Text>
    </Svg>
  );
}

/** Side view — three numbered checkpoints along backswing arc. */
export function TempoBackswing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={108} cy={54} r={10} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={108} y1={64} x2={122} y2={114} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — raised at top */}
      <Line x1={113} y1={79} x2={90} y2={60} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={90} y1={60} x2={68} y2={44} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={122} y1={114} x2={110} y2={148} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={110} y1={148} x2={104} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={122} y1={114} x2={135} y2={148} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={135} y1={148} x2={140} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Backswing arc — dotted */}
      <Path
        d="M 104 170 Q 72 148 58 110 Q 44 72 60 50"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="4 3"
      />

      {/* Position 1 — early takeaway */}
      <Circle cx={90} cy={155} r={11} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={90} y={159} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">1</Text>

      {/* Position 2 — mid backswing */}
      <Circle cx={58} cy={102} r={11} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={58} y={106} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">2</Text>

      {/* Position 3 — top */}
      <Circle cx={64} cy={50} r={11} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={64} y={54} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">3</Text>
    </Svg>
  );
}

/** Top of backswing transitioning down — direction change arrow, "1" label. */
export function TempoTransition({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={106} cy={55} r={10} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={106} y1={65} x2={120} y2={115} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS at top, beginning to unload */}
      <Line x1={111} y1={80} x2={88} y2={60} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={88} y1={60} x2={66} y2={45} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={120} y1={115} x2={108} y2={148} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={108} y1={148} x2={102} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={120} y1={115} x2={133} y2={148} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={133} y1={148} x2={138} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Direction change — curved arrow pointing down */}
      <Path d="M 52 48 Q 38 72 48 108" stroke={color} strokeWidth={2} fill="none" {...STROKE} />
      <Path d="M 45 104 L 48 112 L 52 106" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* "1" badge */}
      <Circle cx={54} cy={44} r={11} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={54} y={48} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">1</Text>
    </Svg>
  );
}

/** Address — circular repeat arrow, ×20 label, readying for another rep. */
export function TempoRepeat({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={175} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={85} cy={53} r={10} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={85} y1={63} x2={100} y2={113} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS at address */}
      <Line x1={90} y1={78} x2={78} y2={122} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB */}
      <Line x1={78} y1={122} x2={70} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={100} y1={113} x2={90} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={90} y1={147} x2={85} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={100} y1={113} x2={113} y2={147} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={113} y1={147} x2={118} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* BALL */}
      <Circle cx={68} cy={175} r={4} fill={color} />

      {/* Circular repeat arrow — large arc around figure */}
      <Path
        d="M 148 88 A 55 55 0 1 0 148 112"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray="6 3"
      />
      <Path d="M 144 109 L 150 116 L 154 108" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* ×20 label */}
      <Text x={164} y={103} fontSize={14} fontWeight="bold" fill={color} textAnchor="middle">
        ×20
      </Text>
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// FEET TOGETHER — front/side view
// ---------------------------------------------------------------------------

/** Feet touching, ball teed, club at address. Bracket emphasizes feet. */
export function FeetStance({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee */}
      <Line x1={100} y1={163} x2={100} y2={175} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={94} y1={163} x2={106} y2={163} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ball on tee */}
      <Circle cx={100} cy={157} r={6} stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx={100} cy={157} r={2.5} fill={color} />

      {/* HEAD */}
      <Circle cx={100} cy={46} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE — slight tilt */}
      <Line x1={100} y1={57} x2={104} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS */}
      <Line x1={78} y1={74} x2={122} y2={74} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS */}
      <Line x1={78} y1={74} x2={86} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={122} y1={74} x2={112} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* CLUB */}
      <Line x1={97} y1={111} x2={100} y2={151} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HIP — narrow */}
      <Line x1={96} y1={110} x2={112} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={96} y1={110} x2={94} y2={145} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={94} y1={145} x2={92} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG — feet touching */}
      <Line x1={112} y1={110} x2={108} y2={145} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={108} y1={145} x2={106} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Feet-together bracket */}
      <Line x1={86} y1={179} x2={86} y2={184} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={86} y1={182} x2={114} y2={182} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={114} y1={179} x2={114} y2={184} stroke={color} strokeWidth={2.5} {...STROKE} />
    </Svg>
  );
}

/** Half backswing — upper body rotating, feet stay together, rotation arrows. */
export function FeetHalf({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Centre vertical reference */}
      <Line x1={100} y1={18} x2={100} y2={175} stroke={color} strokeWidth={1} strokeDasharray="4 3" />

      {/* HEAD */}
      <Circle cx={102} cy={48} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={102} y1={59} x2={105} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS — half rotation */}
      <Line x1={78} y1={74} x2={126} y2={78} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — lead arm at parallel */}
      <Line x1={78} y1={74} x2={62} y2={62} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={62} y1={62} x2={44} y2={58} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={126} y1={78} x2={110} y2={92} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HIP */}
      <Line x1={96} y1={110} x2={113} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={96} y1={110} x2={94} y2={145} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={94} y1={145} x2={92} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG — feet together */}
      <Line x1={113} y1={110} x2={109} y2={145} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={109} y1={145} x2={107} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Rotation arrows around upper body */}
      <Path d="M 88 82 Q 80 70 90 62" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Path d="M 87 65 L 91 60 L 93 66" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
    </Svg>
  );
}

/** Three-quarter backswing — bigger rotation, balance indicator at feet. */
export function FeetThreeQuarter({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Balance level indicator */}
      <Line x1={68} y1={175} x2={132} y2={175} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Line x1={66} y1={170} x2={66} y2={180} stroke={color} strokeWidth={1.5} />
      <Line x1={134} y1={170} x2={134} y2={180} stroke={color} strokeWidth={1.5} />

      {/* HEAD */}
      <Circle cx={104} cy={49} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE */}
      <Line x1={104} y1={60} x2={107} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS — three-quarter rotation */}
      <Line x1={78} y1={74} x2={128} y2={82} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — lead arm more raised */}
      <Line x1={78} y1={74} x2={60} y2={55} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={60} y1={55} x2={44} y2={42} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={128} y1={82} x2={110} y2={94} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Club arc dotted */}
      <Path d="M 92 170 Q 62 138 48 96 Q 38 62 56 42" stroke={color} strokeWidth={1} fill="none" strokeDasharray="3 3" />

      {/* HIP */}
      <Line x1={96} y1={110} x2={115} y2={110} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG */}
      <Line x1={96} y1={110} x2={94} y2={145} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={94} y1={145} x2={90} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG */}
      <Line x1={115} y1={110} x2={111} y2={145} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={111} y1={145} x2={109} y2={175} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

/** Full finish — held for 3 seconds, clock icon, balanced on lead foot. */
export function FeetFull({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={18} y1={175} x2={182} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HEAD */}
      <Circle cx={96} cy={47} r={11} stroke={color} strokeWidth={2} fill="none" />

      {/* SPINE — more upright finish */}
      <Line x1={96} y1={58} x2={98} y2={108} stroke={color} strokeWidth={2} {...STROKE} />

      {/* SHOULDERS — open/wrapped */}
      <Line x1={74} y1={73} x2={120} y2={69} stroke={color} strokeWidth={2} {...STROKE} />

      {/* ARMS — high finish */}
      <Line x1={74} y1={73} x2={66} y2={52} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={66} y1={52} x2={56} y2={38} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={120} y1={69} x2={108} y2={78} stroke={color} strokeWidth={2} {...STROKE} />

      {/* HIP — open */}
      <Line x1={82} y1={108} x2={114} y2={104} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEAD LEG — balanced, planted */}
      <Line x1={82} y1={108} x2={76} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={76} y1={143} x2={70} y2={175} stroke={color} strokeWidth={2} {...STROKE} />

      {/* TRAIL LEG — heel up, balanced on toe */}
      <Line x1={114} y1={104} x2={114} y2={138} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={114} y1={138} x2={118} y2={156} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Clock icon */}
      <Circle cx={155} cy={48} r={15} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={155} y1={48} x2={155} y2={37} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={155} y1={48} x2={163} y2={54} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Circle cx={155} cy={48} r={2} fill={color} />

      {/* 3 sec label */}
      <Text x={155} y={76} fontSize={12} fontWeight="bold" fill={color} textAnchor="middle">
        3 sec
      </Text>
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Export lookup
// ---------------------------------------------------------------------------

export const DRILL_ILLUSTRATIONS: Record<
  string,
  ((props: { size?: number; color: string }) => React.ReactElement)[]
> = {
  "wall-drill": [WallSetup, WallBackswing, WallDownswing, WallImpact],
  "pump-drill": [PumpAddress, PumpTop, PumpDown, PumpRelease],
  "step-through": [StepStance, StepBackswing, StepSwing, StepFinish, StepProgress],
  "tee-gate": [GateSetup, GateSlow, GateSpeed, GateFull],
  "3-to-1-tempo": [TempoMetronome, TempoBackswing, TempoTransition, TempoRepeat],
  "feet-together": [FeetStance, FeetHalf, FeetThreeQuarter, FeetFull],
};
