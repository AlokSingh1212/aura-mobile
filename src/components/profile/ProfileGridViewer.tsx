import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { FeedCard } from "@/components/FeedCard";
import { formatCompactNumber } from "@/constants/format";
import type { ProfilePost } from "@/lib/profileApi";
import type { ProfileGridTab } from "@/lib/profileGridNavigation";
import { usePostEngagement, toEngagementItem } from "@/hooks/usePostEngagement";
import { PostCommentsSheet } from "@/components/post/PostCommentsSheet";
import { CaptionText } from "@/components/CaptionText";
import { PostMetaRotator } from "@/components/post/PostMetaRotator";
import { MediaPeopleOverlay } from "@/components/post/MediaPeopleOverlay";
import { PostAuthorLine, PostAuthorAvatars } from "@/components/post/PostAuthorLine";
import { PostOptionsSheet } from "@/components/post/PostOptionsSheet";
import { PostShareSheet } from "@/components/post/PostShareSheet";

const { width, height } = Dimensions.get("window");

export interface ProfileGridViewerProfile {
  username: string;
  name: string;
  logo?: string | null;
}

interface ProfileGridViewerProps {
  visible: boolean;
  onClose: () => void;
  tab: ProfileGridTab;
  initialItemId: string;
  profile: ProfileGridViewerProfile;
  posts: ProfilePost[];
  products: any[];
  isOwnProfile?: boolean;
  onPostDeleted?: (postId: string) => void;
}

function ProfilePostPage({
  post,
  profile,
  displayUrl,
  isLiked,
  isSaved,
  likesCount,
  commentsCount,
  onLike,
  onComment,
  onShare,
  onSave,
  onThreeDots,
  storeProducts,
}: {
  post: ProfilePost;
  profile: ProfileGridViewerProfile;
  displayUrl: string;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onThreeDots: () => void;
  storeProducts: any[];
}) {
  const { triggerHaptic, formatPrice } = useStore();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const linkedProduct =
    post.product ||
    (post.artifactId ? storeProducts.find((p) => p.id === post.artifactId) : null);
  const productTitle = linkedProduct?.title || linkedProduct?.name || "Product";

  const mediaUrls =
    post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : [displayUrl];

  return (
    <View style={styles.postPage}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <PostAuthorAvatars
            authorLogo={profile.logo}
            authorInitial={profile.name[0]?.toUpperCase() || "A"}
            collab={post.collab}
          />
          <View style={{ flex: 1 }}>
            <PostAuthorLine
              authorName={profile.name}
              authorUsername={profile.username}
              collab={post.collab}
              nameStyle={styles.postHeaderName}
            />
            <PostMetaRotator
              location={post.location}
              audio={post.music}
              aiLabel={post.aiLabel}
              textStyle={styles.postHeaderMeta}
            />
          </View>
        </View>
        <TouchableOpacity onPress={onThreeDots} hitSlop={12}>
          <Lucide name="ellipsis-horizontal" size={22} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
      </View>

      {mediaUrls.length > 1 ? (
        <View style={styles.mediaWrap}>
          <FlatList
            data={mediaUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `${post.id}_${i}`}
            onMomentumScrollEnd={(e) => {
              setCarouselIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.postImage} contentFit="cover" />
            )}
          />
          <MediaPeopleOverlay photoTags={post.photoTags} bottom={10} left={10} />
          <View style={styles.carouselDots}>
            {mediaUrls.map((_, i) => (
              <View
                key={i}
                style={[styles.carouselDot, i === carouselIndex && styles.carouselDotActive]}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: mediaUrls[0] }} style={styles.postImage} contentFit="cover" />
          <MediaPeopleOverlay photoTags={post.photoTags} bottom={10} left={10} />
        </View>
      )}

      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={onLike}>
            <Lucide name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ff3b30" : "#fff"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment}>
            <Lucide name="chatbubble-outline" size={25} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare}>
            <Lucide name="paper-plane-outline" size={25} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSave}>
          <Lucide name={isSaved ? "bookmark" : "bookmark-outline"} size={25} color={isSaved ? "#00f5ff" : "#fff"} />
        </TouchableOpacity>
      </View>

      <Text style={styles.postLikes}>{formatCompactNumber(likesCount)} likes</Text>
      {commentsCount > 0 && (
        <TouchableOpacity onPress={onComment}>
          <Text style={styles.viewComments}>View all {commentsCount} comments</Text>
        </TouchableOpacity>
      )}
      {post.caption ? (
        <Text style={styles.postCaption} numberOfLines={4}>
          <Text style={styles.postCaptionUser}>{profile.username} </Text>
          <CaptionText caption={post.caption} />
        </Text>
      ) : null}

      {linkedProduct ? (
        <TouchableOpacity
          style={styles.viewProductBtn}
          onPress={() => {
            triggerHaptic("medium");
            router.push(`/product/${linkedProduct.id}` as any);
          }}
        >
          <Lucide name="bag-handle-outline" size={18} color="#00f5ff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.viewProductLabel}>View product</Text>
            <Text style={styles.viewProductTitle} numberOfLines={1}>
              {productTitle}
              {linkedProduct.price ? ` · ${formatPrice(linkedProduct.price)}` : ""}
            </Text>
          </View>
          <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ProfileProductPage({ product, isCollab }: { product: any; isCollab?: boolean }) {
  const { triggerHaptic, addToCart, formatPrice } = useStore();
  const imageUrl = product.images?.[0] || product.url || "";
  const title = product.title || product.name || "Product";
  const price = product.price || 0;

  return (
    <View style={styles.postPage}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.postImage} contentFit="cover" />
      ) : (
        <View style={[styles.postImage, styles.productPlaceholder]}>
          <Lucide name="bag-handle-outline" size={40} color="rgba(255,255,255,0.3)" />
        </View>
      )}
      <View style={styles.productBody}>
        {isCollab && (
          <View style={styles.collabBadge}>
            <Text style={styles.collabBadgeText}>Affiliate · 10% Commission</Text>
          </View>
        )}
        <Text style={styles.productTitle}>{title}</Text>
        <Text style={styles.productPrice}>{formatPrice(price)}</Text>
        {product.vibe ? <Text style={styles.productVibe}>{product.vibe}</Text> : null}
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => {
            triggerHaptic("success");
            addToCart({ ...product, id: product.id, title, price, images: product.images || [imageUrl] });
          }}
        >
          <Text style={styles.addToCartText}>Add to bag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ProfileGridViewer({
  visible,
  onClose,
  tab,
  initialItemId,
  profile,
  posts,
  products,
  isOwnProfile = false,
  onPostDeleted,
}: ProfileGridViewerProps) {
  const insets = useSafeAreaInsets();
  const { triggerHaptic, products: storeProducts } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedMuted, setFeedMuted] = useState(true);
  const listRef = useRef<FlatList>(null);

  const engagement = usePostEngagement({
    isOwnPost: isOwnProfile,
    onDeleted: (postId) => {
      onPostDeleted?.(postId);
    },
  });

  const photoPosts = useMemo(() => posts.filter((p) => !p.isVideo), [posts]);
  const reelPosts = useMemo(() => posts.filter((p) => p.isVideo), [posts]);

  const items = useMemo(() => {
    if (tab === "posts") return photoPosts;
    if (tab === "reels") return reelPosts;
    return products;
  }, [tab, photoPosts, reelPosts, products]);

  const isReelMode = tab === "reels";
  const isProductMode = tab === "products" || tab === "collabs";
  const pageHeight = height - insets.top - 52;

  const reelItems = useMemo(
    () =>
      reelPosts.map((post) => ({
        id: post.id,
        url: post.url,
        caption: post.caption || "",
        isVideo: true,
        creator: {
          name: profile.name,
          username: profile.username,
          avatar: profile.logo,
        },
        likes: 0,
        commentsCount: 0,
        comments: [],
      })),
    [reelPosts, profile]
  );

  const listData = isReelMode ? reelItems : items;

  const noopProfilePress = useCallback(() => {
    triggerHaptic("light");
  }, [triggerHaptic]);

  const openEngagement = useCallback(
    (post: ProfilePost) => toEngagementItem(post, profile),
    [profile]
  );

  useEffect(() => {
    if (!visible || isProductMode) return;
    const ids = listData.map((item) => item.id).filter(Boolean);
    engagement.hydratePostsEngagement(ids);
  }, [visible, listData, isProductMode, engagement.hydratePostsEngagement]);

  useEffect(() => {
    if (!visible || isProductMode) return;
    const item = listData[activeIndex];
    if (item?.id) {
      engagement.hydratePostEngagement(item.id);
    }
  }, [visible, activeIndex, listData, isProductMode, engagement.hydratePostEngagement]);

  useEffect(() => {
    if (!visible || !initialItemId) return;
    const idx = listData.findIndex((item) => item.id === initialItemId);
    const nextIndex = idx >= 0 ? idx : 0;
    setActiveIndex(nextIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: nextIndex, animated: false, viewPosition: 0 });
    });
  }, [visible, initialItemId, listData]);

  const scrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
      });
    },
    []
  );

  const renderPage = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (isReelMode) {
        const reelItem = toEngagementItem(
          { id: item.id, caption: item.caption, url: item.url },
          profile
        );
        return (
          <FeedCard
            item={item}
            index={index}
            activeReelIndex={activeIndex}
            isScreenFocused={visible}
            feedMuted={feedMuted}
            products={storeProducts}
            likedPosts={engagement.likedPosts}
            savedPosts={engagement.savedPosts}
            floatingBottomOffset={insets.bottom + 16}
            reelHeight={pageHeight}
            handleMaisonProfilePress={noopProfilePress}
            handleLikePress={engagement.handleLike}
            handleCommentsPress={() => engagement.handleComments(reelItem)}
            handleShare={() => engagement.handleShare(reelItem)}
            handleSavePress={engagement.handleSave}
            handleThreeDotsPress={() => engagement.handleThreeDots(reelItem)}
            commentsCount={engagement.commentCounts[item.id] ?? 0}
            likesCount={engagement.likeCounts[item.id] ?? 0}
          />
        );
      }

      const postItem = item as ProfilePost;
      const engagementItem = openEngagement(postItem);

      return (
        <View style={styles.feedItem}>
          {isProductMode ? (
            <ProfileProductPage product={item} isCollab={tab === "collabs"} />
          ) : (
            <ProfilePostPage
              post={postItem}
              profile={profile}
              displayUrl={postItem.thumbnail || postItem.url}
              isLiked={!!engagement.likedPosts[postItem.id]}
              isSaved={!!engagement.savedPosts[postItem.id]}
              likesCount={engagement.likeCounts[postItem.id] ?? 0}
              commentsCount={engagement.commentCounts[postItem.id] ?? 0}
              onLike={() => engagement.handleLike(postItem.id)}
              onComment={() => engagement.handleComments(engagementItem)}
              onShare={() => engagement.handleShare(engagementItem)}
              onSave={() => engagement.handleSave(postItem.id)}
              onThreeDots={() => engagement.handleThreeDots(engagementItem)}
              storeProducts={storeProducts}
            />
          )}
        </View>
      );
    },
    [
      isReelMode,
      isProductMode,
      tab,
      activeIndex,
      visible,
      feedMuted,
      storeProducts,
      engagement,
      pageHeight,
      profile,
      insets.bottom,
      noopProfilePress,
      openEngagement,
    ]
  );

  const titleLabel =
    tab === "reels" ? "Reels" : tab === "products" ? "Products" : tab === "collabs" ? "Collabs" : "Posts";

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} hitSlop={12}>
            <Lucide name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{titleLabel}</Text>
            <Text style={styles.headerSubtitle}>@{profile.username}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        {listData.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color="#00f5ff" />
          </View>
        ) : isReelMode ? (
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={(item) => item.id}
            pagingEnabled
            snapToInterval={pageHeight}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
            getItemLayout={(_, index) => ({
              length: pageHeight,
              offset: pageHeight * index,
              index,
            })}
            renderItem={renderPage}
          />
        ) : (
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={scrollToIndexFailed}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            ItemSeparatorComponent={() => <View style={styles.feedSeparator} />}
            renderItem={renderPage}
          />
        )}

        {listData.length > 1 && isReelMode && (
          <View style={[styles.pagerIndicator, { bottom: insets.bottom + 12 }]}>
            <Text style={styles.pagerIndicatorText}>
              {activeIndex + 1} / {listData.length}
            </Text>
          </View>
        )}
      </View>

      <PostCommentsSheet
        visible={engagement.commentsVisible}
        onClose={() => engagement.setCommentsVisible(false)}
        post={engagement.commentsTarget}
        comments={engagement.commentsTarget ? engagement.postComments[engagement.commentsTarget.id] || [] : []}
        authorLabel={profile.username}
        onAddComment={(text) => {
          if (engagement.commentsTarget) {
            engagement.addComment(engagement.commentsTarget.id, text);
          }
        }}
      />

      <PostOptionsSheet
        visible={engagement.optionsVisible}
        onClose={() => engagement.setOptionsVisible(false)}
        post={engagement.optionsTarget}
        isOwnPost={isOwnProfile}
        onSave={() => {
          if (engagement.optionsTarget) engagement.handleSave(engagement.optionsTarget.id);
        }}
        onShare={() => {
          if (engagement.optionsTarget) {
            engagement.setOptionsVisible(false);
            engagement.handleShare(engagement.optionsTarget);
          }
        }}
        onCopyLink={() => {
          if (engagement.optionsTarget) engagement.copyPostLink(engagement.optionsTarget);
        }}
        onDelete={() => {
          if (engagement.optionsTarget) engagement.confirmDeletePost(engagement.optionsTarget);
        }}
      />

      <PostShareSheet
        visible={engagement.shareVisible}
        onClose={() => engagement.setShareVisible(false)}
        post={engagement.shareTarget}
        shareLink={engagement.shareLink}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  postPage: {
    width,
    backgroundColor: "#080415",
  },
  feedItem: {
    width,
    backgroundColor: "#080415",
  },
  feedSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  postHeaderAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  postHeaderAvatarFallback: {
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  postHeaderAvatarText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  postHeaderName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  postHeaderHandle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
  postHeaderMeta: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  mediaWrap: {
    position: "relative",
  },
  postImage: {
    width,
    aspectRatio: 1,
    backgroundColor: "#111",
  },
  carouselDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  carouselDotActive: {
    backgroundColor: "#00f5ff",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  postLikes: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  viewComments: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  postCaption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
  },
  postCaptionUser: {
    fontWeight: "700",
  },
  viewProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,245,255,0.25)",
  },
  viewProductLabel: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  viewProductTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  aiLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  aiLabelText: { color: "#4a90d9", fontSize: 12, fontWeight: "700" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  locationText: { color: "rgba(255,255,255,0.65)", fontSize: 13, flex: 1 },
  tagMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  tagMetaChip: { color: "#ff9500", fontSize: 12, fontWeight: "600" },
  collabMetaChip: { color: "#00f5ff", fontSize: 12, fontWeight: "600" },
  productBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  productPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  collabBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,245,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  collabBadgeText: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "600",
  },
  productTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  productPrice: {
    color: "#00f5ff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  productVibe: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 16,
  },
  addToCartBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  addToCartText: {
    color: "#080415",
    fontSize: 15,
    fontWeight: "700",
  },
  pagerIndicator: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pagerIndicatorText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
});
