import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "@/src/lib/theme";

type Props = {
  score: number;
  size?: number;
  strokeWidth?: number;
};

export function ScoreRing({ score, size = 140, strokeWidth = 10 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const dashOffset = circumference * (1 - progress);
  const center = size / 2;

  const ringColor =
    score >= 80
      ? colors.good
      : score >= 60
        ? colors.minor
        : score >= 40
          ? colors.moderate
          : colors.major;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Score ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color: ringColor }]}>
          {Math.round(score)}
        </Text>
        <Text style={styles.label}>out of 100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  scoreContainer: {
    position: "absolute",
    alignItems: "center",
  },
  score: {
    fontSize: 42,
    fontWeight: "bold",
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
