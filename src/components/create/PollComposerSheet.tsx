import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";

export interface ReelPoll {
  question: string;
  options: string[];
}

interface PollComposerSheetProps {
  visible: boolean;
  initial?: ReelPoll | null;
  onClose: () => void;
  onSave: (poll: ReelPoll) => void;
}

export function PollComposerSheet({ visible, initial, onClose, onSave }: PollComposerSheetProps) {
  const [question, setQuestion] = useState(initial?.question || "");
  const [options, setOptions] = useState<string[]>(
    initial?.options?.length ? initial.options : ["Yes", "No"]
  );

  const reset = () => {
    setQuestion(initial?.question || "");
    setOptions(initial?.options?.length ? initial.options : ["Yes", "No"]);
  };

  const addOption = () => {
    if (options.length >= 4) return;
    setOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const applyYesNo = () => setOptions(["Yes", "No"]);

  const canSave = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} hitSlop={12}>
            <Lucide name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add poll</Text>
          <TouchableOpacity
            disabled={!canSave}
            onPress={() => {
              onSave({
                question: question.trim(),
                options: options.map((o) => o.trim()).filter(Boolean),
              });
              onClose();
            }}
            hitSlop={12}
          >
            <Text style={[styles.doneBtn, !canSave && { opacity: 0.35 }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Question</Text>
          <TextInput
            style={styles.input}
            placeholder="Ask a question…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={question}
            onChangeText={setQuestion}
            maxLength={140}
          />

          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickChip} onPress={applyYesNo}>
              <Text style={styles.quickChipText}>Yes / No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickChip} onPress={addOption}>
              <Text style={styles.quickChipText}>+ Custom option</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Options</Text>
          {options.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <View style={styles.optionBadge}>
                <Text style={styles.optionBadgeText}>{i + 1}</Text>
              </View>
              <TextInput
                style={styles.optionInput}
                value={opt}
                onChangeText={(v) => updateOption(i, v)}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor="rgba(255,255,255,0.35)"
                maxLength={30}
              />
              {options.length > 2 ? (
                <TouchableOpacity onPress={() => removeOption(i)} hitSlop={8}>
                  <Lucide name="close-circle" size={22} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <Text style={styles.sectionHead}>Preview</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewQuestion}>{question.trim() || "Your question"}</Text>
            {options.map((opt, i) => (
              <View key={i} style={styles.previewOption}>
                <Text style={styles.previewOptionText}>{opt.trim() || `Option ${i + 1}`}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function formatPollForCaption(poll: ReelPoll): string {
  const lines = [`📊 ${poll.question.trim()}`];
  poll.options.forEach((opt) => lines.push(`• ${opt.trim()}`));
  return lines.join("\n");
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080415" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  doneBtn: { color: "#0095f6", fontSize: 16, fontWeight: "700" },
  scroll: { flex: 1, paddingHorizontal: 16 },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    color: "#fff",
    fontSize: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
  },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  quickChipText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  optionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,149,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionBadgeText: { color: "#0095f6", fontSize: 12, fontWeight: "800" },
  optionInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  sectionHead: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  previewQuestion: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  previewOption: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  previewOptionText: { color: "#fff", fontSize: 15, fontWeight: "600", textAlign: "center" },
});
