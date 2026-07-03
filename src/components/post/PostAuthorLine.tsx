import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import type { CollabPartner } from "@/lib/postComposerTypes";

interface PostAuthorLineProps {
  authorName: string;
  authorUsername?: string;
  authorLogo?: string | null;
  collab?: CollabPartner | null;
  nameStyle?: object;
  collabStyle?: object;
}

/** Instagram-style header: primary author + optional collab co-author. */
export function PostAuthorLine({
  authorName,
  authorUsername,
  collab,
  nameStyle,
  collabStyle,
}: PostAuthorLineProps) {
  const showCollab = collab && collab.status !== "declined";

  return (
    <View style={styles.row}>
      <Text style={[styles.name, nameStyle]} numberOfLines={1}>
        {authorUsername || authorName}
      </Text>
      {showCollab ? (
        <>
          <Text style={styles.and}> and </Text>
          <Text style={[styles.collabName, collabStyle]} numberOfLines={1}>
            {collab.username}
          </Text>
        </>
      ) : null}
    </View>
  );
}

interface PostAuthorAvatarsProps {
  authorLogo?: string | null;
  authorInitial: string;
  collab?: CollabPartner | null;
}

export function PostAuthorAvatars({ authorLogo, authorInitial, collab }: PostAuthorAvatarsProps) {
  const showCollab = collab && collab.status !== "declined";
  return (
    <View style={styles.avatarRow}>
      {authorLogo ? (
        <Image source={{ uri: authorLogo }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{authorInitial}</Text>
        </View>
      )}
      {showCollab ? (
        collab.logo ? (
          <Image source={{ uri: collab.logo }} style={[styles.avatar, styles.avatarCollab]} />
        ) : (
          <View style={[styles.avatar, styles.avatarCollab, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{collab.name[0]?.toUpperCase()}</Text>
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  name: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  and: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
  },
  collabName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
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
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
