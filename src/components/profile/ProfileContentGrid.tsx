import React from "react";
import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { ProfileGridEmpty } from "@/components/ProfileGridEmpty";
import { ProfileGridVideoThumbnail } from "@/components/profile/ProfileGridVideoThumbnail";
import type { ProfileCatalogProduct } from "@/lib/profileApi";
import type { ProductCollabProduct } from "@/lib/productCollabApi";

const { width } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 2) / 3;

type GridTab = "posts" | "reels" | "tagged" | "products" | "collabs";

type ProfileContentGridProps = {
  activeGridTab: GridTab;
  onTabChange: (tab: GridTab) => void;
  visiblePresetPosts: { id: string; url: string; thumbnail?: string; isVideo?: boolean; isRepost?: boolean }[];
  visibleTaggedPosts: { id: string; url: string; thumbnail?: string; isVideo?: boolean; isRepost?: boolean }[];
  displayProducts: ProfileCatalogProduct[];
  productCollabProducts: ProductCollabProduct[];
  showStoreLabelsOnProducts: boolean;
  triggerHaptic: (style: any) => void;
  onOpenGridItem: (tab: GridTab, id: string) => void;
  onSwitchToStore: (storeProfileId: string) => void;
};

export function ProfileContentGrid({
  activeGridTab,
  onTabChange,
  visiblePresetPosts,
  visibleTaggedPosts,
  displayProducts,
  productCollabProducts,
  showStoreLabelsOnProducts,
  triggerHaptic,
  onOpenGridItem,
  onSwitchToStore,
}: ProfileContentGridProps) {
  const gridTabs: { tab: GridTab; icon: string }[] = [
    { tab: "posts", icon: "grid-outline" },
    { tab: "reels", icon: "film-outline" },
    { tab: "tagged", icon: "person-outline" },
    { tab: "products", icon: "bag-handle-outline" },
    { tab: "collabs", icon: "repeat-outline" },
  ];

  return (
    <>
      <View style={styles.gridTabBar}>
        {gridTabs.map((item) => (
          <TouchableOpacity
            key={item.tab}
            style={[styles.gridTabBtn, activeGridTab === item.tab && styles.gridTabBtnActive]}
            onPress={() => {
              triggerHaptic("light");
              onTabChange(item.tab);
            }}
          >
            <Lucide name={item.icon as any} size={22} color={activeGridTab === item.tab ? "#00f5ff" : "rgba(255,255,255,0.4)"} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.gridWrapper}>
        {activeGridTab === "posts" &&
          (visiblePresetPosts.filter((post) => !post.isVideo).length > 0 ? (
            visiblePresetPosts
              .filter((post) => !post.isVideo)
              .map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridImageContainer}
                  onPress={() => {
                    triggerHaptic("medium");
                    onOpenGridItem("posts", post.id);
                  }}
                >
                  <Image source={{ uri: post.thumbnail || post.url }} style={styles.gridPostImage} />
                  {post.isRepost ? (
                    <View style={styles.gridRepostBadge}>
                      <Lucide name="repeat" size={11} color="#fff" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))
          ) : (
            <ProfileGridEmpty tab="posts" isOwnProfile />
          ))}

        {activeGridTab === "reels" &&
          (visiblePresetPosts.filter((post) => post.isVideo).length > 0 ? (
            visiblePresetPosts
              .filter((post) => post.isVideo)
              .map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridImageContainer}
                  onPress={() => {
                    triggerHaptic("medium");
                    onOpenGridItem("reels", post.id);
                  }}
                >
                  {/\.(mp4|mov|m4v|webm|m3u8)(\?|$)/i.test(post.thumbnail || post.url || "") ? (
                    <ProfileGridVideoThumbnail videoUrl={post.thumbnail || post.url} />
                  ) : (
                    <Image source={{ uri: post.thumbnail || post.url }} style={styles.gridPostImage} />
                  )}
                  <View style={styles.gridVideoBadge}>
                    <Lucide name="play" size={11} color="#ffffff" />
                  </View>
                  {post.isRepost ? (
                    <View style={[styles.gridRepostBadge, { top: 28 }]}>
                      <Lucide name="repeat" size={11} color="#fff" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))
          ) : (
            <ProfileGridEmpty tab="reels" isOwnProfile />
          ))}

        {activeGridTab === "tagged" &&
          (visibleTaggedPosts.length > 0 ? (
            visibleTaggedPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.gridImageContainer}
                onPress={() => {
                  triggerHaptic("medium");
                  onOpenGridItem("tagged", post.id);
                }}
              >
                {post.isVideo && /\.(mp4|mov|m4v|webm|m3u8)(\?|$)/i.test(post.thumbnail || post.url || "") ? (
                  <ProfileGridVideoThumbnail videoUrl={post.thumbnail || post.url} />
                ) : (
                  <Image source={{ uri: post.thumbnail || post.url }} style={styles.gridPostImage} />
                )}
                {post.isVideo ? (
                  <View style={styles.gridVideoBadge}>
                    <Lucide name="play" size={11} color="#ffffff" />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))
          ) : (
            <ProfileGridEmpty tab="tagged" isOwnProfile />
          ))}

        {activeGridTab === "products" &&
          (displayProducts.length > 0 ? (
            displayProducts.map((product) => {
              const imageUrl = product.images?.[0] || "";
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.gridImageContainer}
                  onPress={() => {
                    triggerHaptic("medium");
                    onOpenGridItem("products", product.id);
                  }}
                >
                  <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                  <View style={styles.gridPriceBadge}>
                    <Text style={styles.gridPriceText}>₹{product.price?.toLocaleString()}</Text>
                  </View>
                  {showStoreLabelsOnProducts && product.storeName && product.storeProfileId && (
                    <TouchableOpacity style={styles.gridStoreBadge} onPress={() => onSwitchToStore(product.storeProfileId!)}>
                      <Lucide name="storefront-outline" size={9} color="#00f5ff" />
                      <Text style={styles.gridStoreBadgeText} numberOfLines={1}>
                        {product.storeName}
                      </Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <ProfileGridEmpty tab="products" isOwnProfile />
          ))}

        {activeGridTab === "collabs" &&
          (productCollabProducts.length > 0 ? (
            productCollabProducts.map((product) => {
              const imageUrl = product.images?.[0] || "";
              return (
                <TouchableOpacity
                  key={product.collabId || product.id}
                  style={styles.gridImageContainer}
                  onPress={() => {
                    triggerHaptic("medium");
                    onOpenGridItem("collabs", product.id);
                  }}
                >
                  <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                  <View style={styles.gridAffiliateBadge}>
                    <Text style={styles.gridAffiliateText}>{product.commissionRate ?? 10}% Commission</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <ProfileGridEmpty tab="collabs" isOwnProfile />
          ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  gridTabBar: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
    marginTop: 8,
  },
  gridTabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "transparent",
  },
  gridTabBtnActive: {
    borderBottomColor: "#00f5ff",
  },
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    paddingTop: 1,
  },
  gridImageContainer: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE * 1.25,
    backgroundColor: "#0b071e",
    position: "relative",
  },
  gridPostImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridVideoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: 3,
  },
  gridRepostBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: 3,
  },
  gridPriceBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridPriceText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  gridStoreBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    maxWidth: GRID_ITEM_SIZE - 12,
  },
  gridStoreBadgeText: {
    color: "#00f5ff",
    fontSize: 8,
    fontWeight: "700",
  },
  gridAffiliateBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,245,255,0.85)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridAffiliateText: {
    color: "#080415",
    fontSize: 9,
    fontWeight: "900",
  },
});
