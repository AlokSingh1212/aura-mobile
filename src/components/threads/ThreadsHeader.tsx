import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { THREADS_THEME as T } from "@/constants/threadsTheme";

type Tab = "forYou" | "following";

type Props = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onBack: () => void;
  onCompose: () => void;
  triggerHaptic: (type: "light" | "medium") => void;
  username?: string;
};

export function ThreadsHeader({
  tab,
  onTabChange,
  onBack,
  onCompose,
  triggerHaptic,
  username,
}: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => {
          triggerHaptic("medium");
          onBack();
        }}
      >
        <Lucide name="chevron-back" size={24} color={T.text} />
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.logo}>@</Text>
        {username ? <Text style={styles.handle}>@{username}</Text> : null}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === "forYou" && styles.tabActive]}
            onPress={() => {
              triggerHaptic("light");
              onTabChange("forYou");
            }}
          >
            <Text style={[styles.tabText, tab === "forYou" && styles.tabTextActive]}>
              For you
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "following" && styles.tabActive]}
            onPress={() => {
              triggerHaptic("light");
              onTabChange("following");
            }}
          >
            <Text style={[styles.tabText, tab === "following" && styles.tabTextActive]}>
              Following
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => {
          triggerHaptic("medium");
          onCompose();
        }}
      >
        <Lucide name="create-outline" size={22} color={T.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
    backgroundColor: T.bg,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    flex: 1,
  },
  logo: {
    color: T.primary,
    fontSize: 26,
    fontWeight: "300",
    lineHeight: 28,
  },
  handle: {
    color: T.textMuted,
    fontSize: 11,
    marginTop: -2,
    marginBottom: 6,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: T.primaryMuted,
    borderWidth: 1,
    borderColor: T.border,
  },
  tabText: {
    color: T.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: T.primary,
  },
});
