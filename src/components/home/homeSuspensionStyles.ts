import { StyleSheet } from "react-native";

export const homeSuspensionStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0a21",
  },
  safe: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  body: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.035)",
    borderRadius: 14,
    padding: 18,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    width: "100%",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#fb923c",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoutBtn: {
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
