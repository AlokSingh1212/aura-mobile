import React from "react";
import { Platform, StatusBar, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { THREADS_THEME as T } from "@/constants/threadsTheme";

export function useThreadsInsets() {
  const insets = useSafeAreaInsets();
  const statusBar =
    Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
  return {
    top: Math.max(insets.top, statusBar, Platform.OS === "android" ? 8 : 0),
    bottom: Math.max(insets.bottom, Platform.OS === "android" ? 12 : 8),
    left: insets.left,
    right: insets.right,
  };
}

type ShellProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ThreadsScreenShell({ children, style }: ShellProps) {
  return (
    <View style={[styles.root, style]} collapsable={false}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
});
