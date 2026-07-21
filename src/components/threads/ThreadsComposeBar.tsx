import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { THREADS_THEME as T } from "@/constants/threadsTheme";
import { StoryGradientRing } from "@/components/threads/StoryGradientRing";

type Props = {
  avatarUrl?: string | null;
  username?: string;
  onPress: () => void;
};

export function ThreadsComposeBar({ avatarUrl, username, onPress }: Props) {
  const initial = (username || "Y").charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.bar} activeOpacity={0.85} onPress={onPress}>
      <StoryGradientRing size={36} ringWidth={2}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
      </StoryGradientRing>
      <Text style={styles.placeholder}>What's new?</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSubtle,
    backgroundColor: T.bg,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: T.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  placeholder: {
    flex: 1,
    color: T.textMuted,
    fontSize: 15,
  },
});
