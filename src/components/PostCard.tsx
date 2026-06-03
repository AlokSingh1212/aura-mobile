import React, { useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";

export interface PostCardProps {
  item: any;
  currentMaisonName: string;
  feedMuted: boolean;
  setFeedMuted: (val: boolean) => void;
  likedPosts: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  handleMaisonProfilePress: (item: any) => void;
  handleLikePress: (id: string) => void;
  handleCommentsPress: (item: any) => void;
  handleShare: (item: any) => void;
  handleSavePress: (id: string) => void;
  handleThreeDotsPress: (item: any) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  item,
  currentMaisonName,
  feedMuted,
  setFeedMuted,
  likedPosts,
  savedPosts,
  handleMaisonProfilePress,
  handleLikePress,
  handleCommentsPress,
  handleShare,
  handleSavePress,
  handleThreeDotsPress,
}) => {
  const { triggerHaptic } = useStore();
  const isLiked = likedPosts[item.id] || false;
  const isSaved = savedPosts[item.id] || false;

  const mockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4";
  const videoUrl = item.url && item.url.endsWith(".mp4") ? item.url : mockVideoUrl;

  const player = useVideoPlayer(item.isVideo ? videoUrl : null, (p) => {
    p.loop = true;
    p.muted = feedMuted;
    p.play();
  });

  useEffect(() => {
    player.muted = feedMuted;
  }, [feedMuted, player]);

  const img = item.url || item.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";

  return (
    <View style={styles.photoCard}>
      <View style={styles.photoCardHeader}>
        <TouchableOpacity 
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          onPress={() => handleMaisonProfilePress(item)}
          activeOpacity={0.85}
        >
          <View style={styles.photoCardAvatar}>
            <Text style={{ color: "#000", fontSize: 13, fontWeight: "bold" }}>
              {item.user?.name === "Alok Maison" ? currentMaisonName[0]?.toUpperCase() : (item.user?.name?.[0]?.toUpperCase() || "S")}
            </Text>
          </View>
          <View>
            <Text style={styles.photoCardAuthor}>
              {item.user?.name === "Alok Maison" ? currentMaisonName : (item.user?.name || "Gucci Atelier")}
            </Text>
            <Text style={styles.photoCardSubtitle}>Quiet Luxury Node</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleThreeDotsPress(item)}>
          <Lucide name="ellipsis-horizontal" size={19} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      {item.isVideo ? (
        <View style={{ position: "relative" }}>
          <VideoView
            player={player}
            style={styles.photoCardImage}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
          <TouchableOpacity 
            style={styles.feedVolumeBtn} 
            onPress={() => {
              triggerHaptic("light");
              setFeedMuted(!feedMuted);
            }}
          >
            <Lucide name={feedMuted ? "volume-mute" : "volume-high"} size={19} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <Image source={{ uri: img }} style={styles.photoCardImage} />
      )}

      <View style={styles.photoCardActions}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity onPress={() => handleLikePress(item.id)}>
            <Lucide name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ff3b30" : "#fff"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCommentsPress(item)}>
            <Lucide name="chatbubble-outline" size={23} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)}>
            <Lucide name="paper-plane-outline" size={23} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleSavePress(item.id)}>
          <Lucide name={isSaved ? "bookmark" : "bookmark-outline"} size={23} color={isSaved ? "#00f5ff" : "#fff"} />
        </TouchableOpacity>
      </View>

      <Text style={styles.photoCardLikes}>{item.likesCount ? (isLiked ? item.likesCount + 1 : item.likesCount) : 104} likes</Text>
      <Text style={styles.photoCardCaption}>
        <Text style={{ fontWeight: "bold" }}>{item.user?.name?.toLowerCase().replace(/\s+/g, "") || "gucci"} </Text>
        {item.caption || "Atelier Masterpiece Collection."}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  photoCard: {
    backgroundColor: "#0d0a1b",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20,
    overflow: "hidden",
    paddingBottom: 16,
  },
  photoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photoCardAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCardAuthor: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  photoCardSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },
  photoCardImage: {
    width: "100%",
    height: 380,
  },
  feedVolumeBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  photoCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photoCardLikes: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13.5,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  photoCardCaption: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13.5,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
