import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";

export interface ReportOption {
  label: string;
  reason: string;
}

export const REPORT_OPTIONS: ReportOption[] = [
  { label: "I just don't like it", reason: "DISLIKE" },
  { label: "Bullying or unwanted contact", reason: "HARASSMENT" },
  { label: "Suicide, self-injury or eating disorders", reason: "SELF_HARM" },
  { label: "Violence, hate or exploitation", reason: "VIOLENCE" },
  { label: "Selling or promoting restricted items", reason: "RESTRICTED_ITEMS" },
  { label: "Nudity or sexual activity", reason: "NUDITY" },
  { label: "Scam, fraud or spam", reason: "SPAM" },
  { label: "False information", reason: "FALSE_INFO" },
  { label: "Intellectual property", reason: "IP_VIOLATION" },
];

interface ReportFlowModalProps {
  visible: boolean;
  onClose: () => void;
  targetProfileId: string;
  postId?: string;
  onSubmitReport: (reason: string, description?: string) => Promise<boolean>;
}

export const ReportFlowModal: React.FC<ReportFlowModalProps> = ({
  visible,
  onClose,
  targetProfileId,
  postId,
  onSubmitReport,
}) => {
  const [loadingReason, setLoadingReason] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectOption = async (option: ReportOption) => {
    setLoadingReason(option.reason);
    const desc = `Reported via full screen Report options menu. Reason: ${option.label}. Target Post ID: ${postId || "N/A"}`;
    const result = await onSubmitReport(option.reason, desc);
    setLoadingReason(null);
    if (result) {
      setSuccess(true);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Lucide name="close" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {!success ? (
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Why are you reporting this post?</Text>
            <Text style={styles.subTitle}>
              Your report is anonymous. If someone is in immediate danger, call the local emergency services - don't wait.
            </Text>

            <View style={styles.optionsList}>
              {REPORT_OPTIONS.map((option, idx) => (
                <View key={option.reason}>
                  <TouchableOpacity
                    style={styles.optionRow}
                    activeOpacity={0.7}
                    onPress={() => handleSelectOption(option)}
                    disabled={loadingReason !== null}
                  >
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {loadingReason === option.reason ? (
                      <ActivityIndicator size="small" color="#fb923c" />
                    ) : (
                      <Lucide name="chevron-forward" size={20} color="#8E8E93" />
                    )}
                  </TouchableOpacity>
                  {idx < REPORT_OPTIONS.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.successContainer}>
            <Lucide name="checkmark-circle-outline" size={80} color="#34c759" />
            <Text style={styles.successTitle}>Thank you for reporting</Text>
            <Text style={styles.successDescription}>
              We use reports like yours to keep AURA clean and secure. Our Trust & Safety team will review this post immediately against our luxury community guidelines.
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090716",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  subTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 15,
  },
  optionsList: {
    backgroundColor: "rgba(255,255,255,0.035)",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  optionLabel: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  successTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  successDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: "#fb923c",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 12,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
