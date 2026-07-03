import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { REEL_LENGTHS, MAX_REEL_TOTAL_SEC, type ReelLength } from "@/constants/reelStudio";

type Props = {
  selectedLength: ReelLength;
  onSelect: (len: ReelLength) => void;
  clipCount: number;
  onClose: () => void;
};

export function ReelLengthDrawer({ selectedLength, onSelect, clipCount, onClose }: Props) {
  return (
    <View style={styles.drawer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reel length</Text>
          <Text style={styles.subtitle}>Max {MAX_REEL_TOTAL_SEC}s total · {clipCount} clip(s)</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Lucide name="close-circle" size={26} color="#00f5ff" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {REEL_LENGTHS.map((len) => (
          <TouchableOpacity
            key={len}
            style={[styles.lengthCard, selectedLength === len && styles.lengthCardActive]}
            onPress={() => onSelect(len)}
          >
            <Text style={[styles.lengthNum, selectedLength === len && styles.lengthNumActive]}>{len}s</Text>
            <Text style={styles.lengthDesc}>
              {len === 15 ? "Quick hook" : len === 30 ? "Standard" : len === 60 ? "Story" : "Max reel"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Lucide name="information-circle-outline" size={18} color="#00f5ff" />
        <Text style={styles.infoText}>
          Each recording segment uses this max duration. Add multiple clips up to {MAX_REEL_TOTAL_SEC} seconds total — same as Instagram.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#080415",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    zIndex: 999,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  lengthCard: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  lengthCardActive: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderWidth: 1.5,
    borderColor: "#00f5ff",
  },
  lengthNum: { color: "#fff", fontSize: 28, fontWeight: "900" },
  lengthNumActive: { color: "#00f5ff" },
  lengthDesc: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 4 },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    padding: 14,
    backgroundColor: "rgba(0,245,255,0.06)",
    borderRadius: 12,
  },
  infoText: { flex: 1, color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 17 },
});
