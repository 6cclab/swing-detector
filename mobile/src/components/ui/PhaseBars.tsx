import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scoreSeverity, useTheme } from "@/src/lib/theme";

interface Phase {
  label: string;
  shortLabel: string;
  score: number;
}

interface PhaseBarsProps {
  phases: Phase[];
}

const BAR_MAX_HEIGHT = 60;
const BAR_WIDTH = 28;
const BAR_OPACITY = 0.88;

export function PhaseBars({ phases }: PhaseBarsProps) {
  const theme = useTheme();

  if (!phases || phases.length === 0) return null;

  return (
    <View style={styles.container}>
      {phases.map((phase, i) => {
        const severity = scoreSeverity(phase.score);
        const barColor = theme.severity[severity];
        const barHeight = Math.max(4, (phase.score / 100) * BAR_MAX_HEIGHT);

        return (
          <View key={i} style={styles.column}>
            <Text
              style={[
                styles.scoreText,
                { color: barColor },
              ]}
            >
              {phase.score}
            </Text>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                    opacity: BAR_OPACITY,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.labelText,
                { color: theme.textMuted },
              ]}
            >
              {phase.shortLabel.toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  column: {
    alignItems: "center",
    gap: 4,
  },
  scoreText: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    fontVariant: ["tabular-nums"],
  },
  barWrapper: {
    width: BAR_WIDTH,
    height: BAR_MAX_HEIGHT,
    justifyContent: "flex-end",
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 3,
  },
  labelText: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
