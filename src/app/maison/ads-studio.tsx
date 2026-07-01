import { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { router } from "expo-router";

/**
 * Legacy Ads Studio — redirects to AURA Business Suite (Phase 4 unified ads).
 */
export default function AdsStudioRedirect() {
  useEffect(() => {
    router.replace("/maison/business-suite");
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D4AF37" />
      <Text style={styles.text}>Opening AURA Business Suite…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  text: {
    color: "#888",
    fontSize: 13,
    letterSpacing: 1,
  },
});
