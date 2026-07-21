import React from "react";
import {
  View,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ShimmerFeedList } from "@/components/ui/ShimmerLoader";
import { HomeFeedItemRenderer, type HomeFeedItemRenderContext } from "@/components/home/HomeFeedItemRenderer";

type HomePostsFeedTabProps = {
  listData: any[];
  loadingFeedItems: boolean;
  bottomBarHeight: number;
  feedItemCtx: HomeFeedItemRenderContext;
  getItemLayout: (data: any, index: number) => { length: number; offset: number; index: number };
  onViewableItemsChanged: (info: { viewableItems: any[] }) => void;
  viewabilityConfig: object;
  loadMoreStories: () => void;
  loadingFeed: boolean;
};

export function HomePostsFeedTab({
  listData,
  loadingFeedItems,
  bottomBarHeight,
  feedItemCtx,
  getItemLayout,
  onViewableItemsChanged,
  viewabilityConfig,
  loadMoreStories,
  loadingFeed,
}: HomePostsFeedTabProps) {

  const renderFeedFooter = () => {
    if (!loadingFeed) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color="#00f5ff" />
      </View>
    );
  };

  const renderFeedItem = ({ item, index }: { item: any; index: number }) => (
    <HomeFeedItemRenderer item={item} index={index} ctx={feedItemCtx} />
  );

  if (loadingFeedItems && listData.length === 0) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomBarHeight + 40, paddingHorizontal: 12, paddingTop: 12 }}>
        <ShimmerFeedList count={2} />
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={listData}
      renderItem={renderFeedItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={6}
      windowSize={7}
      initialNumToRender={4}
      onEndReached={loadMoreStories}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFeedFooter}
      contentContainerStyle={{ paddingBottom: bottomBarHeight + 40 }}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
}

const styles = StyleSheet.create({});
