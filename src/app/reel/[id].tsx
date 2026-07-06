import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import Lucide from "@expo/vector-icons/Ionicons";
import { FeedCard } from "@/components/FeedCard";

const { height } = Dimensions.get("window");

export default function ReelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { triggerHaptic, products, currentUser } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const userIdQuery = currentUser?.id ? `?userId=${currentUser.id}` : "";
        const res = await fetch(`${API_HOST}/api/mobile/feed/post/${id}${userIdQuery}`);
        const data = await res.json();
        if (data.success && data.post) {
          setPost(data.post);
          setLikedPosts({ [data.post.id]: data.post.content?.liked || false });
          setSavedPosts({ [data.post.id]: data.post.content?.saved || false });
        } else {
          setError(data.error || "Reel not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reel");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, currentUser?.id]);

  const handleLike = (id: string) => {
    triggerHaptic("light");
    const nextLiked = !likedPosts[id];
    setLikedPosts({ [id]: nextLiked });
    
    if (currentUser?.id) {
      fetch(`${API_HOST}/api/mobile/feed/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          userId: currentUser.id,
          type: "like"
        })
      }).catch(() => {});
    }
  };

  const handleSave = (id: string) => {
    triggerHaptic("light");
    const nextSaved = !savedPosts[id];
    setSavedPosts({ [id]: nextSaved });
    
    if (currentUser?.id) {
      fetch(`${API_HOST}/api/mobile/feed/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          userId: currentUser.id
        })
      }).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00f5ff" />
        </View>
      ) : error ? (
        <SafeAreaView style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorBack} onPress={() => router.back()}>
            <Text style={styles.errorBackText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      ) : post ? (
        <View style={{ flex: 1 }}>
          <FeedCard
            item={post}
            index={0}
            activeReelIndex={0}
            isScreenFocused={true}
            feedMuted={false}
            products={products || []}
            likedPosts={likedPosts}
            savedPosts={savedPosts}
            floatingBottomOffset={0}
            reelHeight={height}
            handleMaisonProfilePress={() => {
              if (post.creator?.username) {
                router.push(`/profile/${post.creator.username}`);
              }
            }}
            handleLikePress={handleLike}
            handleCommentsPress={() => {}}
            handleShare={() => {}}
            handleSavePress={handleSave}
            handleThreeDotsPress={() => {}}
          />
          {/* Custom absolute back arrow on top of full-screen reel */}
          <TouchableOpacity 
            style={styles.backBtnAbsolute} 
            onPress={() => { triggerHaptic("light"); router.back(); }}
          >
            <Lucide name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    marginBottom: 16,
  },
  errorBack: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#00f5ff",
    borderRadius: 8,
  },
  errorBackText: {
    color: "#000",
    fontWeight: "bold",
  },
  backBtnAbsolute: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 999,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
