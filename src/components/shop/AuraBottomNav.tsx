import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";

export type TabKey = "home" | "reels" | "inbox" | "products" | "profile";

export type HomeTabHandlers = {
  onHome?: () => void;
  onReels?: () => void;
  onInbox?: () => void;
};

type Props = {
  activeTab?: TabKey;
  /** When the home screen is mounted, switch tabs in-place instead of pushing routes. */
  homeTabHandlers?: HomeTabHandlers;
};

const BAR_CONTENT_HEIGHT = 62;

export function getAuraBottomNavHeight(insetsBottom: number) {
  return BAR_CONTENT_HEIGHT + insetsBottom;
}

export function AuraBottomNav({ activeTab, homeTabHandlers }: Props) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { triggerHaptic, activeProfile, currentUser } = useStore();

  const isHomeRoute =
    pathname === "/" || pathname === "/index" || pathname === "";

  const profileLogo =
    activeProfile?.avatar ||
    activeProfile?.profileImage ||
    activeProfile?.logo ||
    currentUser?.avatar;
  const profileInitial = (activeProfile?.username || activeProfile?.name || "A")
    .charAt(0)
    .toUpperCase();

  const iconColor = (key: TabKey) =>
    activeTab === key ? "#00f5ff" : "rgba(255,255,255,0.45)";
  const labelColor = (key: TabKey) =>
    activeTab === key ? "#00f5ff" : "rgba(255,255,255,0.35)";

  const goHome = () => {
    triggerHaptic("light");
    if (isHomeRoute && homeTabHandlers?.onHome) {
      homeTabHandlers.onHome();
      return;
    }
    router.replace("/");
  };

  const goReels = () => {
    triggerHaptic("light");
    if (isHomeRoute && homeTabHandlers?.onReels) {
      homeTabHandlers.onReels();
      return;
    }
    router.replace({ pathname: "/", params: { activeTab: "reels" } } as any);
  };

  const goInbox = () => {
    triggerHaptic("light");
    if (isHomeRoute && homeTabHandlers?.onInbox) {
      homeTabHandlers.onInbox();
      return;
    }
    router.replace("/messages" as any);
  };

  const goProducts = () => {
    triggerHaptic("light");
    if (pathname.startsWith("/shop")) return;
    router.replace("/shop");
  };

  const goProfile = () => {
    triggerHaptic("light");
    if (pathname === "/account") return;
    router.replace("/account");
  };

  const barHeight = getAuraBottomNavHeight(insets.bottom);

  return (
    <View
      style={[styles.bar, { paddingBottom: insets.bottom, height: barHeight }]}
    >
      <TouchableOpacity style={styles.btn} onPress={goHome} accessibilityRole="button" accessibilityLabel="Home">
        <Lucide name="home-outline" size={26} color={iconColor("home")} />
        <Text style={[styles.label, { color: labelColor("home") }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={goReels} accessibilityRole="button" accessibilityLabel="Reels">
        <Lucide name="film-outline" size={26} color={iconColor("reels")} />
        <Text style={[styles.label, { color: labelColor("reels") }]}>Reel</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={goInbox} accessibilityRole="button" accessibilityLabel="Inbox">
        <Lucide name="paper-plane-outline" size={26} color={iconColor("inbox")} />
        <Text style={[styles.label, { color: labelColor("inbox") }]}>Inbox</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={goProducts} accessibilityRole="button" accessibilityLabel="Products">
        <Lucide name="bag-handle-outline" size={26} color={iconColor("products")} />
        <Text style={[styles.label, { color: labelColor("products") }]}>Products</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={goProfile} accessibilityRole="button" accessibilityLabel="Profile">
        <View
          style={[
            styles.profileCircle,
            activeTab === "profile" && { borderColor: "#00f5ff" },
          ]}
        >
          {profileLogo ? (
            <Image source={{ uri: profileLogo }} style={styles.profileImg} />
          ) : (
            <Text style={styles.profileInitial}>{profileInitial}</Text>
          )}
        </View>
        <Text style={[styles.label, { color: labelColor("profile") }]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "rgba(5,3,15,0.98)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 6,
    zIndex: 9999,
    ...Platform.select({
      android: { elevation: 24 },
      ios: {},
    }),
  },
  btn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
    paddingTop: 8,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  profileCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  profileImg: {
    width: 26,
    height: 26,
  },
  profileInitial: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
});
