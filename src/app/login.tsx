import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useStore } from "../store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

// AURA Onboarding Design Tokens
const C = {
  bg: "#FFFFFF",
  bgSecondary: "#F8F8F8",
  text: "#111111",
  textSecondary: "#666666",
  border: "#EAEAEA",
  accent: "#000000",
  success: "#16A34A",
  error: "#DC2626",
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const authLogIn = useStore((s) => s.authLogIn);
  const authSignUp = useStore((s) => s.authSignUp);

  const [isLogin, setIsLogin] = useState(params.mode !== "signup");
  const [signupStep, setSignupStep] = useState(1);

  // Signup fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Login fields
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Required", "Email and password are required.");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (!agreedToTerms) {
      Alert.alert("Terms Required", "Please agree to the Terms & Privacy Policy.");
      return;
    }

    setIsLoading(true);
    triggerHaptic("medium");
    try {
      // Generate a username from email for now
      const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
      const res = await authSignUp({ username, email, password, phone, gender: "Prefer Not to Say", dob: "2000-01-01" });
      if (res.success) {
        triggerHaptic("success");
        // Navigate to OTP verification
        router.push({ pathname: "/otp", params: { userId: "new", phone: phone || email } } as any);
      } else {
        Alert.alert("Sign Up Failed", res.error || "Could not create your account. Please try again.");
      }
    } catch (e: any) {
      Alert.alert("Connection Error", e.message || "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginId || !loginPassword) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    triggerHaptic("medium");
    try {
      const res = await authLogIn({ usernameOrEmail: loginId, password: loginPassword });
      if (res.success) {
        triggerHaptic("success");
        router.replace("/");
      } else {
        Alert.alert("Login Failed", res.error || "Invalid email or password.");
      }
    } catch (e: any) {
      Alert.alert("Connection Error", e.message || "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => { triggerHaptic("light"); router.back(); }}
      >
        <Lucide name="chevron-back" size={24} color={C.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandMark}>AURA</Text>
            <Text style={styles.heading}>
              {isLogin ? "Welcome back" : "Create your account"}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Log in to continue to your feed"
                : "Join the future of social commerce"}
            </Text>
          </View>

          {isLogin ? (
            /* ───── LOGIN FORM ───── */
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Lucide name="mail-outline" size={20} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email or username"
                  placeholderTextColor="#999"
                  value={loginId}
                  onChangeText={setLoginId}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lucide name="lock-closed-outline" size={20} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Lucide name={showPassword ? "eye" : "eye-off"} size={20} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotLink}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Log In</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ───── SIGNUP FORM ───── */
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Lucide name="mail-outline" size={20} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lucide name="call-outline" size={20} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Phone number (optional)"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lucide name="lock-closed-outline" size={20} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Lucide name={showPassword ? "eye" : "eye-off"} size={20} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => { triggerHaptic("light"); setAgreedToTerms(!agreedToTerms); }}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Lucide name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, (isLoading || !agreedToTerms) && styles.primaryBtnDisabled]}
                onPress={handleSignup}
                disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => Alert.alert("Coming Soon", "Google login will be available soon.")}
              >
                <Lucide name="logo-google" size={20} color={C.text} />
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => Alert.alert("Coming Soon", "Apple login will be available soon.")}
              >
                <Lucide name="logo-apple" size={20} color={C.text} />
                <Text style={styles.socialBtnText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Toggle */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.footerText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic("light");
            setIsLogin(!isLogin);
          }}
        >
          <Text style={styles.footerLink}>
            {isLogin ? " Sign Up" : " Log In"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
    marginBottom: 32,
  },
  brandMark: {
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 6,
    color: C.textSecondary,
    marginBottom: 16,
  },
  heading: {
    fontSize: 32,
    fontWeight: "bold",
    color: C.text,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: C.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 14,
    backgroundColor: C.bgSecondary,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 16,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "500",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: C.accent,
    fontWeight: "600",
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: C.border,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    color: C.textSecondary,
    fontSize: 13,
  },
  socialBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  socialBtnText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerText: {
    color: C.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "bold",
  },
});
