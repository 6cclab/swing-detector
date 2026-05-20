import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card, IconChevRight } from "@/src/components/ui";
import { SWINGS } from "@/src/data/mock";
import { scoreSeverity, typography, useTheme } from "@/src/lib/theme";

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function formatDateHeader(d: Date) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${m}${ampm}`;
}

type Swing = (typeof SWINGS)[number];

function groupByDate(swings: Swing[]): { dateKey: string; date: Date; items: Swing[] }[] {
  const map: Record<string, { date: Date; items: Swing[] }> = {};
  for (const swing of swings) {
    const key = swing.date.toDateString();
    if (!map[key]) {
      map[key] = { date: swing.date, items: [] };
    }
    map[key].items.push(swing);
  }
  return Object.entries(map)
    .map(([dateKey, val]) => ({ dateKey, ...val }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const groups = groupByDate(SWINGS);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>History</Text>
      </View>

      {groups.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No swings yet
          </Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Record a swing to see it here
          </Text>
        </View>
      )}

      {groups.map((group) => (
        <View key={group.dateKey} style={styles.group}>
          <Text
            style={[
              styles.dateHeader,
              { color: theme.textMuted },
            ]}
          >
            {formatDateHeader(group.date)}
          </Text>

          <Card padded={false}>
            {group.items.map((swing, idx) => {
              const severity = scoreSeverity(swing.score);
              const sevColor = theme.severity[severity];
              const bgColor = `${sevColor}1e`;

              return (
                <Pressable
                  key={swing.id}
                  style={[
                    styles.swingRow,
                    idx < group.items.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}
                  onPress={() => router.push(`/swing/${swing.id}`)}
                >
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: bgColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreBadgeText,
                        { color: sevColor },
                      ]}
                    >
                      {swing.score}
                    </Text>
                  </View>

                  <View style={styles.swingMeta}>
                    <Text style={[styles.swingLabel, { color: theme.text }]}>
                      {swing.label}
                    </Text>
                    <Text style={[styles.swingDetail, { color: theme.textMuted }]}>
                      {formatTime(swing.date)} · {swing.club}
                    </Text>
                  </View>

                  <IconChevRight size={16} color={theme.textDim} strokeWidth={1.7} />
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}
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
    gap: 4,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: typography.screenTitle,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  group: {
    marginBottom: 12,
  },
  dateHeader: {
    fontFamily: typography.fontMono,
    fontSize: typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.18 * 11,
    marginBottom: 8,
  },
  swingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeText: {
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  swingMeta: {
    flex: 1,
    gap: 3,
  },
  swingLabel: {
    fontSize: typography.cardTitle,
    fontWeight: "500",
  },
  swingDetail: {
    fontSize: 12,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyBody: {
    fontSize: 14,
  },
});
