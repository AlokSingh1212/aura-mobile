import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import type { CollabPartner } from "@/lib/postComposerTypes";

interface PostAuthorLineProps {
  authorName: string;
  authorUsername?: string;
  authorLogo?: string | null;
  collab?: CollabPartner | null;
  collabs?: CollabPartner[];
  nameStyle?: object;
  collabStyle?: object;
  onAuthorPress?: () => void;
  onCollabPress?: () => void;
  /** When >2 people — show summary and open glass picker. */
  showPeoplePicker?: boolean;
  otherPeopleCount?: number;
  onShowPeoplePicker?: () => void;
  theme?: "light" | "dark";
}

/** Instagram-style header: primary author + optional collab co-author(s). */
export function PostAuthorLine({
  authorName,
  authorUsername,
  collab,
  collabs = [],
  nameStyle,
  collabStyle,
  onAuthorPress,
  onCollabPress,
  showPeoplePicker,
  otherPeopleCount = 0,
  onShowPeoplePicker,
  theme = "dark",
}: PostAuthorLineProps) {
  const displayAuthor = authorUsername || authorName;
  const isLight = theme === "light";
  const andColor = isLight ? "#8E8E93" : "rgba(255,255,255,0.65)";
  const linkDecoration = isLight ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.35)";
  const defaultNameColor = isLight ? "#111111" : "#fff";
  const activeCollabs = collabs.length
    ? collabs.filter((c) => c.status === "accepted")
    : collab && collab.status === "accepted"
      ? [collab]
      : [];

  if (showPeoplePicker && otherPeopleCount > 0) {
    const othersLabel = `${otherPeopleCount} ${otherPeopleCount === 1 ? "other" : "others"}`;
    return (
      <Pressable onPress={onShowPeoplePicker} hitSlop={4} style={[styles.row, styles.pickerRow]}>
        <Text
          style={[styles.name, { color: defaultNameColor }, nameStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          <Text
            style={[
              styles.name,
              { color: defaultNameColor },
              nameStyle,
              styles.link,
              { textDecorationColor: linkDecoration },
            ]}
          >
            {displayAuthor}
          </Text>
          <Text style={[styles.and, { color: andColor }]}> and </Text>
          <Text
            style={[
              styles.collabName,
              { color: defaultNameColor },
              collabStyle,
              styles.link,
              { textDecorationColor: linkDecoration },
            ]}
          >
            {othersLabel}
          </Text>
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={onAuthorPress} disabled={!onAuthorPress} hitSlop={4}>
        <Text
          style={[
            styles.name,
            { color: defaultNameColor },
            nameStyle,
            onAuthorPress && styles.link,
            onAuthorPress && { textDecorationColor: linkDecoration },
          ]}
          numberOfLines={1}
        >
          {displayAuthor}
        </Text>
      </Pressable>
      {activeCollabs.length === 1 ? (
        <>
          <Text style={[styles.and, { color: andColor }]}> and </Text>
          <Pressable onPress={onCollabPress} disabled={!onCollabPress} hitSlop={4}>
            <Text
              style={[
                styles.collabName,
                { color: defaultNameColor },
                collabStyle,
                onCollabPress && styles.link,
                onCollabPress && { textDecorationColor: linkDecoration },
              ]}
              numberOfLines={1}
            >
              {activeCollabs[0].username}
            </Text>
          </Pressable>
        </>
      ) : activeCollabs.length >= 2 ? (
        <>
          <Text style={[styles.and, { color: andColor }]}> and </Text>
          <Pressable onPress={onCollabPress} disabled={!onCollabPress} hitSlop={4}>
            <Text
              style={[
                styles.collabName,
                { color: defaultNameColor },
                collabStyle,
                onCollabPress && styles.link,
                onCollabPress && { textDecorationColor: linkDecoration },
              ]}
              numberOfLines={1}
            >
              {activeCollabs[0].username}, {activeCollabs[1].username}
              {activeCollabs.length > 2 ? ` +${activeCollabs.length - 2}` : ""}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

interface PostAuthorAvatarsProps {
  authorLogo?: string | null;
  authorInitial: string;
  collab?: CollabPartner | null;
  collabs?: CollabPartner[];
  extraCount?: number;
  onPress?: () => void;
}

export function PostAuthorAvatars({
  authorLogo,
  authorInitial,
  collab,
  collabs = [],
  extraCount = 0,
  onPress,
}: PostAuthorAvatarsProps) {
  const activeCollabs = collabs.length
    ? collabs.filter((c) => c.status === "accepted")
    : collab && collab.status === "accepted"
      ? [collab]
      : [];
  const visibleCollabs = activeCollabs.slice(0, 2);

  const content = (
    <View style={styles.avatarRow}>
      {authorLogo ? (
        <Image source={{ uri: authorLogo }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{authorInitial}</Text>
        </View>
      )}
      {visibleCollabs.map((c, i) =>
        c.logo ? (
          <Image
            key={c.profileId}
            source={{ uri: c.logo }}
            style={[styles.avatar, styles.avatarCollab, { zIndex: 9 - i }]}
          />
        ) : (
          <View
            key={c.profileId}
            style={[styles.avatar, styles.avatarCollab, styles.avatarFallback, { zIndex: 9 - i }]}
          >
            <Text style={styles.avatarText}>{c.name[0]?.toUpperCase()}</Text>
          </View>
        )
      )}
      {extraCount > 0 ? (
        <View style={[styles.avatar, styles.avatarCollab, styles.avatarMore, { zIndex: 0 }]}>
          <Text style={styles.avatarMoreText}>+{extraCount}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={4}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  pickerRow: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: "700",
    fontSize: 14,
  },
  and: {
    fontSize: 14,
    fontWeight: "400",
  },
  collabName: {
    fontWeight: "700",
    fontSize: 14,
  },
  link: {
    textDecorationLine: "underline",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#080415",
  },
  avatarCollab: {
    marginLeft: -10,
  },
  avatarFallback: {
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMore: {
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarMoreText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
