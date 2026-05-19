import React from "react";
import Svg, { Circle, Line } from "react-native-svg";

import type { Landmark } from "@/src/types/analysis";
import { colors } from "@/src/lib/theme";

// MediaPipe pose landmark connections for skeleton rendering
const CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], // shoulders
  [11, 23], // left shoulder -> left hip
  [12, 24], // right shoulder -> right hip
  [23, 24], // hips
  // Left arm
  [11, 13], // shoulder -> elbow
  [13, 15], // elbow -> wrist
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25], // hip -> knee
  [25, 27], // knee -> ankle
  // Right leg
  [24, 26],
  [26, 28],
];

// Key landmarks to highlight with larger dots
const KEY_LANDMARKS = new Set([
  11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28,
]);

type Props = {
  landmarks: Landmark[];
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
};

export function PoseOverlay({
  landmarks,
  width,
  height,
  color = colors.primary,
  strokeWidth = 2,
  showDots = true,
}: Props) {
  if (!landmarks || landmarks.length === 0) return null;

  const toX = (lm: Landmark) => lm.x * width;
  const toY = (lm: Landmark) => lm.y * height;

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {/* Connections */}
      {CONNECTIONS.map(([a, b], i) => {
        const lmA = landmarks[a];
        const lmB = landmarks[b];
        if (!lmA || !lmB) return null;
        if (lmA.visibility < 0.5 || lmB.visibility < 0.5) return null;

        return (
          <Line
            key={`line-${i}`}
            x1={toX(lmA)}
            y1={toY(lmA)}
            x2={toX(lmB)}
            y2={toY(lmB)}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}

      {/* Landmark dots */}
      {showDots &&
        landmarks.map((lm, i) => {
          if (!KEY_LANDMARKS.has(i)) return null;
          if (lm.visibility < 0.5) return null;

          return (
            <Circle
              key={`dot-${i}`}
              cx={toX(lm)}
              cy={toY(lm)}
              r={4}
              fill="#fff"
              stroke={color}
              strokeWidth={1.5}
            />
          );
        })}
    </Svg>
  );
}
