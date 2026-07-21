import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";

export type CountdownResult = {
  label: string;
  endsAt: string;
  displayText: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: CountdownResult) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function StoryCountdownPicker({ visible, onClose, onSubmit }: Props) {
  const [label, setLabel] = useState("Countdown");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  const handleDone = () => {
    const endsAt = new Date(`${dateStr.trim()}T${timeStr.trim() || "00:00"}`);
    if (Number.isNaN(endsAt.getTime())) {
      return;
    }
    if (endsAt.getTime() <= Date.now()) {
      return;
    }
    onSubmit({
      label: label.trim() || "Countdown",
      endsAt: endsAt.toISOString(),
      displayText: formatRemaining(endsAt.getTime() - Date.now()),
    });
    setLabel("Countdown");
    setDateStr("");
    setTimeStr("");
    onClose();
  };

  const valid =
    dateStr.trim().length >= 8 &&
    !Number.isNaN(new Date(`${dateStr.trim()}T${timeStr.trim() || "00:00"}`).getTime());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Countdown</Text>
            <Text style={styles.hint}>Set when your countdown ends</Text>
            <TextInput
              style={styles.input}
              placeholder="Label (e.g. Launch)"
              placeholderTextColor="#999"
              value={label}
              onChangeText={setLabel}
            />
            <TextInput
              style={styles.input}
              placeholder="Date YYYY-MM-DD"
              placeholderTextColor="#999"
              value={dateStr}
              onChangeText={setDateStr}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Time HH:MM (24h)"
              placeholderTextColor="#999"
              value={timeStr}
              onChangeText={setTimeStr}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.doneBtn, !valid && styles.doneBtnDisabled]}
              onPress={handleDone}
              disabled={!valid}
            >
              <Text style={styles.doneText}>Add countdown</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "70%",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 4 },
  hint: { fontSize: 13, color: "#666", marginBottom: 16 },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111",
    marginBottom: 12,
  },
  doneBtn: {
    backgroundColor: "#0095f6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  doneBtnDisabled: { opacity: 0.45 },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
