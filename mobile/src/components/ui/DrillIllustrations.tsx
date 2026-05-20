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
// WALL DRILL
// ---------------------------------------------------------------------------

/** Side view: golfer at address, back against a wall on the right. */
export function WallSetup({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Wall (right side) */}
      <Rect
        x={155}
        y={20}
        width={12}
        height={145}
        fill={color}
        opacity={0.12}
        rx={2}
      />
      <Line x1={155} y1={20} x2={155} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ground */}
      <Line x1={20} y1={165} x2={180} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Stick figure — address position, back near wall */}
      {/* Head */}
      <Circle cx={120} cy={50} r={10} stroke={color} strokeWidth={2} fill="none" />
      {/* Spine / torso */}
      <Line x1={120} y1={60} x2={118} y2={105} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips — trail hip touching wall */}
      <Line x1={100} y1={105} x2={148} y2={103} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg */}
      <Line x1={100} y1={105} x2={96} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={96} y1={140} x2={88} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg */}
      <Line x1={148} y1={103} x2={148} y2={138} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={148} y1={138} x2={150} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm down */}
      <Line x1={118} y1={75} x2={100} y2={105} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm angled (club) */}
      <Line x1={118} y1={75} x2={104} y2={110} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club */}
      <Line x1={104} y1={110} x2={82} y2={163} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Ball */}
      <Circle cx={80} cy={165} r={4} fill={color} />

      {/* "BACK" label indicator */}
      <Line x1={135} y1={95} x2={155} y2={95} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
    </Svg>
  );
}

/** Side view: backswing — trail hip still near wall, club raised. */
export function WallBackswing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Wall */}
      <Rect x={155} y={20} width={12} height={145} fill={color} opacity={0.12} rx={2} />
      <Line x1={155} y1={20} x2={155} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ground */}
      <Line x1={20} y1={165} x2={180} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head — rotated slightly */}
      <Circle cx={112} cy={52} r={10} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso tilted into backswing */}
      <Line x1={112} y1={62} x2={116} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips — trail hip near wall */}
      <Line x1={98} y1={108} x2={148} y2={106} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg */}
      <Line x1={98} y1={108} x2={92} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={92} y1={142} x2={84} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg */}
      <Line x1={148} y1={106} x2={149} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={149} y1={140} x2={151} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm — raised backswing */}
      <Line x1={112} y1={75} x2={90} y2={55} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm — club raised */}
      <Line x1={112} y1={75} x2={95} y2={60} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club at top */}
      <Line x1={90} y1={55} x2={68} y2={40} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Contact indicator: trail hip to wall */}
      <Line x1={148} y1={100} x2={155} y2={100} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
    </Svg>
  );
}

/** Downswing — glutes pressed to wall, hips rotating. */
export function WallDownswing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Wall */}
      <Rect x={155} y={20} width={12} height={145} fill={color} opacity={0.12} rx={2} />
      <Line x1={155} y1={20} x2={155} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ground */}
      <Line x1={20} y1={165} x2={180} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={115} cy={55} r={10} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={115} y1={65} x2={118} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips rotating — glutes near wall */}
      <Line x1={100} y1={108} x2={150} y2={106} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hip rotation arrow */}
      <Path d="M 130 98 Q 140 88 148 95" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Path d="M 145 92 L 148 95 L 144 98" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      {/* Lead leg */}
      <Line x1={100} y1={108} x2={92} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={92} y1={142} x2={84} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg */}
      <Line x1={150} y1={106} x2={150} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={150} y1={140} x2={152} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms — mid-downswing */}
      <Line x1={115} y1={78} x2={98} y2={88} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={115} y1={78} x2={100} y2={90} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club mid-down */}
      <Line x1={98} y1={88} x2={78} y2={120} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Glutes contact */}
      <Line x1={148} y1={112} x2={155} y2={112} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
    </Svg>
  );
}

/** Follow-through — lead hip rotated open, still near wall. */
export function WallImpact({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Wall */}
      <Rect x={155} y={20} width={12} height={145} fill={color} opacity={0.12} rx={2} />
      <Line x1={155} y1={20} x2={155} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ground */}
      <Line x1={20} y1={165} x2={180} y2={165} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head — turned toward target */}
      <Circle cx={108} cy={55} r={10} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso in finish */}
      <Line x1={108} y1={65} x2={112} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips open — lead hip rotated */}
      <Line x1={100} y1={108} x2={148} y2={104} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead hip open arrow */}
      <Path d="M 108 100 Q 100 90 95 98" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Path d="M 93 95 L 95 98 L 98 95" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      {/* Lead leg — weight shifted */}
      <Line x1={100} y1={108} x2={96} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={96} y1={142} x2={90} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg — heel up */}
      <Line x1={148} y1={104} x2={145} y2={138} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={145} y1={138} x2={148} y2={155} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms — follow-through wrap */}
      <Line x1={108} y1={78} x2={88} y2={58} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={108} y1={78} x2={90} y2={62} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club wrapped up */}
      <Line x1={88} y1={58} x2={72} y2={45} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// PUMP DRILL
// ---------------------------------------------------------------------------

/** Front-ish view: address — relaxed stance, club grounded. */
export function PumpAddress({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={100} cy={45} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Neck/Torso */}
      <Line x1={100} y1={56} x2={100} y2={110} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders */}
      <Line x1={72} y1={72} x2={128} y2={72} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Left arm (trail) */}
      <Line x1={72} y1={72} x2={68} y2={105} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Right arm (lead) */}
      <Line x1={128} y1={72} x2={110} y2={100} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hands together */}
      <Line x1={68} y1={105} x2={110} y2={100} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club down to ball */}
      <Line x1={90} y1={102} x2={80} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={80} y1={110} x2={120} y2={110} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Left leg */}
      <Line x1={80} y1={110} x2={75} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={75} y1={142} x2={70} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Right leg */}
      <Line x1={120} y1={110} x2={125} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={125} y1={142} x2={130} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Ball */}
      <Circle cx={80} cy={165} r={4} fill={color} />
    </Svg>
  );
}

/** Top of backswing — wrists fully hinged, dotted pause indicator. */
export function PumpTop({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={105} cy={48} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso rotated */}
      <Line x1={103} y1={59} x2={100} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders rotated */}
      <Line x1={75} y1={75} x2={128} y2={68} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm up — backswing */}
      <Line x1={75} y1={75} x2={58} y2={52} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm */}
      <Line x1={128} y1={68} x2={108} y2={85} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Wrist hinge angle indicator */}
      <Line x1={58} y1={52} x2={42} y2={38} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      {/* Club at top — perpendicular (wrist hinge) */}
      <Line x1={58} y1={52} x2={35} y2={48} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Wrist hinge angle arc */}
      <Path d="M 66 46 A 10 10 0 0 0 52 56" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Hips */}
      <Line x1={80} y1={112} x2={120} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Left leg */}
      <Line x1={80} y1={112} x2={74} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={74} y1={143} x2={68} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Right leg */}
      <Line x1={120} y1={112} x2={126} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={126} y1={143} x2={132} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* PAUSE dots */}
      <Circle cx={155} cy={35} r={3} fill={color} opacity={0.6} />
      <Circle cx={165} cy={35} r={3} fill={color} opacity={0.6} />
      <Circle cx={175} cy={35} r={3} fill={color} opacity={0.6} />
    </Svg>
  );
}

/** Pump motion — halfway down with curved arrows showing pump. Wrist angle preserved. */
export function PumpDown({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={102} cy={50} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={100} y1={61} x2={100} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders */}
      <Line x1={74} y1={76} x2={126} y2={72} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm — mid down */}
      <Line x1={74} y1={76} x2={65} y2={100} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm */}
      <Line x1={126} y1={72} x2={108} y2={88} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club — wrist angle preserved (lag) */}
      <Line x1={65} y1={100} x2={50} y2={90} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Wrist angle indicator */}
      <Path d="M 72 96 A 10 10 0 0 0 60 105" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Pump arrows: down then up */}
      <Path d="M 38 75 L 38 120" stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
      <Path d="M 35 118 L 38 124 L 41 118" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Path d="M 28 118 L 28 73" stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
      <Path d="M 25 75 L 28 69 L 31 75" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      {/* Hips */}
      <Line x1={80} y1={112} x2={120} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Legs */}
      <Line x1={80} y1={112} x2={74} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={74} y1={143} x2={68} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={120} y1={112} x2={126} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={126} y1={143} x2={132} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

/** Release — through impact, wrist releasing, club extended. */
export function PumpRelease({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={98} cy={52} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={98} y1={63} x2={100} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders */}
      <Line x1={72} y1={76} x2={126} y2={76} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm extended through */}
      <Line x1={72} y1={76} x2={55} y2={100} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm extended */}
      <Line x1={126} y1={76} x2={110} y2={95} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hands at impact zone */}
      <Line x1={55} y1={100} x2={110} y2={95} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      {/* Club extended — releasing */}
      <Line x1={80} y1={97} x2={60} y2={155} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Release arc */}
      <Path d="M 85 90 Q 70 120 62 148" stroke={color} strokeWidth={1.5} fill="none" strokeDasharray="3 2" />
      {/* Ball */}
      <Circle cx={60} cy={165} r={4} fill={color} />
      {/* Hips */}
      <Line x1={80} y1={112} x2={122} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Legs */}
      <Line x1={80} y1={112} x2={74} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={74} y1={143} x2={68} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={122} y1={108} x2={126} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={126} y1={143} x2={132} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// STEP THROUGH
// ---------------------------------------------------------------------------

/** Front view — feet touching, ball in center. */
export function StepStance({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={100} cy={45} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={100} y1={56} x2={100} y2={110} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders */}
      <Line x1={76} y1={74} x2={124} y2={74} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms */}
      <Line x1={76} y1={74} x2={82} y2={105} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={124} y1={74} x2={112} y2={102} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club */}
      <Line x1={95} y1={103} x2={100} y2={165} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={85} y1={110} x2={115} y2={110} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Left leg — touching right */}
      <Line x1={85} y1={110} x2={92} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={92} y1={143} x2={95} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Right leg — touching left */}
      <Line x1={115} y1={110} x2={108} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={108} y1={143} x2={105} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Feet together emphasis bracket */}
      <Line x1={88} y1={172} x2={88} y2={176} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={88} y1={174} x2={112} y2={174} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={112} y1={172} x2={112} y2={176} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Ball */}
      <Circle cx={100} cy={165} r={4} fill={color} />
    </Svg>
  );
}

/** Three-quarter backswing, lead foot slightly lifted (dashed). */
export function StepBackswing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={102} cy={48} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso rotated */}
      <Line x1={101} y1={59} x2={100} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders — rotated backswing */}
      <Line x1={76} y1={72} x2={126} y2={80} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm raised */}
      <Line x1={76} y1={72} x2={60} y2={55} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm */}
      <Line x1={126} y1={80} x2={108} y2={92} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club at three-quarter */}
      <Line x1={60} y1={55} x2={42} y2={42} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={82} y1={112} x2={118} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg (left) — slightly lifted */}
      <Line x1={82} y1={112} x2={78} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={78} y1={143} x2={74} y2={162} stroke={color} strokeWidth={2} strokeDasharray="4 3" />
      {/* Trail leg */}
      <Line x1={118} y1={112} x2={122} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={122} y1={143} x2={126} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

/** Lead foot stepping toward target — arrow showing step, transition. */
export function StepSwing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={100} cy={50} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={100} y1={61} x2={100} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders — transition */}
      <Line x1={76} y1={76} x2={124} y2={76} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms downswing start */}
      <Line x1={76} y1={76} x2={70} y2={100} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={124} y1={76} x2={110} y2={90} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club coming down */}
      <Line x1={70} y1={100} x2={58} y2={88} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={82} y1={112} x2={118} y2={112} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg — stable */}
      <Line x1={118} y1={112} x2={122} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={122} y1={143} x2={126} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg — stepping forward */}
      <Line x1={82} y1={112} x2={72} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={72} y1={143} x2={62} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Step arrow — toward target (left) */}
      <Path d="M 72 158 L 55 158" stroke={color} strokeWidth={2} fill="none" {...STROKE} />
      <Path d="M 58 154 L 52 158 L 58 162" stroke={color} strokeWidth={2} fill="none" {...STROKE} />
    </Svg>
  );
}

/** Finish — weight on lead foot, balance arrows. */
export function StepFinish({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head — facing target */}
      <Circle cx={96} cy={48} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso — upright finish */}
      <Line x1={96} y1={59} x2={98} y2={110} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders wrap */}
      <Line x1={74} y1={74} x2={120} y2={70} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms wrapped high */}
      <Line x1={74} y1={74} x2={68} y2={55} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={120} y1={70} x2={108} y2={80} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club wrapped over shoulder */}
      <Line x1={68} y1={55} x2={58} y2={42} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips — open */}
      <Line x1={80} y1={110} x2={118} y2={106} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg — weight bearing */}
      <Line x1={80} y1={110} x2={76} y2={143} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={76} y1={143} x2={72} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg — heel up finish */}
      <Line x1={118} y1={106} x2={118} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={118} y1={140} x2={122} y2={158} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Balance arrows — up from lead foot */}
      <Line x1={72} y1={165} x2={72} y2={148} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      <Path d="M 69 151 L 72 145 L 75 151" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
    </Svg>
  );
}

/** Progress — small half swing on left, full swing on right. Arrow between. */
export function StepProgress({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={10} y1={168} x2={190} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* LEFT: small figure — half swing */}
      <Circle cx={55} cy={55} r={8} stroke={color} strokeWidth={1.5} fill="none" />
      <Line x1={55} y1={63} x2={55} y2={105} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={42} y1={78} x2={68} y2={78} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={42} y1={78} x2={35} y2={62} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={35} y1={62} x2={26} y2={55} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={68} y1={78} x2={60} y2={95} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={42} y1={105} x2={68} y2={105} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={42} y1={105} x2={38} y2={135} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={38} y1={135} x2={35} y2={168} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={68} y1={105} x2={72} y2={135} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={72} y1={135} x2={75} y2={168} stroke={color} strokeWidth={1.5} {...STROKE} />

      {/* Arrow pointing right (progress) */}
      <Line x1={92} y1={100} x2={108} y2={100} stroke={color} strokeWidth={2} {...STROKE} />
      <Path d="M 105 96 L 111 100 L 105 104" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* RIGHT: full figure — full swing finish */}
      <Circle cx={148} cy={48} r={8} stroke={color} strokeWidth={1.5} fill="none" />
      <Line x1={148} y1={56} x2={148} y2={105} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={134} y1={72} x2={162} y2={72} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={134} y1={72} x2={124} y2={52} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={124} y1={52} x2={115} y2={38} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={162} y1={72} x2={155} y2={88} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={134} y1={105} x2={162} y2={105} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={134} y1={105} x2={128} y2={137} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={128} y1={137} x2={122} y2={168} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={162} y1={105} x2={165} y2={137} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={165} y1={137} x2={168} y2={155} stroke={color} strokeWidth={1.5} {...STROKE} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// TEE GATE
// ---------------------------------------------------------------------------

/** Top-down view: two tees, ball center, target line, club head. */
export function GateSetup({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line — dashed, vertical through center */}
      <Line x1={100} y1={15} x2={100} y2={185} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee 1 — inside (left of target line slightly) */}
      <Circle cx={82} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={105} x2={82} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee 2 — outside (right of target line) */}
      <Circle cx={118} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={105} x2={118} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ball — center between tees */}
      <Circle cx={100} cy={115} r={6} fill={color} />

      {/* Club head — top-down oval shape */}
      <Ellipse
        cx={100}
        cy={80}
        rx={14}
        ry={8}
        stroke={color}
        strokeWidth={2}
        fill="none"
        transform="rotate(-15, 100, 80)"
      />
      {/* Club shaft top-down */}
      <Line x1={114} y1={75} x2={145} y2={55} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Gate width indicator */}
      <Line x1={82} y1={128} x2={118} y2={128} stroke={color} strokeWidth={1} />
      <Line x1={82} y1={124} x2={82} y2={132} stroke={color} strokeWidth={1} />
      <Line x1={118} y1={124} x2={118} y2={132} stroke={color} strokeWidth={1} />
    </Svg>
  );
}

/** Top-down: club path curved through gate. "SLOW" label. */
export function GateSlow({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line */}
      <Line x1={100} y1={15} x2={100} y2={185} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee 1 */}
      <Circle cx={82} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={105} x2={82} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee 2 */}
      <Circle cx={118} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={105} x2={118} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ball */}
      <Circle cx={100} cy={115} r={6} fill={color} />

      {/* Club path — curved arc through gate */}
      <Path
        d="M 145 55 Q 110 72 100 90 Q 90 108 100 130 Q 108 148 118 165"
        stroke={color}
        strokeWidth={2}
        fill="none"
        {...STROKE}
      />
      {/* Arrow on path */}
      <Path d="M 112 162 L 118 168 L 122 161" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* SLOW label */}
      <Text
        x={140}
        y={105}
        fontSize={14}
        fontWeight="bold"
        fill={color}
        textAnchor="middle"
      >
        SLOW
      </Text>
    </Svg>
  );
}

/** Top-down: wider club arc, speed lines. Gate intact. */
export function GateSpeed({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line */}
      <Line x1={100} y1={15} x2={100} y2={185} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee 1 */}
      <Circle cx={82} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={105} x2={82} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee 2 */}
      <Circle cx={118} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={105} x2={118} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ball */}
      <Circle cx={100} cy={115} r={6} fill={color} />

      {/* Wider arc path */}
      <Path
        d="M 158 45 Q 118 68 100 88 Q 82 108 100 132 Q 112 150 125 170"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        {...STROKE}
      />
      {/* Arrow */}
      <Path d="M 119 167 L 125 174 L 130 167" stroke={color} strokeWidth={2} fill="none" {...STROKE} />
      {/* Speed lines */}
      <Line x1={155} y1={42} x2={162} y2={38} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={158} y1={48} x2={167} y2={46} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={160} y1={55} x2={169} y2={56} stroke={color} strokeWidth={1.5} {...STROKE} />
    </Svg>
  );
}

/** Top-down: full arc, ball trajectory straight, check mark. */
export function GateFull({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target line */}
      <Line x1={100} y1={15} x2={100} y2={185} stroke={color} strokeWidth={1.5} strokeDasharray="6 4" />

      {/* Tee 1 */}
      <Circle cx={82} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={82} y1={105} x2={82} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee 2 */}
      <Circle cx={118} cy={100} r={5} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={118} y1={105} x2={118} y2={118} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Ball */}
      <Circle cx={100} cy={115} r={6} fill={color} />

      {/* Full arc */}
      <Path
        d="M 165 40 Q 122 65 100 88 Q 78 110 100 132 Q 115 152 128 172"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        {...STROKE}
      />
      {/* Arrow */}
      <Path d="M 122 170 L 128 177 L 133 170" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* Ball trajectory — straight line up target */}
      <Line x1={100} y1={109} x2={100} y2={25} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      <Path d="M 97 28 L 100 20 L 103 28" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />

      {/* Check mark */}
      <Path d="M 148 30 L 155 40 L 170 20" stroke={color} strokeWidth={2.5} fill="none" {...STROKE} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// TEMPO (3-to-1)
// ---------------------------------------------------------------------------

/** Metronome — triangular shape with pendulum, 72 BPM label. */
export function TempoMetronome({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Metronome body — triangle */}
      <Path
        d="M 100 30 L 155 165 L 45 165 Z"
        stroke={color}
        strokeWidth={2}
        fill="none"
        {...STROKE}
      />
      {/* Base rectangle */}
      <Rect x={52} y={160} width={96} height={18} rx={3} stroke={color} strokeWidth={2} fill="none" />
      {/* Center vertical line */}
      <Line x1={100} y1={165} x2={100} y2={55} stroke={color} strokeWidth={1} strokeDasharray="3 2" />
      {/* Pendulum — angled right */}
      <Line x1={100} y1={165} x2={132} y2={75} stroke={color} strokeWidth={2.5} {...STROKE} />
      {/* Pendulum bob */}
      <Rect
        x={126}
        y={68}
        width={14}
        height={10}
        rx={2}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      {/* Pendulum pivot dot */}
      <Circle cx={100} cy={165} r={4} fill={color} />
      {/* BPM label */}
      <Text x={100} y={148} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">
        72 BPM
      </Text>
    </Svg>
  );
}

/** Side view — three numbered positions along backswing arc. */
export function TempoBackswing({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={110} cy={52} r={10} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={110} y1={62} x2={108} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={90} y1={108} x2={128} y2={106} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg */}
      <Line x1={90} y1={108} x2={84} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={84} y1={142} x2={78} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg */}
      <Line x1={128} y1={106} x2={130} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={130} y1={140} x2={132} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Backswing arc — dotted */}
      <Path
        d="M 90 160 Q 60 140 50 105 Q 40 70 58 52"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="4 3"
      />

      {/* Position markers along arc */}
      {/* 1 — early takeaway */}
      <Circle cx={82} cy={148} r={10} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={82} y={152} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">1</Text>

      {/* 2 — mid backswing */}
      <Circle cx={58} cy={98} r={10} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={58} y={102} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">2</Text>

      {/* 3 — top */}
      <Circle cx={62} cy={52} r={10} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={62} y={56} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">3</Text>

      {/* Arms — raised at top */}
      <Line x1={110} y1={76} x2={90} y2={60} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={110} y1={76} x2={95} y2={65} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

/** Downswing start — position "1", direction change arrow. */
export function TempoTransition({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={108} cy={54} r={10} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={107} y1={64} x2={106} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={88} y1={108} x2={126} y2={106} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg */}
      <Line x1={88} y1={108} x2={82} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={82} y1={142} x2={76} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg */}
      <Line x1={126} y1={106} x2={128} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={128} y1={140} x2={130} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms at top transitioning down */}
      <Line x1={107} y1={76} x2={88} y2={58} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={107} y1={76} x2={92} y2={62} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club at top */}
      <Line x1={88} y1={58} x2={68} y2={44} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Direction change arrow — curved down */}
      <Path
        d="M 55 50 Q 42 75 52 105"
        stroke={color}
        strokeWidth={2}
        fill="none"
        {...STROKE}
      />
      <Path d="M 49 102 L 52 108 L 56 103" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* "1" label at downswing position */}
      <Circle cx={56} cy={42} r={10} stroke={color} strokeWidth={1.5} fill="none" />
      <Text x={56} y={46} fontSize={11} fontWeight="bold" fill={color} textAnchor="middle">1</Text>
    </Svg>
  );
}

/** Address with circular repeat arrow and ×20 label. */
export function TempoRepeat({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head */}
      <Circle cx={100} cy={50} r={10} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={100} y1={60} x2={100} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders */}
      <Line x1={78} y1={76} x2={122} y2={76} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms down */}
      <Line x1={78} y1={76} x2={84} y2={104} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={122} y1={76} x2={110} y2={102} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club */}
      <Line x1={95} y1={103} x2={88} y2={163} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Ball */}
      <Circle cx={86} cy={165} r={4} fill={color} />
      {/* Hips */}
      <Line x1={82} y1={108} x2={118} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Legs */}
      <Line x1={82} y1={108} x2={76} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={76} y1={142} x2={70} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={118} y1={108} x2={124} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={124} y1={142} x2={130} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Circular repeat arrow — around figure */}
      <Path
        d="M 148 90 A 52 52 0 1 0 148 110"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray="6 3"
      />
      <Path d="M 145 107 L 151 113 L 155 106" stroke={color} strokeWidth={2} fill="none" {...STROKE} />

      {/* ×20 label */}
      <Text x={162} y={102} fontSize={14} fontWeight="bold" fill={color} textAnchor="middle">
        ×20
      </Text>
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// FEET TOGETHER
// ---------------------------------------------------------------------------

/** Front view — feet touching (emphasized), ball teed up, club behind ball. */
export function FeetStance({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Tee */}
      <Line x1={100} y1={158} x2={100} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={94} y1={158} x2={106} y2={158} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Ball on tee */}
      <Circle cx={100} cy={153} r={5} stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx={100} cy={153} r={2} fill={color} />

      {/* Head */}
      <Circle cx={100} cy={44} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso */}
      <Line x1={100} y1={55} x2={100} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders */}
      <Line x1={76} y1={72} x2={124} y2={72} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms with club */}
      <Line x1={76} y1={72} x2={84} y2={104} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={124} y1={72} x2={112} y2={102} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club */}
      <Line x1={96} y1={103} x2={100} y2={148} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={85} y1={108} x2={115} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Feet together legs */}
      <Line x1={85} y1={108} x2={92} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={92} y1={140} x2={95} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={115} y1={108} x2={108} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={108} y1={140} x2={105} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Emphasized feet bracket */}
      <Line x1={88} y1={173} x2={88} y2={178} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={88} y1={176} x2={112} y2={176} stroke={color} strokeWidth={2.5} {...STROKE} />
      <Line x1={112} y1={173} x2={112} y2={178} stroke={color} strokeWidth={2.5} {...STROKE} />
    </Svg>
  );
}

/** Half backswing — rotation arrows, dotted center vertical line. */
export function FeetHalf({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Center vertical line */}
      <Line x1={100} y1={20} x2={100} y2={168} stroke={color} strokeWidth={1} strokeDasharray="4 3" />

      {/* Head */}
      <Circle cx={102} cy={46} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso rotated slightly */}
      <Line x1={101} y1={57} x2={100} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders — half rotation */}
      <Line x1={78} y1={72} x2={124} y2={76} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm — half raised */}
      <Line x1={78} y1={72} x2={65} y2={60} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm */}
      <Line x1={124} y1={76} x2={108} y2={90} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club — parallel to ground at half */}
      <Line x1={65} y1={60} x2={44} y2={58} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips */}
      <Line x1={84} y1={108} x2={116} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Legs — together */}
      <Line x1={84} y1={108} x2={90} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={90} y1={140} x2={94} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={116} y1={108} x2={110} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={110} y1={140} x2={106} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Rotation arrows around torso */}
      <Path d="M 88 80 Q 80 70 88 62" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Path d="M 86 65 L 90 60 L 92 66" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
      <Path d="M 112 80 Q 120 70 112 62" stroke={color} strokeWidth={1.5} fill="none" {...STROKE} />
    </Svg>
  );
}

/** Three-quarter backswing — bigger arc, balance level line at feet. */
export function FeetThreeQuarter({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Balance indicator — level line at feet */}
      <Line x1={70} y1={168} x2={130} y2={168} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Line x1={68} y1={164} x2={68} y2={172} stroke={color} strokeWidth={1.5} />
      <Line x1={132} y1={164} x2={132} y2={172} stroke={color} strokeWidth={1.5} />

      {/* Head */}
      <Circle cx={104} cy={48} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso — more rotated */}
      <Line x1={103} y1={59} x2={100} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders rotated */}
      <Line x1={76} y1={72} x2={126} y2={80} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead arm raised higher */}
      <Line x1={76} y1={72} x2={60} y2={54} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail arm */}
      <Line x1={126} y1={80} x2={108} y2={92} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club at three-quarter — bigger arc */}
      <Line x1={60} y1={54} x2={42} y2={40} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club arc indicator */}
      <Path d="M 90 158 Q 62 130 48 90 Q 40 60 55 42" stroke={color} strokeWidth={1} fill="none" strokeDasharray="3 3" />
      {/* Hips */}
      <Line x1={84} y1={108} x2={116} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Legs */}
      <Line x1={84} y1={108} x2={88} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={88} y1={140} x2={92} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={116} y1={108} x2={112} y2={140} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={112} y1={140} x2={108} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
    </Svg>
  );
}

/** Full finish — holding position, "3 sec" label with clock icon. */
export function FeetFull({ size = 200, color }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground */}
      <Line x1={20} y1={168} x2={180} y2={168} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Head — looking at target */}
      <Circle cx={96} cy={46} r={11} stroke={color} strokeWidth={2} fill="none" />
      {/* Torso — upright finish */}
      <Line x1={96} y1={57} x2={98} y2={108} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Shoulders wrap finish */}
      <Line x1={74} y1={72} x2={120} y2={68} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Arms high in finish */}
      <Line x1={74} y1={72} x2={68} y2={52} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={120} y1={68} x2={108} y2={78} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Club wrapped over */}
      <Line x1={68} y1={52} x2={56} y2={38} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Hips open */}
      <Line x1={80} y1={108} x2={118} y2={104} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Lead leg */}
      <Line x1={80} y1={108} x2={76} y2={142} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={76} y1={142} x2={72} y2={168} stroke={color} strokeWidth={2} {...STROKE} />
      {/* Trail leg — heel up */}
      <Line x1={118} y1={104} x2={116} y2={138} stroke={color} strokeWidth={2} {...STROKE} />
      <Line x1={116} y1={138} x2={120} y2={155} stroke={color} strokeWidth={2} {...STROKE} />

      {/* Clock icon */}
      <Circle cx={155} cy={50} r={14} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={155} y1={50} x2={155} y2={40} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Line x1={155} y1={50} x2={162} y2={55} stroke={color} strokeWidth={1.5} {...STROKE} />
      <Circle cx={155} cy={50} r={2} fill={color} />

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
