import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import type { AlignSettings } from "@/constants/reelStudio";

type Props = {
  settings: AlignSettings;
  onChange: (next: AlignSettings) => void;
  onClose: () => void;
  hasGhostClip: boolean;
};

export function AlignToolDrawer({ settings, onChange, onClose, hasGhostClip }: Props) {
  return (
    <View style={styles.drawer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Align</Text>
          <Text style={styles.subtitle}>Match your last clip for seamless transitions</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Lucide name="close-circle" size={26} color="#00f5ff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.toggleRow, settings.enabled && styles.toggleRowActive]}
        onPress={() => onChange({ ...settings, enabled: !settings.enabled })}
      >
        <Lucide name="copy-outline" size={22} color={settings.enabled ? "#00f5ff" : "#fff"} />
        <Text style={styles.toggleLabel}>Show alignment ghost</Text>
        <Lucide name={settings.enabled ? "checkmark-circle" : "ellipse-outline"} size={22} color="#00f5ff" />
      </TouchableOpacity>

      {!hasGhostClip && (
        <Text style={styles.warn}>Record or import a clip first — ghost uses your previous segment.</Text>
      )}

      <Text style={styles.label}>Ghost opacity</Text>
      <View style={styles.row}>
        {[15, 25, 35, 50, 65].map((opacity) => (
          <TouchableOpacity
            key={opacity}
            style={[styles.chip, settings.opacity === opacity && styles.chipActive]}
            onPress={() => onChange({ ...settings, opacity })}
          >
            <Text style={[styles.chipText, settings.opacity === opacity && styles.chipTextActive]}>
              {opacity}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>Instagram-style align helps you match pose between multi-clip reels.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "52%",
    backgroundColor: "#080415",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    zIndex: 999,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 12,
  },
  toggleRowActive: { backgroundColor: "rgba(0,245,255,0.08)", borderWidth: 1, borderColor: "rgba(0,245,255,0.2)" },
  toggleLabel: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  warn: { color: "#ff9f0a", fontSize: 12, marginBottom: 12 },
  label: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 8,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chipActive: { backgroundColor: "#00f5ff" },
  chipText: { color: "#fff", fontWeight: "600" },
  chipTextActive: { color: "#080415" },
  hint: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 16 },
});
