import React from "react";
import { Animated, View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { HomeFeedPostCard } from "@/components/HomeFeedPostCard";
import { HomeCreatorCommerceCard } from "@/components/home/HomeCreatorCommerceCard";
import { Avatar } from "@/components/ui/Avatar";
import { isReelVideoUrl } from "@/lib/reelMedia";
import { resolvePrimaryMediaUrl } from "@/lib/resolvePostMedia";

export type HomeFeedItemRenderContext = {
  activeFeedItemIndex: number;
  products: any[];
  feedMuted: boolean;
  isScreenFocused: boolean;
  likedReels: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  likeCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  shareCounts: Record<string, number>;
  repostCounts: Record<string, number>;
  postComments: Record<string, any[]>;
  activeProfile: any;
  justFollowedProfiles: Record<string, number>;
  heartAnimItem: string | null;
  heartAnimScale: Animated.Value;
  heartAnimOpacity: Animated.Value;
  triggerHaptic: (style: any) => void;
  setShowAiAssistant: (show: boolean) => void;
  handleLikePress: (id: string) => void;
  handleCommentsPress: (item: any) => void;
  handleShare: (item: any) => void;
  handleReshare: (item: any) => void;
  handleFeedItemSave: (id: string) => void;
  handleThreeDotsPress: (item: any) => void;
  handleFollowPress: (creatorId: string) => void;
  triggerHeartBurst: (itemId: string) => void;
  handleOpenFeedReel: (item: any) => void;
  handleAdCtaPress: (ctaType: string, meta: any) => void;
  setSelectedProductForPreview: (product: any) => void;
  setPreviewFeedItemId: (id: string | undefined) => void;
  setPreviewSheetVisible: (visible: boolean) => void;
  formatPrice: (price: number) => string;
  addToCart: (product: any) => void;
  logFeedCartAdd: (feedItemId: string, productId: string) => Promise<void>;
  logEngagement: (feedItemId: string, type: "share" | "purchase" | "view" | "like" | "save" | "cart_add") => Promise<{ likeCount?: number; liked?: boolean } | null>;
  setShowroomMode: (mode: "viewer" | "lobby") => void;
  setShowroomMaisonId: (id: string) => void;
  setShowroomMaisonName: (name: string) => void;
  setShowroomSessionId: (id: string) => void;
  setShowLiveShowroom: (show: boolean) => void;
  setFeedMuted: (muted: boolean) => void;
};

type HomeFeedItemRendererProps = {
  item: any;
  index: number;
  ctx: HomeFeedItemRenderContext;
};

function HomeFeedItemRendererInner({ item, index, ctx }: HomeFeedItemRendererProps) {
  const mountHomeVideo = Math.abs(index - ctx.activeFeedItemIndex) <= 1;
  const shouldPlayHomeVideo = index === ctx.activeFeedItemIndex;

  if (item.type === "ASK_AURA_AI") {
    return (
      <TouchableOpacity
        style={{
          marginHorizontal: 16,
          marginVertical: 12,
          padding: 16,
          borderRadius: 16,
          backgroundColor: "#F5F5F7",
          borderWidth: 1,
          borderColor: "#EAEAEA",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
        activeOpacity={0.85}
        onPress={() => {
          ctx.triggerHaptic("medium");
          ctx.setShowAiAssistant(true);
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#111111",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lucide name="sparkles" size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#111111" }}>Ask Aura AI Assistant</Text>
          <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>"Find oversized black hoodies under ₹1500"</Text>
        </View>
        <Lucide name="arrow-forward" size={16} color="#8E8E93" />
      </TouchableOpacity>
    );
  }

  const creatorName = item.creator?.name || "AURA Creator";
  const creatorUsername = item.creator?.username || "aura_curator";
  const creatorAvatar = item.creator?.avatar;

  const isLiked = ctx.likedReels[item.id] || false;
  const isSaved = ctx.savedPosts[item.id] || false;

  if (item.type === "CREATOR_POST") {
    const likesCount = ctx.likeCounts[item.id] ?? item.content?.likesCount ?? 0;
    const commentsCount =
      ctx.commentCounts[item.id] ?? ctx.postComments[item.id]?.length ?? item.content?.commentsCount ?? 0;
    const sharesCount = ctx.shareCounts[item.id] ?? item.content?.sharesCount ?? 0;
    const repostsCount = ctx.repostCounts[item.id] ?? item.content?.repostsCount ?? item.repostsCount ?? 0;

    const creatorId = item.creator?.id;
    const isMe = creatorId && ctx.activeProfile?.id === creatorId;
    const followTimestamp = creatorId ? ctx.justFollowedProfiles[creatorId] : undefined;
    const isJustFollowed = followTimestamp !== undefined && Date.now() - followTimestamp < 5 * 60 * 1000;
    const initialFollowed = !!item.creator?.isFollowing;
    const showFollowBtn = !isMe && !initialFollowed && (!followTimestamp || isJustFollowed);

    const videoSource =
      resolvePrimaryMediaUrl(item) || item.content?.videoUrl || item.content?.mediaUrl || "";
    const isHomeReel = isReelVideoUrl(videoSource);

    return (
      <HomeFeedPostCard
        item={item}
        products={ctx.products}
        isLiked={isLiked}
        isSaved={isSaved}
        likesCount={likesCount}
        commentsCount={commentsCount}
        sharesCount={sharesCount}
        repostsCount={repostsCount}
        feedMuted={ctx.feedMuted}
        shouldPlayVideo={shouldPlayHomeVideo}
        mountVideo={mountHomeVideo}
        isScreenFocused={ctx.isScreenFocused}
        onOpenReel={isHomeReel ? () => ctx.handleOpenFeedReel(item) : undefined}
        onLike={() => ctx.handleLikePress(item.id)}
        onComment={() => ctx.handleCommentsPress(item)}
        onShare={() => ctx.handleShare(item)}
        onReshare={() => ctx.handleReshare(item)}
        onSave={() => ctx.handleFeedItemSave(item.id)}
        onThreeDots={() => ctx.handleThreeDotsPress(item)}
        showFollowBtn={showFollowBtn}
        isJustFollowed={isJustFollowed}
        onFollow={() => creatorId && ctx.handleFollowPress(creatorId)}
        onDoubleTapLike={() => {
          ctx.handleLikePress(item.id);
          ctx.triggerHeartBurst(item.id);
        }}
        heartBurst={
          ctx.heartAnimItem === item.id ? (
            <Animated.View
              style={{
                position: "absolute",
                alignSelf: "center",
                top: "40%",
                zIndex: 10,
                transform: [{ scale: ctx.heartAnimScale }],
                opacity: ctx.heartAnimOpacity,
              }}
            >
              <Lucide name="heart" size={80} color="#FF3B30" />
            </Animated.View>
          ) : null
        }
      />
    );
  }

  if (item.type === "PRODUCT_POST") {
    const prod = item.product || {};
    const prodImg = prod.images?.[0];
    const rating = prod.rating || 4.8;
    const discount = prod.discount || 0;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: "#FFFFFF",
          marginHorizontal: 16,
          marginBottom: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#EAEAEA",
          overflow: "hidden",
        }}
        activeOpacity={0.95}
        onPress={() => {
          ctx.triggerHaptic("medium");
          ctx.setSelectedProductForPreview(prod);
          ctx.setPreviewFeedItemId(item.id);
          ctx.setPreviewSheetVisible(true);
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#F5F5F7",
          }}
        >
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            onPress={() => router.push(`/profile/${item.creator?.id || "aria.sterling"}`)}
          >
            <Avatar uri={creatorAvatar} name={creatorName} size={36} />
            <View>
              <Text style={{ fontWeight: "700", fontSize: 14, color: "#111111" }}>{creatorName}</Text>
              <Text style={{ fontSize: 11, color: "#8E8E93" }}>@{creatorUsername} • Brand Shop</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); ctx.handleThreeDotsPress(item); }}>
            <Lucide name="ellipsis-horizontal" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        {prodImg ? (
          <Image source={{ uri: prodImg }} style={{ width: "100%", height: 320 }} contentFit="cover" placeholder="L184i9ofbHof00ayjZay~qj[ayof" transition={300} />
        ) : (
          <View style={{ width: "100%", height: 320, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" }}>
            <Lucide name="image-outline" size={40} color="#8E8E93" />
          </View>
        )}

        {discount > 0 && (
          <View style={{ position: "absolute", top: 12, left: 12, backgroundColor: "#E5F9E7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
            <Text style={{ color: "#1F8722", fontSize: 10, fontWeight: "bold" }}>-{discount}% OFF</Text>
          </View>
        )}

        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#8E8E93", letterSpacing: 1 }}>AURA MAISON</Text>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111111", marginTop: 4 }}>{prod.name}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <View style={{ flexDirection: "row", gap: 1 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Lucide key={s} name={s <= Math.floor(rating) ? "star" : "star-outline"} size={13} color="#FFB800" />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: "#8E8E93" }}>{rating}</Text>
          </View>

          <Text style={{ fontSize: 18, fontWeight: "800", color: "#111111", marginTop: 10 }}>{ctx.formatPrice(prod.price)}</Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#111111",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                gap: 6,
              }}
              onPress={async (e) => {
                e.stopPropagation();
                ctx.triggerHaptic("success");
                ctx.addToCart(prod);
                await ctx.logFeedCartAdd(item.id, prod.id);
              }}
            >
              <Lucide name="cart-outline" size={18} color="#111111" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#111111" }}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                backgroundColor: "#111111",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={async (e) => {
                e.stopPropagation();
                ctx.triggerHaptic("heavy");
                ctx.addToCart(prod);
                await ctx.logEngagement(item.id, "purchase");
                router.push("/cart");
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (item.type === "SPONSORED_AD") {
    const media = item.content?.mediaUrl || item.sponsoredMetadata?.creativeMediaUrl || "";
    const caption = item.content?.caption || "";
    return (
      <View style={{ backgroundColor: "#FFFFFF", marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#F5F5F7", paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Avatar uri={creatorAvatar} name={creatorName} size={36} />
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontWeight: "700", fontSize: 14, color: "#111111" }}>{creatorName}</Text>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#8E8E93", backgroundColor: "#F0F0F0", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>Ad</Text>
              </View>
              <Text style={{ fontSize: 11, color: "#8E8E93" }}>Sponsored</Text>
            </View>
          </View>
        </View>
        {media ? <Image source={{ uri: media }} style={{ width: "100%", height: 380 }} contentFit="cover" /> : null}
        {caption ? (
          <Text style={{ paddingHorizontal: 16, paddingTop: 12, fontSize: 14, color: "#111111" }} numberOfLines={3}>
            {caption}
          </Text>
        ) : null}
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            height: 44,
            borderRadius: 10,
            backgroundColor: "#111111",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 6,
          }}
          onPress={() => ctx.handleAdCtaPress(item.sponsoredMetadata?.ctaType || "LEARN_MORE", item.sponsoredMetadata || {})}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
            {item.sponsoredMetadata?.ctaText || "Learn more"}
          </Text>
          <Lucide name="chevron-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  if (item.type === "CREATOR_COMMERCE") {
    return (
      <HomeCreatorCommerceCard
        item={item}
        feedMuted={ctx.feedMuted}
        setFeedMuted={ctx.setFeedMuted}
        triggerHaptic={ctx.triggerHaptic}
        setSelectedProductForPreview={ctx.setSelectedProductForPreview}
        setPreviewFeedItemId={ctx.setPreviewFeedItemId}
        setPreviewSheetVisible={ctx.setPreviewSheetVisible}
        formatPrice={ctx.formatPrice}
        onPressVideo={() => ctx.handleOpenFeedReel(item)}
        handleThreeDotsPress={ctx.handleThreeDotsPress}
        shouldPlayVideo={shouldPlayHomeVideo}
        mountVideo={mountHomeVideo}
        isScreenFocused={ctx.isScreenFocused}
      />
    );
  }

  if (item.type === "LIVE_COMMERCE") {
    const thumbnail = item.content?.liveThumbnail;
    const title = item.content?.title || "Live Auction Drop";
    const viewerCount = item.content?.viewerCount || "2.1K";

    return (
      <View style={{ backgroundColor: "#FFFFFF", marginHorizontal: 16, marginBottom: 24, borderRadius: 20, borderWidth: 1, borderColor: "#EAEAEA", overflow: "hidden" }}>
        <View style={{ position: "relative" }}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={{ width: "100%", height: 260 }} contentFit="cover" placeholder="L184i9ofbHof00ayjZay~qj[ayof" transition={300} />
          ) : (
            <View style={{ width: "100%", height: 260, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }}>
              <Lucide name="videocam-outline" size={40} color="#8E8E93" />
            </View>
          )}
          <View style={{ position: "absolute", top: 12, left: 12, flexDirection: "row", gap: 6 }}>
            <View style={{ backgroundColor: "#FF3B30", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>LIVE</Text>
            </View>
            <View style={{ backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Lucide name="eye" size={12} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>{viewerCount}</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Avatar uri={creatorAvatar} name={creatorName} size={28} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#111111" }}>{creatorName}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111111", marginTop: 8 }}>{title}</Text>

          <TouchableOpacity
            style={{
              height: 46,
              borderRadius: 12,
              backgroundColor: "#FF3B30",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 14,
            }}
            onPress={() => {
              ctx.triggerHaptic("medium");
              ctx.setShowroomMode("viewer");
              ctx.setShowroomMaisonId(item.creator?.id || "rare_raven");
              ctx.setShowroomMaisonName(creatorName);
              ctx.setShowroomSessionId("session_live");
              ctx.setShowLiveShowroom(true);
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Join Live Showroom</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

export const HomeFeedItemRenderer = React.memo(HomeFeedItemRendererInner);
