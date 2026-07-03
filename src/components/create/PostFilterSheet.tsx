import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ComposerBottomSheet } from "@/components/create/ComposerBottomSheet";
import { FILTER_PRESETS } from "@/lib/postEditState";

interface PostFilterSheetProps {
  visible: boolean;
  imageUri: string;
  selectedId: string;
  onClose: () => void;
  onSelect: (filterId: string) => void;
}

export function PostFilterSheet({
  visible,
  imageUri,
  selectedId,
  onClose,
  onSelect,
}: PostFilterSheetProps) {
  const [pending, setPending] = React.useState(selectedId);

  React.useEffect(() => {
    if (visible) setPending(selectedId);
  }, [visible, selectedId]);

  return (
    <ComposerBottomSheet
      visible={visible}
      title="Filter"
      cancelLabel="Cancel"
      onClose={onClose}
      onDone={() => onSelect(pending)}
      height="42%"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_PRESETS.map((preset) => {
          const active = pending === preset.id;
          return (
            <TouchableOpacity key={preset.id} style={styles.filterItem} onPress={() => setPending(preset.id)}>
              <View style={[styles.thumbWrap, active && styles.thumbActive]}>
                <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
                <View style={[styles.thumbOverlay, { backgroundColor: preset.overlayColor }]} />
              </View>
              <Text style={[styles.filterName, active && styles.filterNameActive]}>{preset.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ComposerBottomSheet>
  );
}

const styles = StyleSheet.create({
  filterRow: { paddingHorizontal: 16, gap: 14, paddingTop: 8 },
  filterItem: { alignItems: "center", width: 72 },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: "#fff" },
  thumb: { width: "100%", height: "100%" },
  thumbOverlay: { ...StyleSheet.absoluteFillObject },
  filterName: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 6, textAlign: "center" },
  filterNameActive: { color: "#fff", fontWeight: "700" },
});
