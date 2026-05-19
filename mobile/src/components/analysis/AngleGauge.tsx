import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/src/lib/theme";
import type { Severity } from "@/src/types/analysis";

type Props = {
  label: string;
  measured: number;
  proMin: number;
  proMax: number;
  severity: Severity;
  unit?: string;
  size?: number;
};

export function AngleGauge({
  label,
  measured,
  proMin,
  proMax,
  severity,
  unit = "\u00B0",
  size = 80,
}: Props) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Map the measured value to arc position
  // Use a range that's 40% wider than the pro range on each side
  const rangeWidth = proMax - proMin;
  const displayMin = proMin - rangeWidth * 0.6;
  const displayMax = proMax + rangeWidth * 0.6;
  const displayRange = displayMax - displayMin;

  const clampedMeasured = Math.max(displayMin, Math.min(displayMax, measured));
  const progress = (clampedMeasured - displayMin) / displayRange;

  // Pro range as arc segment (bottom 180° is the gauge area, using 270° sweep)
  const startAngle = -225; // start from bottom-left
  const sweepAngle = 270;

  const proStartFrac = (proMin - displayMin) / displayRange;
  const proEndFrac = (proMax - displayMin) / displayRange;

  const needleAngle =
    ((startAngle + progress * sweepAngle) * Math.PI) / 180;
  const needleX = center + (radius - 8) * Math.cos(needleAngle);
  const needleY = center + (radius - 8) * Math.sin(needleAngle);

  // Arc path for pro range
  const arcFraction = sweepAngle / 360;
  const dashArray = circumference * arcFraction;
  const offset = circumference * (1 - arcFraction);

  const proStartOffset =
    circumference * (1 - arcFraction) +
    circumference * arcFraction * proStartFrac;
  const proLength = circumference * arcFraction * (proEndFrac - proStartFrac);

  const sevColor = colors[severity];

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.surfaceLight}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
            strokeDashoffset={-offset / 2}
            strokeLinecap="round"
            rotation={-45}
            origin={`${center}, ${center}`}
          />

          {/* Pro range highlight */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`${colors.success}40`}
            strokeWidth={strokeWidth + 2}
            fill="none"
            strokeDasharray={`${proLength} ${circumference - proLength}`}
            strokeDashoffset={-proStartOffset}
            rotation={-45}
            origin={`${center}, ${center}`}
          />

          {/* Needle dot */}
          <Circle cx={needleX} cy={needleY} r={5} fill={sevColor} />
          <Circle cx={center} cy={center} r={3} fill={colors.textSecondary} />

          {/* Line from center to needle */}
          <Path
            d={`M${center},${center} L${needleX},${needleY}`}
            stroke={sevColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <Text style={[styles.value, { color: sevColor }]}>
        {measured.toFixed(1)}
        {unit}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.range}>
        {proMin}–{proMax}
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 2,
    width: 100,
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: -4,
  },
  label: {
    color: colors.text,
    fontSize: 11,
    textAlign: "center",
    textTransform: "capitalize",
  },
  range: {
    color: colors.textSecondary,
    fontSize: 10,
  },
});
