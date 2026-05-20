import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import {
  Card,
  IconArrowUp,
  IconChevRight,
  IconProgress,
  PhaseBars,
  ScoreChip,
  Sparkline,
} from "@/src/components/ui";
import { apiGet } from "@/src/lib/api";
import { typography, useTheme } from "@/src/lib/theme";
import type { SwingListResponse } from "@/src/types/swing";
import type { SwingAnalysisResult } from "@/src/types/analysis";

function fmtDate(d: Date) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

type SwingRow = {
  id: string;
  date: Date;
  score: number;
  label: string;
  club: string;
};

export default function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [swings, setSwings] = useState<SwingRow[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<SwingAnalysisResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await apiGet<SwingListResponse>("/api/swings?page=1&page_size=20");
          const rows: SwingRow[] = res.items
            .filter((s) => s.status === "complete" && s.overall_score != null)
            .map((s) => ({
              id: s.id,
              date: new Date(s.created_at),
              score: s.overall_score!,
              label: "Swing",
              club: s.handedness === "right" ? "Right" : "Left",
            }));

          if (!cancelled) setSwings(rows);

          // Fetch latest analysis for phase scores
          if (rows.length > 0) {
            try {
              const analysis = await apiGet<SwingAnalysisResult>(`/api/swings/${rows[0].id}`);
              if (!cancelled && "phases_detected" in analysis) {
                setLatestAnalysis(analysis);
              }
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
        if (!cancelled) setLoading(false);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (swings.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
        <IconProgress size={48} color={theme.textDim} strokeWidth={1.2} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No progress data yet
        </Text>
        <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
          Complete a few swing analyses to see your trends
        </Text>
      </View>
    );
  }

  const latest = swings[0];
  const scores = swings.map((s) => s.score).reverse();
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const bestScore = Math.max(...scores);
  const delta = swings.length >= 2 ? latest.score - swings[1].score : 0;

  // Phase bars from latest analysis
  const phaseData = latestAnalysis
    ? latestAnalysis.phases_detected.map((p) => ({
        label: p.phase.replace(/_/g, " "),
        shortLabel: p.phase.slice(0, 3).toUpperCase(),
        score: Math.round(p.phase_score),
      }))
    : [];

  const recentSwings = swings.slice(0, 5);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Progress</Text>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>
          {swings.length} swings logged
        </Text>
      </View>

      {/* Hero Score Card */}
      <Card style={styles.heroCard}>
        <Text style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11 }]}>
          LATEST SCORE
        </Text>
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <View style={styles.scoreRow}>
              <Text style={[styles.heroScore, { color: theme.text }]}>
                {latest.score}
              </Text>
              {delta !== 0 && (
                <Text
                  style={[
                    styles.delta,
                    { color: delta > 0 ? theme.severity.good : theme.severity.bad },
                  ]}
                >
                  {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.heroRight}>
            <Text style={[styles.monoKicker, { color: theme.textDim, letterSpacing: 0.15 * 11 }]}>
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

      {/* Phase Bars */}
      {phaseData.length > 0 && (
        <Card>
          <Text
            style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11, marginBottom: 16 }]}
          >
            PER-PHASE · LATEST
          </Text>
          <PhaseBars phases={phaseData} />
        </Card>
      )}

      {/* Recent Section */}
      <View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11 }]}>
            RECENT
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/history")}>
            <Text style={[styles.seeAll, { color: theme.accent }]}>See all</Text>
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
                <Text style={[styles.swingLabel, { color: theme.text }]}>{swing.label}</Text>
                <Text style={[styles.swingDetail, { color: theme.textMuted }]}>
                  {fmtDate(swing.date)}
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
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  header: { paddingTop: 60, paddingBottom: 8 },
  screenTitle: { fontSize: typography.screenTitle, fontWeight: "700", letterSpacing: -0.5 },
  kicker: { fontSize: 13, marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "600" },
  emptyBody: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  heroCard: { gap: 8 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLeft: {},
  heroRight: { alignItems: "flex-end", gap: 4 },
  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  heroScore: { fontSize: 56, fontWeight: "700", fontVariant: ["tabular-nums"], letterSpacing: -2 },
  delta: { fontFamily: "SpaceMono", fontSize: 14 },
  heroMeta: { fontSize: 18, fontWeight: "600", fontVariant: ["tabular-nums"] },
  monoKicker: { fontFamily: "SpaceMono", fontSize: 11, textTransform: "uppercase" },
  sparklineWrap: { marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  seeAll: { fontSize: 14, fontWeight: "500" },
  swingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  swingMeta: { flex: 1, gap: 3 },
  swingLabel: { fontSize: typography.cardTitle, fontWeight: "500" },
  swingDetail: { fontSize: 12 },
});
