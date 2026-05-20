import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useTheme } from "@/src/lib/theme";

interface AngleGaugeProps {
  value: number;
  min: number;
  max: number;
  proMin: number;
  proMax: number;
  unit: string;
  size?: number;
}

// Arc spans from -110° to +110° (220° total)
const ARC_START_DEG = -110;
const ARC_END_DEG = 110;
const ARC_TOTAL = ARC_END_DEG - ARC_START_DEG; // 220°

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const span = endDeg - startDeg;
  const largeArc = Math.abs(span) > 180 ? 1 : 0;
  const sweep = span > 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

function valueToDeg(value: number, min: number, max: number): number {
  const clamped = Math.min(Math.max(value, min), max);
  const norm = (clamped - min) / (max - min);
  return ARC_START_DEG + norm * ARC_TOTAL;
}

export function AngleGauge({
  value,
  min,
  max,
  proMin,
  proMax,
  unit,
  size = 110,
}: AngleGaugeProps) {
  const theme = useTheme();

  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.07;
  const r = (size - strokeWidth * 2) / 2;

  const trackColor =
    theme.mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const proColor = theme.severity.good;
  const needleColor = theme.accent;

  const trackPath = describeArc(cx, cy, r, ARC_START_DEG, ARC_END_DEG);
  const proStartDeg = valueToDeg(proMin, min, max);
  const proEndDeg = valueToDeg(proMax, min, max);
  const proPath = describeArc(cx, cy, r, proStartDeg, proEndDeg);

  const needleDeg = valueToDeg(value, min, max);
  const needleTip = polarToXY(cx, cy, r * 0.7, needleDeg);
  const needleBase = polarToXY(cx, cy, r * 0.12, needleDeg + 180);

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <Path
          d={trackPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Pro range band */}
        <Path
          d={proPath}
          fill="none"
          stroke={proColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.7}
        />
        {/* Needle */}
        <Line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={needleColor}
          strokeWidth={strokeWidth * 0.35}
          strokeLinecap="round"
        />
        {/* Needle center dot */}
        <Circle cx={cx} cy={cy} r={strokeWidth * 0.4} fill={needleColor} />
      </Svg>

      {/* Value label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.valueText, { color: theme.text }]}>
          {value}
          <Text style={[styles.unitText, { color: theme.textMuted }]}>
            {unit}
          </Text>
        </Text>
        <Text style={[styles.rangeText, { color: theme.textDim }]}>
          {`PRO ${proMin}–${proMax}${unit}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  labelContainer: {
    alignItems: "center",
    marginTop: -8,
  },
  valueText: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unitText: {
    fontSize: 12,
    fontWeight: "400",
  },
  rangeText: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
