import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";

type Props = {
  durationMs?: number;
  startMs: number;
  onChange: (ms: number) => void;
  trackTitle?: string;
};

const SEGMENT_STEP_MS = 1000;
const MAX_SEGMENT_MS = 30000;

export function AudioSegmentPicker({ durationMs = 15000, startMs, onChange, trackTitle }: Props) {
  const maxStart = Math.min(MAX_SEGMENT_MS, Math.max(0, durationMs - 3000));
  const bars = Array.from({ length: 24 }, (_, i) => 8 + Math.sin(i * 0.8) * 12 + (i % 3) * 4);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Music segment</Text>
      {trackTitle ? <Text style={styles.track} numberOfLines={1}>{trackTitle}</Text> : null}
      <View style={styles.waveRow}>
        {bars.map((h, i) => {
          const barMs = (i / bars.length) * maxStart;
          const active = barMs >= startMs - 500 && barMs <= startMs + durationMs * 0.3;
          return (
            <View key={i} style={[styles.bar, { height: h }, active && styles.barActive]} />
          );
        })}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onChange(Math.max(0, startMs - SEGMENT_STEP_MS))}
        >
          <Lucide name="play-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.time}>{Math.floor(startMs / 1000)}s start</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onChange(Math.min(maxStart, startMs + SEGMENT_STEP_MS))}
        >
          <Lucide name="play-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    marginTop: 12,
  },
  label: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  track: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 36,
    marginBottom: 10,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  barActive: {
    backgroundColor: "#00f5ff",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  time: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 72,
    textAlign: "center",
  },
});
