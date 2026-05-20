import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  ScoreRing,
  SevDot,
} from "@/src/components/ui";
import { apiGet } from "@/src/lib/api";
import { scoreSeverity, typography, useTheme } from "@/src/lib/theme";
import type { SwingAnalysisResult, AngleFeedback } from "@/src/types/analysis";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()} · ${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, "0")}${d.getHours() >= 12 ? "pm" : "am"}`;
}

function sevLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Improving";
  if (score >= 50) return "Needs work";
  return "Off pattern";
}

function feedbackSev(fb: AngleFeedback): "good" | "warn" | "mod" | "bad" {
  if (fb.severity === "good") return "good";
  if (fb.severity === "minor") return "warn";
  if (fb.severity === "moderate") return "mod";
  return "bad";
}

export default function SwingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [result, setResult] = useState<SwingAnalysisResult | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState(0);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await apiGet<SwingAnalysisResult | { status: string; error_message?: string }>(`/api/swings/${id}`);
        if ("overall_score" in data) {
          setResult(data);
          setStatus("complete");
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setStatus(data.status);
          if (data.status === "failed") {
            setError(data.error_message || "Analysis failed");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  if (status !== "complete" || !result) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        {error ? (
          <>
            <Text style={[styles.errorText, { color: theme.severity.bad }]}>{error}</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.backLink, { color: theme.accent }]}>Go back</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Analyzing your swing...</Text>
            <Text style={[styles.loadingHint, { color: theme.textMuted }]}>This may take 10-30 seconds</Text>
          </>
        )}
      </View>
    );
  }

  const phases = result.phases_detected;
  const currentPhase = phases[selectedPhase];
  const feedbacks = currentPhase?.angle_feedback || [];
  const coachingTips = result.coaching_summary;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.customHeader}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <IconChevLeft size={18} color={theme.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Swing Analysis</Text>
          <Text style={[styles.headerDate, { color: theme.textMuted }]}>
            {fmtDateTime(result.recorded_at)}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Hero: ScoreRing + info */}
      <Card style={styles.heroCard}>
        <ScoreRing score={result.overall_score} size={140} label={sevLabel(result.overall_score)} />
        <View style={styles.heroInfo}>
          <Text style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11, marginBottom: 4 }]}>
            OVERALL · {result.frame_count} frames
          </Text>
          <Text style={[styles.scoreLabel, { color: theme.text }]}>{sevLabel(result.overall_score)}</Text>
          <View style={[styles.summaryPill, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.summaryPillText, { color: theme.textMuted }]}>
              {coachingTips.length} findings · {phases.length} phases
            </Text>
          </View>
        </View>
      </Card>

      {/* Phase Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phasePills}>
        {phases.map((p, i) => {
          const active = selectedPhase === i;
          return (
            <Pressable
              key={p.phase}
              style={[styles.phasePill, { backgroundColor: active ? theme.accent : theme.surfaceAlt, borderColor: active ? theme.accent : theme.border }]}
              onPress={() => setSelectedPhase(i)}
            >
              <Text style={[styles.phasePillText, { color: active ? "#fff" : theme.textMuted }]}>
                {p.phase.replace(/_/g, " ")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Coaching Tips */}
      {coachingTips.length > 0 && (
        <View>
          <Text style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11, marginBottom: 8 }]}>
            COACHING · {coachingTips.length} {coachingTips.length === 1 ? "NOTE" : "NOTES"}
          </Text>
          <View style={styles.tipsList}>
            {coachingTips.map((tip, i) => (
              <Card key={i} style={styles.tipCard}>
                <View style={styles.tipRow}>
                  <SevDot severity="warn" size={8} />
                  <Text style={[styles.tipText, { color: theme.text }]} numberOfLines={3}>{tip}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* Angle Metrics */}
      {feedbacks.length > 0 && (
        <View>
          <Text style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11, marginBottom: 8 }]}>
            ANGLES · MEASURED VS PRO RANGE
          </Text>
          <Card padded={false}>
            {feedbacks.map((fb, idx) => {
              const sev = feedbackSev(fb);
              const isExpanded = expandedMetric === fb.angle_name;
              const label = fb.angle_name.replace(/_/g, " ").replace(" deg", "");
              const unit = fb.angle_name.includes("ratio") ? "" : "°";

              return (
                <View key={fb.angle_name}>
                  <Pressable
                    style={[
                      styles.metricRow,
                      idx < feedbacks.length - 1 && !isExpanded && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    onPress={() => setExpandedMetric(isExpanded ? null : fb.angle_name)}
                  >
                    <SevDot severity={sev} size={10} />
                    <View style={styles.metricLabel}>
                      <Text style={[styles.metricName, { color: theme.text }]}>{label}</Text>
                      <Text style={[styles.metricRange, { color: theme.textDim }]}>
                        Pro {fb.pro_min}–{fb.pro_max}{unit}
                      </Text>
                    </View>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                      {fb.measured}{unit}
                    </Text>
                    <View style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}>
                      <IconChevDown size={16} color={theme.textDim} strokeWidth={1.7} />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={[styles.gaugeWrap, { borderBottomWidth: idx < feedbacks.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: theme.border }]}>
                      <AngleGauge
                        value={fb.measured}
                        min={fb.pro_min - 20}
                        max={fb.pro_max + 20}
                        proMin={fb.pro_min}
                        proMax={fb.pro_max}
                        unit={unit}
                        size={130}
                      />
                      <View style={styles.gaugeText}>
                        <Text style={[styles.gaugeStatus, { color: theme.severity[sev] }]}>
                          {sev === "good" ? "IN TOUR RANGE" : sev === "warn" ? "SLIGHT DEVIATION" : "OUTSIDE RANGE"}
                        </Text>
                        {fb.coaching_tip ? (
                          <Text style={[styles.gaugeBody, { color: theme.textMuted }]} numberOfLines={4}>
                            {fb.coaching_tip}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 17, fontWeight: "500" },
  loadingHint: { fontSize: 13 },
  errorText: { fontSize: 16, textAlign: "center", paddingHorizontal: 32 },
  backLink: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  customHeader: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingBottom: 12, gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerDate: { fontFamily: "SpaceMono", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.12 * 10, marginTop: 2 },
  heroCard: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroInfo: { flex: 1, gap: 2 },
  monoKicker: { fontFamily: "SpaceMono", fontSize: 11, textTransform: "uppercase" },
  scoreLabel: { fontSize: 22, fontWeight: "700" },
  summaryPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, alignSelf: "flex-start", marginTop: 6 },
  summaryPillText: { fontFamily: "SpaceMono", fontSize: 12 },
  phasePills: { gap: 6, paddingVertical: 4 },
  phasePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 0.5 },
  phasePillText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  tipsList: { gap: 8 },
  tipCard: { padding: 14 },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  metricLabel: { flex: 1, gap: 2 },
  metricName: { fontSize: 15, fontWeight: "600", textTransform: "capitalize" },
  metricRange: { fontFamily: "SpaceMono", fontSize: 12 },
  metricValue: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"], marginRight: 4 },
  gaugeWrap: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  gaugeText: { flex: 1, gap: 6 },
  gaugeStatus: { fontFamily: "SpaceMono", fontSize: 10, textTransform: "uppercase", fontWeight: "600", letterSpacing: 0.1 * 10 },
  gaugeBody: { fontSize: 12, lineHeight: 18 },
});
