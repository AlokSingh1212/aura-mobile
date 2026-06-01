import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart, triggerHaptic } = useStore();
  const [activeImg, setActiveImg] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Hydrate product from global ledger or fallback to mock matching web exactly
  const product = products.find(p => p.id === id) || {
    id: id || "1",
    title: "Heritage Calfskin Tote",
    price: 185000,
    vibe: "Quiet Luxury",
    maison: { name: "Rare Raven", id: "rare_raven" },
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1000"
    ],
    arMetadata: {
      "Category": "Fashion",
      "Subcategory": "Apparel",
      "Material": "100% Calfskin Handloom",
      "Size": "Medium",
      "SKU": "AR-9824A"
    }
  };

  const images = product.images && product.images.length > 0 ? product.images : [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000"
  ];

  const handleAcquire = () => {
    triggerHaptic("heavy");
    addToCart(product);
    Alert.alert(
      "Acquisition Initiated",
      "Artifact commissioned to your Shopping Casket successfully.",
      [
        { text: "View Casket", onPress: () => router.push("/cart" as any) },
        { text: "Continue Discoveries", style: "cancel" }
      ]
    );
  };

  const handleInstantAcquire = () => {
    triggerHaptic("success");
    addToCart(product);
    Alert.alert(
      "Instant Settlement Approved",
      "Neural ledger settled. Welcome to the lineage.",
      [{ text: "Track Order", onPress: () => router.push("/account" as any) }]
    );
  };

  const handleToggleWishlist = () => {
    triggerHaptic("medium");
    setIsFavorited(!isFavorited);
  };

  const specList = Object.entries(product.arMetadata || {}).map(([key, val]) => ({
    label: key,
    value: typeof val === "string" ? val : JSON.stringify(val)
  }));

  const maisonName = product.maison?.name || "Rare Raven";
  const maisonId = product.maison?.id || "rare_raven";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Cinematic Header Nav (Parity with web nav bar style) */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.circleBtn}
            onPress={() => {
              triggerHaptic("light");
              router.back();
            }}
          >
            <Lucide name="arrow-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{product.title}</Text>
          <View style={styles.navRight}>
            <TouchableOpacity 
              style={[styles.circleBtn, isFavorited && styles.favActive]}
              onPress={handleToggleWishlist}
            >
              <Lucide name="heart" size={21} color={isFavorited ? "#ff3366" : "#fff"} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Visual Gallery Segment (Mirrors web detail stick visual layout) */}
          <View style={styles.galleryContainer}>
            <Image source={{ uri: images[activeImg] }} style={styles.galleryMainImg} />
            <View style={styles.galleryThumbnailsRow}>
              {images.map((img: string, idx: number) => {
                const isActive = activeImg === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.thumbBtn, isActive && styles.thumbBtnActive]}
                    onPress={() => {
                      triggerHaptic("light");
                      setActiveImg(idx);
                    }}
                  >
                    <Image source={{ uri: img }} style={styles.thumbImg} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Narrative & Acquisition Column Panel */}
          <View style={styles.narrativeContainer}>
            {/* Breadcrumb row */}
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbText}>{maisonName.toUpperCase()}</Text>
              <Lucide name="chevron-forward" size={11} color="rgba(255,255,255,0.2)" />
              <Text style={styles.breadcrumbText}>{(product.vibe || "CURATED").toUpperCase()}</Text>
              <Lucide name="chevron-forward" size={11} color="rgba(255,255,255,0.2)" />
              <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>{product.title.toUpperCase()}</Text>
            </View>

            {/* Neural Vibe Tag */}
            <View style={styles.headerRow}>
              <View style={styles.vibeBadge}>
                <Lucide name="sparkles" size={14} color="#00f5ff" style={styles.vibeSparkle} />
                <Text style={styles.vibeText}>Neural Vibe: {product.vibe}</Text>
              </View>
              <Text style={styles.serialText}>Serial: {product.id.substring(0, 8).toUpperCase()}-AURAGRAM</Text>
            </View>

            {/* Store & Title */}
            <View style={styles.titleBlock}>
              <TouchableOpacity onPress={() => router.push(`/maison/${maisonId}` as any)} style={styles.maisonRow}>
                <Lucide name="ribbon" size={17} color="#00f5ff" />
                <Text style={styles.maisonLabel}>Maison: {maisonName}</Text>
              </TouchableOpacity>
              <Text style={styles.luxuryHeading}>{product.title}</Text>

              {/* Star Rating Display */}
              <View style={styles.ratingRow}>
                <View style={styles.starsBox}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Lucide key={s} name="star" size={15} color="#D4AF37" style={styles.starIcon} />
                  ))}
                </View>
                <Text style={styles.ratingScore}>5.0/5</Text>
                <Text style={styles.reviewCount}>(24 reviews)</Text>
              </View>
            </View>

            {/* Price & AuraGram score matrices */}
            <View style={styles.matricesRow}>
              <View style={styles.matrixCell}>
                <Text style={styles.matrixLabel}>Acquisition Price</Text>
                <Text style={styles.matrixVal}>₹{product.price?.toLocaleString()}</Text>
              </View>
              <View style={styles.matrixCell}>
                <Text style={styles.matrixLabel}>AuraGram Score</Text>
                <View style={styles.auragramBox}>
                  <Lucide name="flash" size={19} color="#00f5ff" />
                  <Text style={styles.auragramVal}>9.8</Text>
                </View>
              </View>
            </View>

            {/* Urgency ticker */}
            <View style={styles.urgencyBox}>
              <View style={styles.urgencyDot} />
              <Text style={styles.urgencyText}>12 Discerning Collectors are currently viewing this node</Text>
            </View>

            {/* Neural Narrative Glass Box (Cursive Italics Web Parity) */}
            <View style={styles.glassPanel}>
              <View style={styles.glassHeader}>
                <View style={styles.glassDot} />
                <Text style={styles.glassTitle}>Neural Narrative Engine</Text>
              </View>
              <Text style={styles.glassQuote}>
                {"\"Synthesized from hand-selected materials, this artifact embodies a dialogue between mid-century brutalism and futuristic utility. Each piece is cryptographically unique, ensuring your selection remains one-of-one in the global discovery ledger.\""}
              </Text>
            </View>

            {/* Product Specifications Matrix */}
            <View style={styles.specsSection}>
              <View style={styles.sectionHeader}>
                <Lucide name="cube" size={17} color="#00f5ff" />
                <Text style={styles.sectionTitle}>Product Specifications</Text>
              </View>
              
              <View style={styles.specsGrid}>
                {specList.map((spec, idx) => (
                  <View key={idx} style={styles.specRow}>
                    <Text style={styles.specLabel}>{spec.label}</Text>
                    <Text style={styles.specValue}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fulfillment Trust Node badges */}
            <View style={styles.fulfillmentGrid}>
              <View style={styles.fulfillBox}>
                <Lucide name="cube-outline" size={23} color="#00f5ff" />
                <View>
                  <Text style={styles.fulfillTitle}>Free Express Delivery</Text>
                  <Text style={styles.fulfillDesc}>Get it in 2 business days</Text>
                </View>
              </View>
              <View style={styles.fulfillBox}>
                <Lucide name="reload" size={21} color="#00f5ff" />
                <View>
                  <Text style={styles.fulfillTitle}>7-Day Easy Returns</Text>
                  <Text style={styles.fulfillDesc}>Industrial Grade Guarantee</Text>
                </View>
              </View>
            </View>

            {/* Trust Node Bullet points */}
            <View style={styles.trustGrid}>
              <View style={styles.trustCard}>
                <Lucide name="checkmark-circle" size={23} color="#00f5ff" />
                <Text style={styles.trustTitle}>Verified Authenticity</Text>
                <Text style={styles.trustDesc}>Verified by AURAGRAM Neural Ledger. Certificate included.</Text>
              </View>
              <View style={styles.trustCard}>
                <Lucide name="globe" size={23} color="#00f5ff" />
                <Text style={styles.trustTitle}>Global Escrow</Text>
                <Text style={styles.trustDesc}>Funds held in secure AURAGRAM portal until artifact arrival.</Text>
              </View>
            </View>

            {/* Premium Checkout Pill Actions */}
            <View style={styles.checkoutActions}>
              <TouchableOpacity 
                style={styles.primaryAcquireBtn}
                activeOpacity={0.95}
                onPress={handleAcquire}
              >
                <Lucide name="basket" size={21} color="#000" />
                <Text style={styles.primaryAcquireText}>Acquire Artifact</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryAcquireBtn}
                activeOpacity={0.9}
                onPress={handleInstantAcquire}
              >
                <Lucide name="finger-print" size={21} color="#00f5ff" />
                <View>
                  <Text style={styles.secLabel}>1-Click</Text>
                  <Text style={styles.secVal}>Instant Acquisition</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415", // Brand black website color exact copy
  },
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  favActive: {
    borderColor: "rgba(255,51,102,0.2)",
    backgroundColor: "rgba(255,51,102,0.05)",
  },
  navTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
  },
  navRight: {
    flexDirection: "row",
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  galleryContainer: {
    width: width,
    height: 420,
    backgroundColor: "#080415",
    position: "relative",
  },
  galleryMainImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  galleryThumbnailsRow: {
    position: "absolute",
    bottom: 20,
    left: 24,
    flexDirection: "row",
    gap: 10,
  },
  thumbBtn: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    opacity: 0.5,
  },
  thumbBtnActive: {
    borderColor: "#00f5ff",
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  narrativeContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  breadcrumbText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11.5,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  breadcrumbActive: {
    color: "#00f5ff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vibeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  vibeSparkle: {
    marginRight: 2,
  },
  vibeText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serialText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  titleBlock: {
    marginTop: 18,
  },
  maisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  maisonLabel: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  luxuryHeading: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginTop: 8,
    lineHeight: 38,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  starsBox: {
    flexDirection: "row",
  },
  starIcon: {
    marginRight: 1,
  },
  ratingScore: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  reviewCount: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
  },
  matricesRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 36,
  },
  matrixCell: {
    flex: 1,
  },
  matrixLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matrixVal: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  auragramBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  auragramVal: {
    color: "#00f5ff",
    fontSize: 24,
    fontWeight: "bold",
  },
  urgencyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.1)",
    padding: 12,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00f5ff",
  },
  urgencyText: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  glassPanel: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 24,
    borderRadius: 32,
    marginTop: 28,
  },
  glassHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  glassDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#00f5ff",
  },
  glassTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  glassQuote: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16.5,
    fontStyle: "italic",
    lineHeight: 22,
  },
  specsSection: {
    marginTop: 32,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 32,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingBottom: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  specsGrid: {
    gap: 8,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    paddingVertical: 10,
  },
  specLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specValue: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  fulfillmentGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  fulfillBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  fulfillTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fulfillDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 2,
  },
  trustGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  trustCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  trustTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trustDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11.5,
    lineHeight: 12,
  },
  checkoutActions: {
    marginTop: 36,
    gap: 12,
  },
  primaryAcquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 32,
    gap: 8,
  },
  primaryAcquireText: {
    color: "#000",
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  secondaryAcquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 14,
    borderRadius: 32,
    gap: 8,
  },
  secLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secVal: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
