import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";

export type ChatThreadOptionsSheetProps = {
  visible: boolean;
  thread: any;
  onClose: () => void;
  triggerHaptic: (style: any) => void;
  onToggleUnread: (thread: any) => void;
  onMoveCategory: (thread: any) => void;
  onAddLabel: (thread: any) => void;
  onTogglePin: (thread: any) => void;
  onToggleMute: (thread: any) => void;
  onDeleteThread: (thread: any) => void;
  isPinned: boolean;
  isMuted: boolean;
};

export function ChatThreadOptionsSheet({
  visible,
  thread,
  onClose,
  triggerHaptic,
  onToggleUnread,
  onMoveCategory,
  onAddLabel,
  onTogglePin,
  onToggleMute,
  onDeleteThread,
  isPinned,
  isMuted,
}: ChatThreadOptionsSheetProps) {
  if (!visible || !thread) return null;

  const currentCategory = thread.category || "Primary";
  const moveLabel = currentCategory === "Primary" ? "Move to General" : "Move to Primary";
  const moveIcon = currentCategory === "Primary" ? "folder-open-outline" : "folder-outline";

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <TouchableOpacity
        style={styles.labelSheetBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.labelSheetContent, localStyles.sheetContent]}>
          <View style={styles.labelSheetHandle} />

          <View style={localStyles.header}>
            <Text style={localStyles.title}>@{thread.username || thread.name.toLowerCase().replace(/\s+/g, "")}</Text>
          </View>

          <View style={localStyles.optionsList}>
            {/* Mark as unread */}
            <TouchableOpacity
              style={localStyles.optionRow}
              onPress={() => {
                triggerHaptic("light");
                onToggleUnread(thread);
                onClose();
              }}
            >
              <Lucide name={thread.unread ? "mail-open-outline" : "mail-unread-outline"} size={22} color="#fff" />
              <Text style={localStyles.optionText}>
                {thread.unread ? "Mark as read" : "Mark as unread"}
              </Text>
            </TouchableOpacity>

            {/* Move to General / Primary */}
            <TouchableOpacity
              style={localStyles.optionRow}
              onPress={() => {
                triggerHaptic("light");
                onMoveCategory(thread);
                onClose();
              }}
            >
              <Lucide name={moveIcon as any} size={22} color="#fff" />
              <Text style={localStyles.optionText}>{moveLabel}</Text>
            </TouchableOpacity>

            {/* Add label */}
            <TouchableOpacity
              style={localStyles.optionRow}
              onPress={() => {
                triggerHaptic("light");
                onAddLabel(thread);
                onClose();
              }}
            >
              <Lucide name="pricetag-outline" size={22} color="#fff" />
              <Text style={localStyles.optionText}>Add label</Text>
            </TouchableOpacity>

            {/* Pin */}
            <TouchableOpacity
              style={localStyles.optionRow}
              onPress={() => {
                triggerHaptic("light");
                onTogglePin(thread);
                onClose();
              }}
            >
              <Lucide name={isPinned ? "pin" : "pin-outline"} size={22} color={isPinned ? "#00f5ff" : "#fff"} />
              <Text style={[localStyles.optionText, isPinned && { color: "#00f5ff" }]}>
                {isPinned ? "Unpin" : "Pin"}
              </Text>
            </TouchableOpacity>

            {/* Mute */}
            <TouchableOpacity
              style={localStyles.optionRow}
              onPress={() => {
                triggerHaptic("light");
                onToggleMute(thread);
                onClose();
              }}
            >
              <Lucide name={isMuted ? "notifications-off" : "notifications-off-outline"} size={22} color={isMuted ? "#fbbf24" : "#fff"} />
              <Text style={[localStyles.optionText, isMuted && { color: "#fbbf24" }]}>
                {isMuted ? "Unmute" : "Mute"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={localStyles.divider} />

            {/* Delete */}
            <TouchableOpacity
              style={localStyles.optionRow}
              onPress={() => {
                triggerHaptic("heavy");
                onDeleteThread(thread);
                onClose();
              }}
            >
              <Lucide name="trash-outline" size={22} color="#ef4444" />
              <Text style={[localStyles.optionText, { color: "#ef4444", fontWeight: "600" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  sheetContent: {
    paddingBottom: 28,
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  title: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  optionsList: {
    paddingHorizontal: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  optionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
