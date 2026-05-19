import FontAwesome from "@expo/vector-icons/FontAwesome";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "@/src/lib/auth-context";
import { apiUpload } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";
import type { SwingUploadResponse } from "@/src/types/swing";

type CameraFacing = "back" | "front";

export default function RecordScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [active, setActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, [])
  );

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const startRecording = async () => {
    if (!cameraRef.current) return;
    setRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 15 });
      if (video?.uri) {
        await uploadVideo(video.uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to record video");
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const toggleCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const uploadVideo = async (uri: string) => {
    setUploading(true);
    try {
      const res = await apiUpload<SwingUploadResponse>(
        "/api/swings/upload",
        uri,
        "swing.mp4",
        { handedness: user?.handedness || "right" }
      );
      router.push(`/swing/${res.swing_id}`);
    } catch (e: unknown) {
      Alert.alert("Upload Failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  };

  if (uploading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Uploading swing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {active ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
        />
      ) : (
        <View style={styles.camera} />
      )}

      <View style={styles.overlay}>
        <Text style={styles.hint}>
          Position camera face-on or down-the-line
        </Text>
      </View>

      <View style={styles.topControls}>
        <Pressable style={styles.flipButton} onPress={toggleCamera}>
          <FontAwesome name="refresh" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.recordButton, recording && styles.recordingActive]}
          onPress={recording ? stopRecording : startRecording}
        >
          <View
            style={recording ? styles.stopIcon : styles.recordIcon}
          />
        </Pressable>
        <Text style={styles.recordLabel}>
          {recording ? "Tap to stop" : "Tap to record"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hint: {
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  topControls: {
    position: "absolute",
    top: 60,
    right: 20,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  recordingActive: {
    borderColor: colors.error,
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  recordLabel: {
    color: "#fff",
    fontSize: 14,
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
