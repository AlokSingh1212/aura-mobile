import React, { useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { BottomTabInset } from "@/constants/theme";
import Lucide from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

export default function HomeScreen() {
  const { products, loadingProducts, fetchProducts, addToCart } = useStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const renderProductItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <View style={styles.vibeBadge}>
            <Text style={styles.vibeText}>{item.vibe || "Luxury"}</Text>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.price}>
            ₹{item.price?.toLocaleString() || "Price on Request"}
          </Text>
          
          <TouchableOpacity 
            style={styles.buyButton} 
            activeOpacity={0.8}
            onPress={() => addToCart(item)}
          >
            <Lucide name="sparkles-sharp" size={10} color="#000" style={styles.sparkle} />
            <Text style={styles.buyButtonText}>Acquire Look</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const simulatedProducts = [
    { id: "p1", title: "Obsidian Gold Vestment", price: 185000, vibe: "Avant-Garde", images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"] },
    { id: "p2", title: "Helios Gold Chronograph", price: 620000, vibe: "Timeless", images: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=600"] },
    { id: "p3", title: "Atelier Silk Drape Jacket", price: 245000, vibe: "Sartorial", images: ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600"] },
    { id: "p4", title: "Carrara Marble Signet", price: 120000, vibe: "Minimalist", images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600"] }
  ];

  const displayProducts = products.length > 0 ? products : simulatedProducts;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Sovereign Protocol</Text>
            <Text style={styles.headerTitle}>AURA ATELIER</Text>
          </View>
          <TouchableOpacity style={styles.nodeStatus}>
            <View style={styles.activeDot} />
            <Text style={styles.nodeText}>Node Active</Text>
          </TouchableOpacity>
        </View>

        {loadingProducts ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#d4af37" />
          </View>
        ) : (
          <FlatList
            data={displayProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030303",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerSub: {
    color: "#d4af37",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 4,
    marginTop: 2,
  },
  nodeStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212,175,55,0.1)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d4af37",
    marginRight: 6,
  },
  nodeText: {
    color: "#d4af37",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: BottomTabInset + 40,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: "#070707",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    marginHorizontal: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  vibeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vibeText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  price: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  sparkle: {
    marginRight: 4,
  },
  buyButtonText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
