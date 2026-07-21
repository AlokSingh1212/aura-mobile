import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import type { AddYoursMeta } from "@/lib/storyTemplateApi";

type Props = {
  addYours: AddYoursMeta;
  onPress: () => void;
};

export function AddYoursStorySticker({ addYours, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.wrap} activeOpacity={0.9} onPress={onPress}>
      <Text style={styles.templateLabel}>Template · {addYours.countLabel} stories</Text>
      <View style={styles.card}>
        <Text style={styles.prompt}>{addYours.promptText}</Text>
        <View style={styles.footer}>
          <Lucide name="chatbubble-ellipses-outline" size={14} color="#fff" />
          <Text style={styles.plusLabel}>+{addYours.countLabel}</Text>
        </View>
        <View style={styles.ctaRow}>
          <Lucide name="camera-outline" size={16} color="#fff" />
          <Text style={styles.cta}>Add yours</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    top: "38%",
    maxWidth: 220,
    zIndex: 12,
  },
  templateLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#E53935",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  prompt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  plusLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cta: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
