import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");

export const homeSwitcherStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  dismissTouchable: {
    flex: 1
  },
  panel: {
    backgroundColor: "#080415",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: 40,
    maxHeight: height * 0.7
  },
  notch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff"
  },
  profileList: {
    paddingHorizontal: 24,
    gap: 12
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 14,
    gap: 12
  },
  profileCardActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.02)"
  },
  profileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  profileTextBlock: {
    flex: 1
  },
  profileNameText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff"
  },
  profileUsernameText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2
  },
  uncheckDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)"
  },
  addProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
    padding: 14
  },
  addProfileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  addProfileBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00f5ff"
  },
  wizardSelectorRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 20
  },
  wizardSelectorCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 6
  },
  wizardSelectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
});
