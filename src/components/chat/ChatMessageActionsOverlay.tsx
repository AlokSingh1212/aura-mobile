import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";

export type ChatMessageActionsOverlayProps = {
  message: any;
  reactionEmojis: string[];
  onDismiss: () => void;
  onReact: (msgId: string, emoji: string) => void;
  onAction: (action: "REPLY" | "SAVE" | "STICKER" | "DELETE" | "UNSEND" | "MORE") => void;
};

export function ChatMessageActionsOverlay({
  message,
  reactionEmojis,
  onDismiss,
  onReact,
  onAction,
}: ChatMessageActionsOverlayProps) {
  if (!message) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <TouchableOpacity style={styles.longPressBackdrop} activeOpacity={1} onPress={onDismiss}>
        <View style={styles.longPressContainer}>
          <View style={styles.reactionPillContainer}>
            {reactionEmojis.map((emoji) => (
              <TouchableOpacity key={emoji} onPress={() => onReact(message.id, emoji)}>
                <Text style={styles.reactionEmojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.longPressOptionsCard}>
            <Text style={styles.longPressTimestamp}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            <TouchableOpacity style={styles.longPressOptionItem} onPress={() => onAction("REPLY")}>
              <Lucide name="arrow-undo-outline" size={22} color="#fff" />
              <Text style={styles.longPressOptionLabel}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.longPressOptionItem} onPress={() => onAction("SAVE")}>
              <Lucide name="chatbubble-outline" size={22} color="#fff" />
              <Text style={styles.longPressOptionLabel}>Save reply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.longPressOptionItem} onPress={() => onAction("STICKER")}>
              <Lucide name="happy-outline" size={22} color="#fff" />
              <Text style={styles.longPressOptionLabel}>Add sticker</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.longPressOptionItem} onPress={() => onAction("DELETE")}>
              <Lucide name="trash-outline" size={22} color="#fff" />
              <Text style={styles.longPressOptionLabel}>Delete for you</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.longPressOptionItem} onPress={() => onAction("UNSEND")}>
              <Lucide name="arrow-undo" size={22} color="#ff4a4a" />
              <Text style={[styles.longPressOptionLabel, { color: "#ff4a4a" }]}>Unsend</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.longPressOptionItem} onPress={() => onAction("MORE")}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                  <Lucide name="ellipsis-horizontal" size={22} color="#fff" />
                  <Text style={styles.longPressOptionLabel}>More</Text>
                </View>
                <Lucide name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
