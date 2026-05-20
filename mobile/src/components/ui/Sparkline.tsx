import React from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from "react-native-svg";
import { useTheme } from "@/src/lib/theme";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

const DATA_MIN = 30;
const DATA_MAX = 100;

export function Sparkline({ data, width = 280, height = 60, color }: SparklineProps) {
  const theme = useTheme();
  const lineColor = color ?? theme.accent;

  if (!data || data.length === 0) {
    return <View style={{ width, height }} />;
  }

  const clamp = (v: number) => Math.min(DATA_MAX, Math.max(DATA_MIN, v));

  const n = data.length;
  const xStep = n > 1 ? width / (n - 1) : width;

  const toY = (v: number) => {
    const norm = (clamp(v) - DATA_MIN) / (DATA_MAX - DATA_MIN);
    return height - norm * height;
  };

  const points = data.map((v, i) => {
    const x = n > 1 ? i * xStep : width / 2;
    const y = toY(v);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Build filled area path: line across top, then close along bottom
  const fillPath = [
    `M ${points[0].x} ${points[0].y}`,
    ...points.slice(1).map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${height}`,
    `L ${points[0].x} ${height}`,
    "Z",
  ].join(" ");

  const gradientId = "sparkline-gradient";
  const lastPoint = points[points.length - 1];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.28" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0.0" />
        </LinearGradient>
      </Defs>

      {/* Gradient fill area */}
      <Path d={fillPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots at each point */}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isLast ? 3.5 : 1.5}
            fill={lineColor}
          />
        );
      })}
    </Svg>
  );
}
