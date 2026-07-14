import React, { useRef } from "react";
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
  ProductThumbnailStrip,
  ShopNowBar,
  resolvePostProducts,
} from "@/components/post/PostProductOverlay";
import { PostMetaRotator } from "@/components/post/PostMetaRotator";
import { PostActionRow } from "@/components/post/PostActionRow";
import { RepostAttribution } from "@/components/post/RepostAttribution";
import {
  openHashtag,
  openProduct,
  resolveFeedPostMeta,
} from "@/lib/postNavigation";
import { usePostPeopleSheet } from "@/hooks/usePostPeopleSheet";

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
}

/** Instagram-style home feed post — collab, photo tags, #/@ caption, products. */
export function HomeFeedPostCard({
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
}: HomeFeedPostCardProps) {
  const meta = resolveFeedPostMeta(item);
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
  const media =
    item.content?.mediaUrl ||
    item.content?.thumbnail ||
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600";

  const lastTapRef = useRef(0);
  const handleMediaPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTapLike?.();
    }
    lastTapRef.current = now;
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

      <TouchableOpacity activeOpacity={1} onPress={handleMediaPress} style={styles.mediaWrap}>
        <Image source={{ uri: media }} style={styles.media} contentFit="cover" />
        {heartBurst}
        <MediaPeopleOverlay
          photoTags={meta.photoTags}
          bottom={postProducts.length ? 58 : 12}
          left={12}
          onTagPress={onTagPress}
          onOverflowPress={openSheet}
        />
        <ProductThumbnailStrip
          products={postProducts}
          bottom={10}
          onPressProduct={(p) => openProduct(p.productId)}
        />
      </TouchableOpacity>

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
          <Text style={styles.repostQuote}>{meta.caption}</Text>
        ) : null}
        {meta.repostOf?.originalCaption && meta.isRepost ? (
          <Text style={styles.captionWrap} numberOfLines={3}>
            <Text style={styles.captionUser} onPress={() => onPersonPress(meta.repostOf!.authorUsername)}>
              {meta.repostOf.authorUsername}{" "}
            </Text>
            <Text style={styles.captionBody}>{meta.repostOf.originalCaption}</Text>
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
});
