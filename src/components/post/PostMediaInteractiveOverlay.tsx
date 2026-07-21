import React, { useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { parseStoryLayers, interactiveLayers } from "@/lib/storyLayers";
import { POST_CANVAS_W } from "@/components/create/postEditorConstants";
import { StoryInteractiveSticker } from "@/components/stories/StoryInteractiveSticker";
import type { StickerLayer } from "@/lib/createDraft";

type Props = {
  postId: string;
  storyLayers?: unknown;
  userId?: string;
  onOpenProfile?: (username: string, profileId?: string) => void;
  onOpenProduct?: (productId: string) => void;
};

export function PostMediaInteractiveOverlay({
  postId,
  storyLayers,
  userId,
  onOpenProfile,
  onOpenProduct,
}: Props) {
  const [scale, setScale] = useState(1);
  const layers = useMemo(
    () =>
      interactiveLayers(parseStoryLayers(storyLayers)).filter((l) => l.type !== "product"),
    [storyLayers]
  );

  if (!layers.length) return null;

  const onLayout = (e: LayoutChangeEvent) => {
    setScale(e.nativeEvent.layout.width / POST_CANVAS_W);
  };

  return (
    <View style={styles.overlay} onLayout={onLayout} pointerEvents="box-none">
      {layers.map((sticker: StickerLayer) => (
        <StoryInteractiveSticker
          key={sticker.id}
          sticker={sticker}
          scale={scale}
          storyId={postId}
          userId={userId}
          onOpenProfile={onOpenProfile}
          onOpenProduct={onOpenProduct}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
});
