import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";

export interface MediaPerson {
  profileId: string;
  username: string;
  name: string;
  logo?: string | null;
  kind?: "tag" | "collab";
}

interface MediaPeopleOverlayProps {
  tags?: MediaPerson[];
  collabs?: MediaPerson[];
  onPress?: () => void;
  bottom?: number;
  left?: number;
}

export function MediaPeopleOverlay({
  tags = [],
  collabs = [],
  onPress,
  bottom = 14,
  left = 14,
}: MediaPeopleOverlayProps) {
  const people: MediaPerson[] = [
    ...tags.map((p) => ({ ...p, kind: "tag" as const })),
    ...collabs.map((p) => ({ ...p, kind: "collab" as const })),
  ];

  if (!people.length) return null;

  const visible = people.slice(0, 3);
  const extra = people.length - visible.length;

  const content = (
    <View style={[styles.wrap, { bottom, left }]}>
      {visible.map((person, i) => (
        <View
          key={`${person.kind}_${person.profileId}`}
          style={[
            styles.bubble,
            person.kind === "collab" ? styles.bubbleCollab : styles.bubbleTag,
            i > 0 && { marginLeft: -11 },
            { zIndex: 10 - i },
          ]}
        >
          {person.logo ? (
            <Image source={{ uri: person.logo }} style={styles.avatar} />
          ) : (
            <Text style={styles.initial}>{person.name[0]?.toUpperCase() || "?"}</Text>
          )}
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.bubble, styles.bubbleMore, { marginLeft: -11, zIndex: 0 }]}>
          <Text style={styles.moreText}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bubbleTag: {
    borderColor: "#ff9500",
  },
  bubbleCollab: {
    borderColor: "#00f5ff",
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
