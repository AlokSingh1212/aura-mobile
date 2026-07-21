import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { CaptionText } from "@/components/CaptionText";
import { PostAuthorLine, PostAuthorAvatars } from "@/components/post/PostAuthorLine";
import { MediaPeopleOverlay } from "@/components/post/MediaPeopleOverlay";
import {
  ShopNowBar,
  resolvePostProducts,
} from "@/components/post/PostProductOverlay";
import { PostMetaRotator } from "@/components/post/PostMetaRotator";
import { PostMediaInteractiveOverlay } from "@/components/post/PostMediaInteractiveOverlay";
import { PositionedProductTags } from "@/components/commerce/PositionedProductTags";
import { POST_CANVAS_W, POST_CANVAS_H } from "@/components/create/postEditorConstants";
import { PostActionRow } from "@/components/post/PostActionRow";
import { RepostAttribution } from "@/components/post/RepostAttribution";
import {
  openHashtag,
  openProduct,
  resolveFeedPostMeta,
} from "@/lib/postNavigation";
import { usePostPeopleSheet } from "@/hooks/usePostPeopleSheet";
import { useStore } from "@/store/useStore";
import { SafeVideoPlayer } from "@/components/SafeVideoPlayer";
import { isReelVideoUrl } from "@/lib/reelMedia";
import { resolvePostMediaUrls } from "@/lib/resolvePostMedia";
import { PostMediaCarousel } from "@/components/post/PostMediaCarousel";

export interface HomeFeedPostCardProps {
  item: any;
  products: any[];
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  repostsCount?: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onReshare?: () => void;
  onSave: () => void;
  onThreeDots: () => void;
  onDoubleTapLike?: () => void;
  heartBurst?: React.ReactNode;
  showFollowBtn?: boolean;
  isJustFollowed?: boolean;
  onFollow?: () => void;
  feedMuted?: boolean;
  shouldPlayVideo?: boolean;
  mountVideo?: boolean;
  isScreenFocused?: boolean;
  /** Single tap on video opens full-screen reels viewer */
  onOpenReel?: () => void;
}

/** Instagram-style home feed post — collab, photo tags, #/@ caption, products. */
function HomeFeedPostCardInner({
  item,
  products,
  isLiked,
  isSaved,
  likesCount,
  commentsCount,
  sharesCount,
  repostsCount = 0,
  onLike,
  onComment,
  onShare,
  onReshare,
  onSave,
  onThreeDots,
  onDoubleTapLike,
  heartBurst,
  showFollowBtn,
  isJustFollowed,
  onFollow,
  feedMuted = true,
  shouldPlayVideo = false,
  mountVideo = false,
  isScreenFocused = true,
  onOpenReel,
}: HomeFeedPostCardProps) {
  const meta = resolveFeedPostMeta(item);
  const currentUser = useStore((s) => s.currentUser);
  const postProducts = resolvePostProducts(item, products);
  const {
    people,
    useSheet,
    onPersonPress,
    onTagPress,
    openSheet,
    PeopleSheet,
  } = usePostPeopleSheet({
    authorUsername: meta.authorUsername,
    authorName: meta.authorName,
    authorLogo: meta.authorAvatar,
    collab: meta.collab,
    collabs: meta.collabs,
    photoTags: meta.photoTags,
  });
  const otherPeopleCount = Math.max(0, people.length - 1);
  const mediaUrls = resolvePostMediaUrls(item);
  const media =
    mediaUrls[0] ||
    item.content?.mediaUrl ||
    item.content?.thumbnail;
  const videoSource =
    mediaUrls.find((u) => isReelVideoUrl(u)) ||
    item.content?.videoUrl ||
    item.content?.mediaUrl ||
    "";
  const hasVideo = isReelVideoUrl(videoSource);
  const isCarousel = !hasVideo && mediaUrls.length > 1;
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const isVideoPlaying = shouldPlayVideo && isScreenFocused && hasVideo && !isPausedByUser;
  const poster = item.content?.thumbnail || (!hasVideo ? media : "");

  useEffect(() => {
    if (!shouldPlayVideo) {
      setIsPausedByUser(false);
    }
  }, [shouldPlayVideo]);

  const lastTapRef = useRef(0);
  const handleMediaPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTapLike?.();
      lastTapRef.current = now;
      return;
    }
    lastTapRef.current = now;
    if (hasVideo && onOpenReel) {
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 300) {
          onOpenReel();
        }
      }, 300);
    }
  };

  return (
    <View style={styles.card}>
      {PeopleSheet}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.85}
          onPress={() => onPersonPress(meta.authorUsername)}
        >
          <PostAuthorAvatars
            authorLogo={meta.authorAvatar}
            authorInitial={meta.authorName[0]?.toUpperCase() || "A"}
            collab={meta.collab}
            collabs={meta.collabs}
            extraCount={useSheet ? Math.max(0, people.length - 2) : 0}
            onPress={useSheet ? openSheet : undefined}
          />
          <View style={styles.headerText}>
            <PostAuthorLine
              authorName={meta.authorName}
              authorUsername={meta.authorUsername}
              collab={meta.collab}
              collabs={meta.collabs}
              nameStyle={styles.authorName}
              collabStyle={styles.authorName}
              theme="light"
              showPeoplePicker={useSheet}
              otherPeopleCount={otherPeopleCount}
              onShowPeoplePicker={openSheet}
              onAuthorPress={() => onPersonPress(meta.authorUsername)}
              onCollabPress={() =>
                meta.collab ? onPersonPress(meta.collab.username) : openSheet()
              }
            />
            {meta.isRepost && meta.repostOf ? (
              <RepostAttribution repostOf={meta.repostOf} theme="light" />
            ) : null}
            <PostMetaRotator
              location={item.location || item.content?.location}
              audio={item.music}
              aiLabel={item.aiLabel || item.content?.aiLabel}
              textStyle={styles.metaLine}
            />
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {showFollowBtn && (
            <TouchableOpacity
              style={[
                styles.followBtn,
                isJustFollowed ? styles.followingBtn : styles.followBtnActive
              ]}
              onPress={onFollow}
              disabled={isJustFollowed}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.followBtnText,
                isJustFollowed ? styles.followingBtnText : styles.followBtnTextActive
              ]}>
                {isJustFollowed ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onThreeDots} hitSlop={12}>
            <Lucide name="ellipsis-horizontal" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>

      {isCarousel ? (
        <PostMediaCarousel urls={mediaUrls} height={380}>
          <MediaPeopleOverlay
            photoTags={meta.photoTags}
            bottom={postProducts.length ? 58 : 12}
            left={12}
            onTagPress={onTagPress}
            onOverflowPress={openSheet}
          />
          {postProducts.length > 0 ? (
            <PositionedProductTags
              storyLayers={meta.storyLayers}
              fallbackProducts={postProducts}
              canvasWidth={POST_CANVAS_W}
              canvasHeight={POST_CANVAS_H}
              onOpenProduct={openProduct}
            />
          ) : null}
          <PostMediaInteractiveOverlay
            postId={item.id}
            storyLayers={meta.storyLayers}
            userId={currentUser?.id}
            onOpenProfile={(username) => {
              if (username.startsWith("#")) {
                openHashtag(username.slice(1));
                return;
              }
              onPersonPress(username);
            }}
            onOpenProduct={openProduct}
          />
          {heartBurst}
        </PostMediaCarousel>
      ) : (
      <TouchableOpacity activeOpacity={1} onPress={handleMediaPress} style={styles.mediaWrap} accessibilityLabel="Post media">
        {hasVideo && mountVideo ? (
          <SafeVideoPlayer
            source={videoSource}
            muted={feedMuted}
            playing={isVideoPlaying}
            loop
            style={styles.media}
            contentFit="cover"
          />
        ) : (
          <Image source={{ uri: poster || media }} style={styles.media} contentFit="cover" />
        )}
        {hasVideo && !isVideoPlaying ? (
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              setIsPausedByUser(false);
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lucide name="play" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : null}
        {hasVideo && isVideoPlaying && (
          <TouchableOpacity
            style={styles.playPauseBtn}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              setIsPausedByUser(true);
            }}
          >
            <Lucide
              name="pause"
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        )}
        {heartBurst}
        <MediaPeopleOverlay
          photoTags={meta.photoTags}
          bottom={postProducts.length ? 58 : 12}
          left={12}
          onTagPress={onTagPress}
          onOverflowPress={openSheet}
        />
        {postProducts.length > 0 ? (
          <PositionedProductTags
            storyLayers={meta.storyLayers}
            fallbackProducts={postProducts}
            canvasWidth={POST_CANVAS_W}
            canvasHeight={POST_CANVAS_H}
            onOpenProduct={openProduct}
          />
        ) : null}
        <PostMediaInteractiveOverlay
          postId={item.id}
          storyLayers={meta.storyLayers}
          userId={currentUser?.id}
          onOpenProfile={(username) => {
            if (username.startsWith("#")) {
              openHashtag(username.slice(1));
              return;
            }
            onPersonPress(username);
          }}
          onOpenProduct={openProduct}
        />
      </TouchableOpacity>
      )}

      <PostActionRow
        isLiked={isLiked}
        isSaved={isSaved}
        likesCount={likesCount}
        commentsCount={commentsCount}
        sharesCount={sharesCount}
        repostsCount={repostsCount}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onReshare={onReshare}
        onSave={onSave}
        theme="light"
      />

      {postProducts.length > 0 ? (
        <ShopNowBar
          products={postProducts}
          variant="light"
          style={styles.shopNow}
          onPress={() => postProducts[0] && openProduct(postProducts[0].productId)}
        />
      ) : null}

      <View style={styles.footer}>
        {meta.isRepost && meta.caption ? (
          <CaptionText
            caption={meta.caption}
            style={styles.repostQuote}
            onHashtagPress={openHashtag}
            onMentionPress={onPersonPress}
          />
        ) : null}
        {meta.repostOf?.originalCaption && meta.isRepost ? (
          <Text style={styles.captionWrap} numberOfLines={3}>
            <Text style={styles.captionUser} onPress={() => onPersonPress(meta.repostOf!.authorUsername)}>
              {meta.repostOf.authorUsername}{" "}
            </Text>
            <CaptionText
              caption={meta.repostOf.originalCaption}
              style={styles.captionBody}
              onHashtagPress={openHashtag}
              onMentionPress={onPersonPress}
            />
          </Text>
        ) : null}
        {!meta.isRepost && meta.caption ? (
          <Text style={styles.captionWrap}>
            <Text style={styles.captionUser} onPress={() => onPersonPress(meta.authorUsername)}>
              {meta.authorUsername}{" "}
            </Text>
            <CaptionText
              caption={meta.caption}
              style={styles.captionBody}
              onHashtagPress={openHashtag}
              onMentionPress={onPersonPress}
            />
          </Text>
        ) : null}
        {commentsCount > 0 ? (
          <TouchableOpacity onPress={onComment}>
            <Text style={styles.viewComments}>View all {commentsCount} comments</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export const HomeFeedPostCard = React.memo(HomeFeedPostCardInner, (prev, next) =>
  prev.item?.id === next.item?.id &&
  prev.isLiked === next.isLiked &&
  prev.isSaved === next.isSaved &&
  prev.likesCount === next.likesCount &&
  prev.commentsCount === next.commentsCount &&
  prev.sharesCount === next.sharesCount &&
  prev.repostsCount === next.repostsCount &&
  prev.showFollowBtn === next.showFollowBtn &&
  prev.isJustFollowed === next.isJustFollowed &&
  prev.feedMuted === next.feedMuted &&
  prev.shouldPlayVideo === next.shouldPlayVideo &&
  prev.mountVideo === next.mountVideo &&
  prev.isScreenFocused === next.isScreenFocused &&
  prev.heartBurst === next.heartBurst &&
  prev.products === next.products
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F7",
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 14,
  },
  metaLine: {
    color: "#8E8E93",
    fontSize: 11,
    marginTop: 2,
  },
  mediaWrap: {
    position: "relative",
  },
  media: {
    width: "100%",
    height: 380,
    backgroundColor: "#F5F5F7",
  },
  shopNow: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 16,
  },
  captionWrap: {
    fontSize: 13,
    lineHeight: 18,
  },
  captionUser: {
    fontWeight: "700",
    color: "#111111",
  },
  captionBody: {
    color: "#111111",
    fontSize: 13,
  },
  viewComments: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 6,
  },
  repostQuote: {
    fontSize: 13,
    color: "#111111",
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 18,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: "#fb923c",
    borderColor: "#fb923c",
  },
  followingBtn: {
    backgroundColor: "transparent",
    borderColor: "rgba(0,0,0,0.12)",
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  followBtnTextActive: {
    color: "#ffffff",
  },
  followingBtnText: {
    color: "#8E8E93",
  },
  playPauseBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
