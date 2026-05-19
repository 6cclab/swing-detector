import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/lib/theme";

type Props = {
  tips: string[];
};

export function CoachingTips({ tips }: Props) {
  if (tips.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="lightbulb-o" size={18} color={colors.warning} />
        <Text style={styles.title}>Coaching Tips</Text>
      </View>
      {tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{i + 1}</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  tipRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  numberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  tipText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
