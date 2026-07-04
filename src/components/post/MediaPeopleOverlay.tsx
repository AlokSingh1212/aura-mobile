import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import type { PhotoTag } from "@/lib/postComposerTypes";

interface MediaPeopleOverlayProps {
  photoTags?: PhotoTag[];
  onTagPress?: (tag: PhotoTag) => void;
  onOverflowPress?: () => void;
  /** Legacy corner stack when tags have no x/y positions */
  bottom?: number;
  left?: number;
}

function hasPositions(tags: PhotoTag[]): boolean {
  return tags.some((t) => typeof t.x === "number" && typeof t.y === "number");
}

/** Photo tags on media — positioned pills (IG) or legacy avatar stack. */
export function MediaPeopleOverlay({
  photoTags = [],
  onTagPress,
  onOverflowPress,
  bottom = 14,
  left = 14,
}: MediaPeopleOverlayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!photoTags.length) return null;

  if (hasPositions(photoTags)) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {photoTags.map((tag) => {
          if (typeof tag.x !== "number" || typeof tag.y !== "number") return null;
          const isOpen = expandedId === tag.profileId;
          return (
            <View
              key={tag.profileId}
              style={[
                styles.positionedAnchor,
                {
                  left: `${tag.x}%`,
                  top: `${tag.y}%`,
                },
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (isOpen) {
                    onTagPress?.(tag);
                  } else {
                    setExpandedId(tag.profileId);
                  }
                }}
                style={styles.positionedHit}
              >
                {isOpen ? (
                  <View style={styles.namePill}>
                    {tag.logo ? (
                      <Image source={{ uri: tag.logo }} style={styles.pillAvatar} />
                    ) : (
                      <View style={styles.pillAvatarFallback}>
                        <Text style={styles.pillInitial}>{tag.name[0]?.toUpperCase() || "?"}</Text>
                      </View>
                    )}
                    <Text style={styles.namePillText} numberOfLines={1}>
                      {tag.username}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.faceMarker}>
                    <View style={styles.faceMarkerDot} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
        {expandedId ? (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setExpandedId(null)}
          />
        ) : null}
      </View>
    );
  }

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
  positionedAnchor: {
    position: "absolute",
    zIndex: 12,
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  positionedHit: {
    alignItems: "flex-start",
  },
  faceMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  faceMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  namePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    maxWidth: 160,
  },
  pillAvatar: { width: 20, height: 20, borderRadius: 10 },
  pillAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillInitial: { color: "#fff", fontSize: 10, fontWeight: "700" },
  namePillText: { color: "#fff", fontSize: 12, fontWeight: "700", flexShrink: 1 },
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
