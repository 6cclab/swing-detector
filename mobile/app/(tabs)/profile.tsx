import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Card, IconChevRight, IconLogout } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth-context";
import { typography, useTheme } from "@/src/lib/theme";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout, updatePreferences } = useAuth();
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const handedness = user?.handedness === "left" ? "Left" : "Right";
  const notifications = user?.notifications ?? true;
  const cameraAngle = user?.camera_angle || "face-on";
  const units = user?.units || "yards";

  const toggleNotifications = async () => {
    setUpdating("notifications");
    try {
      await updatePreferences({ notifications: !notifications });
    } catch (e) {
      Alert.alert("Error", "Failed to update notification setting");
    }
    setUpdating(null);
  };

  const cycleCameraAngle = async () => {
    const next = cameraAngle === "face-on" ? "down-the-line" : "face-on";
    setUpdating("camera_angle");
    try {
      await updatePreferences({ camera_angle: next });
    } catch (e) {
      Alert.alert("Error", "Failed to update camera angle");
    }
    setUpdating(null);
  };

  const cycleUnits = async () => {
    const next = units === "yards" ? "meters" : "yards";
    setUpdating("units");
    try {
      await updatePreferences({ units: next });
    } catch (e) {
      Alert.alert("Error", "Failed to update units");
    }
    setUpdating(null);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const cameraLabel = cameraAngle === "face-on" ? "Face-on" : "Down-the-line";
  const unitsLabel = units === "yards" ? "Yards · °" : "Meters · °";

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Profile</Text>
      </View>

      {/* Hero Card */}
      <Card style={styles.heroCard}>
        <View style={[styles.avatar, { backgroundColor: `${theme.accent}28`, borderColor: `${theme.accent}40` }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {getInitials(displayName)}
          </Text>
        </View>
        <View style={styles.heroText}>
          <Text style={[styles.heroName, { color: theme.text }]}>{displayName}</Text>
          <Text style={[styles.heroEmail, { color: theme.textMuted, fontFamily: "SpaceMono" }]}>
            {displayEmail}
          </Text>
        </View>
      </Card>

      {/* Stats Card */}
      <Card>
        <View style={styles.statsGrid}>
          <View style={[styles.statCell, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }]}>
            <Text style={[styles.statKicker, { color: theme.textDim }]}>HANDEDNESS</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{handedness}</Text>
          </View>
          <View style={[styles.statCell, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }]}>
            <Text style={[styles.statKicker, { color: theme.textDim }]}>HANDICAP</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>—</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={[styles.statKicker, { color: theme.textDim }]}>JOINED</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>2026</Text>
          </View>
        </View>
      </Card>

      {/* Settings */}
      <Card padded={false}>
        {/* Notifications — toggle switch */}
        <View style={[styles.settingsRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
          <Text style={[styles.settingsLabel, { color: theme.text }]}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: theme.surfaceHi, true: `${theme.accent}80` }}
            thumbColor={notifications ? theme.accent : theme.textDim}
            disabled={updating === "notifications"}
          />
        </View>

        {/* Camera angle — tap to cycle */}
        <Pressable
          style={[styles.settingsRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
          onPress={cycleCameraAngle}
          disabled={updating === "camera_angle"}
        >
          <Text style={[styles.settingsLabel, { color: theme.text }]}>Default camera angle</Text>
          <View style={styles.settingsRight}>
            <Text style={[styles.settingsValue, { color: theme.textMuted, opacity: updating === "camera_angle" ? 0.4 : 1 }]}>
              {cameraLabel}
            </Text>
            <IconChevRight size={16} color={theme.textDim} strokeWidth={1.7} />
          </View>
        </Pressable>

        {/* Units — tap to cycle */}
        <Pressable
          style={[styles.settingsRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
          onPress={cycleUnits}
          disabled={updating === "units"}
        >
          <Text style={[styles.settingsLabel, { color: theme.text }]}>Units</Text>
          <View style={styles.settingsRight}>
            <Text style={[styles.settingsValue, { color: theme.textMuted, opacity: updating === "units" ? 0.4 : 1 }]}>
              {unitsLabel}
            </Text>
            <IconChevRight size={16} color={theme.textDim} strokeWidth={1.7} />
          </View>
        </Pressable>

        {/* Help — static */}
        <View style={styles.settingsRow}>
          <Text style={[styles.settingsLabel, { color: theme.text }]}>Help & support</Text>
          <View style={styles.settingsRight}>
            <IconChevRight size={16} color={theme.textDim} strokeWidth={1.7} />
          </View>
        </View>
      </Card>

      {/* Sign Out */}
      <Pressable
        style={[styles.signOutButton, { borderColor: theme.borderStrong, backgroundColor: theme.surface }]}
        onPress={handleSignOut}
      >
        <IconLogout size={18} color={theme.severity.bad} strokeWidth={2} />
        <Text style={[styles.signOutText, { color: theme.severity.bad }]}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  header: { paddingTop: 60, paddingBottom: 8 },
  screenTitle: { fontSize: typography.screenTitle, fontWeight: "700", letterSpacing: -0.5 },
  heroCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "700", letterSpacing: 1 },
  heroText: { flex: 1, gap: 3 },
  heroName: { fontSize: 19, fontWeight: "600" },
  heroEmail: { fontSize: 12 },
  statsGrid: { flexDirection: "row" },
  statCell: { flex: 1, alignItems: "center", gap: 5 },
  statKicker: { fontFamily: "SpaceMono", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.6 },
  statValue: { fontSize: 15, fontWeight: "600" },
  settingsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 },
  settingsLabel: { fontSize: typography.body, fontWeight: "500" },
  settingsRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingsValue: { fontSize: 14 },
  signOutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  signOutText: { fontSize: 15, fontWeight: "600" },
});
