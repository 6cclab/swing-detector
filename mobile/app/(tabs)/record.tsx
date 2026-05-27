import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { IconFlip } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth-context";
import { apiUpload } from "@/src/lib/api";
import { showLocalNotification } from "@/src/lib/notifications";

type CameraFacing = "back" | "front";

export default function RecordScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [active, setActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, [])
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to record your swing
        </Text>
        <Pressable style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Permission</Text>
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
        Alert.alert("Swing Uploaded", "You'll get a notification when analysis is ready.");
        apiUpload<{ swing_id: string }>(
          "/api/swings/upload",
          video.uri,
          `swing_${Date.now()}.mp4`,
          { handedness: user?.handedness || "right" }
        ).catch(() => {
          showLocalNotification(
            "Upload Failed",
            "Your swing couldn't be uploaded. Please try again."
          );
        });
      }
    } catch {
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

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const count = result.assets.length;
      Alert.alert(
        count === 1 ? "Swing Uploaded" : `${count} Swings Uploaded`,
        "You'll get a notification when each analysis is ready."
      );
      for (const asset of result.assets) {
        apiUpload<{ swing_id: string }>(
          "/api/swings/upload",
          asset.uri,
          `swing_${Date.now()}.mp4`,
          { handedness: user?.handedness || "right" }
        ).catch(() => {
          showLocalNotification(
            "Upload Failed",
            "One of your swings couldn't be uploaded. Please try again."
          );
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera */}
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

      {/* Top controls */}
      <View style={styles.topControls}>
        <Pressable style={styles.topButton} onPress={pickFromLibrary}>
          <Text style={styles.libraryText}>Library</Text>
        </Pressable>
        <Pressable style={styles.topButton} onPress={toggleCamera}>
          <IconFlip size={20} color="#fff" strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* Hint pill - top center */}
      <View style={styles.hintWrap}>
        <View style={styles.hintPill}>
          <Text style={styles.hintText}>
            Position camera {user?.camera_angle === "down-the-line" ? "down-the-line" : "face-on"}
          </Text>
        </View>
      </View>

      {/* Record controls - bottom */}
      <View style={styles.controls}>
        <Pressable
          style={[
            styles.recordOuter,
            recording && styles.recordOuterActive,
          ]}
          onPress={recording ? stopRecording : startRecording}
          hitSlop={12}
        >
          <View style={recording ? styles.stopInner : styles.recordInner} />
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
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 40,
  },
  permissionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  grantButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  grantButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  topControls: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topButton: {
    height: 40,
    minWidth: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  libraryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  hintWrap: {
    position: "absolute",
    top: 112,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintPill: {
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  hintText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "500",
  },
  controls: {
    position: "absolute",
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 14,
  },
  recordOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  recordOuterActive: {
    borderColor: "rgba(255,255,255,0.6)",
  },
  recordInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ef4444",
  },
  stopInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  recordLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
