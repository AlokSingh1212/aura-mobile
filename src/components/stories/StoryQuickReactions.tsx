import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export const STORY_QUICK_REACTIONS = ["❤️", "🔥", "😂", "😮", "👏"] as const;

type Props = {
  storyId: string;
  userId?: string;
  onReact?: (emoji: string) => void;
};

async function postStoryReaction(storyId: string, userId: string, emoji: string) {
  await fetch(`${API_HOST}/api/mobile/stories/interact`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      storyId,
      stickerId: "__quick_reaction__",
      userId,
      action: "reaction",
      emoji,
    }),
  }).catch(() => {});
}

export function StoryQuickReactions({ storyId, userId, onReact }: Props) {
  const [lastSent, setLastSent] = useState<string | null>(null);

  const handlePress = (emoji: string) => {
    if (!userId) return;
    setLastSent(emoji);
    onReact?.(emoji);
    void postStoryReaction(storyId, userId, emoji);
  };

  if (!userId) return null;

  return (
    <View style={styles.bar} pointerEvents="box-none">
      {STORY_QUICK_REACTIONS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          style={[styles.btn, lastSent === emoji && styles.btnActive]}
          onPress={() => handlePress(emoji)}
          activeOpacity={0.75}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  btnActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
    transform: [{ scale: 1.08 }],
  },
  emoji: {
    fontSize: 24,
  },
});
