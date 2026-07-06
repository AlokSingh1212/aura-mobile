import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import Lucide from "@expo/vector-icons/Ionicons";
import { HomeFeedPostCard } from "@/components/HomeFeedPostCard";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { triggerHaptic, products, currentUser } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

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
          setLiked(data.post.content?.liked || false);
          setSaved(data.post.content?.saved || false);
          setLikesCount(data.post.content?.likesCount || 0);
          setCommentsCount(data.post.content?.commentsCount || 0);
        } else {
          setError(data.error || "Post not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, currentUser?.id]);

  const handleLike = () => {
    triggerHaptic("light");
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));
    
    // Fire api call to toggle like
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

  const handleSave = () => {
    triggerHaptic("light");
    const nextSaved = !saved;
    setSaved(nextSaved);
    
    // Fire api call to toggle save
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); router.back(); }}>
          <Lucide name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00f5ff" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : post ? (
        <ScrollView style={styles.scroll}>
          <HomeFeedPostCard
            item={post}
            products={products || []}
            isLiked={liked}
            isSaved={saved}
            likesCount={likesCount}
            commentsCount={commentsCount}
            sharesCount={post.content?.sharesCount || 0}
            repostsCount={post.content?.repostsCount || 0}
            onLike={handleLike}
            onSave={handleSave}
            onComment={() => {}}
            onShare={() => {}}
            onThreeDots={() => {}}
          />
        </ScrollView>
      ) : null}
    </SafeAreaView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scroll: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
  },
});
