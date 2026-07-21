import { StyleSheet } from "react-native";

export const profilePortalStyles = StyleSheet.create({
  accountsCenterSectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8
},
  accountsCenterCard: {
    backgroundColor: "#0f0b25",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16
},
  accountsCenterProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
},
  accountsCenterIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(0, 245, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
},
  inputFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 4
},
  profileTabCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: "relative",
    overflow: "hidden"
},
  mediaBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999
},
  mediaBusyCard: {
    backgroundColor: "#0b071e",
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
},
  mediaBusyText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600"
},
  editModalContainer: {
    flex: 1,
    backgroundColor: "#080415"
},
  editModalNavBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415"
},
  editModalCancelText: {
    color: "#ffffff",
    fontSize: 15.5
},
  editModalTitle: {
    color: "#ffffff",
    fontSize: 16.5,
    fontWeight: "bold"
},
  editModalDoneText: {
    color: "#00f5ff",
    fontSize: 15.5,
    fontWeight: "bold"
},
  editModalScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    backgroundColor: "#080415"
},
  inputGroup: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 8
},
  inputLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4
},
  inputField: {
    color: "#ffffff",
    fontSize: 14.5,
    paddingVertical: 4
},
});
