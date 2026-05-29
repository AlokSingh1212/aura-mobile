import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  ScrollView,
  TextInput
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import MainHeader from "@/components/MainHeader";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

const CATEGORY_ITEMS = [
  { name: "For You", icon: "sparkles", query: "For You" },
  { name: "Fashion", icon: "shirt", query: "Fashion" },
  { name: "Mobiles", icon: "phone-portrait", query: "Mobiles" },
  { name: "Beauty", icon: "flower", query: "Beauty" },
  { name: "Electronics", icon: "laptop", query: "Electronics" },
  { name: "Home", icon: "home", query: "Home" },
  { name: "Appliances", icon: "tv", query: "Appliances" },
  { name: "Toys", icon: "body", query: "Toys" },
  { name: "Food", icon: "fast-food", query: "Food" },
  { name: "Auto", icon: "car", query: "Auto" },
  { name: "2 Wheelers", icon: "bicycle", query: "2 Wheelers" },
  { name: "Sports", icon: "football", query: "Sports" },
  { name: "Books", icon: "book", query: "Books" },
  { name: "Furniture", icon: "construct", query: "Furniture" }
];

const HERO_SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200",
    title: "THE SOVEREIGN",
    subtitle: "DISCOVERY NODE",
    desc: "Our algorithm synthesizes global craftsmanship with your aesthetic node, curating artifacts that transcend mere possession.",
    link: "/maison/alok-maison"
  },
  {
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200",
    title: "BRUTALIST MINIMAL",
    subtitle: "ARCHITECTURAL ELEMENTS",
    desc: "Raw concrete structures, hand-worked obsidian cuffs, and brutalist cuts that establish weight and authority.",
    link: "/maison/alok-maison"
  },
  {
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1200",
    title: "TECHNO-HERITAGE",
    subtitle: "NEURAL CRAFTSMANSHIP",
    desc: "Synchronizing liquid digital meshes with classic calfskin weaves to architect the ultimate modern carryalls.",
    link: "/maison/alok-maison"
  }
];

export default function ShopScreen() {
  const { products, loadingProducts, fetchProducts, addToCart, triggerHaptic, activeMaisonId } = useStore();
  const currentMaisonName = activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("For You");
  const [searchQuery, setSearchQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Looping Hero Slider every 6 seconds - exact replica of website logic
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleCategoryPress = (categoryName: string) => {
    triggerHaptic("light");
    setSelectedCategory(categoryName);
  };

  const handleProductAcquire = (item: any) => {
    triggerHaptic("heavy");
    addToCart(item);
  };

  const handleProductPress = (item: any) => {
    triggerHaptic("medium");
    router.push(`/product/${item.id}` as any);
  };

  const handleMaisonPress = (maisonId: string) => {
    triggerHaptic("light");
    router.push(`/maison/${maisonId}` as any);
  };

  const handleExploreHero = (link: string) => {
    triggerHaptic("medium");
    if (link === "/maison/alok-maison") {
      router.push(`/maison/${activeMaisonId}` as any);
    } else {
      router.push(link as any);
    }
  };

  const displayProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "For You" || (p.type || p.category || "Fashion").toLowerCase() === selectedCategory.toLowerCase();
    
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (p.title || "").toLowerCase().includes(q) || 
      (p.vibe || "").toLowerCase().includes(q) || 
      (p.type || p.category || "").toLowerCase().includes(q) || 
      (p.maison?.name || "").toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const highAuraProducts = products.filter(p => (p.auraScore || p.aura || 9.0) >= 9.5);

  const renderProductItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    const maisonName = item.maison?.name || "Rare Raven";
    const targetMaisonId = item.maison?.id || "rare_raven";
    const auraScore = item.auraScore || item.aura || 9.8;
    const rating = item.rating || 4.9;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => handleProductPress(item)}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          {/* Top-Left Aura Tag bubble identical to website */}
          <View style={styles.auraBadge}>
            <Lucide name="flash" size={12} color="#00f5ff" />
            <Text style={styles.auraScoreText}>{auraScore}</Text>
          </View>

          {/* Quick acquisition action overlay button */}
          <TouchableOpacity 
            style={styles.quickAcquireCircle} 
            activeOpacity={0.8}
            onPress={() => handleProductAcquire(item)}
          >
            <Lucide name="bag-handle" size={17} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <TouchableOpacity onPress={() => handleMaisonPress(targetMaisonId)}>
            <View style={styles.maisonRow}>
              <Lucide name="medal" size={13} color="#00f5ff" />
              <Text style={styles.maisonText} numberOfLines={1}>
                {maisonName}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.price}>
            ₹{item.price?.toLocaleString() || "Price on Request"}
          </Text>

          {/* Vibe and Star Rating Row */}
          <View style={styles.detailsDividerRow}>
            <View style={styles.vibeBox}>
              <Lucide name="sparkles" size={13} color="#00f5ff" />
              <Text style={styles.vibeLabelText}>{item.vibe || "Quiet Luxury"}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Lucide name="star" size={13} color="#00f5ff" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const activeSlide = HERO_SLIDES[heroIndex];

  // Header Elements structured exactly like the website's components
  const renderHeader = () => (
    <View style={styles.headerLayout}>
      {/* 🚀 THE APEX: Algorithmic Hero Slider */}
      <View style={styles.heroSection}>
        <Image source={{ uri: activeSlide.img }} style={styles.heroImg} />
        <View style={styles.heroGradient} />

        <View style={styles.heroCaptionBox}>
          <Text style={styles.heroSubtitle}>{activeSlide.subtitle}</Text>
          <Text style={styles.heroTitle}>{activeSlide.title}</Text>
          <Text style={styles.heroDesc}>{"\"" + activeSlide.desc + "\""}</Text>

          <TouchableOpacity 
            style={styles.exploreBtn} 
            onPress={() => handleExploreHero(activeSlide.link)}
          >
            <Text style={styles.exploreText}>Explore Atelier</Text>
            <Lucide name="arrow-forward" size={15} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Looping slide indicators exactly like web indicators */}
        <View style={styles.slideIndicators}>
          {HERO_SLIDES.map((_, idx) => (
            <TouchableOpacity 
              key={idx} 
              onPress={() => {
                triggerHaptic("light");
                setHeroIndex(idx);
              }}
              style={[
                styles.indicatorDot,
                heroIndex === idx && styles.indicatorDotActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* 🧬 AURA-AI PERSONALIZED RECOMMENDATIONS CAROUSEL ("Alok, still looking for these?") */}
      {highAuraProducts.length > 0 && (
        <View style={styles.personalizedSection}>
          <View style={styles.personalizedHeader}>
            <View style={styles.personalizedSubtitleRow}>
              <Lucide name="finger-print" size={17} color="#00f5ff" style={styles.pulseIcon} />
              <Text style={styles.personalizedSubtitle}>AURA-AI Personalized Curation</Text>
            </View>
            <Text style={styles.personalizedTitle}>Alok, still looking for these?</Text>
            <Text style={styles.personalizedDesc}>
              Deep learning synthesis of active collections matching your aesthetic signature.
            </Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            snapToInterval={260}
            decelerationRate="fast"
            contentContainerStyle={styles.personalizedScroll}
          >
            {highAuraProducts.map((item) => {
              const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
              const auraScore = item.auraScore || item.aura || 9.8;
              return (
                <TouchableOpacity 
                  key={`personal-${item.id}`}
                  style={styles.personalizedCard}
                  onPress={() => handleProductPress(item)}
                  activeOpacity={0.9}
                >
                  <View style={styles.personalizedImgContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.personalizedImg} />
                    <View style={styles.personalAuraBadge}>
                      <Lucide name="sparkles" size={11} color="#00f5ff" />
                      <Text style={styles.personalAuraText}>{auraScore}</Text>
                    </View>
                  </View>
                  <View style={styles.personalMeta}>
                    <Text style={styles.personalMaison}>{item.maison?.name || currentMaisonName}</Text>
                    <Text style={styles.personalTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.personalPrice}>₹{item.price?.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // Footer Elements structured exactly like the website's Cinematic Global Footer
  const renderFooter = () => (
    <View style={styles.footerContainer}>

      {/* 🏛️ MAISON SPOTLIGHT SECTION */}
      <View style={styles.spotlightSection}>
        <View style={styles.spotlightHeader}>
          <Text style={styles.spotlightBadge}>Maison Spotlight</Text>
          <Text style={styles.spotlightTitle}>Architecting{"\n"}Ancient Future</Text>
          <Text style={styles.spotlightQuote}>
            {"\"This month, we highlight the Paris Node—a collective focused on the fusion of liquid silk and 3D-mapped structural elements.\""}
          </Text>

          <TouchableOpacity 
            style={styles.spotlightLinkBtn}
            onPress={() => router.push(`/maison/${activeMaisonId}` as any)}
          >
            <View style={styles.spotlightCircleBtn}>
              <Lucide name="chevron-forward" size={19} color="#fff" />
            </View>
            <Text style={styles.spotlightLinkText}>Explore The Collection</Text>
          </TouchableOpacity>
        </View>

        {/* Dual Spotlight visual cards */}
        <View style={styles.spotlightGrids}>
          <View style={styles.spotlightImgCard1}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400" }} 
              style={styles.spotlightImg} 
            />
          </View>
          <View style={styles.spotlightImgCard2}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400" }} 
              style={styles.spotlightImg} 
            />
          </View>
        </View>
      </View>

      {/* 🧬 TRUST INFRASTRUCTURE BLOCKS */}
      <View style={styles.trustGrid}>
        <View style={styles.trustCard}>
          <Lucide name="shield-checkmark" size={34} color="#00f5ff" />
          <Text style={styles.trustTitle}>Sovereign{"\n"}Identity</Text>
          <Text style={styles.trustText}>
            Cryptographic validation of every artisan and artifact in our network.
          </Text>
        </View>
        <View style={styles.trustCard}>
          <Lucide name="globe" size={34} color="#00f5ff" />
          <Text style={styles.trustTitle}>Global{"\n"}Discovery</Text>
          <Text style={styles.trustText}>
            Cross-border acquisitions secured by the AURA Neural Ledger.
          </Text>
        </View>
        <View style={styles.trustCard}>
          <Lucide name="flash" size={34} color="#00f5ff" />
          <Text style={styles.trustTitle}>Direct{"\n"}Custody</Text>
          <Text style={styles.trustText}>
            The collective retains 92% of all value. Direct-to-artisan support.
          </Text>
        </View>
      </View>

      {/* 🏛️ CINEMATIC GLOBAL WATERMARK FOOTER */}
      <View style={styles.globalFooter}>
        {/* Massive backdrop typography watermark */}
        <View style={styles.watermarkBox}>
          <Text style={styles.watermarkText}>AURA</Text>
        </View>

        <View style={styles.footerContent}>
          <Text style={styles.footerLogo}>AURA</Text>
          <Text style={styles.footerTag}>DIRECT SOVEREIGN{"\n"}LUXURY ARCHIVE</Text>

          {/* Socials Row */}
          <View style={styles.socialsRow}>
            {["logo-twitter", "logo-instagram", "logo-linkedin"].map((socName) => (
              <TouchableOpacity key={socName} style={styles.socialBtn}>
                <Lucide name={socName as any} size={17} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Structured Directories */}
          <View style={styles.directoriesGrid}>
            <View style={styles.dirCol}>
              <Text style={styles.dirHeader}>Ecosystem</Text>
              <Text style={styles.dirItem}>Marketplace</Text>
              <Text style={styles.dirItem}>AURA Feeds</Text>
              <Text style={styles.dirItem}>Discover</Text>
              <Text style={styles.dirItem}>The Vault</Text>
            </View>
            <View style={styles.dirCol}>
              <Text style={styles.dirHeader}>Seller Space</Text>
              <Text style={styles.dirItem}>Flagship Studio</Text>
              <Text style={styles.dirItem}>Global Nodes</Text>
              <Text style={styles.dirItem}>Ledger Finance</Text>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.copyright}>© 2026 AURA SOVEREIGN. ALL RIGHTS RESERVED.</Text>
            <View style={styles.footerPowered}>
              <Text style={styles.poweredLabel}>Powered by</Text>
              <Text style={styles.poweredBrand}>AURA</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        
        {/* 🎛️ FLIPKART-STYLE AURA SWITCHER BAR */}
        {!collapsed && (
          <View style={styles.topSwitcherBar}>
            <TouchableOpacity 
              style={[styles.switcherTab, styles.switcherTabActive]}
              activeOpacity={0.8}
              onPress={() => triggerHaptic("light")}
            >
              <Lucide name="sparkles" size={17} color="#000" />
              <Text style={styles.switcherTabTextActive}>AURA</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switcherTab}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic("light");
                router.push("/" as any);
              }}
            >
              <Lucide name="play" size={17} color="#fff" />
              <Text style={styles.switcherTabText}>Stories</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switcherTab}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic("light");
                router.push("/account/loyalty-vault");
              }}
            >
              <Lucide name="ribbon" size={17} color="#fff" />
              <Text style={styles.switcherTabText}>Loyalty</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 📍 TELEMETRY / LOCATION NODE BAR */}
        {!collapsed && (
          <View style={styles.telemetryBar}>
            <View style={styles.locationContainer}>
              <Lucide name="location-sharp" size={17} color="#00f5ff" />
              <Text style={styles.locationText} numberOfLines={1}>
                Piparaund, Near Indane - Divya Indane...
              </Text>
              <Lucide name="chevron-down" size={15} color="rgba(255,255,255,0.4)" />
            </View>
            
            <View style={styles.curationPointsBox}>
              <Lucide name="flash" size={15} color="#00f5ff" />
              <Text style={styles.pointsText}>1,240</Text>
            </View>
          </View>
        )}

        {/* 🔍 FLIPKART-STYLE SEARCH CONTAINER */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchContainer}>
            <Lucide name="search" size={21} color="rgba(255,255,255,0.4)" style={styles.searchIconLeft} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search collections, Maisons, vibes..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length % 3 === 0) triggerHaptic("light");
              }}
            />
            <View style={styles.searchIconsRight}>
              <Lucide name="mic" size={21} color="#00f5ff" style={styles.searchRightIcon} />
              <Lucide name="qr-code" size={21} color="rgba(255,255,255,0.5)" />
            </View>
          </View>
        </View>

        {/* 🗂️ HORIZONTAL CATEGORY SQUIRCLER STRIP */}
        <View style={styles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          >
            {CATEGORY_ITEMS.map((item) => {
              const isSelected = selectedCategory === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={styles.categoryItemBtn}
                  onPress={() => handleCategoryPress(item.name)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.categoryIconCircle, 
                    isSelected && styles.categoryIconCircleActive
                  ]}>
                    <Lucide 
                      name={item.icon as any} 
                      size={23} 
                      color={isSelected ? "#000" : "#00f5ff"} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryItemLabel, 
                    isSelected && styles.categoryItemLabelActive
                  ]}>
                    {item.name}
                  </Text>
                  {isSelected && <View style={styles.activeIndicatorLine} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Storefront Products Catalog Grid */}
        <View style={styles.gridContainer}>
          {loadingProducts ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#00f5ff" />
              <Text style={styles.loaderText}>Syncing Neural Mesh...</Text>
            </View>
          ) : (
            <FlatList
              data={displayProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y;
                if (y > 30 && !collapsed) {
                  setCollapsed(true);
                } else if (y <= 30 && collapsed) {
                  setCollapsed(false);
                }
              }}
              scrollEventThrottle={16}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Lucide name="sparkles" size={26} color="rgba(255,255,255,0.1)" />
                  <Text style={styles.emptyText}>{"No artifacts sync'd for this criteria."}</Text>
                </View>
              }
            />
          )}
        </View>

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
          <Lucide name="play-outline" size={28} color="#00f5ff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push("/account"); }}>
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "#00f5ff", overflow: "hidden" }]}>
            {activeMaisonId === "aloksingh" ? (
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80" }} 
                style={styles.profileTabImg} 
              />
            ) : (
              <View style={[styles.profileTabImg, { backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }]}>
                <Text style={{ color: "#000000", fontSize: 10, fontWeight: "bold" }}>{activeMaisonId[0]?.toUpperCase() || "R"}</Text>
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
    backgroundColor: "#080415", // Brand black website color exact copy
  },
  safeArea: {
    flex: 1,
  },
  gridContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loaderText: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  gridContent: {
    paddingBottom: 100,
    gap: 16,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 40, // Match premium website rounded-[3.5rem] shape on cards
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  auraBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 3,
  },
  auraScoreText: {
    color: "#fff",
    fontSize: 11.5,
    fontWeight: "bold",
  },
  quickAcquireCircle: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  infoContainer: {
    padding: 14,
    gap: 4,
  },
  maisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  maisonText: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
  },
  price: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "300",
  },
  detailsDividerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    paddingTop: 8,
    marginTop: 4,
  },
  vibeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vibeLabelText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  headerLayout: {
    width: "100%",
  },
  heroSection: {
    width: "100%",
    height: 390,
    position: "relative",
    marginBottom: 20,
    backgroundColor: "#080415",
  },
  heroImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.75,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,5,0.25)",
  },
  heroCaptionBox: {
    position: "absolute",
    bottom: 30,
    left: 24,
    right: 24,
    gap: 8,
  },
  heroSubtitle: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "300",
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  heroDesc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14.5,
    fontStyle: "italic",
    lineHeight: 18,
    marginTop: 4,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 12,
    gap: 6,
  },
  exploreText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  slideIndicators: {
    position: "absolute",
    bottom: 30,
    right: 24,
    flexDirection: "row",
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  indicatorDotActive: {
    backgroundColor: "#00f5ff",
    transform: [{ scale: 1.25 }],
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    marginHorizontal: 24,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 13.5,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: "center",
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  categoryBtnActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  categoryText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryTextActive: {
    color: "#000",
  },
  globalDemandBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0,245,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.1)",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  globalDemandText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    textAlign: "center",
  },
  footerContainer: {
    width: "100%",
    marginTop: 40,
    gap: 40,
  },
  personalizedSection: {
    paddingHorizontal: 24,
    gap: 16,
  },
  personalizedHeader: {
    gap: 4,
  },
  personalizedSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseIcon: {
    opacity: 0.8,
  },
  personalizedSubtitle: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  personalizedTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
  personalizedDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13.5,
    fontWeight: "400",
    lineHeight: 16,
  },
  personalizedScroll: {
    gap: 16,
    paddingRight: 24,
    paddingTop: 8,
  },
  personalizedCard: {
    width: 200,
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    overflow: "hidden",
  },
  personalizedImgContainer: {
    position: "relative",
    width: "100%",
    height: 220,
  },
  personalizedImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  personalAuraBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  personalAuraText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "bold",
  },
  personalMeta: {
    padding: 12,
    gap: 2,
  },
  personalMaison: {
    color: "#00f5ff",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  personalTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  personalPrice: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  spotlightSection: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 36,
    marginHorizontal: 24,
    padding: 24,
    gap: 20,
  },
  spotlightHeader: {
    gap: 8,
  },
  spotlightBadge: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  spotlightTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
  spotlightQuote: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13.5,
    fontStyle: "italic",
    lineHeight: 18,
  },
  spotlightLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  spotlightCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  spotlightLinkText: {
    color: "#fff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  spotlightGrids: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  spotlightImgCard1: {
    flex: 1,
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
  },
  spotlightImgCard2: {
    flex: 1,
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 16,
  },
  spotlightImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  trustGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingTop: 32,
    gap: 12,
  },
  trustCard: {
    flex: 1,
    gap: 8,
  },
  trustTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    lineHeight: 15,
  },
  trustText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11.5,
    lineHeight: 14,
  },
  globalFooter: {
    backgroundColor: "#080415",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    paddingBottom: 90, // Cushions home indicator safe areas with zero background gaps
  },
  watermarkBox: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    opacity: 0.03,
  },
  watermarkText: {
    fontSize: 74,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 4,
  },
  footerContent: {
    gap: 16,
    position: "relative",
    zIndex: 10,
  },
  footerLogo: {
    color: "#00f5ff",
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: -1,
  },
  footerTag: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  socialsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  socialBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  directoriesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingTop: 20,
    marginTop: 12,
  },
  dirCol: {
    flex: 1,
    gap: 8,
  },
  dirHeader: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  dirItem: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingTop: 16,
    marginTop: 20,
    gap: 8,
  },
  copyright: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10.5,
    fontWeight: "bold",
  },
  footerPowered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    opacity: 0.35,
  },
  poweredLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  poweredBrand: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  topSwitcherBar: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: "#080415",
  },
  switcherTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  switcherTabActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  switcherTabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  switcherTabTextActive: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  telemetryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    backgroundColor: "#080415",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  locationText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    maxWidth: width * 0.55,
  },
  curationPointsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 245, 255,  0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  searchBarRow: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#080415",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.2)",
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14.5,
    paddingVertical: 8,
  },
  searchIconsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchRightIcon: {
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingRight: 10,
  },
  categoriesSection: {
    backgroundColor: "#080415",
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    paddingBottom: 4,
  },
  categoryScrollContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  categoryItemBtn: {
    alignItems: "center",
    gap: 6,
    position: "relative",
    paddingBottom: 6,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconCircleActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  categoryItemLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryItemLabelActive: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
  activeIndicatorLine: {
    position: "absolute",
    bottom: -4,
    width: 20,
    height: 2.5,
    backgroundColor: "#00f5ff",
    borderRadius: 1.5,
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
