import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
} from "react-native";
import { fetchPostComments, addPostComment } from "@/lib/profileApi";
import { Image } from "expo-image";
import { SafeVideoPlayer } from "@/components/SafeVideoPlayer";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { formatCompactNumber } from "@/constants/format";
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
  ShopNowBar,
  resolvePostProducts,
} from "@/components/post/PostProductOverlay";
import { PositionedProductTags } from "@/components/commerce/PositionedProductTags";
import { STORY_CANVAS_W, STORY_CANVAS_H } from "@/lib/storyLayers";
import { isReelVideoUrl } from "@/lib/reelMedia";
import { edgeIntentClassifier } from "@/lib/edgeIntentClassifier";

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
  setFeedMuted?: (muted: boolean) => void;
}

export const FeedCard = React.memo<FeedCardProps>(function FeedCard({
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
  setFeedMuted,
}: FeedCardProps) {
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
  const hasPositions = postMeta.photoTags?.some((t: any) => typeof t.x === "number" && typeof t.y === "number") ?? false;
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

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (isDetailsOpen) {
      fetchPostComments(item.id)
        .then((comms) => setLocalComments(comms || []))
        .catch(() => {});
    }
  }, [isDetailsOpen, item.id]);

  useEffect(() => {
    if (isPlayed) {
      const dwellStart = Date.now();
      return () => {
        const dwellMs = Date.now() - dwellStart;
        edgeIntentClassifier.recordSample({
          itemId: item.id || `item_${index}`,
          category: item.category || item.vibe || "general",
          dwellMs: Math.max(100, dwellMs),
          scrollVelocityPxPerMs: dwellMs < 600 ? 3.8 : 0.3,
          timestamp: Date.now(),
        });
      };
    }
  }, [isPlayed, item.id, index, item.category, item.vibe]);

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
    } else {
      // Single-tap detected → wait 300ms to verify it is not a double tap, then toggle mute!
      setTimeout(() => {
        const currentNow = Date.now();
        // If no second tap occurred within 300ms, toggle mute!
        if (currentNow - lastTapRef.current >= 300) {
          triggerHaptic("light");
          if (setFeedMuted) {
            setFeedMuted(!feedMuted);
          }
        }
      }, 300);
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

  const rawVideo =
    item.url ||
    item.content?.videoUrl ||
    item.content?.mediaUrl ||
    item.sponsoredMetadata?.creativeMediaUrl ||
    "";
  const videoUrl = isReelVideoUrl(rawVideo) ? rawVideo : "";

  // Optimize player resources: only initialize video player for the active or adjacent screens
  const isAdjacent = Math.abs(index - activeReelIndex) <= 1;

  // Only mount a player for the active reel and its neighbor — use stable remote URL (no cache swap).
  const videoSource = isAdjacent ? videoUrl : null;

  return (
    <View style={[styles.reelContainer, { height: reelHeight, backgroundColor: "#000" }]}>
      {PeopleSheet}
      {!isDetailsOpen ? (
        <>
          <TouchableOpacity
            activeOpacity={1}
            onPress={triggerDoubleTapLike}
            onLongPress={() => triggerHaptic("light")}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          >
            <Animated.View
              style={{ width: "100%", height: "100%", transform: [{ scale: pinchScale }] }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {isAdjacent && videoSource ? (
                <SafeVideoPlayer
                  source={videoSource}
                  muted={feedMuted}
                  playing={isPlayed && isScreenFocused}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : null}
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

            {postMeta.photoTags && postMeta.photoTags.length > 0 && hasPositions && (
              <MediaPeopleOverlay
                photoTags={postMeta.photoTags}
                onTagPress={onTagPress}
                onOverflowPress={openSheet}
              />
            )}

            {postProducts.length > 0 ? (
              <PositionedProductTags
                storyLayers={postMeta.storyLayers}
                fallbackProducts={postProducts}
                canvasWidth={STORY_CANVAS_W}
                canvasHeight={STORY_CANVAS_H}
                onOpenProduct={openProduct}
              />
            ) : null}
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

          <LinearGradient
            colors={["transparent", "rgba(8, 4, 21, 0.85)"]}
            style={styles.gradientOverlay}
          />

          {/* Creator Metadata Overlay (Bottom Left) */}
          <View style={[styles.metaContainer, { bottom: floatingBottomOffset }]}>
            {/* Legacy photo tags */}
            {postMeta.photoTags && postMeta.photoTags.length > 0 && !hasPositions && (
              <View style={{ height: 32, marginBottom: 8, zIndex: 10 }}>
                <MediaPeopleOverlay
                  photoTags={postMeta.photoTags}
                  bottom={0}
                  left={0}
                  onTagPress={onTagPress}
                  onOverflowPress={openSheet}
                />
              </View>
            )}

            {/* Shop Now bar / sponsored CTA */}
            {!(item.type === "SPONSORED_AD" || item.sponsoredMetadata) ? (
              <ShopNowBar
                products={postProducts}
                onPress={() => postProducts[0] && openProduct(postProducts[0].productId)}
              />
            ) : (
              <TouchableOpacity
                style={[styles.ctaBannerRelative, { marginBottom: 10 }]}
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
                    const isCurrentUser = (item.profile?.username && item.profile?.username === activeProfile?.username) ||
                                          (item.profile?.id && item.profile?.id === activeProfile?.id) ||
                                          (item.user?.id && item.user?.id === currentUser?.id);
                    const logoUrl = isCurrentUser ? (activeProfile?.logo || currentUser?.avatar) : (item.profile?.logo || item.user?.avatar || item.maison?.logo);
                    if (logoUrl) {
                      return (
                        <Image source={{ uri: logoUrl }} style={{ width: "100%", height: "100%" }} placeholder="L184i9ofbHof00ayjZay~qj[ayof" transition={300} />
                      );
                    }
                    return (
                      <Text style={styles.avatarChar}>{(item.profile?.name || item.user?.name || "A")[0]?.toUpperCase()}</Text>
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
                      onCollabPress={() => postMeta.collab ? onPersonPress(postMeta.collab.username) : openSheet()}
                    />
                    {(item.type === "SPONSORED_AD" || item.sponsoredMetadata) && <Text style={styles.adTag}>Ad</Text>}
                  </View>
                  <TouchableOpacity style={styles.followBtn} onPress={() => triggerHaptic("medium")}>
                    <Text style={styles.followBtnText}>Follow</Text>
                  </TouchableOpacity>
                </View>
                {postMeta.isRepost && postMeta.repostOf && <RepostAttribution repostOf={postMeta.repostOf} theme="dark" />}
                <PostMetaRotator
                  location={item.content?.location || item.location}
                  audio={item.audioTrack ? `${item.audioTrack.title} · ${item.audioTrack.artist}` : item.music}
                  aiLabel={item.content?.aiLabel || item.aiLabel}
                />
              </View>
            </View>

            {/* Clickable caption to toggle details expansion screen */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => { triggerHaptic("medium"); setIsDetailsOpen(true); }} style={{ width: "100%" }}>
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
            </TouchableOpacity>
          </View>

          {/* Right Interaction Column */}
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

            {handleReshare && (
              <TouchableOpacity style={styles.iconButtonRow} onPress={() => handleReshare(item)}>
                <View style={styles.iconCircle}>
                  <Lucide name="repeat-outline" size={22} color="#fff" />
                </View>
                <Text style={styles.iconLabel}>{formatCompactNumber(displayReposts)}</Text>
              </TouchableOpacity>
            )}

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
        </>
      ) : (
        // === SHIFTED DETAILS SCREEN VIEW ===
        <View style={localStyles.shiftedContainer}>
          {/* Shrunken Video centered at the top */}
          <View style={localStyles.shrunkenVideoContainer}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => { triggerHaptic("medium"); setIsDetailsOpen(false); }}
              style={localStyles.shrunkenVideoWrapper}
            >
              {isAdjacent && videoSource ? (
                <SafeVideoPlayer
                  source={videoSource}
                  muted={feedMuted}
                  playing={isPlayed && isScreenFocused}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : null}
              {/* Tap to expand hint overlay */}
              <View style={localStyles.expandHintOverlay}>
                <Lucide name="expand-outline" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Details & Comments panel */}
          <View style={localStyles.detailsPanel}>
            <View style={localStyles.panelDragHandle} />

            {/* Author/Follow Row */}
            <View style={localStyles.panelHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={localStyles.panelAvatar}>
                  <Text style={localStyles.panelAvatarChar}>
                    {(item.profile?.name || item.user?.name || "A")[0]?.toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={localStyles.panelUsername}>{postMeta.authorUsername || "creator"}</Text>
                  <Text style={localStyles.panelLocation}>{item.content?.location || item.location || "Original Sound"}</Text>
                </View>
              </View>
              <TouchableOpacity style={localStyles.panelFollowBtn} onPress={() => triggerHaptic("medium")}>
                <Text style={localStyles.panelFollowText}>Follow</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={localStyles.panelScroll}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Full Caption */}
              <CaptionText
                caption={postMeta.caption || "No caption provided."}
                style={localStyles.panelCaption}
              />
              <Text style={localStyles.panelDate}>March 15 • See translation</Text>

              {/* Tagged accounts */}
              {postMeta.photoTags && postMeta.photoTags.length > 0 && (
                <View style={localStyles.taggedRow}>
                  <Lucide name="person" size={12} color="rgba(255,255,255,0.6)" />
                  <Text style={localStyles.taggedText}>
                    Tagged: {postMeta.photoTags.map((t: any) => `@${t.username || t.name}`).join(", ")}
                  </Text>
                </View>
              )}

              <View style={localStyles.divider} />

              {/* Comments Section */}
              <Text style={localStyles.commentsTitle}>Comments ({localComments.length})</Text>
              
              {localComments.length === 0 ? (
                <Text style={localStyles.noComments}>No comments yet. Start the conversation!</Text>
              ) : (
                localComments.map((comm) => (
                  <View key={comm.id} style={localStyles.commentItem}>
                    <View style={localStyles.commentAvatar}>
                      <Text style={localStyles.commentAvatarText}>
                        {comm.username[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={localStyles.commentUsername}>{comm.username}</Text>
                      <Text style={localStyles.commentText}>{comm.text}</Text>
                      <Text style={localStyles.commentTime}>{comm.time || "now"}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Bottom comment box input */}
            <View style={localStyles.commentInputRow}>
              <View style={localStyles.avatarMini}>
                <Text style={localStyles.avatarMiniText}>
                  {(activeProfile?.name || currentUser?.name || "U")[0]?.toUpperCase()}
                </Text>
              </View>
              <TextInput
                style={localStyles.commentInput}
                placeholder="What do you think of this?"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={commentText}
                onChangeText={setCommentText}
              />
              {commentText.trim().length > 0 && (
                <TouchableOpacity 
                  onPress={async () => {
                    const text = commentText.trim();
                    if (!text) return;
                    triggerHaptic("heavy");
                    setCommentText("");
                    // Add local representation immediately
                    const newComm = {
                      id: `temp_${Date.now()}`,
                      username: activeProfile?.username || currentUser?.email?.split("@")[0] || "user",
                      text,
                      time: "now"
                    };
                    setLocalComments(prev => [...prev, newComm]);
                    // Call API in background
                    try {
                      await addPostComment(item.id, currentUser?.id || "", text);
                    } catch {}
                  }}
                  style={localStyles.commentSendBtn}
                >
                  <Lucide name="arrow-up" size={16} color="#000" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
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
});

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
  ctaBannerRelative: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  ctaBannerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
});

const localStyles = StyleSheet.create({
  shiftedContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  shrunkenVideoContainer: {
    height: "30%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    backgroundColor: "#000",
  },
  shrunkenVideoWrapper: {
    height: 160,
    width: 90,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  expandHintOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    padding: 4,
  },
  detailsPanel: {
    height: "70%",
    backgroundColor: "#080415",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  panelDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginVertical: 10,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  panelAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fb923c",
    alignItems: "center",
    justifyContent: "center",
  },
  panelAvatarChar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  panelUsername: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  panelLocation: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 1,
  },
  panelFollowBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  panelFollowText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  panelScroll: {
    flex: 1,
  },
  panelCaption: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  panelDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    marginTop: 6,
  },
  taggedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    padding: 8,
  },
  taggedText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  divider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 14,
  },
  commentsTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  noComments: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    marginVertical: 20,
  },
  commentItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 12,
  },
  commentUsername: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "700",
  },
  commentText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  commentTime: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    marginTop: 4,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#080415",
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fb923c",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMiniText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
  },
  commentInput: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    paddingVertical: 6,
  },
  commentSendBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
