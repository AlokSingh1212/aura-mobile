import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import type { RepostOfRef } from "@/lib/postRepost";
import { repostMediaLabel } from "@/lib/postRepost";
import { openProfile } from "@/lib/postNavigation";

interface RepostAttributionProps {
  repostOf: RepostOfRef;
  theme?: "light" | "dark";
  style?: object;
}

/** Shows "Original · @author" under repost header (Instagram-style). */
export function RepostAttribution({ repostOf, theme = "dark", style }: RepostAttributionProps) {
  const isLight = theme === "light";
  const iconColor = isLight ? "#8E8E93" : "rgba(255,255,255,0.55)";
  const textColor = isLight ? "#8E8E93" : "rgba(255,255,255,0.65)";
  const linkColor = isLight ? "#111111" : "#fff";

  return (
    <TouchableOpacity
      style={[styles.row, style]}
      activeOpacity={0.85}
      onPress={() => openProfile(repostOf.authorUsername)}
    >
      <Lucide name="repeat" size={13} color={iconColor} />
      <Text style={[styles.text, { color: textColor }]}>
        Original {repostMediaLabel(repostOf.mediaType).toLowerCase()} ·{" "}
      </Text>
      <Text style={[styles.link, { color: linkColor }]} numberOfLines={1}>
        @{repostOf.authorUsername}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    maxWidth: "100%",
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
  },
  link: {
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
});
