import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import type { PhotoTag } from "@/lib/postComposerTypes";

interface MediaPeopleOverlayProps {
  photoTags?: PhotoTag[];
  onTagPress?: (tag: PhotoTag) => void;
  onOverflowPress?: () => void;
  bottom?: number;
  left?: number;
}

/** Photo tags only — shown on media. Not collab, not @mentions. */
export function MediaPeopleOverlay({
  photoTags = [],
  onTagPress,
  onOverflowPress,
  bottom = 14,
  left = 14,
}: MediaPeopleOverlayProps) {
  if (!photoTags.length) return null;

  const visible = photoTags.slice(0, 3);
  const extra = photoTags.length - visible.length;

  return (
    <View style={[styles.wrap, { bottom, left }]} pointerEvents="box-none">
      {visible.map((person, i) => (
        <TouchableOpacity
          key={person.profileId}
          activeOpacity={0.85}
          onPress={() => onTagPress?.(person)}
          disabled={!onTagPress}
          style={[styles.bubble, i > 0 && { marginLeft: -11 }, { zIndex: 10 - i }]}
        >
          {person.logo ? (
            <Image source={{ uri: person.logo }} style={styles.avatar} />
          ) : (
            <Text style={styles.initial}>{person.name[0]?.toUpperCase() || "?"}</Text>
          )}
        </TouchableOpacity>
      ))}
      {extra > 0 ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOverflowPress}
          disabled={!onOverflowPress}
          style={[styles.bubble, styles.bubbleMore, { marginLeft: -11, zIndex: 0 }]}
        >
          <Text style={styles.moreText}>+{extra}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 8,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ff9500",
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bubbleMore: {
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  initial: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  moreText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
