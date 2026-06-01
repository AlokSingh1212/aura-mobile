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
import { useRouter } from "expo-router";
import { useStore } from "../store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const triggerHaptic = useStore((state) => state.triggerHaptic);
  const authLogIn = useStore((state) => state.authLogIn);
  const authSignUp = useStore((state) => state.authSignUp);

  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1); // 1, 2, or 3

  // Step 1: Account credentials
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Social data
  const [dob, setDob] = useState("2000-01-01");
  const [phone, setPhone] = useState("");

  // Step 3: Identity & Gender mapping
  const [gender, setGender] = useState("Prefer Not to Say");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = () => {
    triggerHaptic("medium");
    if (signupStep === 1) {
      if (!username || !email || !password) {
        triggerHaptic("heavy");
        Alert.alert("Input Needed", "Username, Email, and Password are all required to proceed.");
        return;
      }
      if (!email.includes("@")) {
        triggerHaptic("heavy");
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }
      setSignupStep(2);
    } else if (signupStep === 2) {
      if (!dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
        triggerHaptic("heavy");
        Alert.alert("Incorrect Format", "Date of Birth must be in YYYY-MM-DD format (e.g. 1998-10-15).");
        return;
      }
      setSignupStep(3);
    }
  };

  const handleBackStep = () => {
    triggerHaptic("light");
    if (signupStep > 1) {
      setSignupStep(signupStep - 1);
    }
  };

  const handleAuthAction = async () => {
    if (isLogin) {
      if (!username || !password) {
        triggerHaptic("heavy");
        Alert.alert("Input Needed", "Please enter your username or email address and password.");
        return;
      }

      setIsLoading(true);
      triggerHaptic("medium");
      try {
        const res = await authLogIn({ usernameOrEmail: username, password });
        if (res.success) {
          triggerHaptic("success");
          Alert.alert("Welcome Back", "Successfully synchronized your active session node!");
          router.replace("/");
        } else {
          triggerHaptic("heavy");
          Alert.alert("Access Denied", res.error || "Authentication failure.");
        }
      } catch (e: any) {
        triggerHaptic("heavy");
        Alert.alert("Network Converge Failure", e.message || "Failed to contact database gateway.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Step 3 registration trigger
      setIsLoading(true);
      triggerHaptic("medium");
      try {
        const res = await authSignUp({
          username,
          email,
          password,
          dob,
          phone,
          gender
        });
        if (res.success) {
          triggerHaptic("success");
          Alert.alert("Account Minted", "Welcome to the AURAGRAM Social Network! Your personal Maison has been seeded.");
          router.replace("/");
        } else {
          triggerHaptic("heavy");
          Alert.alert("Minting Interrupted", res.error || "Registration failure.");
        }
      } catch (e: any) {
        triggerHaptic("heavy");
        Alert.alert("Network Converge Failure", e.message || "Failed to contact database gateway.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.backgroundGlowLeft} />
      <View style={styles.backgroundGlowRight} />

      <View style={styles.card}>
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>A U R A</Text>
          <Text style={styles.brandSubtitle}>PREMIUM SOCIAL NETWORK</Text>
        </View>

        {/* Step Indicator dots for Signup Wizard */}
        {!isLogin && (
          <View style={styles.stepIndicatorContainer}>
            {[1, 2, 3].map((step) => {
              const isActive = signupStep === step;
              const isCompleted = signupStep > step;
              return (
                <View 
                  key={step} 
                  style={[
                    styles.stepIndicatorDot,
                    isActive && styles.stepIndicatorDotActive,
                    isCompleted && styles.stepIndicatorDotCompleted
                  ]} 
                />
              );
            })}
          </View>
        )}

        <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false}>
          {isLogin ? (
            /* 🔴 LOGIN FORM */
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Lucide name="person-outline" size={20} color="#8e8e8e" style={styles.inputIcon} />
                <TextInput
                  placeholder="Username or Email"
                  placeholderTextColor="#555"
                  value={username}
                  onChangeText={setUsername}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lucide name="lock-closed-outline" size={20} color="#8e8e8e" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Lucide name={showPassword ? "eye" : "eye-off"} size={20} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAuthAction}
                disabled={isLoading}
                style={styles.submitBtn}
              >
                {isLoading ? (
                  <ActivityIndicator color="#080415" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>LOG IN</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* 🟢 MULTI-STEP SIGNUP WIZARD FORM */
            <View style={styles.form}>
              {signupStep === 1 && (
                /* STEP 1: Account basics */
                <View style={styles.wizardStepContainer}>
                  <Text style={styles.stepTitle}>Account Essentials</Text>
                  <Text style={styles.stepSubtitle}>Provide login credentials for your identity node.</Text>
                  
                  <View style={styles.inputContainer}>
                    <Lucide name="person-outline" size={20} color="#8e8e8e" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Username"
                      placeholderTextColor="#555"
                      value={username}
                      onChangeText={setUsername}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Lucide name="mail-outline" size={20} color="#8e8e8e" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Email Address"
                      placeholderTextColor="#555"
                      value={email}
                      onChangeText={setEmail}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Lucide name="lock-closed-outline" size={20} color="#8e8e8e" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#555"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Lucide name={showPassword ? "eye" : "eye-off"} size={20} color="#8e8e8e" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={handleNextStep} style={styles.submitBtn}>
                    <Text style={styles.submitBtnText}>CONTINUE</Text>
                  </TouchableOpacity>
                </View>
              )}

              {signupStep === 2 && (
                /* STEP 2: Social metadata details */
                <View style={styles.wizardStepContainer}>
                  <Text style={styles.stepTitle}>Personal Details</Text>
                  <Text style={styles.stepSubtitle}>AURAGRAM keeps your data secure. These are never shared publicly.</Text>

                  <View style={styles.inputContainer}>
                    <Lucide name="calendar-outline" size={20} color="#8e8e8e" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Date of Birth (YYYY-MM-DD)"
                      placeholderTextColor="#555"
                      value={dob}
                      onChangeText={setDob}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Lucide name="call-outline" size={20} color="#8e8e8e" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Phone Number"
                      placeholderTextColor="#555"
                      value={phone}
                      onChangeText={setPhone}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="phone-pad"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.wizardActionRow}>
                    <TouchableOpacity onPress={handleBackStep} style={styles.backBtn}>
                      <Text style={styles.backBtnText}>BACK</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNextStep} style={[styles.submitBtn, { flex: 1, marginTop: 0 }]}>
                      <Text style={styles.submitBtnText}>NEXT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {signupStep === 3 && (
                /* STEP 3: Identity & Gender selection tags */
                <View style={styles.wizardStepContainer}>
                  <Text style={styles.stepTitle}>Identity & Gender</Text>
                  <Text style={styles.stepSubtitle}>Select a gender category identifier for custom collections.</Text>

                  <View style={styles.genderTagGrid}>
                    {["Male", "Female", "Non-Binary", "Prefer Not to Say"].map((g) => {
                      const isSelected = gender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => { triggerHaptic("light"); setGender(g); }}
                          style={[
                            styles.genderTagItem,
                            isSelected && styles.genderTagItemActive
                          ]}
                        >
                          <Text style={[styles.genderTagText, isSelected && styles.genderTagTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.wizardActionRow}>
                    <TouchableOpacity onPress={handleBackStep} style={styles.backBtn}>
                      <Text style={styles.backBtnText}>BACK</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAuthAction}
                      disabled={isLoading}
                      style={[styles.submitBtn, { flex: 1, marginTop: 0 }]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#080415" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>MINT NODE</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer switch layout */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? "New to AURAGRAM?" : "Already have an account?"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic("light");
              setIsLogin(!isLogin);
              setSignupStep(1); // Reset wizard steps
            }}
          >
            <Text style={styles.footerActionText}>
              {isLogin ? " Sign Up" : " Log In"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundGlowLeft: {
    position: "absolute",
    top: height * 0.1,
    left: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: "#00f5ff",
    opacity: 0.15,
  },
  backgroundGlowRight: {
    position: "absolute",
    bottom: height * 0.1,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: "#b026ff",
    opacity: 0.12,
  },
  card: {
    width: width * 0.88,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 25,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "center",
    maxHeight: height * 0.82,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 8,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#00f5ff",
    letterSpacing: 2,
    marginTop: 6,
    opacity: 0.8,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 25,
    alignItems: "center",
  },
  stepIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  stepIndicatorDotActive: {
    backgroundColor: "#00f5ff",
    width: 14,
    borderRadius: 3,
  },
  stepIndicatorDotCompleted: {
    backgroundColor: "rgba(0, 245, 255, 0.4)",
  },
  form: {
    width: "100%",
  },
  wizardStepContainer: {
    width: "100%",
    alignItems: "center",
  },
  stepTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  stepSubtitle: {
    color: "#8e8e8e",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotText: {
    color: "#8e8e8e",
    fontSize: 12,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  submitBtnText: {
    color: "#080415",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  wizardActionRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginTop: 10,
  },
  backBtn: {
    width: 80,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#8e8e8e",
    fontSize: 12,
    fontWeight: "bold",
  },
  genderTagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  genderTagItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    minWidth: "45%",
    alignItems: "center",
  },
  genderTagItemActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  genderTagText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  genderTagTextActive: {
    color: "#080415",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },
  footerText: {
    color: "#8e8e8e",
    fontSize: 13,
  },
  footerActionText: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
  },
});
