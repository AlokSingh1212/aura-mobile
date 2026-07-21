import { useState, useCallback } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { updateSettingsSection } from "@/lib/ecosystemSettings";
import {
  authenticateWithBiometrics,
  verifyBiometricEnrollment,
} from "@/lib/biometricLock";
import { sendTwoFactorOtp, verifyTwoFactorOtp } from "@/lib/twoFactorApi";
import type { ProfileCatalogProduct } from "@/lib/profileApi";

type UseProfileSettingsOptions = {
  currentUser: any;
  updateProfile: (payload: any) => Promise<any>;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  authLogOut: () => void;
  username: string;
  profileName: string;
  category: string;
  bioText: string;
  websiteLink: string;
  tags: string[];
  activeMaisonId: string;
  displayProducts: ProfileCatalogProduct[];
};

export function useProfileSettings({
  currentUser,
  updateProfile,
  triggerHaptic,
  authLogOut,
  username,
  profileName,
  category,
  bioText,
  websiteLink,
  tags,
  activeMaisonId,
  displayProducts,
}: UseProfileSettingsOptions) {
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [personalDob, setPersonalDob] = useState("2000-01-01");
  const [personalGender, setPersonalGender] = useState("Prefer Not to Say");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showAccountsCenter, setShowAccountsCenter] = useState(false);
  const [biometricEnabledState, setBiometricEnabled] = useState(true);
  const [twoFactorEnabledState, setTwoFactorEnabled] = useState(false);
  const [regionLockEnabledState, setRegionLockEnabled] = useState(false);
  const [alertsEnabledState, setAlertsEnabled] = useState(true);
  const [fediverseSharingState, setFediverseSharing] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: "s1", device: "iPhone 17 Pro", location: "Bengaluru, India", active: true, icon: "smartphone" },
    { id: "s2", device: "Mac Studio (Atelier)", location: "Bengaluru, India", active: false, icon: "desktop" },
    { id: "s3", device: "iPad Pro", location: "Mumbai, India", active: false, icon: "tablet-portrait" },
  ]);

  const syncFromCurrentUser = useCallback((user: NonNullable<typeof currentUser>) => {
    setPersonalDob(user.dob || "2000-01-01");
    setPersonalGender(user.gender || "Prefer Not to Say");
    setPersonalEmail(user.email || "");
    setPersonalPhone(user.phone || "");
    setIsVerifiedUser(user.isVerified || false);
    setBiometricEnabled(user.biometricEnabled ?? true);
    setTwoFactorEnabled(user.twoFactorEnabled ?? false);
    setRegionLockEnabled(user.regionLockEnabled ?? false);
    setAlertsEnabled(user.alertsEnabled ?? true);
    setFediverseSharing(user.fediverseSharing ?? false);
  }, []);

  const handleSavePersonalDetails = async () => {
    if (!personalDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      triggerHaptic("heavy");
      Alert.alert("Incorrect Format", "Date of Birth must be in YYYY-MM-DD format.");
      return;
    }

    setIsUpdating(true);
    triggerHaptic("medium");

    try {
      const res = await updateProfile({
        userId: currentUser?.id,
        dob: personalDob,
        gender: personalGender,
        phone: personalPhone,
        email: personalEmail,
      });

      if (res.success) {
        triggerHaptic("success");
        Alert.alert("Details Synchronized", "Your personal details have been safely registered inside Neon PostgreSQL.");
        setShowPersonalDetails(false);
      } else {
        triggerHaptic("heavy");
        Alert.alert("Synchronization Interrupted", res.error || "Failed to update profile.");
      }
    } catch (e: any) {
      triggerHaptic("heavy");
      Alert.alert("Connection Failure", e.message || "Failed to sync updates.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBiometric = async () => {
    const nextVal = !biometricEnabledState;
    if (nextVal) {
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
    setBiometricEnabled(nextVal);
    await updateSettingsSection("security", { biometricEnabled: nextVal }).catch(() => {});
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, biometricEnabled: nextVal });
      if (!res.success) {
        setBiometricEnabled(!nextVal);
        await updateSettingsSection("security", { biometricEnabled: !nextVal }).catch(() => {});
        Alert.alert("Sync Failure", res.error || "Could not save biometric preference.");
      }
    }
  };

  const handleToggleTwoFactor = async () => {
    const nextVal = !twoFactorEnabledState;
    if (nextVal && currentUser) {
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

        if (Platform.OS === "ios" && Alert.prompt) {
          Alert.prompt(
            "Enable Sovereign 2FA",
            "Enter the 6-digit code sent to your email.",
            (code) => void submitCode(code),
            "plain-text"
          );
        } else if (Alert.prompt) {
          Alert.prompt(
            "Enable Sovereign 2FA",
            "Enter the 6-digit code sent to your email.",
            (code) => void submitCode(code),
            "plain-text"
          );
        } else {
          Alert.alert(
            "Verification required",
            "Check your email for a 6-digit code, then verify from Account settings.",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              {
                text: "Open verify",
                onPress: () => {
                  router.push({ pathname: "/otp", params: { userId: currentUser.id } } as any);
                  resolve(false);
                },
              },
            ]
          );
        }
      });

      if (!verified) return;
    } else {
      triggerHaptic("light");
    }

    setTwoFactorEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, twoFactorEnabled: nextVal });
      if (!res.success) {
        setTwoFactorEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save 2FA preference.");
      }
    }
  };

  const handleToggleRegionLock = async () => {
    const nextVal = !regionLockEnabledState;
    triggerHaptic("light");
    setRegionLockEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, regionLockEnabled: nextVal });
      if (!res.success) {
        setRegionLockEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save node lock preference.");
      }
    }
  };

  const handleToggleAlerts = async () => {
    const nextVal = !alertsEnabledState;
    triggerHaptic("light");
    setAlertsEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, alertsEnabled: nextVal });
      if (!res.success) {
        setAlertsEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save alert preference.");
      }
    }
  };

  const handleToggleFediverse = async () => {
    const nextVal = !fediverseSharingState;
    triggerHaptic("light");
    setFediverseSharing(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, fediverseSharing: nextVal });
      if (!res.success) {
        setFediverseSharing(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save Fediverse preference.");
      }
    }
  };

  const handleDownloadInformation = async () => {
    triggerHaptic("success");
    try {
      const dataBackup = {
        identityNode: {
          username,
          displayName: profileName,
          category,
          bio: bioText,
          website: websiteLink,
          tags,
          clerkEmail: username === "aloksingh" ? "aloksingh@aisastra.com" : "maison-director@aura.luxury",
          auraScore: 9.9,
          nodeId: activeMaisonId.toUpperCase().slice(-6),
        },
        securityProtocol: {
          biometricAccess: biometricEnabledState ? "ENABLED" : "DISABLED",
          sovereign2FA: twoFactorEnabledState ? "ENABLED" : "DISABLED",
          geographicNodeLock: regionLockEnabledState ? "ENABLED" : "DISABLED",
          sessionAlerts: alertsEnabledState ? "ENABLED" : "DISABLED",
          fediverseBridging: fediverseSharingState ? "ENABLED (ActivityPub)" : "DISABLED",
        },
        catalogLedger: displayProducts.map((p) => ({
          artifactId: p.id,
          sovereignId: (p as any).sovereignId || `sha256_${p.id}`,
          title: p.title,
          retailPrice: p.price,
          vibeProfile: p.vibe,
          classification: (p as any).type || "Fashion",
          arMetadata: (p as any).arMetadata || {},
        })),
      };

      const backupString = JSON.stringify(dataBackup, null, 2);
      await Clipboard.setStringAsync(backupString);
      Alert.alert(
        "Sovereign Archive Exported",
        "Your unified account data, security protocols, and live catalog ledgers have been packed and copied to your native clipboard!\n\nYou can now paste and save this JSON archive anywhere."
      );
    } catch (e) {
      console.warn("Failed to generate data backup.", e);
      Alert.alert("Export Refused", "Failed to package account specifications.");
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    triggerHaptic("heavy");
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    Alert.alert(
      "Session Terminated",
      "OAuth credentials revoked. The target device has been signed out of your AURA identity node."
    );
  };

  const performDeleteAccount = async (confirmEmail: string) => {
    const userId = currentUser?.id;
    if (!userId) {
      Alert.alert("Error", "Sign in required to delete account.");
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/api/mobile/auth/delete-account`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId, confirmEmail: confirmEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        authLogOut();
        Alert.alert("Account Deleted", "Your account has been permanently removed.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
      } else {
        Alert.alert("Deletion Failed", data.error || "Could not delete account.");
      }
    } catch {
      Alert.alert("Network Error", "Could not reach the server.");
    }
  };

  const handleDeactivateMaison = () => {
    triggerHaptic("heavy");
    Alert.alert(
      "Account & Node Management",
      `Manage Maison '${profileName}' or permanently delete your AURA account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend Node",
          style: "destructive",
          onPress: () => {
            triggerHaptic("success");
            Alert.alert(
              "Identity Suspended",
              "Maison state suspended. Re-activate anytime from settings."
            );
          },
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                "Confirm Account Deletion",
                "Type your email to permanently delete your account.",
                (confirmEmail) => {
                  if (confirmEmail?.trim()) performDeleteAccount(confirmEmail);
                },
                "plain-text",
                currentUser?.email || ""
              );
            } else {
              Alert.alert(
                "Confirm Account Deletion",
                `Your account (${currentUser?.email || "signed-in user"}) will be permanently deleted.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Permanently",
                    style: "destructive",
                    onPress: () => {
                      if (currentUser?.email) performDeleteAccount(currentUser.email);
                    },
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const handleRequestVerification = async () => {
    if (isVerifiedUser) {
      Alert.alert("Verified", "Your email is already verified.");
      return;
    }
    triggerHaptic("medium");
    Alert.alert(
      "Email verification required",
      "Complete OTP verification from signup, or resend a code from Account settings after signing in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go to verify",
          onPress: () => {
            router.push({
              pathname: "/otp",
              params: { userId: currentUser?.id || "" },
            } as any);
          },
        },
      ]
    );
  };

  return {
    showPersonalDetails,
    setShowPersonalDetails,
    personalDob,
    setPersonalDob,
    personalGender,
    setPersonalGender,
    personalEmail,
    setPersonalEmail,
    personalPhone,
    setPersonalPhone,
    isVerifiedUser,
    setIsVerifiedUser,
    isUpdating,
    showAccountsCenter,
    setShowAccountsCenter,
    biometricEnabled: biometricEnabledState,
    setBiometricEnabled,
    twoFactorEnabled: twoFactorEnabledState,
    setTwoFactorEnabled,
    regionLockEnabled: regionLockEnabledState,
    setRegionLockEnabled,
    alertsEnabled: alertsEnabledState,
    setAlertsEnabled,
    fediverseSharing: fediverseSharingState,
    setFediverseSharing,
    activeSessions,
    setActiveSessions,
    syncFromCurrentUser,
    handleSavePersonalDetails,
    handleToggleBiometric,
    handleToggleTwoFactor,
    handleToggleRegionLock,
    handleToggleAlerts,
    handleToggleFediverse,
    handleDownloadInformation,
    handleRevokeSession,
    handleDeactivateMaison,
    handleRequestVerification,
  };
}
