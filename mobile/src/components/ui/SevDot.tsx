import React from "react";
import { View } from "react-native";
import { Severity, useTheme } from "@/src/lib/theme";

interface SevDotProps {
  severity: Severity;
  size?: number;
}

export function SevDot({ severity, size = 8 }: SevDotProps) {
  const theme = useTheme();
  const bgColor = theme.severity[severity];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
      }}
    />
  );
}
