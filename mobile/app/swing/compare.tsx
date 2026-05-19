import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiGet } from "@/src/lib/api";
import { API_BASE_URL } from "@/src/lib/config";
import { getToken } from "@/src/lib/auth";
import { colors } from "@/src/lib/theme";

type FrameInfo = {
  phase: string;
  url: string;
};

const PHASE_LABELS: Record<string, string> = {
  address: "Address",
  backswing: "Backswing",
  top_of_backswing: "Top of Backswing",
  downswing: "Downswing",
  impact: "Impact",
  follow_through: "Follow Through",
};

const screenWidth = Dimensions.get("window").width;
const frameWidth = screenWidth - 32;
const frameHeight = frameWidth * 0.75;

export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [frames, setFrames] = useState<FrameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      setTokenState(t);

      try {
        const data = await apiGet<{ frames: FrameInfo[] }>(
          `/api/swings/${id}/frames`
        );
        setFrames(data.frames);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (frames.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No frames available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Swing Phase Breakdown</Text>
      <Text style={styles.subtitle}>
        Key frames with skeleton overlay for each detected phase
      </Text>

      {frames.map((frame) => (
        <View key={frame.phase} style={styles.frameCard}>
          <Text style={styles.phaseLabel}>
            {PHASE_LABELS[frame.phase] || frame.phase}
          </Text>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: `${API_BASE_URL}${frame.url}`,
                headers: token
                  ? { Authorization: `Bearer ${token}` }
                  : undefined,
              }}
              style={styles.frameImage}
              resizeMode="contain"
            />
          </View>
        </View>
      ))}
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  frameCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  phaseLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    padding: 16,
    paddingBottom: 8,
  },
  imageContainer: {
    width: "100%",
    height: frameHeight,
    backgroundColor: colors.surfaceLight,
  },
  frameImage: {
    width: "100%",
    height: "100%",
  },
});
