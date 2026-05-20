import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Card,
  IconChevDown,
  IconClock,
  IconTarget,
  PrimaryButton,
} from "@/src/components/ui";
import { DRILLS, SWINGS, recommendDrills } from "@/src/data/mock";
import { typography, useTheme } from "@/src/lib/theme";

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

  const latestSwing = SWINGS[0];
  const recommended = latestSwing
    ? recommendDrills(latestSwing.metrics)
    : DRILLS.slice(0, 3);

  const recommendedIds = new Set(recommended.map((d) => d.id));
  const library = DRILLS.filter((d) => !recommendedIds.has(d.id));

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Drills</Text>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>
          Targeted practice for your weak spots
        </Text>
      </View>

      {/* Recommended Section */}
      <View>
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.monoKicker,
              { color: theme.textMuted, letterSpacing: 0.15 * 11 },
            ]}
          >
            RECOMMENDED · {recommended.length}
          </Text>
          <Text style={[styles.dateTag, { color: theme.accent }]}>
            FROM MAY 18
          </Text>
        </View>

        <View style={styles.drillList}>
          {recommended.map((drill) => (
            <DrillCard key={drill.id} drill={drill} recommended />
          ))}
        </View>
      </View>

      {/* Library Section */}
      <View>
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.monoKicker,
              { color: theme.textMuted, letterSpacing: 0.15 * 11 },
            ]}
          >
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
});
