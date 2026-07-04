import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { router } from "expo-router";
import { formatCompactNumber } from "@/constants/format";
import { getCachedVideo } from "@/utils/videoCache";
import { PeekPreviewModal } from "./PeekPreviewModal";
import { CaptionText } from "@/components/CaptionText";
import { PostMetaRotator } from "@/components/post/PostMetaRotator";
import { MediaPeopleOverlay } from "@/components/post/MediaPeopleOverlay";
import { PostAuthorLine } from "@/components/post/PostAuthorLine";
import { RepostAttribution } from "@/components/post/RepostAttribution";
import {
  openHashtag,
  openProduct,
  resolveFeedPostMeta,
} from "@/lib/postNavigation";
import { usePostPeopleSheet } from "@/hooks/usePostPeopleSheet";
import {
  ProductThumbnailStrip,
  ShopNowBar,
  resolvePostProducts,
} from "@/components/post/PostProductOverlay";

const { height, width } = Dimensions.get("window");

export interface FeedCardProps {
  item: any;
  index: number;
  activeReelIndex: number;
  isScreenFocused: boolean;
  feedMuted: boolean;
  products: any[];
  likedPosts: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  floatingBottomOffset: number;
  reelHeight: number;
  handleMaisonProfilePress: (item: any) => void;
  handleLikePress: (id: string) => void;
  handleCommentsPress: (item: any) => void;
  handleShare: (item: any) => void;
  handleReshare?: (item: any) => void;
  handleSavePress: (id: string) => void;
  handleThreeDotsPress: (item: any) => void;
  commentsCount?: number;
  likesCount?: number;
  sharesCount?: number;
  repostsCount?: number;
  onCtaPress?: (ctaType: string, metadata: any) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  item,
  index,
  activeReelIndex,
  isScreenFocused,
  feedMuted,
  products,
  likedPosts,
  savedPosts,
  floatingBottomOffset,
  reelHeight,
  handleMaisonProfilePress,
  handleLikePress,
  handleCommentsPress,
  handleShare,
  handleReshare,
  handleSavePress,
  handleThreeDotsPress,
  commentsCount,
  likesCount: likesCountProp,
  sharesCount: sharesCountProp,
  repostsCount: repostsCountProp,
  onCtaPress,
}) => {
  const { triggerHaptic, formatPrice, activeProfile, currentUser } = useStore();
  const isPlayed = index === activeReelIndex;
  const isLiked = likedPosts[item.id] || false;
  const baseLikes = likesCountProp ?? item.likesCount ?? item.likes ?? 0;
  const displayLikes = Math.max(0, baseLikes);
  const displayComments =
    commentsCount ?? item.commentsCount ?? item.content?.commentsCount ?? 0;
  const displayShares =
    sharesCountProp ?? item.content?.sharesCount ?? item.sharesCount ?? 0;
  const displayReposts =
    repostsCountProp ?? item.content?.repostsCount ?? item.repostsCount ?? 0;
  const postProducts = resolvePostProducts(item, products);
  const postMeta = resolveFeedPostMeta(item);
  const {
    people,
    useSheet,
    onPersonPress,
    onTagPress,
    openSheet,
    PeopleSheet,
  } = usePostPeopleSheet({
    authorUsername: postMeta.authorUsername,
    authorName: postMeta.authorName,
    authorLogo: postMeta.authorAvatar,
    collab: postMeta.collab,
    collabs: postMeta.collabs,
    photoTags: postMeta.photoTags,
  });
  const otherPeopleCount = Math.max(0, people.length - 1);
  const [peekVisible, setPeekVisible] = useState(false);

  // ── Double-Tap Heart Animation ──────────────────────────
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  const triggerDoubleTapLike = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double-tap detected → fire like + animation
      handleLikePress(item.id);
      triggerHaptic("heavy");

      setShowHeart(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);

      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1.4,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 900,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowHeart(false));
    }
    lastTapRef.current = now;
  };

  // ── Pinch-to-Zoom (Pure Animated) ──────────────────────
  const pinchScale = useRef(new Animated.Value(1)).current;
  const [isPinching, setIsPinching] = useState(false);

  // Track distance between two touches manually
  const lastPinchDist = useRef(0);
  const basePinchScale = useRef(1);

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: any) => {
    if (e.nativeEvent.touches.length === 2) {
      setIsPinching(true);
      lastPinchDist.current = getDistance(e.nativeEvent.touches);
      basePinchScale.current = (pinchScale as any).__getValue?.() || 1;
    }
  };

  const handleTouchMove = (e: any) => {
    if (e.nativeEvent.touches.length === 2 && isPinching) {
      const currentDist = getDistance(e.nativeEvent.touches);
      const scaleFactor = currentDist / lastPinchDist.current;
      const newScale = Math.min(Math.max(basePinchScale.current * scaleFactor, 1), 3);
      pinchScale.setValue(newScale);
    }
  };

  const handleTouchEnd = () => {
    if (isPinching) {
      setIsPinching(false);
      Animated.spring(pinchScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  };

  const mockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4";
  const videoUrl = item.url && (item.url.endsWith(".mp4") || item.url.includes(".m3u8")) ? item.url : mockVideoUrl;

  // Optimize player resources: only initialize video player for the active or adjacent screens
  const isAdjacent = Math.abs(index - activeReelIndex) <= 1;

  // Local state to hold resolved (cached or remote) video source
  const [videoSource, setVideoSource] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (isAdjacent) {
      getCachedVideo(videoUrl).then((cached) => {
        if (active) {
          setVideoSource(cached || videoUrl);
        }
      });
    } else {
      setVideoSource(null);
    }
    return () => {
      active = false;
    };
  }, [isAdjacent, videoUrl]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = feedMuted;
    if (isPlayed && isScreenFocused) {
      p.play();
    } else {
      p.pause();
    }
  });

  // Sync mute setting dynamically
  useEffect(() => {
    player.muted = feedMuted;
  }, [feedMuted, player]);

  // Sync play/pause setting based on visibility and screen focus
  useEffect(() => {
    if (isPlayed && isScreenFocused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlayed, isScreenFocused, player]);

  return (
    <View style={[styles.reelContainer, { height: reelHeight }]}>
      {PeopleSheet}
      {/* Fullscreen Video with Pinch-to-Zoom + Double-Tap-to-Like */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={triggerDoubleTapLike}
        onLongPress={() => triggerHaptic("light")}
        style={StyleSheet.absoluteFillObject}
      >
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { transform: [{ scale: pinchScale }] }]}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isAdjacent && (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              nativeControls={false}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
          )}
        </Animated.View>

        {/* ❤️ Heart Burst Overlay */}
        {showHeart && (
          <Animated.View
            style={[
              styles.heartOverlay,
              {
                transform: [{ scale: heartScale }],
                opacity: heartOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <Lucide name="heart" size={90} color="#FF3B30" />
          </Animated.View>
        )}

        <MediaPeopleOverlay
          photoTags={postMeta.photoTags}
          bottom={postProducts.length ? 58 : 10}
          onTagPress={onTagPress}
          onOverflowPress={openSheet}
        />
        <ProductThumbnailStrip
          products={postProducts}
          bottom={8}
          onPressProduct={(p) => openProduct(p.productId)}
        />
      </TouchableOpacity>

      {/* DYNAMIC SHADER OVERLAYS SYNCED FROM THE CAMERA STUDIO */}
      {item.filterApplied === "platinum" && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.08)", zIndex: 1 }]} />
      )}
      {item.filterApplied === "neon" && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 3, borderColor: "#00f5ff", backgroundColor: "rgba(0,245,255,0.04)", zIndex: 1 }]} />
      )}
      {item.filterApplied === "obsidian" && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(8,4,21,0.45)", zIndex: 1 }]} />
      )}

      {/* Dynamic Touch Up simulated glow overlay */}
      {item.touchUpApplied > 0 && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.02)", opacity: item.touchUpApplied / 100, zIndex: 1 }]} />
      )}

      <View style={styles.gradientOverlay} />

      {/* Creator Metadata Overlay (Bottom Left) */}
      <View style={[styles.metaContainer, { bottom: floatingBottomOffset }]}>
        <ShopNowBar
          products={postProducts}
          onPress={() => postProducts[0] && openProduct(postProducts[0].productId)}
        />
        <View style={styles.creatorRow}>
          <TouchableOpacity 
            onPress={() => onPersonPress(postMeta.authorUsername)} 
            onLongPress={() => {
              triggerHaptic("heavy");
              setPeekVisible(true);
            }}
            delayLongPress={300}
            activeOpacity={0.85}
          >
            <View style={[styles.avatar, { overflow: "hidden" }]}>
              {(() => {
                const isCurrentUser = (item.profile?.username === activeProfile?.username) ||
                                      (item.profile?.id === activeProfile?.id) ||
                                      (item.user?.id === currentUser?.id) ||
                                      (item.profile?.name?.toLowerCase().replace(/\s+/g, "") === activeProfile?.name?.toLowerCase().replace(/\s+/g, ""));

                const logoUrl = isCurrentUser
                  ? (activeProfile?.logo || currentUser?.avatar)
                  : (item.profile?.logo || item.user?.avatar || item.maison?.logo);

                if (logoUrl) {
                  return (
                    <Image
                      source={{ uri: logoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      placeholder="L184i9ofbHof00ayjZay~qj[ayof"
                      placeholderContentFit="cover"
                      transition={300}
                    />
                  );
                }

                return (
                  <Text style={styles.avatarChar}>
                    {(item.profile?.name || item.user?.name || "A")[0]?.toUpperCase()}
                  </Text>
                );
              })()}
            </View>
          </TouchableOpacity>
          <View style={styles.creatorDetails}>
            <View style={styles.nameFollowRow}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, flexWrap: "wrap" }}>
                <PostAuthorLine
                  authorName={postMeta.authorName}
                  authorUsername={postMeta.authorUsername}
                  collab={postMeta.collab}
                  collabs={postMeta.collabs}
                  nameStyle={useSheet ? styles.creatorNamePicker : styles.creatorName}
                  collabStyle={useSheet ? styles.creatorNamePicker : styles.creatorName}
                  theme="dark"
                  showPeoplePicker={useSheet}
                  otherPeopleCount={otherPeopleCount}
                  onShowPeoplePicker={openSheet}
                  onAuthorPress={() => onPersonPress(postMeta.authorUsername)}
                  onCollabPress={() =>
                    postMeta.collab ? onPersonPress(postMeta.collab.username) : openSheet()
                  }
                />
                {item.type === "SPONSORED_AD" || item.sponsoredMetadata ? (
                  <Text style={styles.adTag}>Ad</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.followBtn} onPress={() => triggerHaptic("medium")}>
                <Text style={styles.followBtnText}>Follow</Text>
              </TouchableOpacity>
            </View>
            {postMeta.isRepost && postMeta.repostOf ? (
              <RepostAttribution repostOf={postMeta.repostOf} theme="dark" />
            ) : null}
            <PostMetaRotator
              location={item.content?.location || item.location}
              audio={item.audioTrack ? `${item.audioTrack.title} · ${item.audioTrack.artist}` : item.music}
              aiLabel={item.content?.aiLabel || item.aiLabel}
            />
          </View>
        </View>
        <CaptionText
          caption={
            postMeta.isRepost && postMeta.repostOf?.originalCaption
              ? postMeta.caption
                ? `${postMeta.caption}\n\n${postMeta.repostOf.originalCaption}`
                : postMeta.repostOf.originalCaption
              : postMeta.caption
          }
          style={styles.caption}
          numberOfLines={3}
          onHashtagPress={openHashtag}
          onMentionPress={onPersonPress}
        />
      </View>

      {/* Right Interaction Column (Likes, Comments, Share) */}
      <View style={[styles.interactionColumn, { bottom: floatingBottomOffset }]}>
        <TouchableOpacity style={styles.iconButtonRow} onPress={() => handleLikePress(item.id)}>
          <View style={styles.iconCircle}>
            <Lucide name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#ff3b30" : "#fff"} />
          </View>
          <Text style={styles.iconLabel}>{formatCompactNumber(displayLikes)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButtonRow} onPress={() => handleCommentsPress(item)}>
          <View style={styles.iconCircle}>
            <Lucide name="chatbubble-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.iconLabel}>{formatCompactNumber(displayComments)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButtonRow} onPress={() => handleShare(item)}>
          <View style={styles.iconCircle}>
            <Lucide name="paper-plane-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.iconLabel}>{formatCompactNumber(displayShares)}</Text>
        </TouchableOpacity>

        {handleReshare ? (
          <TouchableOpacity style={styles.iconButtonRow} onPress={() => handleReshare(item)}>
            <View style={styles.iconCircle}>
              <Lucide name="repeat-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.iconLabel}>{formatCompactNumber(displayReposts)}</Text>
          </TouchableOpacity>
        ) : null}

        {(() => {
          const isSaved = savedPosts[item.id] || false;
          return (
            <TouchableOpacity style={styles.iconButtonRow} onPress={() => handleSavePress(item.id)}>
              <View style={styles.iconCircle}>
                <Lucide name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#00f5ff" : "#fff"} />
              </View>
            </TouchableOpacity>
          );
        })()}

        <TouchableOpacity style={styles.iconButton} onPress={() => handleThreeDotsPress(item)}>
          <View style={styles.iconCircle}>
            <Lucide name="ellipsis-vertical" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Sponsored Ad CTA Banner ─── */}
      {(item.type === "SPONSORED_AD" || item.sponsoredMetadata) && (
        <TouchableOpacity
          style={[styles.ctaBanner, { bottom: floatingBottomOffset + 85 }]}
          activeOpacity={0.9}
          onPress={() => {
            triggerHaptic("medium");
            if (onCtaPress) {
              onCtaPress(
                item.sponsoredMetadata?.ctaType || "LEARN_MORE",
                item.sponsoredMetadata || {}
              );
            }
          }}
        >
          <Text style={styles.ctaBannerText}>
            {item.sponsoredMetadata?.ctaText || "Learn more"}
          </Text>
          <Lucide name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      <PeekPreviewModal
        visible={peekVisible}
        onClose={() => setPeekVisible(false)}
        type="PROFILE"
        data={{
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail || (item.artifact || {}).images?.[0] || item.videoUrl || "",
          caption: item.caption,
          maisonName: item.profile?.name || item.user?.name || item.maison?.name || "AURA Designer",
          maisonAvatar: item.profile?.logo || item.user?.avatar || item.maison?.logo || "",
          about: item.profile?.about || item.maison?.about || "AURA Curator",
          followersCount: item.profile?.followersCount || 14200,
          designType: item.profile?.designType || item.maison?.designType || "Brutalist"
        }}
        onActionPress={(action) => {
          if (action === "VIEW") {
            handleMaisonProfilePress(item);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  reelContainer: {
    width: width,
    position: "relative",
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  heartOverlay: {
    position: "absolute",
    alignSelf: "center",
    top: "38%",
    zIndex: 50,
  },
  metaContainer: {
    position: "absolute",
    left: 16,
    right: 80,
    zIndex: 10,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarChar: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14.5,
  },
  creatorDetails: {
    flex: 1,
  },
  nameFollowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  creatorName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14.5,
    maxWidth: width * 0.28,
  },
  creatorNamePicker: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14.5,
    flexShrink: 1,
  },
  saptashiText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },
  followBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  followBtnText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  audioTrackText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11.5,
    marginTop: 2,
  },
  aiFeedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(74,144,217,0.2)",
  },
  aiFeedBadgeText: {
    color: "#4a90d9",
    fontSize: 11,
    fontWeight: "700",
  },
  caption: {
    color: "#fff",
    fontSize: 14.5,
    marginTop: 4,
  },
  interactionColumn: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    gap: 16,
    zIndex: 10,
  },
  iconButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    minWidth: 16,
  },
  adTag: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "400" as const,
  },
  ctaBanner: {
    position: "absolute" as const,
    left: 16,
    right: 80,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    zIndex: 15,
  },
  ctaBannerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
});
