import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";

export interface PostMetaRotatorProps {
  location?: string | null;
  audio?: string | null;
  aiLabel?: boolean;
  intervalMs?: number;
  style?: object;
  textStyle?: object;
}

type MetaLine = { key: string; icon: keyof typeof Lucide.glyphMap; text: string; color: string };

export function PostMetaRotator({
  location,
  audio,
  aiLabel,
  intervalMs = 3200,
  style,
  textStyle,
}: PostMetaRotatorProps) {
  const lines = useMemo(() => {
    const list: MetaLine[] = [];
    if (location?.trim()) {
      list.push({
        key: "location",
        icon: "location-outline",
        text: location.trim(),
        color: "rgba(255,255,255,0.72)",
      });
    }
    if (audio?.trim() && audio !== "STORY_ONLY") {
      list.push({
        key: "audio",
        icon: "musical-notes-outline",
        text: audio.trim(),
        color: "rgba(255,255,255,0.72)",
      });
    }
    if (aiLabel) {
      list.push({
        key: "ai",
        icon: "sparkles-outline",
        text: "AI-generated content",
        color: "#4a90d9",
      });
    }
    return list;
  }, [location, audio, aiLabel]);

  const [index, setIndex] = useState(0);
  const opacity = useState(new Animated.Value(1))[0];

  useEffect(() => {
    setIndex(0);
  }, [lines.length, location, audio, aiLabel]);

  useEffect(() => {
    if (lines.length <= 1) return;
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      setIndex((i) => (i + 1) % lines.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [lines.length, intervalMs, opacity]);

  if (!lines.length) return null;

  const line = lines[index % lines.length];

  return (
    <Animated.View style={[styles.row, style, { opacity }]}>
      <Lucide name={line.icon} size={12} color={line.color} />
      <Text style={[styles.text, { color: line.color }, textStyle]} numberOfLines={1}>
        {line.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    maxWidth: "92%",
  },
  text: {
    fontSize: 11.5,
    fontWeight: "500",
    flexShrink: 1,
  },
});
