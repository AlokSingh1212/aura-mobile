import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";

interface ThreadPost {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    isElite: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  taggedProduct?: {
    id: string;
    title: string;
    price: string;
    image: string;
  };
}

const INITIAL_THREADS: ThreadPost[] = [
  {
    id: "t1",
    author: {
      name: "Alok Singh",
      username: "alok_luxury",
      avatar: "A",
      isElite: true,
    },
    content: "Just finalized the limited run of our new Heritage Calfskin Tote. Sourced from organic Italian tanneries, hand-stitched in Milan. Dropping exactly 15 pieces tomorrow at 5 PM IST. Private access codes are dispatching now.",
    timestamp: "2h ago",
    likes: 42,
    replies: 8,
    taggedProduct: {
      id: "1",
      title: "Heritage Calfskin Tote",
      price: "₹2,84,000",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500"
    }
  },
  {
    id: "t2",
    author: {
      name: "Elena Rostova",
      username: "elena_couture",
      avatar: "E",
      isElite: true,
    },
    content: "Quiet luxury is not about being invisible; it's about being unforgettable. Wearing the Gilded Obsidian Cuff from Ancient Modern. Cryptographic ownership verified on the AURA Ledger. ✨",
    timestamp: "4h ago",
    likes: 128,
    replies: 24,
    taggedProduct: {
      id: "6",
      title: "Gilded Obsidian Cuff",
      price: "₹4,28,000",
      image: "https://images.unsplash.com/photo-1611085583191-a3b1a3a355db?w=500"
    }
  },
  {
    id: "t3",
    author: {
      name: "Marcus Vane",
      username: "marcus_cyber",
      avatar: "M",
      isElite: false,
    },
    content: "Who managed to secure the Neural Network Sneaker drop yesterday? The AI synthesis workflow generated some absolutely insane geometric patterns on the sole. Fits like a glove.",
    timestamp: "1d ago",
    likes: 95,
    replies: 12,
    taggedProduct: {
      id: "5",
      title: "Neural Network Sneaker",
      price: "₹1,20,000",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500"
    }
  }
];

export default function ThreadsHubScreen() {
  const router = useRouter();
  const triggerHaptic = useStore((state) => state.triggerHaptic);
  const [threads, setThreads] = useState<ThreadPost[]>(INITIAL_THREADS);
  const [newPostText, setNewPostText] = useState("");

  const handlePost = () => {
    if (!newPostText.trim()) return;
    triggerHaptic("success");

    const newPost: ThreadPost = {
      id: `t_${Date.now()}`,
      author: {
        name: "You",
        username: "curator_elite",
        avatar: "Y",
        isElite: true,
      },
      content: newPostText,
      timestamp: "Just now",
      likes: 0,
      replies: 0,
    };

    setThreads([newPost, ...threads]);
    setNewPostText("");
  };

  const handleLike = (id: string) => {
    triggerHaptic("light");
    setThreads(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, likes: t.likes + 1 };
      }
      return t;
    }));
  };

  const renderItem = ({ item }: { item: ThreadPost }) => (
    <View style={styles.postCard}>
      {/* Author Row */}
      <View style={styles.authorRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.author.avatar}</Text>
        </View>
        <View style={styles.authorMeta}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.authorName}>{item.author.name}</Text>
            {item.author.isElite && (
              <View style={styles.eliteBadge}>
                <Lucide name="shield-checkmark" size={10} color="#000" />
              </View>
            )}
          </View>
          <Text style={styles.authorUsername}>@{item.author.username}</Text>
        </View>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Tagged Product Box */}
      {item.taggedProduct && (
        <TouchableOpacity 
          style={styles.productTagBox}
          activeOpacity={0.9}
          onPress={() => {
            triggerHaptic("medium");
            // Direct PDP lookup routing
            router.push(`/product/${item.taggedProduct?.id}` as any);
          }}
        >
          <Image source={{ uri: item.taggedProduct.image }} style={styles.productImage} />
          <View style={styles.productDetails}>
            <Text style={styles.productTitle}>{item.taggedProduct.title}</Text>
            <Text style={styles.productPrice}>{item.taggedProduct.price}</Text>
          </View>
          <View style={styles.buyButton}>
            <Text style={styles.buyButtonText}>ACQUIRE</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
          <Lucide name="heart-outline" size={18} color="#888" />
          <Text style={styles.actionCount}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Lucide name="chatbubble-outline" size={16} color="#888" />
          <Text style={styles.actionCount}>{item.replies}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Lucide name="share-social-outline" size={16} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { triggerHaptic("medium"); router.back(); }}>
          <Lucide name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>THREADS HUB</Text>
          <Text style={styles.headerSubtitle}>Decentralized luxury curation streams</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Stream list */}
      <FlatList
        data={threads}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input composer bar */}
      <View style={styles.composerBar}>
        <TextInput
          style={styles.input}
          placeholder="Share an exclusive design thought..."
          placeholderTextColor="#666"
          value={newPostText}
          onChangeText={setNewPostText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.postButton, !newPostText.trim() && styles.postButtonDisabled]} 
          onPress={handlePost}
          disabled={!newPostText.trim()}
        >
          <Lucide name="paper-plane" size={16} color="#000" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  header: {
    height: 70,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: "#d4af37",
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: "uppercase",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  postCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.1)",
    borderWidth: 1,
    borderColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#d4af37",
    fontSize: 14,
    fontWeight: "bold",
  },
  authorMeta: {
    flex: 1,
    marginLeft: 12,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  eliteBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  authorUsername: {
    color: "#666",
    fontSize: 10,
    marginTop: 1,
  },
  timestamp: {
    color: "#444",
    fontSize: 10,
  },
  postContent: {
    color: "#eee",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  productTagBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 8,
    marginBottom: 12,
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  productPrice: {
    color: "#d4af37",
    fontSize: 10,
    marginTop: 2,
  },
  buyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#d4af37",
    borderRadius: 8,
  },
  buyButtonText: {
    color: "#000",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.02)",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionCount: {
    color: "#666",
    fontSize: 11,
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#0c081e",
    padding: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 12,
    maxHeight: 100,
  },
  postButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: {
    backgroundColor: "#222",
    opacity: 0.5,
  },
});
