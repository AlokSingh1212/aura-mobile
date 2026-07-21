import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { API_HOST } from "@/constants/api";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";
import { CHAT_CONVERSATION_LABELS } from "@/components/chat/ChatPersonalInbox";

export type ChatLabelSheetProps = {
  visible: boolean;
  activeChat: any;
  selectedLabelTemp: string | null;
  triggerHaptic: (style: any) => void;
  onClose: () => void;
  onSelectLabel: (labelId: string) => void;
  onClearSelection: () => void;
  setConversationLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export function ChatLabelSheet({
  visible,
  activeChat,
  selectedLabelTemp,
  triggerHaptic,
  onClose,
  onSelectLabel,
  onClearSelection,
  setConversationLabels,
}: ChatLabelSheetProps) {
  if (!visible) return null;

  const labels = CHAT_CONVERSATION_LABELS;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <TouchableOpacity style={styles.labelSheetBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.labelSheetContent}>
          <View style={styles.labelSheetHandle} />

          <View style={styles.labelSheetHeader}>
            <Text style={styles.labelSheetTitle}>Add a label</Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic("light");
                onClearSelection();
              }}
            >
              <Text style={styles.labelSheetClearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.labelOptionsList} contentContainerStyle={{ gap: 4 }}>
            {labels.map((item) => {
              const isSelected = selectedLabelTemp === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.labelOptionRow}
                  onPress={() => {
                    triggerHaptic("light");
                    onSelectLabel(item.id);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <Lucide name={item.icon as any} size={22} color={item.color} />
                    <Text style={styles.labelOptionLabel}>{item.name}</Text>
                  </View>
                  <View style={[styles.labelRadioCircle, isSelected && styles.labelRadioCircleActive]}>
                    {isSelected && <View style={styles.labelRadioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.labelSheetFooterText}>
            Only people who manage your Aura account can view and change labels.
          </Text>

          <TouchableOpacity
            style={styles.labelSaveBtn}
            onPress={async () => {
              triggerHaptic("medium");
              if (activeChat) {
                const newLabel = selectedLabelTemp || "";
                setConversationLabels((prev) => ({
                  ...prev,
                  [activeChat.id]: newLabel,
                }));

                try {
                  await fetch(`${API_HOST}/api/mobile/chat/label`, {
                    method: "POST",
                    body: JSON.stringify({
                      conversationId: activeChat.id,
                      type: activeChat.type,
                      label: newLabel,
                    }),
                    headers: { "Content-Type": "application/json" },
                  });
                } catch (err) {
                  console.warn("Failed to persist label update:", err);
                }
              }
              onClose();
            }}
          >
            <Text style={styles.labelSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}
