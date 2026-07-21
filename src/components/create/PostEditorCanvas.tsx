import React from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import type { PostEditState } from "@/lib/postEditState";
import { PostMediaPreview } from "@/components/create/PostMediaPreview";
import {
  StoryDrawStrokesLayer,
  StoryStickerLayerView,
} from "@/components/stories/editor/StoryStickerLayerView";
import { StoryDraggableSticker } from "@/components/stories/editor/StoryDraggableSticker";
import { POST_CANVAS_W, POST_CANVAS_H } from "@/components/create/postEditorConstants";
import type { StickerLayer } from "@/lib/createDraft";

type Props = {
  uri: string;
  edit: PostEditState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onLayoutScale?: (scale: number) => void;
  interactive?: boolean;
};

export function PostEditorCanvas({
  uri,
  edit,
  selectedId,
  onSelect,
  onMove,
  onDelete,
  onLayoutScale,
  interactive = true,
}: Props) {
  const [scale, setScale] = React.useState(0.35);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    const h = e.nativeEvent.layout.height;
    const s = Math.min(w / POST_CANVAS_W, h / POST_CANVAS_H);
    setScale(s);
    onLayoutScale?.(s);
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      <PostMediaPreview uri={uri} edit={edit} fill aspectRatio={POST_CANVAS_W / POST_CANVAS_H} />
      <StoryDrawStrokesLayer strokes={edit.drawStrokes} scale={scale} />
      {edit.stickerLayers.map((s) =>
        interactive ? (
          <StoryDraggableSticker
            key={s.id}
            sticker={s}
            scale={scale}
            canvasW={POST_CANVAS_W}
            canvasH={POST_CANVAS_H}
            selected={selectedId === s.id}
            onSelect={onSelect}
            onMove={onMove}
            onDelete={onDelete}
          />
        ) : (
          <View
            key={s.id}
            style={{ position: "absolute", left: s.x * scale, top: s.y * scale }}
          >
            <StoryStickerLayerView sticker={{ ...s, x: 0, y: 0 }} scale={scale} />
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
});
