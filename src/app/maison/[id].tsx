import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

export default function MaisonProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, triggerHaptic } = useStore();

  // Find all items belonging to this specific Maison
  const maisonProducts = products.filter(
    p => p.maisonId === id || p.maison?.id === id || (id === "rare_raven" && (!p.maisonId || p.maison?.id === "rare_raven"))
  );

  const maisonName = id === "rare_raven" ? "Rare Raven" : id ? id.replace(/-/g, " ").toUpperCase() : "AURAGRAM Maison";
  const initials = maisonName.substring(0, 2).toUpperCase();

  const handleProductPress = (itemId: string) => {
    triggerHaptic("light");
    router.push(`/product/${itemId}` as any);
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    return (
      <TouchableOpacity 
        style={styles.gridItem} 
        activeOpacity={0.9}
        onPress={() => handleProductPress(item.id)}
      >
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
        <View style={styles.gridInfo}>
          <Text style={styles.gridVibe}>{item.vibe || "Quiet Luxury"}</Text>
          <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.gridPrice}>₹{item.price?.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Nav Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => {
              triggerHaptic("light");
              router.back();
            }}
          >
            <Lucide name="chevron-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Maison Showroom</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Card Summary */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.maisonTitle}>{maisonName}</Text>
          <Text style={styles.directorName}>Director Curator</Text>

          {/* Maison Telemetry stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statVal}>{maisonProducts.length.toString().padStart(2, "0")}</Text>
              <Text style={styles.statLabel}>Active Looks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statVal}>9.8</Text>
              <Text style={styles.statLabel}>AuraGram Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statVal}>Active</Text>
              <Text style={styles.statLabel}>Node Status</Text>
            </View>
          </View>
        </View>

        {/* Maison Catalog Grid */}
        <View style={styles.catalogContainer}>
          <View style={styles.catalogHeader}>
            <Lucide name="apps" size={16} color="#00f5ff" />
            <Text style={styles.catalogSectionTitle}>Curated Collections</Text>
          </View>

          <FlatList
            data={maisonProducts.length > 0 ? maisonProducts : products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.rowWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{"No curated products sync'd by this director yet."}</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  navTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#080415",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,245,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#00f5ff",
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarText: {
    color: "#00f5ff",
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: 1,
  },
  maisonTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 2,
    marginTop: 16,
    textTransform: "uppercase",
  },
  directorName: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statCell: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statVal: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  catalogContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  catalogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 10,
    marginBottom: 16,
  },
  catalogSectionTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  rowWrapper: {
    justifyContent: "space-between",
  },
  listContent: {
    paddingBottom: 40,
    gap: 16,
  },
  gridItem: {
    width: (width - 44) / 2,
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  gridInfo: {
    padding: 12,
  },
  gridVibe: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  gridTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  gridPrice: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "300",
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    textAlign: "center",
  },
});
