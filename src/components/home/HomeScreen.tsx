import React from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuraBottomNav } from "@/components/shop/AuraBottomNav";
import { HomeFeedShell } from "@/components/home/HomeFeedShell";
import { HomeMediaOverlays } from "@/components/home/HomeMediaOverlays";
import { HomeFeedEngagementModals } from "@/components/home/HomeFeedEngagementModals";
import { HomeAccountModals } from "@/components/home/HomeAccountModals";
import { HomeSuspensionGate } from "@/components/home/HomeSuspensionGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useHomeScreen } from "@/hooks/useHomeScreen";

export function HomeScreen() {
  const { gate, suspension, containerStyle, statusBarStyle, bottomNav, feedShell, mediaOverlays, engagementModals, accountModals } =
    useHomeScreen();

  if (gate === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: "#080415", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (gate === "unauthenticated") {
    return null;
  }

  if (gate === "suspended") {
    return <HomeSuspensionGate triggerHaptic={suspension.triggerHaptic} onLogOut={suspension.authLogOut} />;
  }

  return (
    <ErrorBoundary screenName="home">
      <View style={containerStyle}>
        <StatusBar style={statusBarStyle} />
        <HomeFeedShell {...feedShell} />
        <AuraBottomNav activeTab={bottomNav.activeTab} homeTabHandlers={bottomNav.homeTabHandlers} />
        <HomeMediaOverlays {...mediaOverlays} />
        <HomeFeedEngagementModals {...engagementModals} />
        <HomeAccountModals {...accountModals} />
      </View>
    </ErrorBoundary>
  );
}
