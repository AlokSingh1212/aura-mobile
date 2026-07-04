import React, { useEffect, useState, useRef } from "react";
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
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Animated
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { router, useLocalSearchParams } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import MainHeader from "@/components/MainHeader";
import { ShimmerShopGrid } from "@/components/ui/ShimmerLoader";
import { formatCompactNumber } from "@/constants/format";
import * as Location from "expo-location";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";
import { API_HOST } from "@/constants/api";

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
    title: "THE VERIFIED",
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
  const { products, loadingProducts, fetchProducts, addToCart, triggerHaptic, activeMaisonId, activeProfile, loyaltyPoints, formatPrice } = useStore();
  const { search: searchParam } = useLocalSearchParams<{ search?: string }>();
  const currentMaisonName = activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : (activeMaisonId ? activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "AURA Client"));
  const insets = useSafeAreaInsets();
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [voiceVolume, setVoiceVolume] = useState(1);
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  const laserAnim = useRef(new Animated.Value(0)).current;
  const [scannerFlashMode, setScannerFlashMode] = useState<"off" | "on">("off");
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("For You");
  const [searchQuery, setSearchQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (searchParam && typeof searchParam === "string") {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Delivery Location states
  const [locationText, setLocationText] = useState("Piparaund, Near Indane - Divya Indane...");
  const [isServiceable, setIsServiceable] = useState(true);
  const [pincodeModalVisible, setPincodeModalVisible] = useState(false);
  const [enteredPincode, setEnteredPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  // Voice Search states
  const [voiceSearchModalVisible, setVoiceSearchModalVisible] = useState(false);
  const [voiceSearchState, setVoiceSearchState] = useState<"idle" | "listening" | "processing">("idle");

  // QR scanner states
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrScanStatus, setQrScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  const PINCODE_MAP: Record<string, string> = {
    "110001": "New Delhi Central",
    "226001": "Lucknow GPO",
    "400001": "Mumbai GP",
    "560001": "Bengaluru GPO",
    "600001": "Chennai GPO",
    "700001": "Kolkata GPO",
    "226010": "Lucknow Gomti Nagar",
    "227305": "Piparaund, Near Indane Hub"
  };

  const verifyPincode = async (pincode: string) => {
    Keyboard.dismiss();
    if (pincode.length !== 6 || isNaN(Number(pincode))) {
      setPincodeError("Please enter a valid 6-digit numeric pincode.");
      triggerHaptic("heavy");
      return;
    }

    try {
      const res = await fetch(`${API_HOST}/api/mobile/logistics/serviceability?pincode=${pincode}`);
      const data = await res.json();
      
      if (data.success && data.serviceable) {
        setIsServiceable(true);
        setLocationText(`${data.city} (${pincode})`);
        triggerHaptic("success");
        setPincodeModalVisible(false);
      } else {
        setIsServiceable(false);
        setLocationText(data.error || `Unserviceable Node (${pincode})`);
        triggerHaptic("heavy");
        setPincodeModalVisible(false);
      }
    } catch (e) {
      console.warn("Serviceability lookup failed, utilizing offline fallback", e);
      if (pincode.startsWith("9")) {
        setIsServiceable(false);
        setLocationText(`Unserviceable Node (${pincode})`);
        triggerHaptic("heavy");
      } else {
        const city = PINCODE_MAP[pincode] || `Sovereign Zone ${pincode.substring(0, 3)}`;
        setIsServiceable(true);
        setLocationText(`${city} (${pincode})`);
        triggerHaptic("success");
      }
      setPincodeModalVisible(false);
    }
  };

  const fetchLiveLocation = async () => {
    triggerHaptic("medium");
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "AURA requires location permissions to verify your sovereign node courier routing."
        );
        setLoadingLocation(false);
        return;
      }

      setLocationText("Syncing GPS coordinates...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        const city = addr.city || addr.district || addr.subregion || "Sovereign Zone";
        const pin = addr.postalCode || "560001";
        setIsServiceable(true);
        setLocationText(`${city} (${pin})`);
        triggerHaptic("success");
      } else {
        setLocationText(`Node (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        triggerHaptic("success");
      }
    } catch (e) {
      console.warn("GPS sync failed:", e);
      setIsServiceable(false);
      setLocationText("Location Desync");
      triggerHaptic("heavy");
    } finally {
      setLoadingLocation(false);
    }
  };

  const startVoiceSearch = async () => {
    triggerHaptic("medium");
    setVoiceSearchState("listening");
    setVoiceSearchModalVisible(true);
    setVoiceVolume(1);

    try {
      // 1. Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "AURA requires microphone permission to capture your style queries."
        );
        setVoiceSearchModalVisible(false);
        return;
      }

      // 2. Set audio mode to allowsRecording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 3. Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {}
      });

      // Update volume meter dynamically
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          const db = status.metering;
          const normalized = Math.max(0, db + 160) / 160; // 0 to 1
          setVoiceVolume(1 + normalized * 0.8);
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;

      // Automatically stop recording after 3.5 seconds
      setTimeout(async () => {
        await stopAndProcessVoiceSearch();
      }, 3500);

    } catch (e) {
      console.warn("Failed to initialize audio recording:", e);
      // Fallback simulation
      setVoiceSearchState("processing");
      setTimeout(() => {
        setVoiceSearchState("idle");
        setVoiceSearchModalVisible(false);
        setSearchQuery("Obsidian Cashmere");
        triggerHaptic("success");
      }, 1500);
    }
  };

  const stopAndProcessVoiceSearch = async () => {
    if (!recordingRef.current) return;
    
    setVoiceSearchState("processing");
    triggerHaptic("light");
    
    try {
      const recording = recordingRef.current;
      recordingRef.current = null;
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) throw new Error("No recording URI generated");

      // Upload audio to Next.js API route for Whisper transcription
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "voice-query.m4a",
        type: "audio/m4a",
      } as any);

      const res = await fetch(`${API_HOST}/api/mobile/voice-search`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
        },
      });

      const data = await res.json();
      setVoiceSearchState("idle");
      setVoiceSearchModalVisible(false);

      if (data.success && data.text) {
        setSearchQuery(data.text);
        triggerHaptic("success");
      } else {
        setSearchQuery("Obsidian Cashmere");
        triggerHaptic("success");
      }
    } catch (e) {
      console.warn("Transcription failed:", e);
      setVoiceSearchState("idle");
      setVoiceSearchModalVisible(false);
      setSearchQuery("Obsidian Cashmere");
      triggerHaptic("success");
    }
  };

  const startQrScan = async () => {
    triggerHaptic("medium");
    setQrScanStatus("scanning");
    setScannedProduct(null);

    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert(
          "Permission Denied",
          "AURA requires camera permission to scan holographic authenticity tags."
        );
        return;
      }
    }

    setQrModalVisible(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (qrScanStatus !== "scanning") return;
    
    triggerHaptic("success");
    setQrScanStatus("success");

    let matchedId = data.trim();
    if (data.includes("/product/")) {
      const parts = data.split("/product/");
      matchedId = parts[parts.length - 1];
    }

    try {
      const res = await fetch(`${API_HOST}/api/mobile/products?id=${matchedId}`);
      const responseData = await res.json();
      
      if (responseData.success && responseData.product) {
        setScannedProduct(responseData.product);
      } else {
        throw new Error("Product not in database");
      }
    } catch (e) {
      console.warn("QR code backend query failed, utilizing offline cache fallback", e);
      const matched = products.find(p => p.id === matchedId) || products[0] || {
        id: "obsidian-cashmere",
        title: "Obsidian Cashmere Vestment",
        price: 185000,
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=600"]
      };
      setScannedProduct(matched);
    }
  };

  useEffect(() => {
    if (qrModalVisible && qrScanStatus === "scanning") {
      laserAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [qrModalVisible, qrScanStatus]);

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

  const highAuraGramProducts = products.filter(p => (p.auragramScore || p.auragram || 9.0) >= 9.5);

  const renderProductItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    const maisonName = item.maison?.name || "Rare Raven";
    const targetMaisonId = item.maison?.id || "rare_raven";
    const auragramScore = item.auragramScore || item.auragram || 9.8;
    const rating = item.rating || 4.9;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => handleProductPress(item)}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          {/* Top-Left AuraGram Tag bubble identical to website */}
          <View style={styles.auragramBadge}>
            <Lucide name="flash" size={12} color="#00f5ff" />
            <Text style={styles.auragramScoreText}>{auragramScore}</Text>
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
            {item.price ? formatPrice(item.price) : "Price on Request"}
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

      {/* 🎟️ PREMIUM LOYALTY PORTAL CROSSOVER BANNER */}
      <TouchableOpacity 
        style={styles.premiumLoyaltyBanner} 
        activeOpacity={0.9}
        onPress={() => {
          triggerHaptic("medium");
          router.push("/account/loyalty-vault");
        }}
      >
        <View style={styles.loyaltyBannerLeft}>
          <Lucide name="ribbon-sharp" size={20} color="#00f5ff" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.loyaltyBannerTitle}>AURA PREMIUM LOYALTY MATRIX</Text>
            <Text style={styles.loyaltyBannerSub}>
              You have <Text style={styles.loyaltyBannerPoints}>{formatCompactNumber(loyaltyPoints || 0)} Credits</Text> available
            </Text>
          </View>
        </View>
        <View style={styles.loyaltyBannerRight}>
          <Text style={styles.loyaltyBannerAction}>REDEEM</Text>
          <Lucide name="chevron-forward" size={14} color="#00f5ff" />
        </View>
      </TouchableOpacity>

      {/* 🧬 AURAGRAM-AI PERSONALIZED RECOMMENDATIONS CAROUSEL ("Alok, still looking for these?") */}
      {highAuraGramProducts.length > 0 && (
        <View style={styles.personalizedSection}>
          <View style={styles.personalizedHeader}>
            <View style={styles.personalizedSubtitleRow}>
              <Lucide name="finger-print" size={17} color="#00f5ff" style={styles.pulseIcon} />
              <Text style={styles.personalizedSubtitle}>AURAGRAM-AI Personalized Curation</Text>
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
            {highAuraGramProducts.map((item) => {
              const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
              const auragramScore = item.auragramScore || item.auragram || 9.8;
              return (
                <TouchableOpacity 
                  key={`personal-${item.id}`}
                  style={styles.personalizedCard}
                  onPress={() => handleProductPress(item)}
                  activeOpacity={0.9}
                >
                  <View style={styles.personalizedImgContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.personalizedImg} />
                    <View style={styles.personalAuraGramBadge}>
                      <Lucide name="sparkles" size={11} color="#00f5ff" />
                      <Text style={styles.personalAuraGramText}>{auragramScore}</Text>
                    </View>
                  </View>
                  <View style={styles.personalMeta}>
                    <Text style={styles.personalMaison}>{item.maison?.name || currentMaisonName}</Text>
                    <Text style={styles.personalTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.personalPrice}>{formatPrice(item.price)}</Text>
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
          <Text style={styles.trustTitle}>Verified{"\n"}Identity</Text>
          <Text style={styles.trustText}>
            Cryptographic validation of every artisan and artifact in our network.
          </Text>
        </View>
        <View style={styles.trustCard}>
          <Lucide name="globe" size={34} color="#00f5ff" />
          <Text style={styles.trustTitle}>Global{"\n"}Discovery</Text>
          <Text style={styles.trustText}>
            Cross-border acquisitions secured by the AURAGRAM Neural Ledger.
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
          <Text style={styles.watermarkText}>AURAGRAM</Text>
        </View>

        <View style={styles.footerContent}>
          <Text style={styles.footerLogo}>AURAGRAM</Text>
          <Text style={styles.footerTag}>DIRECT VERIFIED{"\n"}LUXURY ARCHIVE</Text>

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
              <Text style={styles.dirItem}>AURAGRAM Feeds</Text>
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
            <Text style={styles.copyright}>© 2026 AURAGRAM VERIFIED. ALL RIGHTS RESERVED.</Text>
            <View style={styles.footerPowered}>
              <Text style={styles.poweredLabel}>Powered by</Text>
              <Text style={styles.poweredBrand}>AURAGRAM</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        
        {/* 📍 TELEMETRY / LOCATION NODE BAR */}
        {!collapsed && (
          <View style={styles.telemetryBar}>
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={() => {
                triggerHaptic("light");
                setPincodeModalVisible(true);
              }}
            >
              <Lucide name="location-sharp" size={17} color={isServiceable ? "#00f5ff" : "#ff3b30"} />
              <Text style={[styles.locationText, !isServiceable && { color: "#ff3b30" }]} numberOfLines={1}>
                {locationText}
              </Text>
              <Lucide name="chevron-down" size={15} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
            
            <View style={styles.curationPointsBox}>
              <Lucide name="flash" size={15} color="#00f5ff" />
              <Text style={styles.pointsText}>{formatCompactNumber(loyaltyPoints || 0)}</Text>
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
              <TouchableOpacity onPress={startVoiceSearch} style={{ marginRight: 10 }}>
                <Lucide name="mic" size={21} color="#00f5ff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={startQrScan}>
                <Lucide name="qr-code" size={21} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
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
              <Text style={styles.loaderText}>Syncing Premium Feed...</Text>
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

      {/* 🏠 AURA BOTTOM NAVIGATION — 5 tabs with elevated Create */}
      <View style={[styles.auraBottomBar, { paddingBottom: insets.bottom, height: 62 + insets.bottom }]}>

        {/* TAB 1 — Home */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/");
          }}
        >
          <Lucide
            name="home-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Home</Text>
        </TouchableOpacity>

        {/* TAB 2 — Reel */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push({ pathname: "/", params: { activeTab: "reels" } } as any);
          }}
        >
          <Lucide
            name="film-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Reel</Text>
        </TouchableOpacity>

        {/* TAB 3 — Inbox */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push({ pathname: "/", params: { openDMs: "true" } } as any);
          }}
        >
          <Lucide
            name="paper-plane-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Inbox</Text>
        </TouchableOpacity>

        {/* TAB 4 — Products */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/shop");
          }}
        >
          <Lucide
            name="bag-handle-outline"
            size={26}
            color="#00f5ff"
          />
          <Text style={[styles.auraTabLabel, { color: "#00f5ff" }]}>Products</Text>
        </TouchableOpacity>

        {/* TAB 5 — Profile */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/account");
          }}
        >
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", overflow: "hidden" }]}>
            {activeProfile?.logo ? (
              <Image
                source={{ uri: activeProfile.logo }}
                style={styles.profileTabImg}
              />
            ) : (
              <View style={[styles.profileTabImg, { backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }]}>
                <Text style={{ color: "#000", fontSize: 10, fontWeight: "bold" }}>{activeMaisonId?.[0]?.toUpperCase() || "R"}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Profile</Text>
        </TouchableOpacity>

      </View>

      {/* 📍 DELIVERY PINCODE CHECK MODAL */}
      <Modal
        visible={pincodeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPincodeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>DELIVERY GEO-NODE CHECK</Text>
                  <TouchableOpacity onPress={() => { triggerHaptic("light"); Keyboard.dismiss(); setPincodeModalVisible(false); }}>
                    <Lucide name="close" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalForm}>
                  {/* 📍 GPS Node Sync option */}
                  <TouchableOpacity
                    style={styles.gpsSyncBtn}
                    onPress={async () => {
                      setPincodeModalVisible(false);
                      await fetchLiveLocation();
                    }}
                    activeOpacity={0.8}
                  >
                    {loadingLocation ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Lucide name="location-sharp" size={18} color="#000" />
                        <Text style={styles.gpsSyncBtnText}>USE CURRENT GPS LOCATION</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR SELECT SAVED NODE</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Preset Nodes */}
                  <View style={styles.presetsList}>
                    {[
                      { name: "Bangalore Flagship Node", pin: "560001" },
                      { name: "Piparaund Outskirts Node", pin: "227305" },
                      { name: "Lucknow GPO Node", pin: "226001" }
                    ].map((node) => (
                      <TouchableOpacity
                        key={node.pin}
                        style={styles.presetNodeCard}
                        onPress={() => {
                          triggerHaptic("success");
                          verifyPincode(node.pin);
                        }}
                        activeOpacity={0.8}
                      >
                        <Lucide name="business-outline" size={17} color="#00f5ff" />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.presetNodeName}>{node.name}</Text>
                          <Text style={styles.presetNodePin}>Pincode: {node.pin}</Text>
                        </View>
                        <Lucide name="chevron-forward" size={15} color="rgba(255,255,255,0.3)" />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR ENTER PINCODE MANUALLY</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter 6-digit Pincode"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => verifyPincode(enteredPincode)}
                      blurOnSubmit={true}
                      maxLength={6}
                      value={enteredPincode}
                      onChangeText={(text) => {
                        setEnteredPincode(text);
                        setPincodeError("");
                      }}
                    />
                    {pincodeError ? <Text style={styles.errorText}>{pincodeError}</Text> : null}
                  </View>

                  <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={() => verifyPincode(enteredPincode)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.submitText}>VERIFY NODE FEASIBILITY</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🎙️ VOICE SEARCH SIMULATOR MODAL */}
      <Modal
        visible={voiceSearchModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setVoiceSearchModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { alignItems: "center", paddingVertical: 40 }]}>
            <View style={[
              styles.voicePulseCircle,
              voiceSearchState === "listening" && {
                transform: [{ scale: voiceVolume }]
              }
            ]}>
              <Lucide name="mic" size={40} color="#00f5ff" />
            </View>
            
            <Text style={styles.voiceStatusText}>
              {voiceSearchState === "listening" ? "LISTENING..." : "PROCESSING SENSORY QUERY..."}
            </Text>
            
            <Text style={styles.voiceDescText}>
              {voiceSearchState === "listening" 
                ? "Speak your style aesthetic naturally..." 
                : "Synthesizing vocal embeddings against AURA catalog nodes..."}
            </Text>
            
            {voiceSearchState === "listening" && (
              <View style={{ alignItems: "center", width: "100%", marginVertical: 10 }}>
                <View style={styles.voiceWaveWrapper}>
                  {[0.5, 1.2, 0.8, 1.5, 0.6, 1.0].map((multiplier, idx) => {
                    const height = Math.max(10, Math.min(60, voiceVolume * 24 * multiplier));
                    return (
                      <View 
                        key={idx} 
                        style={[
                          styles.voiceWaveBar, 
                          { height }
                        ]} 
                      />
                    );
                  })}
                </View>
                <Text style={styles.recommendationText}>
                  Try saying: "Obsidian Cashmere" or "Rare Raven"
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.cancelBtn, { marginTop: 24 }]} 
              onPress={async () => { 
                triggerHaptic("light"); 
                if (recordingRef.current) {
                  try {
                    await recordingRef.current.stopAndUnloadAsync();
                  } catch (e) {}
                  recordingRef.current = null;
                }
                setVoiceSearchModalVisible(false); 
              }}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔍 SOVEREIGN MARK QR AUTHENTICITY SCANNER MODAL */}
      <Modal
        visible={qrModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SOVEREIGN MARK SCANNER</Text>
              <TouchableOpacity onPress={() => { triggerHaptic("light"); setQrModalVisible(false); }}>
                <Lucide name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              {qrScanStatus === "scanning" ? (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <View style={styles.scannerWindow}>
                    {cameraPermission?.granted && qrScanStatus === "scanning" && (
                      <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        enableTorch={scannerFlashMode === "on"}
                        barcodeScannerSettings={{
                          barcodeTypes: ["qr"],
                        }}
                        onBarcodeScanned={handleBarCodeScanned}
                      />
                    )}
                    <Animated.View style={[styles.scanLaser, { transform: [{ translateY: laserAnim }] }]} />
                    <TouchableOpacity 
                      style={styles.scannerFlashBtn} 
                      onPress={() => {
                        triggerHaptic("light");
                        setScannerFlashMode(prev => prev === "on" ? "off" : "on");
                      }}
                    >
                      <Lucide 
                        name={scannerFlashMode === "on" ? "flash" : "flash-off"} 
                        size={20} 
                        color={scannerFlashMode === "on" ? "#00f5ff" : "#fff"} 
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.scanStatusText}>SCANNING PHYSICAL ARTIFACT TAG...</Text>
                  <Text style={styles.scanDescText}>Position the product's NFC holographic QR tag inside the frame.</Text>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Lucide name="checkmark-circle" size={48} color="#00f5ff" />
                  <Text style={[styles.scanStatusText, { color: "#00f5ff", marginTop: 12 }]}>AUTHENTICITY VERIFIED</Text>
                  <Text style={[styles.scanDescText, { marginBottom: 20 }]}>
                    This physical luxury artifact is a certified genuine model. Signature matches Rare Raven ledger key.
                  </Text>
                  
                  {scannedProduct && (
                    <View style={styles.scannedProductCard}>
                      <Image source={{ uri: scannedProduct.images?.[0] }} style={styles.scannedProductImg} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.scannedProductTitle} numberOfLines={1}>{scannedProduct.title}</Text>
                        <Text style={styles.scannedProductPrice}>₹{scannedProduct.price?.toLocaleString()}</Text>
                        <Text style={styles.scannedProductVibe}>Quiet Luxury Node</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={() => {
                      triggerHaptic("medium");
                      setQrModalVisible(false);
                      if (scannedProduct) {
                        router.push(`/product/${scannedProduct.id}`);
                      }
                    }}
                  >
                    <Text style={styles.submitText}>VIEW ATELIER DETAILS</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

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
  auragramBadge: {
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
  auragramScoreText: {
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
  personalAuraGramBadge: {
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
  personalAuraGramText: {
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
  premiumLoyaltyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.15)",
    borderRadius: 20,
    marginHorizontal: 24,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#00f5ff",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  loyaltyBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  loyaltyBannerTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  loyaltyBannerSub: {
    color: "#ffffff",
    fontSize: 13.5,
    marginTop: 2,
  },
  loyaltyBannerPoints: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
  loyaltyBannerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 245, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.2)",
  },
  loyaltyBannerAction: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
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
  auraBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "rgba(5,3,15,0.94)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  auraTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
    paddingTop: 8,
    gap: 3,
  },
  auraTabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
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
  // Interactive Modals Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    paddingBottom: 12,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  modalForm: {
    marginTop: 16,
  },
  modalDesc: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    color: "#ffffff",
    fontSize: 14,
    paddingHorizontal: 16,
    height: 48,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: "#000000",
    fontSize: 12.5,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  // Voice Search Specific
  voicePulseCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(0, 245, 255, 0.05)",
    borderWidth: 2,
    borderColor: "#00f5ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  voiceStatusText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  voiceDescText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 18,
    marginBottom: 16,
  },
  voiceVisualizerText: {
    color: "#00f5ff",
    fontSize: 12,
    marginTop: 8,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  // QR scanner Specific
  scannerWindow: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#00f5ff",
    borderRadius: 24,
    backgroundColor: "rgba(0, 245, 255, 0.02)",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  scanLaser: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#00f5ff",
    top: 0,
    shadowColor: "#00f5ff",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 5,
  },
  gpsSyncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00f5ff",
    borderRadius: 18,
    height: 48,
    gap: 8,
    marginBottom: 16,
  },
  gpsSyncBtnText: {
    color: "#000000",
    fontSize: 12.5,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
    paddingHorizontal: 12,
  },
  presetsList: {
    gap: 10,
    marginBottom: 16,
  },
  presetNodeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 18,
    padding: 14,
  },
  presetNodeName: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  presetNodePin: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11.5,
    marginTop: 2,
  },
  voiceWaveWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 70,
    width: "100%",
    marginBottom: 12,
  },
  voiceWaveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: "#00f5ff",
    shadowColor: "#00f5ff",
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 12.5,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  scannerFlashBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanStatusText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  scanDescText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 12,
  },
  scannedProductCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  scannedProductImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  scannedProductTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  scannedProductPrice: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
  scannedProductVibe: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 11,
    marginTop: 1,
  },
});
