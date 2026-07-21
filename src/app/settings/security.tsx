import React, { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { useStore } from "@/store/useStore";
import {
  fetchDeviceSessions,
  revokeAllOtherSessions,
  revokeDeviceSession,
  type DeviceSession,
} from "@/lib/sessionsApi";
import {
  authenticateWithBiometrics,
  verifyBiometricEnrollment,
} from "@/lib/biometricLock";
import { sendTwoFactorOtp, verifyTwoFactorOtp } from "@/lib/twoFactorApi";
import { Alert } from "react-native";

export default function SecuritySettingsScreen() {
  const { data, patch } = useSettingsSection("security");
  const { currentUser, updateProfile, triggerHaptic } = useStore();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!currentUser?.id) {
      setSessions([]);
      setLoadingSessions(false);
      return;
    }
    setLoadingSessions(true);
    const res = await fetchDeviceSessions();
    if (res.success && res.sessions) setSessions(res.sessions);
    setLoadingSessions(false);
  }, [currentUser?.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  if (!data) return null;

  const syncSecurity = async (key: keyof typeof data, value: boolean) => {
    await patch({ [key]: value });
    if (currentUser?.id) {
      await updateProfile({ userId: currentUser.id, [key]: value });
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const enrollment = await verifyBiometricEnrollment();
      if (!enrollment.allowed) {
        Alert.alert("Biometric unavailable", enrollment.reason || "Set up biometrics on this device first.");
        return;
      }
      const auth = await authenticateWithBiometrics("Confirm to enable biometric unlock");
      if (!auth.success) {
        if (auth.error && !auth.cancelled) {
          Alert.alert("Could not enable", auth.error);
        }
        return;
      }
    }
    triggerHaptic("light");
    await syncSecurity("biometricEnabled", enabled);
  };

  const revoke = (session: DeviceSession) => {
    if (session.current) {
      Alert.alert("Current device", "You cannot sign out the device you're using now.");
      return;
    }
    Alert.alert("Log out device?", `Remove session on ${session.device}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          triggerHaptic("heavy");
          const res = await revokeDeviceSession(session.id);
          if (res.success) await loadSessions();
          else Alert.alert("Failed", res.error || "Could not revoke session.");
        },
      },
    ]);
  };

  const revokeOthers = () => {
    Alert.alert("Log out everywhere else?", "Other phones and browsers will need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out all",
        style: "destructive",
        onPress: async () => {
          const res = await revokeAllOtherSessions();
          if (res.success) await loadSessions();
        },
      },
    ]);
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled && currentUser?.id) {
      triggerHaptic("light");
      const sendResult = await sendTwoFactorOtp(currentUser.id);
      if (!sendResult.success) {
        Alert.alert("Could not send code", sendResult.error || "Try again later.");
        return;
      }

      const verified = await new Promise<boolean>((resolve) => {
        const submitCode = async (code: string | undefined) => {
          const trimmed = code?.trim() || "";
          if (trimmed.length !== 6) {
            Alert.alert("Invalid code", "Enter the 6-digit verification code.");
            resolve(false);
            return;
          }
          const verifyResult = await verifyTwoFactorOtp(currentUser.id, trimmed);
          if (!verifyResult.success) {
            Alert.alert("Verification failed", verifyResult.error || "Invalid code.");
            resolve(false);
            return;
          }
          resolve(true);
        };

        if (Alert.prompt) {
          Alert.prompt(
            "Enable two-factor authentication",
            "Enter the 6-digit code sent to your email.",
            (code) => void submitCode(code),
            "plain-text"
          );
        } else {
          Alert.alert(
            "Verification required",
            "Check your email for a 6-digit code, then verify from Account settings.",
            [{ text: "OK", onPress: () => resolve(false) }]
          );
        }
      });

      if (!verified) return;
    } else {
      triggerHaptic("light");
    }

    await syncSecurity("twoFactorEnabled", enabled);
  };

  return (
    <IgSettingsScreen title="Password and security">
      <IgBodyText>
        Sessions sync from your account. Two-factor requires OTP at next login when enabled.
      </IgBodyText>

      <IgSectionTitle>Login</IgSectionTitle>
      <IgRow label="Change password" onPress={() => router.push("/forgot-password" as any)} />
      <IgToggle
        label="Two-factor authentication"
        hint="Require OTP code at login"
        value={data.twoFactorEnabled}
        onValueChange={(v) => void handleTwoFactorToggle(v)}
      />
      <IgToggle
        label="Biometric unlock"
        hint="Use Face ID / fingerprint to reopen app"
        value={data.biometricEnabled}
        onValueChange={(v) => void handleBiometricToggle(v)}
      />
      <IgToggle
        label="Login alerts"
        value={data.loginAlerts}
        onValueChange={(v) => syncSecurity("loginAlerts", v)}
        last
      />

      <IgSectionTitle>Where you&apos;re logged in</IgSectionTitle>
      {loadingSessions ? (
        <IgBodyText>Loading sessions…</IgBodyText>
      ) : sessions.length === 0 ? (
        <IgBodyText>Sign in to view active sessions.</IgBodyText>
      ) : (
        sessions.map((s, idx) => (
          <IgRow
            key={s.id}
            label={s.device}
            sublabel={`${s.location || s.platform} · ${s.current ? "This device" : new Date(s.lastActive).toLocaleDateString()}`}
            onPress={s.current ? undefined : () => revoke(s)}
            last={idx === sessions.length - 1}
          />
        ))
      )}
      {sessions.some((s) => !s.current) ? (
        <IgRow label="Log out of all other sessions" danger onPress={revokeOthers} last />
      ) : null}
    </IgSettingsScreen>
  );
}
