import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scoreSeverity, useTheme } from "@/src/lib/theme";

interface ScoreChipProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const fontSizes = { sm: 13, md: 17, lg: 22 } as const;
const paddingV = { sm: 3, md: 4, lg: 6 } as const;
const paddingH = { sm: 8, md: 10, lg: 14 } as const;

export function ScoreChip({ score, size = "md" }: ScoreChipProps) {
  const theme = useTheme();
  const severity = scoreSeverity(score);
  const severityColor = theme.severity[severity];
  const bgSuffix = theme.mode === "dark" ? "24" : "1f";
  const backgroundColor = `${severityColor}${bgSuffix}`;

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor,
          paddingVertical: paddingV[size],
          paddingHorizontal: paddingH[size],
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: severityColor,
            fontSize: fontSizes[size],
          },
        ]}
      >
        {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
