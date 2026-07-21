import React, { useMemo } from "react";
import { View, StyleSheet, Image, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import type { StorySlide } from "@/lib/storyLayers";
import { STORY_CANVAS_W, interactiveLayers } from "@/lib/storyLayers";
import { StoryInteractiveSticker } from "@/components/stories/StoryInteractiveSticker";
import { StoryQuickReactions } from "@/components/stories/StoryQuickReactions";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SCALE = SCREEN_W / STORY_CANVAS_W;

type Props = {
  slide: StorySlide;
  userId?: string;
  onOpenProfile?: (username: string, profileId?: string) => void;
  onOpenProduct?: (productId: string) => void;
  onQuestionPress?: (question: string) => void;
  onAddYoursPress?: () => void;
};

function StoryVideoBackground({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export function StoryViewerSlide({
  slide,
  userId,
  onOpenProfile,
  onOpenProduct,
  onQuestionPress,
  onAddYoursPress,
}: Props) {
  const layers = useMemo(
    () => interactiveLayers(slide.storyLayers || []),
    [slide.storyLayers]
  );

  return (
    <View style={styles.root}>
      {slide.isVideo ? (
        <StoryVideoBackground uri={slide.url} />
      ) : (
        <Image source={{ uri: slide.url }} style={styles.media} resizeMode="cover" />
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        {layers.map((sticker) => (
          <StoryInteractiveSticker
            key={sticker.id}
            sticker={sticker}
            scale={SCALE}
            storyId={slide.id}
            userId={userId}
            onOpenProfile={onOpenProfile}
            onOpenProduct={onOpenProduct}
            onQuestionPress={onQuestionPress}
            onAddYoursPress={onAddYoursPress}
          />
        ))}
      </View>

      <StoryQuickReactions storyId={slide.id} userId={userId} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H * 0.85,
    backgroundColor: "#000",
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
