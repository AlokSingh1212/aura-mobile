import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
};

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function StoryLinkInput({ visible, onClose, onSubmit }: Props) {
  const [url, setUrl] = useState("");

  const handleDone = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      onClose();
      return;
    }
    const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    if (!isValidUrl(normalized)) {
      Alert.alert("Invalid link", "Enter a valid http or https URL.");
      return;
    }
    onSubmit(normalized);
    setUrl("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Add link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://…"
            placeholderTextColor="#999"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
          />
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneText}>Add to story</Text>
          </TouchableOpacity>
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
    paddingBottom: 32,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 12 },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111",
    marginBottom: 16,
  },
  doneBtn: {
    backgroundColor: "#0095f6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
