import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";

type ProfileGridTab = "posts" | "reels" | "products" | "collabs";

const EMPTY_COPY: Record<ProfileGridTab, { icon: string; title: string; subtitle: string }> = {
  posts: {
    icon: "camera-outline",
    title: "No posts yet",
    subtitle: "When you share photos, they'll appear here.",
  },
  reels: {
    icon: "film-outline",
    title: "No reels yet",
    subtitle: "When you share reels, they'll appear here.",
  },
  products: {
    icon: "bag-handle-outline",
    title: "No products yet",
    subtitle: "Products from your storefront will show here.",
  },
  collabs: {
    icon: "repeat-outline",
    title: "No collabs yet",
    subtitle: "Affiliate and brand collabs will appear here.",
  },
};

export function ProfileGridEmpty({ tab, isOwnProfile = false }: { tab: ProfileGridTab; isOwnProfile?: boolean }) {
  const copy = EMPTY_COPY[tab];
  const subtitle = isOwnProfile
    ? copy.subtitle
    : copy.subtitle.replace("you ", "they ").replace("your ", "their ");

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Lucide name={copy.icon as any} size={32} color="rgba(255,255,255,0.35)" />
      </View>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
