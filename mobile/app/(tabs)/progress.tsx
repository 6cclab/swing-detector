import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { apiGet } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";
import type { ProgressResponse } from "@/src/types/swing";

export default function ProgressScreen() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await apiGet<ProgressResponse>("/api/users/me/progress");
          setData(res);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data || data.scores.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No progress data yet</Text>
        <Text style={styles.emptyHint}>
          Complete a few swing analyses to see your trends
        </Text>
      </View>
    );
  }

  const latestScore = data.scores[data.scores.length - 1];
  const firstScore = data.scores[0];
  const improvement = latestScore.score - firstScore.score;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Latest Score</Text>
        <Text style={styles.summaryScore}>
          {Math.round(latestScore.score)}
        </Text>
        <Text
          style={[
            styles.improvement,
            { color: improvement >= 0 ? colors.success : colors.error },
          ]}
        >
          {improvement >= 0 ? "+" : ""}
          {improvement.toFixed(1)} since first swing
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Score History</Text>
      <View style={styles.scoreList}>
        {data.scores.map((point, i) => (
          <View key={i} style={styles.scoreRow}>
            <Text style={styles.scoreDate}>
              {new Date(point.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
            <View style={styles.scoreBarContainer}>
              <View
                style={[
                  styles.scoreBar,
                  {
                    width: `${point.score}%`,
                    backgroundColor:
                      point.score >= 80
                        ? colors.good
                        : point.score >= 60
                          ? colors.minor
                          : colors.moderate,
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreValue}>{Math.round(point.score)}</Text>
          </View>
        ))}
      </View>

      {data.angle_trends.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Key Metrics at Impact</Text>
          {data.angle_trends.map((trend) => (
            <View key={trend.angle_name} style={styles.trendCard}>
              <Text style={styles.trendName}>
                {trend.angle_name.replace(/_/g, " ").replace(" deg", "")}
              </Text>
              <Text style={styles.trendValue}>
                Latest: {trend.values[trend.values.length - 1]?.toFixed(1)}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "500",
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  summaryScore: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "bold",
  },
  improvement: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  scoreList: {
    gap: 8,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreDate: {
    color: colors.textSecondary,
    fontSize: 13,
    width: 50,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
  },
  scoreBar: {
    height: 8,
    borderRadius: 4,
  },
  scoreValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    width: 30,
    textAlign: "right",
  },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  trendValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
