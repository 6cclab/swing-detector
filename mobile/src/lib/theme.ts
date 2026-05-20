import { useColorScheme } from "react-native";

export type ThemeMode = "dark" | "light";

export type Severity = "good" | "warn" | "mod" | "bad";

const tournament = {
  mode: "dark" as ThemeMode,
  bg: "#1a1d1c",
  surface: "#20251d",
  surfaceAlt: "#262c23",
  surfaceHi: "#2e342a",
  border: "rgba(158,168,37,0.12)",
  borderStrong: "rgba(158,168,37,0.26)",
  text: "#f1f2e3",
  textMuted: "rgba(241,242,227,0.60)",
  textDim: "rgba(241,242,227,0.34)",
  accent: "#9ea825",
  severity: {
    good: "#9ea825",
    warn: "#fde047",
    mod: "#fb923c",
    bad: "#f87171",
  },
  tabBarBg: "rgba(0,0,0,0.45)",
  fabBorder: "#000",
};

const clubhouse = {
  mode: "light" as ThemeMode,
  bg: "#f2f2e8",
  surface: "#fbfaf2",
  surfaceAlt: "#e8e7dc",
  surfaceHi: "#d9d8c7",
  border: "rgba(26,29,28,0.10)",
  borderStrong: "rgba(26,29,28,0.22)",
  text: "#1a1d1c",
  textMuted: "rgba(26,29,28,0.62)",
  textDim: "rgba(26,29,28,0.36)",
  accent: "#86931e",
  severity: {
    good: "#5a7a1c",
    warn: "#b08020",
    mod: "#c8631e",
    bad: "#a83128",
  },
  tabBarBg: "rgba(255,255,255,0.75)",
  fabBorder: "#fff",
};

export type Theme = typeof tournament;

export const themes = { tournament, clubhouse };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "light" ? clubhouse : tournament;
}

export function scoreSeverity(score: number): Severity {
  if (score >= 80) return "good";
  if (score >= 65) return "warn";
  if (score >= 50) return "mod";
  return "bad";
}

export function scoreSeverityLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Improving";
  if (score >= 50) return "Needs work";
  return "Off pattern";
}

export const typography = {
  fontMono: "SpaceMono",
  display: 56,
  screenTitle: 32,
  sectionTitle: 22,
  button: 17,
  cardTitle: 15,
  body: 14,
  caption: 11,
  tabLabel: 10,
};

export const radius = {
  card: 16,
  pill: 9999,
  control: 12,
};
