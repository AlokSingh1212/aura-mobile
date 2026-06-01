import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Dimensions 
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import MainHeader from "@/components/MainHeader";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function CartScreen() {
  const { cart, removeFromCart, triggerHaptic, activeProfile, activeMaisonId } = useStore();
  const insets = useSafeAreaInsets();

  const handleRemove = (id: string) => {
    triggerHaptic("medium");
    removeFromCart(id);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% standard GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + (cart.length > 0 ? 1500 : 0); // 1500 shipping
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        <View style={styles.info}>
          <Text style={styles.maison} numberOfLines={1}>{item.maison?.name || "AURAGRAM Maison"}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>₹{item.price?.toLocaleString()}</Text>
        </View>

        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleRemove(item.id)}
          activeOpacity={0.8}
        >
          <Lucide name="trash-outline" size={19} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Reusable Brand MainHeader */}
        <MainHeader />

        {cart.length > 0 ? (
          <View style={styles.content}>
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            {/* Calculations Box */}
            <View style={[styles.summaryBox, { marginBottom: 52 + insets.bottom }]}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Subtotal</Text>
                <Text style={styles.rowVal}>₹{calculateSubtotal().toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Import Duty & GST (18%)</Text>
                <Text style={styles.rowVal}>₹{calculateTax().toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Secured Node Courier</Text>
                <Text style={styles.rowVal}>₹1,500</Text>
              </View>
              
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Casket Price</Text>
                <Text style={styles.totalVal}>₹{calculateTotal().toLocaleString()}</Text>
              </View>

              <TouchableOpacity 
                style={styles.checkoutBtn}
                activeOpacity={0.9}
                onPress={() => {
                  triggerHaptic("heavy");
                  alert("Securing customs clearance... transaction...");
                }}
              >
                <Text style={styles.checkoutText}>Authenticate Purchase</Text>
                <Lucide name="shield-checkmark" size={17} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="bag-handle-outline" size={48} color="rgba(255,255,255,0.06)" />
            <Text style={styles.emptyTitle}>Your casket is empty.</Text>
            <Text style={styles.emptySub}>Select elite curator artifacts from the atelier grid to lock down stock nodes.</Text>
          </View>
        )}

      </SafeAreaView>

      {/* 🏠 GLOBAL PERSISTENT Bottom Navigation tabs replica */}
      <View style={[styles.instagramBottomBar, { height: 52 + insets.bottom, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push("/"); }}>
          <Lucide name="home-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push({ pathname: "/", params: { activeTab: "reels" } } as any); }}>
          <Lucide name="film-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push({ pathname: "/", params: { openDMs: "true" } } as any); }}>
          <Lucide name="paper-plane-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push("/shop" as any); }}>
          <Lucide name="play-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push("/account"); }}>
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "#00f5ff", overflow: "hidden" }]}>
            {activeProfile?.logo ? (
              <Image 
                source={{ uri: activeProfile.logo }} 
                style={styles.profileTabImg} 
              />
            ) : (
              <View style={[styles.profileTabImg, { backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }]}>
                <Text style={{ color: "#000000", fontSize: 10, fontWeight: "bold" }}>{activeMaisonId[0]?.toUpperCase() || "A"}</Text>
              </View>
            )}
            <View style={styles.profileActiveIndicator} />
          </View>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  badge: {
    backgroundColor: "#00f5ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 12,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 14,
    resizeMode: "cover",
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  maison: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  price: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "300",
    marginTop: 4,
  },
  removeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  summaryBox: {
    backgroundColor: "#0b071e",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowVal: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "400",
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalVal: {
    color: "#00f5ff",
    fontSize: 18.5,
    fontWeight: "bold",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
  },
  checkoutText: {
    color: "#000",
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptySub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "400",
  },
  instagramBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 52,
    backgroundColor: "#080415",
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabBtn: {
    padding: 8,
  },
  profileTabCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: "relative",
  },
  profileTabImg: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  profileActiveIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
});
