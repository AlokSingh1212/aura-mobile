import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initDatabase } from "@/utils/localDb";
import { useStore } from "@/store/useStore";
import { refreshSettingsEnforcement } from "@/lib/ecosystemSettings";
import { SettingsEnforcementProvider } from "@/context/SettingsEnforcementContext";

// Suppress expo-av deprecation warnings
LogBox.ignoreLogs([
  "[expo-av]: Expo AV has been deprecated and will be removed in SDK 54",
  "Video component from `expo-av` is deprecated in favor of `expo-video`"
]);


export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    refreshSettingsEnforcement().catch((err) => {
      console.warn("Failed to load settings enforcement:", err);
    });
    useStore.getState().restoreAuthSession().catch((err) => {
      console.warn("Failed to restore auth session:", err);
      useStore.setState({ authHydrated: true });
    });

    // Subscribe to network connection state changes (optional — not in all Expo Go builds)
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        const NetInfo = (await import("@react-native-community/netinfo")).default;
        if (cancelled || typeof NetInfo?.addEventListener !== "function") return;
        unsubscribe = NetInfo.addEventListener((state) => {
          if (state.isConnected && state.isInternetReachable !== false) {
            useStore.getState().flushPendingActions().catch((err) => {
              console.warn("Failed to flush offline pending actions queue:", err);
            });
          }
        });
      } catch (err) {
        console.warn("NetInfo unavailable; offline sync on reconnect disabled:", err);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsEnforcementProvider>
        <StatusBar style="light" />
        <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: { backgroundColor: "#080415" }
        }}
      >
        <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="forgot-password" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="otp" options={{ animation: "slide_from_right" }} />

        {/* Main App */}
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="shop" options={{ animation: "none" }} />
        <Stack.Screen name="cart" options={{ animation: "none" }} />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="account" options={{ animation: "none" }} />
        <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="create" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
        <Stack.Screen name="profile/[username]" options={{ animation: "fade_from_bottom" }} />
      </Stack>
      </SettingsEnforcementProvider>
    </GestureHandlerRootView>
  );
}
