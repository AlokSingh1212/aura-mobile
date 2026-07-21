import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useStore } from "@/store/useStore";
import { subscribeSettingsEnforcement } from "@/lib/settingsEnforcement";
import {
  authenticateWithBiometrics,
  getBiometricCapability,
  isBiometricAppLockEnabled,
  verifyBiometricEnrollment,
} from "@/lib/biometricLock";
import { IG } from "@/theme/settingsTheme";

const BACKGROUND_GRACE_MS = 800;

/**
 * Full-screen lock overlay when biometric unlock is enabled in Settings → Security.
 * Prompts on cold start and whenever the app returns from background.
 */
export function BiometricLockGate() {
  const insets = useSafeAreaInsets();
  const currentUser = useStore((s) => s.currentUser);
  const authHydrated = useStore((s) => s.authHydrated);
  const authLogOut = useStore((s) => s.authLogOut);

  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricLabel, setBiometricLabel] = useState("Biometric");
  const [lockEnabled, setLockEnabled] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const backgroundAtRef = useRef<number | null>(null);
  const authenticatingRef = useRef(false);
  const unlockedRef = useRef(false);

  const refreshLockEnabled = useCallback(() => {
    setLockEnabled(isBiometricAppLockEnabled());
  }, []);

  useEffect(() => {
    refreshLockEnabled();
    return subscribeSettingsEnforcement(refreshLockEnabled);
  }, [refreshLockEnabled]);

  useEffect(() => {
    void getBiometricCapability().then((cap) => setBiometricLabel(cap.label));
  }, []);

  const runUnlock = useCallback(async () => {
    if (authenticatingRef.current) return;
    if (!currentUser || !lockEnabled) {
      setLocked(false);
      return;
    }

    const enrollment = await verifyBiometricEnrollment();
    if (!enrollment.allowed) {
      setError(enrollment.reason || "Biometric unlock is unavailable on this device.");
      setLocked(true);
      return;
    }

    authenticatingRef.current = true;
    setBusy(true);
    setError(null);

    const result = await authenticateWithBiometrics(`Unlock AURAGRAM with ${biometricLabel}`);

    setBusy(false);
    authenticatingRef.current = false;

    if (result.success) {
      unlockedRef.current = true;
      setLocked(false);
      setError(null);
      return;
    }

    if (!result.cancelled) {
      setError(result.error || "Could not verify your identity.");
    }
    setLocked(true);
  }, [biometricLabel, currentUser, lockEnabled]);

  // Lock on launch when signed in + setting enabled.
  useEffect(() => {
    if (!authHydrated || !currentUser || !lockEnabled || Platform.OS === "web") {
      setLocked(false);
      return;
    }

    unlockedRef.current = false;
    setLocked(true);
    void runUnlock();
  }, [authHydrated, currentUser?.id, lockEnabled]);

  // Re-lock when returning from background.
  useEffect(() => {
    if (!currentUser || !lockEnabled || Platform.OS === "web") return;

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === "background" || nextState === "inactive") {
        backgroundAtRef.current = Date.now();
        return;
      }

      if (nextState !== "active" || !prev.match(/inactive|background/)) return;

      const elapsed = backgroundAtRef.current
        ? Date.now() - backgroundAtRef.current
        : BACKGROUND_GRACE_MS + 1;

      backgroundAtRef.current = null;

      if (elapsed < BACKGROUND_GRACE_MS) return;

      unlockedRef.current = false;
      setLocked(true);
      void runUnlock();
    });

    return () => sub.remove();
  }, [currentUser?.id, lockEnabled, runUnlock]);

  // Clear lock when user signs out.
  useEffect(() => {
    if (!currentUser) {
      setLocked(false);
      unlockedRef.current = false;
    }
  }, [currentUser]);

  if (!authHydrated || !currentUser || !lockEnabled || Platform.OS === "web") {
    return null;
  }

  if (!locked) return null;

  return (
    <Modal visible animationType="fade" transparent={false} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.brandRow}>
          <Lucide name="shield-checkmark-outline" size={28} color="#00f5ff" />
          <Text style={styles.brand}>AURAGRAM</Text>
        </View>

        <View style={styles.center}>
          <View style={styles.iconRing}>
            <Lucide name="finger-print-outline" size={48} color="#00f5ff" />
          </View>
          <Text style={styles.title}>Unlock with {biometricLabel}</Text>
          <Text style={styles.subtitle}>
            Your account is protected. Verify it&apos;s you to continue.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
            onPress={() => void runUnlock()}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Unlock</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            authLogOut();
            router.replace("/login");
          }}
        >
          <Text style={styles.secondaryText}>Sign in with another account</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IG.bg,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brand: {
    color: IG.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(0,245,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: IG.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: IG.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  error: {
    color: IG.danger,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: IG.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    minWidth: 200,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryText: {
    color: IG.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
