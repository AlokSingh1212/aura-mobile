import React, { useEffect, useRef, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator,
  Share,
  Alert
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";

const { height, width } = Dimensions.get("window");

export default function ReelsScreen() {
  const { stories, loadingFeed, fetchFeed, addToCart, triggerHaptic } = useStore();
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLikePress = () => {
    triggerHaptic("heavy");
    Alert.alert("Liked Curation", "Syndicated validation broadcast to global mesh.");
  };

  const handleShare = async (item: any) => {
    triggerHaptic("light");
    try {
      await Share.share({
        message: `Observe AURA Sovereign Curation: ${item.caption || "Atelier masterpiece"}.`,
      });
    } catch (error) {
      console.warn("Share error:", error);
    }
  };

  const renderReelItem = ({ item, index }: { item: any; index: number }) => {
    const isPlayed = index === activeStoryIndex;
    const mockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4";
    const videoUrl = item.url && item.url.endsWith(".mp4") ? item.url : mockVideoUrl;

    return (
      <View style={styles.reelContainer}>
        {/* Fullscreen Video Loops */}
        <Video
          source={{ uri: videoUrl }}
          rate={1.0}
          volume={1.0}
          isMuted={true}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlayed}
          isLooping
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.gradientOverlay} />

        {/* Floating Shoppable Card (Top Left) */}
        {item.artifact && (
          <TouchableOpacity 
            style={styles.shoppableCard}
            activeOpacity={0.9}
            onPress={() => addToCart(item.artifact)}
          >
            <View style={styles.shopIconContainer}>
              <Lucide name="sparkles" size={14} color="#000" />
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopSub}>Shop The Look</Text>
              <Text style={styles.shopTitle} numberOfLines={1}>{item.artifact.title}</Text>
              <Text style={styles.shopPrice}>₹{item.artifact.price?.toLocaleString()}</Text>
            </View>
            <Lucide name="chevron-forward" size={14} color="#d4af37" />
          </TouchableOpacity>
        )}

        {/* Creator Metadata (Bottom Left) */}
        <View style={styles.metaContainer}>
          <View style={styles.creatorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarChar}>
                {item.user?.name?.[0]?.toUpperCase() || "S"}
              </Text>
            </View>
            <View>
              <Text style={styles.creatorName}>{item.user?.name || "Sovereign Merchant"}</Text>
              {item.location && <Text style={styles.location}>📍 {item.location}</Text>}
            </View>
          </View>
          <Text style={styles.caption} numberOfLines={2}>
            "{item.caption || "A creative exhibition broadcasting our lineage details. Direct private inquiries welcome."}"
          </Text>
        </View>

        {/* Right Interaction Column (Likes, Comments, Share) */}
        <View style={styles.interactionColumn}>
          <TouchableOpacity style={styles.iconButton} onPress={handleLikePress}>
            <View style={styles.iconCircle}>
              <Lucide name="heart" size={20} color="#fff" />
            </View>
            <Text style={styles.iconLabel}>{item.likesCount || 142}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => triggerHaptic("light")}>
            <View style={styles.iconCircle}>
              <Lucide name="chatbubble-ellipses" size={20} color="#fff" />
            </View>
            <Text style={styles.iconLabel}>{item.comments?.length || 18}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleShare(item)}>
            <View style={styles.iconCircle}>
              <Lucide name="paper-plane" size={20} color="#fff" />
            </View>
            <Text style={styles.iconLabel}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const simulatedStories = [
    { id: "s1", url: "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40149-large.mp4", caption: "Premium Avant-Garde curations for selected nodes.", likesCount: 412, comments: [1,2,3], user: { name: "Gucci Atelier" }, artifact: { title: "Obsidian Gold Vestment", price: 185000 } },
    { id: "s2", url: "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4", caption: "Bespoke fabrics handpicked in Bengaluru flagships.", likesCount: 654, comments: [1,2], user: { name: "Alok Maison" }, artifact: { title: "Atelier Silk Drape Jacket", price: 245000 } }
  ];

  const displayStories = stories.length > 0 ? stories : simulatedStories;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveStoryIndex(viewableItems[0].index || 0);
      triggerHaptic("light");
    }
  }).current;

  return (
    <View style={styles.container}>
      {loadingFeed ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      ) : (
        <FlatList
          data={displayStories}
          renderItem={renderReelItem}
          keyExtractor={(item) => item.id}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 75 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reelContainer: {
    width: width,
    height: height,
    position: "relative",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  shoppableCard: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    padding: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  shopIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  shopSub: {
    color: "#d4af37",
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  shopTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  shopPrice: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  metaContainer: {
    position: "absolute",
    bottom: BottomTabInset + 100,
    left: 20,
    right: 80,
    zIndex: 10,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#d4af37",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarChar: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 13,
  },
  creatorName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  location: {
    color: "#d4af37",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  caption: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  interactionColumn: {
    position: "absolute",
    bottom: BottomTabInset + 100,
    right: 20,
    alignItems: "center",
    gap: 20,
    zIndex: 10,
  },
  iconButton: {
    alignItems: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
