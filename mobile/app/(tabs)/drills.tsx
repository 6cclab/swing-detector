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
  IconChevDown,
  IconClock,
  IconDrills,
  IconTarget,
  PrimaryButton,
} from "@/src/components/ui";
import { DRILLS } from "@/src/data/mock";
import { apiGet } from "@/src/lib/api";
import { typography, useTheme } from "@/src/lib/theme";
import type { SwingListResponse } from "@/src/types/swing";
import type { SwingAnalysisResult } from "@/src/types/analysis";

function DrillCard({
  drill,
  recommended,
}: {
  drill: (typeof DRILLS)[number];
  recommended?: boolean;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      padded={false}
      style={
        recommended
          ? [styles.drillCard, { borderColor: theme.borderStrong }]
          : styles.drillCard
      }
    >
      <Pressable
        style={styles.drillHeader}
        onPress={() => setExpanded((v) => !v)}
      >
        <View
          style={[
            styles.drillIconBox,
            { backgroundColor: `${theme.accent}1e` },
          ]}
        >
          <IconTarget size={20} color={theme.accent} strokeWidth={2} />
        </View>

        <View style={styles.drillHeaderText}>
          <View style={styles.drillTitleRow}>
            <Text style={[styles.drillTitle, { color: theme.text }]}>
              {drill.title}
            </Text>
            {recommended && (
              <View
                style={[
                  styles.recommendedBadge,
                  { backgroundColor: `${theme.accent}28`, borderColor: theme.accent },
                ]}
              >
                <Text
                  style={[
                    styles.recommendedText,
                    { color: theme.accent },
                  ]}
                >
                  RECOMMENDED
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.drillFocus, { color: theme.textMuted }]}>
            {drill.focus}
          </Text>
        </View>

        <View
          style={[
            styles.chevronWrap,
            expanded && styles.chevronExpanded,
          ]}
        >
          <IconChevDown
            size={18}
            color={theme.textDim}
            strokeWidth={1.8}
          />
        </View>
      </Pressable>

      {expanded && (
        <View
          style={[
            styles.drillBody,
            {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.borderStrong,
              borderStyle: "dashed",
            },
          ]}
        >
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <IconClock size={14} color={theme.textMuted} strokeWidth={1.7} />
              <Text style={[styles.metaText, { color: theme.textMuted }]}>
                {drill.duration}
              </Text>
            </View>
            <View
              style={[
                styles.levelPill,
                { backgroundColor: theme.surfaceAlt },
              ]}
            >
              <Text style={[styles.levelText, { color: theme.textMuted }]}>
                {drill.level}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <IconTarget size={14} color={theme.textMuted} strokeWidth={1.7} />
              <Text style={[styles.metaText, { color: theme.textMuted }]}>
                {drill.target.replace(/_/g, " ")}
              </Text>
            </View>
          </View>

          <Text style={[styles.description, { color: theme.text }]}>
            {drill.description}
          </Text>

          <PrimaryButton title="Start drill" onPress={() => {}} />
        </View>
      )}
    </Card>
  );
}

export default function DrillsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [hasSwings, setHasSwings] = useState(false);
  const [latestDate, setLatestDate] = useState<string>("");
  const [recommended, setRecommended] = useState<typeof DRILLS>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await apiGet<SwingListResponse>("/api/swings?page=1&page_size=1");
          const completedSwings = res.items.filter((s) => s.status === "complete");
          if (completedSwings.length > 0) {
            setHasSwings(true);
            const d = new Date(completedSwings[0].created_at);
            setLatestDate(`${["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()]} ${d.getDate()}`);

            // Fetch latest analysis to derive recommendations
            try {
              const analysis = await apiGet<SwingAnalysisResult>(`/api/swings/${completedSwings[0].id}`);
              if ("phases_detected" in analysis && !cancelled) {
                // Find impact phase and derive weak metrics
                const impact = analysis.phases_detected.find((p) => p.phase === "impact");
                if (impact) {
                  // Pick drills targeting metrics with worst feedback
                  const badFeedback = impact.angle_feedback
                    .filter((fb) => fb.severity !== "good")
                    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

                  const picked = DRILLS.slice(0, Math.min(3, badFeedback.length || 3));
                  setRecommended(picked);
                } else {
                  setRecommended(DRILLS.slice(0, 3));
                }
              }
            } catch {
              setRecommended(DRILLS.slice(0, 3));
            }
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

  const recommendedIds = new Set(recommended.map((d) => d.id));
  const library = DRILLS.filter((d) => !recommendedIds.has(d.id));

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Drills</Text>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>
          Targeted practice for your weak spots
        </Text>
      </View>

      {!hasSwings && (
        <View style={styles.emptyInner}>
          <IconDrills size={48} color={theme.textDim} strokeWidth={1.2} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No drills recommended yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Record a swing — we'll match drills to your weakest fundamentals
          </Text>
        </View>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11 }]}>
              RECOMMENDED · {recommended.length}
            </Text>
            {latestDate ? (
              <Text style={[styles.dateTag, { color: theme.accent }]}>FROM {latestDate}</Text>
            ) : null}
          </View>
          <View style={styles.drillList}>
            {recommended.map((drill) => (
              <DrillCard key={drill.id} drill={drill} recommended />
            ))}
          </View>
        </View>
      )}

      {/* Library */}
      <View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.monoKicker, { color: theme.textMuted, letterSpacing: 0.15 * 11 }]}>
            LIBRARY · {DRILLS.length} DRILLS
          </Text>
        </View>
        <View style={styles.drillList}>
          {library.map((drill) => (
            <DrillCard key={drill.id} drill={drill} />
          ))}
        </View>
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
    paddingBottom: 40,
    gap: 8,
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
    fontSize: typography.caption + 2,
    marginTop: 2,
  },
  monoKicker: {
    fontFamily: typography.fontMono,
    fontSize: typography.caption,
    textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  dateTag: {
    fontFamily: typography.fontMono,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  drillList: {
    gap: 8,
  },
  drillCard: {
    overflow: "hidden",
  },
  drillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  drillIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drillHeaderText: {
    flex: 1,
    gap: 3,
  },
  drillTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  drillTitle: {
    fontSize: typography.cardTitle,
    fontWeight: "600",
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  recommendedText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  drillFocus: {
    fontSize: 12,
  },
  chevronWrap: {
    transform: [{ rotate: "0deg" }],
  },
  chevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  drillBody: {
    padding: 14,
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "500",
  },
  description: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyInner: {
    alignItems: "center",
    gap: 10,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
