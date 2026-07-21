import React, { useEffect, useRef } from "react";
import { View, StyleSheet, PanResponder, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import type { StickerLayer } from "@/lib/createDraft";
import { StoryStickerLayerView } from "@/components/stories/editor/StoryStickerLayerView";

type Props = {
  sticker: StickerLayer;
  scale: number;
  canvasW: number;
  canvasH: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
};

export function StoryDraggableSticker({
  sticker,
  scale,
  canvasW,
  canvasH,
  selected,
  onSelect,
  onMove,
  onDelete,
}: Props) {
  const posRef = useRef({ x: sticker.x, y: sticker.y });
  useEffect(() => {
    posRef.current = { x: sticker.x, y: sticker.y };
  }, [sticker.x, sticker.y]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect(sticker.id);
      },
      onPanResponderMove: (_, g) => {
        const start = posRef.current;
        const nx = Math.max(0, Math.min(canvasW - 40, start.x + g.dx / scale));
        const ny = Math.max(0, Math.min(canvasH - 40, start.y + g.dy / scale));
        onMove(sticker.id, nx, ny);
      },
      onPanResponderRelease: (_, g) => {
        const start = posRef.current;
        const nx = Math.max(0, Math.min(canvasW - 40, start.x + g.dx / scale));
        const ny = Math.max(0, Math.min(canvasH - 40, start.y + g.dy / scale));
        posRef.current = { x: nx, y: ny };
      },
    })
  ).current;

  return (
    <View
      style={[styles.wrap, { left: sticker.x * scale, top: sticker.y * scale }]}
      {...pan.panHandlers}
    >
      <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      {selected ? (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(sticker.id)}>
          <Lucide name="close" size={14} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 5,
  },
  deleteBtn: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
