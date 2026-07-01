import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

const { height: screenHeight } = Dimensions.get("window");

const SHEET_HEIGHT = screenHeight * 0.75;

export interface LeadGenSheetProps {
  visible: boolean;
  brandName: string;
  brandLogo?: string;
  formTitle: string;
  formDescription: string;
  customQuestion?: string;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    email: string;
    phone: string;
    customAnswer?: string;
  }) => void;
}

export const LeadGenSheet: React.FC<LeadGenSheetProps> = ({
  visible,
  brandName,
  brandLogo,
  formTitle,
  formDescription,
  customQuestion,
  onClose,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");

  const handleSubmit = () => {
    onSubmit({
      fullName,
      email,
      phone,
      customAnswer: customQuestion ? customAnswer : undefined,
    });
    // Reset form state after submission
    setFullName("");
    setEmail("");
    setPhone("");
    setCustomAnswer("");
  };

  const isValid = fullName.trim().length > 0 && email.trim().length > 0;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Dismiss area above the sheet */}
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.sheetContainer}>
            {/* Close Button */}
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Brand Header ──────────────────────────── */}
              <View style={styles.brandHeader}>
                {brandLogo ? (
                  <Image
                    source={{ uri: brandLogo }}
                    style={styles.brandLogo}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.brandLogoFallback}>
                    <Text style={styles.brandLogoChar}>
                      {brandName[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>{brandName}</Text>
                  <View style={styles.sponsoredTag}>
                    <Text style={styles.sponsoredText}>Sponsored</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.formTitle}>{formTitle}</Text>
              <Text style={styles.formDescription}>{formDescription}</Text>

              {/* ── Form Fields ───────────────────────────── */}
              <View style={styles.formSection}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#48484A"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Email *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    placeholderTextColor="#48484A"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Phone (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#48484A"
                    keyboardType="phone-pad"
                    returnKeyType={customQuestion ? "next" : "done"}
                  />
                </View>

                {customQuestion && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{customQuestion}</Text>
                    <TextInput
                      style={[styles.textInput, styles.multilineInput]}
                      value={customAnswer}
                      onChangeText={setCustomAnswer}
                      placeholder="Type your answer..."
                      placeholderTextColor="#48484A"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      returnKeyType="done"
                    />
                  </View>
                )}
              </View>

              {/* ── Submit Button ─────────────────────────── */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !isValid && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={!isValid}
              >
                <Text style={styles.submitBtnText}>SUBMIT</Text>
              </TouchableOpacity>

              {/* ── Privacy Note ──────────────────────────── */}
              <Text style={styles.privacyNote}>
                By submitting this form, you agree to {brandName}'s Privacy
                Policy and allow them to contact you regarding their products
                and services.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  keyboardView: {
    maxHeight: SHEET_HEIGHT,
  },
  sheetContainer: {
    maxHeight: SHEET_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.97)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  headerControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2C2C2E",
  },
  brandLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoChar: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  brandInfo: {
    marginLeft: 12,
    flex: 1,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  sponsoredTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  sponsoredText: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "600",
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 8,
  },
  formDescription: {
    color: "#8E8E93",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  formSection: {
    gap: 16,
    marginBottom: 24,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  textInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#FFFFFF",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    backgroundColor: "#c8a85a",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#111",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  privacyNote: {
    color: "#48484A",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
