import React, { useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";

type Props = {
  urls: string[];
  height?: number;
  onIndexChange?: (index: number) => void;
  children?: React.ReactNode;
};

const { width: SCREEN_W } = Dimensions.get("window");

export function PostMediaCarousel({
  urls,
  height = SCREEN_W,
  onIndexChange,
  children,
}: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  if (!urls.length) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / SCREEN_W);
    if (next !== index) {
      setIndex(next);
      onIndexChange?.(next);
    }
  };

  if (urls.length === 1) {
    return (
      <View style={[styles.wrap, { height }]}>
        <Image source={{ uri: urls[0] }} style={styles.image} contentFit="cover" />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <FlatList
        ref={listRef}
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${uri}_${i}`}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={[styles.image, { width: SCREEN_W, height }]} contentFit="cover" />
        )}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
      />
      <View style={styles.dots} pointerEvents="none">
        {urls.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", backgroundColor: "#000", position: "relative" },
  image: { width: "100%", height: "100%" },
  dots: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: { backgroundColor: "#0095f6", width: 7, height: 7, borderRadius: 4 },
});
