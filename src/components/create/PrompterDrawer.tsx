import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import type { PrompterSettings } from "@/constants/reelStudio";

type Props = {
  settings: PrompterSettings;
  onChange: (next: PrompterSettings) => void;
  onClose: () => void;
};

export function PrompterDrawer({ settings, onChange, onClose }: Props) {
  return (
    <View style={styles.drawer}>
      <View style={styles.header}>
        <Text style={styles.title}>Teleprompter</Text>
        <TouchableOpacity onPress={onClose}>
          <Lucide name="close-circle" size={26} color="#00f5ff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Script (editable)</Text>
      <TextInput
        style={styles.scriptInput}
        multiline
        value={settings.text}
        onChangeText={(text) => onChange({ ...settings, text })}
        placeholder="Write what you want to say on camera..."
        placeholderTextColor="#555"
      />

      <Text style={styles.label}>Text size</Text>
      <View style={styles.row}>
        {[14, 17, 20, 24, 28].map((size) => (
          <TouchableOpacity
            key={size}
            style={[styles.chip, settings.fontSize === size && styles.chipActive]}
            onPress={() => onChange({ ...settings, fontSize: size })}
          >
            <Text style={[styles.chipText, settings.fontSize === size && styles.chipTextActive]}>{size}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Scroll speed</Text>
      <View style={styles.row}>
        {[
          { v: 0.5, l: "Slow" },
          { v: 1, l: "Normal" },
          { v: 1.5, l: "Fast" },
          { v: 2, l: "2x" },
        ].map(({ v, l }) => (
          <TouchableOpacity
            key={v}
            style={[styles.chip, settings.scrollSpeed === v && styles.chipActive]}
            onPress={() => onChange({ ...settings, scrollSpeed: v })}
          >
            <Text style={[styles.chipText, settings.scrollSpeed === v && styles.chipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Position</Text>
      <View style={styles.row}>
        {(["top", "center", "bottom"] as const).map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[styles.chip, settings.position === pos && styles.chipActive]}
            onPress={() => onChange({ ...settings, position: pos })}
          >
            <Text style={[styles.chipText, settings.position === pos && styles.chipTextActive]}>
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>Prompter scrolls while you record — not burned into the video.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "68%",
    backgroundColor: "#080415",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    zIndex: 999,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  label: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },
  scriptInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chipActive: { backgroundColor: "#00f5ff" },
  chipText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#080415" },
  hint: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 16, lineHeight: 16 },
});
