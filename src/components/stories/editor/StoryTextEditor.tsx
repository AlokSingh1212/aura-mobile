import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  STORY_TEXT_COLORS,
  STORY_TEXT_FONTS,
} from "@/components/stories/editor/storyEditorConstants";
import type { StickerLayer } from "@/lib/createDraft";

export type StoryTextResult = Pick<
  StickerLayer,
  "text" | "color" | "meta"
>;

type Props = {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onDone: (result: StoryTextResult) => void;
  onOpenMention: () => void;
  onOpenLocation: () => void;
};

export function StoryTextEditor({
  visible,
  onClose,
  onDone,
  onOpenMention,
  onOpenLocation,
}: Props) {
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState("modern");
  const [color, setColor] = useState("#ffffff");
  const [highlight, setHighlight] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");

  const font = STORY_TEXT_FONTS.find((f) => f.id === fontId) || STORY_TEXT_FONTS[0];

  const handleDone = () => {
    if (!text.trim()) {
      onClose();
      return;
    }
    onDone({
      text: text.trim(),
      color,
      meta: { fontId, highlight, textAlign },
    });
    setText("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.dim} />
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>

        <View style={styles.centerArea}>
          <TextInput
            style={[
              styles.textInput,
              {
                color: highlight ? "#000" : color,
                backgroundColor: highlight ? "rgba(255,255,255,0.92)" : "transparent",
                fontWeight: font.fontWeight,
                fontStyle: font.fontStyle,
                textAlign,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Tap to type"
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
            autoFocus
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontRow}>
          {STORY_TEXT_FONTS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.fontChip, fontId === f.id && styles.fontChipActive]}
              onPress={() => setFontId(f.id)}
            >
              <Text style={[styles.fontChipText, fontId === f.id && styles.fontChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.formatBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorsRow}>
            {STORY_TEXT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && !highlight && styles.colorDotActive,
                ]}
                onPress={() => {
                  setHighlight(false);
                  setColor(c);
                }}
              />
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.formatBtn, highlight && styles.formatBtnActive]}
            onPress={() => setHighlight((h) => !h)}
          >
            <Text style={styles.formatBtnText}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.formatBtn}
            onPress={() =>
              setTextAlign((a) => (a === "center" ? "left" : a === "left" ? "right" : "center"))
            }
          >
            <Lucide name="reorder-three" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.shortcutBar}>
          <Pressable style={styles.shortcutBtn} onPress={onOpenMention}>
            <Lucide name="at" size={18} color="#fff" />
            <Text style={styles.shortcutLabel}>Mention</Text>
          </Pressable>
          <View style={styles.shortcutDivider} />
          <Pressable style={styles.shortcutBtn} onPress={onOpenLocation}>
            <Lucide name="location" size={18} color="#fff" />
            <Text style={styles.shortcutLabel}>Location</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  doneBtn: {
    position: "absolute",
    top: 56,
    right: 16,
    zIndex: 10,
  },
  doneText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  centerArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 20,
  },
  textInput: {
    fontSize: 28,
    fontWeight: "700",
    padding: 8,
    minHeight: 48,
  },
  fontRow: {
    maxHeight: 44,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  fontChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 999,
  },
  fontChipActive: {
    backgroundColor: "#fff",
  },
  fontChipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
  fontChipTextActive: { color: "#000" },
  formatBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  colorsRow: { alignItems: "center", gap: 10, paddingRight: 8 },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotActive: { borderColor: "#fff" },
  formatBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  formatBtnActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  formatBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  shortcutBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
    marginBottom: Platform.OS === "ios" ? 24 : 8,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  shortcutDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  shortcutLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
