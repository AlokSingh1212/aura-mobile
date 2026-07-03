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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Lucide from "@expo/vector-icons/Ionicons";
import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { useStore } from "@/store/useStore";

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string; devOtp?: string }>();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const currentUser = useStore((s) => s.currentUser);

  const userId = params.userId || currentUser?.id;
  const [code, setCode] = useState(params.devOtp ? String(params.devOtp) : "");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (!userId) {
      Alert.alert("Session expired", "Please sign up again.");
      router.replace("/login");
      return;
    }
    if (code.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    triggerHaptic("medium");
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId, otpCode: code }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        useStore.setState({
          currentUser: currentUser ? { ...currentUser, isVerified: true } : currentUser,
        });
        useStore.getState().syncProfileIdentity();
        router.replace("/");
      } else {
        Alert.alert("Verification failed", data.error || "Invalid code.");
      }
    } catch (e: unknown) {
      Alert.alert("Connection error", e instanceof Error ? e.message : "Could not reach server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) return;
    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devOtp) setCode(String(data.devOtp));
        Alert.alert("Code sent", "Check your email for a new verification code.");
      } else {
        Alert.alert("Could not resend", data.error || "Try again later.");
      }
    } catch {
      Alert.alert("Connection error", "Could not resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSkip = () => {
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Lucide name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code we sent to your email address.
      </Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        placeholder="000000"
        placeholderTextColor="#999"
        maxLength={6}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
        onPress={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Verify & continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={handleResend} disabled={isResending}>
        <Text style={styles.linkText}>{isResending ? "Sending..." : "Resend code"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 24 },
  back: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#666", lineHeight: 22, marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 24,
    color: "#111",
  },
  primaryBtn: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkBtn: { alignItems: "center", paddingVertical: 12 },
  linkText: { color: "#111", fontSize: 15, fontWeight: "500" },
  skipText: { color: "#888", fontSize: 14 },
});
