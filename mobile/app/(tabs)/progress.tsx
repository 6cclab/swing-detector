import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Card,
  IconArrowUp,
  IconChevRight,
  PhaseBars,
  ScoreChip,
  Sparkline,
} from "@/src/components/ui";
import {
  SWING_PHASES,
  SWINGS,
} from "@/src/data/mock";
import { typography, useTheme } from "@/src/lib/theme";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(d: Date) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${m}${ampm}`;
}

export default function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();

  const swings = SWINGS;

  if (swings.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No swings yet
        </Text>
        <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
          Record your first swing to see your progress
        </Text>
      </View>
    );
  }

  const latest = swings[0];
  const scores = swings.map((s) => s.score).reverse();
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const bestScore = Math.max(...scores);

  // Delta: diff from previous swing
  const delta = swings.length >= 2 ? latest.score - swings[1].score : 0;

  // Most improved: weight_shift had biggest gain (s1 -> s8)
  const firstSwing = swings[swings.length - 1];
  const lastSwing = swings[0];
  const wsFirst = Math.round(firstSwing.metrics.weight_shift);
  const wsLast = Math.round(lastSwing.metrics.weight_shift);
  const wsGain = wsLast - wsFirst;

  // Phase bars for latest swing
  const latestPhaseData = SWING_PHASES.map((phase, i) => ({
    label: phase.label,
    shortLabel: phase.short,
    score: latest.phaseScores[i] ?? 0,
  }));

  const recentSwings = swings.slice(0, 5);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Progress</Text>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>
          {swings.length} swings logged
        </Text>
      </View>

      {/* Hero Score Card */}
      <Card style={styles.heroCard}>
        <Text
          style={[
            styles.monoKicker,
            { color: theme.textMuted, letterSpacing: 0.15 * 11 },
          ]}
        >
          LATEST SCORE
        </Text>
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <View style={styles.scoreRow}>
              <Text
                style={[
                  styles.heroScore,
                  { color: theme.text },
                ]}
              >
                {latest.score}
              </Text>
              {delta !== 0 && (
                <Text
                  style={[
                    styles.delta,
                    {
                      color:
                        delta > 0
                          ? theme.severity.good
                          : theme.severity.bad,
                    },
                  ]}
                >
                  {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.heroRight}>
            <Text
              style={[
                styles.monoKicker,
                { color: theme.textDim, letterSpacing: 0.15 * 11 },
              ]}
            >
              AVG · BEST
            </Text>
            <Text style={[styles.heroMeta, { color: theme.text }]}>
              {avgScore} · {bestScore}
            </Text>
          </View>
        </View>
        <View style={styles.sparklineWrap}>
          <Sparkline data={scores} height={56} />
        </View>
      </Card>

      {/* Most Improved Card */}
      <Card style={styles.improvedCard}>
        <View style={styles.improvedRow}>
          <View
            style={[
              styles.improvedIcon,
              { backgroundColor: `${theme.accent}22` },
            ]}
          >
            <IconArrowUp size={22} color={theme.accent} strokeWidth={2.2} />
          </View>
          <View style={styles.improvedBody}>
            <Text
              style={[
                styles.monoKicker,
                { color: theme.textMuted, letterSpacing: 0.15 * 11 },
              ]}
            >
              MOST IMPROVED
            </Text>
            <Text style={[styles.improvedTitle, { color: theme.text }]}>
              Weight shift
            </Text>
            <Text style={[styles.improvedSub, { color: theme.textMuted }]}>
              {wsFirst}% → {wsLast}% since {formatDate(firstSwing.date)}
            </Text>
          </View>
          <Text style={[styles.improvedPct, { color: theme.severity.good }]}>
            +{wsGain}%
          </Text>
        </View>
      </Card>

      {/* Phase Bars Card */}
      <Card>
        <Text
          style={[
            styles.monoKicker,
            {
              color: theme.textMuted,
              letterSpacing: 0.15 * 11,
              marginBottom: 16,
            },
          ]}
        >
          PER-PHASE · LATEST
        </Text>
        <PhaseBars phases={latestPhaseData} />
      </Card>

      {/* Recent Section */}
      <View>
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.monoKicker,
              { color: theme.textMuted, letterSpacing: 0.15 * 11 },
            ]}
          >
            RECENT
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/history")}>
            <Text style={[styles.seeAll, { color: theme.accent }]}>
              See all
            </Text>
          </Pressable>
        </View>

        <Card padded={false}>
          {recentSwings.map((swing, idx) => (
            <Pressable
              key={swing.id}
              style={[
                styles.swingRow,
                idx < recentSwings.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
              onPress={() => router.push(`/swing/${swing.id}`)}
            >
              <ScoreChip score={swing.score} size="sm" />
              <View style={styles.swingMeta}>
                <Text style={[styles.swingLabel, { color: theme.text }]}>
                  {swing.label}
                </Text>
                <Text style={[styles.swingDetail, { color: theme.textMuted }]}>
                  {formatDate(swing.date)} · {swing.club}
                </Text>
              </View>
              <IconChevRight size={16} color={theme.textDim} strokeWidth={1.7} />
            </Pressable>
          ))}
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
    paddingBottom: 32,
    gap: 12,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: typography.screenTitle,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  kicker: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  monoKicker: {
    fontFamily: typography.fontMono,
    fontSize: typography.caption,
    textTransform: "uppercase",
  },
  heroCard: {
    gap: 8,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroLeft: {
    flex: 1,
  },
  heroRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  heroScore: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 60,
  },
  delta: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  heroMeta: {
    fontSize: 18,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  sparklineWrap: {
    marginTop: 4,
    overflow: "hidden",
  },
  improvedCard: {},
  improvedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  improvedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  improvedBody: {
    flex: 1,
    gap: 2,
  },
  improvedTitle: {
    fontSize: typography.cardTitle,
    fontWeight: "600",
  },
  improvedSub: {
    fontSize: 13,
  },
  improvedPct: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "500",
  },
  swingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  swingMeta: {
    flex: 1,
    gap: 2,
  },
  swingLabel: {
    fontSize: typography.cardTitle,
    fontWeight: "500",
  },
  swingDetail: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
  },
});
