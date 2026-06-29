import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  ViewStyle,
  DimensionValue,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

/* ─────────────────────────────────────────────── */
/*  Reusable Obsidian Shimmer Skeleton Loader     */
/*  Matches AURA's quiet-luxury dark aesthetic    */
/* ─────────────────────────────────────────────── */

interface ShimmerBarProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * A single animated shimmer bar.
 * Renders a dark container with a translucent gradient sweeping across it.
 */
export const ShimmerBar: React.FC<ShimmerBarProps> = ({
  width: barWidth,
  height,
  borderRadius = 8,
  style,
}) => {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return (
    <View
      style={[
        {
          width: barWidth,
          height,
          borderRadius,
          backgroundColor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255,255,255,0.06)",
            "rgba(0,245,255,0.04)",
            "rgba(255,255,255,0.06)",
            "transparent",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, width: width * 0.6 }}
        />
      </Animated.View>
    </View>
  );
};

/* ─────────────────────────────────────────────── */
/*  Pre-built Skeleton Layouts                    */
/* ─────────────────────────────────────────────── */

/** Circular avatar shimmer placeholder */
export const ShimmerAvatar: React.FC<{ size?: number; style?: ViewStyle }> = ({
  size = 36,
  style,
}) => (
  <ShimmerBar
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
  />
);

/** Full feed-post skeleton card */
export const ShimmerFeedCard: React.FC = () => (
  <View style={shimmerStyles.feedCard}>
    {/* Header row: avatar + text lines */}
    <View style={shimmerStyles.headerRow}>
      <ShimmerAvatar size={36} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <ShimmerBar width={120} height={12} borderRadius={4} />
        <ShimmerBar
          width={80}
          height={10}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>
    </View>

    {/* Image placeholder */}
    <ShimmerBar
      width="100%"
      height={380}
      borderRadius={0}
      style={{ marginTop: 12 }}
    />

    {/* Action row */}
    <View style={shimmerStyles.actionRow}>
      <ShimmerBar width={24} height={24} borderRadius={12} />
      <ShimmerBar
        width={24}
        height={24}
        borderRadius={12}
        style={{ marginLeft: 14 }}
      />
      <ShimmerBar
        width={24}
        height={24}
        borderRadius={12}
        style={{ marginLeft: 14 }}
      />
    </View>

    {/* Likes + Caption */}
    <ShimmerBar
      width={80}
      height={12}
      borderRadius={4}
      style={{ marginTop: 10, marginLeft: 16 }}
    />
    <ShimmerBar
      width="60%"
      height={12}
      borderRadius={4}
      style={{ marginTop: 8, marginLeft: 16 }}
    />
  </View>
);

/** Multiple stacked feed-card skeletons (for initial load) */
export const ShimmerFeedList: React.FC<{ count?: number }> = ({
  count = 3,
}) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <ShimmerFeedCard key={`shimmer-feed-${i}`} />
    ))}
  </View>
);

/** Shop grid skeleton: 2-column product card tiles */
export const ShimmerShopGrid: React.FC<{ count?: number }> = ({
  count = 4,
}) => (
  <View style={shimmerStyles.shopGrid}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={`shimmer-shop-${i}`} style={shimmerStyles.shopTile}>
        <ShimmerBar width="100%" height={180} borderRadius={16} />
        <ShimmerBar
          width="70%"
          height={10}
          borderRadius={4}
          style={{ marginTop: 10 }}
        />
        <ShimmerBar
          width="40%"
          height={12}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>
    ))}
  </View>
);

/** Stories strip skeleton */
export const ShimmerStoriesStrip: React.FC<{ count?: number }> = ({
  count = 5,
}) => (
  <View style={shimmerStyles.storiesStrip}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={`shimmer-story-${i}`} style={shimmerStyles.storyItem}>
        <ShimmerAvatar size={60} />
        <ShimmerBar
          width={48}
          height={8}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>
    ))}
  </View>
);

const shimmerStyles = StyleSheet.create({
  feedCard: {
    backgroundColor: "#0d0a1b",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20,
    overflow: "hidden",
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 12,
  },
  shopTile: {
    width: (width - 36) / 2,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  storiesStrip: {
    flexDirection: "row",
    paddingHorizontal: 8,
    gap: 16,
    height: 98,
    alignItems: "center",
  },
  storyItem: {
    alignItems: "center",
    width: 72,
  },
});
