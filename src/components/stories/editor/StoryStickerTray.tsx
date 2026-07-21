import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { STORY_STICKER_CATALOG, type StoryStickerDef } from "@/components/stories/editor/storyEditorConstants";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (def: StoryStickerDef) => void;
};

export function StoryStickerTray({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = STORY_STICKER_CATALOG.filter((s) =>
    s.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.searchRow}>
            <Lucide name="search" size={18} color="rgba(255,255,255,0.45)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.chip}
                activeOpacity={0.85}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View style={[styles.chipIcon, { backgroundColor: `${item.iconColor}22` }]}>
                  <Lucide name={item.icon as any} size={18} color={item.iconColor} />
                </View>
                <Text style={styles.chipLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "rgba(28,28,30,0.98)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "72%",
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 10,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    gap: 8,
  },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    color: "#111",
    fontSize: 14,
    fontWeight: "600",
    paddingRight: 4,
  },
});
