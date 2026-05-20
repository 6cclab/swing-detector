import React from "react";
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Rect,
} from "react-native-svg";
import { useTheme } from "@/src/lib/theme";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function IconProgress({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="3,17 9,11 13,15 21,7" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="14,7 21,7 21,14" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCamera({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="14" rx="2" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={c} strokeWidth={strokeWidth} />
      <Path d="M8 6l1.5-2h5L16 6" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconDrills({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Main bar shafts */}
      <Line x1="6.5" y1="6" x2="6.5" y2="18" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="17.5" y1="6" x2="17.5" y2="18" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Outer plate ends */}
      <Line x1="3" y1="9" x2="3" y2="15" stroke={c} strokeWidth={strokeWidth * 1.8} strokeLinecap="round" />
      <Line x1="21" y1="9" x2="21" y2="15" stroke={c} strokeWidth={strokeWidth * 1.8} strokeLinecap="round" />
      {/* Center connecting bar */}
      <Line x1="6.5" y1="12" x2="17.5" y2="12" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function IconList({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4" y1="17" x2="20" y2="17" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function IconUser({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={strokeWidth} />
      <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevRight({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9,6 15,12 9,18" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevLeft({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="15,6 9,12 15,18" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevDown({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="6,9 12,15 18,9" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconFlip({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4l4 4-4 4" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 8h16" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8 20l-4-4 4-4" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H4" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function IconArrowUp({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="6,14 12,8 18,14" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrowDown({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="6,10 12,16 18,10" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconTarget({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={strokeWidth} />
      <Circle cx="12" cy="12" r="5" stroke={c} strokeWidth={strokeWidth} />
      <Circle cx="12" cy="12" r="1.5" fill={c} />
    </Svg>
  );
}

export function IconClock({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={strokeWidth} />
      <Polyline points="12,7 12,12 15,14" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLogout({ size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="10,17 15,12 10,7" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="15" y1="12" x2="3" y2="12" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
