import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";

// Suppress expo-av deprecation warnings
LogBox.ignoreLogs([
  "[expo-av]: Expo AV has been deprecated and will be removed in SDK 54",
  "Video component from `expo-av` is deprecated in favor of `expo-video`"
]);


export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: { backgroundColor: "#080415" }
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="shop" options={{ animation: "none" }} />
        <Stack.Screen name="cart" options={{ animation: "none" }} />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="account" options={{ animation: "none" }} />
        <Stack.Screen name="profile/[username]" options={{ animation: "fade_from_bottom" }} />
        <Stack.Screen name="login" options={{ animation: "fade_from_bottom" }} />
      </Stack>
    </>
  );
}
