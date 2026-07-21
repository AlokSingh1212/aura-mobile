import React, { useRef } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { FeedCard } from "@/components/FeedCard";
import { ShimmerFeedList } from "@/components/ui/ShimmerLoader";

export type HomeReelsFeedHandlers = {
  handleMaisonProfilePress: (item: any) => void;
  handleLikePress: (id: string) => void;
  handleCommentsPress: (item: any) => void;
  handleShare: (item: any) => void;
  handleReshare: (item: any) => void;
  handleSavePress: (id: string) => void;
  handleThreeDotsPress: (item: any) => void;
  handleAdCtaPress: (ctaType: string, meta: any) => void;
};

type HomeReelsFeedTabProps = {
  displayStories: any[];
  loadingFeed: boolean;
  storiesLength: number;
  reelHeight: number;
  activeStoryIndex: number;
  isScreenFocused: boolean;
  feedMuted: boolean;
  setFeedMuted: (muted: boolean) => void;
  products: any[];
  likedReels: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  floatingBottomOffset: number;
  commentCounts: Record<string, number>;
  likeCounts: Record<string, number>;
  shareCounts: Record<string, number>;
  repostCounts: Record<string, number>;
  postComments: Record<string, any[]>;
  handlers: HomeReelsFeedHandlers;
  onViewableItemsChanged: (info: { viewableItems: any[] }) => void;
  loadMoreStories: () => void;
  onReelsContainerLayout: (height: number) => void;
  onOpenReelRecorder: () => void;
  topInset: number;
  flatListRef?: React.RefObject<FlatList | null>;
};

export function HomeReelsFeedTab({
  displayStories,
  loadingFeed,
  storiesLength,
  reelHeight,
  activeStoryIndex,
  isScreenFocused,
  feedMuted,
  setFeedMuted,
  products,
  likedReels,
  savedPosts,
  floatingBottomOffset,
  commentCounts,
  likeCounts,
  shareCounts,
  repostCounts,
  postComments,
  handlers,
  onViewableItemsChanged,
  loadMoreStories,
  onReelsContainerLayout,
  onOpenReelRecorder,
  topInset,
  flatListRef,
}: HomeReelsFeedTabProps) {
  const internalRef = useRef<FlatList>(null);
  const listRef = flatListRef ?? internalRef;

  const getReelItemLayout = (_data: any, index: number) => ({
    length: reelHeight,
    offset: reelHeight * index,
    index,
  });

  const renderReelItem = ({ item, index }: { item: any; index: number }) => (
    <FeedCard
      item={item}
      index={index}
      activeReelIndex={activeStoryIndex}
      isScreenFocused={isScreenFocused}
      feedMuted={feedMuted}
      setFeedMuted={setFeedMuted}
      products={products}
      likedPosts={likedReels}
      savedPosts={savedPosts}
      floatingBottomOffset={floatingBottomOffset}
      reelHeight={reelHeight}
      handleMaisonProfilePress={handlers.handleMaisonProfilePress}
      handleLikePress={handlers.handleLikePress}
      handleCommentsPress={handlers.handleCommentsPress}
      handleShare={handlers.handleShare}
      handleReshare={handlers.handleReshare}
      handleSavePress={handlers.handleSavePress}
      handleThreeDotsPress={handlers.handleThreeDotsPress}
      commentsCount={commentCounts[item.id] ?? postComments[item.id]?.length ?? item.content?.commentsCount ?? item.commentsCount ?? 0}
      likesCount={likeCounts[item.id] ?? item.likes ?? item.content?.likesCount ?? 0}
      sharesCount={shareCounts[item.id] ?? item.content?.sharesCount ?? 0}
      repostsCount={repostCounts[item.id] ?? item.content?.repostsCount ?? item.repostsCount ?? 0}
      onCtaPress={handlers.handleAdCtaPress}
    />
  );

  if (loadingFeed && storiesLength === 0) {
    return (
      <View style={styles.centerContainer}>
        <ShimmerFeedList count={2} />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, position: "relative" }}
      onLayout={(e) => {
        const { height: layoutHeight } = e.nativeEvent.layout;
        if (layoutHeight > 0) {
          onReelsContainerLayout(layoutHeight);
        }
      }}
    >
      <FlatList
        ref={listRef}
        data={displayStories}
        renderItem={renderReelItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={reelHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 75 }}
        onEndReached={loadMoreStories}
        onEndReachedThreshold={0.5}
        getItemLayout={getReelItemLayout}
      />

      <TouchableOpacity
        style={[styles.reelsCameraBtn, { top: topInset + 12 }]}
        onPress={onOpenReelRecorder}
        accessibilityLabel="Record reel"
        accessibilityRole="button"
      >
        <Lucide name="camera-outline" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reelsCameraBtn: {
    position: "absolute",
    left: 16,
    zIndex: 200,
    elevation: 200,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
});
