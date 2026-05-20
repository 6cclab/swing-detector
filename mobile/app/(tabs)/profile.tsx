import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card, IconChevRight, IconLogout } from "@/src/components/ui";
import { USER } from "@/src/data/mock";
import { useAuth } from "@/src/lib/auth-context";
import { typography, useTheme } from "@/src/lib/theme";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatJoined(d: Date) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface SettingsRowProps {
  label: string;
  value: string;
  last?: boolean;
}

function SettingsRow({ label, value, last }: SettingsRowProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.settingsRow,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.settingsLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.settingsRight}>
        <Text style={[styles.settingsValue, { color: theme.textMuted }]}>
          {value}
        </Text>
        <IconChevRight size={16} color={theme.textDim} strokeWidth={1.7} />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const user = USER;

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
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: `${theme.accent}28`,
              borderColor: `${theme.accent}40`,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {getInitials(user.name)}
          </Text>
        </View>
        <View style={styles.heroText}>
          <Text style={[styles.heroName, { color: theme.text }]}>{user.name}</Text>
          <Text
            style={[
              styles.heroEmail,
              { color: theme.textMuted, fontFamily: typography.fontMono },
            ]}
          >
            {user.email}
          </Text>
        </View>
      </Card>

      {/* Stats Card */}
      <Card>
        <View style={styles.statsGrid}>
          <View style={[styles.statCell, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }]}>
            <Text
              style={[
                styles.statKicker,
                { color: theme.textDim, letterSpacing: 0.16 * 10 },
              ]}
            >
              HANDEDNESS
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {user.handedness === "right" ? "Right" : "Left"}
            </Text>
          </View>
          <View style={[styles.statCell, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }]}>
            <Text
              style={[
                styles.statKicker,
                { color: theme.textDim, letterSpacing: 0.16 * 10 },
              ]}
            >
              HANDICAP
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {user.handicap}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text
              style={[
                styles.statKicker,
                { color: theme.textDim, letterSpacing: 0.16 * 10 },
              ]}
            >
              JOINED
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatJoined(user.joined)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Settings List */}
      <Card padded={false}>
        <SettingsRow label="Notifications" value="On" />
        <SettingsRow label="Default camera angle" value="Face-on" />
        <SettingsRow label="Units" value="Yards · °" />
        <SettingsRow label="Help & support" value="" last />
      </Card>

      {/* Sign out */}
      <Pressable
        style={[
          styles.signOutButton,
          {
            borderColor: theme.borderStrong,
            backgroundColor: theme.surface,
          },
        ]}
        onPress={handleSignOut}
      >
        <IconLogout size={18} color={theme.severity.bad} strokeWidth={2} />
        <Text style={[styles.signOutText, { color: theme.severity.bad }]}>
          Sign out
        </Text>
      </Pressable>
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
    gap: 12,
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
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroText: {
    flex: 1,
    gap: 3,
  },
  heroName: {
    fontSize: 19,
    fontWeight: "600",
  },
  heroEmail: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: "row",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  statKicker: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsLabel: {
    fontSize: typography.body,
    fontWeight: "500",
  },
  settingsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsValue: {
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
