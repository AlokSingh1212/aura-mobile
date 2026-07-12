import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { STORY_GRADIENT, THREADS_THEME as T } from "@/constants/threadsTheme";
import { StoryGradientPill } from "@/components/threads/StoryGradientRing";
import { AuraThreadsLogo } from "@/components/threads/AuraThreadsLogo";

type Tab = "forYou" | "following";

type Props = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onBack: () => void;
  onCompose: () => void;
  triggerHaptic: (type: "light" | "medium") => void;
};

export function ThreadsHeader({
  tab,
  onTabChange,
  onBack,
  onCompose,
  triggerHaptic,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            triggerHaptic("medium");
            onBack();
          }}
        >
          <Lucide name="chevron-back" size={24} color={T.text} />
        </TouchableOpacity>

        <View style={styles.logoGradient}>
          <AuraThreadsLogo size={26} color="#d4af37" />
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            triggerHaptic("medium");
            onCompose();
          }}
        >
          <Lucide name="create-outline" size={24} color="#d4af37" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic("light");
            onTabChange("forYou");
          }}
        >
          <StoryGradientPill active={tab === "forYou"}>
            <Text style={[styles.tabText, tab === "forYou" && styles.tabTextActive]}>
              For you
            </Text>
          </StoryGradientPill>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic("light");
            onTabChange("following");
          }}
        >
          <StoryGradientPill active={tab === "following"}>
            <Text style={[styles.tabText, tab === "following" && styles.tabTextActive]}>
              Following
            </Text>
          </StoryGradientPill>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSubtle,
    backgroundColor: T.bg,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    minHeight: 52,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 26,
    includeFontPadding: false,
  },
  composeIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingTop: 4,
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
