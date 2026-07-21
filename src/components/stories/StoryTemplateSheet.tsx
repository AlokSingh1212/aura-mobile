import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import type { StoryTemplateDetail } from "@/lib/storyTemplateApi";

type Props = {
  visible: boolean;
  loading: boolean;
  template: StoryTemplateDetail | null;
  onClose: () => void;
  onAddYours: () => void;
  onParticipantPress?: (profileId: string, username: string) => void;
};

export function StoryTemplateSheet({
  visible,
  loading,
  template,
  onClose,
  onAddYours,
  onParticipantPress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
          <Lucide name="bookmark-outline" size={22} color="#fff" />
        </TouchableOpacity>

        {loading || !template ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.title}>{template.promptText}</Text>
            <Text style={styles.startedBy}>
              Started by <Text style={styles.starterName}>{template.startedBy.username}</Text>
            </Text>

            <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
              {template.participants.map((p) => (
                <TouchableOpacity
                  key={p.storyId}
                  style={styles.cell}
                  onPress={() => onParticipantPress?.(p.profileId, p.username)}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatarRing}>
                    <Image source={{ uri: p.avatar }} style={styles.avatar} />
                  </View>
                  <Text style={styles.username} numberOfLines={1}>
                    {p.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addBtn} onPress={onAddYours} activeOpacity={0.9}>
              <Text style={styles.addBtnText}>Add yours</Text>
            </TouchableOpacity>
            <Text style={styles.note}>{template.windowNote}</Text>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "78%",
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 16,
  },
  saveBtn: {
    position: "absolute",
    left: 20,
    top: 16,
    zIndex: 2,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 24,
  },
  startedBy: {
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    fontSize: 13,
  },
  starterName: {
    color: "#fff",
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
    paddingBottom: 16,
  },
  cell: {
    width: "30%",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#E1306C",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#333",
  },
  username: {
    color: "#fff",
    fontSize: 11,
    marginTop: 6,
    maxWidth: 72,
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: "#0095f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  note: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },
});
