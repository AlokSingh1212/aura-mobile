import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatDrawer } from "@/components/ChatDrawer";
import { useStore } from "@/store/useStore";
import { AuraBottomNav, getAuraBottomNavHeight } from "@/components/shop/AuraBottomNav";

/** Dedicated DMs inbox — full screen, API-backed conversations. */
export default function MessagesScreen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = getAuraBottomNavHeight(insets.bottom);
  const { activeMaisonId, products, currentUser, authHydrated, instaStories, loadStoryRings, loadUserStories } = useStore();
  const [isSeller, setIsSeller] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);

  useEffect(() => {
    if (authHydrated && !currentUser?.id) {
      router.replace("/login" as any);
    }
  }, [authHydrated, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      loadStoryRings(currentUser.id).catch(() => {});
      loadUserStories(currentUser.id).catch(() => {});
    }
  }, [currentUser?.id, loadStoryRings, loadUserStories]);

  if (!authHydrated || !currentUser?.id) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00f5ff" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ChatDrawer
        visible
        onClose={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        bottomBarHeight={bottomNavHeight}
        activeMaisonId={activeMaisonId || ""}
        isSeller={isSeller}
        setIsSeller={setIsSeller}
        products={products}
        activeInstaStories={instaStories}
        initialConversationId={params.conversationId || null}
        onConversationStateChange={(active) => setIsChatActive(active)}
      />
      {!isChatActive && <AuraBottomNav activeTab="inbox" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#05030f" },
  loading: { flex: 1, backgroundColor: "#05030f", alignItems: "center", justifyContent: "center" },
});
