import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { isBiometricLockEnabled } from "@/lib/settingsEnforcement";

export type BiometricCapability = {
  available: boolean;
  enrolled: boolean;
  label: string;
};

export function isBiometricAppLockEnabled(): boolean {
  try {
    return isBiometricLockEnabled();
  } catch {
    return false;
  }
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (Platform.OS === "web") {
    return { available: false, enrolled: false, label: "Biometric" };
  }

  const [hasHardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  let label = "Biometric";
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    label = Platform.OS === "ios" ? "Face ID" : "Face unlock";
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    label = Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    label = "Iris unlock";
  }

  return {
    available: hasHardware,
    enrolled,
    label,
  };
}

export async function verifyBiometricEnrollment(): Promise<{ allowed: boolean; reason?: string }> {
  const cap = await getBiometricCapability();
  if (!cap.available) {
    return { allowed: false, reason: "This device does not support biometric unlock." };
  }
  if (!cap.enrolled) {
    return {
      allowed: false,
      reason: `Set up ${cap.label} in your device settings first.`,
    };
  }
  return { allowed: true };
}

export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  if (Platform.OS === "web") {
    return { success: true };
  }

  const enrollment = await verifyBiometricEnrollment();
  if (!enrollment.allowed) {
    return { success: false, error: enrollment.reason };
  }

  const cap = await getBiometricCapability();

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Unlock AURAGRAM with ${cap.label}`,
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
      fallbackLabel: "Use passcode",
    });

    if (result.success) {
      return { success: true };
    }

    const cancelled =
      result.error === "user_cancel" ||
      result.error === "system_cancel" ||
      result.error === "app_cancel";

    return {
      success: false,
      cancelled,
      error: cancelled ? undefined : result.error || "Authentication failed",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Authentication failed",
    };
  }
}
