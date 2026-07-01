import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initDatabase } from "@/utils/localDb";

import NetInfo from "@react-native-community/netinfo";
import { useStore } from "@/store/useStore";

// Suppress expo-av deprecation warnings
LogBox.ignoreLogs([
  "[expo-av]: Expo AV has been deprecated and will be removed in SDK 54",
  "Video component from `expo-av` is deprecated in favor of `expo-video`"
]);


export default function RootLayout() {
  useEffect(() => {
    initDatabase();

    // Subscribe to network connection state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        useStore.getState().flushPendingActions().catch((err) => {
          console.warn("Failed to flush offline pending actions queue:", err);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: { backgroundColor: "#FFFFFF" }
        }}
      >
        {/* Onboarding Flow */}
        <Stack.Screen name="splash" options={{ animation: "none" }} />
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="otp" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="persona" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="create-profile" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="interests" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="permissions" options={{ animation: "slide_from_right" }} />

        {/* Main App */}
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="shop" options={{ animation: "none" }} />
        <Stack.Screen name="cart" options={{ animation: "none" }} />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="account" options={{ animation: "none" }} />
        <Stack.Screen name="profile/[username]" options={{ animation: "fade_from_bottom" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
