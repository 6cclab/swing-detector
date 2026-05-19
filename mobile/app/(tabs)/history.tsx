import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { apiGet } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";
import type { SwingListResponse, SwingSummary } from "@/src/types/swing";

export default function HistoryScreen() {
  const router = useRouter();
  const [swings, setSwings] = useState<SwingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSwings = async () => {
    try {
      const res = await apiGet<SwingListResponse>("/api/swings?page=1&page_size=50");
      setSwings(res.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSwings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSwings();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <FontAwesome name="check-circle" size={16} color={colors.success} />;
      case "processing":
      case "pending":
        return <ActivityIndicator size="small" color={colors.primary} />;
      case "failed":
        return <FontAwesome name="times-circle" size={16} color={colors.error} />;
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: SwingSummary }) => (
    <Pressable
      style={styles.card}
      onPress={() => {
        if (item.status === "complete") {
          router.push(`/swing/${item.id}`);
        }
      }}
    >
      <View style={styles.cardLeft}>
        {statusIcon(item.status)}
        <View>
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text style={styles.cardStatus}>{item.status}</Text>
        </View>
      </View>
      {item.overall_score !== null && (
        <View
          style={[
            styles.scoreBadge,
            {
              backgroundColor:
                item.overall_score >= 80
                  ? colors.good
                  : item.overall_score >= 60
                    ? colors.minor
                    : item.overall_score >= 40
                      ? colors.moderate
                      : colors.major,
            },
          ]}
        >
          <Text style={styles.scoreText}>{Math.round(item.overall_score)}</Text>
        </View>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={swings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No swings recorded yet</Text>
            <Text style={styles.emptyHint}>
              Go to the Record tab to capture your first swing
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardDate: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  cardStatus: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: "capitalize",
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
});
