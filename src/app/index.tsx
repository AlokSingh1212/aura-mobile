import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animated, LogBox } from "react-native";

// Suppress expo-av deprecation warnings
LogBox.ignoreLogs([
  "[expo-av]: Expo AV has been deprecated and will be removed in SDK 54",
  "Video component from `expo-av` is deprecated in favor of `expo-video`"
]);

import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator,
  Share,
  Alert,
  TextInput,
  ScrollView,
  Modal,
  Linking
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { createAudioPlayer } from "expo-audio";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as ImagePicker from "expo-image-picker";
import { CameraView } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import { API_HOST } from "@/constants/api";
import { formatCompactNumber } from "@/constants/format";
import { CameraStudio } from "@/components/CameraStudio";
import { ChatDrawer } from "@/components/ChatDrawer";
import { FeedCard } from "@/components/FeedCard";
import { ImageEditor, FILTER_PRESETS } from "@/components/ImageEditor";
import { PostCard } from "@/components/PostCard";
import { LiveShowroom } from "@/components/LiveShowroom";
import { ProductPreviewSheet } from "@/components/ProductPreviewSheet";
import { ShimmerFeedList } from "@/components/ui/ShimmerLoader";
import { prefetchVideo } from "@/utils/videoCache";
import { useLayoutCache } from "@/utils/useLayoutCache";
import { useVideoPlayer, VideoView } from "expo-video";
import { InAppBrowserModal } from "@/components/InAppBrowserModal";
import { ExploreProductsSheet } from "@/components/ExploreProductsSheet";
import { LeadGenSheet } from "@/components/LeadGenSheet";

const MOCK_PRODUCTS = [
  {
    id: "p1",
    title: "Obsidian Gold Vestment",
    name: "Obsidian Gold Vestment",
    price: 185000,
    vibe: "Quiet Luxury",
    images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.9,
    rating: 4.9,
    type: "Fashion"
  },
  {
    id: "p2",
    title: "Atelier Silk Trench Jacket",
    name: "Atelier Silk Trench Jacket",
    price: 245000,
    vibe: "Avant-Garde",
    images: ["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.8,
    rating: 4.8,
    type: "Fashion"
  },
  {
    id: "p3",
    title: "Cyber Penthouse Cuff",
    name: "Cyber Penthouse Cuff",
    price: 95000,
    vibe: "Brutalist",
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.7,
    rating: 4.7,
    type: "Jewelry"
  },
  {
    id: "p4",
    title: "Heritage Calfskin Carryall",
    name: "Heritage Calfskin Carryall",
    price: 320000,
    vibe: "Quiet Luxury",
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.9,
    rating: 4.9,
    type: "Bags"
  }
];

const { height, width } = Dimensions.get("window");

const AUDIO_LIBRARY = [
  { 
    title: "Phoolon Ka Taron Ka (Bespoke Mix)", 
    artist: "Vedang Raina x A.R. Rahman", 
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    category: "bollywood",
    isTrending: true
  },
  { 
    title: "Cruel Summer", 
    artist: "Taylor Swift", 
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    category: "pop",
    isTrending: true
  },
  { 
    title: "Blinding Lights", 
    artist: "The Weeknd", 
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    category: "pop",
    isTrending: true
  },
  { 
    title: "Dil Ibaadat (Cyber Lounge Mix)", 
    artist: "KK x Pritam", 
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    category: "bollywood",
    isTrending: false
  },
  { 
    title: "Kinni Kinni", 
    artist: "Diljit Dosanjh", 
    cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    category: "bollywood",
    isTrending: true
  },
  { 
    title: "Hotline Bling", 
    artist: "Drake", 
    cover: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    category: "hiphop",
    isTrending: true
  },
  { 
    title: "Starboy", 
    artist: "The Weeknd ft. Daft Punk", 
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    category: "pop",
    isTrending: false
  },
  { 
    title: "Milano Runways Loop", 
    artist: "Deep Cyber House Lounge", 
    cover: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    category: "electronic",
    isTrending: false
  },
  { 
    title: "Gucci Runway Curation", 
    artist: "Electro Ambient Vol. 4", 
    cover: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    category: "electronic",
    isTrending: true
  },
  { 
    title: "Brown Munde", 
    artist: "AP Dhillon x Gurinder Gill", 
    cover: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    category: "hiphop",
    isTrending: true
  },
  { 
    title: "Bad Guy", 
    artist: "Billie Eilish", 
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    category: "pop",
    isTrending: false
  },
  { 
    title: "Kahani Suno", 
    artist: "Kaifi Khalil", 
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    category: "bollywood",
    isTrending: true
  },
  { 
    title: "Obsidian Silence", 
    artist: "Liquid Gold Chill Out", 
    cover: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    category: "electronic",
    isTrending: false
  },
  { 
    title: "Let Me Love You", 
    artist: "DJ Snake ft. Justin Bieber", 
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=80", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    category: "pop",
    isTrending: true
  }
];

// Mock Data matching the Instagram prompt screenshots exactly
const INSTA_STORIES = [
  { 
    id: "ys", 
    username: "Your story", 
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150", 
    isYourStory: true,
    slides: [
      { id: "ys_1", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400", caption: "Securing next-gen luxury blueprints..." }
    ]
  },
  { 
    id: "g1", 
    username: "garimahuja05", 
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150", 
    active: true,
    slides: [
      { id: "g1_1", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=400", caption: "Atelier Paris Spring Showcase" },
      { id: "g1_2", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400", caption: "Bespoke fabrics, pure sovereign details" }
    ]
  },
  { 
    id: "m1", 
    username: "mahima.unfilter...", 
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150", 
    active: true,
    slides: [
      { id: "m1_1", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400", caption: "Milan high-fidelity runways." }
    ]
  },
  { 
    id: "i1", 
    username: "_._issue", 
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150", 
    active: true,
    slides: [
      { id: "i1_1", url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400", caption: "Looming aesthetics across Bengaluru nodes." }
    ]
  },
  { 
    id: "a1", 
    username: "alok_maison", 
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150", 
    active: false,
    slides: [
      { id: "a1_1", url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=400", caption: "Heritage Calfskin commission process." }
    ]
  }
];



const PLATFORM_USERS = [
  { id: "u1", username: "garimahuja05", name: "Garima Ahuja", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100", role: "Seller" },
  { id: "u2", username: "mahima.unfilter", name: "Mahima", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=100&h=100", role: "Collector" },
  { id: "u3", username: "alok_maison", name: "Alok Singh", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100", role: "Maison Director" },
  { id: "u4", username: "namita.thapar", name: "Namita Thapar", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100", role: "Verified Investor" },
  { id: "u5", username: "vidmikai", name: "Mikai", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100", role: "Content Creator" }
];

const GLOBAL_LOCATIONS = [
  { name: "Milan, Italy", pincode: "20121", description: "Quadrilatero della Moda" },
  { name: "Paris, France", pincode: "75001", description: "Rue du Faubourg Saint-Honoré" },
  { name: "London, UK", pincode: "W1S", description: "Savile Row / Mayfair" },
  { name: "Bengaluru, India", pincode: "560001", description: "UB City Luxury Hub" }
];

const TRENDING_SONGS = [
  { title: "Espresso", artist: "Sabrina Carpenter", duration: "2:51", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=100" },
  { title: "Not Like Us", artist: "Kendrick Lamar", duration: "4:34", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=100" }
];

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
  scale: number;
}

interface ZoomableImageProps {
  source: { uri: string };
  style: any;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ source, style }) => {
  const pinchScale = React.useRef(new Animated.Value(1)).current;
  const [isPinching, setIsPinching] = React.useState(false);
  const lastPinchDist = React.useRef(0);
  const basePinchScale = React.useRef(1);

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: any) => {
    if (e.nativeEvent.touches.length === 2) {
      setIsPinching(true);
      lastPinchDist.current = getDistance(e.nativeEvent.touches);
      basePinchScale.current = (pinchScale as any).__getValue?.() || 1;
    }
  };

  const handleTouchMove = (e: any) => {
    if (e.nativeEvent.touches.length === 2 && isPinching) {
      const currentDist = getDistance(e.nativeEvent.touches);
      const scaleFactor = currentDist / lastPinchDist.current;
      const newScale = Math.min(Math.max(basePinchScale.current * scaleFactor, 1), 3);
      pinchScale.setValue(newScale);
    }
  };

  const handleTouchEnd = () => {
    if (isPinching) {
      setIsPinching(false);
      Animated.spring(pinchScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: pinchScale }] }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Image source={source} style={style} contentFit="cover" />
    </Animated.View>
  );
};

interface CreatorCommerceCardProps {
  item: any;
  feedMuted: boolean;
  setFeedMuted: (muted: boolean) => void;
  triggerHaptic: (style: any) => void;
  setSelectedProductForPreview: (product: any) => void;
  setPreviewFeedItemId: (id: any) => void;
  setPreviewSheetVisible: (visible: boolean) => void;
  formatPrice: (price: number) => string;
  onPressVideo?: () => void;
  handleThreeDotsPress: (item: any) => void;
}

const CreatorCommerceCard: React.FC<CreatorCommerceCardProps> = ({
  item,
  feedMuted,
  setFeedMuted,
  triggerHaptic,
  setSelectedProductForPreview,
  setPreviewFeedItemId,
  setPreviewSheetVisible,
  formatPrice,
  onPressVideo,
  handleThreeDotsPress,
}) => {
  const prod = item.product || {};
  const video = item.content?.videoUrl || "";
  const caption = item.content?.caption || "";
  const creatorName = item.creator?.name || "AURA Creator";
  const creatorUsername = item.creator?.username || "aura_curator";
  const creatorAvatar = item.creator?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150";

  const videoPlayer = useVideoPlayer(video, (p) => {
    p.loop = true;
    p.muted = feedMuted;
    p.play();
  });

  useEffect(() => {
    videoPlayer.muted = feedMuted;
  }, [feedMuted, videoPlayer]);

  return (
    <View style={{ backgroundColor: "#FFFFFF", marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#F5F5F7", paddingBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={{ uri: creatorAvatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }} />
          <View>
            <Text style={{ fontWeight: "700", fontSize: 14, color: "#111111" }}>{creatorName}</Text>
            <Text style={{ fontSize: 11, color: "#8E8E93" }}>@{creatorUsername} • Commerce</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleThreeDotsPress(item)}>
          <Lucide name="ellipsis-horizontal" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        activeOpacity={0.95} 
        onPress={onPressVideo}
        style={{ width: "100%", height: 380, position: "relative", backgroundColor: "#000000" }}
      >
        <VideoView
          player={videoPlayer}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          nativeControls={false}
        />
        <TouchableOpacity 
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center"
          }}
          onPress={(e) => {
            e.stopPropagation();
            setFeedMuted(!feedMuted);
          }}
        >
          <Lucide name={feedMuted ? "volume-mute" : "volume-high"} size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ fontSize: 13, color: "#111111", lineHeight: 18 }}>
          <Text style={{ fontWeight: "700" }}>{creatorUsername} </Text>
          {caption}
        </Text>
        
        <TouchableOpacity 
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F5F5F7",
            borderWidth: 1,
            borderColor: "#EAEAEA",
            borderRadius: 14,
            padding: 10,
            marginTop: 12,
          }}
          onPress={() => {
            triggerHaptic("medium");
            setSelectedProductForPreview(prod);
            setPreviewFeedItemId(item.id);
            setPreviewSheetVisible(true);
          }}
        >
          <Image source={{ uri: prod.images?.[0] }} style={{ width: 44, height: 44, borderRadius: 8 }} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: "#8E8E93", textTransform: "uppercase" }}>FEATURED PRODUCT</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#111111", marginTop: 2 }}>{prod.name}</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#111111", marginRight: 8 }}>{formatPrice(prod.price)}</Text>
          <Lucide name="chevron-forward" size={16} color="#111111" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ReelsScreen() {
  const { 
    products, 
    stories, 
    loadingFeed, 
    fetchFeed, 
    fetchProducts, 
    triggerHaptic, 
    activeMaisonId, 
    currentUser, 
    authOnboard, 
    setCurrentUser, 
    activeProfile, 
    userProfiles, 
    createNewProfile, 
    switchActiveProfile, 
    fetchProfiles, 
    notifications, 
    loadingNotifications, 
    fetchNotifications, 
    markNotificationsRead, 
    hasMoreFeed, 
    detectLocation,
    feedItems,
    reelsSponsoredAd,
    loadingFeedItems,
    fetchFeedItems,
    fetchSearchResults,
    logEngagement,
    toggleFeedSave,
    logFeedShare,
    logFeedCartAdd,
    cart,
    formatPrice,
    addToCart
  } = useStore();
  const currentMaisonName = activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : (activeMaisonId ? activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "AURA Client"));
  const params = useLocalSearchParams<{ openDMs?: string; openSearch?: string; activeTab?: string; openCamera?: string; conversationId?: string }>();
  const insets = useSafeAreaInsets();
  const { getLayoutHeight } = useLayoutCache();
  const isScreenFocused = useIsFocused();

  const getItemLayout = (data: any, index: number) => {
    const item = data[index];
    if (!item) return { length: 0, offset: 0, index };
    const height = getLayoutHeight(item.id, item.caption || "", item.imageRatio || 1);
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const prevItem = data[i];
      if (prevItem) {
        offset += getLayoutHeight(prevItem.id, prevItem.caption || "", prevItem.imageRatio || 1);
      }
    }
    return { length: height, offset, index };
  };

  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const bottomBarHeight = 62 + insets.bottom;
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [tappedReelItem, setTappedReelItem] = useState<any>(null);
  const reelsFlatListRef = useRef<FlatList>(null);

  const loadMoreStories = () => {
    if (hasMoreFeed && !loadingFeed) {
      fetchFeed();
    }
  };

  const renderFeedFooter = () => {
    if (!loadingFeed) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color="#00f5ff" />
      </View>
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 200); // 200ms safety margin for Expo Router mounting
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // 🔔 Push notification interaction click listener & deep-linking
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      if (!data?.type) return;

      triggerHaptic("medium");

      switch (data.type) {
        case "FOLLOW":
          if (data.followerId) {
            router.push(`/profile/${data.followerId}`);
          }
          break;
        case "BRAND_DEAL":
          router.push("/dashboard");
          break;
        case "LIKE":
        case "COMMENT":
          // Refresh notifications and open activity drawer
          if (activeProfile?.id) {
            fetchNotifications(activeProfile.id);
          }
          setShowActivityDrawer(true);
          break;
        case "MESSAGE":
          setShowDMs(true);
          if (data.conversationId) {
            setChatConversationId(data.conversationId);
          }
          break;
        default:
          break;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeProfile]);

  useEffect(() => {
    let changed = false;
    const cleanParams: Record<string, string | undefined> = {};

    if (params?.openDMs === "true") {
      setShowDMs(true);
      cleanParams.openDMs = undefined;
      changed = true;
    }
    if (params?.conversationId) {
      setChatConversationId(params.conversationId);
      setShowDMs(true);
      cleanParams.conversationId = undefined;
      changed = true;
    }
    if (params?.openSearch === "true") {
      setShowExploreGrid(true);
      cleanParams.openSearch = undefined;
      changed = true;
    }
    if (params?.activeTab === "reels") {
      setActiveFeedTab("reels");
      setIsReelsFullScreen(true);
      cleanParams.activeTab = undefined;
      changed = true;
    }
    if (params?.openCamera === "true") {
      setShowReelCamera(true);
      cleanParams.openCamera = undefined;
      changed = true;
    }

    if (changed) {
      router.setParams(cleanParams as any);
    }
  }, [params]);
  const [showDMs, setShowDMs] = useState(false);
  const [showLiveShowroom, setShowLiveShowroom] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showroomMode, setShowroomMode] = useState<"lobby" | "viewer">("lobby");
  const [showroomMaisonId, setShowroomMaisonId] = useState("rare_raven");
  const [showroomMaisonName, setShowroomMaisonName] = useState("Rare Raven");
  const [showroomSessionId, setShowroomSessionId] = useState<string | undefined>(undefined);

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/mobile/live`);
      const data = await res.json();
      if (data.success && data.sessions) {
        setActiveSessions(data.sessions);
      }
    } catch (e) {
      console.warn("Failed to fetch active live sessions:", e);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 8000);
    return () => clearInterval(interval);
  }, []);

  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [isSeller, setIsSeller] = useState(false);

  // 🔔 ACTIVITY DRAWER & NOTIFICATIONS REAL-TIME POLLING
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  useEffect(() => {
    if (activeProfile?.id) {
      fetchNotifications(activeProfile.id);
      const pollInterval = setInterval(() => {
        fetchNotifications(activeProfile.id);
      }, 10000);
      return () => clearInterval(pollInterval);
    }
  }, [activeProfile?.id]);

  const [showExploreGrid, setShowExploreGrid] = useState(false);
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState<boolean>(false);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostAudio, setNewPostAudio] = useState("");
  const [newPostAI, setNewPostAI] = useState(false);
  const [newPostProduct, setNewPostProduct] = useState("");
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showAudioInput, setShowAudioInput] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagPeople, setShowTagPeople] = useState(false);
  const [newPostTaggedPeople, setNewPostTaggedPeople] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<"everyone" | "followers" | "close_friends">("everyone");
  const [showAudienceSelector, setShowAudienceSelector] = useState(false);
  const [newPostShareFeed, setNewPostShareFeed] = useState(true);

  // AURA Home Feed State Extensions
  const [selectedCategory, setSelectedCategory] = useState("For You");
  const [previewSheetVisible, setPreviewSheetVisible] = useState(false);
  const [selectedProductForPreview, setSelectedProductForPreview] = useState<any>(null);
  const [previewFeedItemId, setPreviewFeedItemId] = useState<string | undefined>(undefined);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([
    { id: "msg_init", sender: "ai", text: "Welcome to AURA Conversational Shopping. I am your concierge. Ask me anything, e.g., 'Find oversized hoodies under ₹1500' or 'Show me quiet luxury bags'." }
  ]);
  const [aiChatQuery, setAiChatQuery] = useState("");

  // New Tab switch states: "grid" | "reels" | "live" | "posts"
  const [activeFeedTab, setActiveFeedTab] = useState<"grid" | "reels" | "live" | "posts">("posts");
  
  // Sound states and reels camera overlay states
  const [feedMuted, setFeedMuted] = useState(true);
  // ── Sponsored Ad Modal State ──
  const [browserModalVisible, setBrowserModalVisible] = useState(false);
  const [browserUrl, setBrowserUrl] = useState("");
  const [productsSheetVisible, setProductsSheetVisible] = useState(false);
  const [productsSheetItems, setProductsSheetItems] = useState<any[]>([]);
  const [leadGenVisible, setLeadGenVisible] = useState(false);
  const [leadGenMeta, setLeadGenMeta] = useState<any>({});
  const [showReelCamera, setShowReelCamera] = useState(false);

  // Reels created locally by the user
  const [localReels, setLocalReels] = useState<any[]>([]);
  const { instaStories: activeInstaStories, addInstaStorySlide } = useStore();

  // Premium collapsible headers & full screen states
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isReelsFullScreen, setIsReelsFullScreen] = useState(false);

  // Advanced Options States
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [likesHidden, setLikesHidden] = useState(false);
  const [sharingEnabled, setSharingEnabled] = useState(true);
  const [promoteReel, setPromoteReel] = useState(false);
  const [crossPostEnabled, setCrossPostEnabled] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("06:00 PM");
  const [allowDownload, setAllowDownload] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // 👤 SOVEREIGN MULTI-PROFILE & FEED MATCHMAKING STATES
  // ═══════════════════════════════════════════════════════════════
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  
  // Add Profile Wizard inputs
  const [newProfileType, setNewProfileType] = useState<"PERSONAL" | "INFLUENCER" | "BUSINESS">("PERSONAL");
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileUsername, setNewProfileUsername] = useState("");
  const [newProfileCategory, setNewProfileCategory] = useState("Fashion");
  const [newProfilePrivate, setNewProfilePrivate] = useState(false);
  const [newProfileTaxId, setNewProfileTaxId] = useState("");
  const [newProfileWebsite, setNewProfileWebsite] = useState("");
  const [newProfileGstExempt, setNewProfileGstExempt] = useState(false);
  const [addProfileLoading, setAddProfileLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProfiles(currentUser.id);
    }
  }, [currentUser]);

  // ═══════════════════════════════════════════════════════════════
  // 🏛️ SOVEREIGN ONBOARDING FLOW STATE
  // ═══════════════════════════════════════════════════════════════
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardStep, setOnboardStep] = useState<"select" | "personal" | "influencer" | "business">("select");
  const [onboardLoading, setOnboardLoading] = useState(false);
  // Personal
  const [onboardPrivate, setOnboardPrivate] = useState(false);
  // Influencer
  const [onboardInfluencerCategory, setOnboardInfluencerCategory] = useState("Fashion");
  const INFLUENCER_CATEGORIES = ["Fashion", "Health", "Education", "Art", "Technology", "Food", "Travel", "Music", "Fitness", "Beauty"];
  // Business
  const [onboardBrandName, setOnboardBrandName] = useState("");
  const [onboardWebsite, setOnboardWebsite] = useState("");
  const [onboardGstExempt, setOnboardGstExempt] = useState(false);
  const [onboardTaxId, setOnboardTaxId] = useState("");

  // Trigger onboarding modal after login/signup if user hasn't onboarded
  useEffect(() => {
    if (currentUser && currentUser.isOnboarded === false) {
      setShowOnboardModal(true);
    }
  }, [currentUser]);

  const handleSubmitOnboarding = async (accountType: "PERSONAL" | "INFLUENCER" | "BUSINESS") => {
    if (!currentUser) return;
    setOnboardLoading(true);
    triggerHaptic("medium");

    const payload: any = {
      userId: currentUser.id,
      accountType,
    };

    if (accountType === "PERSONAL") {
      payload.isPrivate = onboardPrivate;
    } else if (accountType === "INFLUENCER") {
      payload.influencerCategory = onboardInfluencerCategory;
    } else if (accountType === "BUSINESS") {
      payload.brandName = onboardBrandName.trim();
      payload.website = onboardWebsite.trim();
      payload.isGstExempt = onboardGstExempt;
      if (!onboardGstExempt) {
        payload.taxId = onboardTaxId.trim();
      }
    }

    try {
      const res = await authOnboard(payload);
      if (res.success) {
        triggerHaptic("success");
        setShowOnboardModal(false);
        setOnboardStep("select");
        Alert.alert(
          "Sovereign Identity Activated",
          `Your ${accountType === "PERSONAL" ? "Personal" : accountType === "INFLUENCER" ? "Creator" : "Business Maison"} profile is now live on the AURA mesh!`
        );
      } else {
        triggerHaptic("heavy");
        Alert.alert("Onboarding Failed", res.error || "Could not activate your sovereign identity.");
      }
    } catch (e: any) {
      triggerHaptic("heavy");
      Alert.alert("Connection Failure", e.message || "Failed to reach onboarding gateway.");
    } finally {
      setOnboardLoading(false);
    }
  };

  // Interactive Stories overlay state
  const [selectedStoriesGroup, setSelectedStoriesGroup] = useState<any>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyReplyText, setStoryReplyText] = useState("");
  const [storyPaused, setStoryPaused] = useState(false);

  // Comments, Saves, and Options Bottom Sheet states
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState<any>(null);
  const [shareSearch, setShareSearch] = useState("");
  const [showThreeDotsModal, setShowThreeDotsModal] = useState(false);
  const [threeDotsTargetPost, setThreeDotsTargetPost] = useState<any>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsTargetPost, setCommentsTargetPost] = useState<any>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const commentInputRef = useRef<any>(null);
  const [postComments, setPostComments] = useState<Record<string, any[]>>({
    s1: [
      { id: "1", username: "julian_rossi", text: "Stunning! The liquid metal design flows so naturally.", time: "2h" },
      { id: "1_r1", username: "alok_curator", text: "@julian_rossi Agreed! The chrome finish is breathtaking.", time: "1h", parentId: "1" },
      { id: "2", username: "namita.thapar", text: "Is this limited edition? Need early access reservation.", time: "1h" },
    ],
    s2: [
      { id: "1", username: "garimahuja05", text: "Calfskin stitching is flawless. High fidelity quiet luxury.", time: "4h" }
    ],
    s3: [
      { id: "1", username: "mikai.vid", text: "Absolute masterpiece from Milan! 🔥✨", time: "3h" }
    ],
    s4: [
      { id: "1", username: "priya_mehta", text: "Velvet slit draping is unreal. Ordering ASAP!", time: "50m" }
    ]
  });

  const handleCommentsPress = (item: any) => {
    triggerHaptic("medium");
    setCommentsTargetPost(item);
    if (!postComments[item.id]) {
      const defaultComms = item.comments || [
        { id: "mock_1", username: "dylan_v", text: "Incredible craftsmanship here.", time: "1h" },
        { id: "mock_2", username: "sara.k", text: "Absolutely stunning style!", time: "45m" }
      ];
      setPostComments(prev => ({ ...prev, [item.id]: defaultComms }));
    }
    setShowCommentsModal(true);
  };

  const navigateToUserProfile = (username: string) => {
    triggerHaptic("medium");
    setShowCommentsModal(false);
    setShowActivityDrawer(false);
    
    // Normalize format to lowercase with underscores
    const cleanUsername = username.toLowerCase().replace(/\s+/g, "_").replace(/['']/g, "");
    
    const isOwnProfile = 
      (activeProfile && activeProfile.username?.toLowerCase() === cleanUsername) ||
      (activeMaisonId && activeMaisonId.toLowerCase() === cleanUsername) ||
      (userProfiles && userProfiles.some((p: any) => p.username?.toLowerCase() === cleanUsername));

    if (isOwnProfile) {
      router.push("/account");
    } else {
      router.push(`/profile/${cleanUsername}` as any);
    }
  };

  const handleMaisonProfilePress = (item: any) => {
    const creatorName = item.user?.name || "Alok Maison";
    navigateToUserProfile(creatorName);
  };

  const handleThreeDotsPress = (item: any) => {
    triggerHaptic("medium");
    setThreeDotsTargetPost(item);
    setShowThreeDotsModal(true);
  };

  const handleSavePress = (id: string) => {
    triggerHaptic("medium");
    setSavedPosts(prev => {
      const nextState = !prev[id];
      if (nextState) {
        Alert.alert("Collection Synced", "Post saved securely to your luxury archive collection ledger.");
      }
      return { ...prev, [id]: nextState };
    });
  };

  // Live Showroom state variables
  const [activeLiveMode, setActiveLiveMode] = useState<"lobby" | "viewer" | "broadcaster">("lobby");
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [liveCommentText, setLiveCommentText] = useState("");
  const [liveViewerCount, setLiveViewerCount] = useState(140);
  const [liveHeartsCount, setLiveHeartsCount] = useState(384);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [streamStartTime, setStreamStartTime] = useState<number>(0);
  const [showLiveSettlement, setShowLiveSettlement] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);



  const handleSelectMedia = async () => {
    triggerHaptic("light");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "AURA Sovereign core needs gallery access to upload high-fidelity curations.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setSelectedMediaUri(uri);
        const isVideo = uri.toLowerCase().endsWith(".mp4") || uri.toLowerCase().endsWith(".mov");
        if (!isVideo) {
          setShowImageEditor(true);
        }
      } else {
        Alert.alert(
          "Curation Sandbox",
          "No media chosen. Would you like to use a premium mock curation asset for testing?",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Use Curation Reel", 
              onPress: () => {
                setSelectedMediaUri("https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40149-large.mp4");
              }
            }
          ]
        );
      }
    } catch (error) {
      console.warn("Native picker issue, falling back:", error);
      setSelectedMediaUri("https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40149-large.mp4");
    }
  };

  const handleSharePost = async () => {
    if (!selectedMediaUri) return;
    setIsPublishingPost(true);
    triggerHaptic("success");

    try {
      const res = await fetch(`${API_HOST}/api/mobile/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: isSeller ? activeMaisonId : (currentUser?.id || activeProfile?.id || "user_2pk5xskr"),
          url: selectedMediaUri,
          thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
          caption: newPostCaption || null,
          location: newPostLocation || null,
          music: newPostAudio || null,
          artifactId: newPostProduct || null,
          taggedPeople: newPostTaggedPeople || null,
          aiLabel: newPostAI,
          audience: selectedAudience,
          shareToFeed: newPostShareFeed,
          fediverseSharing: crossPostEnabled
        })
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert("Syndication Success", "Your visual masterpiece has been syndicated to the AURA Social Mesh!");
        setSelectedMediaUri(null);
        setNewPostCaption("");
        setNewPostLocation("");
        setNewPostAudio("");
        setNewPostAI(false);
        setNewPostProduct("");
        setNewPostTaggedPeople("");
        setSelectedAudience("everyone");
        setNewPostShareFeed(true);
        setShowAudioInput(false);
        setShowLocationInput(false);
        setShowTagPeople(false);
        setShowProductSelector(false);
        setShowAudienceSelector(false);
        setCommentsEnabled(true);
        setLikesHidden(false);
        setSharingEnabled(true);
        setPromoteReel(false);
        setCrossPostEnabled(false);
        setIsScheduled(false);
        setAllowDownload(true);
        setShowAdvancedOptions(false);
        fetchFeed();
      } else {
        Alert.alert("Syndication Interrupted", "Server failed to process sovereign social ledger entry.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Network Converge Failure", "Failed to connect to AURA database node.");
    } finally {
      setIsPublishingPost(false);
    }
  };



  // Periodic comments and statistics generator for Simulated Live streams
  useEffect(() => {
    let commentInterval: any;
    let statsInterval: any;
    
    if (activeLiveMode === "viewer" || activeLiveMode === "broadcaster") {
      setLiveComments([
        { id: "1", user: "Julian Rossi", text: "Breathtaking fits, this is true haute couture! 👏👏" },
        { id: "2", user: "namita.thapar", text: "Are early-access coupon reservations stackable?" },
        { id: "3", user: "garimahuja05", text: "Obsidian Gold Vestment looks absolutely unreal live." }
      ]);
      
      const MOCK_LIVE_COMMENTS = [
        "Is this calfskin ethically sourced from certified nodes?",
        "Beautiful styling. The gold accents highlight the visual geometry.",
        "Just loaded my Ad Wallet, will definitely bid CPC on this keyword!",
        "Can we trigger a repricing evaluation loop right now?",
        "This showroom stream has 120Hz physics flow, so smooth!",
        "Stunning drape jacket, ordering to Dubai pavilion!",
        "Sovereign curators absolutely crushing this launch."
      ];
      
      commentInterval = setInterval(() => {
        const randComment = MOCK_LIVE_COMMENTS[Math.floor(Math.random() * MOCK_LIVE_COMMENTS.length)];
        const randUser = PLATFORM_USERS[Math.floor(Math.random() * PLATFORM_USERS.length)].username;
        setLiveComments(prev => [...prev.slice(-30), { id: Date.now().toString(), user: randUser, text: randComment }]);
      }, 3500);

      statsInterval = setInterval(() => {
        setLiveViewerCount(prev => Math.max(10, prev + Math.floor(Math.random() * 11) - 5));
        setLiveHeartsCount(prev => prev + Math.floor(Math.random() * 3));
      }, 4000);
    }

    return () => {
      clearInterval(commentInterval);
      clearInterval(statsInterval);
    };
  }, [activeLiveMode]);

  // Hearts drifting up physics tick
  useEffect(() => {
    let heartTimer: any;
    if (floatingHearts.length > 0) {
      heartTimer = setInterval(() => {
        setFloatingHearts(prev => 
          prev
            .map(h => ({ ...h, y: h.y - 6, x: h.x + Math.sin(h.y / 20) * 2 }))
            .filter(h => h.y > 0)
        );
      }, 30);
    }
    return () => clearInterval(heartTimer);
  }, [floatingHearts]);

  // Story slide viewer ticks — pauses when user holds screen
  useEffect(() => {
    let storyTimer: any;
    if (selectedStoriesGroup && !storyPaused) {
      storyTimer = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            handleStoryNext();
            return 0;
          }
          return prev + 1;
        });
      }, 50);
    }
    return () => clearInterval(storyTimer);
  }, [selectedStoriesGroup, activeSlideIndex, storyPaused]);

  const handleStoryNext = () => {
    if (!selectedStoriesGroup) return;
    const slidesCount = selectedStoriesGroup.slides?.length || 0;
    if (activeSlideIndex < slidesCount - 1) {
      setActiveSlideIndex(prev => prev + 1);
      setStoryProgress(0);
    } else {
      // Find next story group
      const currentIdx = activeInstaStories.findIndex(s => s.id === selectedStoriesGroup.id);
      if (currentIdx !== -1 && currentIdx < activeInstaStories.length - 1) {
        setSelectedStoriesGroup(activeInstaStories[currentIdx + 1]);
        setActiveSlideIndex(0);
        setStoryProgress(0);
      } else {
        setSelectedStoriesGroup(null);
      }
    }
  };

  const handleStoryPrev = () => {
    if (!selectedStoriesGroup) return;
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
      setStoryProgress(0);
    } else {
      // Find previous story group
      const currentIdx = activeInstaStories.findIndex(s => s.id === selectedStoriesGroup.id);
      if (currentIdx > 0) {
        setSelectedStoriesGroup(activeInstaStories[currentIdx - 1]);
        setActiveSlideIndex(0);
        setStoryProgress(0);
      } else {
        // Just reset current slide
        setStoryProgress(0);
      }
    }
  };

  const handleSendStoryReply = () => {
    if (!storyReplyText.trim()) return;
    triggerHaptic("medium");
    Alert.alert("Reply Synced", `Sent DM to @${selectedStoriesGroup.username}: "${storyReplyText}"`);
    setStoryReplyText("");
    setSelectedStoriesGroup(null);
  };

  const handleSpawnHeart = () => {
    triggerHaptic("light");
    const newHeart: FloatingHeart = {
      id: Date.now().toString() + Math.random().toString(),
      x: width * 0.75 + (Math.random() * 40 - 20),
      y: height - 120,
      scale: 0.6 + Math.random() * 0.8
    };
    setFloatingHearts(prev => [...prev, newHeart]);
    setLiveHeartsCount(prev => prev + 1);
  };

  const handleGoLive = () => {
    triggerHaptic("heavy");
    setStreamStartTime(Date.now());
    setLiveViewerCount(180);
    setLiveHeartsCount(420);
    setActiveLiveMode("broadcaster");
  };

  const handleEndLiveStream = () => {
    triggerHaptic("success");
    const durationSec = Math.floor((Date.now() - streamStartTime) / 1000);
    const mm = Math.floor(durationSec / 60).toString().padStart(2, "0");
    const ss = (durationSec % 60).toString().padStart(2, "0");
    
    // Generate mock ledger settlement summary
    const revenue = Math.floor(180000 + Math.random() * 420000);
    const keysMinted = Math.floor(2 + Math.random() * 6);
    
    setSettlementData({
      duration: `${mm}:${ss}`,
      viewers: liveViewerCount + Math.floor(Math.random() * 50),
      hearts: liveHeartsCount,
      revenue: `₹${revenue.toLocaleString()}`,
      keys: keysMinted
    });
    
    setActiveLiveMode("lobby");
    setShowLiveSettlement(true);
  };

  const handleSendLiveComment = () => {
    if (!liveCommentText.trim()) return;
    triggerHaptic("light");
    setLiveComments(prev => [...prev, { id: Date.now().toString(), user: "alok_maison", text: liveCommentText }]);
    setLiveCommentText("");
  };

  useEffect(() => {
    fetchFeed();
    fetchProducts();
    fetchFeedItems("", "For You", true);
  }, []);

  const handleLikePress = (id: string) => {
    triggerHaptic("heavy");
    const wasLiked = !!likedReels[id];
    
    // 1. Optimistic state change
    setLikedReels(prev => ({ ...prev, [id]: !wasLiked }));
    
    // 2. Background sync
    logEngagement(id, "like").catch(e => {
      console.warn("Optimistic like toggle failed, reverting:", e);
      setLikedReels(prev => ({ ...prev, [id]: wasLiked }));
    });
  };

  // ── Sponsored Ad CTA Handler ──
  const handleAdCtaPress = async (ctaType: string, metadata: any) => {
    if (metadata.creativeId) {
      try {
        await fetch(`${API_HOST}/api/mobile/ads/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creativeId: metadata.creativeId,
            userId: currentUser?.id,
            cpcPrice: metadata.cpcPrice,
          }),
        });
      } catch (err) {
        console.warn("Ad click tracking failed:", err);
      }
    }

    switch (ctaType) {
      case "APPLY_NOW":
      case "LEARN_MORE":
      case "SIGN_UP":
        // Open in-app browser for website traffic ads
        if (metadata.targetUrl) {
          setBrowserUrl(metadata.targetUrl);
          setBrowserModalVisible(true);
        }
        break;
      case "SHOP_NOW":
        // Open explore products sheet
        if (metadata.associatedProducts?.length > 0) {
          const matchedProducts = products.filter((p: any) =>
            metadata.associatedProducts.includes(p.id)
          );
          setProductsSheetItems(
            matchedProducts.length > 0
              ? matchedProducts.map((p: any) => ({
                  id: p.id,
                  title: p.title || p.name,
                  image: p.images?.[0] || p.image || "",
                  price: p.price || 0,
                }))
              : products.slice(0, 6).map((p: any) => ({
                  id: p.id,
                  title: p.title || p.name,
                  image: p.images?.[0] || p.image || "",
                  price: p.price || 0,
                }))
          );
          setProductsSheetVisible(true);
        } else {
          // Fallback: show all products
          setProductsSheetItems(
            products.slice(0, 6).map((p: any) => ({
              id: p.id,
              title: p.title || p.name,
              image: p.images?.[0] || p.image || "",
              price: p.price || 0,
            }))
          );
          setProductsSheetVisible(true);
        }
        break;
      case "FOLLOW":
        // Follow action — just show a toast
        triggerHaptic("heavy");
        Alert.alert("Followed!", "You are now following this brand.");
        break;
      default:
        if (metadata.targetUrl) {
          setBrowserUrl(metadata.targetUrl);
          setBrowserModalVisible(true);
        }
        break;
    }
  };

  const handleShare = (item: any) => {
    triggerHaptic("medium");
    setShareSearch("");
    setShareTargetPost(item);
    setShowShareSheet(true);
  };

  const reelHeight = (isReelsFullScreen && activeFeedTab === "reels") 
    ? (height - (52 + insets.bottom)) 
    : (height - insets.top - 210);

  const floatingBottomOffset = isReelsFullScreen ? 65 : 20;

  const getReelItemLayout = (data: any, index: number) => ({
    length: reelHeight,
    offset: reelHeight * index,
    index,
  });

  const renderReelItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <FeedCard
        item={item}
        index={index}
        activeReelIndex={activeStoryIndex}
        isScreenFocused={isScreenFocused}
        feedMuted={feedMuted}
        products={products}
        likedPosts={likedReels}
        savedPosts={savedPosts}
        floatingBottomOffset={floatingBottomOffset}
        reelHeight={reelHeight}
        handleMaisonProfilePress={handleMaisonProfilePress}
        handleLikePress={handleLikePress}
        handleCommentsPress={handleCommentsPress}
        handleShare={handleShare}
        handleSavePress={handleSavePress}
        handleThreeDotsPress={handleThreeDotsPress}
        commentsCount={postComments[item.id] ? postComments[item.id].length : (item.comments?.length || 18)}
        onCtaPress={handleAdCtaPress}
      />
    );
  };

  const simulatedStories = [
    { 
      id: "s1", 
      url: "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40149-large.mp4", 
      caption: "Premium Avant-Garde curations for selected nodes. Liquid metal silk blueprints synced to your core vault.", 
      likesCount: 412, 
      comments: [1,2,3], 
      user: { name: "Gucci Atelier" }, 
      artifact: { title: "Obsidian Gold Vestment", price: 185000 },
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
      isVideo: true 
    },
    { 
      id: "s2", 
      url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400", 
      caption: "Bespoke fabrics handpicked in Bengaluru flagships. The structural drape jacket in absolute matte linen.", 
      likesCount: 654, 
      comments: [1,2], 
      user: { name: "Alok Maison" }, 
      artifact: { title: "Atelier Silk Drape Jacket", price: 245000 },
      thumbnail: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400",
      isVideo: false 
    },
    { 
      id: "s3", 
      url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400", 
      caption: "Observe active coordinates: Milan High-Fidelity runways preview. Pure cyber-quiet-luxury.", 
      likesCount: 284, 
      comments: [1], 
      user: { name: "Julian Rossi" }, 
      artifact: { title: "Liquid Satin Evening Gown", price: 340000 },
      thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400",
      isVideo: false 
    },
    { 
      id: "s4", 
      url: "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4", 
      caption: "Atelier physical-digital showroom broadcast loops. Dynamic pricing nodes active.", 
      likesCount: 890, 
      comments: [1,2,3,4,5], 
      user: { name: "Elena Rossi" }, 
      artifact: { title: "Atelier Velvet Slit Dress", price: 195000 },
      thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
      isVideo: true 
    }
  ];

  const displayStories = React.useMemo(() => {
    // 1. Get all video posts from the Home feed (feedItems) and translate them to reels/stories format
    const feedReels = feedItems
      .filter((item: any) => item.type === "CREATOR_COMMERCE" || item.type === "SPONSORED_AD" || item.content?.videoUrl)
      .map((item: any) => ({
        id: item.id,
        url: item.content?.videoUrl || item.content?.mediaUrl || item.sponsoredMetadata?.creativeMediaUrl || "",
        caption: item.content?.caption || item.sponsoredMetadata?.ctaText || "",
        creator: item.creator,
        music: "AURA Original Sound",
        likes: item.content?.likesCount || 0,
        commentsCount: item.content?.commentsCount || 0,
        comments: item.comments || [],
        isVideo: true,
        product: item.product,
        type: item.type,
        sponsoredMetadata: item.sponsoredMetadata,
      }));

    // 2. Get base stories
    const baseStories = [
      ...localReels,
      ...(stories.length > 0 ? stories.filter((s: any) => s.music !== "STORY_ONLY") : simulatedStories)
    ];

    // Combine them, avoiding duplicates
    const combined = [...baseStories];
    feedReels.forEach((fr) => {
      if (!combined.some((s) => s.id === fr.id)) {
        combined.push(fr);
      }
    });

    // Prepend dedicated REELS placement ad if not already in feed
    if (reelsSponsoredAd) {
      const reelsAdItem = {
        id: reelsSponsoredAd.id,
        url: reelsSponsoredAd.content?.videoUrl || reelsSponsoredAd.content?.mediaUrl || reelsSponsoredAd.sponsoredMetadata?.creativeMediaUrl || "",
        caption: reelsSponsoredAd.content?.caption || reelsSponsoredAd.sponsoredMetadata?.ctaText || "",
        creator: reelsSponsoredAd.creator,
        music: "Sponsored",
        likes: 0,
        commentsCount: 0,
        comments: [],
        isVideo: true,
        product: reelsSponsoredAd.product,
        type: "SPONSORED_AD",
        sponsoredMetadata: reelsSponsoredAd.sponsoredMetadata,
      };
      if (!combined.some((s) => s.id === reelsAdItem.id)) {
        combined.unshift(reelsAdItem);
      }
    }

    // If we have a tappedReelItem, we want to make sure it's present in the list
    if (tappedReelItem) {
      const existsIndex = combined.findIndex((s) => s.id === tappedReelItem.id);
      if (existsIndex === -1) {
        const translatedTapped = {
          id: tappedReelItem.id,
          url: tappedReelItem.content?.videoUrl || tappedReelItem.content?.mediaUrl || "",
          caption: tappedReelItem.content?.caption || "",
          creator: tappedReelItem.creator,
          music: "AURA Original Sound",
          likes: tappedReelItem.content?.likesCount || 0,
          commentsCount: tappedReelItem.content?.commentsCount || 0,
          comments: tappedReelItem.comments || [],
          isVideo: true,
          product: tappedReelItem.product
        };
        combined.unshift(translatedTapped);
      }
    }

    return combined;
  }, [tappedReelItem, localReels, stories, simulatedStories, feedItems, reelsSponsoredAd]);

  const handleOpenFeedReel = (item: any) => {
    triggerHaptic("medium");
    setTappedReelItem(item);
    
    // Switch feed tab to reels
    setActiveFeedTab("reels");
    setIsReelsFullScreen(true);

    setTimeout(() => {
      // Find the index in displayStories
      const targetIndex = displayStories.findIndex(s => s.id === item.id);
      if (targetIndex !== -1) {
        setActiveStoryIndex(targetIndex);
        reelsFlatListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
      } else {
        // If prepended dynamically: index 0
        setActiveStoryIndex(0);
        reelsFlatListRef.current?.scrollToIndex({ index: 0, animated: false });
      }
    }, 120);
  };

  // Synchronized real-time soundtrack player for active feeds
  const feedSoundRef = useRef<any>(null);

  useEffect(() => {
    const syncFeedAudio = async () => {
      try {
        // Unload any existing feed sound
        if (feedSoundRef.current) {
          feedSoundRef.current.pause();
          feedSoundRef.current.remove();
          feedSoundRef.current = null;
        }

        // If muted or camera modal is open, do not play feed audio
        if (feedMuted || showReelCamera) {
          return;
        }

        // Handle Reels swiper active track
        if (activeFeedTab === "reels" && displayStories.length > activeStoryIndex) {
          const activeItem = displayStories[activeStoryIndex];
          if (activeItem && activeItem.audioTrack && activeItem.audioTrack.url) {
            const player = createAudioPlayer(activeItem.audioTrack.url, { downloadFirst: false });
            player.loop = true;
            player.play();
            feedSoundRef.current = player;
          }
        }
      } catch (error) {
        console.warn("Error syncing feed soundtrack playback:", error);
      }
    };

    syncFeedAudio();

    return () => {
      if (feedSoundRef.current) {
        feedSoundRef.current.pause();
        feedSoundRef.current.remove();
      }
    };
  }, [activeStoryIndex, activeFeedTab, feedMuted, showReelCamera, displayStories]);

  // 🎥 Predictive Video Prefetching Effect
  useEffect(() => {
    if (activeFeedTab === "reels" && displayStories.length > 0) {
      // Prefetch next 2 items ahead of current activeStoryIndex
      const start = activeStoryIndex + 1;
      const end = Math.min(activeStoryIndex + 2, displayStories.length - 1);
      
      for (let i = start; i <= end; i++) {
        const item = displayStories[i];
        if (item) {
          const mockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4";
          const videoUrl = item.url && item.url.endsWith(".mp4") ? item.url : mockVideoUrl;
          prefetchVideo(videoUrl).catch(e => {
            console.warn("Reel prefetch error for index", i, e);
          });
        }
      }
    }
  }, [activeStoryIndex, displayStories, activeFeedTab]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveStoryIndex(viewableItems[0].index || 0);
      triggerHaptic("light");
    }
  }).current;

  const handleScroll = (event: any) => {
    // Persistent header - disabled collapsing to prevent layout shifts during scroll
  };

  // Animated values for Creator post heart burst animation
  const [heartAnimScale] = useState(new Animated.Value(0));
  const [heartAnimOpacity] = useState(new Animated.Value(0));
  const [heartAnimItem, setHeartAnimItem] = useState<string | null>(null);
  
  const triggerHeartBurst = (itemId: string) => {
    setHeartAnimItem(itemId);
    heartAnimScale.setValue(0);
    heartAnimOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(heartAnimScale, {
        toValue: 1.5,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnimOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start(() => {
      setHeartAnimItem(null);
    });
  };

  const handleFeedItemLike = async (id: string) => {
    triggerHaptic("heavy");
    setLikedReels(prev => ({ ...prev, [id]: !prev[id] }));
    await logEngagement(id, "like");
  };

  const handleFeedItemSave = async (id: string) => {
    triggerHaptic("medium");
    setSavedPosts(prev => ({ ...prev, [id]: !prev[id] }));
    await toggleFeedSave(id);
    await logEngagement(id, "save");
  };

  const handleFeedItemShare = async (id: string) => {
    triggerHaptic("medium");
    const shareUrl = await logFeedShare(id);
    if (shareUrl) {
      Share.share({
        message: `Check out this amazing design on AURA: ${shareUrl}`,
      });
    }
  };

  const handleAiChatSubmit = () => {
    if (!aiChatQuery.trim()) return;
    triggerHaptic("light");
    const query = aiChatQuery;
    setAiChatMessages(prev => [...prev, { id: `user_${Date.now()}`, sender: "user", text: query }]);
    setAiChatQuery("");

    // Simulate AI Concierge Typing Response
    setTimeout(() => {
      triggerHaptic("medium");
      let matchedProd = null;
      let replyText = "I searched the AURA catalog for you. Here is the closest match for your query:";

      const lower = query.toLowerCase();
      if (lower.includes("bag") || lower.includes("carryall") || lower.includes("purse")) {
        matchedProd = products.find(p => p.id === "p4") || MOCK_PRODUCTS[3];
        replyText = "I found the Heritage Calfskin Carryall. It matches your quiet luxury carryall query. Handcrafted in Milan from premium full-grain leather:";
      } else if (lower.includes("hoodie") || lower.includes("vestment") || lower.includes("black")) {
        matchedProd = products.find(p => p.id === "p1") || MOCK_PRODUCTS[0];
        replyText = "Here is the Obsidian Gold Vestment. It features bespoke heavy-drape fabrics in deep obsidian shades, perfect for quiet luxury styling:";
      } else if (lower.includes("jacket") || lower.includes("trench") || lower.includes("coat")) {
        matchedProd = products.find(p => p.id === "p2") || MOCK_PRODUCTS[1];
        replyText = "Exquisite. I recommend the Atelier Silk Trench Jacket. A rare runway piece made from pure mulberry silk, complete with custom metal hardware details:";
      } else if (lower.includes("cuff") || lower.includes("jewelry") || lower.includes("accessory")) {
        matchedProd = products.find(p => p.id === "p3") || MOCK_PRODUCTS[2];
        replyText = "Here is the Cyber Penthouse Cuff. Brutalist luxury design cast in sterling silver with an electroplated raw platinum finish:";
      } else {
        matchedProd = products[Math.floor(Math.random() * products.length)] || MOCK_PRODUCTS[0];
        replyText = "I found this designer piece matching your taste in our current digital catalog. A limited-edition release:";
      }

      setAiChatMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: replyText,
        product: matchedProd
      }]);
    }, 800);
  };

  const renderFeedItem = ({ item, index }: { item: any; index: number }) => {
    if (item.type === "ASK_AURA_AI") {
      return (
        <TouchableOpacity 
          style={{
            marginHorizontal: 16,
            marginVertical: 12,
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#F5F5F7",
            borderWidth: 1,
            borderColor: "#EAEAEA",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic("medium");
            setShowAiAssistant(true);
          }}
        >
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#111111",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Lucide name="sparkles" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#111111" }}>Ask Aura AI Assistant</Text>
            <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>"Find oversized black hoodies under ₹1500"</Text>
          </View>
          <Lucide name="arrow-forward" size={16} color="#8E8E93" />
        </TouchableOpacity>
      );
    }

    const creatorName = item.creator?.name || "AURA Creator";
    const creatorUsername = item.creator?.username || "aura_curator";
    const creatorAvatar = item.creator?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150";

    const isLiked = likedReels[item.id] || false;
    const isSaved = savedPosts[item.id] || false;

    if (item.type === "CREATOR_POST") {
      const media = item.content?.mediaUrl || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600";
      const caption = item.content?.caption || "";
      const likesCount = item.content?.likesCount || 128;
      const commentsCount = postComments[item.id] ? postComments[item.id].length : (item.comments?.length || item.content?.commentsCount || 18);

      let lastTap = 0;
      const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTap < 300) {
          handleFeedItemLike(item.id);
          triggerHeartBurst(item.id);
        }
        lastTap = now;
      };

      return (
        <View style={{ backgroundColor: "#FFFFFF", marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#F5F5F7", paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
            <TouchableOpacity 
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              onPress={() => router.push(`/profile/${item.creator?.id || "aria.sterling"}`)}
            >
              <Image source={{ uri: creatorAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              <View>
                <Text style={{ fontWeight: "700", fontSize: 14, color: "#111111" }}>{creatorName}</Text>
                <Text style={{ fontSize: 11, color: "#8E8E93" }}>@{creatorUsername} • Creator</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleThreeDotsPress(item)}>
              <Lucide name="ellipsis-horizontal" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={{ position: "relative" }}>
            <ZoomableImage source={{ uri: media }} style={{ width: "100%", height: 380 }} />
            
            {heartAnimItem === item.id && (
              <Animated.View style={{
                position: "absolute",
                alignSelf: "center",
                top: "40%",
                zIndex: 10,
                transform: [{ scale: heartAnimScale }],
                opacity: heartAnimOpacity
              }}>
                <Lucide name="heart" size={80} color="#FF3B30" />
              </Animated.View>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity onPress={() => handleFeedItemLike(item.id)}>
                <Lucide name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#FF3B30" : "#111111"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleCommentsPress(item)}>
                <Lucide name="chatbubble-outline" size={23} color="#111111" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleShare(item)}>
                <Lucide name="paper-plane-outline" size={23} color="#111111" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleFeedItemSave(item.id)}>
              <Lucide name={isSaved ? "bookmark" : "bookmark-outline"} size={23} color={isSaved ? "#111111" : "#111111"} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontWeight: "700", fontSize: 13, color: "#111111", marginBottom: 4 }}>
              {(likesCount + (isLiked ? 1 : 0)).toLocaleString()} likes
            </Text>
            <Text style={{ fontSize: 13, color: "#111111", lineHeight: 18 }}>
              <Text style={{ fontWeight: "700" }}>{creatorUsername} </Text>
              {caption}
            </Text>
            <TouchableOpacity onPress={() => handleCommentsPress(item)}>
              <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 6 }}>
                View all {commentsCount} comments
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === "PRODUCT_POST") {
      const prod = item.product || {};
      const prodImg = prod.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400";
      const rating = prod.rating || 4.8;
      const discount = prod.discount || 0;

      return (
        <TouchableOpacity 
          style={{ 
            backgroundColor: "#FFFFFF", 
            marginHorizontal: 16, 
            marginBottom: 20, 
            borderRadius: 20, 
            borderWidth: 1, 
            borderColor: "#EAEAEA",
            overflow: "hidden" 
          }}
          activeOpacity={0.95}
          onPress={() => {
            triggerHaptic("medium");
            setSelectedProductForPreview(prod);
            setPreviewFeedItemId(item.id);
            setPreviewSheetVisible(true);
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5F5F7" }}>
            <TouchableOpacity 
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              onPress={() => router.push(`/profile/${item.creator?.id || "aria.sterling"}`)}
            >
              <Image source={{ uri: creatorAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              <View>
                <Text style={{ fontWeight: "700", fontSize: 14, color: "#111111" }}>{creatorName}</Text>
                <Text style={{ fontSize: 11, color: "#8E8E93" }}>@{creatorUsername} • Brand Shop</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleThreeDotsPress(item); }}>
              <Lucide name="ellipsis-horizontal" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          <Image source={{ uri: prodImg }} style={{ width: "100%", height: 320 }} contentFit="cover" placeholder="L184i9ofbHof00ayjZay~qj[ayof" transition={300} />
          
          {discount > 0 && (
            <View style={{ position: "absolute", top: 12, left: 12, backgroundColor: "#E5F9E7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: "#1F8722", fontSize: 10, fontWeight: "bold" }}>-{discount}% OFF</Text>
            </View>
          )}

          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#8E8E93", letterSpacing: 1 }}>AURA MAISON</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#111111", marginTop: 4 }}>{prod.name}</Text>
            
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <View style={{ flexDirection: "row", gap: 1 }}>
                {[1,2,3,4,5].map((s) => (
                  <Lucide key={s} name={s <= Math.floor(rating) ? "star" : "star-outline"} size={13} color="#FFB800" />
                ))}
              </View>
              <Text style={{ fontSize: 12, color: "#8E8E93" }}>{rating}</Text>
            </View>

            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111111", marginTop: 10 }}>{formatPrice(prod.price)}</Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#111111",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
                onPress={async (e) => {
                  e.stopPropagation();
                  triggerHaptic("success");
                  addToCart(prod);
                  await logFeedCartAdd(item.id, prod.id);
                }}
              >
                <Lucide name="cart-outline" size={18} color="#111111" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#111111" }}>Add to Cart</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#111111",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={async (e) => {
                  e.stopPropagation();
                  triggerHaptic("heavy");
                  addToCart(prod);
                  await logEngagement(item.id, "purchase");
                  router.push("/cart");
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === "SPONSORED_AD") {
      const media = item.content?.mediaUrl || item.sponsoredMetadata?.creativeMediaUrl || "";
      const caption = item.content?.caption || "";
      return (
        <View style={{ backgroundColor: "#FFFFFF", marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#F5F5F7", paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Image source={{ uri: creatorAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: "#111111" }}>{creatorName}</Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#8E8E93", backgroundColor: "#F0F0F0", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>Ad</Text>
                </View>
                <Text style={{ fontSize: 11, color: "#8E8E93" }}>Sponsored</Text>
              </View>
            </View>
          </View>
          {media ? (
            <Image source={{ uri: media }} style={{ width: "100%", height: 380 }} contentFit="cover" />
          ) : null}
          {caption ? (
            <Text style={{ paddingHorizontal: 16, paddingTop: 12, fontSize: 14, color: "#111111" }} numberOfLines={3}>{caption}</Text>
          ) : null}
          <TouchableOpacity
            style={{ marginHorizontal: 16, marginTop: 12, height: 44, borderRadius: 10, backgroundColor: "#111111", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 }}
            onPress={() => handleAdCtaPress(item.sponsoredMetadata?.ctaType || "LEARN_MORE", item.sponsoredMetadata || {})}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
              {item.sponsoredMetadata?.ctaText || "Learn more"}
            </Text>
            <Lucide name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    if (item.type === "CREATOR_COMMERCE") {
      return (
        <CreatorCommerceCard
          item={item}
          feedMuted={feedMuted}
          setFeedMuted={setFeedMuted}
          triggerHaptic={triggerHaptic}
          setSelectedProductForPreview={setSelectedProductForPreview}
          setPreviewFeedItemId={setPreviewFeedItemId}
          setPreviewSheetVisible={setPreviewSheetVisible}
          formatPrice={formatPrice}
          onPressVideo={() => handleOpenFeedReel(item)}
          handleThreeDotsPress={handleThreeDotsPress}
        />
      );
    }

    if (item.type === "LIVE_COMMERCE") {
      const thumbnail = item.content?.liveThumbnail || "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600";
      const title = item.content?.title || "Live Auction Drop";
      const viewerCount = item.content?.viewerCount || "2.1K";

      return (
        <View style={{ backgroundColor: "#FFFFFF", marginHorizontal: 16, marginBottom: 24, borderRadius: 20, borderWidth: 1, borderColor: "#EAEAEA", overflow: "hidden" }}>
          <View style={{ position: "relative" }}>
            <Image source={{ uri: thumbnail }} style={{ width: "100%", height: 260 }} contentFit="cover" placeholder="L184i9ofbHof00ayjZay~qj[ayof" transition={300} />
            <View style={{ position: "absolute", top: 12, left: 12, flexDirection: "row", gap: 6 }}>
              <View style={{ backgroundColor: "#FF3B30", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>LIVE</Text>
              </View>
              <View style={{ backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Lucide name="eye" size={12} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>{viewerCount}</Text>
              </View>
            </View>
          </View>

          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Image source={{ uri: creatorAvatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#111111" }}>{creatorName}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#111111", marginTop: 8 }}>{title}</Text>
            
            <TouchableOpacity 
              style={{
                height: 46,
                borderRadius: 12,
                backgroundColor: "#FF3B30",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 14,
              }}
              onPress={() => {
                triggerHaptic("medium");
                setShowroomMode("viewer");
                setShowroomMaisonId(item.creator?.id || "rare_raven");
                setShowroomMaisonName(creatorName);
                setShowroomSessionId("session_live");
                setShowLiveShowroom(true);
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Join Live Showroom</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  const unreadNotificationsCount = notifications ? notifications.filter((n: any) => !n.read).length : 0;

  const listData = [...feedItems];
  if (listData.length > 1) {
    const hasAiBar = listData.some(item => item.id === "ask_aura_ai_bar");
    if (!hasAiBar) {
      listData.splice(1, 0, { id: "ask_aura_ai_bar", type: "ASK_AURA_AI" });
    }
  } else if (listData.length === 1) {
    const hasAiBar = listData.some(item => item.id === "ask_aura_ai_bar");
    if (!hasAiBar) {
      listData.push({ id: "ask_aura_ai_bar", type: "ASK_AURA_AI" });
    }
  }

  return (
    <View style={[styles.container, activeFeedTab === "posts" && { backgroundColor: "#FFFFFF" }]}>
      <SafeAreaView style={[styles.safeAreaContainer, activeFeedTab === "posts" && { backgroundColor: "#FFFFFF" }]} edges={["top"]}>
        
        {/* 🏔️ TOP HEADER ROW */}
        {!(isReelsFullScreen && activeFeedTab === "reels") && (
          <View style={[
            styles.instaHeader, 
            activeFeedTab === "posts" && { 
              backgroundColor: "#FFFFFF", 
              borderBottomWidth: 1, 
              borderBottomColor: "#EAEAEA",
              height: 56
            }
          ]}>
            {/* Logo */}
            <TouchableOpacity onPress={() => triggerHaptic("light")}>
              <Text style={[
                styles.instaLogoText, 
                activeFeedTab === "posts" && { color: "#111111", fontSize: 20, fontWeight: "900", letterSpacing: 1 }
              ]}>
                AURA
              </Text>
            </TouchableOpacity>
            
            {/* Search Bar */}
            {activeFeedTab === "posts" ? (
              <View style={{
                flex: 1,
                marginHorizontal: 12,
                height: 36,
                borderRadius: 10,
                backgroundColor: "#F5F5F7",
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
              }}>
                <Lucide name="search-outline" size={16} color="#8E8E93" style={{ marginRight: 6 }} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#111111",
                    padding: 0,
                  }}
                  placeholder="Search creators, products..."
                  placeholderTextColor="#8E8E93"
                  value={selectedCategory === "For You" || selectedCategory === "Following" || selectedCategory === "Fashion" || selectedCategory === "Beauty" || selectedCategory === "Tech" || selectedCategory === "Fitness" || selectedCategory === "Luxury" || selectedCategory === "Trending" || selectedCategory === "Local" ? "" : selectedCategory}
                  onChangeText={(text) => {
                    setSelectedCategory(text);
                    if (text.trim() === "") {
                      fetchFeedItems("", "For You", true);
                    } else if (text.trim().length >= 2) {
                      fetchSearchResults(text);
                    }
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => { triggerHaptic("medium"); setShowProfileSwitcher(true); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={styles.instaLogoText}>
                  {activeProfile ? `@${activeProfile.username}`.toUpperCase() : "A U R A"}
                </Text>
                <Lucide name="chevron-down" size={14} color="#00f5ff" style={{ marginTop: 2 }} />
              </TouchableOpacity>
            )}

            <View style={styles.headerRightIcons}>
              <TouchableOpacity 
                onPress={() => { 
                  triggerHaptic("medium"); 
                  setShowActivityDrawer(true); 
                  if (activeProfile?.id) {
                    markNotificationsRead(activeProfile.id);
                  }
                }}
              >
                <View style={{ position: "relative" }}>
                  <Lucide 
                    name="notifications-outline" 
                    size={24} 
                    color={activeFeedTab === "posts" ? "#111111" : "#ffffff"} 
                  />
                  {unreadNotificationsCount > 0 && (
                    <View style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      backgroundColor: "#FF3B30",
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 4,
                    }}>
                      <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "bold" }}>
                        {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { triggerHaptic("medium"); router.push("/cart"); }}>
                <View style={{ position: "relative" }}>
                  <Lucide 
                    name="cart-outline" 
                    size={24} 
                    color={activeFeedTab === "posts" ? "#111111" : "#ffffff"} 
                  />
                  {cart.length > 0 && (
                    <View style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      backgroundColor: "#111111",
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 4,
                    }}>
                      <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "bold" }}>
                        {cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 🔴 STORIES + LIVE STRIP */}
        {!(isReelsFullScreen && activeFeedTab === "reels") && activeFeedTab === "posts" && (
          <View style={{
            backgroundColor: "#FFFFFF",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#F5F5F7",
          }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
            >
              {/* Your Story */}
              <TouchableOpacity 
                style={{ alignItems: "center" }}
                onPress={() => triggerHaptic("medium")}
              >
                <View style={{ position: "relative" }}>
                  <Image 
                    source={{ uri: currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80" }} 
                    style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: "#EAEAEA" }} 
                  />
                  <View style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: "#111111",
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Lucide name="add" size={12} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: "#8E8E93", marginTop: 6, fontWeight: "500" }}>Your Story</Text>
              </TouchableOpacity>

              {/* Live Streams (activeSessions) */}
              {activeSessions.map((session) => {
                const hostAvatar = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&w=150";
                return (
                  <TouchableOpacity 
                    key={session.id}
                    style={{ alignItems: "center" }}
                    onPress={() => {
                      triggerHaptic("medium");
                      setShowroomMode("viewer");
                      setShowroomMaisonId(session.maisonId);
                      setShowroomMaisonName(session.maisonName);
                      setShowroomSessionId(session.id);
                      setShowLiveShowroom(true);
                    }}
                  >
                    <LinearGradient
                      colors={["#FF2D55", "#FF9500"]}
                      style={{
                        width: 66,
                        height: 66,
                        borderRadius: 33,
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <View style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: "#FFFFFF",
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        <Image source={{ uri: hostAvatar }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                      </View>
                    </LinearGradient>
                    <View style={{
                      position: "absolute",
                      bottom: 16,
                      backgroundColor: "#FF3B30",
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: "#FFFFFF",
                    }}>
                      <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "bold" }}>LIVE</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#111111", marginTop: 6, fontWeight: "600" }}>
                      {session.maisonName.length > 10 ? `${session.maisonName.substring(0, 8)}...` : session.maisonName}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Creator Stories */}
              {activeInstaStories.filter(s => !s.isYourStory).map((story) => (
                <TouchableOpacity 
                  key={story.id}
                  style={{ alignItems: "center" }}
                  onPress={() => {
                    triggerHaptic("medium");
                    setSelectedStoriesGroup(story);
                    setActiveSlideIndex(0);
                    setStoryProgress(0);
                  }}
                >
                  <LinearGradient
                    colors={story.active ? ["#fb923c", "#d946ef", "#8b5cf6"] : ["#EAEAEA", "#EAEAEA"]}
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: 33,
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "#FFFFFF",
                      justifyContent: "center",
                      alignItems: "center"
                    }}>
                      <Image source={{ uri: story.avatar }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                    </View>
                  </LinearGradient>
                  <Text style={{ fontSize: 11, color: "#111111", marginTop: 6, fontWeight: "500" }}>
                    {story.username.length > 10 ? `${story.username.substring(0, 8)}...` : story.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 🏷️ STICKY CATEGORY FILTER CHIPS */}
        {!(isReelsFullScreen && activeFeedTab === "reels") && activeFeedTab === "posts" && (
          <View style={{
            backgroundColor: "#FFFFFF",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#F5F5F7",
          }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {[
                "For You",
                "Following",
                "Fashion",
                "Beauty",
                "Tech",
                "Fitness",
                "Luxury",
                "Trending",
                "Local"
              ].map((chip) => {
                const isSelected = selectedCategory === chip;
                return (
                  <TouchableOpacity 
                    key={chip} 
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isSelected ? "#111111" : "#F5F5F7",
                      borderWidth: 1,
                      borderColor: isSelected ? "#111111" : "#EAEAEA",
                    }}
                    onPress={() => {
                      triggerHaptic("light");
                      setSelectedCategory(chip);
                      if (chip === "For You") {
                        fetchFeedItems("", "For You", true);
                      } else if (chip === "Following") {
                        fetchFeedItems("", "Following", true);
                      } else {
                        fetchFeedItems(chip, "For You", true);
                      }
                    }}
                  >
                    <Text style={{
                      color: isSelected ? "#FFFFFF" : "#111111",
                      fontSize: 13,
                      fontWeight: "600",
                    }}>{chip}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 📺 SWITCH MAIN FEED CONTENT */}
        <View style={[styles.feedWrapper, activeFeedTab === "posts" && { backgroundColor: "#FFFFFF" }]}>
          
          {/* REELS TABS */}
          {activeFeedTab === "reels" ? (
            (loadingFeed && stories.length === 0) ? (
              <View style={styles.centerContainer}>
                <ShimmerFeedList count={2} />
              </View>
            ) : (
              <View style={{ flex: 1, position: "relative" }}>
                <FlatList
                  ref={reelsFlatListRef}
                  data={displayStories}
                  renderItem={renderReelItem}
                  keyExtractor={(item) => item.id}
                  pagingEnabled
                  snapToInterval={reelHeight}
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={{ itemVisiblePercentThreshold: 75 }}
                  onEndReached={loadMoreStories}
                  onEndReachedThreshold={0.5}
                  getItemLayout={getReelItemLayout}
                />

                {/* Floating top-left camera button to record a Reel */}
                <TouchableOpacity 
                  style={[styles.reelsCameraBtn, { top: insets.top + 16 }]} 
                  onPress={() => {
                    triggerHaptic("medium");
                    setShowReelCamera(true);
                  }}
                >
                  <Lucide name="add" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            )
          ) : (
            (loadingFeedItems && feedItems.length === 0) ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomBarHeight + 40, paddingHorizontal: 12, paddingTop: 12 }}>
                <ShimmerFeedList count={2} />
              </ScrollView>
            ) : (
              <FlatList
                data={listData}
                renderItem={renderFeedItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMoreStories}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFeedFooter}
                contentContainerStyle={{ paddingBottom: bottomBarHeight + 40 }}
                getItemLayout={getItemLayout}
              />
            )
          )}

        </View>

      </SafeAreaView>

      {/* 📥 DYNAMIC DIRECT MESSAGES SLIDE-UP MODAL PANEL */}
      <ChatDrawer
        visible={showDMs}
        onClose={() => {
          setShowDMs(false);
          setChatConversationId(null);
        }}
        bottomBarHeight={bottomBarHeight}
        activeMaisonId={activeMaisonId}
        isSeller={isSeller}
        setIsSeller={setIsSeller}
        products={products}
        activeInstaStories={activeInstaStories}
        onOpenStoryGroup={(story) => {
          setSelectedStoriesGroup(story);
          setActiveSlideIndex(0);
          setStoryProgress(0);
        }}
        initialConversationId={chatConversationId}
      />

      {/* 💬 Individual conversation is now handled inside ChatDrawer */}

      {/* ──────────────────────────────────────────────────── */}
      {/* 🏠 AURA BOTTOM NAVIGATION — 5 tabs with elevated Create */}
      {/* ──────────────────────────────────────────────────── */}
      <View style={[styles.auraBottomBar, { paddingBottom: insets.bottom, height: 62 + insets.bottom }]}>

        {/* TAB 1 — Home */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            setShowDMs(false);
            setShowExploreGrid(false);
            setIsReelsFullScreen(false);
            setActiveFeedTab("posts");
            router.push("/");
          }}
        >
          <Lucide
            name="home-outline"
            size={26}
            color={(!showDMs && (!isReelsFullScreen || activeFeedTab !== "reels")) ? "#00f5ff" : "rgba(255,255,255,0.45)"}
          />
          <Text style={[styles.auraTabLabel, { color: (!showDMs && (!isReelsFullScreen || activeFeedTab !== "reels")) ? "#00f5ff" : "rgba(255,255,255,0.35)" }]}>Home</Text>
        </TouchableOpacity>

        {/* TAB 2 — Reel */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            setShowDMs(false);
            setShowExploreGrid(false);
            setIsReelsFullScreen(true);
            setActiveFeedTab("reels");
          }}
        >
          <Lucide
            name="film-outline"
            size={26}
            color={(!showDMs && isReelsFullScreen && activeFeedTab === "reels") ? "#00f5ff" : "rgba(255,255,255,0.45)"}
          />
          <Text style={[styles.auraTabLabel, { color: (!showDMs && isReelsFullScreen && activeFeedTab === "reels") ? "#00f5ff" : "rgba(255,255,255,0.35)" }]}>Reel</Text>
        </TouchableOpacity>

        {/* TAB 3 — Inbox */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            setShowDMs(true);
            setShowExploreGrid(false);
            setIsReelsFullScreen(false);
          }}
        >
          <Lucide
            name="paper-plane-outline"
            size={26}
            color={showDMs ? "#00f5ff" : "rgba(255,255,255,0.45)"}
          />
          <Text style={[styles.auraTabLabel, { color: showDMs ? "#00f5ff" : "rgba(255,255,255,0.35)" }]}>Inbox</Text>
        </TouchableOpacity>

        {/* TAB 4 — Products */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            setShowDMs(false);
            setShowExploreGrid(false);
            router.push("/shop");
          }}
        >
          <Lucide
            name="bag-handle-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Products</Text>
        </TouchableOpacity>

        {/* TAB 5 — Profile */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            setShowDMs(false);
            setShowExploreGrid(false);
            router.push("/account");
          }}
        >
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", overflow: "hidden" }]}>
            {activeMaisonId === "aloksingh" ? (
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80" }}
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

      {/* 🛍️ PRODUCT PREVIEW SHEET */}
      {/* ──────────────────────────────────────────────────── */}
      {selectedProductForPreview && (
        <ProductPreviewSheet
          visible={previewSheetVisible}
          product={selectedProductForPreview}
          feedItemId={previewFeedItemId}
          onClose={() => {
            setPreviewSheetVisible(false);
            setSelectedProductForPreview(null);
            setPreviewFeedItemId(undefined);
          }}
        />
      )}

      {/* 🎨 PREMIUM IMAGE FILTER EDITOR */}
      {/* ──────────────────────────────────────────────────── */}
      <ImageEditor
        visible={showImageEditor}
        imageUri={selectedMediaUri || ""}
        onClose={() => {
          setShowImageEditor(false);
          setSelectedMediaUri(null);
        }}
        onSave={(finalUri, appliedFilter) => {
          setSelectedMediaUri(finalUri);
          setShowImageEditor(false);
          if (appliedFilter && appliedFilter !== "normal") {
            const presetName = FILTER_PRESETS.find(f => f.id === appliedFilter)?.name || appliedFilter;
            setNewPostCaption(`[Filter: ${presetName}] `);
          }
        }}
      />

      {/* 🔍 INSTAGRAM-STYLE EXPLORE GRID SCREEN OVERLAY */}
      {showExploreGrid && (
        <View style={[styles.dmSlidePanel, { bottom: bottomBarHeight }]}>
          <SafeAreaView style={styles.dmSafeArea}>
            {/* Search Input Header */}
            <View style={styles.exploreSearchHeader}>
              <TouchableOpacity onPress={() => setShowExploreGrid(false)}>
                <Lucide name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.exploreSearchBox}>
                <Lucide name="search" size={21} color="rgba(255,255,255,0.4)" style={styles.exploreSearchIcon} />
                <TextInput
                  style={styles.exploreSearchInput}
                  placeholder="Search video stories..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
            </View>

            {/* 3-Column Video Thumbnail Grid */}
            <FlatList
              data={displayStories}
              numColumns={3}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.exploreGridContent}
              renderItem={({ item, index }) => {
                const thumbnail = item.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200";
                return (
                  <TouchableOpacity 
                    style={styles.exploreGridItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerHaptic("light");
                      setActiveStoryIndex(index);
                      setShowExploreGrid(false);
                      setActiveFeedTab("reels");
                    }}
                  >
                    <Image source={{ uri: thumbnail }} style={styles.exploreGridImg} contentFit="cover" placeholder="L184i9ofbHof00ayjZay~qj[ayof" transition={300} />
                    <View style={styles.exploreGridPlayBadge}>
                      <Lucide name="play" size={15} color="#fff" />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </View>
      )}

      {/* 📸 NEW POST DETAILS FORM OVERLAY (Instagram-style) */}
      {selectedMediaUri && (
        <View style={styles.dmSlidePanel}>
          <SafeAreaView style={styles.dmSafeArea}>
            {/* Header: Back + "New post" title */}
            <View style={styles.newPostHeader}>
              <TouchableOpacity onPress={() => {
                setSelectedMediaUri(null);
                setNewPostCaption("");
                setNewPostLocation("");
                setNewPostAudio("");
                setNewPostAI(false);
                setNewPostProduct("");
              }}>
                <Lucide name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.newPostHeaderTitle}>New post</Text>
              <View style={{ width: 26 }} />
            </View>

            <ScrollView style={styles.newPostScroll} showsVerticalScrollIndicator={false}>
              {/* Media Preview Thumbnail */}
              <View style={styles.newPostMediaPreview}>
                <Image
                  source={{ uri: selectedMediaUri }}
                  style={styles.newPostMediaImg}
                />
              </View>

              {/* Caption Input */}
              <View style={styles.newPostCaptionWrap}>
                <TextInput
                  style={styles.newPostCaptionInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newPostCaption}
                  onChangeText={setNewPostCaption}
                  multiline
                  maxLength={250}
                />
              </View>

              {/* Quick Action Chips (Poll + Prompt) */}
              <View style={styles.newPostChipsRow}>
                <TouchableOpacity style={styles.newPostChip} onPress={() => {
                  triggerHaptic("light");
                  Alert.alert("Poll", "Add a poll question for your audience", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Add", onPress: () => setNewPostCaption(prev => prev + "\n\n📊 Poll: ") }
                  ]);
                }}>
                  <Lucide name="options-outline" size={17} color="#fff" />
                  <Text style={styles.newPostChipText}>Poll</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newPostChip} onPress={() => {
                  triggerHaptic("light");
                  Alert.alert("Prompt", "Add a question prompt for engagement", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Add", onPress: () => setNewPostCaption(prev => prev + "\n\n💬 Ask me: ") }
                  ]);
                }}>
                  <Lucide name="chatbubble-ellipses-outline" size={17} color="#fff" />
                  <Text style={styles.newPostChipText}>Prompt</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              {/* Add audio — fully operational */}
              <TouchableOpacity style={styles.newPostOptionRow} onPress={() => {
                triggerHaptic("light");
                setShowAudioInput(!showAudioInput);
              }}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="musical-notes-outline" size={23} color={newPostAudio ? "#00f5ff" : "#fff"} />
                  <Text style={[styles.newPostOptionText, newPostAudio ? { color: "#00f5ff" } : {}]}>
                    {newPostAudio || "Add audio"}
                  </Text>
                </View>
                <Lucide name={showAudioInput ? "chevron-down" : "chevron-forward"} size={21} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              {showAudioInput && (
                <View>
                  <View style={styles.newPostInlineInput}>
                    <TextInput
                      style={styles.newPostInlineTextInput}
                      placeholder="Search trending songs / soundscapes..."
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={newPostAudio}
                      onChangeText={setNewPostAudio}
                      autoFocus
                    />
                    {newPostAudio ? (
                      <TouchableOpacity onPress={() => { setNewPostAudio(""); }}>
                        <Lucide name="close-circle" size={21} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.autocompleteList}>
                    {TRENDING_SONGS.filter(s => 
                      s.title.toLowerCase().includes(newPostAudio.toLowerCase()) || 
                      s.artist.toLowerCase().includes(newPostAudio.toLowerCase())
                    ).map(songItem => (
                      <TouchableOpacity 
                        key={songItem.title} 
                        style={styles.autocompleteItem}
                        onPress={() => {
                          triggerHaptic("light");
                          setNewPostAudio(`${songItem.title} - ${songItem.artist}`);
                          setShowAudioInput(false);
                        }}
                      >
                        <Image source={{ uri: songItem.cover }} style={styles.autocompleteCover} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.autocompleteText}>{songItem.title}</Text>
                          <Text style={styles.autocompleteSub}>{songItem.artist} • {songItem.duration}</Text>
                        </View>
                        <Lucide name="play-circle-outline" size={23} color="#00f5ff" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Audio Track Info (if set and input closed) */}
              {newPostAudio && !showAudioInput ? (
                <View style={styles.newPostAudioTrack}>
                  <View style={styles.newPostAudioThumb}>
                    <Lucide name="musical-note" size={19} color="#00f5ff" />
                  </View>
                  <Text style={styles.newPostAudioName} numberOfLines={1}>{newPostAudio}</Text>
                  <TouchableOpacity onPress={() => setNewPostAudio("")}>
                    <Lucide name="close-circle" size={19} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.newPostDivider} />

              {/* Tag people — fully operational */}
              <TouchableOpacity style={styles.newPostOptionRow} onPress={() => {
                triggerHaptic("light");
                setShowTagPeople(!showTagPeople);
              }}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="people-outline" size={23} color={newPostTaggedPeople ? "#00f5ff" : "#fff"} />
                  <Text style={[styles.newPostOptionText, newPostTaggedPeople ? { color: "#00f5ff" } : {}]}>
                    {newPostTaggedPeople ? `Tagged: ${newPostTaggedPeople}` : "Tag people"}
                  </Text>
                </View>
                <Lucide name={showTagPeople ? "chevron-down" : "chevron-forward"} size={21} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              {showTagPeople && (
                <View>
                  <View style={styles.newPostInlineInput}>
                    <TextInput
                      style={styles.newPostInlineTextInput}
                      placeholder="@username, name..."
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={newPostTaggedPeople}
                      onChangeText={setNewPostTaggedPeople}
                      autoFocus
                    />
                    {newPostTaggedPeople ? (
                      <TouchableOpacity onPress={() => { setNewPostTaggedPeople(""); }}>
                        <Lucide name="close-circle" size={21} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.autocompleteList}>
                    {PLATFORM_USERS.filter(u => 
                      u.username.toLowerCase().includes(newPostTaggedPeople.toLowerCase()) || 
                      u.name.toLowerCase().includes(newPostTaggedPeople.toLowerCase())
                    ).map(userItem => (
                      <TouchableOpacity 
                        key={userItem.id} 
                        style={styles.autocompleteItem}
                        onPress={() => {
                          triggerHaptic("light");
                          setNewPostTaggedPeople(userItem.username);
                          setShowTagPeople(false);
                        }}
                      >
                        <Image source={{ uri: userItem.avatar }} style={styles.autocompleteAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.autocompleteText}>{userItem.name}</Text>
                          <Text style={styles.autocompleteSub}>@{userItem.username} • {userItem.role}</Text>
                        </View>
                        <Lucide name="add-circle-outline" size={21} color="#00f5ff" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.newPostDivider} />

              {/* Add location — fully operational inline input */}
              <TouchableOpacity style={styles.newPostOptionRow} onPress={() => {
                triggerHaptic("light");
                setShowLocationInput(!showLocationInput);
              }}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="location-outline" size={23} color={newPostLocation ? "#00f5ff" : "#fff"} />
                  <Text style={[styles.newPostOptionText, newPostLocation ? { color: "#00f5ff" } : {}]}>
                    {newPostLocation || "Add location"}
                  </Text>
                </View>
                <Lucide name={showLocationInput ? "chevron-down" : "chevron-forward"} size={21} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              {showLocationInput && (
                <View>
                  <View style={styles.newPostInlineInput}>
                    <Lucide name="navigate-outline" size={19} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      style={styles.newPostInlineTextInput}
                      placeholder="e.g. Milan, 20121..."
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={newPostLocation}
                      onChangeText={setNewPostLocation}
                      autoFocus
                    />
                    {newPostLocation ? (
                      <TouchableOpacity onPress={() => { setNewPostLocation(""); }}>
                        <Lucide name="close-circle" size={21} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.autocompleteList}>
                    {GLOBAL_LOCATIONS.filter(l => 
                      l.name.toLowerCase().includes(newPostLocation.toLowerCase()) || 
                      l.pincode.includes(newPostLocation) ||
                      l.description.toLowerCase().includes(newPostLocation.toLowerCase())
                    ).map(locItem => (
                      <TouchableOpacity 
                        key={locItem.name} 
                        style={styles.autocompleteItem}
                        onPress={() => {
                          triggerHaptic("light");
                          setNewPostLocation(`${locItem.name} (${locItem.pincode})`);
                          setShowLocationInput(false);
                        }}
                      >
                        <View style={styles.autocompleteLocationIcon}>
                          <Lucide name="pin-outline" size={19} color="#00f5ff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.autocompleteText}>{locItem.name} ({locItem.pincode})</Text>
                          <Text style={styles.autocompleteSub}>{locItem.description}</Text>
                        </View>
                        <Lucide name="chevron-forward" size={19} color="rgba(255,255,255,0.3)" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.newPostDivider} />

              {/* AI Label Toggle — already operational */}
              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="cube-outline" size={23} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newPostOptionText}>Add AI Label</Text>
                    <Text style={styles.newPostOptionSub}>{"We require you to label certain realistic content that's made with AI."}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, newPostAI && styles.newPostToggleActive]}
                  onPress={() => { triggerHaptic("light"); setNewPostAI(!newPostAI); }}
                >
                  <View style={[styles.newPostToggleThumb, newPostAI && styles.newPostToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              {/* Product Link for Affiliate — already operational */}
              <TouchableOpacity style={styles.newPostOptionRow} onPress={() => setShowProductSelector(!showProductSelector)}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="pricetag-outline" size={23} color="#00f5ff" />
                  <Text style={[styles.newPostOptionText, { color: "#00f5ff" }]}>
                    {newPostProduct ? "Product Tagged ✓" : "Tag Product (Affiliate)"}
                  </Text>
                </View>
                <Lucide name={showProductSelector ? "chevron-down" : "chevron-forward"} size={21} color="#00f5ff" />
              </TouchableOpacity>

              {/* Product Selector Dropdown */}
              {showProductSelector && (
                <View style={styles.newPostProductList}>
                  {newPostProduct ? (
                    <TouchableOpacity
                      style={[styles.newPostProductItem, { backgroundColor: "rgba(255,60,60,0.1)" }]}
                      onPress={() => {
                        triggerHaptic("light");
                        setNewPostProduct("");
                      }}
                    >
                      <Text style={[styles.newPostProductName, { color: "#ff3b30" }]}>Remove Product Tag</Text>
                      <Lucide name="close-circle" size={17} color="#ff3b30" />
                    </TouchableOpacity>
                  ) : null}
                  {(products || []).slice(0, 8).map((p: any) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.newPostProductItem,
                        newPostProduct === p.id && styles.newPostProductItemActive
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setNewPostProduct(p.id);
                        setShowProductSelector(false);
                      }}
                    >
                      <Text style={styles.newPostProductName} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.newPostProductPrice}>₹{p.price?.toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))}
                  {(!products || products.length === 0) && (
                    <Text style={styles.newPostProductEmpty}>{"No products available in the sovereign mesh catalog."}</Text>
                  )}
                </View>
              )}

              <View style={styles.newPostDivider} />

              {/* Audience — fully operational selector */}
              <TouchableOpacity style={styles.newPostOptionRow} onPress={() => {
                triggerHaptic("light");
                setShowAudienceSelector(!showAudienceSelector);
              }}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="eye-outline" size={23} color="#fff" />
                  <Text style={styles.newPostOptionText}>Audience</Text>
                </View>
                <View style={styles.newPostOptionRight}>
                  <Text style={styles.newPostOptionValue}>
                    {selectedAudience === "everyone" ? "Everyone" : selectedAudience === "followers" ? "Followers" : "Close Friends"}
                  </Text>
                  <Lucide name={showAudienceSelector ? "chevron-down" : "chevron-forward"} size={21} color="rgba(255,255,255,0.3)" />
                </View>
              </TouchableOpacity>

              {showAudienceSelector && (
                <View style={styles.newPostProductList}>
                  {([
                    { key: "everyone" as const, label: "Everyone", icon: "globe-outline" as const },
                    { key: "followers" as const, label: "Followers Only", icon: "people-outline" as const },
                    { key: "close_friends" as const, label: "Close Friends", icon: "star-outline" as const },
                  ]).map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.newPostProductItem, selectedAudience === opt.key && styles.newPostProductItemActive]}
                      onPress={() => {
                        triggerHaptic("light");
                        setSelectedAudience(opt.key);
                        setShowAudienceSelector(false);
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Lucide name={opt.icon} size={19} color={selectedAudience === opt.key ? "#00f5ff" : "#fff"} />
                        <Text style={[styles.newPostProductName, selectedAudience === opt.key ? { color: "#00f5ff" } : {}]}>{opt.label}</Text>
                      </View>
                      {selectedAudience === opt.key && <Lucide name="checkmark" size={19} color="#00f5ff" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.newPostDivider} />

              {/* Also share on — operational toggle */}
              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="share-outline" size={23} color="#fff" />
                  <Text style={styles.newPostOptionText}>Also share on AURA Feed</Text>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, newPostShareFeed && styles.newPostToggleActive]}
                  onPress={() => { triggerHaptic("light"); setNewPostShareFeed(!newPostShareFeed); }}
                >
                  <View style={[styles.newPostToggleThumb, newPostShareFeed && styles.newPostToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              {/* More options — expandable details */}
              <TouchableOpacity 
                style={styles.newPostOptionRow} 
                onPress={() => {
                  triggerHaptic("light");
                  setShowAdvancedOptions(!showAdvancedOptions);
                }}
              >
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="ellipsis-horizontal" size={23} color={showAdvancedOptions ? "#00f5ff" : "#fff"} />
                  <Text style={[styles.newPostOptionText, showAdvancedOptions ? { color: "#00f5ff" } : {}]}>More options</Text>
                </View>
                <Lucide name={showAdvancedOptions ? "chevron-down" : "chevron-forward"} size={21} color={showAdvancedOptions ? "#00f5ff" : "rgba(255,255,255,0.3)"} />
              </TouchableOpacity>

              {/* Advanced Options Panel */}
              {showAdvancedOptions && (
                <View style={styles.advancedOptionsContainer}>
                  {/* Enable/Disable Comments */}
                  <View style={styles.newPostOptionRow}>
                    <View style={styles.newPostOptionLeft}>
                      <Lucide name="chatbox-ellipses-outline" size={23} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.newPostOptionText}>Allow Comments</Text>
                        <Text style={styles.newPostOptionSub}>Let other users comment on this curation.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.newPostToggle, commentsEnabled && styles.newPostToggleActive]}
                      onPress={() => { triggerHaptic("light"); setCommentsEnabled(!commentsEnabled); }}
                    >
                      <View style={[styles.newPostToggleThumb, commentsEnabled && styles.newPostToggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.newPostDivider} />

                  {/* Hide Like Count */}
                  <View style={styles.newPostOptionRow}>
                    <View style={styles.newPostOptionLeft}>
                      <Lucide name="heart-dislike-outline" size={23} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.newPostOptionText}>Hide Likes and Views</Text>
                        <Text style={styles.newPostOptionSub}>Only you will see the total number of likes and views.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.newPostToggle, likesHidden && styles.newPostToggleActive]}
                      onPress={() => { triggerHaptic("light"); setLikesHidden(!likesHidden); }}
                    >
                      <View style={[styles.newPostToggleThumb, likesHidden && styles.newPostToggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.newPostDivider} />

                  {/* Cross Post / Sharing federated */}
                  <View style={styles.newPostOptionRow}>
                    <View style={styles.newPostOptionLeft}>
                      <Lucide name="globe-outline" size={23} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.newPostOptionText}>Cross-Post (Federated)</Text>
                        <Text style={styles.newPostOptionSub}>Syndicate instantly to linked luxury platforms.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.newPostToggle, crossPostEnabled && styles.newPostToggleActive]}
                      onPress={() => { triggerHaptic("light"); setCrossPostEnabled(!crossPostEnabled); }}
                    >
                      <View style={[styles.newPostToggleThumb, crossPostEnabled && styles.newPostToggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.newPostDivider} />

                  {/* Allow download rights */}
                  <View style={styles.newPostOptionRow}>
                    <View style={styles.newPostOptionLeft}>
                      <Lucide name="download-outline" size={23} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.newPostOptionText}>Allow Downloads</Text>
                        <Text style={styles.newPostOptionSub}>Let other collectors download this curation to local nodes.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.newPostToggle, allowDownload && styles.newPostToggleActive]}
                      onPress={() => { triggerHaptic("light"); setAllowDownload(!allowDownload); }}
                    >
                      <View style={[styles.newPostToggleThumb, allowDownload && styles.newPostToggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.newPostDivider} />

                  {/* Boost/Promote */}
                  <View style={styles.newPostOptionRow}>
                    <View style={styles.newPostOptionLeft}>
                      <Lucide name="trending-up-outline" size={23} color="#00f5ff" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.newPostOptionText, { color: "#00f5ff" }]}>Promote Reel (Boost)</Text>
                        <Text style={styles.newPostOptionSub}>Enhance algorithmic visibility using affiliate ad-spend.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.newPostToggle, promoteReel && styles.newPostToggleActive]}
                      onPress={() => { triggerHaptic("light"); setPromoteReel(!promoteReel); }}
                    >
                      <View style={[styles.newPostToggleThumb, promoteReel && styles.newPostToggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.newPostDivider} />

                  {/* Scheduled Posting */}
                  <View style={styles.newPostOptionRow}>
                    <View style={styles.newPostOptionLeft}>
                      <Lucide name="time-outline" size={23} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.newPostOptionText}>Schedule Post</Text>
                        <Text style={styles.newPostOptionSub}>Publish automatically at a future synchronized timestamp.</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.newPostToggle, isScheduled && styles.newPostToggleActive]}
                      onPress={() => { triggerHaptic("light"); setIsScheduled(!isScheduled); }}
                    >
                      <View style={[styles.newPostToggleThumb, isScheduled && styles.newPostToggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  {isScheduled && (
                    <View style={styles.newPostInlineInput}>
                      <Lucide name="alarm-outline" size={19} color="#00f5ff" />
                      <TextInput
                        style={styles.newPostInlineTextInput}
                        placeholder="Set posting time (e.g. 06:00 PM)"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={scheduledTime}
                        onChangeText={setScheduledTime}
                      />
                    </View>
                  )}
                </View>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Share CTA Button */}
            <View style={styles.newPostShareBtnWrap}>
              <TouchableOpacity
                style={[styles.newPostShareBtn, isPublishingPost && { opacity: 0.5 }]}
                onPress={handleSharePost}
                disabled={isPublishingPost}
                activeOpacity={0.8}
              >
                {isPublishingPost ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.newPostShareBtnText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* 🔮 FULLSCREEN STORY VIEWER MODAL OVERLAY */}
      {selectedStoriesGroup && (
        <Modal 
          visible={!!selectedStoriesGroup} 
          transparent 
          animationType="fade"
          onRequestClose={() => setSelectedStoriesGroup(null)}
        >
          <View style={styles.storyModalContainer}>
            {/* Tap controls left/right — long press to pause story */}
            <TouchableOpacity 
              style={[styles.storyTapDetector, { left: 0 }]} 
              activeOpacity={1}
              onPress={handleStoryPrev}
              onPressIn={() => setStoryPaused(true)}
              onPressOut={() => setStoryPaused(false)}
              delayLongPress={150}
            />
            <TouchableOpacity 
              style={[styles.storyTapDetector, { right: 0 }]} 
              activeOpacity={1}
              onPress={handleStoryNext}
              onPressIn={() => setStoryPaused(true)}
              onPressOut={() => setStoryPaused(false)}
              delayLongPress={150}
            />

            <SafeAreaView style={styles.storyModalSafe}>
              {/* Progress bars strip — hidden when story is paused (hold-to-inspect) */}
              {!storyPaused && (
                <View style={styles.storyProgressStrip}>
                  {(selectedStoriesGroup.slides || []).map((slide: any, idx: number) => {
                    let widthPercent = 0;
                    if (idx < activeSlideIndex) widthPercent = 100;
                    else if (idx === activeSlideIndex) widthPercent = storyProgress;
                    
                    return (
                      <View key={slide.id} style={styles.storyProgressBarBg}>
                        <View style={[styles.storyProgressBarFill, { width: `${widthPercent}%` }]} />
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Story Header */}
              <View style={styles.storyModalHeader}>
                <TouchableOpacity 
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  onPress={() => {
                    const groupUsername = selectedStoriesGroup.username;
                    setSelectedStoriesGroup(null);
                    navigateToUserProfile(groupUsername);
                  }}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: selectedStoriesGroup.avatar }} style={styles.storyHeaderAvatar} />
                  <Text style={styles.storyHeaderUsername}>{selectedStoriesGroup.username}</Text>
                  <Text style={styles.storyHeaderTime}>12h</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { triggerHaptic("light"); setSelectedStoriesGroup(null); }}>
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Slide image preview content */}
              <View style={styles.storySlideContent}>
                {selectedStoriesGroup.slides?.[activeSlideIndex] && (
                  <Image 
                    source={{ uri: selectedStoriesGroup.slides[activeSlideIndex].url }} 
                    style={styles.storySlideImage}
                  />
                )}
                
                {selectedStoriesGroup.slides?.[activeSlideIndex]?.caption && (
                  <View style={styles.storySlideCaptionOverlay}>
                    <Text style={styles.storySlideCaptionText}>
                      {selectedStoriesGroup.slides[activeSlideIndex].caption}
                    </Text>
                  </View>
                )}
              </View>

              {/* Message Reply Keyboard footer — hidden when paused */}
              {!storyPaused && (
                <View style={styles.storyReplyFooter}>
                  <TextInput
                    style={styles.storyReplyInput}
                    placeholder={`Reply to ${selectedStoriesGroup.username}...`}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={storyReplyText}
                    onChangeText={setStoryReplyText}
                    onSubmitEditing={handleSendStoryReply}
                  />
                  <TouchableOpacity onPress={handleSendStoryReply} style={styles.storyReplySendBtn}>
                    <Lucide name="paper-plane-outline" size={23} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

            </SafeAreaView>
          </View>
        </Modal>
      )}

      {/* 💹 SIMULATED STREAM SETTLEMENT LEDGER POPUP */}
      {showLiveSettlement && settlementData && (
        <Modal
          visible={showLiveSettlement}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLiveSettlement(false)}
        >
          <View style={styles.settlementOverlay}>
            <View style={styles.settlementCardGlow}>
              <View style={styles.settlementCard}>
                <View style={styles.settlementHeader}>
                  <Lucide name="receipt" size={34} color="#00f5ff" />
                  <Text style={styles.settlementTitle}>Showroom Settlement Ledger</Text>
                  <Text style={styles.settlementSubtitle}>Live Stream Session Cryptographic Audit</Text>
                </View>

                <View style={styles.settlementGrid}>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Broadcast Duration</Text>
                    <Text style={styles.settlementValue}>{settlementData.duration}</Text>
                  </View>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Peak Live Viewers</Text>
                    <Text style={styles.settlementValue}>{settlementData.viewers} Nodes</Text>
                  </View>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Reactions Hearts Count</Text>
                    <Text style={styles.settlementValue}>{settlementData.hearts} Hearts</Text>
                  </View>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Estimated Atelier Revenue</Text>
                    <Text style={[styles.settlementValue, { color: "#00f5ff" }]}>{settlementData.revenue}</Text>
                  </View>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>VIP Access Keys Minted</Text>
                    <Text style={styles.settlementValue}>{settlementData.keys} Keys</Text>
                  </View>
                </View>

                <Text style={styles.settlementFootnote}>
                  {"All generated interaction telemetry blocks have been successfully hashed and committed to the AURA transaction logs."}
                </Text>

                <TouchableOpacity 
                  style={styles.settlementCloseBtn}
                  onPress={() => {
                    triggerHaptic("medium");
                    setShowLiveSettlement(false);
                  }}
                >
                  <Text style={styles.settlementCloseBtnText}>Conclude Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 📸 REELS CAMERA STUDIO — fully self-contained component */}
      <CameraStudio
        visible={showReelCamera}
        onClose={() => setShowReelCamera(false)}
        insets={insets}
        products={products}
        onPostPublished={(reel) => setLocalReels((prev: any[]) => [reel, ...prev])}
      />

      {/* 📺 WEBRTC LIVE SHOWROOM OVERLAY */}
      <LiveShowroom
        visible={showLiveShowroom}
        onClose={() => setShowLiveShowroom(false)}
        initialMode={showroomMode}
        maisonId={showroomMaisonId}
        maisonName={showroomMaisonName}
        sessionId={showroomSessionId}
      />


      {/* 📤 PREMIUM INSTAGRAM-STYLE SHARE BOTTOM SHEET MODAL */}
      {showShareSheet && (
        <Modal
          visible={showShareSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowShareSheet(false)}
        >
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowShareSheet(false)}
          >
            <View style={styles.shareSheetContent} onStartShouldSetResponder={() => true}>
              {/* Drag Handle */}
              <View style={styles.bottomSheetDragHandle} />
              
              {/* Search Bar Row */}
              <View style={styles.shareSearchRow}>
                <View style={styles.shareSearchBox}>
                  <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.shareSearchInput}
                    placeholder="Search"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardAppearance="dark"
                    value={shareSearch}
                    onChangeText={setShareSearch}
                  />
                </View>
                <TouchableOpacity style={styles.shareAddFriendBtn} onPress={() => { triggerHaptic("light"); alert("Syncing your contact nodes..."); }}>
                  <Lucide name="person-add-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Direct Message Contacts Grid */}
              <View style={styles.shareContactsContainer}>
                {(() => {
                  const allShareContacts = [
                    { id: "c1", name: "Kiran Soni", username: "kiran_soni", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150" },
                    { id: "c2", name: "S U R A J", username: "suraj_official", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150" },
                    { id: "c3", name: "Dr. Rashneet ✨", username: "dr_rashneet", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150" },
                    { id: "c4", name: "Rhythm Bhatia", username: "rhythm_bhatia", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150" },
                    { id: "c5", name: "the.priyas...", username: "priya_luxury", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150" },
                    { id: "c6", name: "Mandy", username: "mandy_c", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150" },
                  ];

                  const filtered = allShareContacts.filter(
                    c => c.name.toLowerCase().includes(shareSearch.toLowerCase()) ||
                         c.username.toLowerCase().includes(shareSearch.toLowerCase())
                  );

                  const chunked = [];
                  for (let i = 0; i < filtered.length; i += 3) {
                    chunked.push(filtered.slice(i, i + 3));
                  }

                  if (chunked.length === 0) {
                    return (
                      <View style={{ paddingVertical: 20, alignItems: "center" }}>
                        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No results found</Text>
                      </View>
                    );
                  }

                  return chunked.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.shareContactsRow}>
                      {row.map((contact) => (
                        <TouchableOpacity 
                          key={contact.id} 
                          style={styles.shareContactCard} 
                          onPress={() => {
                            triggerHaptic("success");
                            setShowShareSheet(false);
                            alert(`Direct message sent successfully to ${contact.name}!`);
                          }}
                        >
                          <Image source={{ uri: contact.avatar }} style={styles.shareContactAvatar} />
                          <Text style={styles.shareContactName} numberOfLines={1}>{contact.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ));
                })()}
              </View>

              <View style={styles.shareHorizontalDivider} />

              {/* Bottom Row of Action Shortcuts */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.shareActionsScroll}
              >
                {/* 🔗 COPY LINK */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={async () => {
                  triggerHaptic("success");
                  setShowShareSheet(false);
                  const postUrl = shareTargetPost?.url || `${API_HOST}/reel/${shareTargetPost?.id || "s1"}`;
                  try {
                    await Clipboard.setStringAsync(postUrl);
                    Alert.alert("Link Copied", "Instant match! The luxury curation link has been copied to your clipboard.");
                  } catch (e) {
                    console.warn("Clipboard copy failed:", e);
                    Alert.alert("Link Copied", `Coordinate: ${postUrl}`);
                  }
                }}>
                  <View style={styles.shareActionCircle}>
                    <Lucide name="link-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Copy link</Text>
                </TouchableOpacity>

                {/* ➕ ADD TO STORY */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareSheet(false);
                  if (!shareTargetPost) return;
                  
                  const newSlide = {
                    id: `ys_${Date.now()}`,
                    url: shareTargetPost.thumbnail || shareTargetPost.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
                    caption: shareTargetPost.caption || "Obsidian Gold curation added to AURA Story coordinates.",
                    isVideo: shareTargetPost.isVideo || false,
                    artifact: shareTargetPost.artifact || null
                  };

                  addInstaStorySlide(newSlide);
                  Alert.alert("Story Shared", "Shared successfully to your Stories feed! View it at the top of your home screen.");
                }}>
                  <View style={styles.shareActionCircle}>
                    <Lucide name="add-circle-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Add to story</Text>
                </TouchableOpacity>

                {/* 💬 WHATSAPP */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareSheet(false);
                  const postUrl = shareTargetPost?.url || `${API_HOST}/reel/${shareTargetPost?.id || "s1"}`;
                  const caption = shareTargetPost?.caption || "Check out this luxury curation!";
                  const text = `Check out this gorgeous quiet-luxury curation on AURA: "${caption}"\n\nLink: ${postUrl}`;
                  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
                  Linking.openURL(whatsappUrl).catch(() => {
                    Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
                  });
                }}>
                  <View style={[styles.shareActionCircle, { backgroundColor: "#25d366" }]}>
                    <Lucide name="logo-whatsapp" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>WhatsApp</Text>
                </TouchableOpacity>

                {/* 📸 INSTAGRAM */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareSheet(false);
                  Linking.openURL("instagram://camera").catch(() => {
                    Linking.openURL("https://instagram.com");
                  });
                }}>
                  <View style={[styles.shareActionCircle, { backgroundColor: "#e1306c" }]}>
                    <Lucide name="logo-instagram" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Instagram</Text>
                </TouchableOpacity>

                {/* ✈️ TELEGRAM */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareSheet(false);
                  const postUrl = shareTargetPost?.url || `${API_HOST}/reel/${shareTargetPost?.id || "s1"}`;
                  const caption = shareTargetPost?.caption || "Check out this luxury curation!";
                  const text = `Check out this gorgeous quiet-luxury curation on AURA: "${caption}"\n\nLink: ${postUrl}`;
                  const telegramUrl = `tg://msg?text=${encodeURIComponent(text)}`;
                  Linking.openURL(telegramUrl).catch(() => {
                    Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`);
                  });
                }}>
                  <View style={[styles.shareActionCircle, { backgroundColor: "#0088cc" }]}>
                    <Lucide name="paper-plane-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Telegram</Text>
                </TouchableOpacity>

                {/* 📤 NATIVE SYSTEM SHARE ("MORE") */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareSheet(false);
                  const postUrl = shareTargetPost?.url || `${API_HOST}/reel/${shareTargetPost?.id || "s1"}`;
                  const caption = shareTargetPost?.caption || "Check out this luxury curation!";
                  const text = `Check out this gorgeous quiet-luxury curation on AURA: "${caption}"`;
                  Share.share({
                    message: `${text}\n\nLink: ${postUrl}`,
                    url: postUrl,
                    title: "AURA Luxury Curation"
                  }).catch(err => {
                    console.warn("Native share failed:", err);
                  });
                }}>
                  <View style={styles.shareActionCircle}>
                    <Lucide name="share-social-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>More</Text>
                </TouchableOpacity>
              </ScrollView>

            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 🔴 THREE DOTS OPTIONS BOTTOM SHEET MODAL */}
      {showThreeDotsModal && (
        <Modal
          visible={showThreeDotsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowThreeDotsModal(false)}
        >
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowThreeDotsModal(false)}
          >
            <View style={styles.optionsBottomSheetContent} onStartShouldSetResponder={() => true}>
              <View style={styles.bottomSheetDragHandle} />
              
              <View style={styles.optionsGroupContainer}>
                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("light");
                  setShowThreeDotsModal(false);
                  const postUser = threeDotsTargetPost?.user?.name || "Creator";
                  Alert.alert("About this account", `${postUser} • Verified AURA creator • Joined the AURA platform to share curated luxury content and shoppable stories.`);
                }}>
                  <Lucide name="person-circle-outline" size={24} color="#fff" />
                  <Text style={styles.optionRowText}>About this account</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                
                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("light");
                  setShowThreeDotsModal(false);
                  handleSavePress(threeDotsTargetPost?.id || "");
                }}>
                  <Lucide name="bookmark-outline" size={24} color="#fff" />
                  <Text style={styles.optionRowText}>Save to collection</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                
                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("light");
                  setShowThreeDotsModal(false);
                  handleShare(threeDotsTargetPost || {});
                }}>
                  <Lucide name="share-social-outline" size={24} color="#fff" />
                  <Text style={styles.optionRowText}>Share to...</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />

                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("light");
                  setShowThreeDotsModal(false);
                  const link = `https://aura.app/post/${threeDotsTargetPost?.id || ""}`;
                  Alert.alert("Link Copied", `Post link copied to clipboard:\n${link}`);
                }}>
                  <Lucide name="link-outline" size={24} color="#fff" />
                  <Text style={styles.optionRowText}>Copy link</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.optionsGroupContainer}>
                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("medium");
                  setShowThreeDotsModal(false);
                  Alert.alert("Curated for you", "AURA's recommendation engine will prioritize similar content in your feed based on your style preferences.");
                }}>
                  <Lucide name="checkmark-circle-outline" size={24} color="#fff" />
                  <Text style={styles.optionRowText}>Interested</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                
                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("medium");
                  setShowThreeDotsModal(false);
                  Alert.alert("Content Hidden", "This post has been removed from your feed. You'll see less content like this.");
                }}>
                  <Lucide name="eye-off-outline" size={24} color="#fff" />
                  <Text style={styles.optionRowText}>Hide post</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                
                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("medium");
                  setShowThreeDotsModal(false);
                  Alert.alert("Not Interested", "You'll see fewer posts like this in your AURA feed.");
                }}>
                  <Lucide name="close-circle-outline" size={24} color="#fff" />
                  <Text style={styles.optionRowText}>Not interested</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                
                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("medium");
                  setShowThreeDotsModal(false);
                  Alert.alert(
                    "Unfollow",
                    `Are you sure you want to unfollow ${threeDotsTargetPost?.user?.name || "this creator"}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Unfollow", style: "destructive", onPress: () => Alert.alert("Unfollowed", "You have unfollowed this creator.") }
                    ]
                  );
                }}>
                  <Lucide name="person-remove-outline" size={24} color="#fb923c" />
                  <Text style={[styles.optionRowText, { color: "#fb923c" }]}>Unfollow</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />

                <TouchableOpacity style={styles.optionRow} onPress={() => {
                  triggerHaptic("heavy");
                  setShowThreeDotsModal(false);
                  Alert.alert(
                    "Report Post",
                    "Why are you reporting this post?",
                    [
                      { text: "Spam", onPress: () => Alert.alert("Reported", "Thank you. Our AURA trust & safety team will review this post.") },
                      { text: "Inappropriate", onPress: () => Alert.alert("Reported", "Thank you. Our AURA trust & safety team will review this post.") },
                      { text: "Misleading", onPress: () => Alert.alert("Reported", "Thank you. Our AURA trust & safety team will review this post.") },
                      { text: "Cancel", style: "cancel" }
                    ]
                  );
                }}>
                  <Lucide name="alert-circle-outline" size={24} color="#ff3b30" />
                  <Text style={[styles.optionRowText, { color: "#ff3b30" }]}>Report post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 💬 FEED COMMENTS BOTTOM SHEET MODAL */}
      {showCommentsModal && commentsTargetPost && (
        <Modal
          visible={showCommentsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCommentsModal(false)}
        >
          <View style={styles.commentsOverlayBackdrop}>
            <TouchableOpacity 
              style={{ flex: 1 }} 
              activeOpacity={1} 
              onPress={() => setShowCommentsModal(false)}
            />
            
            <View style={[styles.commentsSheetContent, { height: height * 0.7 }]}>
              {/* Drag Handle */}
              <View style={styles.bottomSheetDragHandle} />
              
              {/* Header */}
              <View style={styles.commentsHeaderRow}>
                <Text style={styles.commentsHeaderTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                  <Lucide name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Comments list */}
              <ScrollView 
                style={styles.commentsScroll}
                contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
              >
                {/* Author original post caption as the pinned first comment */}
                {(() => {
                  const authorUsername = (commentsTargetPost.profile?.name || commentsTargetPost.user?.name || currentMaisonName).toLowerCase().replace(/\s+/g, "");
                  const authorCommentId = `${commentsTargetPost.id}_author`;
                  const isAuthorLiked = likedComments[authorCommentId] || false;
                  const authorLikeCount = commentLikeCounts[authorCommentId] || 0;

                  return (
                    <View style={styles.commentRow}>
                      <TouchableOpacity 
                        onPress={() => {
                          const authorName = commentsTargetPost.profile?.name || commentsTargetPost.user?.name || currentMaisonName;
                          navigateToUserProfile(authorName);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>
                            {(commentsTargetPost.profile?.name || commentsTargetPost.user?.name || "A")[0]?.toUpperCase()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity 
                          onPress={() => {
                            const authorName = commentsTargetPost.profile?.name || commentsTargetPost.user?.name || currentMaisonName;
                            navigateToUserProfile(authorName);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.commentUsername}>
                            {authorUsername} <Text style={styles.commentBadge}>Author</Text>
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.commentTextContent}>
                          {commentsTargetPost.caption || "Atelier Masterpiece Collection."}
                        </Text>
                        
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 }}>
                          <Text style={styles.commentTime}>Pinned • 1d</Text>
                          {authorLikeCount > 0 && (
                            <Text style={[styles.commentTime, { fontWeight: "600" }]}>
                              {authorLikeCount} {authorLikeCount === 1 ? "like" : "likes"}
                            </Text>
                          )}
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("medium");
                            setLikedComments(prev => ({ ...prev, [authorCommentId]: !isAuthorLiked }));
                            setCommentLikeCounts(prev => ({
                              ...prev,
                              [authorCommentId]: (prev[authorCommentId] || 0) + (isAuthorLiked ? -1 : 1)
                            }));
                          }}>
                            <Text style={[styles.commentTime, { fontWeight: "700", color: isAuthorLiked ? "#FF3B30" : "rgba(255,255,255,0.6)" }]}>
                              {isAuthorLiked ? "Liked" : "Like"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("light");
                            setReplyingTo({ commentId: "author", username: authorUsername });
                            setNewCommentText(`@${authorUsername} `);
                            if (commentInputRef.current) {
                              commentInputRef.current.focus();
                            }
                          }}>
                            <Text style={[styles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Reply</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("light");
                            Share.share({
                              message: `Caption from @${authorUsername}: "${commentsTargetPost.caption || "Atelier Masterpiece Collection."}" on AURA.`,
                            });
                          }}>
                            <Text style={[styles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Comment Heart Toggle */}
                      <TouchableOpacity onPress={() => {
                        triggerHaptic("medium");
                        setLikedComments(prev => ({ ...prev, [authorCommentId]: !isAuthorLiked }));
                        setCommentLikeCounts(prev => ({
                          ...prev,
                          [authorCommentId]: (prev[authorCommentId] || 0) + (isAuthorLiked ? -1 : 1)
                        }));
                      }}>
                        <Lucide 
                          name={isAuthorLiked ? "heart" : "heart-outline"} 
                          size={15} 
                          color={isAuthorLiked ? "#FF3B30" : "rgba(255,255,255,0.4)"} 
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })()}
                
                <View style={styles.commentsSeparator} />

                {/* Additional user comments */}
                {(() => {
                  const allComments = postComments[commentsTargetPost.id] || [];
                  const parentComments = allComments.filter((c: any) => !c.parentId);
                  const replies = allComments.filter((c: any) => c.parentId);

                  return parentComments.map((comm: any) => {
                    const commentId = `${commentsTargetPost.id}_${comm.id}`;
                    const isCommentLiked = likedComments[commentId] || false;
                    const likeCount = commentLikeCounts[commentId] || 0;
                    const commentReplies = replies.filter((r: any) => r.parentId === comm.id);
                    const isExpanded = expandedComments[commentId] || false;

                    return (
                      <View key={comm.id} style={{ marginBottom: 12 }}>
                        {/* Parent Comment */}
                        <View style={styles.commentRow}>
                          <TouchableOpacity 
                            onPress={() => navigateToUserProfile(comm.username)}
                            activeOpacity={0.85}
                          >
                            <View style={[styles.commentAvatar, { backgroundColor: "#fb923c" }]}>
                              <Text style={styles.commentAvatarText}>
                                {comm.username[0]?.toUpperCase()}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <TouchableOpacity 
                              onPress={() => navigateToUserProfile(comm.username)}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.commentUsername}>{comm.username}</Text>
                            </TouchableOpacity>
                            <Text style={styles.commentTextContent}>{comm.text}</Text>
                            
                            {/* Inline Actions Row (Like, Reply, Share) */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 }}>
                              <Text style={styles.commentTime}>{comm.time || "now"}</Text>
                              {likeCount > 0 && (
                                <Text style={[styles.commentTime, { fontWeight: "600" }]}>
                                  {likeCount} {likeCount === 1 ? "like" : "likes"}
                                </Text>
                              )}
                              <TouchableOpacity onPress={() => {
                                triggerHaptic("medium");
                                setLikedComments(prev => ({ ...prev, [commentId]: !isCommentLiked }));
                                setCommentLikeCounts(prev => ({
                                  ...prev,
                                  [commentId]: (prev[commentId] || 0) + (isCommentLiked ? -1 : 1)
                                }));
                              }}>
                                <Text style={[styles.commentTime, { fontWeight: "700", color: isCommentLiked ? "#FF3B30" : "rgba(255,255,255,0.6)" }]}>
                                  {isCommentLiked ? "Liked" : "Like"}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => {
                                triggerHaptic("light");
                                setReplyingTo({ commentId: comm.id, username: comm.username });
                                setNewCommentText(`@${comm.username} `);
                                if (commentInputRef.current) {
                                  commentInputRef.current.focus();
                                }
                              }}>
                                <Text style={[styles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Reply</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => {
                                triggerHaptic("light");
                                Share.share({
                                  message: `Comment from @${comm.username}: "${comm.text}" on AURA.`,
                                });
                              }}>
                                <Text style={[styles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Share</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Comment Heart Toggle */}
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("medium");
                            setLikedComments(prev => ({ ...prev, [commentId]: !isCommentLiked }));
                            setCommentLikeCounts(prev => ({
                              ...prev,
                              [commentId]: (prev[commentId] || 0) + (isCommentLiked ? -1 : 1)
                            }));
                          }}>
                            <Lucide 
                              name={isCommentLiked ? "heart" : "heart-outline"} 
                              size={15} 
                              color={isCommentLiked ? "#FF3B30" : "rgba(255,255,255,0.4)"} 
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Accordion / Thread Line Indicator for Replies */}
                        {commentReplies.length > 0 && (
                          <View style={{ marginLeft: 44, marginTop: 4 }}>
                            <TouchableOpacity 
                              style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, paddingVertical: 4 }}
                              onPress={() => {
                                triggerHaptic("light");
                                setExpandedComments(prev => ({
                                  ...prev,
                                  [commentId]: !isExpanded
                                }));
                              }}
                            >
                              <View style={{ width: 24, height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginRight: 8 }} />
                              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "600" }}>
                                {isExpanded ? "Hide replies" : `View replies (${commentReplies.length})`}
                              </Text>
                            </TouchableOpacity>

                            {isExpanded && commentReplies.map((reply: any) => {
                              const replyCommentId = `${commentsTargetPost.id}_${reply.id}`;
                              const isReplyLiked = likedComments[replyCommentId] || false;
                              const replyLikeCount = commentLikeCounts[replyCommentId] || 0;

                              return (
                                <View key={reply.id} style={[styles.commentRow, { paddingLeft: 8, marginTop: 4, marginBottom: 8 }]}>
                                  <TouchableOpacity 
                                    onPress={() => navigateToUserProfile(reply.username)}
                                    activeOpacity={0.85}
                                  >
                                    <View style={[styles.commentAvatar, { width: 24, height: 24, borderRadius: 12, backgroundColor: "#3b82f6" }]}>
                                      <Text style={[styles.commentAvatarText, { fontSize: 10 }]}>
                                        {reply.username[0]?.toUpperCase()}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                  <View style={{ flex: 1 }}>
                                    <TouchableOpacity 
                                      onPress={() => navigateToUserProfile(reply.username)}
                                      activeOpacity={0.85}
                                    >
                                      <Text style={styles.commentUsername}>{reply.username}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.commentTextContent}>{reply.text}</Text>
                                    
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 }}>
                                      <Text style={styles.commentTime}>{reply.time || "now"}</Text>
                                      {replyLikeCount > 0 && (
                                        <Text style={[styles.commentTime, { fontWeight: "600" }]}>
                                          {replyLikeCount} {replyLikeCount === 1 ? "like" : "likes"}
                                        </Text>
                                      )}
                                      <TouchableOpacity onPress={() => {
                                        triggerHaptic("medium");
                                        setLikedComments(prev => ({ ...prev, [replyCommentId]: !isReplyLiked }));
                                        setCommentLikeCounts(prev => ({
                                          ...prev,
                                          [replyCommentId]: (prev[replyCommentId] || 0) + (isReplyLiked ? -1 : 1)
                                        }));
                                      }}>
                                        <Text style={[styles.commentTime, { fontWeight: "700", color: isReplyLiked ? "#FF3B30" : "rgba(255,255,255,0.6)" }]}>
                                          {isReplyLiked ? "Liked" : "Like"}
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => {
                                        triggerHaptic("light");
                                        setReplyingTo({ commentId: comm.id, username: reply.username });
                                        setNewCommentText(`@${reply.username} `);
                                        if (commentInputRef.current) {
                                          commentInputRef.current.focus();
                                        }
                                      }}>
                                        <Text style={[styles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Reply</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => {
                                        triggerHaptic("light");
                                        Share.share({
                                          message: `Comment from @${reply.username}: "${reply.text}" on AURA.`,
                                        });
                                      }}>
                                        <Text style={[styles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Share</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                  <TouchableOpacity onPress={() => {
                                    triggerHaptic("medium");
                                    setLikedComments(prev => ({ ...prev, [replyCommentId]: !isReplyLiked }));
                                    setCommentLikeCounts(prev => ({
                                      ...prev,
                                      [replyCommentId]: (prev[replyCommentId] || 0) + (isReplyLiked ? -1 : 1)
                                    }));
                                  }}>
                                    <Lucide 
                                      name={isReplyLiked ? "heart" : "heart-outline"} 
                                      size={13} 
                                      color={isReplyLiked ? "#FF3B30" : "rgba(255,255,255,0.4)"} 
                                    />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </ScrollView>

              {/* Replying target header indicator */}
              {replyingTo && (
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.04)"
                }}>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    Replying to <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>@{replyingTo.username}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => {
                    triggerHaptic("light");
                    setReplyingTo(null);
                    setNewCommentText("");
                  }}>
                    <Lucide name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom text input row */}
              <View style={[styles.commentsInputRow, { paddingBottom: insets.bottom + 8 }]}>
                <View style={[styles.commentAvatar, { width: 32, height: 32, borderRadius: 16 }]}>
                  <Text style={[styles.commentAvatarText, { fontSize: 13.5 }]}>A</Text>
                </View>
                
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentTextInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  onSubmitEditing={() => {
                    if (!newCommentText.trim()) return;
                    triggerHaptic("success");
                    const newComm = {
                      id: `c_${Date.now()}`,
                      username: "alok_curator",
                      text: newCommentText.trim(),
                      time: "now",
                      parentId: replyingTo ? replyingTo.commentId : undefined
                    };
                    setPostComments(prev => ({
                      ...prev,
                      [commentsTargetPost.id]: [...(prev[commentsTargetPost.id] || []), newComm]
                    }));
                    if (replyingTo) {
                      const parentId = `${commentsTargetPost.id}_${replyingTo.commentId}`;
                      setExpandedComments(prev => ({ ...prev, [parentId]: true }));
                    }
                    setNewCommentText("");
                    setReplyingTo(null);
                    setTimeout(() => {
                      commentInputRef.current?.focus();
                    }, 50);
                  }}
                />
                
                <TouchableOpacity 
                  disabled={!newCommentText.trim()} 
                  onPress={() => {
                    triggerHaptic("success");
                    const newComm = {
                      id: `c_${Date.now()}`,
                      username: "alok_curator",
                      text: newCommentText.trim(),
                      time: "now",
                      parentId: replyingTo ? replyingTo.commentId : undefined
                    };
                    setPostComments(prev => ({
                      ...prev,
                      [commentsTargetPost.id]: [...(prev[commentsTargetPost.id] || []), newComm]
                    }));
                    if (replyingTo) {
                      const parentId = `${commentsTargetPost.id}_${replyingTo.commentId}`;
                      setExpandedComments(prev => ({ ...prev, [parentId]: true }));
                    }
                    setNewCommentText("");
                    setReplyingTo(null);
                    setTimeout(() => {
                      commentInputRef.current?.focus();
                    }, 50);
                  }}
                  style={{ paddingLeft: 8 }}
                >
                  <Text style={[
                    styles.commentPostBtnText, 
                    !newCommentText.trim() && { color: "rgba(255,255,255,0.2)" }
                  ]}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🏛️ SOVEREIGN MULTI-PATH ONBOARDING MODAL                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showOnboardModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {}}
      >
        <View style={onboardStyles.container}>
          <SafeAreaView style={onboardStyles.safe} edges={["top", "bottom"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={onboardStyles.scroll}>

              {/* Header */}
              <View style={onboardStyles.headerBlock}>
                <Text style={onboardStyles.logoText}>A U R A</Text>
                <Text style={onboardStyles.headerTitle}>Sovereign Identity Setup</Text>
                <Text style={onboardStyles.headerSub}>
                  Configure your publishing governance and data visibility from day one.
                </Text>
              </View>

              {/* ─── STEP: SELECT ACCOUNT TYPE ─── */}
              {onboardStep === "select" && (
                <View style={onboardStyles.pathsContainer}>

                  {/* Personal */}
                  <TouchableOpacity
                    style={onboardStyles.pathCard}
                    activeOpacity={0.8}
                    onPress={() => { triggerHaptic("medium"); setOnboardStep("personal"); }}
                  >
                    <View style={[onboardStyles.pathIconCircle, { backgroundColor: "rgba(0,245,255,0.12)" }]}>
                      <Lucide name="person-outline" size={28} color="#00f5ff" />
                    </View>
                    <View style={onboardStyles.pathTextBlock}>
                      <Text style={onboardStyles.pathTitle}>Personal Node</Text>
                      <Text style={onboardStyles.pathDesc}>Public or Private sovereign profile with feed-level privacy control.</Text>
                    </View>
                    <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>

                  {/* Influencer */}
                  <TouchableOpacity
                    style={onboardStyles.pathCard}
                    activeOpacity={0.8}
                    onPress={() => { triggerHaptic("medium"); setOnboardStep("influencer"); }}
                  >
                    <View style={[onboardStyles.pathIconCircle, { backgroundColor: "rgba(167,139,250,0.12)" }]}>
                      <Lucide name="sparkles-outline" size={28} color="#a78bfa" />
                    </View>
                    <View style={onboardStyles.pathTextBlock}>
                      <Text style={onboardStyles.pathTitle}>Influencer / Creator</Text>
                      <Text style={onboardStyles.pathDesc}>Select your content vertical and unlock creator tools and brand deals.</Text>
                    </View>
                    <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>

                  {/* Business */}
                  <TouchableOpacity
                    style={onboardStyles.pathCard}
                    activeOpacity={0.8}
                    onPress={() => { triggerHaptic("medium"); setOnboardStep("business"); }}
                  >
                    <View style={[onboardStyles.pathIconCircle, { backgroundColor: "rgba(251,146,60,0.12)" }]}>
                      <Lucide name="storefront-outline" size={28} color="#fb923c" />
                    </View>
                    <View style={onboardStyles.pathTextBlock}>
                      <Text style={onboardStyles.pathTitle}>Business Maison</Text>
                      <Text style={onboardStyles.pathDesc}>Commercial brand with KYB verification, tax registry, and seller dashboard.</Text>
                    </View>
                    <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>

                </View>
              )}

              {/* ─── STEP: PERSONAL ─── */}
              {onboardStep === "personal" && (
                <View style={onboardStyles.formContainer}>
                  <TouchableOpacity onPress={() => setOnboardStep("select")} style={onboardStyles.backBtn}>
                    <Lucide name="arrow-back" size={20} color="#fff" />
                    <Text style={onboardStyles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <View style={[onboardStyles.pathIconCircle, { backgroundColor: "rgba(0,245,255,0.12)", alignSelf: "center", marginBottom: 16 }]}>
                    <Lucide name="person-outline" size={32} color="#00f5ff" />
                  </View>
                  <Text style={onboardStyles.formTitle}>Personal Node</Text>
                  <Text style={onboardStyles.formSub}>Choose your account visibility governance.</Text>

                  {/* Privacy Toggle */}
                  <View style={onboardStyles.toggleRow}>
                    <View>
                      <Text style={onboardStyles.toggleLabel}>Private Account</Text>
                      <Text style={onboardStyles.toggleDesc}>
                        {onboardPrivate
                          ? "Only approved followers can see your posts."
                          : "Your profile and posts are visible to everyone."}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { triggerHaptic("light"); setOnboardPrivate(!onboardPrivate); }}
                      style={[onboardStyles.toggleTrack, onboardPrivate && onboardStyles.toggleTrackActive]}
                    >
                      <View style={[onboardStyles.toggleThumb, onboardPrivate && onboardStyles.toggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  {/* Visibility Badge */}
                  <View style={[onboardStyles.visibilityBadge, { backgroundColor: onboardPrivate ? "rgba(239,68,68,0.1)" : "rgba(52,211,153,0.1)" }]}>
                    <Lucide name={onboardPrivate ? "lock-closed" : "globe-outline"} size={16} color={onboardPrivate ? "#ef4444" : "#34d399"} />
                    <Text style={[onboardStyles.visibilityText, { color: onboardPrivate ? "#ef4444" : "#34d399" }]}>
                      {onboardPrivate ? "Private — Restricted Mesh Visibility" : "Public — Open Sovereign Profile"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[onboardStyles.submitBtn, onboardLoading && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    disabled={onboardLoading}
                    onPress={() => handleSubmitOnboarding("PERSONAL")}
                  >
                    {onboardLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={onboardStyles.submitBtnText}>Activate Sovereign Identity</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ─── STEP: INFLUENCER ─── */}
              {onboardStep === "influencer" && (
                <View style={onboardStyles.formContainer}>
                  <TouchableOpacity onPress={() => setOnboardStep("select")} style={onboardStyles.backBtn}>
                    <Lucide name="arrow-back" size={20} color="#fff" />
                    <Text style={onboardStyles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <View style={[onboardStyles.pathIconCircle, { backgroundColor: "rgba(167,139,250,0.12)", alignSelf: "center", marginBottom: 16 }]}>
                    <Lucide name="sparkles-outline" size={32} color="#a78bfa" />
                  </View>
                  <Text style={onboardStyles.formTitle}>Creator Profile</Text>
                  <Text style={onboardStyles.formSub}>Select your primary content vertical.</Text>

                  {/* Category Tags Grid */}
                  <View style={onboardStyles.tagsGrid}>
                    {INFLUENCER_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => { triggerHaptic("light"); setOnboardInfluencerCategory(cat); }}
                        style={[
                          onboardStyles.tagChip,
                          onboardInfluencerCategory === cat && onboardStyles.tagChipActive
                        ]}
                      >
                        <Text style={[
                          onboardStyles.tagChipText,
                          onboardInfluencerCategory === cat && onboardStyles.tagChipTextActive
                        ]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[onboardStyles.submitBtn, onboardLoading && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    disabled={onboardLoading}
                    onPress={() => handleSubmitOnboarding("INFLUENCER")}
                  >
                    {onboardLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={onboardStyles.submitBtnText}>Activate Creator Identity</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ─── STEP: BUSINESS ─── */}
              {onboardStep === "business" && (
                <View style={onboardStyles.formContainer}>
                  <TouchableOpacity onPress={() => setOnboardStep("select")} style={onboardStyles.backBtn}>
                    <Lucide name="arrow-back" size={20} color="#fff" />
                    <Text style={onboardStyles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <View style={[onboardStyles.pathIconCircle, { backgroundColor: "rgba(251,146,60,0.12)", alignSelf: "center", marginBottom: 16 }]}>
                    <Lucide name="storefront-outline" size={32} color="#fb923c" />
                  </View>
                  <Text style={onboardStyles.formTitle}>Business Maison</Text>
                  <Text style={onboardStyles.formSub}>Register your commercial brand on the AURA mesh.</Text>

                  {/* Brand Name */}
                  <View style={onboardStyles.inputGroup}>
                    <Text style={onboardStyles.inputLabel}>Brand Name</Text>
                    <TextInput
                      style={onboardStyles.textInput}
                      placeholder="e.g. Rare Raven"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={onboardBrandName}
                      onChangeText={setOnboardBrandName}
                    />
                  </View>

                  {/* Website */}
                  <View style={onboardStyles.inputGroup}>
                    <Text style={onboardStyles.inputLabel}>Website</Text>
                    <TextInput
                      style={onboardStyles.textInput}
                      placeholder="e.g. rareraven.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={onboardWebsite}
                      onChangeText={setOnboardWebsite}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>

                  {/* Tax Structure Selector */}
                  <View style={onboardStyles.inputGroup}>
                    <Text style={onboardStyles.inputLabel}>Tax Structure</Text>
                    <View style={onboardStyles.taxToggleRow}>
                      <TouchableOpacity
                        style={[onboardStyles.taxOption, !onboardGstExempt && onboardStyles.taxOptionActive]}
                        onPress={() => { triggerHaptic("light"); setOnboardGstExempt(false); }}
                      >
                        <Lucide name="document-text-outline" size={16} color={!onboardGstExempt ? "#fb923c" : "rgba(255,255,255,0.4)"} />
                        <Text style={[onboardStyles.taxOptionText, !onboardGstExempt && { color: "#fb923c" }]}>GST Registered</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[onboardStyles.taxOption, onboardGstExempt && onboardStyles.taxOptionActive]}
                        onPress={() => { triggerHaptic("light"); setOnboardGstExempt(true); }}
                      >
                        <Lucide name="shield-checkmark-outline" size={16} color={onboardGstExempt ? "#34d399" : "rgba(255,255,255,0.4)"} />
                        <Text style={[onboardStyles.taxOptionText, onboardGstExempt && { color: "#34d399" }]}>Non-GST / Exempt</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* GSTIN Input (conditional) */}
                  {!onboardGstExempt && (
                    <View style={onboardStyles.inputGroup}>
                      <Text style={onboardStyles.inputLabel}>GSTIN / VAT ID</Text>
                      <TextInput
                        style={onboardStyles.textInput}
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={onboardTaxId}
                        onChangeText={setOnboardTaxId}
                        autoCapitalize="characters"
                        maxLength={15}
                      />
                      <Text style={onboardStyles.inputHint}>Standard 15-character alphanumeric tax identifier.</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[onboardStyles.submitBtn, (onboardLoading || !onboardBrandName.trim()) && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    disabled={onboardLoading || !onboardBrandName.trim()}
                    onPress={() => handleSubmitOnboarding("BUSINESS")}
                  >
                    {onboardLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={onboardStyles.submitBtnText}>Activate Maison Identity</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* 👤 SOVEREIGN PROFILE SWITCHER PANEL */}
      <Modal
        visible={showProfileSwitcher}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileSwitcher(false)}
      >
        <View style={switcherStyles.overlay}>
          <TouchableOpacity 
            style={switcherStyles.dismissTouchable} 
            onPress={() => setShowProfileSwitcher(false)} 
          />
          <View style={switcherStyles.panel}>
            {/* Header notch indicator */}
            <View style={switcherStyles.notch} />
            
            <View style={switcherStyles.header}>
              <Text style={switcherStyles.headerTitle}>Switch Sovereign Identity</Text>
              <TouchableOpacity onPress={() => setShowProfileSwitcher(false)}>
                <Lucide name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={switcherStyles.profileList}>
              {userProfiles && userProfiles.map((p) => {
                const isActive = activeProfile && activeProfile.id === p.id;
                let profileIcon = "person-outline";
                let iconColor = "#00f5ff";
                let bgOverlay = "rgba(0, 245, 255, 0.08)";

                if (p.type === "INFLUENCER") {
                  profileIcon = "sparkles-outline";
                  iconColor = "#a78bfa";
                  bgOverlay = "rgba(167, 139, 250, 0.08)";
                } else if (p.type === "BUSINESS") {
                  profileIcon = "storefront-outline";
                  iconColor = "#fb923c";
                  bgOverlay = "rgba(251, 146, 60, 0.08)";
                }

                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      switcherStyles.profileCard,
                      isActive && switcherStyles.profileCardActive
                    ]}
                    onPress={async () => {
                      triggerHaptic("medium");
                      const res = await switchActiveProfile(p.id);
                      if (res.success) {
                        setShowProfileSwitcher(false);
                      } else {
                        Alert.alert("Handshake Interrupted", res.error || "Failed to switch active node.");
                      }
                    }}
                  >
                    <View style={[switcherStyles.profileIconCircle, { backgroundColor: bgOverlay }]}>
                      <Lucide name={profileIcon as any} size={22} color={iconColor} />
                    </View>
                    <View style={switcherStyles.profileTextBlock}>
                      <Text style={switcherStyles.profileNameText}>{p.name}</Text>
                      <Text style={switcherStyles.profileUsernameText}>
                        @{p.username} • {p.type === "PERSONAL" ? (p.isPrivate ? "🔒 Private" : "✦ Public") : p.category}
                      </Text>
                    </View>
                    {isActive ? (
                      <Lucide name="checkmark-circle" size={24} color="#00f5ff" />
                    ) : (
                      <View style={switcherStyles.uncheckDot} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Add New Profile Trigger */}
              <TouchableOpacity
                style={switcherStyles.addProfileBtn}
                onPress={() => {
                  triggerHaptic("medium");
                  setShowProfileSwitcher(false);
                  setTimeout(() => {
                    setShowAddProfileModal(true);
                  }, 100);
                }}
              >
                <View style={switcherStyles.addProfileIconCircle}>
                  <Lucide name="add" size={24} color="#00f5ff" />
                </View>
                <Text style={switcherStyles.addProfileBtnText}>Create New Sovereign Identity</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🔔 HIGH-FIDELITY GLASSMORPHIC ACTIVITY NOTIFICATION DRAWER */}
      <Modal
        visible={showActivityDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActivityDrawer(false)}
      >
        <View style={activityStyles.overlay}>
          <TouchableOpacity 
            style={activityStyles.dismissTouchable} 
            onPress={() => setShowActivityDrawer(false)} 
          />
          <View style={activityStyles.panel}>
            {/* Header notch indicator */}
            <View style={activityStyles.notch} />
            
            <View style={activityStyles.header}>
              <TouchableOpacity onPress={() => setShowActivityDrawer(false)} style={activityStyles.backBtn}>
                <Lucide name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <View style={activityStyles.headerTitleWrapper}>
                <Text style={activityStyles.headerTitle}>
                  {activeProfile ? activeProfile.username : "activity"}
                </Text>
                <Lucide name="chevron-down" size={12} color="#00f5ff" style={{ marginLeft: 3, marginTop: 2 }} />
                {/* Red dot notification */}
                <View style={activityStyles.headerRedDot} />
              </View>

              <TouchableOpacity onPress={() => setShowActivityDrawer(false)}>
                <Lucide name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* 📈 DYNAMIC PROFESSIONAL ADS PROMOTIONS BANNER */}
            {(activeProfile?.type === "BUSINESS" || activeProfile?.type === "INFLUENCER") && (
              <TouchableOpacity 
                style={activityStyles.adsBanner}
                onPress={() => {
                  triggerHaptic("medium");
                  Alert.alert(
                    "Ad Campaign Hub",
                    "Recent Activity from your ads:\n• Reach: 24.8K (+12% this week)\n• Auction Wins: 94.2%\n• Total Spent: 14,250 INR",
                    [{ text: "View Dashboard", onPress: () => router.push("/dashboard") }, { text: "Dismiss", style: "cancel" }]
                  );
                }}
              >
                <View style={activityStyles.adsIconContainer}>
                  <Lucide name="trending-up" size={20} color="#fff" />
                </View>
                <View style={activityStyles.adsTextContainer}>
                  <Text style={activityStyles.adsTitle}>Ads</Text>
                  <Text style={activityStyles.adsSubtitle}>Recent activity from your ads.</Text>
                </View>
                <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

            <ScrollView contentContainerStyle={activityStyles.notificationList} showsVerticalScrollIndicator={false}>
              {loadingNotifications ? (
                <View style={activityStyles.loadingContainer}>
                  <ActivityIndicator size="small" color="#00f5ff" />
                  <Text style={activityStyles.loadingText}>Fetching activity pulse...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={activityStyles.emptyContainer}>
                  <View style={activityStyles.emptyIconCircle}>
                    <Lucide name="heart-outline" size={40} color="rgba(255,255,255,0.2)" />
                  </View>
                  <Text style={activityStyles.emptyTitle}>No Activity Yet</Text>
                  <Text style={activityStyles.emptySubtitle}>When other users follow you, comment, or send brand offers, they'll pulse here!</Text>
                </View>
              ) : (() => {
                // Calculate chronological slices
                const nowMs = Date.now();
                const highlights: any[] = [];
                const last7Days: any[] = [];
                const last30Days: any[] = [];

                notifications.forEach((item: any) => {
                  const elapsedMs = nowMs - new Date(item.createdAt).getTime();
                  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

                  if (item.type === "BRAND_DEAL" && !item.read) {
                    highlights.push(item);
                  } else if (elapsedDays <= 7) {
                    last7Days.push(item);
                  } else {
                    last30Days.push(item);
                  }
                });

                const renderCard = (item: any) => {
                  let badgeColor = "#8b5cf6"; // Purple default
                  let badgeIcon = "notifications-outline";
                  if (item.type === "FOLLOW") {
                    badgeColor = "#fb923c"; // Orange
                    badgeIcon = "person-add-outline";
                  } else if (item.type === "BRAND_DEAL") {
                    badgeColor = "#00f5ff"; // Cyan
                    badgeIcon = "sparkles-outline";
                  } else if (item.type === "LIKE") {
                    badgeColor = "#d946ef"; // Magenta
                    badgeIcon = "heart";
                  } else if (item.type === "COMMENT") {
                    badgeColor = "#3b82f6"; // Blue
                    badgeIcon = "chatbubble-outline";
                  }

                  const formattedTime = () => {
                    const elapsedMs = Date.now() - new Date(item.createdAt).getTime();
                    const minutes = Math.floor(elapsedMs / (1000 * 60));
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);
                    if (days > 0) return `${days}d`;
                    if (hours > 0) return `${hours}h`;
                    if (minutes > 0) return `${minutes}m`;
                    return "now";
                  };

                  return (
                    <View key={item.id} style={[activityStyles.card, !item.read && activityStyles.cardUnread]}>
                      <TouchableOpacity 
                        onPress={() => navigateToUserProfile(item.senderUsername)}
                        activeOpacity={0.85}
                      >
                        <View style={activityStyles.avatarWrapper}>
                          <Image source={{ uri: item.senderLogo }} style={activityStyles.avatar} />
                          <View style={[activityStyles.badgeDot, { backgroundColor: badgeColor }]}>
                            <Lucide name={badgeIcon as any} size={8} color="#fff" />
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      <View style={activityStyles.contentBlock}>
                        <Text style={activityStyles.messageText}>
                          <Text 
                            style={activityStyles.senderUsername}
                            onPress={() => navigateToUserProfile(item.senderUsername)}
                          >
                            @{item.senderUsername}{" "}
                          </Text>
                          {item.message}
                          <Text style={activityStyles.timeText}>  {formattedTime()}</Text>
                        </Text>
                      </View>
                      
                      {item.type === "FOLLOW" && (
                        <TouchableOpacity 
                          style={activityStyles.actionButton}
                          onPress={() => {
                            triggerHaptic("medium");
                            Alert.alert("Network Node Sync", `Following back @${item.senderUsername} dynamically.`);
                          }}
                        >
                          <Text style={activityStyles.actionButtonText}>Follow back</Text>
                        </TouchableOpacity>
                      )}

                      {item.type === "BRAND_DEAL" && (
                        <TouchableOpacity 
                          style={[activityStyles.actionButton, { backgroundColor: "#00f5ff" }]}
                          onPress={() => {
                            triggerHaptic("success");
                            Alert.alert(
                              "Brand Deal Offer", 
                              `Review terms: "Bespoke look promotion for 320,000 INR."`,
                              [
                                { text: "Accept Offer", onPress: () => Alert.alert("Success", "Offer accepted and escrow locked!") },
                                { text: "Decline", style: "cancel" }
                              ]
                            );
                          }}
                        >
                          <Text style={[activityStyles.actionButtonText, { color: "#080415", fontWeight: "bold" }]}>Review</Text>
                        </TouchableOpacity>
                      )}

                      {/* Thumbnail Preview on absolute right exactly matching Instagram! */}
                      {item.relatedPostThumbnail && (
                        <Image source={{ uri: item.relatedPostThumbnail }} style={activityStyles.postThumbnail} />
                      )}
                    </View>
                  );
                };

                return (
                  <>
                    {/* Section 1: Highlights */}
                    {highlights.length > 0 && (
                      <View style={activityStyles.sectionBlock}>
                        <Text style={activityStyles.sectionTitle}>Highlights</Text>
                        {highlights.map(renderCard)}
                      </View>
                    )}

                    {/* Section 2: Last 7 days */}
                    {last7Days.length > 0 && (
                      <View style={activityStyles.sectionBlock}>
                        <Text style={activityStyles.sectionTitle}>Last 7 days</Text>
                        {last7Days.map(renderCard)}
                      </View>
                    )}

                    {/* Section 3: Last 30 days */}
                    {last30Days.length > 0 && (
                      <View style={activityStyles.sectionBlock}>
                        <Text style={activityStyles.sectionTitle}>Last 30 days</Text>
                        {last30Days.map(renderCard)}
                      </View>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>


      {/* ➕ SOVEREIGN MULTI-PATH ADD PROFILE WIZARD MODAL */}
      <Modal
        visible={showAddProfileModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setShowAddProfileModal(false)}
      >
        <View style={onboardStyles.container}>
          <SafeAreaView style={onboardStyles.safe} edges={["top", "bottom"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={onboardStyles.scroll}>
              
              <TouchableOpacity 
                onPress={() => setShowAddProfileModal(false)} 
                style={[onboardStyles.backBtn, { alignSelf: "flex-start", marginBottom: 20 }]}
              >
                <Lucide name="arrow-back" size={20} color="#fff" />
                <Text style={onboardStyles.backBtnText}>Cancel</Text>
              </TouchableOpacity>

              <View style={onboardStyles.headerBlock}>
                <Text style={onboardStyles.logoText}>A U R A</Text>
                <Text style={onboardStyles.headerTitle}>Mint New Identity Node</Text>
                <Text style={onboardStyles.headerSub}>
                  Add another sovereign persona to switch seamlessly and control your publishing algorithms.
                </Text>
              </View>

              {/* Pathway Type Switcher Cards */}
              <View style={switcherStyles.wizardSelectorRow}>
                {[
                  { type: "PERSONAL", label: "Personal", icon: "person-outline", color: "#00f5ff" },
                  { type: "INFLUENCER", label: "Creator", icon: "sparkles-outline", color: "#a78bfa" },
                  { type: "BUSINESS", label: "Maison", icon: "storefront-outline", color: "#fb923c" }
                ].map((item) => {
                  const isActive = newProfileType === item.type;
                  return (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        switcherStyles.wizardSelectorCard,
                        isActive && { borderColor: item.color, backgroundColor: "rgba(255,255,255,0.03)" }
                      ]}
                      onPress={() => { triggerHaptic("light"); setNewProfileType(item.type as any); }}
                    >
                      <Lucide name={item.icon as any} size={20} color={isActive ? item.color : "rgba(255,255,255,0.4)"} />
                      <Text style={[switcherStyles.wizardSelectorLabel, isActive && { color: "#fff" }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Shared inputs */}
              <View style={onboardStyles.formContainer}>
                
                {/* Profile Display Name */}
                <View style={onboardStyles.inputGroup}>
                  <Text style={onboardStyles.inputLabel}>Profile Display Name</Text>
                  <TextInput
                    style={onboardStyles.textInput}
                    placeholder="e.g. Alok Design Lab"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={newProfileName}
                    onChangeText={setNewProfileName}
                  />
                </View>

                {/* Username handle */}
                <View style={onboardStyles.inputGroup}>
                  <Text style={onboardStyles.inputLabel}>Sovereign Username Handle</Text>
                  <TextInput
                    style={onboardStyles.textInput}
                    placeholder="e.g. alok_design"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={newProfileUsername}
                    onChangeText={setNewProfileUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* PERSONAL PATHWAY SPECIFICS */}
                {newProfileType === "PERSONAL" && (
                  <View style={{ width: "100%", marginTop: 12 }}>
                    <View style={onboardStyles.toggleRow}>
                      <View>
                        <Text style={onboardStyles.toggleLabel}>Private Account</Text>
                        <Text style={onboardStyles.toggleDesc}>
                          {newProfilePrivate
                            ? "Only approved followers can see your visual feed."
                            : "Your posts will populate discovery nodes globally."}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => { triggerHaptic("light"); setNewProfilePrivate(!newProfilePrivate); }}
                        style={[onboardStyles.toggleTrack, newProfilePrivate && onboardStyles.toggleTrackActive]}
                      >
                        <View style={[onboardStyles.toggleThumb, newProfilePrivate && onboardStyles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* INFLUENCER / CREATOR PATHWAY SPECIFICS */}
                {newProfileType === "INFLUENCER" && (
                  <View style={{ width: "100%", marginTop: 12 }}>
                    <Text style={onboardStyles.inputLabel}>Creator Publishing Vertical</Text>
                    <View style={onboardStyles.tagsGrid}>
                      {INFLUENCER_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => { triggerHaptic("light"); setNewProfileCategory(cat); }}
                          style={[
                            onboardStyles.tagChip,
                            newProfileCategory === cat && onboardStyles.tagChipActive
                          ]}
                        >
                          <Text style={[
                            onboardStyles.tagChipText,
                            newProfileCategory === cat && onboardStyles.tagChipTextActive
                          ]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* BUSINESS MAISON PATHWAY SPECIFICS */}
                {newProfileType === "BUSINESS" && (
                  <View style={{ width: "100%", marginTop: 12 }}>
                    
                    {/* Brand website */}
                    <View style={onboardStyles.inputGroup}>
                      <Text style={onboardStyles.inputLabel}>Maison Web Link</Text>
                      <TextInput
                        style={onboardStyles.textInput}
                        placeholder="e.g. alokmaison.com"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={newProfileWebsite}
                        onChangeText={setNewProfileWebsite}
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    </View>

                    {/* Tax Registry Option */}
                    <View style={onboardStyles.inputGroup}>
                      <Text style={onboardStyles.inputLabel}>Tax Structure Registry</Text>
                      <View style={onboardStyles.taxToggleRow}>
                        <TouchableOpacity
                          style={[onboardStyles.taxOption, !newProfileGstExempt && onboardStyles.taxOptionActive]}
                          onPress={() => { triggerHaptic("light"); setNewProfileGstExempt(false); }}
                        >
                          <Text style={[onboardStyles.taxOptionText, !newProfileGstExempt && { color: "#fb923c" }]}>GST Registered</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[onboardStyles.taxOption, newProfileGstExempt && onboardStyles.taxOptionActive]}
                          onPress={() => { triggerHaptic("light"); setNewProfileGstExempt(true); }}
                        >
                          <Text style={[onboardStyles.taxOptionText, newProfileGstExempt && { color: "#34d399" }]}>Non-GST / Exempt</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* GSTIN Input */}
                    {!newProfileGstExempt && (
                      <View style={onboardStyles.inputGroup}>
                        <Text style={onboardStyles.inputLabel}>15-character GSTIN</Text>
                        <TextInput
                          style={onboardStyles.textInput}
                          placeholder="e.g. 29AAAAA1111A1Z1"
                          placeholderTextColor="rgba(255,255,255,0.25)"
                          value={newProfileTaxId}
                          onChangeText={setNewProfileTaxId}
                          autoCapitalize="characters"
                          maxLength={15}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Submit Action */}
                <TouchableOpacity
                  style={[
                    onboardStyles.submitBtn, 
                    (addProfileLoading || !newProfileName.trim() || !newProfileUsername.trim()) && { opacity: 0.6 }
                  ]}
                  activeOpacity={0.85}
                  disabled={addProfileLoading || !newProfileName.trim() || !newProfileUsername.trim()}
                  onPress={async () => {
                    if (!newProfileName.trim() || !newProfileUsername.trim()) return;
                    setAddProfileLoading(true);
                    triggerHaptic("medium");

                    const payload = {
                      userId: currentUser.id,
                      type: newProfileType,
                      name: newProfileName.trim(),
                      username: newProfileUsername.trim(),
                      category: newProfileType === "INFLUENCER" ? newProfileCategory : (newProfileType === "BUSINESS" ? "Business" : null),
                      isPrivate: newProfileType === "PERSONAL" ? newProfilePrivate : false,
                      taxId: newProfileType === "BUSINESS" ? (newProfileGstExempt ? null : newProfileTaxId) : null,
                      website: newProfileType === "BUSINESS" ? newProfileWebsite.trim() : null,
                      isGstExempt: newProfileType === "BUSINESS" ? newProfileGstExempt : false
                    };

                    const res = await createNewProfile(payload);
                    setAddProfileLoading(false);
                    if (res.success) {
                      triggerHaptic("success");
                      Alert.alert("Identity Minted", `Seamlessly set active profile to @${newProfileUsername.toLowerCase()}`);
                      
                      // Reset states
                      setNewProfileName("");
                      setNewProfileUsername("");
                      setNewProfilePrivate(false);
                      setNewProfileTaxId("");
                      setNewProfileWebsite("");
                      setShowAddProfileModal(false);
                    } else {
                      triggerHaptic("heavy");
                      Alert.alert("Handshake Interrupted", res.error || "Handle registration failed.");
                    }
                  }}
                >
                  {addProfileLoading ? (
                    <ActivityIndicator size="small" color="#080415" />
                  ) : (
                    <Text style={onboardStyles.submitBtnText}>Mint Sovereign Persona</Text>
                  )}
                </TouchableOpacity>

              </View>

            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ═══ Sponsored Ad Modals ═══ */}
      <InAppBrowserModal
        visible={browserModalVisible}
        url={browserUrl}
        onClose={() => setBrowserModalVisible(false)}
      />
      <ExploreProductsSheet
        visible={productsSheetVisible}
        products={productsSheetItems}
        onClose={() => setProductsSheetVisible(false)}
        onProductPress={(productId) => {
          setProductsSheetVisible(false);
          router.push(`/product/${productId}` as any);
        }}
      />
      <LeadGenSheet
        visible={leadGenVisible}
        brandName={leadGenMeta.brandName || "Brand"}
        brandLogo={leadGenMeta.brandLogo}
        formTitle={leadGenMeta.formTitle || "Get in Touch"}
        formDescription={leadGenMeta.formDescription || "Fill in your details and we'll reach out."}
        customQuestion={leadGenMeta.customQuestion}
        onClose={() => setLeadGenVisible(false)}
        onSubmit={(data) => {
          setLeadGenVisible(false);
          Alert.alert("Submitted!", "Your information has been sent to the brand.");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#080415",
  },
  instaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: "#080415",
  },
  instaLogoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "System", 
    letterSpacing: -0.5,
  },
  headerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    marginRight: 2,
  },
  dmIconWrapper: {
    position: "relative",
  },
  redDotNotification: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3b30",
  },
  storiesBubbleContainer: {
    height: 98,
    backgroundColor: "#080415",
  },
  storiesScroll: {
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 16,
  },
  storyBubbleItem: {
    alignItems: "center",
    gap: 4,
    width: 72,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: "#080415",
    position: "relative",
  },
  activeAvatarWrapper: {
    backgroundColor: "#080415",
    borderWidth: 2,
    borderColor: "#00f5ff", // AURA brand customized gradient-gold color look
  },
  yourStoryAvatarWrapper: {
    borderWidth: 0,
  },
  storyAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  yourStoryPlusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  storyUsername: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12.5,
    textAlign: "center",
  },
  feedSelectorTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0b071e",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  feedSelectorTabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  feedSelectorTabBtnActive: {
    backgroundColor: "rgba(0,245,255,0.08)",
    borderColor: "rgba(0,245,255,0.3)",
  },
  feedSelectorTabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  feedSelectorTabTextActive: {
    color: "#00f5ff",
  },
  feedWrapper: {
    flex: 1,
    backgroundColor: "#080415",
  },
  liveBannerContainer: {
    marginBottom: 16,
    width: "100%",
  },
  liveBannerCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  liveBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  liveBannerLeft: {
    flex: 1,
    gap: 4,
  },
  liveBannerLiveBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ff3b30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  liveBannerLiveText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  liveBannerTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
  },
  liveBannerDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  liveBannerRight: {
    marginLeft: 12,
    opacity: 0.9,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#080415",
  },
  reelContainer: {
    width: width,
    height: height - 210,
    position: "relative",
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  shoppableCard: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.3)",
    padding: 10,
    borderRadius: 16,
    zIndex: 10,
  },
  shopIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  shopInfo: {
    flex: 1,
    marginLeft: 10,
  },
  shopSub: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  shopTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  shopPrice: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12.5,
  },
  metaContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 80,
    zIndex: 10,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarChar: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14.5,
  },
  creatorDetails: {
    flex: 1,
  },
  nameFollowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  creatorName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14.5,
    maxWidth: width * 0.28,
  },
  saptashiText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },
  followBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  followBtnText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  moreOptionsBtn: {
    marginLeft: 6,
  },
  audioTrackText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11.5,
    marginTop: 2,
  },
  caption: {
    color: "#fff",
    fontSize: 14.5,
    marginTop: 4,
  },
  interactionColumn: {
    position: "absolute",
    bottom: 20,
    right: 16,
    alignItems: "center",
    gap: 16,
    zIndex: 10,
  },
  iconButton: {
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  // ─── Legacy (kept for DM slide-panel bottom offset reference) ───
  instagramBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 62,
    backgroundColor: "rgba(8,4,21,0.92)",
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabBtn: {
    padding: 8,
  },
  // ─── AURA 5-Tab Navigation ────────────────────────────────────────
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
  // ─── Elevated Create Button ───────────────────────────────────────
  auraCreateWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // Lift the create button above the nav bar
    marginBottom: 14,
  },
  auraCreateBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
    // Glow shadow
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
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
  dmSlidePanel: {
    position: "absolute",
    top: 0,
    bottom: 62,
    left: 0,
    right: 0,
    backgroundColor: "#080415",
    zIndex: 2000,
  },
  dmSafeArea: {
    flex: 1,
    backgroundColor: "#080415",
  },
  dmHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
  },
  dmTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dmTitleText: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
  },
  dmTitleRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  dmSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#120d2c",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 10,
    height: 38,
  },
  dmSearchIcon: {
    marginRight: 6,
  },
  dmSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15.5,
  },
  dmNotesSection: {
    height: 105,
    marginVertical: 4,
  },
  notesScroll: {
    paddingHorizontal: 16,
    gap: 20,
  },
  noteItem: {
    alignItems: "center",
    width: 72,
  },
  noteAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: "relative",
  },
  noteAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  noteCloud: {
    position: "absolute",
    top: -16,
    left: -8,
    right: -8,
    backgroundColor: "#1d173e",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  noteCloudText: {
    color: "#fff",
    fontSize: 10.5,
    textAlign: "center",
  },
  noteLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12.5,
    marginTop: 6,
    textAlign: "center",
  },
  mapCircleWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#120d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  dmFilterStrip: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  // ── Business Hub Styles ──
  bizStatCard: {
    backgroundColor: "#120d2c",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 90,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bizStatValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },
  bizStatLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 3,
    textAlign: "center",
  },
  bizSectionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  bizToolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 20,
  },
  bizToolCard: {
    backgroundColor: "#120d2c",
    borderRadius: 16,
    padding: 16,
    width: (width - 44) / 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bizToolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  bizToolName: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "700",
  },
  bizToolDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginTop: 3,
  },
  bizSubPanel: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  bizSubBack: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  bizSubBackText: {
    color: "#00f5ff",
    fontSize: 16.5,
    marginLeft: 4,
    fontWeight: "600",
  },
  bizSubTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  bizSubSubtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 15.5,
    marginBottom: 16,
  },
  bizAudiencePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00f5ff15",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  bizBroadcastInput: {
    backgroundColor: "#120d2c",
    borderRadius: 12,
    color: "#fff",
    padding: 14,
    fontSize: 16.5,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    textAlignVertical: "top",
    minHeight: 110,
    marginBottom: 14,
  },
  bizSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00f5ff",
    borderRadius: 12,
    paddingVertical: 13,
  },
  bizSendBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16.5,
  },
  bizSuccessBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34d39915",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#34d39933",
  },
  bizPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#120d2c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bizAdCard: {
    backgroundColor: "#120d2c",
    borderRadius: 14,
    padding: 14,
    width: 200,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bizTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  bizTagText: {
    fontSize: 13,
    fontWeight: "600",
  },
  bizUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00f5ff",
    marginLeft: 8,
  },
  bizAutoReplyToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bizToggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  bizToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  bizCatalogueItem: {
    width: (width - 76) / 3,
    backgroundColor: "#120d2c",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bizCatalogueImg: {
    width: "100%",
    height: 90,
  },
  bizCatalogueName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    padding: 6,
  },
  bizCataloguePrice: {
    color: "#00f5ff",
    fontSize: 13,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  dmFilterTab: {
    backgroundColor: "#120d2c",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dmFilterTabActive: {
    backgroundColor: "#fff",
  },
  dmFilterText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  dmFilterTextActive: {
    color: "#000",
  },
  dmThreadsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  threadItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  threadDetails: {
    flex: 1,
    marginLeft: 12,
  },
  threadNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  threadNameText: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "600",
  },
  verifiedCheck: {
    marginLeft: 2,
  },
  threadMessageText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    marginTop: 2,
  },
  threadMessageTextUnread: {
    color: "#fff",
    fontWeight: "bold",
  },
  cameraIconBtn: {
    padding: 8,
  },
  chatFeedScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatFeedContent: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  chatStartText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12.5,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
    gap: 8,
    maxWidth: "80%",
  },
  msgRowLeft: {
    alignSelf: "flex-start",
  },
  msgRowRight: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  msgAvatarText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 13,
  },
  msgBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  msgBubbleLeft: {
    backgroundColor: "#1d173e",
    borderBottomLeftRadius: 4,
  },
  msgBubbleRight: {
    backgroundColor: "#fff",
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 15.5,
    lineHeight: 18,
  },
  msgTextLeft: {
    color: "#fff",
  },
  msgTextRight: {
    color: "#000",
    fontWeight: "500",
  },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#120d2c",
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  paperclipBtn: {
    padding: 6,
  },
  chatInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15.5,
    paddingHorizontal: 10,
  },
  chatSendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#00f5ff",
  },
  chatSendBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "transparent",
  },
  chatSendBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },
  exploreSearchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  exploreSearchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#120d2c",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  exploreSearchIcon: {
    marginRight: 6,
  },
  exploreSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15.5,
  },
  exploreGridContent: {
    padding: 2,
  },
  exploreGridItem: {
    flex: 1/3,
    aspectRatio: 1,
    margin: 1,
    position: "relative",
    backgroundColor: "#111",
  },
  exploreGridImg: {
    width: "100%",
    height: "100%",
  },
  exploreGridPlayBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  newPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  newPostHeaderTitle: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
  },
  newPostScroll: {
    flex: 1,
  },
  newPostMediaPreview: {
    width: "100%",
    height: 200,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  newPostMediaImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  newPostCaptionWrap: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 80,
  },
  newPostCaptionInput: {
    color: "#fff",
    fontSize: 16.5,
    lineHeight: 20,
  },
  newPostChipsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  newPostChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  newPostChipText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "600",
  },
  newPostDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 16,
  },
  newPostOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  newPostOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  newPostOptionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newPostOptionText: {
    color: "#fff",
    fontSize: 16.5,
  },
  newPostOptionSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13.5,
    marginTop: 3,
    lineHeight: 15,
  },
  newPostOptionValue: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 15.5,
  },
  newPostAudioTrack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#120d2c",
    borderRadius: 12,
    padding: 10,
  },
  newPostAudioThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  newPostAudioName: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "600",
    flex: 1,
  },
  newPostToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#333",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  newPostToggleActive: {
    backgroundColor: "#4a90d9",
  },
  newPostToggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#888",
  },
  newPostToggleThumbActive: {
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  newPostProductList: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#120d2c",
    borderRadius: 12,
    overflow: "hidden",
  },
  newPostProductItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  newPostProductItemActive: {
    backgroundColor: "rgba(0,245,255,0.15)",
  },
  newPostProductName: {
    color: "#fff",
    fontSize: 14.5,
    flex: 1,
    marginRight: 8,
  },
  newPostProductPrice: {
    color: "#00f5ff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  newPostProductEmpty: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13.5,
    padding: 16,
    textAlign: "center",
  },
  newPostShareBtnWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  newPostShareBtn: {
    backgroundColor: "#4a90d9",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  newPostShareBtnText: {
    color: "#fff",
    fontSize: 17.5,
    fontWeight: "bold",
  },
  newPostInlineInput: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#120d2c",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  newPostInlineTextInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15.5,
  },
  autocompleteList: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#120d2c",
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 180,
  },
  autocompleteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  autocompleteAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  autocompleteCover: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  autocompleteLocationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,245,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  autocompleteText: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "600",
  },
  autocompleteSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  advancedOptionsContainer: {
    backgroundColor: "#121214",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  
  // High-fidelity story modal
  storyModalContainer: {
    flex: 1,
    backgroundColor: "#080415",
  },
  storyTapDetector: {
    position: "absolute",
    top: 100,
    bottom: 100,
    width: width * 0.35,
    zIndex: 100,
  },
  storyModalSafe: {
    flex: 1,
    justifyContent: "space-between",
  },
  storyProgressStrip: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  storyProgressBarBg: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    overflow: "hidden",
  },
  storyProgressBarFill: {
    height: "100%",
    backgroundColor: "#fff",
  },
  storyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 200,
  },
  storyHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fff",
  },
  storyHeaderUsername: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  storyHeaderTime: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13.5,
  },
  storySlideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  storySlideImage: {
    width: width,
    height: height * 0.6,
    resizeMode: "cover",
  },
  storySlideCaptionOverlay: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  storySlideCaptionText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 18,
  },
  storyReplyFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    zIndex: 200,
  },
  storyReplyInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 15.5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  storyReplySendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Photos layouts
  photoCard: {
    backgroundColor: "#0b071e",
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20,
    overflow: "hidden",
  },
  photoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  photoCardAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCardAuthor: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  photoCardSubtitle: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 1,
  },
  photoCardImage: {
    width: "100%",
    aspectRatio: 4/5,
    resizeMode: "cover",
  },
  photoCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  photoCardLikes: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  photoCardCaption: {
    color: "#fff",
    fontSize: 13.5,
    lineHeight: 15,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 16,
  },

  // Live layouts
  liveLobbyContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  liveLobbyHeader: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  goLiveHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00f5ff",
    padding: 16,
    borderRadius: 24,
    gap: 14,
    marginBottom: 28,
  },
  goLiveIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  goLiveHeroTitle: {
    color: "#000",
    fontSize: 16.5,
    fontWeight: "bold",
  },
  goLiveHeroDesc: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 12,
    lineHeight: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  liveSectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  showroomCard: {
    backgroundColor: "#0b071e",
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginBottom: 16,
    height: 200,
    position: "relative",
  },
  showroomImg: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
  showroomBadgeRow: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    gap: 8,
  },
  showroomLiveBadge: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  showroomLiveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  showroomViewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  showroomViewerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  showroomFooter: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },
  showroomTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
  },
  showroomHost: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12.5,
    marginTop: 2,
  },

  // Fullscreen interactive Stream UI
  liveStreamContainer: {
    flex: 1,
    position: "relative",
  },
  gradientOverlayLive: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  liveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 100,
  },
  liveBadgeIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveBadgePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveBadgeIconText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  liveViewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveViewerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  closeLiveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  endLiveBtn: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endLiveBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  liveCommentsArea: {
    position: "absolute",
    bottom: 76,
    left: 16,
    right: 16,
    height: height * 0.28,
    zIndex: 100,
  },
  liveCommentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
    alignSelf: "flex-start",
    maxWidth: "90%",
    gap: 4,
  },
  liveCommentUser: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  liveCommentText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 14,
  },
  liveControlsRow: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
    gap: 12,
  },
  liveCommentInput: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 14.5,
  },
  sendCommentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  floatingHeartItem: {
    position: "absolute",
    zIndex: 99,
  },

  // Broadcaster viewfinder UI
  broadcasterAvatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0,245,255,0.08)",
    borderWidth: 1.5,
    borderColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  broadcasterViewfinderText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "500",
  },
  viewfinderGridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  viewfinderGridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  broadcasterTelemetrySticker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    flex: 1,
  },
  broadcasterTelemetryText: {
    color: "#00ff00",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Stream settlement ledger popup styles
  settlementOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  settlementCardGlow: {
    borderRadius: 24,
    padding: 1.5,
    backgroundColor: "rgba(0, 245, 255,  0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.3)",
    width: "100%",
  },
  settlementCard: {
    backgroundColor: "#0d0822",
    borderRadius: 23,
    padding: 24,
    alignItems: "center",
    gap: 20,
  },
  settlementHeader: {
    alignItems: "center",
    gap: 6,
  },
  settlementTitle: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  settlementSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  settlementGrid: {
    width: "100%",
    backgroundColor: "#0b071e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 12,
  },
  settlementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settlementLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "500",
  },
  settlementValue: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  settlementFootnote: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 12,
    paddingHorizontal: 12,
  },
  settlementCloseBtn: {
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  settlementCloseBtnText: {
    color: "#000",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  
  // Reels Spacing and Camera Styles
  reelsCameraBtn: {
    position: "absolute",
    left: 16,
    zIndex: 90,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  feedVolumeBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  cameraViewfinder: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: "cover",
  },
  cameraGlassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  cameraSafe: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  cameraTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  cameraCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraTopRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cameraBadgeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadgeText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  recordingProgressContainer: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
    zIndex: 15,
  },
  recordingProgressBar: {
    height: "100%",
    backgroundColor: "#ff3b30",
  },
  suggestedAudioBubble: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 10,
  },
  suggestedAudioArt: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  suggestedAudioTextWrap: {
    marginRight: 4,
  },
  suggestedAudioTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  suggestedAudioSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11.5,
  },
  cameraLeftToolbar: {
    position: "absolute",
    left: 10,
    top: 160,
    gap: 20,
    zIndex: 10,
  },
  cameraToolItem: {
    alignItems: "center",
    width: 68,
  },
  cameraToolIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cameraToolLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cameraLengthCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraLengthText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  cameraNewBadge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: "#00f5ff",
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  cameraNewBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
  },
  cameraBottomWrapper: {
    width: "100%",
    gap: 16,
    paddingBottom: 8,
    marginTop: "auto",
  },
  cameraBottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    marginBottom: 4,
  },
  cameraGalleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#fff",
    overflow: "hidden",
  },
  cameraGalleryImg: {
    width: "100%",
    height: "100%",
  },
  cameraRecordOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  cameraRecordOuterRecording: {
    borderColor: "#ff3b30",
  },
  cameraRecordInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
  },
  cameraRecordInnerRecording: {
    backgroundColor: "#ff3b30",
    transform: [{ scale: 0.75 }],
  },
  cameraFlipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraSwiperFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    marginBottom: 2,
  },
  cameraSwiperOption: {
    paddingVertical: 4,
  },
  cameraSwiperOptionActive: {
    paddingVertical: 4,
    alignItems: "center",
  },
  cameraSwiperText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  cameraSwiperTextActive: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  cameraSwiperDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00f5ff",
    marginTop: 4,
  },
  
  // Advanced Reels Studio drawers & tagging styles
  cameraOverlayDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 420,
    backgroundColor: "#080415",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingTop: 16,
    zIndex: 999,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  drawerTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.04)",
    gap: 12,
  },
  drawerItemArt: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  drawerItemText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
  },
  drawerItemSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  audioSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  audioSearchIcon: {
    marginRight: 8,
  },
  audioSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14.5,
    paddingVertical: 0,
  },
  audioCategoryTab: {
    paddingHorizontal: 14,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  audioCategoryTabActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  audioCategoryTabText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  audioCategoryTabTextActive: {
    color: "#080415",
    fontWeight: "bold",
  },
  drawerItemCurrentlySelected: {
    backgroundColor: "rgba(0, 245, 255, 0.08)",
    borderColor: "rgba(0, 245, 255, 0.2)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  audioPreviewBtn: {
    padding: 4,
  },
  holoViewfinderContainer: {
    position: "absolute",
    top: height * 0.16,
    alignSelf: "center",
    width: width * 0.8,
    height: height * 0.46,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  holoCameraCard: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#00f5ff",
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 10,
    backgroundColor: "#000",
    position: "relative",
  },
  holoFocusBracketTopLeft: {
    position: "absolute",
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00f5ff",
    zIndex: 11,
  },
  holoFocusBracketTopRight: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00f5ff",
    zIndex: 11,
  },
  holoFocusBracketBottomLeft: {
    position: "absolute",
    bottom: -8,
    left: -8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00f5ff",
    zIndex: 11,
  },
  holoFocusBracketBottomRight: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00f5ff",
    zIndex: 11,
  },
  holoGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  holoGridLineH: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(0, 245, 255, 0.12)",
    position: "absolute",
  },
  holoGridLineV: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0, 245, 255, 0.12)",
    position: "absolute",
  },
  holoReticle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0, 245, 255, 0.5)",
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -14,
  },
  holoTelemetryHeader: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(8, 4, 21, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(0, 245, 255, 0.3)",
    zIndex: 12,
  },
  holoPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#39ff14",
  },
  holoTelemetryTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  holoTelemetryFooter: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(8, 4, 21, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0, 245, 255, 0.3)",
    zIndex: 12,
  },
  holoTelemetryText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 10.5,
    fontWeight: "500",
  },
  holoTelemetryStatus: {
    color: "#39ff14",
    fontSize: 10.5,
    fontWeight: "bold",
  },
  soundtrackVisualizerOverlay: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 4, 21, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00f5ff",
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
    zIndex: 99,
  },
  soundtrackVisualizerCover: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  soundtrackVisualizerText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "600",
  },
  musicWaveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 16,
  },
  musicWaveBar: {
    width: 2.5,
    height: 8,
    backgroundColor: "#00f5ff",
    borderRadius: 1.25,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  filterGridItem: {
    width: "47%",
    height: 80,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  filterGridItemActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.05)",
  },
  filterGridLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  backdropItem: {
    width: 90,
    marginRight: 12,
    alignItems: "center",
  },
  backdropItemActive: {
    borderColor: "#00f5ff",
  },
  backdropImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 6,
  },
  backdropLabel: {
    color: "#fff",
    fontSize: 11.5,
    textAlign: "center",
    fontWeight: "600",
  },
  strengthItemBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  strengthItemBtnActive: {
    backgroundColor: "#00f5ff",
  },
  strengthItemText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  teleprompterBox: {
    position: "absolute",
    top: 150,
    left: 80,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 14,
    zIndex: 10,
  },
  teleprompterHeader: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  teleprompterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderColor: "rgba(0,245,255,0.2)",
    paddingBottom: 6,
  },
  teleprompterLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  teleprompterHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10.5,
    fontStyle: "italic",
    marginLeft: "auto",
  },
  teleprompterScrollArea: {
    height: 80,
    overflow: "hidden",
  },
  teleprompterScrollText: {
    color: "#fff",
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: "500",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,245,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15.5,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  permissionBtn: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  permissionBtnText: {
    color: "#000",
    fontSize: 16.5,
    fontWeight: "bold",
  },
  permissionCancelBtn: {
    paddingVertical: 8,
  },
  permissionCancelText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15.5,
    fontWeight: "600",
  },
  collageSplitOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  collageGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  pipContainer: {
    position: "absolute",
    top: 100,
    right: 20,
    width: 90,
    height: 150,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#00f5ff",
    zIndex: 5,
    overflow: "hidden",
  },
  pipBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#00f5ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pipBadgeText: {
    color: "#000",
    fontSize: 9.5,
    fontWeight: "bold",
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  countdownTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14.5,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  countdownTimerText: {
    color: "#00f5ff",
    fontSize: 74,
    fontWeight: "bold",
  },
  countdownSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginTop: 20,
  },
  
  // Tagging & Share Studio
  shareStudioOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#080415",
    zIndex: 10000,
  },
  shareHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 56,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  shareHeaderTitle: {
    color: "#fff",
    fontSize: 17.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sharePublishBtn: {
    backgroundColor: "#00f5ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sharePublishBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  sharePublishText: {
    color: "#000",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  shareStudioContent: {
    padding: 24,
    paddingBottom: 80,
  },
  shareCaptionBlock: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  shareCaptionArt: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: "#111",
  },
  shareCaptionInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16.5,
    height: 80,
    textAlignVertical: "top",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 24,
  },
  shareSection: {
    gap: 12,
  },
  shareSectionTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  affiliateSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13.5,
    lineHeight: 16,
  },
  taggedProductCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    marginTop: 8,
  },
  taggedProductImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  taggedProductMaison: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  taggedProductTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  taggedProductPrice: {
    color: "#00f5ff",
    fontSize: 14.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  taggedProductRemoveBtn: {
    padding: 8,
  },
  taggedProductPrompt: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14.5,
    lineHeight: 18,
    marginTop: 4,
  },
  selectProdBtn: {
    width: 124,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
  },
  selectProdBtnActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.03)",
  },
  selectProdImg: {
    width: "100%",
    height: 84,
    borderRadius: 10,
  },
  selectProdText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
    marginTop: 8,
  },
  selectProdPrice: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4,
  },
  commissionLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    fontWeight: "600",
  },
  rateBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  rateBtnActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  rateText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  affiliateHandleInput: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15.5,
    marginTop: 8,
  },
  affLinkPreviewCard: {
    marginTop: 24,
    backgroundColor: "rgba(0,245,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.15)",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  affLinkPreviewTitle: {
    color: "#00f5ff",
    fontSize: 13.5,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  affLinkPreviewText: {
    color: "rgba(0,245,255,0.8)",
    fontSize: 15,
    fontFamily: "System",
  },
  
  // Custom Bottom Sheets Styles (Ellipsis & Comments)
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  optionsBottomSheetContent: {
    backgroundColor: "#0d0a21",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 8,
    paddingBottom: 32,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bottomSheetDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginVertical: 12,
  },
  optionsGroupContainer: {
    backgroundColor: "rgba(255,255,255,0.035)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionRowText: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "500",
  },
  optionDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 20,
  },
  commentsOverlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  commentsSheetContent: {
    backgroundColor: "#0d0a21",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  commentsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  commentsHeaderTitle: {
    color: "#fff",
    fontSize: 16.5,
    fontWeight: "bold",
  },
  commentsScroll: {
    flex: 1,
    marginTop: 12,
  },
  commentRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 10,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    color: "#000",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  commentUsername: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  commentBadge: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderWidth: 0.5,
    borderColor: "#00f5ff",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  commentTextContent: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14.5,
    lineHeight: 16,
  },
  commentTime: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    marginTop: 4,
  },
  commentsSeparator: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 10,
  },
  commentsInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0d0a21",
  },
  commentTextInput: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 14.5,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  commentPostBtnText: {
    color: "#00f5ff",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  shareSheetContent: {
    backgroundColor: "#0d0a21",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 8,
    paddingBottom: 32,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  shareSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  shareSearchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  shareSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  shareAddFriendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareContactsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 20,
  },
  shareContactsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shareContactCard: {
    alignItems: "center",
    width: 90,
  },
  shareContactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  shareContactName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  shareHorizontalDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 20,
  },
  shareActionsScroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  shareActionBtn: {
    alignItems: "center",
    width: 76,
    gap: 6,
  },
  shareActionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareActionLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  }
});

// ═══════════════════════════════════════════════════════════════
// 🏛️ SOVEREIGN ONBOARDING STYLES
// ═══════════════════════════════════════════════════════════════
const onboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  headerBlock: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 36,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "200",
    color: "#ffffff",
    letterSpacing: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 300,
  },
  pathsContainer: {
    gap: 14,
  },
  pathCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    gap: 14,
  },
  pathIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  pathTextBlock: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  pathDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 17,
  },
  formContainer: {
    gap: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  backBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  formSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 3,
  },
  toggleDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    maxWidth: 220,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: "#00f5ff",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tagChipActive: {
    backgroundColor: "rgba(167,139,250,0.15)",
    borderColor: "#a78bfa",
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  tagChipTextActive: {
    color: "#a78bfa",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#ffffff",
  },
  inputHint: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    marginTop: 2,
  },
  taxToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  taxOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  taxOptionActive: {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  taxOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },
  submitBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#080415",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});

const switcherStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  dismissTouchable: {
    flex: 1
  },
  panel: {
    backgroundColor: "#080415",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: 40,
    maxHeight: height * 0.7
  },
  notch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff"
  },
  profileList: {
    paddingHorizontal: 24,
    gap: 12
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 14,
    gap: 12
  },
  profileCardActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.02)"
  },
  profileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  profileTextBlock: {
    flex: 1
  },
  profileNameText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff"
  },
  profileUsernameText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2
  },
  uncheckDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)"
  },
  addProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
    padding: 14
  },
  addProfileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  addProfileBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00f5ff"
  },
  wizardSelectorRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 20
  },
  wizardSelectorCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 6
  },
  wizardSelectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)"
  }
});

const activityStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  dismissTouchable: {
    flex: 1
  },
  panel: {
    backgroundColor: "rgba(13,10,33,0.96)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: 40,
    maxHeight: height * 0.8
  },
  notch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5
  },
  notificationList: {
    paddingHorizontal: 20,
    gap: 12
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 12,
    gap: 12
  },
  cardUnread: {
    borderColor: "rgba(0,245,255,0.15)",
    backgroundColor: "rgba(0,245,255,0.03)"
  },
  avatarWrapper: {
    position: "relative"
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  badgeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#0d0a21"
  },
  contentBlock: {
    flex: 1,
    gap: 4
  },
  messageText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18
  },
  senderUsername: {
    fontWeight: "bold",
    color: "#fff"
  },
  timeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)"
  },
  tag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2
  },
  tagText: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  actionButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  actionButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600"
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 16
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)"
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff"
  },
  emptySubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 18
  },
  backBtn: {
    padding: 4
  },
  headerTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  headerRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
    marginLeft: 4,
    marginTop: -4
  },
  adsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    gap: 12
  },
  adsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,245,255,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  adsTextContainer: {
    flex: 1,
    gap: 2
  },
  adsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff"
  },
  adsSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)"
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  sectionBlock: {
    gap: 8,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 4
  }
});


