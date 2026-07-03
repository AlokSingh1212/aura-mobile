import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  type PostEditState,
  type TextLayer,
  FILTER_PRESETS,
  ADJUST_CONTROLS,
  defaultAdjustments,
} from "@/lib/postEditState";
import { PostMediaPreview } from "@/components/create/PostMediaPreview";
import { PostAudioSheet } from "@/components/create/PostAudioSheet";
import { PostFilterSheet } from "@/components/create/PostFilterSheet";
import { PostAdjustSheet } from "@/components/create/PostAdjustSheet";
import { PostProductSheet } from "@/components/create/PostProductSheet";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";

type Tool = "audio" | "text" | "product" | "filter" | "edit" | null;

interface PostEditStepProps {
  mediaUris: string[];
  activeIndex: number;
  editState: PostEditState;
  brandStores: BrandStoreOption[];
  userId?: string;
  onBack: () => void;
  onNext: () => void;
  onEditChange: (edit: PostEditState) => void;
  onActiveIndexChange: (index: number) => void;
}

export function PostEditStep({
  mediaUris,
  activeIndex,
  editState,
  brandStores,
  userId,
  onBack,
  onNext,
  onEditChange,
  onActiveIndexChange,
}: PostEditStepProps) {
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [textDraft, setTextDraft] = useState("");
  const [showTextModal, setShowTextModal] = useState(false);

  const uri = mediaUris[activeIndex] ?? mediaUris[0];
  const patch = (p: Partial<PostEditState>) => onEditChange({ ...editState, ...p });

  const addTextLayer = () => {
    if (!textDraft.trim()) return;
    const layer: TextLayer = {
      id: `txt_${Date.now()}`,
      text: textDraft.trim(),
      x: 15,
      y: 40,
      color: "#ffffff",
      bgColor: "rgba(0,0,0,0.35)",
    };
    patch({ textLayers: [...editState.textLayers, layer] });
    setTextDraft("");
    setShowTextModal(false);
  };

  const tools: { id: Tool; icon: string; label: string }[] = [
    { id: "audio", icon: "musical-notes-outline", label: "Audio" },
    { id: "text", icon: "text-outline", label: "Text" },
    { id: "product", icon: "bag-handle-outline", label: "Product" },
    { id: "filter", icon: "color-filter-outline", label: "Filter" },
    { id: "edit", icon: "options-outline", label: "Edit" },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Lucide name="close" size={28} color="#fff" />
        </TouchableOpacity>
        {editState.audioLabel ? (
          <View style={styles.audioHeaderPill}>
            <Text style={styles.audioHeaderText} numberOfLines={1}>
              ♪ {editState.audioLabel}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <TouchableOpacity style={styles.nextPill} onPress={onNext}>
          <Text style={styles.nextText}>Next</Text>
          <Lucide name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {mediaUris.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselDots}>
          {mediaUris.map((u, i) => (
            <TouchableOpacity key={u + i} onPress={() => onActiveIndexChange(i)}>
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.previewFlex}>
        <PostMediaPreview uri={uri} edit={editState} fill />
      </View>

      <View style={styles.toolbar}>
        {tools.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.toolBtn}
            onPress={() => {
              if (t.id === "text") setShowTextModal(true);
              else setActiveTool(t.id);
            }}
          >
            <View style={styles.toolIconWrap}>
              <Lucide name={t.icon as any} size={22} color="#fff" />
            </View>
            <Text style={styles.toolLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PostAudioSheet
        visible={activeTool === "audio"}
        onClose={() => setActiveTool(null)}
        onSelect={(track) => {
          patch({
            audioTrackId: track.id,
            audioLabel: `${track.title}${track.artist ? ` · ${track.artist}` : ""}`,
          });
          setActiveTool(null);
        }}
      />

      <PostFilterSheet
        visible={activeTool === "filter"}
        imageUri={uri}
        selectedId={editState.filterId}
        onClose={() => setActiveTool(null)}
        onSelect={(filterId) => {
          patch({ filterId });
          setActiveTool(null);
        }}
      />

      <PostAdjustSheet
        visible={activeTool === "edit"}
        imageUri={uri}
        adjustments={editState.adjustments}
        filterId={editState.filterId}
        onClose={() => setActiveTool(null)}
        onChange={(adjustments) => patch({ adjustments })}
        onDone={() => setActiveTool(null)}
      />

      <PostProductSheet
        visible={activeTool === "product"}
        brandStores={brandStores}
        userId={userId}
        selected={editState.productStickers}
        onClose={() => setActiveTool(null)}
        onChange={(productStickers) => {
          patch({ productStickers });
          setActiveTool(null);
        }}
      />

      <Modal visible={showTextModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.textModalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            <View style={styles.textModalHeader}>
              <TouchableOpacity onPress={() => setShowTextModal(false)}>
                <Text style={styles.textModalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.textPreviewArea}>
              <PostMediaPreview uri={uri} edit={editState} aspectRatio={4 / 5} />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Type something…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={textDraft}
              onChangeText={setTextDraft}
              autoFocus
              multiline
            />
            <TouchableOpacity style={styles.addTextBtn} onPress={addTextLayer}>
              <Text style={styles.addTextBtnLabel}>Add to photo</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  audioHeaderPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  audioHeaderText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  nextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0095f6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  carouselDots: { maxHeight: 20, paddingHorizontal: 16 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginRight: 6,
  },
  dotActive: { backgroundColor: "#0095f6" },
  previewFlex: { flex: 1, minHeight: 0 },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: "#000",
  },
  toolBtn: { alignItems: "center", gap: 6, width: 64 },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: { color: "#fff", fontSize: 11, fontWeight: "500" },
  textModalRoot: { flex: 1, backgroundColor: "#000" },
  textModalHeader: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textModalDone: { color: "#0095f6", fontSize: 16, fontWeight: "700" },
  textPreviewArea: { paddingHorizontal: 16, maxHeight: "45%" },
  textInput: {
    margin: 16,
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    minHeight: 80,
  },
  addTextBtn: {
    marginHorizontal: 16,
    backgroundColor: "#0095f6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addTextBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
