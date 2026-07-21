import { StyleSheet } from "react-native";

export const homeShellStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#080415",
  },
  instaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: "#080415",
  },
  instaLogoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  headerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  feedWrapper: {
    flex: 1,
    backgroundColor: "#080415",
  },
});
