import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { profileModalStyles as styles } from "@/components/profile/profileModalStyles";

export type ProfileCreateAction = "reel" | "product" | "post" | "story" | "highlight" | "live" | "ai";

type ProfileCreateSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: ProfileCreateAction) => void;
};

const CREATE_ITEMS: { action: ProfileCreateAction; icon: string; label: string; accent?: boolean }[] = [
  { action: "reel", icon: "film-outline", label: "Reel" },
  { action: "product", icon: "pricetag-outline", label: "Add products" },
  { action: "post", icon: "grid-outline", label: "Post" },
  { action: "story", icon: "add-circle-outline", label: "Story" },
  { action: "highlight", icon: "heart-circle-outline", label: "Highlights" },
  { action: "live", icon: "radio-outline", label: "Live" },
  { action: "ai", icon: "sparkles-outline", label: "AI", accent: true },
];

export function ProfileCreateSheet({ visible, onClose, onSelectAction }: ProfileCreateSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.switcherBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.createPanel, { alignSelf: "stretch" }]}>
          <View style={styles.switcherHandle} />
          <Text style={styles.createTitle}>Create</Text>

          <ScrollView style={styles.createList} showsVerticalScrollIndicator={false}>
            {CREATE_ITEMS.map((item) => (
              <TouchableOpacity key={item.action} style={styles.createItem} onPress={() => onSelectAction(item.action)}>
                <Lucide name={item.icon as any} size={24} color={item.accent ? "#00f5ff" : "#ffffff"} />
                <Text style={[styles.createItemText, item.accent && { color: "#00f5ff" }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
