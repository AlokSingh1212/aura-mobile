import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animated } from "react-native";
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
  Image,
  ScrollView,
  Modal,
  Linking
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode, Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";

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

const CHAT_THREADS = [
  { id: "c1", name: "Updates 📢", message: "Raghav Juyal sent a reel by vaibha... • 3h", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100", unread: true, category: "Primary" },
  { id: "c2", name: "Namita Thapar", message: "Sent 7h ago", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100", verified: true, category: "From ads" },
  { id: "c3", name: "vidmikai", message: "Sent 7h ago", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100", category: "Requests" },
  { id: "c4", name: "Advocate Priyanka Singh", message: "Sent a reel by bhukkadesi99 • 2d", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100", category: "General" },
  { id: "c5", name: "riyabangia_", message: "Sent Monday", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=100", category: "Primary" }
];

const CUSTOMER_THREADS = [
  { id: "ct1", name: "Priya Mehta", message: "Is the silk scarf still available?", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100", tag: "Order Enquiry", unread: true },
  { id: "ct2", name: "Rohan Kapoor", message: "Can I get a custom size for order #4821?", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100", tag: "Custom Request" },
  { id: "ct3", name: "Ananya Sharma", message: "Loved the jacket! When does restock happen?", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100", tag: "Restock", unread: true },
  { id: "ct4", name: "Vikram Nair", message: "Tracking update for my order?", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100", tag: "Shipping" },
  { id: "ct5", name: "Meera Joshi", message: "Thank you! The packaging was stunning 🙏", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=100", tag: "Feedback" },
];

const BUSINESS_STATS = [
  { label: "Orders Today", value: "12", icon: "bag-outline", color: "#00f5ff" },
  { label: "Revenue", value: "₹48.2K", icon: "cash-outline", color: "#a78bfa" },
  { label: "Enquiries", value: "7", icon: "chatbubble-outline", color: "#fb923c" },
  { label: "Store Views", value: "1.4K", icon: "eye-outline", color: "#34d399" },
];

const BUSINESS_TOOLS = [
  { id: "broadcast", label: "Broadcast", icon: "megaphone-outline", color: "#00f5ff", desc: "Message all followers" },
  { id: "promotions", label: "Promotions", icon: "pricetag-outline", color: "#fb923c", desc: "Discounts & offers" },
  { id: "ads", label: "Ads Manager", icon: "bar-chart-outline", color: "#a78bfa", desc: "Campaigns & spend" },
  { id: "catalogue", label: "Catalogue", icon: "grid-outline", color: "#34d399", desc: "Your listings" },
  { id: "autoreply", label: "Auto-Reply", icon: "flash-outline", color: "#f472b6", desc: "Automated messages" },
  { id: "inbox", label: "Customer Inbox", icon: "people-outline", color: "#fbbf24", desc: "Order enquiries" },
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

export default function ReelsScreen() {
  const { products, stories, loadingFeed, fetchFeed, fetchProducts, triggerHaptic, activeMaisonId, currentUser, authOnboard, setCurrentUser, activeProfile, userProfiles, createNewProfile, switchActiveProfile, fetchProfiles, notifications, loadingNotifications, fetchNotifications, markNotificationsRead } = useStore();
  const currentMaisonName = activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
  const params = useLocalSearchParams<{ openDMs?: string; openSearch?: string; activeTab?: string; openCamera?: string }>();
  const insets = useSafeAreaInsets();
  const bottomBarHeight = 52 + insets.bottom;
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 200); // 200ms safety margin for Expo Router mounting
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  useEffect(() => {
    if (params?.openDMs === "true") {
      setShowDMs(true);
    }
    if (params?.openSearch === "true") {
      setShowExploreGrid(true);
    }
    if (params?.activeTab === "reels") {
      setActiveFeedTab("reels");
      setIsReelsFullScreen(true);
    }
    if (params?.openCamera === "true") {
      setShowReelCamera(true);
    }
  }, [params]);
  const [showDMs, setShowDMs] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const [activeDmFilter, setActiveDmFilter] = useState("Primary");
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [isSeller, setIsSeller] = useState(false);
  const [activeBusinessTool, setActiveBusinessTool] = useState<string | null>(null);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [autoReplyText, setAutoReplyText] = useState("Thanks for reaching out to Rare Raven! We'll respond within 24 hours.");
  // Live data from API (fall back to mock constants if unavailable)
  const [liveBusinessStats, setLiveBusinessStats] = useState(BUSINESS_STATS);
  const [livePromos, setLivePromos] = useState<any[]>([]);
  const [liveAds, setLiveAds] = useState<any[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("");
  const [showNewPromoForm, setShowNewPromoForm] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [loadingChats, setLoadingChats] = useState(false);

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
  const [chatReplyText, setChatReplyText] = useState("");
  const [showExploreGrid, setShowExploreGrid] = useState(false);
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
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

  // New Tab switch states: "grid" | "reels" | "live" | "posts"
  const [activeFeedTab, setActiveFeedTab] = useState<"grid" | "reels" | "live" | "posts">("posts");
  
  // Sound states and reels camera overlay states
  const [feedMuted, setFeedMuted] = useState(true);
  const [showReelCamera, setShowReelCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Camera permission and audio play handler states
  const [permission, requestPermission] = useCameraPermissions();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const playTrack = async (url: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      if (!url) return;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      
      soundRef.current = sound;
      setIsPlayingAudio(true);
    } catch (e) {
      console.warn("Error playing audio track:", e);
    }
  };

  const stopTrack = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlayingAudio(false);
    } catch (e) {
      console.warn("Error stopping audio track:", e);
    }
  };

  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.warn("Failed to natively configure Audio Mode for CameraView overlay:", err);
      }
    };
    if (showReelCamera) {
      setupAudioMode();
    }
  }, [showReelCamera]);

  // Advanced Reels Creator & Affiliate Tagging States
  const [localReels, setLocalReels] = useState<any[]>([]);
  const { instaStories: activeInstaStories, addInstaStorySlide } = useStore();
  const [selectedAudio, setSelectedAudio] = useState<any>({
    title: "Phoolon Ka Taron Ka (Bespoke Mix)",
    artist: "Vedang Raina x A.R. Rahman",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=80",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    category: "bollywood"
  });
  const [audioSearchQuery, setAudioSearchQuery] = useState("");
  const [activeAudioCategory, setActiveAudioCategory] = useState<"all" | "trending" | "pop" | "bollywood" | "hiphop" | "electronic">("all");
  const [activeFilter, setActiveFilter] = useState<"none" | "platinum" | "neon" | "obsidian">("none");
  const [selectedLength, setSelectedLength] = useState<15 | 30 | 60 | 90>(60);

  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState("AURA Obsidian Gold Vestment coordinate sync...\nDesigned in Milano.\nLimited run of 50 pieces active.\n\nCrafted for the discerning few who understand that fashion is not just clothing — it is armour.\n\nAURA. Wear the future.");
  const teleprompterScrollY = useRef(new Animated.Value(0)).current;
  const teleprompterAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Auto-scroll teleprompter when recording starts, stop when recording ends
  useEffect(() => {
    if (isRecording && showTeleprompter) {
      teleprompterScrollY.setValue(0);
      teleprompterAnimRef.current = Animated.timing(teleprompterScrollY, {
        toValue: -400,
        duration: selectedLength * 1000,
        useNativeDriver: true,
      });
      teleprompterAnimRef.current.start();
    } else {
      teleprompterAnimRef.current?.stop();
      teleprompterScrollY.setValue(0);
    }
  }, [isRecording, showTeleprompter]);
  const [touchUpStrength, setTouchUpStrength] = useState(70);
  
  // Sub-drawers in camera
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const [showRetouchSlider, setShowRetouchSlider] = useState(false);
  const [showFlashDrawer, setShowFlashDrawer] = useState(false);
  
  // Post-record Share Studio states
  const [showShareStudio, setShowShareStudio] = useState(false);
  const [taggedProduct, setTaggedProduct] = useState<any>(null);
  const [affiliateCommission, setAffiliateCommission] = useState(10); // 10%
  const [affiliateHandle, setAffiliateHandle] = useState("");
  const [reelCaption, setReelCaption] = useState("");
  
  // 🚀 Hyper-Advanced Instagram Camera Option States
  const [flashMode, setFlashMode] = useState<"off" | "on" | "auto">("off");
  const [recordingSpeed, setRecordingSpeed] = useState<0.3 | 0.5 | 1 | 2 | 3>(1);
  const [showSpeedDrawer, setShowSpeedDrawer] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState<3 | 10>(3);
  const [showCountdownDrawer, setShowCountdownDrawer] = useState(false);
  const [activeCountdown, setActiveCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [alignGhostActive, setAlignGhostActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [videoLayoutMode, setVideoLayoutMode] = useState<"single" | "split" | "grid" | "triptych">("single");
  const [showLayoutDrawer, setShowLayoutDrawer] = useState(false);

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

  // Comments, Saves, and Options Bottom Sheet states
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState<any>(null);
  const [showThreeDotsModal, setShowThreeDotsModal] = useState(false);
  const [threeDotsTargetPost, setThreeDotsTargetPost] = useState<any>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsTargetPost, setCommentsTargetPost] = useState<any>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [postComments, setPostComments] = useState<Record<string, any[]>>({
    s1: [
      { id: "1", username: "julian_rossi", text: "Stunning! The liquid metal design flows so naturally.", time: "2h" },
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

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const res = await fetch(`https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/chat?userId=user_2pk5xskr&maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success && data.conversations.length > 0) {
        const mapped = data.conversations.map((c: any, index: number) => {
          let category = "Primary";
          if (c.name.toLowerCase().includes("namita") || index % 4 === 1) {
            category = "From ads";
          } else if (c.name.toLowerCase().includes("mikai") || index % 4 === 2) {
            category = "Requests";
          } else if (index % 4 === 3) {
            category = "General";
          }
          return { ...c, category };
        });
        setConversations(mapped);
      } else {
        setConversations(CHAT_THREADS);
      }
    } catch (e) {
      setConversations(CHAT_THREADS);
    } finally {
      setLoadingChats(false);
    }
  };

  // ── Business Hub API fetchers ──
  const fetchBusinessStats = async () => {
    try {
      const res = await fetch(`https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/business-stats?maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success && data.stats) {
        setLiveBusinessStats([
          { label: "Orders Today", value: String(data.stats.ordersToday), icon: "bag-outline", color: "#00f5ff" },
          { label: "Revenue", value: `₹${(data.stats.revenueToday / 1000).toFixed(1)}K`, icon: "cash-outline", color: "#a78bfa" },
          { label: "Enquiries", value: String(data.stats.openEnquiries), icon: "chatbubble-outline", color: "#fb923c" },
          { label: "Store Views", value: data.stats.storeViewsToday >= 1000 ? `${(data.stats.storeViewsToday / 1000).toFixed(1)}K` : String(data.stats.storeViewsToday), icon: "eye-outline", color: "#34d399" },
        ]);
      }
    } catch {
      // keep BUSINESS_STATS fallback
    }
  };

  const fetchPromotions = async () => {
    setLoadingPromos(true);
    try {
      const res = await fetch(`https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/promotions?maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success && data.promos?.length > 0) {
        setLivePromos(data.promos);
      }
    } catch {
      // keep mock fallback
    } finally {
      setLoadingPromos(false);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch(`https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/broadcast?maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success) setLiveBroadcasts(data.broadcasts || []);
    } catch { /* fallback */ }
  };

  const fetchAds = async () => {
    try {
      const res = await fetch(`https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/ads?maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success && data.metrics?.bids?.length > 0) {
        setLiveAds(data.metrics.bids.map((b: any) => ({
          name: b.keyword || "Campaign",
          spend: `₹${Math.round(b.spent).toLocaleString()}`,
          reach: b.impressions >= 1000 ? `${(b.impressions / 1000).toFixed(1)}K` : String(b.impressions),
          clicks: b.clicks >= 1000 ? `${(b.clicks / 1000).toFixed(1)}K` : String(b.clicks),
          status: b.status === "ACTIVE" ? "Live" : "Paused",
        })));
      }
    } catch { /* fallback */ }
  };

  const sendBroadcast = async (title: string, content: string) => {
    try {
      const res = await fetch("https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maisonId: activeMaisonId, title, content, audience: "ALL", type: "TEXT" }),
      });
      const data = await res.json();
      return data.success;
    } catch { return false; }
  };

  const createPromo = async (code: string, discount: number, type: string) => {
    try {
      const res = await fetch("https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maisonId: activeMaisonId, code, discount, type }),
      });
      const data = await res.json();
      if (data.success) { fetchPromotions(); return true; }
      return false;
    } catch { return false; }
  };

  // ── Auto-Reply API ──
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState("Thanks for reaching out! We'll respond shortly.");
  const [awayMessage, setAwayMessage] = useState("We're currently away. We'll get back to you within 24 hours.");
  const [quietHoursStart, setQuietHoursStart] = useState("");
  const [quietHoursEnd, setQuietHoursEnd] = useState("");
  const [loadingAutoReply, setLoadingAutoReply] = useState(false);
  const [autoReplySaved, setAutoReplySaved] = useState(false);

  const fetchAutoReply = async () => {
    setLoadingAutoReply(true);
    try {
      const res = await fetch(`https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/auto-reply?maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success && data.config) {
        setAutoReplyEnabled(data.config.enabled);
        setGreetingMessage(data.config.greetingMessage);
        setAwayMessage(data.config.awayMessage);
        if (data.config.quietHoursStart != null) setQuietHoursStart(String(data.config.quietHoursStart));
        if (data.config.quietHoursEnd != null) setQuietHoursEnd(String(data.config.quietHoursEnd));
      }
    } catch { /* use defaults */ }
    finally { setLoadingAutoReply(false); }
  };

  const saveAutoReply = async () => {
    try {
      const res = await fetch("https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/auto-reply", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maisonId: activeMaisonId,
          enabled: autoReplyEnabled,
          greetingMessage,
          awayMessage,
          quietHoursStart: quietHoursStart ? parseInt(quietHoursStart) : null,
          quietHoursEnd: quietHoursEnd ? parseInt(quietHoursEnd) : null,
        }),
      });
      const data = await res.json();
      return data.success;
    } catch { return false; }
  };

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
        setSelectedMediaUri(result.assets[0].uri);
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
      const res = await fetch("https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: isSeller ? activeMaisonId : "user_2pk5xskr",
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

  useEffect(() => {
    if (showDMs) {
      fetchChats();
    }
  }, [showDMs]);

  const handleSendChatMessage = async () => {
    if (!chatReplyText.trim() || !activeChat) return;
    triggerHaptic("medium");
    const textToSend = chatReplyText;
    setChatReplyText("");

    const currentSenderName = isSeller ? (activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()))) : "Alok Singh";

    const tempMessage = {
      id: `m_${Date.now()}`,
      content: textToSend,
      senderId: isSeller ? activeMaisonId : "user_2pk5xskr",
      senderName: currentSenderName,
      createdAt: new Date().toISOString(),
      isAdmin: isSeller
    };

    setActiveChat((prev: any) => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage],
      lastMessage: textToSend
    }));

    setConversations(prev => prev.map(c => c.id === activeChat.id ? {
      ...c,
      messages: [...(c.messages || []), tempMessage],
      lastMessage: textToSend
    } : c));

    try {
      const res = await fetch("https://07279b986c9bc954-106-219-121-7.serveousercontent.com/api/mobile/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeChat.id,
          senderId: isSeller ? activeMaisonId : "user_2pk5xskr",
          senderName: currentSenderName,
          content: textToSend,
          type: activeChat.type || "MAISON",
          isAdmin: isSeller
        })
      });
      const data = await res.json();
      if (data.success) {
        const realMsg = data.message;
        setActiveChat((prev: any) => ({
          ...prev,
          messages: prev.messages.map((m: any) => m.id === tempMessage.id ? realMsg : m)
        }));
      }
    } catch (e) {
      console.warn("Could not sync message to server.", e);
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

  // Story slide viewer ticks
  useEffect(() => {
    let storyTimer: any;
    if (selectedStoriesGroup) {
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
  }, [selectedStoriesGroup, activeSlideIndex]);

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
  }, []);

  const handleLikePress = (id: string) => {
    triggerHaptic("heavy");
    setLikedReels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = (item: any) => {
    triggerHaptic("medium");
    setShareTargetPost(item);
    setShowShareSheet(true);
  };

  const reelHeight = (isReelsFullScreen && activeFeedTab === "reels") 
    ? (height - (52 + insets.bottom)) 
    : (height - insets.top - 210);

  const floatingBottomOffset = isReelsFullScreen ? 65 : 20;

  const renderReelItem = ({ item, index }: { item: any; index: number }) => {
    const isPlayed = index === activeStoryIndex && !showDMs && activeFeedTab === "reels";
    const mockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4";
    const videoUrl = item.url && item.url.endsWith(".mp4") ? item.url : mockVideoUrl;
    const isLiked = likedReels[item.id] || false;

    return (
      <View style={[styles.reelContainer, { height: reelHeight }]}>
        {/* Fullscreen Video Loops */}
        <Video
          source={{ uri: videoUrl }}
          rate={1.0}
          volume={1.0}
          isMuted={feedMuted}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlayed}
          isLooping
          style={StyleSheet.absoluteFillObject}
        />

        {/* DYNAMIC SHADER OVERLAYS SYNCED FROM THE CAMERA STUDIO */}
        {item.filterApplied === "platinum" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.08)", zIndex: 1 }]} />
        )}
        {item.filterApplied === "neon" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 3, borderColor: "#00f5ff", backgroundColor: "rgba(0,245,255,0.04)", zIndex: 1 }]} />
        )}
        {item.filterApplied === "obsidian" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(8,4,21,0.45)", zIndex: 1 }]} />
        )}

        {/* Dynamic Touch Up simulated glow overlay */}
        {item.touchUpApplied > 0 && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.02)", opacity: item.touchUpApplied / 100, zIndex: 1 }]} />
        )}

        <View style={styles.gradientOverlay} />

        {/* Floating Shoppable Card */}
        {(() => {
          const associatedProduct = item.artifact || products.find((p: any) => p.id === item.artifactId);
          if (!associatedProduct) return null;
          return (
            <TouchableOpacity 
              style={styles.shoppableCard}
              activeOpacity={0.9}
              onPress={() => {
                triggerHaptic("medium");
                router.push(`/product/${associatedProduct.id}` as any);
              }}
            >
              <View style={styles.shopIconContainer}>
                <Lucide name="sparkles" size={15} color="#000" />
              </View>
              <View style={styles.shopInfo}>
                <Text style={styles.shopSub}>Shop The Look</Text>
                <Text style={styles.shopTitle} numberOfLines={1}>{associatedProduct.title}</Text>
                <Text style={styles.shopPrice}>₹{associatedProduct.price?.toLocaleString()}</Text>
              </View>
              <Lucide name="chevron-forward" size={17} color="#00f5ff" />
            </TouchableOpacity>
          );
        })()}

        {/* Creator Metadata Overlay (Bottom Left) */}
        <View style={[styles.metaContainer, { bottom: floatingBottomOffset }]}>
          <View style={styles.creatorRow}>
            <TouchableOpacity onPress={() => handleMaisonProfilePress(item)} activeOpacity={0.85}>
              <View style={styles.avatar}>
                <Text style={styles.avatarChar}>
                  {item.user?.name?.[0]?.toUpperCase() || "S"}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.creatorDetails}>
              <View style={styles.nameFollowRow}>
                <TouchableOpacity 
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={() => handleMaisonProfilePress(item)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.creatorName} numberOfLines={1}>
                    {item.user?.name?.toLowerCase().replace(/\s+/g, "") || "veen.verma"}
                  </Text>
                  <Text style={styles.saptashiText}>and saptashi...</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.followBtn} onPress={() => triggerHaptic("medium")}>
                  <Text style={styles.followBtnText}>Follow</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.audioTrackText} numberOfLines={1}>
                ↗ {item.audioTrack ? `${item.audioTrack.title} • ${item.audioTrack.artist}` : (item.location ? `A.R. Rahman, Vedang Raina • ${item.location}` : "AURA Luxury Runway Vol. 4")}
              </Text>
            </View>
          </View>
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption || "Atelier Masterpiece"}
          </Text>
        </View>

        {/* Right Interaction Column (Likes, Comments, Share) */}
        <View style={[styles.interactionColumn, { bottom: floatingBottomOffset }]}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleLikePress(item.id)}>
            <View style={styles.iconCircle}>
              <Lucide name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ff3b30" : "#fff"} />
            </View>
            <Text style={styles.iconLabel}>{item.likesCount ? (isLiked ? item.likesCount + 1 : item.likesCount) : 412}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleCommentsPress(item)}>
            <View style={styles.iconCircle}>
              <Lucide name="chatbubble-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.iconLabel}>{item.comments?.length || 18}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleShare(item)}>
            <View style={styles.iconCircle}>
              <Lucide name="paper-plane-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.iconLabel}>Share</Text>
          </TouchableOpacity>

          {(() => {
            const isSaved = savedPosts[item.id] || false;
            return (
              <TouchableOpacity style={styles.iconButton} onPress={() => handleSavePress(item.id)}>
                <View style={styles.iconCircle}>
                  <Lucide name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#00f5ff" : "#fff"} />
                </View>
                <Text style={styles.iconLabel}>Save</Text>
              </TouchableOpacity>
            );
          })()}

          <TouchableOpacity style={styles.iconButton} onPress={() => handleThreeDotsPress(item)}>
            <View style={styles.iconCircle}>
              <Lucide name="ellipsis-vertical" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
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

  const displayStories = [
    ...localReels,
    ...(stories.length > 0 ? stories : simulatedStories)
  ];

  // Synchronized real-time soundtrack player for active feeds
  const feedSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const syncFeedAudio = async () => {
      try {
        // Unload any existing feed sound
        if (feedSoundRef.current) {
          await feedSoundRef.current.unloadAsync();
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
            const { sound } = await Audio.Sound.createAsync(
              { uri: activeItem.audioTrack.url },
              { shouldPlay: true, isLooping: true, volume: 1.0 }
            );
            feedSoundRef.current = sound;
          }
        }
      } catch (error) {
        console.warn("Error syncing feed soundtrack playback:", error);
      }
    };

    syncFeedAudio();

    return () => {
      if (feedSoundRef.current) {
        feedSoundRef.current.unloadAsync();
      }
    };
  }, [activeStoryIndex, activeFeedTab, feedMuted, showReelCamera, displayStories]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveStoryIndex(viewableItems[0].index || 0);
      triggerHaptic("light");
    }
  }).current;

  const handleScroll = (event: any) => {
    // Persistent header - disabled collapsing to prevent layout shifts during scroll
  };

    const unreadNotificationsCount = notifications ? notifications.filter((n: any) => !n.read).length : 0;

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeAreaContainer} edges={["top"]}>
          
          {/* 🏔️ TOP HEADER ROW */}
          {!(isReelsFullScreen && activeFeedTab === "reels") && (
            <View style={styles.instaHeader}>
              <TouchableOpacity onPress={handleSelectMedia}>
                <Lucide name="add-outline" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => { triggerHaptic("medium"); setShowProfileSwitcher(true); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={styles.instaLogoText}>
                  {activeProfile ? `@${activeProfile.username}`.toUpperCase() : "A U R A"}
                </Text>
                <Lucide name="chevron-down" size={14} color="#00f5ff" style={{ marginTop: 2 }} />
              </TouchableOpacity>
  
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
                    <Lucide name="heart-outline" size={26} color="#fff" style={styles.headerIcon} />
                    {unreadNotificationsCount > 0 && (
                      <View style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#00f5ff",
                        borderWidth: 1.5,
                        borderColor: "#080415"
                      }} />
                    )}
                  </View>
                </TouchableOpacity>
              <TouchableOpacity onPress={() => { triggerHaptic("medium"); router.push("/cart"); }}>
                <View style={styles.dmIconWrapper}>
                  <Lucide name="cart-outline" size={26} color="#fff" />
                  <View style={styles.redDotNotification} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 🔴 TOP HORIZONTAL STORIES ROW */}
        {!(isReelsFullScreen && activeFeedTab === "reels") && (
          <View style={styles.storiesBubbleContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
              {activeInstaStories.map((story) => (
                <TouchableOpacity 
                  key={story.id} 
                  style={styles.storyBubbleItem}
                  onPress={() => {
                    triggerHaptic("medium");
                    setSelectedStoriesGroup(story);
                    setActiveSlideIndex(0);
                    setStoryProgress(0);
                  }}
                >
                  {story.active ? (
                    <LinearGradient
                      colors={["#fb923c", "#d946ef", "#8b5cf6"]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        width: 66, height: 66, borderRadius: 33,
                        justifyContent: "center", alignItems: "center",
                      }}
                    >
                      <View style={{
                        width: 60, height: 60, borderRadius: 30,
                        backgroundColor: "#080415",
                        justifyContent: "center",
                        alignItems: "center",
                      }}>
                        <Image source={{ uri: story.avatar }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.avatarWrapper}>
                      <Image source={{ uri: story.avatar }} style={styles.storyAvatarImg} />
                      {story.isYourStory && (
                        <View style={styles.yourStoryPlusBadge}>
                          <Lucide name="add-circle" size={19} color="#00f5ff" />
                        </View>
                      )}
                    </View>
                  )}
                  <Text style={styles.storyUsername} numberOfLines={1}>{story.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 📺 SWITCH MAIN FEED CONTENT */}
        <View style={styles.feedWrapper}>
          
          {/* REELS TABS */}
          {activeFeedTab === "reels" ? (
            loadingFeed ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00f5ff" />
              </View>
            ) : (
              <View style={{ flex: 1, position: "relative" }}>
                <FlatList
                  data={displayStories}
                  renderItem={renderReelItem}
                  keyExtractor={(item) => item.id}
                  pagingEnabled
                  snapToInterval={reelHeight}
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={{ itemVisiblePercentThreshold: 75 }}
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
            /* DEFAULT: UNIFIED POSTS FEED (Serving as the Homepage Instagram Main Feed!) */
            <FlatList
              data={displayStories}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 52 + insets.bottom + 40 }}
              renderItem={({ item }) => {
                const img = item.url || item.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
                const isLiked = likedReels[item.id] || false;
                const mockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-a-dress-41801-large.mp4";
                const videoUrl = item.url && item.url.endsWith(".mp4") ? item.url : mockVideoUrl;

                return (
                  <View style={styles.photoCard}>
                    <View style={styles.photoCardHeader}>
                      <TouchableOpacity 
                        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                        onPress={() => handleMaisonProfilePress(item)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.photoCardAvatar}>
                          <Text style={{ color: "#000", fontSize: 13, fontWeight: "bold" }}>
                            {item.user?.name === "Alok Maison" ? currentMaisonName[0]?.toUpperCase() : (item.user?.name?.[0]?.toUpperCase() || "S")}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.photoCardAuthor}>
                            {item.user?.name === "Alok Maison" ? currentMaisonName : (item.user?.name || "Gucci Atelier")}
                          </Text>
                          <Text style={styles.photoCardSubtitle}>Quiet Luxury Node</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleThreeDotsPress(item)}>
                        <Lucide name="ellipsis-horizontal" size={19} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>

                    {item.isVideo ? (
                      <View style={{ position: "relative" }}>
                        <Video
                          source={{ uri: videoUrl }}
                          rate={1.0}
                          volume={1.0}
                          isMuted={feedMuted}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={true}
                          isLooping
                          style={styles.photoCardImage}
                        />
                        <TouchableOpacity 
                          style={styles.feedVolumeBtn} 
                          onPress={() => {
                            triggerHaptic("light");
                            setFeedMuted(!feedMuted);
                          }}
                        >
                          <Lucide name={feedMuted ? "volume-mute" : "volume-high"} size={19} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Image source={{ uri: img }} style={styles.photoCardImage} />
                    )}

                    <View style={styles.photoCardActions}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                        <TouchableOpacity onPress={() => handleLikePress(item.id)}>
                          <Lucide name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ff3b30" : "#fff"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleCommentsPress(item)}>
                          <Lucide name="chatbubble-outline" size={23} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleShare(item)}>
                          <Lucide name="paper-plane-outline" size={23} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      {(() => {
                        const isSaved = savedPosts[item.id] || false;
                        return (
                          <TouchableOpacity onPress={() => handleSavePress(item.id)}>
                            <Lucide name={isSaved ? "bookmark" : "bookmark-outline"} size={23} color={isSaved ? "#00f5ff" : "#fff"} />
                          </TouchableOpacity>
                        );
                      })()}
                    </View>

                    <Text style={styles.photoCardLikes}>{item.likesCount ? (isLiked ? item.likesCount + 1 : item.likesCount) : 104} likes</Text>
                    <Text style={styles.photoCardCaption}>
                      <Text style={{ fontWeight: "bold" }}>{item.user?.name?.toLowerCase().replace(/\s+/g, "") || "gucci"} </Text>
                      {item.caption || "Atelier Masterpiece Collection."}
                    </Text>
                  </View>
                );
              }}
            />
          )}

        </View>

      </SafeAreaView>

      {/* 📥 DYNAMIC DIRECT MESSAGES SLIDE-UP MODAL PANEL */}
      {showDMs && (
        <View style={[styles.dmSlidePanel, { bottom: bottomBarHeight }]}>
          <SafeAreaView style={styles.dmSafeArea}>
            {/* DM Top Bar */}
            <View style={styles.dmHeaderRow}>
              <TouchableOpacity onPress={() => setShowDMs(false)}>
                <Lucide name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dmTitleRow} 
                onPress={() => {
                  triggerHaptic("light");
                  const next = !isSeller;
                  setIsSeller(next);
                  setActiveBusinessTool(null);
                  if (next) {
                    fetchBusinessStats();
                    fetchPromotions();
                    fetchAds();
                    fetchBroadcasts();
                    fetchAutoReply();
                  }
                }}
              >
                <Text style={styles.dmTitleText}>{isSeller ? (activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()))) : "Alok Singh"}</Text>
                <Lucide name="chevron-down" size={17} color="#fff" />
                <View style={styles.dmTitleRedDot} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => triggerHaptic("medium")}>
                <Lucide name="create-outline" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* DM Search input */}
            <View style={styles.dmSearchContainer}>
              <Lucide name="search" size={21} color="rgba(255,255,255,0.4)" style={styles.dmSearchIcon} />
              <TextInput
                style={styles.dmSearchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={dmSearch}
                onChangeText={setDmSearch}
              />
            </View>

            {/* ─────────────────────────────────────────────
                PERSONAL MODE — Stories + Filters + Threads
            ───────────────────────────────────────────── */}
            {!isSeller && (
              <>
                {/* Stories row */}
                <View style={{ height: 92, marginBottom: 4 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 14, alignItems: "center", gap: 16 }}
                    style={{ flex: 1 }}
                  >
                    {activeInstaStories.map((story) => (
                      <TouchableOpacity
                        key={story.id}
                        style={{ alignItems: "center", gap: 5 }}
                        onPress={() => {
                          triggerHaptic("medium");
                          setSelectedStoriesGroup(story);
                          setActiveSlideIndex(0);
                          setStoryProgress(0);
                        }}
                        activeOpacity={0.75}
                      >
                        {story.active ? (
                          <LinearGradient
                            colors={["#fb923c", "#d946ef", "#8b5cf6"]}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              width: 60, height: 60, borderRadius: 30,
                              justifyContent: "center", alignItems: "center",
                            }}
                          >
                            <View style={{
                              width: 54, height: 54, borderRadius: 27,
                              backgroundColor: "#080415",
                              justifyContent: "center",
                              alignItems: "center",
                            }}>
                              <Image source={{ uri: story.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                            </View>
                          </LinearGradient>
                        ) : (
                          <View style={{
                            width: 58, height: 58, borderRadius: 29,
                            borderWidth: story.isYourStory ? 1.5 : 1,
                            borderColor: story.isYourStory ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
                            padding: 2,
                            backgroundColor: "#080415",
                            position: "relative",
                            justifyContent: "center",
                            alignItems: "center"
                          }}>
                            <Image source={{ uri: story.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                            {story.isYourStory && (
                              <View style={{
                                position: "absolute", bottom: -1, right: -1,
                                width: 18, height: 18, borderRadius: 9,
                                backgroundColor: "#00f5ff",
                                alignItems: "center", justifyContent: "center",
                                borderWidth: 1.5, borderColor: "#080415",
                              }}>
                                <Lucide name="add" size={12} color="#000" />
                              </View>
                            )}
                          </View>
                        )}
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, maxWidth: 58, textAlign: "center" }} numberOfLines={1}>
                          {story.isYourStory ? "Your story" : story.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Filter tabs */}
                <View style={styles.dmFilterStrip}>
                  {["Primary", "From ads", "Requests", "General"].map((filt) => {
                    const isAct = activeDmFilter === filt;
                    return (
                      <TouchableOpacity
                        key={filt}
                        style={[styles.dmFilterTab, isAct && styles.dmFilterTabActive]}
                        onPress={() => { triggerHaptic("light"); setActiveDmFilter(filt); }}
                      >
                        <Text style={[styles.dmFilterText, isAct && styles.dmFilterTextActive]}>{filt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Thread list */}
                {loadingChats ? (
                  <ActivityIndicator size="small" color="#00f5ff" style={{ marginTop: 24 }} />
                ) : (
                  <ScrollView style={styles.dmThreadsScroll} showsVerticalScrollIndicator={false}>
                    {conversations
                      .filter(t => t.name.toLowerCase().includes(dmSearch.toLowerCase()))
                      .filter(t => (t.category || "Primary") === activeDmFilter)
                      .map((thread) => (
                      <TouchableOpacity
                        key={thread.id}
                        style={styles.threadItemRow}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                      >
                        <Image source={{ uri: thread.avatar }} style={styles.threadAvatar} />
                        <View style={styles.threadDetails}>
                          <View style={styles.threadNameRow}>
                            <Text style={styles.threadNameText}>{thread.name}</Text>
                            {thread.verified && (
                              <Lucide name="checkmark-circle" size={17} color="#0095f6" style={styles.verifiedCheck} />
                            )}
                          </View>
                          <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                            {thread.lastMessage || "Secure direct message sync handshake established."}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.cameraIconBtn}>
                          <Lucide name="camera-outline" size={26} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* ─────────────────────────────────────────────
                SELLER / MAISON MODE — Business Hub
            ───────────────────────────────────────────── */}
            {isSeller && (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                {/* ── Quick Stats Bar ── */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}
                >
                  {liveBusinessStats.map((stat) => (
                    <View key={stat.label} style={styles.bizStatCard}>
                      <Lucide name={stat.icon as any} size={23} color={stat.color} />
                      <Text style={[styles.bizStatValue, { color: stat.color }]}>{stat.value}</Text>
                      <Text style={styles.bizStatLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </ScrollView>

                {/* ── Business Tools Grid ── */}
                {!activeBusinessTool && (
                  <>
                    <Text style={styles.bizSectionLabel}>Business Tools</Text>
                    <View style={styles.bizToolsGrid}>
                      {BUSINESS_TOOLS.map((tool) => (
                        <TouchableOpacity
                          key={tool.id}
                          style={styles.bizToolCard}
                          onPress={() => { triggerHaptic("medium"); setActiveBusinessTool(tool.id); setBroadcastSent(false); }}
                          activeOpacity={0.75}
                        >
                          <View style={[styles.bizToolIconWrap, { backgroundColor: tool.color + "22" }]}>
                            <Lucide name={tool.icon as any} size={26} color={tool.color} />
                          </View>
                          <Text style={styles.bizToolName}>{tool.label}</Text>
                          <Text style={styles.bizToolDesc}>{tool.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* ── Customer Enquiries ── */}
                    <Text style={styles.bizSectionLabel}>Customer Enquiries</Text>
                    {CUSTOMER_THREADS.filter(t => t.name.toLowerCase().includes(dmSearch.toLowerCase())).map((thread) => (
                      <TouchableOpacity
                        key={thread.id}
                        style={[styles.threadItemRow, { marginHorizontal: 16 }]}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                        activeOpacity={0.75}
                      >
                        <Image source={{ uri: thread.avatar }} style={styles.threadAvatar} />
                        <View style={styles.threadDetails}>
                          <View style={styles.threadNameRow}>
                            <Text style={styles.threadNameText}>{thread.name}</Text>
                            <View style={[styles.bizTagBadge, { backgroundColor: thread.unread ? "#00f5ff22" : "#ffffff11" }]}>
                              <Text style={[styles.bizTagText, { color: thread.unread ? "#00f5ff" : "rgba(255,255,255,0.4)" }]}>{thread.tag}</Text>
                            </View>
                          </View>
                          <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                            {thread.message}
                          </Text>
                        </View>
                        {thread.unread && <View style={styles.bizUnreadDot} />}
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 32 }} />
                  </>
                )}

                {/* ── Sub-panels ── */}

                {/* BROADCAST */}
                {activeBusinessTool === "broadcast" && (
                  <View style={styles.bizSubPanel}>
                    <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                      <Lucide name="chevron-back" size={23} color="#00f5ff" />
                      <Text style={styles.bizSubBackText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.bizSubTitle}>📣 Broadcast Message</Text>
                    <Text style={styles.bizSubSubtitle}>Send to all your followers at once</Text>
                    <View style={styles.bizAudiencePill}>
                      <Lucide name="people" size={17} color="#00f5ff" />
                      <Text style={{ color: "#00f5ff", fontSize: 14.5, marginLeft: 6 }}>1,432 followers will receive this</Text>
                    </View>
                    <TextInput
                      style={styles.bizBroadcastInput}
                      placeholder="Write your message..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={broadcastText}
                      onChangeText={setBroadcastText}
                      multiline
                      numberOfLines={5}
                    />
                    {broadcastSent ? (
                      <View style={styles.bizSuccessBanner}>
                        <Lucide name="checkmark-circle" size={23} color="#34d399" />
                        <Text style={{ color: "#34d399", marginLeft: 8, fontWeight: "600" }}>Broadcast sent to all followers!</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.bizSendBtn, !broadcastText && { opacity: 0.4 }]}
                        disabled={!broadcastText}
                        onPress={async () => {
                          triggerHaptic("heavy");
                          const ok = await sendBroadcast(broadcastText || "Broadcast", broadcastText);
                          setBroadcastSent(true);
                          if (ok) fetchBroadcasts();
                        }}
                      >
                        <Lucide name="megaphone" size={19} color="#000" />
                        <Text style={styles.bizSendBtnText}>Send Broadcast</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* PROMOTIONS */}
                {activeBusinessTool === "promotions" && (
                  <View style={styles.bizSubPanel}>
                    <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                      <Lucide name="chevron-back" size={23} color="#fb923c" />
                      <Text style={[styles.bizSubBackText, { color: "#fb923c" }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.bizSubTitle}>🏷️ Promotions</Text>
                    <Text style={styles.bizSubSubtitle}>Active discount codes & campaigns</Text>
                    {loadingPromos ? (
                      <ActivityIndicator size="small" color="#fb923c" style={{ marginTop: 16 }} />
                    ) : (
                      (livePromos.length > 0 ? livePromos : [
                        { code: "AURA20", discount: 20, type: "PERCENTAGE", uses: 34, expiresAt: "2026-06-15" },
                        { code: "NEWCOL10", discount: 10, type: "PERCENTAGE", uses: 12, expiresAt: "2026-06-30" },
                      ]).map((promo: any) => (
                        <View key={promo.code} style={styles.bizPromoCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "#fb923c", fontWeight: "bold", fontSize: 17.5, letterSpacing: 1 }}>{promo.code}</Text>
                            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14.5, marginTop: 2 }}>
                              {promo.type === "PERCENTAGE" ? `${promo.discount}% off` : `₹${promo.discount} off`}
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13.5, marginTop: 2 }}>
                              Used {promo.uses || 0}× {promo.expiresAt ? `· Expires ${new Date(promo.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                            </Text>
                          </View>
                          <View style={[styles.bizTagBadge, { backgroundColor: "#fb923c22" }]}>
                            <Text style={{ color: "#fb923c", fontSize: 13.5 }}>{promo.status || "Active"}</Text>
                          </View>
                        </View>
                      ))
                    )}
                    {showNewPromoForm ? (
                      <View style={{ marginBottom: 12 }}>
                        <TextInput
                          style={[styles.bizBroadcastInput, { borderColor: "#fb923c44", minHeight: 46 }]}
                          placeholder="Promo code (e.g. SALE25)"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={newPromoCode}
                          onChangeText={setNewPromoCode}
                          autoCapitalize="characters"
                        />
                        <TextInput
                          style={[styles.bizBroadcastInput, { borderColor: "#fb923c44", minHeight: 46 }]}
                          placeholder="Discount % (e.g. 25)"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={newPromoDiscount}
                          onChangeText={setNewPromoDiscount}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={[styles.bizSendBtn, { backgroundColor: "#fb923c" }, (!newPromoCode || !newPromoDiscount) && { opacity: 0.4 }]}
                          disabled={!newPromoCode || !newPromoDiscount}
                          onPress={async () => {
                            triggerHaptic("heavy");
                            const ok = await createPromo(newPromoCode, parseFloat(newPromoDiscount), "PERCENTAGE");
                            if (ok) { setNewPromoCode(""); setNewPromoDiscount(""); setShowNewPromoForm(false); }
                          }}
                        >
                          <Lucide name="checkmark" size={19} color="#000" />
                          <Text style={styles.bizSendBtnText}>Save Promo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={[styles.bizSendBtn, { backgroundColor: "#fb923c" }]} onPress={() => setShowNewPromoForm(true)}>
                        <Lucide name="add" size={19} color="#000" />
                        <Text style={styles.bizSendBtnText}>Create New Promo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ADS MANAGER */}
                {activeBusinessTool === "ads" && (
                  <View style={styles.bizSubPanel}>
                    <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                      <Lucide name="chevron-back" size={23} color="#a78bfa" />
                      <Text style={[styles.bizSubBackText, { color: "#a78bfa" }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.bizSubTitle}>📊 Ads Manager</Text>
                    <Text style={styles.bizSubSubtitle}>Active campaigns this month</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
                      {(liveAds.length > 0 ? liveAds : [
                        { name: "Spring Drop", spend: "₹12,000", reach: "28K", clicks: "1.2K", status: "Live" },
                        { name: "Scarf Promo", spend: "₹6,500", reach: "14K", clicks: "640", status: "Paused" },
                      ]).map((ad: any) => (
                        <View key={ad.name} style={styles.bizAdCard}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16.5 }}>{ad.name}</Text>
                            <View style={[styles.bizTagBadge, { backgroundColor: ad.status === "Live" ? "#34d39922" : "#ffffff11" }]}>
                              <Text style={{ color: ad.status === "Live" ? "#34d399" : "rgba(255,255,255,0.4)", fontSize: 13.5 }}>{ad.status}</Text>
                            </View>
                          </View>
                          {[
                            { k: "Spend", v: ad.spend },
                            { k: "Reach", v: ad.reach },
                            { k: "Clicks", v: ad.clicks },
                          ].map((row) => (
                            <View key={row.k} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14.5 }}>{row.k}</Text>
                              <Text style={{ color: "#a78bfa", fontSize: 14.5, fontWeight: "600" }}>{row.v}</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={[styles.bizSendBtn, { backgroundColor: "#a78bfa" }]} onPress={() => triggerHaptic("medium")}>
                      <Lucide name="add" size={19} color="#000" />
                      <Text style={styles.bizSendBtnText}>Create New Ad</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CATALOGUE */}
                {activeBusinessTool === "catalogue" && (
                  <View style={styles.bizSubPanel}>
                    <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                      <Lucide name="chevron-back" size={23} color="#34d399" />
                      <Text style={[styles.bizSubBackText, { color: "#34d399" }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.bizSubTitle}>🗂️ Catalogue</Text>
                    <Text style={styles.bizSubSubtitle}>Your active listings</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                      {(products || []).slice(0, 6).map((p: any) => (
                        <View key={p.id} style={styles.bizCatalogueItem}>
                          <Image source={{ uri: p.images?.[0] || p.thumbnail }} style={styles.bizCatalogueImg} />
                          <Text style={styles.bizCatalogueName} numberOfLines={1}>{p.name || p.title}</Text>
                          <Text style={styles.bizCataloguePrice}>₹{p.price?.toLocaleString()}</Text>
                        </View>
                      ))}
                      {(!products || products.length === 0) && (
                        <View style={{ alignItems: "center", paddingVertical: 32, width: "100%" }}>
                          <Lucide name="grid-outline" size={40} color="rgba(255,255,255,0.2)" />
                          <Text style={{ color: "rgba(255,255,255,0.3)", marginTop: 12, fontSize: 15.5 }}>List products from your web dashboard</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* AUTO-REPLY */}
                {activeBusinessTool === "autoreply" && (
                  <View style={styles.bizSubPanel}>
                    <TouchableOpacity style={styles.bizSubBack} onPress={() => { setActiveBusinessTool(null); setAutoReplySaved(false); }}>
                      <Lucide name="chevron-back" size={23} color="#f472b6" />
                      <Text style={[styles.bizSubBackText, { color: "#f472b6" }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.bizSubTitle}>⚡ Auto-Reply</Text>
                    <Text style={styles.bizSubSubtitle}>Auto-sent when you're unavailable</Text>

                    {loadingAutoReply ? (
                      <ActivityIndicator size="small" color="#f472b6" style={{ marginTop: 24 }} />
                    ) : (
                      <>
                        {/* Enable toggle */}
                        <TouchableOpacity
                          style={styles.bizAutoReplyToggleRow}
                          onPress={() => { triggerHaptic("light"); setAutoReplyEnabled(!autoReplyEnabled); setAutoReplySaved(false); }}
                          activeOpacity={0.8}
                        >
                          <View>
                            <Text style={{ color: "#fff", fontSize: 16.5, fontWeight: "600" }}>Auto-Reply Enabled</Text>
                            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13.5, marginTop: 2 }}>
                              {autoReplyEnabled ? "Replies sent automatically" : "Currently disabled"}
                            </Text>
                          </View>
                          <View style={[styles.bizToggle, { backgroundColor: autoReplyEnabled ? "#f472b633" : "rgba(255,255,255,0.1)" }]}>
                            <View style={[
                              styles.bizToggleThumb,
                              { backgroundColor: autoReplyEnabled ? "#f472b6" : "rgba(255,255,255,0.3)", marginLeft: autoReplyEnabled ? "auto" : 0 }
                            ]} />
                          </View>
                        </TouchableOpacity>

                        {/* Greeting message */}
                        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6, marginTop: 4 }}>GREETING MESSAGE</Text>
                        <TextInput
                          style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 80 }]}
                          value={greetingMessage}
                          onChangeText={(t) => { setGreetingMessage(t); setAutoReplySaved(false); }}
                          multiline
                          placeholder="Sent when someone first messages you"
                          placeholderTextColor="rgba(255,255,255,0.25)"
                        />

                        {/* Away message */}
                        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 }}>AWAY MESSAGE</Text>
                        <TextInput
                          style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 80 }]}
                          value={awayMessage}
                          onChangeText={(t) => { setAwayMessage(t); setAutoReplySaved(false); }}
                          multiline
                          placeholder="Sent during quiet hours or when away"
                          placeholderTextColor="rgba(255,255,255,0.25)"
                        />

                        {/* Quiet hours */}
                        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 }}>QUIET HOURS (24h format)</Text>
                        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 4 }}>From (hour)</Text>
                            <TextInput
                              style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 46, paddingVertical: 0 }]}
                              value={quietHoursStart}
                              onChangeText={(t) => { setQuietHoursStart(t); setAutoReplySaved(false); }}
                              keyboardType="numeric"
                              placeholder="e.g. 22"
                              placeholderTextColor="rgba(255,255,255,0.25)"
                              maxLength={2}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 4 }}>To (hour)</Text>
                            <TextInput
                              style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 46, paddingVertical: 0 }]}
                              value={quietHoursEnd}
                              onChangeText={(t) => { setQuietHoursEnd(t); setAutoReplySaved(false); }}
                              keyboardType="numeric"
                              placeholder="e.g. 8"
                              placeholderTextColor="rgba(255,255,255,0.25)"
                              maxLength={2}
                            />
                          </View>
                        </View>

                        {autoReplySaved ? (
                          <View style={styles.bizSuccessBanner}>
                            <Lucide name="checkmark-circle" size={23} color="#34d399" />
                            <Text style={{ color: "#34d399", marginLeft: 8, fontWeight: "600" }}>Auto-Reply saved & synced!</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.bizSendBtn, { backgroundColor: "#f472b6" }]}
                            onPress={async () => {
                              triggerHaptic("heavy");
                              const ok = await saveAutoReply();
                              setAutoReplySaved(ok);
                            }}
                          >
                            <Lucide name="save-outline" size={19} color="#000" />
                            <Text style={styles.bizSendBtnText}>Save & Sync Auto-Reply</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* CUSTOMER INBOX */}
                {activeBusinessTool === "inbox" && (
                  <View style={styles.bizSubPanel}>
                    <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                      <Lucide name="chevron-back" size={23} color="#fbbf24" />
                      <Text style={[styles.bizSubBackText, { color: "#fbbf24" }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.bizSubTitle}>👥 Customer Inbox</Text>
                    <Text style={styles.bizSubSubtitle}>Order & product enquiries</Text>
                    {CUSTOMER_THREADS.map((thread) => (
                      <TouchableOpacity
                        key={thread.id}
                        style={styles.threadItemRow}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                        activeOpacity={0.75}
                      >
                        <Image source={{ uri: thread.avatar }} style={styles.threadAvatar} />
                        <View style={styles.threadDetails}>
                          <View style={styles.threadNameRow}>
                            <Text style={styles.threadNameText}>{thread.name}</Text>
                            <View style={[styles.bizTagBadge, { backgroundColor: "#fbbf2422" }]}>
                              <Text style={{ color: "#fbbf24", fontSize: 13.5 }}>{thread.tag}</Text>
                            </View>
                          </View>
                          <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                            {thread.message}
                          </Text>
                        </View>
                        {thread.unread && <View style={styles.bizUnreadDot} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      )}

      {/* 💬 INDIVIDUAL ACTIVE CONVERSATION MESSENGER PANEL */}
      {showDMs && activeChat && (
        <View style={[styles.dmSlidePanel, { bottom: bottomBarHeight }]}>
          <SafeAreaView style={styles.dmSafeArea}>
            {/* Chat header */}
            <View style={styles.dmHeaderRow}>
              <TouchableOpacity onPress={() => setActiveChat(null)}>
                <Lucide name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.dmTitleRow}>
                <Text style={styles.dmTitleText}>{activeChat.name}</Text>
                {activeChat.verified && (
                  <Lucide name="checkmark-circle" size={17} color="#0095f6" style={styles.verifiedCheck} />
                )}
              </View>

              <TouchableOpacity onPress={() => triggerHaptic("medium")}>
                <Lucide name="information-circle-outline" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Messages feed list */}
            <ScrollView 
              style={styles.chatFeedScroll}
              contentContainerStyle={styles.chatFeedContent}
              ref={(ref) => ref?.scrollToEnd({ animated: true })}
            >
              <Text style={styles.chatStartText}>
                Mesh handshake started — secure sovereign credentials synced
              </Text>
              
              {(activeChat.messages || []).map((msg: any) => {
                const isMine = msg.senderId === (isSeller ? activeMaisonId : "user_2pk5xskr");
                return (
                  <View key={msg.id} style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
                    {!isMine && (
                      <View style={styles.msgAvatar}>
                        <Text style={styles.msgAvatarText}>{activeChat.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={[styles.msgBubble, isMine ? styles.msgBubbleRight : styles.msgBubbleLeft]}>
                      <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>{msg.content}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input keyboard bar */}
            <View style={styles.chatInputBar}>
              <TouchableOpacity style={styles.paperclipBtn}>
                <Lucide name="image-outline" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                placeholder="Message..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={chatReplyText}
                onChangeText={setChatReplyText}
                onSubmitEditing={handleSendChatMessage}
              />
              <TouchableOpacity 
                style={[styles.chatSendBtn, !chatReplyText.trim() && styles.chatSendBtnDisabled]}
                onPress={handleSendChatMessage}
                disabled={!chatReplyText.trim()}
              >
                <Text style={styles.chatSendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* 🏠 GLOBAL PERSISTENT Bottom Navigation tabs replica */}
      <View style={[styles.instagramBottomBar, { height: 52 + insets.bottom, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => { 
          triggerHaptic("light"); 
          setShowDMs(false); 
          setShowExploreGrid(false); 
          setIsReelsFullScreen(false);
          setActiveFeedTab("posts");
          router.push("/"); 
        }}>
          <Lucide name="home-outline" size={28} color={(!showDMs && !showExploreGrid && (!isReelsFullScreen || activeFeedTab !== "reels")) ? "#00f5ff" : "#fff"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { 
          triggerHaptic("light"); 
          setShowDMs(false); 
          setShowExploreGrid(false); 
          setIsReelsFullScreen(true);
          setActiveFeedTab("reels");
        }}>
          <Lucide name="film-outline" size={28} color={(activeFeedTab === "reels" && isReelsFullScreen && !showDMs) ? "#00f5ff" : "#fff"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { 
          triggerHaptic("light"); 
          setShowDMs(true); 
          setShowExploreGrid(false); 
        }}>
          <Lucide name="paper-plane-outline" size={28} color={showDMs ? "#00f5ff" : "#fff"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { 
          triggerHaptic("light"); 
          setShowDMs(false); 
          setShowExploreGrid(false); 
          router.push("/shop" as any); 
        }}>
          <Lucide name="play-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { 
          triggerHaptic("light"); 
          setShowDMs(false); 
          setShowExploreGrid(false); 
          router.push("/account"); 
        }}>
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
                    <Image source={{ uri: thumbnail }} style={styles.exploreGridImg} />
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
            {/* Tap controls left/right */}
            <TouchableOpacity 
              style={[styles.storyTapDetector, { left: 0 }]} 
              activeOpacity={1}
              onPress={handleStoryPrev}
            />
            <TouchableOpacity 
              style={[styles.storyTapDetector, { right: 0 }]} 
              activeOpacity={1}
              onPress={handleStoryNext}
            />

            <SafeAreaView style={styles.storyModalSafe}>
              {/* Progress bars strip */}
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

              {/* Message Reply Keyboard footer */}
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

      {/* 📸 HIGH-FIDELITY INSTAGRAM-STYLE REELS CAMERA/RECORDING STUDIO */}
      {showReelCamera && (
        <Modal
          visible={showReelCamera}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            stopTrack();
            setShowReelCamera(false);
          }}
        >
          <View style={styles.cameraContainer}>
            {/* CAMERA PERMISSION CHECKER */}
            {!permission ? (
              <View style={[styles.cameraContainer, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color="#00f5ff" />
              </View>
            ) : !permission.granted ? (
              <View style={styles.permissionContainer}>
                <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
                  <View style={styles.permissionIconCircle}>
                    <Lucide name="camera-outline" size={44} color="#00f5ff" />
                  </View>
                  <Text style={styles.permissionTitle}>Camera Access Required</Text>
                  <Text style={styles.permissionText}>
                    AURA requires active camera lens telemetry to enable direct-in-view curation and live product tagging.
                  </Text>
                  <TouchableOpacity 
                    style={styles.permissionBtn} 
                    onPress={() => {
                      triggerHaptic("heavy");
                      requestPermission();
                    }}
                  >
                    <Text style={styles.permissionBtnText}>Enable Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.permissionCancelBtn} 
                    onPress={() => {
                      triggerHaptic("light");
                      setShowReelCamera(false);
                    }}
                  >
                    <Text style={styles.permissionCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </SafeAreaView>
              </View>
            ) : (
              <>
                {/* Real Live CameraView Finder (Full screen viewport) */}
                <CameraView 
                  style={styles.cameraViewfinder} 
                  facing={cameraFacing}
                />

                {/* SIMULATED RING-LIGHT FRONT SCREEN FLASH */}
                {flashMode === "on" && (
                  <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 20, borderColor: "#fffaf0", backgroundColor: "rgba(255,250,240,0.15)", zIndex: 4 }]} />
                )}

                {/* DYNAMIC COLLAGE VIEWFINDER SPLITS */}
                {videoLayoutMode === "split" && (
                  <View pointerEvents="none" style={styles.collageSplitOverlay}>
                    <View style={{ flex: 1, borderBottomWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                    <View style={{ flex: 1 }} />
                  </View>
                )}
                {videoLayoutMode === "grid" && (
                  <View pointerEvents="none" style={styles.collageGridOverlay}>
                    <View style={{ flex: 1, flexDirection: "row", borderBottomWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }}>
                      <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                      <View style={{ flex: 1 }} />
                    </View>
                    <View style={{ flex: 1, flexDirection: "row" }}>
                      <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                      <View style={{ flex: 1 }} />
                    </View>
                  </View>
                )}
                {videoLayoutMode === "triptych" && (
                  <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, flexDirection: "row", zIndex: 3 }}>
                    <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                    <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                    <View style={{ flex: 1 }} />
                  </View>
                )}

            {/* ALIGN TRANSITION GHOST OVERLAY */}
            {alignGhostActive && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}>
                <Image 
                  source={{ uri: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600" }} 
                  style={[StyleSheet.absoluteFillObject, { opacity: 0.3, tintColor: "#00f5ff" }]}
                />
              </View>
            )}

            {/* HANDS-FREE COUNTDOWN ANIMATION TIMING HUD */}
            {isCountingDown && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownTitle}>Hands-free Recording</Text>
                <Text style={styles.countdownTimerText}>{activeCountdown}</Text>
                <Text style={styles.countdownSub}>Position your camera and prepare...</Text>
              </View>
            )}

            {/* DYNAMIC FILTER OVERLAY TINTS */}
            {activeFilter === "platinum" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.12)", zIndex: 1 }]} />
            )}
            {activeFilter === "neon" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 4, borderColor: "#00f5ff", backgroundColor: "rgba(0,245,255,0.06)", zIndex: 1 }]} />
            )}
            {activeFilter === "obsidian" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(8,4,21,0.55)", zIndex: 1 }]} />
            )}

            {/* Touch Up Retouch simulated glow overlay */}
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.02)", opacity: touchUpStrength / 100, zIndex: 1 }]} />

            {/* View container adapting perfectly to safe area notch and status bar on all mobile screen sizes */}
            <View style={[styles.cameraSafe, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6, zIndex: 10 }]}>
              
              {/* TOP ACTIONS ROW */}
              <View style={styles.cameraTopBar}>
                <TouchableOpacity 
                  style={styles.cameraCircleBtn} 
                  onPress={() => {
                    triggerHaptic("light");
                    setShowReelCamera(false);
                    setShowShareStudio(false);
                    stopTrack();
                  }}
                >
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>

                <View style={styles.cameraTopRightGroup}>
                  {/* Flash options dropdown popover selector */}
                  <TouchableOpacity 
                    style={[styles.cameraCircleBtn, flashMode !== "off" && { backgroundColor: flashMode === "on" ? "rgba(255,255,255,0.2)" : "rgba(255,223,0,0.2)" }]} 
                    onPress={() => {
                      triggerHaptic("medium");
                      setShowFlashDrawer(true);
                    }}
                  >
                    <Lucide 
                      name={flashMode === "off" ? "flash-off" : "flash"} 
                      size={23} 
                      color={flashMode === "off" ? "#fff" : flashMode === "on" ? "#00f5ff" : "#ffdf00"} 
                    />
                  </TouchableOpacity>
                  
                  {/* Dynamic Recording speed trigger */}
                  <TouchableOpacity style={styles.cameraBadgeBtn} onPress={() => { triggerHaptic("medium"); setShowSpeedDrawer(true); }}>
                    <Text style={styles.cameraBadgeText}>{recordingSpeed}x</Text>
                  </TouchableOpacity>

                  {/* Dynamic timer selector trigger */}
                  <TouchableOpacity 
                    style={[styles.cameraCircleBtn, countdownDuration > 0 && { backgroundColor: "rgba(0,245,255,0.2)" }]} 
                    onPress={() => { triggerHaptic("medium"); setShowCountdownDrawer(true); }}
                  >
                    <Lucide name="time-outline" size={23} color={countdownDuration > 0 ? "#00f5ff" : "#fff"} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cameraCircleBtn} onPress={() => { triggerHaptic("light"); alert("Studio configuration synchronized cleanly!"); }}>
                    <Lucide name="settings-outline" size={23} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* RECORDING PROGRESS BAR */}
              {isRecording && (
                <View style={styles.recordingProgressContainer}>
                  <View style={[styles.recordingProgressBar, { width: `${recordingProgress}%` }]} />
                </View>
              )}

              {/* REAL-TIME SOUNDTRACK VISUALIZER OVERLAY */}
              {isRecording && selectedAudio && (
                <View style={styles.soundtrackVisualizerOverlay}>
                  <Image source={{ uri: selectedAudio.cover }} style={styles.soundtrackVisualizerCover} />
                  <Text style={styles.soundtrackVisualizerText} numberOfLines={1}>
                    Streaming "{selectedAudio.title}" natively...
                  </Text>
                  {/* Little pulsing music wave bars */}
                  <View style={styles.musicWaveContainer}>
                    <View style={styles.musicWaveBar} />
                    <View style={[styles.musicWaveBar, { height: 16 }]} />
                    <View style={[styles.musicWaveBar, { height: 10 }]} />
                    <View style={[styles.musicWaveBar, { height: 14 }]} />
                  </View>
                </View>
              )}

              {/* REAL-TIME AUTO-SCROLLING TELEPROMPTER OVERLAY */}
              {showTeleprompter && (
                <View style={styles.teleprompterBox}>
                  <View style={styles.teleprompterHeaderRow}>
                    <View style={styles.teleprompterLiveDot} />
                    <Text style={styles.teleprompterHeader}>
                      {isRecording ? "● LIVE" : "AURA Studio Prompter"}
                    </Text>
                    {!isRecording && (
                      <Text style={styles.teleprompterHint}>Scrolls when recording starts</Text>
                    )}
                  </View>
                  <View style={styles.teleprompterScrollArea}>
                    <Animated.Text
                      style={[
                        styles.teleprompterScrollText,
                        { transform: [{ translateY: teleprompterScrollY }] }
                      ]}
                    >
                      {teleprompterText}
                    </Animated.Text>
                  </View>
                </View>
              )}

              {/* CENTER SUGGESTED AUDIO BUBBLE */}
              <TouchableOpacity 
                style={styles.suggestedAudioBubble}
                onPress={() => {
                  triggerHaptic("medium");
                  setShowAudioDrawer(true);
                }}
              >
                <Image 
                  source={{ uri: selectedAudio.cover }} 
                  style={styles.suggestedAudioArt} 
                />
                <View style={styles.suggestedAudioTextWrap}>
                  <Text style={styles.suggestedAudioTitle} numberOfLines={1}>{selectedAudio.title}</Text>
                  <Text style={styles.suggestedAudioSub} numberOfLines={1}>{selectedAudio.artist} • Tap to change</Text>
                </View>
                <Lucide name="chevron-forward" size={17} color="#fff" />
              </TouchableOpacity>

              {/* LEFT TOOLBAR COLUMN */}
              <View style={styles.cameraLeftToolbar}>
                <TouchableOpacity style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); setShowAudioDrawer(true); }}>
                  <View style={styles.cameraToolIconWrap}>
                    <Lucide name="musical-notes-outline" size={24} color="#fff" />
                  </View>
                  <Text style={styles.cameraToolLabel}>Audio</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); setShowFilterDrawer(true); }}>
                  <View style={[styles.cameraToolIconWrap, activeFilter !== "none" && { borderColor: "#00f5ff", borderWidth: 1.5 }]}>
                    <Lucide name="sparkles-outline" size={24} color="#fff" />
                  </View>
                  <Text style={styles.cameraToolLabel}>Effects</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraToolItem} onPress={() => {
                  triggerHaptic("light");
                  setSelectedLength((prev) => prev === 15 ? 30 : prev === 30 ? 60 : prev === 60 ? 90 : 15);
                }}>
                  <View style={styles.cameraToolIconWrap}>
                    <View style={styles.cameraLengthCircle}>
                      <Text style={styles.cameraLengthText}>{selectedLength}</Text>
                    </View>
                  </View>
                  <Text style={styles.cameraToolLabel}>Length</Text>
                </TouchableOpacity>



                <TouchableOpacity style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); setShowTeleprompter(!showTeleprompter); }}>
                  <View style={[styles.cameraToolIconWrap, showTeleprompter && { backgroundColor: "#00f5ff" }]}>
                    <Lucide name="document-text-outline" size={24} color={showTeleprompter ? "#000" : "#fff"} />
                    <View style={styles.cameraNewBadge}>
                      <Text style={styles.cameraNewBadgeText}>NEW</Text>
                    </View>
                  </View>
                  <Text style={styles.cameraToolLabel}>Teleprompter</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); setShowRetouchSlider(!showRetouchSlider); }}>
                  <View style={[styles.cameraToolIconWrap, showRetouchSlider && { backgroundColor: "#00f5ff" }]}>
                    <Lucide name="color-wand-outline" size={24} color={showRetouchSlider ? "#000" : "#fff"} />
                    <View style={styles.cameraNewBadge}>
                      <Text style={styles.cameraNewBadgeText}>NEW</Text>
                    </View>
                  </View>
                  <Text style={styles.cameraToolLabel}>Touch Up</Text>
                </TouchableOpacity>

                {/* ADVANCED OPTION 7: Collage Grid Layout selector */}
                <TouchableOpacity style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); setShowLayoutDrawer(true); }}>
                  <View style={[styles.cameraToolIconWrap, videoLayoutMode !== "single" && { backgroundColor: "#00f5ff" }]}>
                    <Lucide name="grid-outline" size={24} color={videoLayoutMode !== "single" ? "#000" : "#fff"} />
                  </View>
                  <Text style={styles.cameraToolLabel}>Layout</Text>
                </TouchableOpacity>

                {/* ADVANCED OPTION 8: Align Cut Transition overlay */}
                <TouchableOpacity style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); setAlignGhostActive(!alignGhostActive); }}>
                  <View style={[styles.cameraToolIconWrap, alignGhostActive && { backgroundColor: "#00f5ff" }]}>
                    <Lucide name="copy-outline" size={24} color={alignGhostActive ? "#000" : "#fff"} />
                  </View>
                  <Text style={styles.cameraToolLabel}>Align</Text>
                </TouchableOpacity>


              </View>

              {/* BOTTOM WRAPPER TO HOLD SHUTTER CONTROLS AND TABS TOGETHER AT THE BOTTOM OF VIEWPORT */}
              <View style={styles.cameraBottomWrapper}>
                {/* BOTTOM CONTROLS GRID */}
                <View style={styles.cameraBottomContainer}>
                  
                  {/* GALLERY THUMBNAIL */}
                  <TouchableOpacity style={styles.cameraGalleryBtn} onPress={() => triggerHaptic("light")}>
                    <Image 
                      source={{ uri: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=80" }} 
                      style={styles.cameraGalleryImg} 
                    />
                  </TouchableOpacity>

                  {/* LARGE WHITE RECORD BUTTON */}
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    style={[
                      styles.cameraRecordOuter,
                      isRecording && styles.cameraRecordOuterRecording
                    ]}
                    onPress={() => {
                      triggerHaptic("heavy");
                      if (isRecording) {
                        setIsRecording(false);
                        setRecordingProgress(0);
                        stopTrack(); // Instantly pause/stop music when recording terminates!
                        setShowShareStudio(true); // Proceed directly to tagging setup!
                      } else {
                        // Trigger timer countdown if configured
                        if (countdownDuration > 0) {
                          setIsCountingDown(true);
                          let tick = countdownDuration;
                          setActiveCountdown(tick);
                          
                          const tickTimer = setInterval(() => {
                            tick--;
                            triggerHaptic("medium");
                            if (tick <= 0) {
                              clearInterval(tickTimer);
                              setIsCountingDown(false);
                              // Start actual recording progress
                              startSimulatedRecording();
                            } else {
                              setActiveCountdown(tick);
                            }
                          }, 1000);
                        } else {
                          startSimulatedRecording();
                        }
                      }

                      function startSimulatedRecording() {
                        setIsRecording(true);
                        setRecordingProgress(0);
                        
                        // 🔊 Play selected soundtrack in real-time during recording!
                        if (selectedAudio && selectedAudio.url) {
                          playTrack(selectedAudio.url);
                        }

                        // Adjust duration synced to recording speed divisor
                        const durationMs = (selectedLength * 1000) / recordingSpeed;
                        const intervalMs = 200;
                        const increments = durationMs / intervalMs;
                        let currentInc = 0;
                        const timer = setInterval(() => {
                          currentInc++;
                          setRecordingProgress((prev) => {
                            if (currentInc >= increments) {
                              clearInterval(timer);
                              setIsRecording(false);
                              stopTrack(); // Instantly stop music when recording completes!
                              setShowShareStudio(true); // Open Product Tagging share screen!
                              return 0;
                            }
                            return (currentInc / increments) * 100;
                          });
                        }, intervalMs);
                      }
                    }}
                  >
                    <View style={[
                      styles.cameraRecordInner,
                      isRecording && styles.cameraRecordInnerRecording
                    ]} />
                  </TouchableOpacity>

                  {/* CAMERA FLIP BUTTON */}
                  <TouchableOpacity 
                    style={styles.cameraFlipBtn} 
                    onPress={() => {
                      triggerHaptic("medium");
                      setCameraFacing(prev => prev === "back" ? "front" : "back");
                    }}
                  >
                    <Lucide name="camera-reverse-outline" size={28} color="#fff" />
                  </TouchableOpacity>

                </View>

                {/* SWIPER FOOTER */}
                <View style={styles.cameraSwiperFooter}>
                  <View style={styles.cameraSwiperOptionActive}>
                    <Text style={styles.cameraSwiperTextActive}>REEL</Text>
                    <View style={styles.cameraSwiperDot} />
                  </View>
                  <TouchableOpacity onPress={() => triggerHaptic("light")} style={styles.cameraSwiperOption}>
                    <Text style={styles.cameraSwiperText}>TEMPLATES</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* SLIDING DRAWERS OVERLAYS (Placed direct inside cameraContainer outside safe view to prevent safe padding clipping) */}
            
            {/* 1. AUDIO SELECTOR DRAWER */}
            {showAudioDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Select Luxury Curation Soundtrack</Text>
                  <TouchableOpacity onPress={() => { setShowAudioDrawer(false); stopTrack(); }}>
                    <Lucide name="close-circle" size={24} color="#00f5ff" />
                  </TouchableOpacity>
                </View>

                {/* Interactive Search bar with magnifying glass and clear icons */}
                <View style={styles.audioSearchContainer}>
                  <Lucide name="search-outline" size={21} color="#aaa" style={styles.audioSearchIcon} />
                  <TextInput
                    style={styles.audioSearchInput}
                    placeholder="Search real songs, artists, genres..."
                    placeholderTextColor="#888"
                    value={audioSearchQuery}
                    onChangeText={setAudioSearchQuery}
                    autoCapitalize="none"
                  />
                  {audioSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setAudioSearchQuery("")}>
                      <Lucide name="close-circle" size={21} color="#aaa" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category Slider Tabs */}
                <View style={{ height: 38, marginBottom: 8 }}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
                  >
                    {[
                      { key: "all", label: "All Music" },
                      { key: "trending", label: "🔥 Trending" },
                      { key: "pop", label: "Pop Hits" },
                      { key: "bollywood", label: "Bollywood" },
                      { key: "hiphop", label: "Hip Hop" },
                      { key: "electronic", label: "Electronic" }
                    ].map((cat) => (
                      <TouchableOpacity 
                        key={cat.key} 
                        style={[
                          styles.audioCategoryTab, 
                          activeAudioCategory === cat.key && styles.audioCategoryTabActive
                        ]}
                        onPress={() => {
                          triggerHaptic("light");
                          setActiveAudioCategory(cat.key as any);
                        }}
                      >
                        <Text style={[
                          styles.audioCategoryTabText, 
                          activeAudioCategory === cat.key && styles.audioCategoryTabTextActive
                        ]}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Playlist mapping with live preview actions */}
                <ScrollView style={styles.drawerScroll}>
                  {AUDIO_LIBRARY.filter(track => {
                    const matchesSearch = track.title.toLowerCase().includes(audioSearchQuery.toLowerCase()) || 
                                          track.artist.toLowerCase().includes(audioSearchQuery.toLowerCase());
                    const matchesCategory = activeAudioCategory === "all" || 
                                            (activeAudioCategory === "trending" && track.isTrending) || 
                                            track.category === activeAudioCategory;
                    return matchesSearch && matchesCategory;
                  }).map((track, i) => {
                    const isCurrentlySelected = selectedAudio && selectedAudio.title === track.title;
                    const isThisPlaying = isPlayingAudio && soundRef.current && selectedAudio && selectedAudio.url === track.url;
                    
                    return (
                      <TouchableOpacity 
                        key={i} 
                        style={[
                          styles.drawerItem, 
                          isCurrentlySelected && styles.drawerItemCurrentlySelected
                        ]} 
                        onPress={() => {
                          triggerHaptic("medium");
                          setSelectedAudio(track);
                          stopTrack(); // Silence the audition preview
                          setShowAudioDrawer(false); // Close drawer to return to quiet camera, matching Instagram!
                        }}
                      >
                        <Image source={{ uri: track.cover }} style={styles.drawerItemArt} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.drawerItemText} numberOfLines={1}>{track.title}</Text>
                          <Text style={styles.drawerItemSub} numberOfLines={1}>{track.artist}</Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          {/* Live preview play/pause trigger */}
                          <TouchableOpacity 
                            style={styles.audioPreviewBtn}
                            onPress={(e) => {
                              e.stopPropagation(); // Avoid triggering row selection when clicking preview button
                              triggerHaptic("light");
                              if (isThisPlaying) {
                                stopTrack();
                              } else {
                                setSelectedAudio(track);
                                playTrack(track.url);
                              }
                            }}
                          >
                            <Lucide 
                              name={isThisPlaying ? "pause-circle" : "play-circle"} 
                              size={24} 
                              color="#00f5ff" 
                            />
                          </TouchableOpacity>

                          {/* Selected checkmark indicator */}
                          {isCurrentlySelected && (
                            <Lucide name="checkmark-circle" size={21} color="#39ff14" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 2. FILTER MATRIX DRAWER */}
            {showFilterDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Visual Effects Matrix</Text>
                  <TouchableOpacity onPress={() => setShowFilterDrawer(false)}>
                    <Lucide name="close-circle" size={24} color="#00f5ff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterGrid}>
                  {[
                    { key: "none", label: "No Filter", icon: "ban-outline" },
                    { key: "platinum", label: "Platinum Glow", icon: "sparkles" },
                    { key: "neon", label: "Neon Bloom", icon: "color-palette" },
                    { key: "obsidian", label: "Obsidian Chrome", icon: "moon" }
                  ].map((f) => (
                    <TouchableOpacity 
                      key={f.key} 
                      style={[styles.filterGridItem, activeFilter === f.key && styles.filterGridItemActive]} 
                      onPress={() => {
                        triggerHaptic("light");
                        setActiveFilter(f.key as any);
                        setShowFilterDrawer(false);
                      }}
                    >
                      <Lucide name={f.icon as any} size={26} color={activeFilter === f.key ? "#00f5ff" : "#fff"} />
                      <Text style={[styles.filterGridLabel, activeFilter === f.key && { color: "#00f5ff" }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}



            {/* 4. TOUCH UP RETOUCH STRENGTH OVERLAY */}
            {showRetouchSlider && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Cyber Retouching Strength: {touchUpStrength}%</Text>
                  <TouchableOpacity onPress={() => setShowRetouchSlider(false)}>
                    <Lucide name="close-circle" size={24} color="#00f5ff" />
                  </TouchableOpacity>
                </View>
                <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Natural (0%)</Text>
                    <Text style={{ color: "#00f5ff", fontSize: 13, fontWeight: "bold" }}>Maximum Polish (100%)</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    {[0, 25, 50, 70, 90, 100].map((val) => (
                      <TouchableOpacity 
                        key={val} 
                        style={[styles.strengthItemBtn, touchUpStrength === val && styles.strengthItemBtnActive]} 
                        onPress={() => {
                          triggerHaptic("light");
                          setTouchUpStrength(val);
                        }}
                      >
                        <Text style={[styles.strengthItemText, touchUpStrength === val && { color: "#000" }]}>{val}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* 8. ACTIVE FLASH MODE SELECTOR DRAWER */}
            {showFlashDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>AURA Flash Control Studio</Text>
                  <TouchableOpacity onPress={() => setShowFlashDrawer(false)}>
                    <Lucide name="close-circle" size={24} color="#00f5ff" />
                  </TouchableOpacity>
                </View>
                <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
                    {[
                      { key: "off", label: "Flash Off", icon: "flash-off-outline", desc: "No exposure override." },
                      { key: "on", label: "Ring Light On", icon: "flash", desc: "Screen glows warm white." },
                      { key: "auto", label: "Auto Exposure", icon: "flash-outline", desc: "Sensors toggle on shutter." }
                    ].map((mode) => (
                      <TouchableOpacity 
                        key={mode.key} 
                        style={[styles.filterGridItem, flashMode === mode.key && styles.filterGridItemActive, { width: 105, height: 95 }]} 
                        onPress={() => {
                          triggerHaptic("medium");
                          setFlashMode(mode.key as any);
                          setShowFlashDrawer(false);
                          alert(`Flash Mode Sync'd: ${mode.label}. ${mode.desc}`);
                        }}
                      >
                        <Lucide name={mode.icon as any} size={26} color={flashMode === mode.key ? "#000" : "#fff"} />
                        <Text style={[styles.filterGridLabel, flashMode === mode.key && { color: "#000", fontWeight: "bold" }, { fontSize: 13 }]}>
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* 5. DYNAMIC RECORDING SPEED MULTIPLIER DRAWER */}
            {showSpeedDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Recording Speed Multiplier</Text>
                  <TouchableOpacity onPress={() => setShowSpeedDrawer(false)}>
                    <Lucide name="close-circle" size={24} color="#00f5ff" />
                  </TouchableOpacity>
                </View>
                <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    {([0.3, 0.5, 1, 2, 3] as const).map((spd) => (
                      <TouchableOpacity 
                        key={spd} 
                        style={[styles.strengthItemBtn, recordingSpeed === spd && styles.strengthItemBtnActive, { width: 85 }]} 
                        onPress={() => {
                          triggerHaptic("medium");
                          setRecordingSpeed(spd);
                          setShowSpeedDrawer(false);
                        }}
                      >
                        <Text style={[styles.strengthItemText, recordingSpeed === spd && { color: "#000" }]}>
                          {spd === 1 ? "1.0x (Normal)" : `${spd}x`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* 6. HANDS-FREE TIMER COUNTDOWN DRAWER */}
            {showCountdownDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Hands-free Countdown Timer</Text>
                  <TouchableOpacity onPress={() => setShowCountdownDrawer(false)}>
                    <Lucide name="close-circle" size={24} color="#00f5ff" />
                  </TouchableOpacity>
                </View>
                <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
                    {[
                      { val: 0, label: "Off (Instant)" },
                      { val: 3, label: "3 Seconds" },
                      { val: 10, label: "10 Seconds" }
                    ].map((t) => (
                      <TouchableOpacity 
                        key={t.val} 
                        style={[styles.strengthItemBtn, countdownDuration === t.val && styles.strengthItemBtnActive, { width: 100 }]} 
                        onPress={() => {
                          triggerHaptic("medium");
                          setCountdownDuration(t.val as any);
                          setShowCountdownDrawer(false);
                          alert(t.val === 0 ? "Hands-free countdown disabled." : `Hands-free active: ${t.label} countdown will run before recording starts.`);
                        }}
                      >
                        <Text style={[styles.strengthItemText, countdownDuration === t.val && { color: "#000" }, { fontSize: 13.5 }]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* 7. COLLAGE SPLITS & RUNWAY GRID DRAWER */}
            {showLayoutDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Collage Video Grid Layout</Text>
                  <TouchableOpacity onPress={() => setShowLayoutDrawer(false)}>
                    <Lucide name="close-circle" size={24} color="#00f5ff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterGrid}>
                  {[
                    { key: "single", label: "Single Viewfinder", icon: "square-outline" },
                    { key: "split", label: "Vertical Split Screen", icon: "menu-outline" },
                    { key: "grid", label: "Quad Grid collage", icon: "grid-outline" },
                    { key: "triptych", label: "Runway Triptych (3 Panes)", icon: "ellipsis-vertical-outline" }
                  ].map((lay) => (
                    <TouchableOpacity 
                      key={lay.key} 
                      style={[styles.filterGridItem, videoLayoutMode === lay.key && styles.filterGridItemActive]} 
                      onPress={() => {
                        triggerHaptic("medium");
                        setVideoLayoutMode(lay.key as any);
                        setShowLayoutDrawer(false);
                      }}
                    >
                      <Lucide name={lay.icon as any} size={26} color={videoLayoutMode === lay.key ? "#00f5ff" : "#fff"} />
                      <Text style={[styles.filterGridLabel, videoLayoutMode === lay.key && { color: "#00f5ff" }]}>{lay.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 🏷️ AFFILIATE & PRODUCT TAGGING SHARE STUDIO MODAL PANEL */}
            {showShareStudio && (
              <View style={[styles.shareStudioOverlay, { paddingTop: insets.top }]}>
                <View style={{ flex: 1 }}>
                  {/* Share Header */}
                  <View style={styles.shareHeaderRow}>
                    <TouchableOpacity onPress={() => setShowShareStudio(false)}>
                      <Lucide name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.shareHeaderTitle}>Tag Affiliate Curation</Text>
                    <TouchableOpacity 
                      style={[styles.sharePublishBtn, !taggedProduct && styles.sharePublishBtnDisabled]}
                      disabled={!taggedProduct}
                      onPress={() => {
                        triggerHaptic("heavy");
                        
                        // Compile new Reel object prepended to feed with full studio parameters
                        const newReelItem = {
                          id: `user_reel_${Date.now()}`,
                          url: "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40149-large.mp4",
                          caption: reelCaption.trim() || `Affiliate sync coordinate by @${affiliateHandle || "curator"}. Real-time commission rate set at ${affiliateCommission}%.`,
                          likesCount: 0,
                          comments: [],
                          user: { name: "Alok (You)" },
                          artifactId: taggedProduct.id,
                          artifact: taggedProduct,
                          thumbnail: taggedProduct.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
                          isVideo: true,
                          affiliateLink: `https://aura.luxury/aff/${affiliateHandle || "curator"}/${taggedProduct.id}`,
                          filterApplied: activeFilter,
                          touchUpApplied: touchUpStrength,
                          audioTrack: selectedAudio,

                          lengthApplied: selectedLength
                        };

                        setLocalReels([newReelItem, ...localReels]);
                        setShowReelCamera(false);
                        setShowShareStudio(false);
                        setTaggedProduct(null);
                        setReelCaption("");
                        
                        // Reset all advanced camera settings to standard
                        setActiveFilter("none");
                        setTouchUpStrength(0);

                        setSelectedLength(15);
                        setShowTeleprompter(false);
                        setAffiliateCommission(10);
                        setAffiliateHandle("");

                        alert(`Reel published successfully! Product Tagged: "${newReelItem.artifact.title}" with ${newReelItem.lengthApplied}s recording, applying ${newReelItem.filterApplied !== "none" ? newReelItem.filterApplied : "no"} filter effects, and ${affiliateCommission}% commission tracking link.`);
                      }}
                    >
                      <Text style={styles.sharePublishText}>Publish Reel</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.shareStudioContent}>
                    
                    {/* Caption Input */}
                    <View style={styles.shareCaptionBlock}>
                      <Image 
                        source={{ uri: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=150" }} 
                        style={styles.shareCaptionArt} 
                      />
                      <TextInput 
                        style={styles.shareCaptionInput}
                        placeholder="Write a caption for your curation..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={reelCaption}
                        onChangeText={setReelCaption}
                        multiline
                      />
                    </View>

                    <View style={styles.dividerLine} />

                    {/* Tagged Product Box */}
                    <View style={styles.shareSection}>
                      <Text style={styles.shareSectionTitle}>🏷️ Tag Product from Boutique</Text>
                      {taggedProduct ? (
                        <View style={styles.taggedProductCard}>
                          <Image source={{ uri: taggedProduct.images?.[0] }} style={styles.taggedProductImg} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.taggedProductMaison}>{taggedProduct.maison?.name || "AURA Maison"}</Text>
                            <Text style={styles.taggedProductTitle}>{taggedProduct.title}</Text>
                            <Text style={styles.taggedProductPrice}>₹{taggedProduct.price?.toLocaleString()}</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.taggedProductRemoveBtn}
                            onPress={() => {
                              triggerHaptic("light");
                              setTaggedProduct(null);
                            }}
                          >
                            <Lucide name="trash-outline" size={21} color="#ff3b30" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.taggedProductPrompt}>No product tagged. Select a coordinate item below to activate shopping links!</Text>
                      )}

                      {/* Horizontally scrollable select items list */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        {products.map((p: any) => (
                          <TouchableOpacity 
                            key={p.id} 
                            style={[
                              styles.selectProdBtn,
                              taggedProduct?.id === p.id && styles.selectProdBtnActive
                            ]}
                            onPress={() => {
                              triggerHaptic("medium");
                              setTaggedProduct(p);
                            }}
                          >
                            <Image source={{ uri: p.images?.[0] }} style={styles.selectProdImg} />
                            <Text style={styles.selectProdText} numberOfLines={1}>{p.title}</Text>
                            <Text style={styles.selectProdPrice}>₹{p.price?.toLocaleString()}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.dividerLine} />

                    {/* Affiliate Link Config */}
                    <View style={styles.shareSection}>
                      <Text style={styles.shareSectionTitle}>💹 Creator Affiliate Commission Link</Text>
                      <Text style={styles.affiliateSub}>Mint commission telemetry nodes linked directly into checkout payouts.</Text>

                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.commissionLabel}>Commission Rate: <Text style={{ color: "#00f5ff", fontWeight: "bold" }}>{affiliateCommission}%</Text></Text>
                        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                          {[5, 10, 15, 20].map((rate) => (
                            <TouchableOpacity 
                              key={rate} 
                              style={[
                                styles.rateBtn,
                                affiliateCommission === rate && styles.rateBtnActive
                              ]}
                              onPress={() => {
                                triggerHaptic("light");
                                setAffiliateCommission(rate);
                              }}
                            >
                              <Text style={[styles.rateText, affiliateCommission === rate && { color: "#000" }]}>{rate}%</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={{ marginTop: 16 }}>
                        <Text style={styles.commissionLabel}>Affiliate Nickname Handle:</Text>
                        <TextInput 
                          style={styles.affiliateHandleInput}
                          placeholder="e.g. alok_curator"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={affiliateHandle}
                          onChangeText={setAffiliateHandle}
                        />
                      </View>

                      {/* Glowing preview of live buy link */}
                      <View style={styles.affLinkPreviewCard}>
                        <Text style={styles.affLinkPreviewTitle}>Generated Active Purchase link</Text>
                        <Text style={styles.affLinkPreviewText}>
                          {`https://aura.luxury/aff/${affiliateHandle.trim() || "curator"}/${taggedProduct?.id || "product_id"}`}
                        </Text>
                      </View>
                    </View>

                  </ScrollView>
                </View>
              </View>
            )}
            </>
            )}
          </View>
        </Modal>
      )}

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
                  />
                </View>
                <TouchableOpacity style={styles.shareAddFriendBtn} onPress={() => { triggerHaptic("light"); alert("Syncing your contact nodes..."); }}>
                  <Lucide name="person-add-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Direct Message Contacts Grid */}
              <View style={styles.shareContactsContainer}>
                <View style={styles.shareContactsRow}>
                  {[
                    { id: "c1", name: "Kiran Soni", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150" },
                    { id: "c2", name: "S U R A J", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150" },
                    { id: "c3", name: "Dr. Rashneet ✨", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150" },
                  ].map((contact) => (
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

                <View style={styles.shareContactsRow}>
                  {[
                    { id: "c4", name: "Rhythm Bhatia", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150" },
                    { id: "c5", name: "the.priyas...", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150" },
                    { id: "c6", name: "Mandy", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150" },
                  ].map((contact) => (
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
                  const postUrl = shareTargetPost?.url || `https://07279b986c9bc954-106-219-121-7.serveousercontent.com/reel/${shareTargetPost?.id || "s1"}`;
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
                  const postUrl = shareTargetPost?.url || `https://07279b986c9bc954-106-219-121-7.serveousercontent.com/reel/${shareTargetPost?.id || "s1"}`;
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
                  const postUrl = shareTargetPost?.url || `https://07279b986c9bc954-106-219-121-7.serveousercontent.com/reel/${shareTargetPost?.id || "s1"}`;
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
                  const postUrl = shareTargetPost?.url || `https://07279b986c9bc954-106-219-121-7.serveousercontent.com/reel/${shareTargetPost?.id || "s1"}`;
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
                <View style={styles.commentRow}>
                  <TouchableOpacity 
                    onPress={() => {
                      const authorName = commentsTargetPost.user?.name || "gucci";
                      navigateToUserProfile(authorName);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {commentsTargetPost.user?.name?.[0]?.toUpperCase() || "S"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity 
                      onPress={() => {
                        const authorName = commentsTargetPost.user?.name || "gucci";
                        navigateToUserProfile(authorName);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.commentUsername}>
                        {commentsTargetPost.user?.name?.toLowerCase().replace(/\s+/g, "") || "gucci"} <Text style={styles.commentBadge}>Author</Text>
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.commentTextContent}>
                      {commentsTargetPost.caption || "Atelier Masterpiece Collection."}
                    </Text>
                    <Text style={styles.commentTime}>Pinned • 1d</Text>
                  </View>
                </View>
                
                <View style={styles.commentsSeparator} />

                {/* Additional user comments */}
                {(postComments[commentsTargetPost.id] || []).map((comm: any) => (
                  <View key={comm.id} style={styles.commentRow}>
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
                      <Text style={styles.commentTime}>{comm.time || "now"}</Text>
                    </View>
                    <TouchableOpacity onPress={() => triggerHaptic("light")}>
                      <Lucide name="heart-outline" size={17} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Bottom text input row */}
              <View style={[styles.commentsInputRow, { paddingBottom: insets.bottom + 8 }]}>
                <View style={[styles.commentAvatar, { width: 32, height: 32, borderRadius: 16 }]}>
                  <Text style={[styles.commentAvatarText, { fontSize: 13.5 }]}>A</Text>
                </View>
                
                <TextInput
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
                      time: "now"
                    };
                    setPostComments(prev => ({
                      ...prev,
                      [commentsTargetPost.id]: [...(prev[commentsTargetPost.id] || []), newComm]
                    }));
                    setNewCommentText("");
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
                      time: "now"
                    };
                    setPostComments(prev => ({
                      ...prev,
                      [commentsTargetPost.id]: [...(prev[commentsTargetPost.id] || []), newComm]
                    }));
                    setNewCommentText("");
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
    backgroundColor: "rgba(8,4,21,0.88)", // Premium glassmorphic background
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.05)",
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
  dmSlidePanel: {
    position: "absolute",
    top: 0,
    bottom: 52,
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


