import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Lucide from "@expo/vector-icons/Ionicons";
import { API_BASE } from "@/constants/api";
import { useStore } from "@/store/useStore";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const fetchProfiles = useStore((s) => s.fetchProfiles);
  const syncProfileIdentity = useStore((s) => s.syncProfileIdentity);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      Alert.alert("Invalid email", "Enter the email you used to sign up.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        if (data.devOtp) setOtpCode(String(data.devOtp));
        setEmailSent(data.emailSent ?? null);
        setEmailError(data.emailError || null);
        setStep(2);
        if (data.devOtp) {
          Alert.alert(
            "Your verification code",
            data.emailSent
              ? "We also sent this to your email."
              : `Email delivery is not set up yet.\n\nYour code: ${data.devOtp}\n\nEnter it below with your new password.`
          );
        } else {
          Alert.alert("Code sent", "Check your email for the 6-digit code.");
        }
      } else {
        Alert.alert("Could not send code", data.error || "Try again later.");
      }
    } catch (e: unknown) {
      Alert.alert("Connection error", e instanceof Error ? e.message : "Could not reach server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (otpCode.length !== 6 || newPassword.length < 6) {
      Alert.alert("Required", "Enter the 6-digit code and a password (6+ characters).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otpCode,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        triggerHaptic("success");
        useStore.setState({
          currentUser: data.user,
          authToken: data.token,
          activeMaisonId: data.user.maisonId,
        });
        await fetchProfiles(data.user.id);
        syncProfileIdentity();
        Alert.alert("Password updated", "You are signed in.");
        router.replace("/");
      } else {
        Alert.alert("Reset failed", data.error || "Invalid code or password.");
      }
    } catch (e: unknown) {
      Alert.alert("Connection error", e instanceof Error ? e.message : "Could not reach server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Lucide name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.subtitle}>
        {step === 1
          ? "We'll email you a 6-digit code to set a new password."
          : "Enter the code and choose a new password."}
      </Text>

      {step === 1 ? (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSendCode} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {emailSent === false && otpCode ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your verification code</Text>
              <Text style={styles.codeValue}>{otpCode}</Text>
              <Text style={styles.codeHint}>
                Email is not configured yet — use this code below.
              </Text>
            </View>
          ) : null}
          <TextInput
            style={styles.input}
            value={otpCode}
            onChangeText={(t) => setOtpCode(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={6}
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password (6+ characters)"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update password</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSendCode} disabled={isLoading}>
            <Text style={styles.linkText}>Resend code</Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 24 },
  back: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#666", lineHeight: 22, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: "#111",
  },
  primaryBtn: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkText: { color: "#111", textAlign: "center", paddingVertical: 12, fontWeight: "500" },
  codeBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  codeLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  codeValue: { fontSize: 32, fontWeight: "700", letterSpacing: 6, color: "#111", textAlign: "center" },
  codeHint: { fontSize: 12, color: "#888", marginTop: 8, textAlign: "center" },
});
