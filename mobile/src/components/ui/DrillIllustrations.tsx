import React from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

interface Props {
  size?: number;
  color: string;
}

const S = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// ── Lottie wrapper ──
function LottieIllustration({ source, size = 200 }: { source: any; size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        source={source}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}

// ── Geometric: foot outlines (bird's-eye) ──
function Feet({ x, y, gap, color, label }: {
  x: number; y: number; gap: number; color: string; label?: string;
}) {
  return (
    <G>
      <Rect x={x - gap / 2 - 4} y={y - 14} width={8} height={28} rx={4}
        fill={color} opacity={0.15} stroke={color} strokeWidth={1.2} />
      <Rect x={x + gap / 2 - 4} y={y - 14} width={8} height={28} rx={4}
        fill={color} opacity={0.15} stroke={color} strokeWidth={1.2} />
      {label && (
        <SvgText x={x} y={y + 24} fill={color} fontSize={9} fontWeight="600"
          textAnchor="middle" opacity={0.6}>{label}</SvgText>
      )}
    </G>
  );
}

// ── Geometric: angle arc ──
function Arc({ cx, cy, r, start, end, color, label }: {
  cx: number; cy: number; r: number; start: number; end: number; color: string; label?: string;
}) {
  const sa = (start * Math.PI) / 180;
  const ea = (end * Math.PI) / 180;
  const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
  const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
  const mid = ((start + end) / 2 * Math.PI) / 180;
  const lx = cx + (r + 12) * Math.cos(mid);
  const ly = cy + (r + 12) * Math.sin(mid);
  return (
    <G>
      <Path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
        stroke={color} strokeWidth={2} fill="none" {...S} />
      {label && <SvgText x={lx} y={ly + 4} fill={color} fontSize={11}
        fontWeight="700" textAnchor="middle">{label}</SvgText>}
    </G>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALL DRILL
// Uses golf swing Lottie for motion steps, geometric for wall concept
// ═══════════════════════════════════════════════════════════════════════════════

function WallSetup({ size = 200, color }: Props) {
  // Geometric: top-down view showing body position relative to wall
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Wall */}
      <Rect x={155} y={30} width={14} height={140} fill={color} opacity={0.08} rx={2} />
      <Line x1={155} y1={30} x2={155} y2={170} stroke={color} strokeWidth={2.5} {...S} />
      <SvgText x={172} y={100} fill={color} fontSize={10} fontWeight="600"
        textAnchor="middle" opacity={0.5} rotation={90} origin="172,100">WALL</SvgText>

      {/* Body outline (top-down oval) */}
      <Circle cx={110} cy={100} r={22} fill={color} opacity={0.1} stroke={color} strokeWidth={2} />
      <Circle cx={110} cy={85} r={8} fill={color} opacity={0.15} stroke={color} strokeWidth={1.5} />
      <SvgText x={110} y={104} fill={color} fontSize={8} fontWeight="600" textAnchor="middle">BODY</SvgText>

      {/* Contact line: body to wall */}
      <Line x1={132} y1={100} x2={155} y2={100} stroke={color} strokeWidth={2} strokeDasharray="5 3" />
      <Circle cx={155} cy={100} r={4} fill={color} opacity={0.4} />

      {/* Feet below */}
      <Feet x={110} y={150} gap={28} color={color} />

      {/* Label */}
      <SvgText x={20} y={30} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>SETUP</SvgText>
      <SvgText x={20} y={44} fill={color} fontSize={9} opacity={0.4}>Back against wall</SvgText>
    </Svg>
  );
}

function WallBackswing({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/golf-swing.json")} size={size} />;
}

function WallDownswing({ size = 200, color }: Props) {
  // Geometric: hip rotation diagram
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Rect x={155} y={30} width={14} height={140} fill={color} opacity={0.08} rx={2} />
      <Line x1={155} y1={30} x2={155} y2={170} stroke={color} strokeWidth={2.5} {...S} />

      {/* Hip circle with rotation arrow */}
      <Circle cx={100} cy={100} r={30} fill={color} opacity={0.06} stroke={color} strokeWidth={1.5} />
      <Arc cx={100} cy={100} r={30} start={-30} end={30} color={color} />
      {/* Arrow head */}
      <Path d="M 125 85 L 130 79 L 133 88" stroke={color} strokeWidth={1.8} fill="none" {...S} />

      {/* Contact maintained */}
      <Line x1={130} y1={100} x2={155} y2={100} stroke={color} strokeWidth={2} strokeDasharray="5 3" />
      <Circle cx={155} cy={100} r={4} fill={color} opacity={0.4} />

      <SvgText x={100} y={108} fill={color} fontSize={9} fontWeight="600" textAnchor="middle">HIPS</SvgText>
      <SvgText x={20} y={30} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>ROTATE</SvgText>
      <SvgText x={20} y={44} fill={color} fontSize={9} opacity={0.4}>Keep contact</SvgText>
    </Svg>
  );
}

function WallImpact({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/golf-swing.json")} size={size} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUMP DRILL
// ═══════════════════════════════════════════════════════════════════════════════

function PumpAddress({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/golf-swing.json")} size={size} />;
}

function PumpTop({ size = 200, color }: Props) {
  // Geometric: wrist angle diagram
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Forearm line */}
      <Line x1={60} y1={140} x2={100} y2={80} stroke={color} strokeWidth={3} {...S} />
      {/* Club shaft */}
      <Line x1={100} y1={80} x2={140} y2={50} stroke={color} strokeWidth={2.5} {...S} />
      {/* Wrist point */}
      <Circle cx={100} cy={80} r={5} fill={color} opacity={0.3} stroke={color} strokeWidth={2} />
      {/* Angle arc */}
      <Arc cx={100} cy={80} r={24} start={-120} end={-40} color={color} label="90°" />

      {/* Pause badge */}
      <Rect x={30} y={40} width={50} height={24} rx={8} fill={color} opacity={0.12} />
      <SvgText x={55} y={56} fill={color} fontSize={11} fontWeight="700" textAnchor="middle">PAUSE</SvgText>

      <SvgText x={20} y={185} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>WRIST HINGE</SvgText>
    </Svg>
  );
}

function PumpDown({ size = 200, color }: Props) {
  // Geometric: pump motion arrows
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Club path — down */}
      <Path d="M 100 45 Q 95 80 85 110" stroke={color} strokeWidth={2.5} fill="none" {...S} />
      <Path d="M 82 105 L 85 112 L 90 107" stroke={color} strokeWidth={2} fill="none" {...S} />

      {/* Club path — back up (dashed) */}
      <Path d="M 85 110 Q 90 80 100 45" stroke={color} strokeWidth={2} fill="none"
        strokeDasharray="6 4" {...S} />
      <Path d="M 97 50 L 100 43 L 103 50" stroke={color} strokeWidth={2} fill="none" {...S} />

      {/* ×3 badge */}
      <Rect x={120} y={65} width={40} height={28} rx={10} fill={color} opacity={0.12} />
      <SvgText x={140} y={84} fill={color} fontSize={14} fontWeight="700" textAnchor="middle">×3</SvgText>

      {/* Wrist angle preserved indicator */}
      <Circle cx={92} cy={78} r={3} fill={color} opacity={0.4} />
      <Arc cx={92} cy={78} r={15} start={-130} end={-50} color={color} />

      <SvgText x={20} y={175} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>PUMP DOWN</SvgText>
      <SvgText x={20} y={190} fill={color} fontSize={9} opacity={0.4}>Keep wrist angle</SvgText>
    </Svg>
  );
}

function PumpRelease({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/golf-swing.json")} size={size} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP-THROUGH
// ═══════════════════════════════════════════════════════════════════════════════

function StepStance({ size = 200, color }: Props) {
  // Bird's eye: feet together + ball
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Target direction */}
      <Line x1={100} y1={25} x2={100} y2={55} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.3} />
      <Path d="M 96 30 L 100 22 L 104 30" stroke={color} strokeWidth={1.2} fill="none" opacity={0.3} />
      <SvgText x={100} y={18} fill={color} fontSize={8} textAnchor="middle" opacity={0.3}>TARGET</SvgText>

      {/* Ball */}
      <Circle cx={100} cy={75} r={6} fill={color} opacity={0.5} />

      {/* Feet together */}
      <Feet x={100} y={120} gap={8} color={color} label="FEET TOGETHER" />

      <SvgText x={20} y={175} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>STANCE</SvgText>
    </Svg>
  );
}

function StepBackswing({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/golf-swing.json")} size={size} />;
}

function StepSwing({ size = 200, color }: Props) {
  // Geometric: foot step diagram (bird's eye)
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Line x1={100} y1={25} x2={100} y2={55} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.3} />
      <Path d="M 96 30 L 100 22 L 104 30" stroke={color} strokeWidth={1.2} fill="none" opacity={0.3} />

      <Circle cx={100} cy={75} r={6} fill={color} opacity={0.5} />

      {/* Trail foot (stays) */}
      <Rect x={108} y={106} width={8} height={28} rx={4}
        fill={color} opacity={0.15} stroke={color} strokeWidth={1.2} />

      {/* Lead foot stepping — dashed original position */}
      <Rect x={84} y={106} width={8} height={28} rx={4}
        fill="none" stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.3} />

      {/* Lead foot new position — stepped toward target */}
      <Rect x={72} y={90} width={8} height={28} rx={4}
        fill={color} opacity={0.2} stroke={color} strokeWidth={1.5} />

      {/* Step arrow */}
      <Path d="M 88 115 Q 78 105 76 98" stroke={color} strokeWidth={2} fill="none" {...S} />
      <Path d="M 79 100 L 75 95 L 73 101" stroke={color} strokeWidth={1.5} fill="none" {...S} />

      <SvgText x={55} y={85} fill={color} fontSize={10} fontWeight="700" opacity={0.6}>STEP</SvgText>
      <SvgText x={20} y={175} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>STEP & SWING</SvgText>
    </Svg>
  );
}

function StepFinish({ size = 200, color }: Props) {
  // Geometric: weight distribution diagram
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Feet x={100} y={110} gap={35} color={color} />

      {/* Weight arrow pointing to lead foot */}
      <Path d="M 83 80 L 83 95" stroke={color} strokeWidth={2.5} {...S} />
      <Path d="M 79 91 L 83 98 L 87 91" stroke={color} strokeWidth={2} fill="none" {...S} />

      {/* 90% label on lead side */}
      <Rect x={60} y={55} width={45} height={24} rx={8} fill={color} opacity={0.12} />
      <SvgText x={83} y={72} fill={color} fontSize={13} fontWeight="700" textAnchor="middle">90%</SvgText>

      {/* 10% on trail side */}
      <SvgText x={117} y={72} fill={color} fontSize={11} fontWeight="600" textAnchor="middle" opacity={0.3}>10%</SvgText>

      <SvgText x={20} y={175} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>WEIGHT FORWARD</SvgText>
    </Svg>
  );
}

function StepProgress({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/golf-swing.json")} size={size} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEE GATE — All geometric bird's-eye views
// ═══════════════════════════════════════════════════════════════════════════════

function GateSetup({ size = 200, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Line x1={100} y1={20} x2={100} y2={60} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.25} />
      <SvgText x={100} y={16} fill={color} fontSize={8} textAnchor="middle" opacity={0.3}>↑ TARGET</SvgText>

      {/* Ball */}
      <Circle cx={100} cy={90} r={6} fill={color} />

      {/* Gate tees */}
      <Rect x={82} y={76} width={4} height={14} fill={color} rx={2} />
      <Rect x={114} y={76} width={4} height={14} fill={color} rx={2} />

      {/* Gate width indicator */}
      <Line x1={86} y1={72} x2={114} y2={72} stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.4} />
      <SvgText x={100} y={68} fill={color} fontSize={9} fontWeight="600" textAnchor="middle" opacity={0.5}>GATE</SvgText>

      {/* Club head between tees */}
      <Rect x={93} y={95} width={14} height={7} rx={3} fill={color} opacity={0.2} stroke={color} strokeWidth={1} />

      <Feet x={100} y={145} gap={30} color={color} />
      <SvgText x={20} y={185} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>BUILD GATE</SvgText>
    </Svg>
  );
}

function GateSlow({ size = 200, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Line x1={100} y1={20} x2={100} y2={55} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.25} />
      <Circle cx={100} cy={90} r={6} fill={color} />
      <Rect x={82} y={76} width={4} height={14} fill={color} rx={2} />
      <Rect x={114} y={76} width={4} height={14} fill={color} rx={2} />

      {/* Swing arc through gate */}
      <Path d="M 70 130 Q 100 70 130 130" stroke={color} strokeWidth={2.5} fill="none" {...S} />

      <Rect x={40} y={55} width={42} height={22} rx={8} fill={color} opacity={0.12} />
      <SvgText x={61} y={70} fill={color} fontSize={11} fontWeight="700" textAnchor="middle">SLOW</SvgText>

      <Feet x={100} y={155} gap={30} color={color} />
      <SvgText x={20} y={185} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>SLOW SWINGS</SvgText>
    </Svg>
  );
}

function GateSpeed({ size = 200, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Line x1={100} y1={20} x2={100} y2={55} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.25} />
      <Circle cx={100} cy={90} r={6} fill={color} />
      <Rect x={82} y={76} width={4} height={14} fill={color} rx={2} />
      <Rect x={114} y={76} width={4} height={14} fill={color} rx={2} />

      {/* Wider/faster arc */}
      <Path d="M 60 140 Q 100 60 140 140" stroke={color} strokeWidth={3} fill="none" {...S} />

      {/* Speed lines */}
      <Line x1={88} y1={80} x2={82} y2={85} stroke={color} strokeWidth={1.2} opacity={0.35} />
      <Line x1={91} y1={75} x2={85} y2={80} stroke={color} strokeWidth={1.2} opacity={0.35} />
      <Line x1={94} y1={70} x2={88} y2={75} stroke={color} strokeWidth={1.2} opacity={0.35} />

      <Feet x={100} y={160} gap={30} color={color} />
      <SvgText x={20} y={185} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>ADD SPEED</SvgText>
    </Svg>
  );
}

function GateFull({ size = 200, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={90} r={6} fill={color} />
      <Rect x={82} y={76} width={4} height={14} fill={color} rx={2} />
      <Rect x={114} y={76} width={4} height={14} fill={color} rx={2} />

      {/* Full arc */}
      <Path d="M 55 145 Q 100 50 145 145" stroke={color} strokeWidth={3} fill="none" {...S} />

      {/* Ball flight straight */}
      <Line x1={100} y1={88} x2={100} y2={30} stroke={color} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.4} />
      <Path d="M 96 35 L 100 25 L 104 35" stroke={color} strokeWidth={1.2} fill="none" opacity={0.4} />

      {/* Check mark */}
      <Path d="M 145 40 L 155 52 L 175 28" stroke={color} strokeWidth={3.5} fill="none" {...S} />

      <Feet x={100} y={160} gap={30} color={color} />
      <SvgText x={20} y={185} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>FULL SWINGS</SvgText>
    </Svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPO — Lottie metronome + geometric rhythm diagrams
// ═══════════════════════════════════════════════════════════════════════════════

function TempoMetronome({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/metronome.json")} size={size} />;
}

function TempoBackswing({ size = 200, color }: Props) {
  // Numbered arc positions
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Swing arc */}
      <Path d="M 130 165 Q 120 110 95 75 Q 80 55 72 40" stroke={color} strokeWidth={1.5}
        strokeDasharray="6 4" fill="none" {...S} />

      {/* Position 1 */}
      <Circle cx={125} cy={148} r={16} fill={color} opacity={0.12} stroke={color} strokeWidth={1.8} />
      <SvgText x={125} y={153} fill={color} fontSize={14} fontWeight="700" textAnchor="middle">1</SvgText>

      {/* Position 2 */}
      <Circle cx={100} cy={90} r={16} fill={color} opacity={0.12} stroke={color} strokeWidth={1.8} />
      <SvgText x={100} y={95} fill={color} fontSize={14} fontWeight="700" textAnchor="middle">2</SvgText>

      {/* Position 3 */}
      <Circle cx={75} cy={45} r={16} fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
      <SvgText x={75} y={50} fill={color} fontSize={14} fontWeight="700" textAnchor="middle">3</SvgText>

      {/* Ground */}
      <Line x1={30} y1={175} x2={170} y2={175} stroke={color} strokeWidth={1.5} opacity={0.2} />

      <SvgText x={20} y={190} fill={color} fontSize={11} fontWeight="700" opacity={0.5}>BACKSWING: 1-2-3</SvgText>
    </Svg>
  );
}

function TempoTransition({ size = 200, color }: Props) {
  // Single "1" count on downswing
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Downswing arc */}
      <Path d="M 75 40 Q 90 90 130 165" stroke={color} strokeWidth={2.5} fill="none" {...S} />

      {/* Big "1" at transition */}
      <Circle cx={85} cy={70} r={20} fill={color} opacity={0.15} stroke={color} strokeWidth={2.5} />
      <SvgText x={85} y={77} fill={color} fontSize={20} fontWeight="700" textAnchor="middle">1</SvgText>

      {/* Speed lines */}
      <Line x1={105} y1={100} x2={98} y2={106} stroke={color} strokeWidth={1.2} opacity={0.3} />
      <Line x1={108} y1={94} x2={101} y2={100} stroke={color} strokeWidth={1.2} opacity={0.3} />
      <Line x1={111} y1={88} x2={104} y2={94} stroke={color} strokeWidth={1.2} opacity={0.3} />

      <Line x1={30} y1={175} x2={170} y2={175} stroke={color} strokeWidth={1.5} opacity={0.2} />
      <SvgText x={20} y={190} fill={color} fontSize={11} fontWeight="700" opacity={0.5}>DOWNSWING: 1</SvgText>
    </Svg>
  );
}

function TempoRepeat({ size = 200, color }: Props) {
  return <LottieIllustration source={require("@/assets/lottie/golf-swing.json")} size={size} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEET TOGETHER — Geometric balance/stance diagrams
// ═══════════════════════════════════════════════════════════════════════════════

function FeetStance({ size = 200, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Feet x={100} y={110} gap={8} color={color} label="TOUCHING" />
      <Circle cx={100} cy={70} r={6} fill={color} opacity={0.5} />
      <Line x1={100} y1={64} x2={100} y2={76} stroke={color} strokeWidth={1.5} opacity={0.3} />
      <SvgText x={100} y={58} fill={color} fontSize={9} textAnchor="middle" opacity={0.4}>BALL</SvgText>
      <SvgText x={20} y={180} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>NARROW STANCE</SvgText>
    </Svg>
  );
}

function FeetHalf({ size = 200, color }: Props) {
  // Arc showing rotation around center
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Center axis */}
      <Line x1={100} y1={50} x2={100} y2={160} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.25} />
      <Circle cx={100} cy={105} r={4} fill={color} opacity={0.3} />

      {/* Small rotation arc */}
      <Arc cx={100} cy={105} r={35} start={-120} end={-60} color={color} />

      <Feet x={100} y={140} gap={8} color={color} />
      <SvgText x={100} y={75} fill={color} fontSize={10} fontWeight="600" textAnchor="middle" opacity={0.5}>ROTATE</SvgText>
      <SvgText x={20} y={185} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>HALF SWING</SvgText>
    </Svg>
  );
}

function FeetThreeQuarter({ size = 200, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Line x1={100} y1={50} x2={100} y2={160} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.25} />
      <Circle cx={100} cy={105} r={4} fill={color} opacity={0.3} />

      {/* Larger arc */}
      <Arc cx={100} cy={105} r={45} start={-140} end={-40} color={color} />

      {/* Balance line at feet */}
      <Line x1={70} y1={155} x2={130} y2={155} stroke={color} strokeWidth={2.5} {...S} />
      <SvgText x={100} y={170} fill={color} fontSize={9} fontWeight="600" textAnchor="middle" opacity={0.5}>BALANCED</SvgText>

      <Feet x={100} y={140} gap={8} color={color} />
      <SvgText x={20} y={185} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>¾ SWING</SvgText>
    </Svg>
  );
}

function FeetFull({ size = 200, color }: Props) {
  // Timer + hold indicator
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Clock */}
      <Circle cx={100} cy={80} r={30} stroke={color} strokeWidth={2} fill={color} opacity={0.06} />
      <Line x1={100} y1={62} x2={100} y2={80} stroke={color} strokeWidth={2} {...S} />
      <Line x1={100} y1={80} x2={115} y2={88} stroke={color} strokeWidth={2} {...S} />
      <Circle cx={100} cy={80} r={3} fill={color} />

      {/* 3 SEC label */}
      <Rect x={72} y={120} width={56} height={26} rx={10} fill={color} opacity={0.12} />
      <SvgText x={100} y={138} fill={color} fontSize={14} fontWeight="700" textAnchor="middle">3 SEC</SvgText>

      <SvgText x={100} y={168} fill={color} fontSize={10} textAnchor="middle" opacity={0.4}>Hold your finish</SvgText>
      <SvgText x={20} y={190} fill={color} fontSize={12} fontWeight="700" opacity={0.5}>HOLD FINISH</SvgText>
    </Svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Export lookup
// ═══════════════════════════════════════════════════════════════════════════════

export const DRILL_ILLUSTRATIONS: Record<string, ((props: Props) => React.ReactElement)[]> = {
  "wall-drill": [WallSetup, WallBackswing, WallDownswing, WallImpact],
  "pump-drill": [PumpAddress, PumpTop, PumpDown, PumpRelease],
  "step-through": [StepStance, StepBackswing, StepSwing, StepFinish, StepProgress],
  "tee-gate": [GateSetup, GateSlow, GateSpeed, GateFull],
  "3-to-1-tempo": [TempoMetronome, TempoBackswing, TempoTransition, TempoRepeat],
  "feet-together": [FeetStance, FeetHalf, FeetThreeQuarter, FeetFull],
};
