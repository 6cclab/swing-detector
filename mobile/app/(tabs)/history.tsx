import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";

import { Card, IconChevRight, IconList } from "@/src/components/ui";
import { apiGet, apiDelete } from "@/src/lib/api";
import { scoreSeverity, typography, useTheme } from "@/src/lib/theme";
import type { SwingListResponse, SwingSummary } from "@/src/types/swing";

const MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function fmtDateHeader(d: Date) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function fmtTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h % 12 || 12}:${m}${h >= 12 ? "pm" : "am"}`;
}

type Group = { key: string; date: Date; items: (SwingSummary & { dateObj: Date })[] };

function groupByDate(items: SwingSummary[]): Group[] {
  const map: Record<string, Group> = {};
  for (const s of items) {
    const d = new Date(s.created_at);
    const key = d.toDateString();
    if (!map[key]) map[key] = { key, date: d, items: [] };
    map[key].items.push({ ...s, dateObj: d });
  }
  return Object.values(map).sort((a, b) => b.date.getTime() - a.date.getTime());
}

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const theme = useTheme();

  const renderRightActions = () => (
    <Pressable
      style={[styles.deleteAction, { backgroundColor: theme.severity.bad }]}
      onPress={onDelete}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  const fetchSwings = useCallback(async () => {
    try {
      const res = await apiGet<SwingListResponse>("/api/swings?page=1&page_size=50");
      setGroups(groupByDate(res.items));
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const deleteSwing = useCallback(async (id: string) => {
    try {
      await apiDelete(`/api/swings/${id}`);
      fetchSwings();
    } catch { /* ignore */ }
  }, [fetchSwings]);

  useFocusEffect(
    useCallback(() => {
      fetchSwings();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.screen, { backgroundColor: theme.bg }]}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSwings(); }} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>History</Text>
      </View>

      {groups.length === 0 && (
        <View style={styles.emptyInner}>
          <IconList size={48} color={theme.textDim} strokeWidth={1.2} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No swings recorded yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Go to the Record tab to capture your first swing
          </Text>
        </View>
      )}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={[styles.dateHeader, { color: theme.textMuted }]}>
            {fmtDateHeader(group.date)}
          </Text>
          <View style={styles.swingList}>
            {group.items.map((swing) => {
              const sev = swing.overall_score != null ? scoreSeverity(swing.overall_score) : "mod";
              const sevColor = theme.severity[sev];
              const isPending = swing.status !== "complete";

              return (
                <Card key={swing.id} padded={false} style={styles.swingCard}>
                  <SwipeableRow onDelete={() => deleteSwing(swing.id)}>
                    <Pressable
                      style={[styles.swingRow, { backgroundColor: theme.surface }]}
                      onPress={() => {
                        if (!isPending) router.push(`/swing/${swing.id}`);
                      }}
                    >
                      <View style={[styles.scoreBadge, { backgroundColor: `${sevColor}1e` }]}>
                        {isPending ? (
                          <ActivityIndicator size="small" color={sevColor} />
                        ) : (
                          <Text style={[styles.scoreBadgeText, { color: sevColor }]}>
                            {swing.overall_score != null ? Math.round(swing.overall_score) : "—"}
                          </Text>
                        )}
                      </View>
                      <View style={styles.swingMeta}>
                        <Text style={[styles.swingLabel, { color: theme.text }]}>
                          {isPending ? `Swing (${swing.status})` : "Swing"}
                        </Text>
                        <Text style={[styles.swingDetail, { color: theme.textMuted }]}>
                          {fmtTime(swing.dateObj)} · {swing.handedness}
                        </Text>
                      </View>
                      {!isPending && <IconChevRight size={16} color={theme.textDim} strokeWidth={1.7} />}
                    </Pressable>
                  </SwipeableRow>
                </Card>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 4 },
  header: { paddingTop: 60, paddingBottom: 12 },
  screenTitle: { fontSize: typography.screenTitle, fontWeight: "700", letterSpacing: -0.5 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyInner: { marginTop: 80, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: "600" },
  emptyBody: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  group: { marginBottom: 16 },
  swingList: { gap: 10 },
  swingCard: { overflow: "hidden" },
  dateHeader: { fontFamily: "SpaceMono", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.18 * 11, marginBottom: 8 },
  swingRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  swingMeta: { flex: 1, gap: 4 },
  scoreBadge: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scoreBadgeText: { fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
  swingLabel: { fontSize: typography.cardTitle, fontWeight: "500" },
  swingDetail: { fontSize: 12 },
  deleteAction: { width: 80, justifyContent: "center", alignItems: "center" },
  deleteText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
