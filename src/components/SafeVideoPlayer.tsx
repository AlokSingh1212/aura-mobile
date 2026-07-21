import React, { useEffect, useState } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

export interface SafeVideoPlayerProps {
  source: string | null | undefined;
  muted?: boolean;
  playing?: boolean;
  loop?: boolean;
  playbackRate?: number;
  style?: StyleProp<ViewStyle>;
  contentFit?: "cover" | "contain" | "fill";
}

function VideoPlayerMount({
  source,
  muted = true,
  playing = true,
  loop = true,
  playbackRate = 1,
  style,
  contentFit = "cover",
}: { source: string } & Omit<SafeVideoPlayerProps, "source">) {
  const [viewReady, setViewReady] = useState(false);
  const player = useVideoPlayer(source, (p) => {
    p.loop = loop;
    p.muted = muted;
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setViewReady(true));
    return () => {
      cancelAnimationFrame(frame);
      setViewReady(false);
      try {
        player.pause();
      } catch {
        // Player may already be released during unmount.
      }
    };
  }, [player]);

  useEffect(() => {
    if (!viewReady) return;
    try {
      player.muted = muted;
      player.playbackRate = playbackRate;
      if (playing) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // Ignore updates on a released native player during list recycling.
    }
  }, [viewReady, muted, playing, playbackRate, player]);

  if (!viewReady) return null;

  return (
    <VideoView
      player={player}
      style={style}
      contentFit={contentFit}
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
    />
  );
}

/** Renders nothing for empty sources; remounts player when source changes. */
export function SafeVideoPlayer({ source, ...props }: SafeVideoPlayerProps) {
  const trimmed = source?.trim();
  if (!trimmed) return null;
  return <VideoPlayerMount key={trimmed} source={trimmed} {...props} />;
}
