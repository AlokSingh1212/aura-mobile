import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { captureRef } from "react-native-view-shot";
import Lucide from "@expo/vector-icons/Ionicons";
import { FILTER_PRESETS } from "@/components/ImageEditor";
import type { StickerLayer } from "@/lib/createDraft";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PREVIEW_W = SCREEN_W * 0.72;
const PREVIEW_H = (PREVIEW_W * CANVAS_H) / CANVAS_W;
const SCALE = PREVIEW_W / CANVAS_W;

export type StoryCompositorProps = {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onExport: (bakedUri: string, stickers: StickerLayer[]) => void;
};

const QUICK_STICKERS = ["✨", "🔥", "💎", "🖤", "AURA", "NEW", "LIVE"];

export function StoryCompositor({
  visible,
  imageUri,
  onClose,
  onExport,
}: StoryCompositorProps) {
  const canvasRef = useRef<View>(null);
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [textInput, setTextInput] = useState("");
  const [showTextModal, setShowTextModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const addTextSticker = () => {
    if (!textInput.trim()) return;
    const layer: StickerLayer = {
      id: `st_${Date.now()}`,
      type: "text",
      text: textInput.trim(),
      x: CANVAS_W * 0.1,
      y: CANVAS_H * 0.4,
      scale: 1,
      color: "#ffffff",
    };
    setStickers((prev) => [...prev, layer]);
    setTextInput("");
    setShowTextModal(false);
  };

  const addEmojiSticker = (emoji: string) => {
    const layer: StickerLayer = {
      id: `em_${Date.now()}`,
      type: "emoji",
      text: emoji,
      x: CANVAS_W * 0.15 + Math.random() * CANVAS_W * 0.5,
      y: CANVAS_H * 0.2 + Math.random() * CANVAS_H * 0.4,
      scale: 1.2,
    };
    setStickers((prev) => [...prev, layer]);
  };

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const uri = await captureRef(canvasRef, {
        format: "jpg",
        quality: 0.92,
        width: CANVAS_W,
        height: CANVAS_H,
      });
      onExport(uri, stickers);
    } catch (e) {
      Alert.alert(
        "Export failed",
        e instanceof Error ? e.message : "Could not bake story layers."
      );
    } finally {
      setExporting(false);
    }
  }, [onExport, stickers]);

  const overlayColor =
    FILTER_PRESETS.find((f) => f.id === selectedFilter)?.overlayColor || "transparent";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Story editor</Text>
          <TouchableOpacity onPress={handleExport} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator size="small" color="#00f5ff" />
            ) : (
              <Text style={styles.done}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.previewArea}>
          <View
            ref={canvasRef}
            collapsable={false}
            style={[styles.canvas, { width: PREVIEW_W, height: PREVIEW_H }]}
          >
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
              pointerEvents="none"
            />
            {stickers.map((s) => (
              <Text
                key={s.id}
                style={[
                  styles.sticker,
                  {
                    left: s.x * SCALE,
                    top: s.y * SCALE,
                    fontSize: (s.type === "emoji" ? 48 : 28) * s.scale * SCALE,
                    color: s.color || "#fff",
                  },
                ]}
              >
                {s.text}
              </Text>
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolRow}>
          <TouchableOpacity style={styles.toolChip} onPress={() => setShowTextModal(true)}>
            <Lucide name="text" size={18} color="#fff" />
            <Text style={styles.toolChipText}>Text</Text>
          </TouchableOpacity>
          {QUICK_STICKERS.map((s) => (
            <TouchableOpacity key={s} style={styles.toolChip} onPress={() => addEmojiSticker(s)}>
              <Text style={styles.emojiChip}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTER_PRESETS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterBtn, selectedFilter === f.id && styles.filterBtnActive]}
                onPress={() => setSelectedFilter(f.id)}
              >
                <Text style={styles.filterBtnText}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Modal visible={showTextModal} transparent animationType="fade">
          <View style={styles.textModalOverlay}>
            <View style={styles.textModalBox}>
              <Text style={styles.textModalTitle}>Add text</Text>
              <TextInput
                style={styles.textInput}
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Type something…"
                placeholderTextColor="#666"
                autoFocus
              />
              <View style={styles.textModalActions}>
                <TouchableOpacity onPress={() => setShowTextModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addTextSticker}>
                  <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080415",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  done: {
    color: "#00f5ff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  canvas: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#111",
  },
  sticker: {
    position: "absolute",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  toolRow: {
    maxHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toolChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  toolChipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emojiChip: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  filterRow: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  filterBtnActive: {
    backgroundColor: "rgba(0,245,255,0.15)",
    borderWidth: 1,
    borderColor: "#00f5ff",
  },
  filterBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  textModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  textModalBox: {
    backgroundColor: "#0d0824",
    borderRadius: 16,
    padding: 20,
  },
  textModalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  textModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
  cancelText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
  },
  addText: {
    color: "#00f5ff",
    fontSize: 15,
    fontWeight: "700",
  },
});
