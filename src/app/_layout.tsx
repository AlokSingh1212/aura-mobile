import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

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
        <Stack.Screen name="login" options={{ animation: "fade_from_bottom" }} />
      </Stack>
    </>
  );
}
