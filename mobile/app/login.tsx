import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/src/lib/auth-context";

// Login is always dark (tournament) regardless of system theme
const DARK = {
  bg: "#1a1d1c",
  surface: "#20251d",
  surfaceAlt: "#262c23",
  border: "rgba(158,168,37,0.14)",
  borderFocus: "#9ea825",
  text: "#f1f2e3",
  textMuted: "rgba(241,242,227,0.60)",
  textDim: "rgba(241,242,227,0.34)",
  accent: "#9ea825",
  bad: "#f87171",
};

export default function LoginScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !name)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      router.replace("/(tabs)/progress");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    {
      backgroundColor: DARK.surfaceAlt,
      color: DARK.text,
      borderColor: focusedField === field ? DARK.borderFocus : DARK.border,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: DARK.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Logo mark */}
        <View style={styles.logoWrap}>
          <View
            style={[
              styles.logoBox,
              {
                backgroundColor: `${DARK.accent}22`,
                borderColor: `${DARK.accent}55`,
              },
            ]}
          >
            <Text style={[styles.logoMark, { color: DARK.accent }]}>SD</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.appTitle, { color: DARK.text }]}>
          Swing Detector
        </Text>
        <Text style={[styles.subtitle, { color: DARK.textMuted }]}>
          {isRegister
            ? "Create your account to get started"
            : "Sign in to track your progress"}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {isRegister && (
            <TextInput
              style={inputStyle("name")}
              placeholder="Full name"
              placeholderTextColor={DARK.textDim}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
            />
          )}

          <TextInput
            style={inputStyle("email")}
            placeholder="Email address"
            placeholderTextColor={DARK.textDim}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />

          <TextInput
            style={inputStyle("password")}
            placeholder="Password"
            placeholderTextColor={DARK.textDim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
          />

          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: DARK.accent,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading
                ? isRegister
                  ? "Creating account..."
                  : "Signing in..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </Text>
          </Pressable>
        </View>

        {/* Toggle */}
        <Pressable
          style={styles.toggleWrap}
          onPress={() => setIsRegister((v) => !v)}
        >
          <Text style={[styles.toggleText, { color: DARK.textMuted }]}>
            {isRegister
              ? "Already have an account? "
              : "Don't have an account? "}
            <Text style={[styles.toggleLink, { color: DARK.accent }]}>
              {isRegister ? "Sign in" : "Register"}
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 0,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  toggleWrap: {
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    textAlign: "center",
  },
  toggleLink: {
    fontWeight: "600",
  },
});
