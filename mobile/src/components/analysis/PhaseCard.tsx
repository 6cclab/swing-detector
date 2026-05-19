import React, { useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/lib/theme";
import type { AngleFeedback, Severity, SwingPhaseResult } from "@/src/types/analysis";
import { AngleGauge } from "./AngleGauge";

const PHASE_LABELS: Record<string, string> = {
  address: "Address",
  backswing: "Backswing",
  top_of_backswing: "Top of Backswing",
  downswing: "Downswing",
  impact: "Impact",
  follow_through: "Follow Through",
};

const ANGLE_LABELS: Record<string, string> = {
  hip_rotation_deg: "Hip Rotation",
  shoulder_rotation_deg: "Shoulder Turn",
  spine_angle_deg: "Spine Angle",
  lead_knee_flex_deg: "Lead Knee",
  trail_knee_flex_deg: "Trail Knee",
  wrist_hinge_deg: "Wrist Hinge",
  elbow_angle_deg: "Lead Elbow",
  weight_transfer_ratio: "Weight Transfer",
};

const severityColor = (s: Severity) => colors[s];

type Props = {
  phase: SwingPhaseResult;
};

export function PhaseCard({ phase }: Props) {
  const [expanded, setExpanded] = useState(false);

  const issues = phase.angle_feedback.filter((fb) => fb.severity !== "good");
  const scoreColor =
    phase.phase_score >= 80
      ? colors.good
      : phase.phase_score >= 60
        ? colors.minor
        : phase.phase_score >= 40
          ? colors.moderate
          : colors.major;

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <Text style={styles.phaseName}>
            {PHASE_LABELS[phase.phase] || phase.phase}
          </Text>
          {issues.length > 0 && (
            <Text style={styles.issueCount}>
              {issues.length} issue{issues.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.scorePill, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>
              {Math.round(phase.phase_score)}
            </Text>
          </View>
          <FontAwesome
            name={expanded ? "chevron-up" : "chevron-down"}
            size={12}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          {/* Angle gauges grid */}
          {phase.angle_feedback.length > 0 && (
            <View style={styles.gaugeGrid}>
              {phase.angle_feedback.map((fb) => (
                <AngleGauge
                  key={fb.angle_name}
                  label={ANGLE_LABELS[fb.angle_name] || fb.angle_name}
                  measured={fb.measured}
                  proMin={fb.pro_min}
                  proMax={fb.pro_max}
                  severity={fb.severity}
                  unit={fb.angle_name.includes("ratio") ? "" : "\u00B0"}
                />
              ))}
            </View>
          )}

          {/* Issue details with coaching tips */}
          {issues.length > 0 && (
            <View style={styles.issueList}>
              {issues.map((fb, i) => (
                <FeedbackItem key={i} feedback={fb} />
              ))}
            </View>
          )}

          {issues.length === 0 && (
            <View style={styles.allGoodRow}>
              <FontAwesome
                name="check-circle"
                size={16}
                color={colors.success}
              />
              <Text style={styles.allGoodText}>
                All angles within pro range
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function FeedbackItem({ feedback }: { feedback: AngleFeedback }) {
  const sevColor = severityColor(feedback.severity);

  return (
    <View style={styles.feedbackItem}>
      <View style={styles.feedbackHeader}>
        <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
        <Text style={styles.feedbackAngle}>
          {ANGLE_LABELS[feedback.angle_name] || feedback.angle_name}
        </Text>
        <Text style={[styles.sevLabel, { color: sevColor }]}>
          {feedback.severity}
        </Text>
      </View>
      {feedback.coaching_tip ? (
        <Text style={styles.feedbackTip}>{feedback.coaching_tip}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    gap: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  phaseName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  issueCount: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  scorePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  scoreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
    paddingTop: 16,
  },
  gaugeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  issueList: {
    gap: 12,
  },
  feedbackItem: {
    gap: 4,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sevDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feedbackAngle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  sevLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  feedbackTip: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 16,
  },
  allGoodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 8,
  },
  allGoodText: {
    color: colors.success,
    fontSize: 14,
  },
});
