import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");

export const homeActivityStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  dismissTouchable: {
    flex: 1
  },
  panel: {
    backgroundColor: "rgba(13,10,33,0.96)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: 40,
    maxHeight: height * 0.8
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5
  },
  notificationList: {
    paddingHorizontal: 20,
    gap: 12
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 12,
    gap: 12
  },
  cardUnread: {
    borderColor: "rgba(0,245,255,0.15)",
    backgroundColor: "rgba(0,245,255,0.03)"
  },
  avatarWrapper: {
    position: "relative"
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  badgeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#0d0a21",
    alignItems: "center",
    justifyContent: "center",
  },
  groupCountBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#00f5ff",
    borderWidth: 2,
    borderColor: "#0d0a21",
    alignItems: "center",
    justifyContent: "center",
  },
  groupCountBadgeText: {
    color: "#080415",
    fontSize: 9,
    fontWeight: "800",
  },
  contentBlock: {
    flex: 1,
    gap: 4
  },
  messageText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18
  },
  senderUsername: {
    fontWeight: "bold",
    color: "#fff"
  },
  timeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)"
  },
  tag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2
  },
  tagText: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  actionButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  actionButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600"
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 16
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)"
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff"
  },
  emptySubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 18
  },
  backBtn: {
    padding: 4
  },
  headerTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  headerRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
    marginLeft: 4,
    marginTop: -4
  },
  adsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    gap: 12
  },
  adsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,245,255,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  adsTextContainer: {
    flex: 1,
    gap: 2
  },
  adsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff"
  },
  adsSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)"
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  sectionBlock: {
    gap: 8,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 4
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  filterChipActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  filterChipText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#00f5ff",
  },
});
