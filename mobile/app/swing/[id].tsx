import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiGet } from "@/src/lib/api";
import { API_BASE_URL } from "@/src/lib/config";
import { getToken } from "@/src/lib/auth";
import { colors } from "@/src/lib/theme";
import { CoachingTips, PhaseCard, PoseOverlay, ScoreRing } from "@/src/components/analysis";
import type { SwingAnalysisResult } from "@/src/types/analysis";

const screenWidth = Dimensions.get("window").width;
const frameWidth = screenWidth - 64;
const frameHeight = frameWidth * 0.75;

const PHASE_ORDER = [
  "address",
  "backswing",
  "top_of_backswing",
  "downswing",
  "impact",
  "follow_through",
];

export default function SwingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<SwingAnalysisResult | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>("impact");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getToken().then(setTokenState);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await apiGet<
          SwingAnalysisResult | { status: string; error_message?: string }
        >(`/api/swings/${id}`);

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

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  if (status === "loading" || status === "pending" || status === "processing") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Analyzing your swing...</Text>
        <Text style={styles.hint}>This may take 10-30 seconds</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.center}>
        <FontAwesome name="exclamation-triangle" size={40} color={colors.error} />
        <Text style={styles.errorText}>{error || "No data"}</Text>
      </View>
    );
  }

  // Sort phases in swing order
  const sortedPhases = [...result.phases_detected].sort(
    (a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Score Ring */}
      <View style={styles.scoreSection}>
        <ScoreRing score={result.overall_score} />
        <Text style={styles.scoreMeta}>
          {result.frame_count} frames | {(result.duration_ms / 1000).toFixed(1)}s
        </Text>
      </View>

      {/* Phase Frame Preview */}
      <View style={styles.frameSection}>
        <View style={styles.frameSectionHeader}>
          <Text style={styles.sectionTitle}>Phase View</Text>
          <Pressable
            style={styles.compareButton}
            onPress={() => router.push(`/swing/compare?id=${id}`)}
          >
            <FontAwesome name="columns" size={14} color={colors.primary} />
            <Text style={styles.compareText}>All Phases</Text>
          </Pressable>
        </View>

        {/* Phase selector pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.phasePills}
        >
          {sortedPhases.map((phase) => (
            <Pressable
              key={phase.phase}
              style={[
                styles.pill,
                selectedPhase === phase.phase && styles.pillActive,
              ]}
              onPress={() => setSelectedPhase(phase.phase)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedPhase === phase.phase && styles.pillTextActive,
                ]}
              >
                {phase.phase.replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Frame image with skeleton overlay */}
        <View style={styles.frameContainer}>
          <Image
            source={{
              uri: `${API_BASE_URL}/api/swings/${id}/frames/${selectedPhase}`,
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : undefined,
            }}
            style={styles.frameImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Coaching Tips */}
      <CoachingTips tips={result.coaching_summary} />

      {/* Phase Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phase Breakdown</Text>
        {sortedPhases.map((phase) => (
          <PhaseCard key={phase.phase} phase={phase} />
        ))}
      </View>
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
    gap: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 12,
  },
  scoreSection: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  scoreMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  frameSection: {
    gap: 12,
  },
  frameSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compareText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  phasePills: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: "capitalize",
  },
  pillTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  frameContainer: {
    width: "100%",
    height: frameHeight,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  frameImage: {
    width: "100%",
    height: "100%",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
});
