import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Audio } from "expo-av";
import type { StickerLayer } from "@/lib/createDraft";
import { StoryStickerLayerView } from "@/components/stories/editor/StoryStickerLayerView";
import {
  fetchStoryPollStats,
  voteStoryPoll,
  logStoryLinkOpen,
  fetchEmojiSliderStats,
  submitEmojiSliderVote,
  type PollStats,
  type EmojiSliderStats,
} from "@/lib/storyInteractionApi";
import { getStickerProducts } from "@/lib/productTagUtils";
import { ShoppableProductSheet } from "@/components/commerce/ShoppableProductSheet";

type Props = {
  sticker: StickerLayer;
  scale: number;
  storyId: string;
  userId?: string;
  onOpenProfile?: (username: string, profileId?: string) => void;
  onOpenProduct?: (productId: string) => void;
  onQuestionPress?: (question: string) => void;
  onAddYoursPress?: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function ProductInteractiveSticker({
  sticker,
  scale,
  onOpenProduct,
}: {
  sticker: StickerLayer;
  scale: number;
  onOpenProduct?: (productId: string) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const products = getStickerProducts(sticker);
  return (
    <>
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.88}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      </TouchableOpacity>
      <ShoppableProductSheet
        visible={sheetOpen}
        products={products}
        onClose={() => setSheetOpen(false)}
        onSelectProduct={(p) => onOpenProduct?.(p.productId)}
      />
    </>
  );
}

export function StoryInteractiveSticker({
  sticker,
  scale,
  storyId,
  userId,
  onOpenProfile,
  onOpenProduct,
  onQuestionPress,
  onAddYoursPress,
}: Props) {
  const [pollStats, setPollStats] = useState<PollStats | null>(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [sliderStats, setSliderStats] = useState<EmojiSliderStats | null>(null);
  const [sliderLoading, setSliderLoading] = useState(false);
  const [localSliderValue, setLocalSliderValue] = useState<number | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const musicSoundRef = useRef<Audio.Sound | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [countdownText, setCountdownText] = useState(
    sticker.meta?.countdownEndsAt ? formatCountdown(sticker.meta.countdownEndsAt) : sticker.text
  );

  useEffect(() => {
    if (sticker.type !== "poll" || !userId) return;
    let cancelled = false;
    fetchStoryPollStats(storyId, sticker.id, userId).then((stats) => {
      if (!cancelled) setPollStats(stats);
    });
    return () => {
      cancelled = true;
    };
  }, [sticker.id, sticker.type, storyId, userId]);

  useEffect(() => {
    if (sticker.type !== "emoji_slider" || !userId) return;
    let cancelled = false;
    fetchEmojiSliderStats(storyId, sticker.id, userId).then((stats) => {
      if (!cancelled) {
        setSliderStats(stats);
        if (stats.userValue != null) setLocalSliderValue(stats.userValue);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sticker.id, sticker.type, storyId, userId]);

  useEffect(() => {
    return () => {
      musicSoundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (sticker.type !== "countdown" || !sticker.meta?.countdownEndsAt) return;
    const tick = () => setCountdownText(formatCountdown(sticker.meta!.countdownEndsAt!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sticker.meta?.countdownEndsAt, sticker.type]);

  const handlePollVote = async (optionIndex: 0 | 1) => {
    if (!userId || pollLoading) return;
    setPollLoading(true);
    try {
      const stats = await voteStoryPoll({
        storyId,
        stickerId: sticker.id,
        userId,
        optionIndex,
        question: sticker.text,
      });
      if (stats) setPollStats(stats);
    } finally {
      setPollLoading(false);
    }
  };

  const handleLink = async () => {
    const url = sticker.meta?.linkUrl;
    if (!url) return;
    if (userId) {
      await logStoryLinkOpen({ storyId, stickerId: sticker.id, userId, url });
    }
    const can = await Linking.canOpenURL(url);
    if (can) Linking.openURL(url);
    else Alert.alert("Invalid link", url);
  };

  const handleLocationPress = async () => {
    const lat = sticker.meta?.locationLat;
    const lon = sticker.meta?.locationLon;
    const label = encodeURIComponent(sticker.meta?.locationName || sticker.text || "Location");
    const url =
      typeof lat === "number" && typeof lon === "number"
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
        : `https://www.google.com/maps/search/?api=1&query=${label}`;
    Linking.openURL(url).catch(() => Alert.alert("Location", sticker.meta?.locationName || sticker.text));
  };

  const handleMusicPress = async () => {
    const previewUrl = sticker.meta?.musicUrl;
    if (!previewUrl) {
      Alert.alert("Music", sticker.meta?.musicTitle || sticker.text || "Track");
      return;
    }
    try {
      if (musicPlaying && musicSoundRef.current) {
        await musicSoundRef.current.stopAsync();
        await musicSoundRef.current.unloadAsync();
        musicSoundRef.current = null;
        setMusicPlaying(false);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: previewUrl }, { shouldPlay: true });
      musicSoundRef.current = sound;
      setMusicPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setMusicPlaying(false);
        }
      });
    } catch {
      Alert.alert("Music", "Could not play this track preview.");
    }
  };

  const handleSliderPress = async (locationX: number) => {
    if (!userId || sliderLoading || trackWidth <= 0) return;
    const value = Math.min(100, Math.max(0, Math.round((locationX / trackWidth) * 100)));
    setLocalSliderValue(value);
    setSliderLoading(true);
    try {
      const stats = await submitEmojiSliderVote({
        storyId,
        stickerId: sticker.id,
        userId,
        value,
        emoji: sticker.meta?.emoji,
      });
      if (stats) setSliderStats(stats);
    } finally {
      setSliderLoading(false);
    }
  };

  if (sticker.type === "emoji_slider") {
    const emoji = sticker.meta?.emoji || "😍";
    const displayValue =
      localSliderValue ??
      sliderStats?.userValue ??
      sliderStats?.average ??
      sticker.meta?.sliderValue ??
      50;
    return (
      <View style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}>
        <View style={[styles.sliderCard, { transform: [{ scale: sticker.scale * scale }] }]}>
          <Text style={styles.sliderEmoji}>{emoji}</Text>
          <Pressable
            style={styles.sliderTrack}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            onPress={(e) => handleSliderPress(e.nativeEvent.locationX)}
          >
            <View style={[styles.sliderFill, { width: `${displayValue}%` }]} />
          </Pressable>
          {sliderLoading ? (
            <ActivityIndicator color="#e91e63" style={{ marginTop: 6 }} />
          ) : (
            <Text style={styles.sliderHint}>
              {sliderStats?.total
                ? `Avg ${sliderStats.average}% · ${sliderStats.total} responses`
                : "Tap to react"}
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (sticker.type === "location") {
    return (
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={handleLocationPress}
        activeOpacity={0.85}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      </TouchableOpacity>
    );
  }

  if (sticker.type === "music") {
    return (
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={handleMusicPress}
        activeOpacity={0.85}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
        {musicPlaying ? (
          <View style={styles.musicPlayingDot}>
            <Text style={styles.musicPlayingText}>▶</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  if (sticker.type === "poll") {
    const opts = sticker.meta?.pollOptions || ["Yes", "No"];
    const total = pollStats?.total || 0;
    return (
      <View style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}>
        <View style={[styles.pollCard, { transform: [{ scale: sticker.scale * scale }] }]}>
          <Text style={styles.pollQuestion}>{sticker.text}</Text>
          {pollLoading ? <ActivityIndicator color="#e91e63" style={{ marginVertical: 8 }} /> : null}
          {opts.map((label, idx) => {
            const count = idx === 0 ? pollStats?.option0 || 0 : pollStats?.option1 || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const voted = pollStats?.userVote === idx;
            return (
              <TouchableOpacity
                key={`${label}_${idx}`}
                style={[styles.pollOption, voted && styles.pollOptionVoted]}
                onPress={() => handlePollVote(idx as 0 | 1)}
                disabled={!userId}
              >
                <Text style={styles.pollOptionText}>{label}</Text>
                {total > 0 ? (
                  <Text style={styles.pollPct}>{pct}%</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (sticker.type === "countdown") {
    return (
      <View style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}>
        <View style={[styles.countdownCard, { transform: [{ scale: sticker.scale * scale }] }]}>
          <Text style={styles.countdownLabel}>{sticker.meta?.countdownLabel || "Countdown"}</Text>
          <Text style={styles.countdownTime}>{countdownText}</Text>
        </View>
      </View>
    );
  }

  if (sticker.type === "link") {
    return (
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={handleLink}
        activeOpacity={0.85}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      </TouchableOpacity>
    );
  }

  if (sticker.type === "mention") {
    return (
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={() =>
          onOpenProfile?.(sticker.meta?.username || sticker.text, sticker.meta?.profileId)
        }
        activeOpacity={0.85}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      </TouchableOpacity>
    );
  }

  if (sticker.type === "product") {
    return (
      <ProductInteractiveSticker sticker={sticker} scale={scale} onOpenProduct={onOpenProduct} />
    );
  }

  if (sticker.type === "question") {
    return (
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={() => onQuestionPress?.(sticker.meta?.question || sticker.text)}
        activeOpacity={0.85}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      </TouchableOpacity>
    );
  }

  if (sticker.type === "add_yours") {
    return (
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={onAddYoursPress}
        activeOpacity={0.85}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      </TouchableOpacity>
    );
  }

  if (sticker.type === "hashtag") {
    return (
      <TouchableOpacity
        style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}
        onPress={() => onOpenProfile?.(`#${sticker.text.replace(/^#/, "")}`)}
        activeOpacity={0.85}
      >
        <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.anchor, { left: sticker.x * scale, top: sticker.y * scale }]}>
      <StoryStickerLayerView sticker={{ ...sticker, x: 0, y: 0 }} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: "absolute", zIndex: 10 },
  pollCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 14,
    width: 260,
  },
  pollQuestion: { color: "#111", fontSize: 15, fontWeight: "700", marginBottom: 10 },
  pollOption: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pollOptionVoted: { borderColor: "#e91e63", backgroundColor: "rgba(233,30,99,0.08)" },
  pollOptionText: { color: "#111", fontSize: 14, fontWeight: "600" },
  pollPct: { color: "#666", fontSize: 13, fontWeight: "700" },
  countdownCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    minWidth: 120,
  },
  countdownLabel: { color: "#111", fontSize: 11, fontWeight: "600", marginBottom: 4 },
  countdownTime: { color: "#111", fontSize: 22, fontWeight: "800" },
  sliderCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 14,
    width: 240,
    alignItems: "center",
  },
  sliderEmoji: { fontSize: 28, marginBottom: 8 },
  sliderTrack: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#e91e63",
    borderRadius: 5,
  },
  sliderHint: { color: "#666", fontSize: 11, marginTop: 8, fontWeight: "600" },
  musicPlayingDot: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e91e63",
    alignItems: "center",
    justifyContent: "center",
  },
  musicPlayingText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
