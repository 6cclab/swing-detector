import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/lib/auth-context";
import { useTheme } from "@/src/lib/theme";

export default function Index() {
  const { user, loading } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/progress" />;
  }

  return <Redirect href="/login" />;
}
