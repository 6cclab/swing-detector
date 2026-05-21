import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Card,
  IconChevLeft,
  IconChevRight,
  IconTarget,
  PrimaryButton,
} from "@/src/components/ui";
import { DRILL_ILLUSTRATIONS } from "@/src/components/ui/DrillIllustrations";
import { DRILLS } from "@/src/data/mock";
import { typography, useTheme } from "@/src/lib/theme";
import { useMetronome } from "@/src/lib/useMetronome";

export default function DrillFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const drill = DRILLS.find((d) => d.id === id);
  const [currentStep, setCurrentStep] = useState(0);
  const metronome = useMetronome();
  const isTempoDrill = drill?.id === "3-to-1-tempo";
  const showMetronome = isTempoDrill && currentStep > 0 && currentStep < (drill?.steps.length ?? 0) - 1;

  useEffect(() => {
    if (!showMetronome) metronome.stop();
  }, [showMetronome]);

  if (!drill) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Drill not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: theme.accent }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const steps = drill.steps;
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = (currentStep + 1) / steps.length;

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <IconChevLeft size={18} color={theme.text} strokeWidth={2} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{drill.title}</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
        <View
          style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.accent }]}
        />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step number badge */}
        <View style={[styles.stepBadge, { backgroundColor: `${theme.accent}22` }]}>
          <Text style={[styles.stepBadgeText, { color: theme.accent }]}>
            STEP {currentStep + 1}
          </Text>
        </View>

        {/* Step title */}
        <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>

        {/* Illustration */}
        {DRILL_ILLUSTRATIONS[drill.id]?.[currentStep] && (
          <View style={[styles.illustrationWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {DRILL_ILLUSTRATIONS[drill.id][currentStep]({ size: 200, color: theme.accent })}
          </View>
        )}

        {/* Metronome controls */}
        {showMetronome && (
          <Pressable
            style={[
              styles.metronomeButton,
              {
                backgroundColor: metronome.playing ? `${theme.accent}22` : theme.surfaceAlt,
                borderColor: metronome.playing ? theme.accent : theme.border,
              },
            ]}
            onPress={metronome.playing ? metronome.stop : metronome.start}
          >
            <View style={[styles.metronomeDot, { backgroundColor: metronome.playing ? theme.accent : theme.textMuted }]} />
            <Text style={[styles.metronomeLabel, { color: metronome.playing ? theme.accent : theme.text }]}>
              {metronome.playing ? "Stop Metronome" : "Play Metronome — 72 BPM"}
            </Text>
          </Pressable>
        )}

        {/* Instruction card */}
        <Card style={styles.instructionCard}>
          <Text style={[styles.instruction, { color: theme.text }]}>
            {step.instruction}
          </Text>
        </Card>

        {/* Tip */}
        {step.tip && (
          <View style={[styles.tipCard, { backgroundColor: `${theme.accent}12`, borderColor: theme.borderStrong }]}>
            <View style={[styles.tipIcon, { backgroundColor: `${theme.accent}22` }]}>
              <IconTarget size={16} color={theme.accent} strokeWidth={2} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipLabel, { color: theme.accent }]}>TIP</Text>
              <Text style={[styles.tipText, { color: theme.text }]}>{step.tip}</Text>
            </View>
          </View>
        )}

        {/* Drill info */}
        <View style={styles.drillMeta}>
          <View style={[styles.metaChip, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{drill.duration}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{drill.level}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{drill.focus}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.nav, { borderTopColor: theme.border }]}>
        {!isFirst ? (
          <Pressable
            style={[styles.navButton, { borderColor: theme.border }]}
            onPress={() => setCurrentStep((s) => s - 1)}
          >
            <IconChevLeft size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.navButtonText, { color: theme.text }]}>Previous</Text>
          </Pressable>
        ) : (
          <View style={styles.navSpacer} />
        )}

        {isLast ? (
          <PrimaryButton
            title="Finish drill"
            onPress={() => router.back()}
          />
        ) : (
          <Pressable
            style={[styles.nextButton, { backgroundColor: theme.accent }]}
            onPress={() => setCurrentStep((s) => s + 1)}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <IconChevRight size={18} color="#fff" strokeWidth={2} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16 },
  backLink: { fontSize: 15, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerSub: { fontSize: 12, marginTop: 2 },
  progressTrack: { height: 3, marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 3, borderRadius: 2 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20, gap: 20 },
  stepBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  stepBadgeText: { fontFamily: "SpaceMono", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  stepTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  illustrationWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, borderWidth: 0.5 },
  instructionCard: { gap: 0 },
  instruction: { fontSize: 17, lineHeight: 26, fontWeight: "400" },
  tipCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 0.5 },
  tipIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  tipContent: { flex: 1, gap: 4 },
  tipLabel: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  tipText: { fontSize: 14, lineHeight: 21 },
  drillMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  metaText: { fontSize: 12, fontWeight: "500" },
  metronomeButton: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  metronomeDot: { width: 10, height: 10, borderRadius: 5 },
  metronomeLabel: { fontSize: 15, fontWeight: "600" },
  nav: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 36, borderTopWidth: StyleSheet.hairlineWidth },
  navSpacer: { flex: 1 },
  navButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  navButtonText: { fontSize: 15, fontWeight: "500" },
  nextButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 52, borderRadius: 12 },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
