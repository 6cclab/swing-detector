import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { scoreSeverity, useTheme } from "@/src/lib/theme";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreRing({ score, size = 140, strokeWidth = 10, label }: ScoreRingProps) {
  const theme = useTheme();
  const severity = scoreSeverity(score);
  const arcColor = theme.severity[severity];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  const trackColor =
    theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const cx = size / 2;
  const cy = size / 2;

  const scoreFontSize = size * 0.28;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${cx},${cy}`}>
          {/* Track circle */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.centerContent]}>
        <Text
          style={[
            styles.scoreText,
            {
              color: theme.text,
              fontSize: scoreFontSize,
              letterSpacing: scoreFontSize * -0.04,
            },
          ]}
        >
          {score}
        </Text>
        {label ? (
          <Text
            style={[
              styles.labelText,
              {
                color: theme.textMuted,
              },
            ]}
          >
            {label.toUpperCase()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  labelText: {
    fontSize: 11,
    fontFamily: "SpaceMono",
    letterSpacing: 0.18 * 11,
    marginTop: 2,
  },
});
