import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AngleGauge,
  Card,
  IconChevDown,
  IconChevLeft,
  IconChevRight,
  ScoreRing,
  SevDot,
} from "@/src/components/ui";
import {
  COACHING_TIPS_POOL,
  PRO_RANGES,
  SWING_PHASES,
  SWINGS,
  scoreSeverityLabel,
} from "@/src/data/mock";
import { scoreSeverity, typography, useTheme } from "@/src/lib/theme";
import type { MetricKey } from "@/src/data/mock";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateTime(d: Date) {
  const mo = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  return `${mo} ${day} · ${h % 12 || 12}:${m}${ampm}`;
}

// Severity mapping from mock Severity to theme Severity
function toThemeSeverity(s: string): "good" | "warn" | "mod" | "bad" {
  if (s === "good") return "good";
  if (s === "warning") return "warn";
  return "bad";
}

export default function SwingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const swing = SWINGS.find((s) => s.id === id) ?? SWINGS[0];
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [expandedMetric, setExpandedMetric] = useState<MetricKey | null>(null);

  const overallSeverity = scoreSeverity(swing.score);
  const overallLabel = scoreSeverityLabel(swing.score);
  const tips = swing.tips.map((i) => COACHING_TIPS_POOL[i]).filter(Boolean);
  const metricKeys = Object.keys(swing.metrics) as MetricKey[];

  const metricRangeBounds: Record<MetricKey, { min: number; max: number }> = {
    shoulder_turn: { min: 50, max: 140 },
    hip_turn: { min: 20, max: 80 },
    spine_tilt: { min: 5, max: 45 },
    wrist_cock: { min: 50, max: 130 },
    swing_plane: { min: 35, max: 85 },
    weight_shift: { min: 40, max: 100 },
  };

  function metricSeverity(key: MetricKey): "good" | "warn" | "mod" | "bad" {
    const val = swing.metrics[key];
    const range = PRO_RANGES[key];
    if (val >= range.min && val <= range.max) return "good";
    const dist = Math.min(Math.abs(val - range.min), Math.abs(val - range.max));
    if (dist <= 8) return "warn";
    if (dist <= 18) return "mod";
    return "bad";
  }

  function metricInterpretation(key: MetricKey): string {
    const val = swing.metrics[key];
    const range = PRO_RANGES[key];
    if (val >= range.min && val <= range.max) {
      return `Within pro range (${range.min}–${range.max}${range.unit}). Excellent.`;
    }
    if (val < range.min) {
      return `Below pro range. Target above ${range.min}${range.unit}.`;
    }
    return `Above pro range. Target below ${range.max}${range.unit}.`;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Pressable
          style={[
            styles.backButton,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <IconChevLeft size={18} color={theme.text} strokeWidth={2} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {swing.label}
          </Text>
          <Text style={[styles.headerDate, { color: theme.textMuted }]}>
            {formatDateTime(swing.date)}
          </Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* Hero: ScoreRing + side info */}
      <Card style={styles.heroCard}>
        <ScoreRing score={swing.score} size={140} />
        <View style={styles.heroInfo}>
          <Text
            style={[
              styles.monoKicker,
              {
                color: theme.textMuted,
                letterSpacing: 0.15 * 11,
                marginBottom: 4,
              },
            ]}
          >
            OVERALL · {swing.club}
          </Text>
          <Text style={[styles.scoreLabel, { color: theme.text }]}>
            {overallLabel}
          </Text>
          <View
            style={[
              styles.summaryPill,
              { backgroundColor: theme.surfaceAlt },
            ]}
          >
            <Text style={[styles.summaryPillText, { color: theme.textMuted }]}>
              {tips.length} findings · {metricKeys.length} metrics
            </Text>
          </View>
        </View>
      </Card>

      {/* Phase Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.phasePills}
      >
        {SWING_PHASES.map((phase, i) => {
          const active = selectedPhaseIndex === i;
          return (
            <Pressable
              key={phase.id}
              style={[
                styles.phasePill,
                {
                  backgroundColor: active ? theme.accent : theme.surfaceAlt,
                  borderColor: active ? theme.accent : theme.border,
                },
              ]}
              onPress={() => setSelectedPhaseIndex(i)}
            >
              <Text
                style={[
                  styles.phasePillText,
                  { color: active ? "#fff" : theme.textMuted },
                ]}
              >
                {phase.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Coaching Section */}
      {tips.length > 0 && (
        <View>
          <Text
            style={[
              styles.monoKicker,
              {
                color: theme.textMuted,
                letterSpacing: 0.15 * 11,
                marginBottom: 8,
              },
            ]}
          >
            COACHING · {tips.length} NOTES
          </Text>
          <View style={styles.tipsList}>
            {tips.map((tip, i) => (
              <Card key={i} style={styles.tipCard}>
                <View style={styles.tipRow}>
                  <SevDot severity={toThemeSeverity(tip.severity)} size={8} />
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: theme.text }]}>
                      {tip.title}
                    </Text>
                    <Text style={[styles.tipBody, { color: theme.textMuted }]}>
                      {tip.body}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* Metrics Section */}
      <View>
        <Text
          style={[
            styles.monoKicker,
            {
              color: theme.textMuted,
              letterSpacing: 0.15 * 11,
              marginBottom: 8,
            },
          ]}
        >
          ANGLES · MEASURED VS PRO RANGE
        </Text>
        <Card padded={false}>
          {metricKeys.map((key, idx) => {
            const range = PRO_RANGES[key];
            const val = swing.metrics[key];
            const sev = metricSeverity(key);
            const expanded = expandedMetric === key;
            const bounds = metricRangeBounds[key];

            return (
              <View key={key}>
                <Pressable
                  style={[
                    styles.metricRow,
                    idx < metricKeys.length - 1 &&
                      !expanded && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                  ]}
                  onPress={() =>
                    setExpandedMetric(expanded ? null : key)
                  }
                >
                  <SevDot severity={sev} size={8} />
                  <Text style={[styles.metricLabel, { color: theme.text }]}>
                    {range.label}
                  </Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: theme.severity[sev] },
                    ]}
                  >
                    {val}
                    {range.unit}
                  </Text>
                  <View
                    style={[
                      styles.metricChevron,
                      expanded && styles.metricChevronExpanded,
                    ]}
                  >
                    <IconChevDown size={16} color={theme.textDim} strokeWidth={1.7} />
                  </View>
                </Pressable>

                {expanded && (
                  <View
                    style={[
                      styles.metricExpanded,
                      {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: theme.border,
                        borderBottomWidth:
                          idx < metricKeys.length - 1
                            ? StyleSheet.hairlineWidth
                            : 0,
                        borderBottomColor: theme.border,
                        backgroundColor: theme.surfaceAlt,
                      },
                    ]}
                  >
                    <AngleGauge
                      value={val}
                      min={bounds.min}
                      max={bounds.max}
                      proMin={range.min}
                      proMax={range.max}
                      unit={range.unit}
                      size={120}
                    />
                    <Text
                      style={[
                        styles.metricInterpret,
                        { color: theme.textMuted },
                      ]}
                    >
                      {metricInterpretation(key)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 16,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 4,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerDate: {
    fontSize: 12,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroInfo: {
    flex: 1,
    gap: 8,
  },
  monoKicker: {
    fontFamily: typography.fontMono,
    fontSize: typography.caption,
    textTransform: "uppercase",
  },
  scoreLabel: {
    fontSize: typography.sectionTitle,
    fontWeight: "700",
  },
  summaryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: "500",
  },
  phasePills: {
    gap: 8,
    paddingVertical: 2,
  },
  phasePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  phasePillText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tipsList: {
    gap: 8,
  },
  tipCard: {
    gap: 0,
  },
  tipRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  tipText: {
    flex: 1,
    gap: 4,
    paddingTop: 0,
  },
  tipTitle: {
    fontSize: typography.cardTitle,
    fontWeight: "600",
    marginTop: -1,
  },
  tipBody: {
    fontSize: typography.body,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  metricLabel: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  metricChevron: {
    transform: [{ rotate: "0deg" }],
  },
  metricChevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  metricExpanded: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  metricInterpret: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
