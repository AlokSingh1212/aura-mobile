import React, { useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { router } from "expo-router";
import { formatCompactNumber } from "@/constants/format";

const { height, width } = Dimensions.get("window");

export interface FeedCardProps {
  item: any;
  index: number;
  activeReelIndex: number;
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
  handleSavePress: (id: string) => void;
  handleThreeDotsPress: (item: any) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  item,
  index,
  activeReelIndex,
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
  handleSavePress,
  handleThreeDotsPress,
}) => {
  const { triggerHaptic, formatPrice } = useStore();
  const isPlayed = index === activeReelIndex;
  const isLiked = likedPosts[item.id] || false;

  const mockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4";
  const videoUrl = item.url && item.url.endsWith(".mp4") ? item.url : mockVideoUrl;

  // Optimize player resources: only initialize video player for the active or adjacent screens
  const isAdjacent = Math.abs(index - activeReelIndex) <= 1;
  const player = useVideoPlayer(isAdjacent ? videoUrl : null, (p) => {
    p.loop = true;
    p.muted = feedMuted;
    if (isPlayed) {
      p.play();
    } else {
      p.pause();
    }
  });

  // Sync mute setting dynamically
  useEffect(() => {
    player.muted = feedMuted;
  }, [feedMuted, player]);

  // Sync play/pause setting based on visibility
  useEffect(() => {
    if (isPlayed) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlayed, player]);

  return (
    <View style={[styles.reelContainer, { height: reelHeight }]}>
      {/* Fullscreen Video Loops */}
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

      {/* Floating Shoppable Card */}
      {(() => {
        const associatedProduct = item.artifact || products.find((p: any) => p.id === item.artifactId);
        if (!associatedProduct) return null;
        return (
          <TouchableOpacity 
            style={styles.shoppableCard}
            activeOpacity={0.9}
            onPress={() => {
              triggerHaptic("medium");
              router.push(`/product/${associatedProduct.id}` as any);
            }}
          >
            <View style={styles.shopIconContainer}>
              <Lucide name="sparkles" size={15} color="#000" />
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopSub}>Shop The Look</Text>
              <Text style={styles.shopTitle} numberOfLines={1}>{associatedProduct.title}</Text>
              <Text style={styles.shopPrice}>{formatPrice(associatedProduct.price)}</Text>
            </View>
            <Lucide name="chevron-forward" size={17} color="#00f5ff" />
          </TouchableOpacity>
        );
      })()}

      {/* Creator Metadata Overlay (Bottom Left) */}
      <View style={[styles.metaContainer, { bottom: floatingBottomOffset }]}>
        <View style={styles.creatorRow}>
          <TouchableOpacity onPress={() => handleMaisonProfilePress(item)} activeOpacity={0.85}>
            <View style={styles.avatar}>
              <Text style={styles.avatarChar}>
                {(item.profile?.name || item.user?.name || "A")[0]?.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.creatorDetails}>
            <View style={styles.nameFollowRow}>
              <TouchableOpacity 
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => handleMaisonProfilePress(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.creatorName} numberOfLines={1}>
                  {(item.profile?.name || item.user?.name || "aura_curator").toLowerCase().replace(/\s+/g, "")}
                </Text>
                <Text style={styles.saptashiText}>and saptashi...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.followBtn} onPress={() => triggerHaptic("medium")}>
                <Text style={styles.followBtnText}>Follow</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.audioTrackText} numberOfLines={1}>
              ↗ {item.audioTrack ? `${item.audioTrack.title} • ${item.audioTrack.artist}` : (item.location ? `A.R. Rahman, Vedang Raina • ${item.location}` : "AURA Luxury Runway Vol. 4")}
            </Text>
          </View>
        </View>
        <Text style={styles.caption} numberOfLines={2}>
          {item.caption || "Atelier Masterpiece"}
        </Text>
      </View>

      {/* Right Interaction Column (Likes, Comments, Share) */}
      <View style={[styles.interactionColumn, { bottom: floatingBottomOffset }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleLikePress(item.id)}>
          <View style={styles.iconCircle}>
            <Lucide name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ff3b30" : "#fff"} />
          </View>
          <Text style={styles.iconLabel}>
            {formatCompactNumber(item.likesCount ? (isLiked ? item.likesCount + 1 : item.likesCount) : 412)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => handleCommentsPress(item)}>
          <View style={styles.iconCircle}>
            <Lucide name="chatbubble-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.iconLabel}>
            {formatCompactNumber(item.comments?.length || 18)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => handleShare(item)}>
          <View style={styles.iconCircle}>
            <Lucide name="paper-plane-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.iconLabel}>Share</Text>
        </TouchableOpacity>

        {(() => {
          const isSaved = savedPosts[item.id] || false;
          return (
            <TouchableOpacity style={styles.iconButton} onPress={() => handleSavePress(item.id)}>
              <View style={styles.iconCircle}>
                <Lucide name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#00f5ff" : "#fff"} />
              </View>
              <Text style={styles.iconLabel}>Save</Text>
            </TouchableOpacity>
          );
        })()}

        <TouchableOpacity style={styles.iconButton} onPress={() => handleThreeDotsPress(item)}>
          <View style={styles.iconCircle}>
            <Lucide name="ellipsis-vertical" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
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
  shoppableCard: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.3)",
    padding: 10,
    borderRadius: 16,
    zIndex: 10,
  },
  shopIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  shopInfo: {
    flex: 1,
    marginLeft: 10,
  },
  shopSub: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  shopTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  shopPrice: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12.5,
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
    marginTop: 4,
  },
});
