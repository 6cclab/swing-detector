import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import "react-native-reanimated";

import { AuthProvider } from "@/src/lib/auth-context";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.swing_id) {
        router.push(`/swing/${data.swing_id}`);
      }
    });
    return () => sub.remove();
  }, []);

  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [bannerOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!Updates.isEnabled) return;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;

        setUpdateStatus("Downloading update...");
        Animated.timing(bannerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

        await Updates.fetchUpdateAsync();
        setUpdateStatus("Update ready — restarting...");

        setTimeout(() => Updates.reloadAsync(), 800);
      } catch {
        Animated.timing(bannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
          () => setUpdateStatus(null)
        );
      }
    })();
  }, [bannerOpacity]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="swing/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="drill/[id]" options={{ headerShown: false }} />
        </Stack>
        {updateStatus && (
          <Animated.View style={[otaStyles.banner, { opacity: bannerOpacity }]}>
            <Text style={otaStyles.text}>{updateStatus}</Text>
          </Animated.View>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

const otaStyles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 54,
    left: 20,
    right: 20,
    backgroundColor: "rgba(189,183,107,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  text: {
    color: "#111",
    fontSize: 13,
    fontWeight: "600",
  },
});
