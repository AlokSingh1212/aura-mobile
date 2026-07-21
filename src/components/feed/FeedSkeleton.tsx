import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

function ShimmerBlock({
  style,
  opacity,
}: {
  style: object;
  opacity: Animated.Value;
}) {
  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

export function FeedPostSkeleton() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.75, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.card} accessibilityLabel="Loading post">
      <View style={styles.headerRow}>
        <ShimmerBlock style={styles.avatar} opacity={pulse} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerBlock style={styles.lineShort} opacity={pulse} />
          <ShimmerBlock style={styles.lineTiny} opacity={pulse} />
        </View>
      </View>
      <ShimmerBlock style={styles.media} opacity={pulse} />
      <View style={styles.actions}>
        <ShimmerBlock style={styles.actionIcon} opacity={pulse} />
        <ShimmerBlock style={styles.actionIcon} opacity={pulse} />
        <ShimmerBlock style={styles.actionIcon} opacity={pulse} />
      </View>
      <ShimmerBlock style={styles.caption} opacity={pulse} />
    </View>
  );
}

export function FeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <FeedPostSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  block: { backgroundColor: "#e8e8e8", borderRadius: 6 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  lineShort: { width: 120, height: 12, borderRadius: 4 },
  lineTiny: { width: 80, height: 10, borderRadius: 4 },
  media: { width, height: width, borderRadius: 0 },
  actions: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionIcon: { width: 24, height: 24, borderRadius: 6 },
  caption: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 12,
    width: width * 0.7,
    borderRadius: 4,
  },
});
