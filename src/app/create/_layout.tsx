import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { ExportStatusBar } from "@/components/create/ExportStatusBar";

export default function CreateLayout() {
  return (
    <View style={styles.root}>
      <ExportStatusBar />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: "#080415" },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080415",
  },
});
