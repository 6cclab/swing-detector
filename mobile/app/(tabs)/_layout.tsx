import { Tabs, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  IconCamera,
  IconDrills,
  IconList,
  IconProgress,
  IconUser,
} from "@/src/components/ui";
import { useTheme } from "@/src/lib/theme";

const TAB_BAR_HEIGHT = 64;

type TabName = "progress" | "drills" | "history" | "profile";

interface TabItemProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: (active: boolean) => React.ReactNode;
}

function TabItem({ label, active, onPress, icon }: TabItemProps) {
  const theme = useTheme();
  return (
    <Pressable style={styles.tabItem} onPress={onPress} hitSlop={8}>
      {icon(active)}
      <Text
        style={[
          styles.tabLabel,
          {
            color: active ? theme.accent : theme.textMuted,
            fontWeight: active ? "600" : "500",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CustomTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeRoute = state.routes[state.index]?.name ?? "";

  const isActive = (name: TabName) => activeRoute === name;

  const goTo = (name: string) => navigation.navigate(name);

  const strokeActive = 2.2;
  const strokeInactive = 1.7;

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.borderStrong,
          paddingBottom: insets.bottom || 8,
          height: TAB_BAR_HEIGHT + (insets.bottom || 8),
        },
      ]}
    >
      {/* Progress */}
      <TabItem
        label="Progress"
        active={isActive("progress")}
        onPress={() => goTo("progress")}
        icon={(active) => (
          <IconProgress
            color={active ? theme.accent : theme.textMuted}
            strokeWidth={active ? strokeActive : strokeInactive}
          />
        )}
      />

      {/* Drills */}
      <TabItem
        label="Drills"
        active={isActive("drills")}
        onPress={() => goTo("drills")}
        icon={(active) => (
          <IconDrills
            color={active ? theme.accent : theme.textMuted}
            strokeWidth={active ? strokeActive : strokeInactive}
          />
        )}
      />

      {/* Record FAB */}
      <View style={styles.fabWrapper}>
        <Pressable
          style={[
            styles.fab,
            {
              backgroundColor: theme.accent,
              borderColor: theme.fabBorder,
              shadowColor: theme.accent,
            },
          ]}
          onPress={() => router.push("/(tabs)/record")}
        >
          <IconCamera size={26} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>

      {/* History */}
      <TabItem
        label="History"
        active={isActive("history")}
        onPress={() => goTo("history")}
        icon={(active) => (
          <IconList
            color={active ? theme.accent : theme.textMuted}
            strokeWidth={active ? strokeActive : strokeInactive}
          />
        )}
      />

      {/* Profile */}
      <TabItem
        label="Profile"
        active={isActive("profile")}
        onPress={() => goTo("profile")}
        icon={(active) => (
          <IconUser
            color={active ? theme.accent : theme.textMuted}
            strokeWidth={active ? strokeActive : strokeInactive}
          />
        )}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="drills" />
      <Tabs.Screen name="record" options={{ href: null }} />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  fabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -28,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
