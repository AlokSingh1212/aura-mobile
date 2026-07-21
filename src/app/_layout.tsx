import { Stack, Redirect } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StatusBar, View, ActivityIndicator, StyleSheet, InteractionManager } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { initDatabase } from "@/utils/localDb";
import { useStore } from "@/store/useStore";
import { refreshSettingsEnforcement } from "@/lib/ecosystemSettings";
import { refreshI18nLanguage } from "@/lib/i18n";
import { SettingsEnforcementProvider } from "@/context/SettingsEnforcementContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Suppress known third-party deprecation warnings (yellow boxes)
LogBox.ignoreLogs([
  "[expo-av]: Expo AV has been deprecated",
  "Video component from `expo-av` is deprecated",
  "SafeAreaView has been deprecated",
  "expo-notifications",
  "Geo-Detection Sync Failure",
  "validateAuthSession timeout",
  "Background auth validation failed",
  "Cannot set prop 'player'",
  "Cannot use shared object that was already released",
]);


export default function RootLayout() {
  const currentUser = useStore((state) => state.currentUser);
  const authHydrated = useStore((state) => state.authHydrated);
  const syncDeltaPointer = useStore((state) => state.syncDeltaPointer);

  useEffect(() => {
    useStore.getState().restoreAuthSession().catch(() => {
      useStore.setState({ authHydrated: true });
    });

    // Hide native splash immediately — waiting blocks Android draw (logo screen forever).
    void SplashScreen.hideAsync().catch(() => {});

    // Never block launch if auth restore hangs (e.g. broken AsyncStorage read).
    const hydrationTimeout = setTimeout(() => {
      if (!useStore.getState().authHydrated) {
        useStore.setState({ authHydrated: true });
      }
    }, 2500);

    const task = InteractionManager.runAfterInteractions(() => {
      initDatabase();
      refreshSettingsEnforcement().catch(() => {});
      refreshI18nLanguage().catch(() => {});
    });

    // Subscribe to network connection state changes
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        const NetInfo = (await import("@react-native-community/netinfo")).default;
        if (cancelled || typeof NetInfo?.addEventListener !== "function") return;
        unsubscribe = NetInfo.addEventListener((state) => {
          if (state.isConnected && state.isInternetReachable !== false) {
            useStore.getState().flushPendingActions().catch(() => {});
          }
        });
      } catch {}
    })();

    return () => {
      clearTimeout(hydrationTimeout);
      task.cancel();
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Real-time delta sync background interval
  useEffect(() => {
    if (!currentUser?.id) return;
    syncDeltaPointer().catch(() => {});
    const intervalId = setInterval(() => {
      syncDeltaPointer().catch(() => {});
    }, 4000);
    return () => clearInterval(intervalId);
  }, [currentUser?.id, syncDeltaPointer]);

  const onRootLayout = () => {
    void SplashScreen.hideAsync().catch(() => {});
  };

  // ⚡ SPLASH GATE: Show minimal splash while auth is hydrating
  if (!authHydrated) {
    return (
      <View
        style={splashStyles.container}
        onLayout={() => {
          void SplashScreen.hideAsync().catch(() => {});
        }}
      >
        <ExpoStatusBar style="light" />
        {Platform.OS === "android" ? (
          <StatusBar barStyle="light-content" backgroundColor="#080415" translucent={false} />
        ) : null}
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#080415" }} onLayout={onRootLayout}>
      <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: "#080415" }}>
      <SettingsEnforcementProvider>
        <ErrorBoundary screenName="root">
        <ExpoStatusBar style="light" />
        {Platform.OS === "android" ? (
          <StatusBar barStyle="light-content" backgroundColor="#080415" translucent={false} />
        ) : null}
        <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#080415" },
          freezeOnBlur: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="login" options={{ animation: "none" }} />
        <Stack.Screen name="forgot-password" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="otp" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="shop" options={{ animation: "none" }} />
        <Stack.Screen name="cart" options={{ animation: "none" }} />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="account" options={{ animation: "none", freezeOnBlur: false }} />
        <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="create" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
        <Stack.Screen name="profile/[username]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="post/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="reel/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="product/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen
          name="threads/index"
          options={{
            animation: Platform.OS === "android" ? "simple_push" : "slide_from_right",
            contentStyle: { backgroundColor: "#080415" },
            freezeOnBlur: false,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="threads/[id]"
          options={{
            animation: Platform.OS === "android" ? "simple_push" : "slide_from_right",
            contentStyle: { backgroundColor: "#080415" },
            freezeOnBlur: false,
          }}
        />
      </Stack>
      {/* ⚡ Auth redirect: if hydrated + no user → go to login */}
      {!currentUser && <Redirect href="/login" />}
        </ErrorBoundary>
      </SettingsEnforcementProvider>
      </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
  },
});
