import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");

export const homeAiAssistantStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  dismissTouchable: {
    flex: 1,
  },
  panel: {
    backgroundColor: "rgba(13,10,33,0.98)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    maxHeight: height * 0.88,
    minHeight: height * 0.62,
  },
  notch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,245,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12.5,
    marginTop: 2,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "88%",
  },
  msgRowUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  msgRowAi: {
    alignSelf: "flex-start",
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,245,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "100%",
  },
  msgBubbleUser: {
    backgroundColor: "#fff",
    borderBottomRightRadius: 4,
  },
  msgBubbleAi: {
    backgroundColor: "#1d173e",
    borderBottomLeftRadius: 4,
  },
  msgTextUser: {
    color: "#000",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  msgTextAi: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  productCard: {
    marginTop: 10,
    backgroundColor: "#120d2c",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.15)",
  },
  productCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#222",
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  productPrice: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  productActions: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  productActionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  productActionText: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "700",
  },
  productActionDivider: {
    width: 0.5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#120d2c",
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.12)",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#00f5ff",
  },
  sendBtnDisabled: {
    opacity: 0.35,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sendBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
});
