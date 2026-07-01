import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Linking,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import * as ImageManipulator from "expo-image-manipulator";
import { API_HOST } from "@/constants/api";
import { LiveShowroom } from "@/components/LiveShowroom";
import { formatCompactNumber } from "@/constants/format";

const { width } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 2) / 3; // 3 columns with 1px gap

const PRESET_POSTS = [
  { id: "grid_1", url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400", isVideo: true },
  { id: "grid_2", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400", isVideo: true },
  { id: "grid_3", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400", isVideo: false },
  { id: "grid_4", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600", isVideo: false },
  { id: "grid_5", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400", isVideo: true },
  { id: "grid_6", url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=400", isVideo: false },
  { id: "grid_7", url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400", isVideo: true },
  { id: "grid_8", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=400", isVideo: false },
  { id: "grid_9", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400", isVideo: true },
];

export default function AccountScreen() {
  const { 
    products, 
    triggerHaptic, 
    activeMaisonId, 
    setActiveMaisonId, 
    createProduct, 
    fetchProducts,
    currentUser,
    updateProfile,
    authLogOut,
    addInstaStorySlide,
    switchActiveProfile,
    createNewProfile,
    activeProfile,
    userProfiles,
    wishlist,
    fetchWishlist,
    toggleWishlist,
    addToCart,
    isSubscribed,
    setSubscribed
  } = useStore();
  const personalProfile = userProfiles.find(p => p.type === "PERSONAL") || userProfiles.find(p => p.type !== "BUSINESS") || userProfiles[0];
  const brandProfiles = userProfiles.filter(p => p.type === "BUSINESS");
  
  const insets = useSafeAreaInsets();
  const [presetPosts, setPresetPosts] = useState(PRESET_POSTS);

  // 👥 Personal Details states
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [personalDob, setPersonalDob] = useState("2000-01-01");
  const [personalGender, setPersonalGender] = useState("Prefer Not to Say");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🔴 PROFILE EDITABLE STATES (PARITY WITH SCREENSHOT AND EXTENDED TO BE FULLY FUNCTIONAL)
  const [username, setUsername] = useState<string>(activeProfile?.username || activeMaisonId);
  const [logo, setLogo] = useState<string | null>(activeProfile?.logo || null);
  const [editLogo, setEditLogo] = useState<string | null>(activeProfile?.logo || null);
  const [profileName, setProfileName] = useState<string>(activeProfile?.name || (activeMaisonId === "aloksingh" ? "Alok Singh" : "Rare Raven"));
  const [category, setCategory] = useState<string>(activeProfile?.category || (activeMaisonId === "aloksingh" ? "Personal Profile" : "Clothing (Brand)"));

  // 🧠 Profile-Centric Logical Helpers
  const isPersonalProfile = category === "Personal Profile" || category?.toLowerCase().includes("personal");
  const isCreatorProfile = category?.toLowerCase().includes("creator") || category?.toLowerCase().includes("stylist") || category?.toLowerCase().includes("influencer") || category?.toLowerCase().includes("artist");
  const isBusinessProfile = !isPersonalProfile && !isCreatorProfile;
  const [bioText, setBioText] = useState<string>(
    activeProfile?.bioText || (activeMaisonId === "aloksingh" 
      ? "Founder of AURA. Brutalist Web Architect & Sovereign Creator."
      : "Streetwear + Gen Z Aesthetic\nBold Fits. Clean Planet.\nOversized fashion that slap — not the Earth.\nEco-conscious streetwear for every vibe.")
  );
  const [websiteLink, setWebsiteLink] = useState<string>(activeProfile?.websiteLink || (activeMaisonId === "aloksingh" ? "aisastra.com" : "clothikoo.in"));
  const [tags, setTags] = useState<string[]>(activeProfile?.tags || (activeMaisonId === "aloksingh" ? ["@aloksingh", "✦ Founder", "✦ AI Sastra"] : ["@rare_raven", "ⓕ Clothikoo", "✦ Ecom Expert"]));
  const [postsCount, setPostsCount] = useState<number>(activeProfile?.postsCount || (activeMaisonId === "aloksingh" ? 42 : 137));
  const [followersCount, setFollowersCount] = useState<number>(activeProfile?.followersCount || (activeMaisonId === "aloksingh" ? 880 : 80));
  const [followingCount, setFollowingCount] = useState<number>(activeProfile?.followingCount || (activeMaisonId === "aloksingh" ? 120 : 613));

  // Edit profile popup form values
  const [editUsername, setEditUsername] = useState<string>(activeProfile?.username || activeMaisonId);
  const [editProfileName, setEditProfileName] = useState<string>(activeProfile?.name || (activeMaisonId === "aloksingh" ? "Alok Singh" : "Rare Raven"));
  const [editCategory, setEditCategory] = useState<string>(activeProfile?.category || (activeMaisonId === "aloksingh" ? "Personal Profile" : "Clothing (Brand)"));
  const [editBioText, setEditBioText] = useState<string>(activeProfile?.bioText || (activeMaisonId === "aloksingh" ? "Founder of AURA. Brutalist Web Architect & Sovereign Creator." : "Streetwear + Gen Z Aesthetic\nBold Fits. Clean Planet.\nOversized fashion that slap — not the Earth.\nEco-conscious streetwear for every vibe."));
  const [editWebsiteLink, setEditWebsiteLink] = useState<string>(activeProfile?.websiteLink || (activeMaisonId === "aloksingh" ? "aisastra.com" : "clothikoo.in"));
  const [editPostsCount, setEditPostsCount] = useState<string>((activeProfile?.postsCount || (activeMaisonId === "aloksingh" ? 42 : 137)).toString());
  const [editFollowersCount, setEditFollowersCount] = useState<string>((activeProfile?.followersCount || (activeMaisonId === "aloksingh" ? 880 : 80)).toString());
  const [editFollowingCount, setEditFollowingCount] = useState<string>((activeProfile?.followingCount || (activeMaisonId === "aloksingh" ? 120 : 613)).toString());

  // UI state hooks
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeGridTab, setActiveGridTab] = useState<"posts" | "reels" | "products" | "collabs">("posts");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [availableMaisons, setAvailableMaisons] = useState<any[]>([]);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  // 👥 Followers/Following network list states
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkTab, setNetworkTab] = useState<"followers" | "following">("followers");
  const [networkUsers, setNetworkUsers] = useState([
    { id: "n1", username: "studywithjasmeet", name: "Jasmeet Kaur", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100", followed: false, isFollower: true },
    { id: "n2", username: "fitwithyashika_", name: "Yashika Sharma", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100", followed: true, isFollower: true },
    { id: "n3", username: "curator.alok", name: "Alok Sovereign", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100", followed: true, isFollower: false },
    { id: "n4", username: "priya_mehta", name: "Priya Mehta", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100", followed: false, isFollower: false },
    { id: "n5", username: "rohan_curator", name: "Rohan Kapoor", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100", followed: true, isFollower: true }
  ]);

  // ➕ Functional Modals State
  const [showPostModal, setShowPostModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // 🏛️ Unified Accounts Center States
  const [showAccountsCenter, setShowAccountsCenter] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [regionLockEnabled, setRegionLockEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [fediverseSharing, setFediverseSharing] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: "s1", device: "iPhone 17 Pro", location: "Bengaluru, India", active: true, icon: "smartphone" },
    { id: "s2", device: "Mac Studio (Atelier)", location: "Bengaluru, India", active: false, icon: "desktop" },
    { id: "s3", device: "iPad Pro", location: "Mumbai, India", active: false, icon: "tablet-portrait" }
  ]);

  // Post form states
  const [postTitle, setPostTitle] = useState("");
  const [postPrice, setPostPrice] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postImage, setPostImage] = useState("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400");
  const [postVibe, setPostVibe] = useState("Quiet Luxury");
  const [isPublishingStoryAndPost, setIsPublishingStoryAndPost] = useState(false);

  // Custom prompt states
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptDesc, setPromptDesc] = useState("");
  const [promptPlaceholder, setPromptPlaceholder] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [promptOnSubmit, setPromptOnSubmit] = useState<((val: string) => void) | null>(null);

  const showCustomPrompt = (title: string, desc: string, placeholder: string, onSubmit: (val: string) => void) => {
    setPromptTitle(title);
    setPromptDesc(desc);
    setPromptPlaceholder(placeholder);
    setPromptValue("");
    setPromptOnSubmit(() => onSubmit);
    setPromptVisible(true);
  };

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState("");
  const [generatedProduct, setGeneratedProduct] = useState<any>(null);
  const [aiTitle, setAiTitle] = useState("");
  const [aiPrice, setAiPrice] = useState("");

  // 📤 Share Profile states
  const [showShareProfileSheet, setShowShareProfileSheet] = useState(false);
  const [shareSearch, setShareSearch] = useState("");

  // Live simulator states
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [viewerCount, setViewerCount] = useState(1280);
  const [showLiveStats, setShowLiveStats] = useState(false);

  // Mock highlights
  const [highlights, setHighlights] = useState([
    { id: "h1", title: "Community", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150" },
    { id: "h2", title: "C", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150" },
    { id: "h3", title: "CLOTHIKOO", avatar: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=150" },
    { id: "h4", title: "Core", avatar: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=150" },
  ]);

  // Redirect to login if user is not authenticated dynamically
  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 1);
      return () => clearTimeout(timer);
    }
    setPersonalDob(currentUser.dob || "2000-01-01");
    setPersonalGender(currentUser.gender || "Prefer Not to Say");
    setPersonalEmail(currentUser.email || "");
    setPersonalPhone(currentUser.phone || "");
    setIsVerifiedUser(currentUser.isVerified || false);
    setBiometricEnabled(currentUser.biometricEnabled ?? true);
    setTwoFactorEnabled(currentUser.twoFactorEnabled ?? true);
    setRegionLockEnabled(currentUser.regionLockEnabled ?? false);
    setAlertsEnabled(currentUser.alertsEnabled ?? true);
    setFediverseSharing(currentUser.fediverseSharing ?? false);
  }, [currentUser]);

  // Synchronize local states instantly from activeProfile when it changes, preventing lag/flicker
  useEffect(() => {
    if (activeProfile) {
      setUsername(activeProfile.username || activeMaisonId);
      setProfileName(activeProfile.name || (activeProfile.username === "aloksingh" ? "Alok Singh" : "Rare Raven"));
      setCategory(activeProfile.category || (activeProfile.username === "aloksingh" ? "Personal Profile" : "Clothing (Brand)"));
      setLogo(activeProfile.logo || null);
      setEditLogo(activeProfile.logo || null);
      setBioText(activeProfile.bioText || "");
      setWebsiteLink(activeProfile.websiteLink || "");
      setTags(activeProfile.tags || []);
      setPostsCount(activeProfile.postsCount || 0);
      setFollowersCount(activeProfile.followersCount || 0);
      setFollowingCount(activeProfile.followingCount || 0);

      setEditUsername(activeProfile.username || activeMaisonId);
      setEditProfileName(activeProfile.name || (activeProfile.username === "aloksingh" ? "Alok Singh" : "Rare Raven"));
      setEditCategory(activeProfile.category || (activeProfile.username === "aloksingh" ? "Personal Profile" : "Clothing (Brand)"));
      setEditLogo(activeProfile.logo || null);
      setEditBioText(activeProfile.bioText || "");
      setEditWebsiteLink(activeProfile.websiteLink || "");
      setEditPostsCount((activeProfile.postsCount || 0).toString());
      setEditFollowersCount((activeProfile.followersCount || 0).toString());
      setEditFollowingCount((activeProfile.followingCount || 0).toString());
    }
  }, [activeProfile]);

  // Synchronize profile details from Next.js Neon PostgreSQL on mount
  useEffect(() => {
    if (!currentUser) return;
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/mobile/profile?maisonId=${activeMaisonId}`);
        const data = await res.json();
        if (data.success) {
          if (data.profile) {
            const p = data.profile;
            setUsername(p.username);
            setProfileName(p.profileName);
            setCategory(p.category);
            setBioText(p.bioText);
            setWebsiteLink(p.websiteLink);
            setTags(p.tags || []);
            setPostsCount(p.postsCount);
            setFollowersCount(p.followersCount);
            setFollowingCount(p.followingCount);
            setLogo(p.logo || null);
            setEditLogo(p.logo || null);
          }
          if (data.maisons) {
            setAvailableMaisons(data.maisons);
          }
        }
      } catch (e) {
        console.warn("Could not synchronize profile from database. Using offline fallback states.", e);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfileData();
    fetchProducts();
  }, [activeMaisonId, currentUser]);

  const handleSavePersonalDetails = async () => {
    if (!personalDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      triggerHaptic("heavy");
      Alert.alert("Incorrect Format", "Date of Birth must be in YYYY-MM-DD format.");
      return;
    }

    setIsUpdating(true);
    triggerHaptic("medium");

    try {
      const res = await updateProfile({
        userId: currentUser?.id,
        dob: personalDob,
        gender: personalGender,
        phone: personalPhone,
        email: personalEmail
      });

      if (res.success) {
        triggerHaptic("success");
        Alert.alert("Details Synchronized", "Your personal details have been safely registered inside Neon PostgreSQL.");
        setShowPersonalDetails(false);
      } else {
        triggerHaptic("heavy");
        Alert.alert("Synchronization Interrupted", res.error || "Failed to update profile.");
      }
    } catch (e: any) {
      triggerHaptic("heavy");
      Alert.alert("Connection Failure", e.message || "Failed to sync updates.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBiometric = async () => {
    const nextVal = !biometricEnabled;
    triggerHaptic("light");
    setBiometricEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, biometricEnabled: nextVal });
      if (!res.success) {
        setBiometricEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save biometric preference.");
      }
    }
  };

  const handleToggleTwoFactor = async () => {
    const nextVal = !twoFactorEnabled;
    triggerHaptic("light");
    setTwoFactorEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, twoFactorEnabled: nextVal });
      if (!res.success) {
        setTwoFactorEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save 2FA preference.");
      }
    }
  };

  const handleToggleRegionLock = async () => {
    const nextVal = !regionLockEnabled;
    triggerHaptic("light");
    setRegionLockEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, regionLockEnabled: nextVal });
      if (!res.success) {
        setRegionLockEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save node lock preference.");
      }
    }
  };

  const handleToggleAlerts = async () => {
    const nextVal = !alertsEnabled;
    triggerHaptic("light");
    setAlertsEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, alertsEnabled: nextVal });
      if (!res.success) {
        setAlertsEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save alert preference.");
      }
    }
  };

  const handleToggleFediverse = async () => {
    const nextVal = !fediverseSharing;
    triggerHaptic("light");
    setFediverseSharing(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, fediverseSharing: nextVal });
      if (!res.success) {
        setFediverseSharing(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save Fediverse preference.");
      }
    }
  };

  // Filter actual products curations from AURA database that belong to this brand!
  const maisonProducts = products.filter(
    p => p.maisonId === username || p.maison?.id === username || (username === "rare_raven" && (p.maisonId === "rare_raven" || p.maison?.id === "rare_raven" || !p.maisonId))
  );

  const handleEditProfilePress = () => {
    triggerHaptic("medium");
    setEditUsername(username);
    setEditProfileName(profileName);
    setEditCategory(category);
    setEditBioText(bioText);
    setEditWebsiteLink(websiteLink);
    setEditPostsCount(postsCount.toString());
    setEditFollowersCount(followersCount.toString());
    setEditFollowingCount(followingCount.toString());
    setEditLogo(logo);
    setShowEditModal(true);
  };

  const handleOpenWishlist = () => {
    const uid = currentUser?.id || activeProfile?.userId;
    if (uid && uid !== "patron_guest_sim") {
      fetchWishlist(uid);
    }
    triggerHaptic("medium");
    setShowWishlistModal(true);
  };

  const handleAddStory = async (url: string, storyOnly: boolean = false, customCaption?: string) => {
    const storyCaption = customCaption || `✨ ${activeProfile?.name || profileName || "Your"} Design Story uploaded dynamically!`;
    try {
      const res = await fetch(`${API_HOST}/api/mobile/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "cmpctrlqn000004ktfuqga0td",
          profileId: activeProfile?.id || null,
          url: url,
          thumbnail: url,
          caption: storyCaption,
          location: "Atelier Flagship",
          music: storyOnly ? "STORY_ONLY" : "Cinematic Luxury Waves"
        })
      });
      const data = await res.json();
      if (data.success) {
        // Add the story slide to the "Your story" bubble so it appears in the story ring immediately
        addInstaStorySlide({
          id: `story_${Date.now()}`,
          url: url,
          caption: storyCaption,
          isVideo: false
        });

        Alert.alert("Story Added", "Your visual story has been published to your profile!");
        // Refresh the visual feed
        useStore.getState().fetchFeed(true);
      } else {
        Alert.alert("Story Denied", "Failed to register story inside the database.");
      }
    } catch (e) {
      console.warn("Could not save story to database.", e);
      Alert.alert("Story Saved Offline", "Story caching active.");
    }
  };

  const handleUpdateLogo = async (url: string) => {
    try {
      setLogo(url);
      setEditLogo(url);
      const res = await fetch(`${API_HOST}/api/mobile/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maisonId: username || "aloksingh",
          oldMaisonId: username,
          profileName: profileName,
          category: category,
          bioText: bioText,
          websiteLink: websiteLink,
          logo: url,
          tags: tags,
          postsCount: postsCount,
          followersCount: followersCount,
          followingCount: followingCount
        })
      });
      const data = await res.json();
      if (data.success) {
        useStore.setState((state) => ({
          activeProfile: state.activeProfile ? { ...state.activeProfile, logo: url } : null,
          userProfiles: state.userProfiles.map(p => p.id === state.activeProfile?.id ? { ...p, logo: url } : p)
        }));
        Alert.alert("Profile Photo Updated", "Your brand/identity logo has been written to PostgreSQL!");
      } else {
        Alert.alert("Update Rejected", "Failed to update profile image in the database.");
      }
    } catch (e) {
      console.warn("Failed to synchronize avatar update.", e);
      Alert.alert("Photo Saved Locally", "Profile photo offline caching enabled.");
    }
  };

  const handleDownloadInformation = async () => {
    triggerHaptic("success");
    try {
      const dataBackup = {
        identityNode: {
          username: username,
          displayName: profileName,
          category: category,
          bio: bioText,
          website: websiteLink,
          tags: tags,
          clerkEmail: username === "aloksingh" ? "aloksingh@aisastra.com" : "maison-director@aura.luxury",
          auraScore: 9.9,
          nodeId: activeMaisonId.toUpperCase().slice(-6)
        },
        securityProtocol: {
          biometricAccess: biometricEnabled ? "ENABLED" : "DISABLED",
          sovereign2FA: twoFactorEnabled ? "ENABLED" : "DISABLED",
          geographicNodeLock: regionLockEnabled ? "ENABLED" : "DISABLED",
          sessionAlerts: alertsEnabled ? "ENABLED" : "DISABLED",
          fediverseBridging: fediverseSharing ? "ENABLED (ActivityPub)" : "DISABLED"
        },
        catalogLedger: maisonProducts.map(p => ({
          artifactId: p.id,
          sovereignId: p.sovereignId || `sha256_${p.id}`,
          title: p.title,
          retailPrice: p.price,
          vibeProfile: p.vibe,
          classification: p.type || "Fashion",
          arMetadata: p.arMetadata || {}
        }))
      };

      const backupString = JSON.stringify(dataBackup, null, 2);
      await Clipboard.setStringAsync(backupString);
      Alert.alert(
        "Sovereign Archive Exported",
        "Your unified account data, security protocols, and live catalog ledgers have been packed and copied to your native clipboard!\n\nYou can now paste and save this JSON archive anywhere."
      );
    } catch (e) {
      console.warn("Failed to generate data backup.", e);
      Alert.alert("Export Refused", "Failed to package account specifications.");
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    triggerHaptic("heavy");
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    Alert.alert(
      "Session Terminated",
      "OAuth credentials revoked. The target device has been signed out of your AURA identity node."
    );
  };

  const performDeleteAccount = async (confirmEmail: string) => {
    const userId = currentUser?.id;
    if (!userId) {
      Alert.alert("Error", "Sign in required to delete account.");
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/api/mobile/auth/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, confirmEmail: confirmEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        authLogOut();
        Alert.alert("Account Deleted", "Your account has been permanently removed.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
      } else {
        Alert.alert("Deletion Failed", data.error || "Could not delete account.");
      }
    } catch {
      Alert.alert("Network Error", "Could not reach the server.");
    }
  };

  const handleDeactivateMaison = () => {
    triggerHaptic("heavy");
    Alert.alert(
      "Account & Node Management",
      `Manage Maison '${profileName}' or permanently delete your AURA account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend Node",
          style: "destructive",
          onPress: () => {
            triggerHaptic("success");
            Alert.alert(
              "Identity Suspended",
              "Maison state suspended. Re-activate anytime from settings."
            );
          },
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                "Confirm Account Deletion",
                "Type your email to permanently delete your account.",
                (confirmEmail) => {
                  if (confirmEmail?.trim()) performDeleteAccount(confirmEmail);
                },
                "plain-text",
                currentUser?.email || ""
              );
            } else {
              Alert.alert(
                "Confirm Account Deletion",
                `Your account (${currentUser?.email || "signed-in user"}) will be permanently deleted.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Permanently",
                    style: "destructive",
                    onPress: () => {
                      if (currentUser?.email) performDeleteAccount(currentUser.email);
                    },
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const compressAndTranscodeImage = async (uri: string, mode: "story" | "avatar") => {
    try {
      const manipulateResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: mode === "story" ? { width: 1080 } : { width: 400 } }
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP }
      );
      return manipulateResult.uri;
    } catch (e) {
      console.warn("GPU-acceleration WebP compression aborted. Using raw image asset URI.", e);
      return uri; // Fallback to raw URI
    }
  };

  const handleLaunchImagePicker = async (mode: "story" | "avatar") => {
    triggerHaptic("medium");
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "AURA requires camera roll authorization to load custom luxury curation designs."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: mode === "story" ? [9, 16] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        triggerHaptic("success");

        // GPU-Accelerated WebP compression and scaling!
        const compressedUri = await compressAndTranscodeImage(selectedUri, mode);

        if (mode === "story") {
          Alert.alert(
            "Publishing Destination",
            "Would you like to publish this to your Feed as a Post as well, or upload as a Story only?",
            [
              {
                text: "Story Only",
                onPress: async () => {
                  triggerHaptic("medium");
                  await handleAddStory(compressedUri, true);
                }
              },
              {
                text: "Both (Story + Post)",
                onPress: () => {
                  triggerHaptic("medium");
                  setPostImage(compressedUri);
                  setIsPublishingStoryAndPost(true);
                  setPostTitle("");
                  setPostPrice("");
                  setPostDescription("");
                  setShowPostModal(true);
                }
              },
              {
                text: "Cancel",
                style: "cancel"
              }
            ]
          );
        } else {
          await handleUpdateLogo(compressedUri);
        }
      }
    } catch (error) {
      console.warn("Failed to open native camera roll:", error);
      Alert.alert("Picker Error", "Could not initialize the system media library.");
    }
  };

  const handleAvatarPress = () => {
    triggerHaptic("medium");
    Alert.alert(
      "Atelier Curation Mark",
      "Would you like to select custom media, or use a premium pre-designed marking templates?",
      [
        {
          text: "📸 Pick Story from Gallery",
          onPress: () => handleLaunchImagePicker("story")
        },
        {
          text: "🖼️ Pick Logo from Gallery",
          onPress: () => handleLaunchImagePicker("avatar")
        },
        {
          text: "Sustainable Design Presets",
          onPress: () => {
            triggerHaptic("success");
            Alert.alert(
              "Template Library",
              "Select a sustainable identity or vertical aesthetic:",
              [
                {
                  text: "1. Atelier Silk Drape (Story)",
                  onPress: () => handleAddStory("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400")
                },
                {
                  text: "2. Obsidian Brutalist Cuff (Story)",
                  onPress: () => handleAddStory("https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400")
                },
                {
                  text: "3. Identity: Sustainable Obsidian (Logo)",
                  onPress: () => handleUpdateLogo("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150")
                },
                {
                  text: "4. Identity: Neon AURA (Logo)",
                  onPress: () => handleUpdateLogo("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150")
                },
                {
                  text: "Cancel",
                  style: "cancel"
                }
              ]
            );
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    triggerHaptic("success");
    
    // Capture original state values to enable robust database rollbacks
    const originalUsername = username;
    const originalProfileName = profileName;
    const originalCategory = category;
    const originalBioText = bioText;
    const originalWebsiteLink = websiteLink;
    const originalPostsCount = postsCount;
    const originalFollowersCount = followersCount;
    const originalFollowingCount = followingCount;
    const originalLogo = logo;

    // Optimistic UI updates to ensure zero latency
    setUsername(editUsername);
    setActiveMaisonId(editUsername);
    setProfileName(editProfileName);
    setCategory(editCategory);
    setBioText(editBioText);
    setWebsiteLink(editWebsiteLink);
    setPostsCount(parseInt(editPostsCount) || 0);
    setFollowersCount(parseInt(editFollowersCount) || 0);
    setFollowingCount(parseInt(editFollowingCount) || 0);
    setLogo(editLogo);
    setShowEditModal(false);

    try {
      const res = await fetch(`${API_HOST}/api/mobile/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          maisonId: editUsername || "rare_raven",
          oldMaisonId: originalUsername,
          profileName: editProfileName,
          category: editCategory,
          bioText: editBioText,
          websiteLink: editWebsiteLink,
          logo: editLogo,
          tags: tags,
          postsCount: parseInt(editPostsCount) || 0,
          followersCount: parseInt(editFollowersCount) || 0,
          followingCount: parseInt(editFollowingCount) || 0
        })
      });
      
      const data = await res.json();
      if (data.success) {
        useStore.setState((state) => {
          const updatedProfile = state.activeProfile ? { 
            ...state.activeProfile, 
            logo: editLogo,
            username: editUsername,
            name: editProfileName,
            category: editCategory,
            website: editWebsiteLink
          } : null;
          return {
            activeProfile: updatedProfile,
            userProfiles: state.userProfiles.map(p => p.id === state.activeProfile?.id ? { 
              ...p, 
              logo: editLogo, 
              username: editUsername, 
              name: editProfileName,
              category: editCategory,
              website: editWebsiteLink
            } : p)
          };
        });
        Alert.alert("Profile Synchronized", "Sovereign identity parameters written securely to PostgreSQL!");
      } else {
        triggerHaptic("heavy");
        
        // Revert optimistic updates if backend failed
        setUsername(originalUsername);
        setActiveMaisonId(originalUsername);
        setProfileName(originalProfileName);
        setCategory(originalCategory);
        setBioText(originalBioText);
        setWebsiteLink(originalWebsiteLink);
        setPostsCount(originalPostsCount);
        setFollowersCount(originalFollowersCount);
        setFollowingCount(originalFollowingCount);
        setLogo(originalLogo);

        if (data.error === "USERNAME_TAKEN") {
          Alert.alert("Username Already Taken", "This brand username is already claimed by another node in the AURA ledger. Please select a unique identity.");
        } else {
          Alert.alert("Synchronization Refused", data.message || "Failed to commit sovereign profile adjustments.");
        }
      }
    } catch (e) {
      console.warn("Neon DB Sync failed. Offline parameters preserved.", e);
      Alert.alert("Profile Saved", "Saved locally (Offline Caching Active).");
    }
  };

  const handleAddHighlight = () => {
    triggerHaptic("medium");
    showCustomPrompt(
      "New Highlight",
      "Enter title for your new AURA highlight folder:",
      "e.g. Milan Curation",
      (title) => {
        if (!title || !title.trim()) return;
        triggerHaptic("success");
        const newHighlight = {
          id: `hl_${Date.now()}`,
          title: title.trim(),
          avatar: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=150"
        };
        setHighlights(prev => [...prev, newHighlight]);
      }
    );
  };

  const handleShareProfile = () => {
    triggerHaptic("medium");
    setShareSearch("");
    setShowShareProfileSheet(true);
  };

  const handleSwitchMaison = async (profileId: string) => {
    triggerHaptic("success");
    setShowSwitcherModal(false);
    try {
      const res = await switchActiveProfile(profileId);
      if (!res.success) {
        Alert.alert("Switch Failed", res.error || "Failed to switch profiles.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to switch profiles.");
    }
  };

  const handleAddBrandProfile = async () => {
    triggerHaptic("medium");
    showCustomPrompt(
      "Create New Brand Profile",
      "Enter unique username / Maison ID for your brand (lowercase, no spaces):",
      "e.g. obsidian-drape",
      (newId) => {
        if (!newId || !newId.trim()) return;
        const formattedId = newId.trim().toLowerCase().replace(/\s+/g, "-");
        
        showCustomPrompt(
          "Brand Display Name",
          "Enter display name for your new brand:",
          "e.g. Obsidian Drape",
          async (name) => {
            if (!name || !name.trim()) return;
            triggerHaptic("success");
            try {
              const res = await createNewProfile({
                userId: currentUser?.id,
                type: "BUSINESS",
                name: name.trim(),
                username: formattedId,
                category: "Clothing (Brand)",
                website: "aura.luxury"
              });
              if (res.success) {
                Alert.alert("Brand Hydrated", `Sovereign Maison '${name.trim()}' has been minted in PostgreSQL!`);
                setShowSwitcherModal(false);
              } else {
                Alert.alert("Minting Rejected", res.error || "Failed to register brand profile.");
              }
            } catch (e: any) {
              Alert.alert("Network Failure", e.message || "Failed to connect to AURA database cluster.");
            }
          }
        );
      }
    );
  };

  const handleAddPress = () => {
    triggerHaptic("light");
    showCustomPrompt(
      "Add Profile Tag",
      "Enter a custom handle tag (e.g. @rare_raven, ✦ Expert):",
      "e.g. ✦ Stylist",
      async (tag) => {
        if (tag && tag.trim()) {
          triggerHaptic("success");
          const newTags = [...tags, tag.trim()];
          setTags(newTags);

          // Save to Neon PostgreSQL
          try {
            await fetch(`${API_HOST}/api/mobile/profile`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                maisonId: username || "rare_raven",
                oldMaisonId: username,
                profileName: profileName,
                category: category,
                bioText: bioText,
                websiteLink: websiteLink,
                logo: logo,
                tags: newTags,
                postsCount: postsCount,
                followersCount: followersCount,
                followingCount: followingCount
              })
            });

            // Update activeProfile store state so it propagates immediately to dynamic profile screen
            useStore.setState((state) => {
              const updatedProfile = state.activeProfile ? { 
                ...state.activeProfile, 
                tags: newTags
              } : null;
              return {
                activeProfile: updatedProfile,
                userProfiles: state.userProfiles.map(p => p.id === state.activeProfile?.id ? { 
                  ...p, 
                  tags: newTags
                } : p)
              };
            });
          } catch (e) {
            console.warn("Failed to save tag in account profile view", e);
          }
        }
      }
    );
  };

  const handleRemoveTag = (tagToRemove: string) => {
    triggerHaptic("medium");
    Alert.alert(
      "Remove Tag",
      `Are you sure you want to remove the tag "${tagToRemove}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const newTags = tags.filter(t => t !== tagToRemove);
            setTags(newTags);
            triggerHaptic("success");

            // Save to database
            try {
              await fetch(`${API_HOST}/api/mobile/profile`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  maisonId: username || "rare_raven",
                  oldMaisonId: username,
                  profileName: profileName,
                  category: category,
                  bioText: bioText,
                  websiteLink: websiteLink,
                  logo: logo,
                  tags: newTags,
                  postsCount: postsCount,
                  followersCount: followersCount,
                  followingCount: followingCount
                })
              });

              useStore.setState((state) => {
                const updatedProfile = state.activeProfile ? { 
                  ...state.activeProfile, 
                  tags: newTags
                } : null;
                return {
                  activeProfile: updatedProfile,
                  userProfiles: state.userProfiles.map(p => p.id === state.activeProfile?.id ? { 
                    ...p, 
                    tags: newTags
                  } : p)
                };
              });
            } catch (e) {
              console.warn("Failed to remove tag in account profile view", e);
            }
          }
        }
      ]
    );
  };

  const handleRequestVerification = async () => {
    if (isVerifiedUser) {
      Alert.alert("Verified Node", "This identity node is already verified via AURA cryptographic keys.");
      return;
    }
    triggerHaptic("medium");
    Alert.alert(
      "Request Verification Badge",
      "Would you like to authorize AURA key verification to claim your blue checkmark badge?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify Node",
          onPress: async () => {
            setIsUpdating(true);
            try {
              const res = await updateProfile({
                userId: currentUser?.id,
                isVerified: true
              });
              if (res.success) {
                setIsVerifiedUser(true);
                triggerHaptic("success");
                Alert.alert("Verification Minted", "Your identity node is now cryptographic-trust verified!");
              } else {
                Alert.alert("Verification Failed", res.error || "Could not complete verification request.");
              }
            } catch (e) {
              Alert.alert("Verification Error", "Database synchronization failed.");
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  // 📸 Product/Post publishing handler
  const handlePublishPost = async () => {
    // 👥 PERSONAL PROFILE LOOKBOOK POSTING LOGIC
    if (category === "Personal Profile") {
      if (!postTitle.trim()) {
        Alert.alert("Missing Caption", "Please enter a caption for your look.");
        return;
      }
      triggerHaptic("success");
      
      const newPost = {
        id: `post_${Date.now()}`,
        url: postImage,
        isVideo: false
      };

      setPresetPosts(prev => [newPost, ...prev]);
      setPostsCount(prev => prev + 1);
      
      if (isPublishingStoryAndPost) {
        await handleAddStory(postImage, false, postTitle);
        setIsPublishingStoryAndPost(false);
      }

      Alert.alert(
        "Look Posted",
        "Your new aesthetic look has been published to your personal lookbook grid!"
      );

      // Reset fields
      setPostTitle("");
      setShowPostModal(false);
      return;
    }

    // 🏛️ BUSINESS / BRAND MAISON PRODUCT PUBLISHING LOGIC
    if (!postTitle.trim() || !postPrice.trim()) {
      Alert.alert("Missing Parameters", "Please enter title and price for curating your AURA artifact.");
      return;
    }
    triggerHaptic("success");
    const parsedPrice = parseFloat(postPrice) || 0;
    
    // Create new AURA product artifact structure
    const newProduct = {
      id: `p_${Date.now()}`,
      title: postTitle.trim(),
      price: parsedPrice,
      vibe: postVibe,
      images: [postImage],
      description: postDescription.trim() || "Dynamic high-fidelity physical design artifact.",
      maisonId: username,
      maison: { id: username, name: profileName },
      auraScore: 9.8,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };

    // Optimistically add to store state
    const success = await createProduct({
      title: postTitle.trim(),
      price: parsedPrice,
      vibe: postVibe,
      images: [postImage],
      description: postDescription.trim(),
      maisonId: username
    });

    // In offline fallback mode, still append to local memory to keep user experience responsive
    useStore.setState((state) => ({ products: [newProduct, ...state.products] }));
    setPostsCount(prev => prev + 1);

    if (isPublishingStoryAndPost) {
      await handleAddStory(postImage, false, `${postTitle} - ₹${parsedPrice.toLocaleString()}`);
      setIsPublishingStoryAndPost(false);
    }

    Alert.alert(
      "Artifact Curated",
      "Your brand physical curation has been hydrated to PostgreSQL and live catalog grids!"
    );

    // Reset fields
    setPostTitle("");
    setPostPrice("");
    setPostDescription("");
    setShowPostModal(false);
  };

  // 📡 Live broadcast simulator
  const startLiveSimulation = () => {
    setLiveComments([]);
    setViewerCount(840);
    
    const mockFeed = [
      { id: "c1", user: "Julian Rossi", text: "this drape is incredible!" },
      { id: "c2", user: "Gucci Atelier", text: "Outstanding mesh rendering" },
      { id: "c3", user: "AURA Core", text: "Dynamic coordinates verify clean trace" },
      { id: "c4", user: "Sovereign Node", text: "copping the titanium cyber-vest immediately!" },
      { id: "c5", user: "Zenith Design", text: "AURA score is off the charts ✦" }
    ];

    // Push comments dynamically
    mockFeed.forEach((comment, i) => {
      setTimeout(() => {
        setLiveComments(prev => [...prev, comment]);
        setViewerCount(count => count + Math.floor(Math.random() * 50) + 10);
      }, (i + 1) * 2000);
    });
  };

  // 🌌 AI generative curation simulator
  const handleStartAIGeneration = () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Design Intent Missing", "Type a prompt describing your fashion blueprint (e.g. brutalist metal corset).");
      return;
    }

    triggerHaptic("medium");
    setAiGenerating(true);
    setAiProgress(0);
    setGeneratedProduct(null);

    const steps = [
      { p: 15, s: "Initializing deep synthesis nodes..." },
      { p: 35, s: "Generating high-dimensional brutalist wireframe mesh..." },
      { p: 60, s: "Synthesizing dynamic linen/matte materials..." },
      { p: 85, s: "Raytracing brutalist ambient occlusion shadows..." },
      { p: 100, s: "Generative synthesis complete!" }
    ];

    steps.forEach((stepObj, i) => {
      setTimeout(() => {
        setAiProgress(stepObj.p);
        setAiStep(stepObj.s);

        if (stepObj.p === 100) {
          triggerHaptic("success");
          setAiGenerating(false);
          
          // Generate a stunning matching product preset
          const aiImagePreset = [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400"
          ][Math.floor(Math.random() * 3)];

          setGeneratedProduct({
            title: "Gen-AI " + aiPrompt.trim().replace(/\b\w/g, c => c.toUpperCase()),
            price: 185000,
            image: aiImagePreset,
            vibe: "Cyberpunk",
            description: `A unique, dynamically synthesized fashion piece curated by AURA-AI matching design signature: '${aiPrompt.trim()}'`
          });
          setAiTitle("Gen-AI " + aiPrompt.trim().replace(/\b\w/g, c => c.toUpperCase()));
          setAiPrice("185000");
        }
      }, (i + 1) * 1500);
    });
  };

  // 🚀 Mint AI Generated Product
  const handleMintGeneratedProduct = async () => {
    if (!aiTitle.trim() || !aiPrice.trim()) return;
    triggerHaptic("success");

    const parsedPrice = parseFloat(aiPrice) || 185000;
    const newProduct = {
      id: `p_ai_${Date.now()}`,
      title: aiTitle.trim(),
      price: parsedPrice,
      vibe: "Cyberpunk",
      images: [generatedProduct.image],
      description: generatedProduct.description,
      maisonId: username,
      maison: { id: username, name: profileName },
      auraScore: 9.9,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };

    // Hydrate to PostgreSQL
    await createProduct({
      title: aiTitle.trim(),
      price: parsedPrice,
      vibe: "Cyberpunk",
      images: [generatedProduct.image],
      description: generatedProduct.description,
      maisonId: username
    });

    // Offline append
    useStore.setState((state) => ({ products: [newProduct, ...state.products] }));

    Alert.alert(
      "AI Curation Minted",
      `Dynamic design '${aiTitle.trim()}' minted successfully in Neon PostgreSQL cluster!`
    );

    // Reset & Close
    setAiPrompt("");
    setGeneratedProduct(null);
    setShowAIModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080415" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 🏔️ IMMERSIVE CANVAS HEADER ROW - NO RIGID STRIP */}
          <View style={styles.canvasHeaderRow}>
            <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowCreateModal(true); }}>
              <Lucide name="add-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.canvasHeaderDropdown} onPress={() => { triggerHaptic("medium"); setShowSwitcherModal(true); }}>
              <Text style={styles.canvasHeaderUsername}>{username}</Text>
              {isVerifiedUser && (
                <Lucide name="checkmark-circle" size={16} color="#00f5ff" style={{ marginLeft: 4 }} />
              )}
              <Lucide name="chevron-down-outline" size={14} color="#ffffff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>

            <View style={styles.canvasHeaderRightIcons}>
              <TouchableOpacity 
                style={{ marginRight: 16 }} 
                onPress={handleOpenWishlist}
              >
                <Lucide name="heart-outline" size={26} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ marginRight: 16 }} 
                onPress={() => { 
                  triggerHaptic("light"); 
                  Alert.alert(
                    "Unified Crossover",
                    "Cross over seamlessly to your connected social channels or live web flagship showroom:",
                    [
                      {
                        text: "🕸️ Open Web flagship Store",
                        onPress: () => {
                          triggerHaptic("success");
                          const webUrl = `${API_HOST}/maison/${username}`;
                          Linking.openURL(webUrl);
                        }
                      },
                      {
                        text: "🧵 Open AURA Threads Hub",
                        onPress: () => {
                          triggerHaptic("success");
                          Linking.openURL("https://threads.net");
                        }
                      },
                      {
                        text: "Cancel",
                        style: "cancel"
                      }
                    ]
                  );
                }}
              >
                <Lucide name="logo-instagram" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { triggerHaptic("medium"); setShowAccountsCenter(true); }}>
                <Lucide name="menu-outline" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
            
            {/* 🔴 PROFILE SUMMARY AND STATS BLOCK */}
            <View style={styles.profileSection}>
              <View style={styles.avatarStatsRow}>
                {/* Avatar with "Can't decide..." bubble and bottom "+" badge */}
                <View style={styles.avatarGroup}>
                  <View style={styles.bubbleOverlay}>
                    <Text style={styles.bubbleText}>Can't decide...</Text>
                    <View style={styles.bubblePointer} />
                  </View>
                  <LinearGradient
                    colors={["#fb923c", "#d946ef", "#8b5cf6"]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View style={{
                      width: 82,
                      height: 82,
                      borderRadius: 41,
                      backgroundColor: "#080415",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <View style={{
                        width: 76,
                        height: 76,
                        borderRadius: 38,
                        overflow: "hidden",
                        backgroundColor: "#080415",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {logo ? (
                          <Image 
                            source={{ uri: logo }} 
                            style={{ width: "100%", height: "100%", borderRadius: 38 }} 
                          />
                        ) : currentUser?.avatar ? (
                          <Image 
                            source={{ uri: currentUser.avatar }} 
                            style={{ width: "100%", height: "100%", borderRadius: 38 }} 
                          />
                        ) : (
                          <Text style={styles.avatarInitial}>
                            {(profileName || activeProfile?.name || currentUser?.name || username || "R")[0]?.toUpperCase()}
                          </Text>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                  <TouchableOpacity style={styles.avatarPlusBadge} onPress={handleAvatarPress}>
                    <Lucide name="add" size={13} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Stats Columns */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{formatCompactNumber(postsCount)}</Text>
                    <Text style={styles.statLabel}>posts</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.statItem} 
                    onPress={() => {
                      triggerHaptic("light");
                      setNetworkTab("followers");
                      setShowNetworkModal(true);
                    }}
                  >
                    <Text style={styles.statNumber}>{formatCompactNumber(followersCount)}</Text>
                    <Text style={styles.statLabel}>followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.statItem} 
                    onPress={() => {
                      triggerHaptic("light");
                      setNetworkTab("following");
                      setShowNetworkModal(true);
                    }}
                  >
                    <Text style={styles.statNumber}>{formatCompactNumber(followingCount)}</Text>
                    <Text style={styles.statLabel}>following</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🔴 BIO DESCRIPTION & WEBSITES */}
              <View style={styles.bioContainer}>
                <Text style={styles.bioBrandName}>{profileName}</Text>
                <Text style={styles.bioCategory}>{category}</Text>
                
                <Text style={styles.bioDescriptionText}>{bioText}</Text>
                
                {websiteLink ? (
                  <TouchableOpacity 
                    style={styles.websiteRow} 
                    onPress={() => { 
                      triggerHaptic("light"); 
                      try {
                        const url = websiteLink.trim().startsWith("http") ? websiteLink.trim() : "https://" + websiteLink.trim();
                        Linking.openURL(url);
                      } catch (e) {
                        Alert.alert("URL Error", "Failed to cross over to the target URL.");
                      }
                    }}
                  >
                    <Lucide name="link-outline" size={15} color="#00f5ff" />
                    <Text style={styles.websiteText}>
                      {websiteLink} <Text style={{ color: "#8e8e8e", fontWeight: "normal" }}>and 1 more</Text>
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Threads pill badge exactly matching Instagram screenshot */}
                <TouchableOpacity 
                  style={styles.threadsPill} 
                  onPress={() => { triggerHaptic("light"); Alert.alert("Threads Node", `Syncing to @${username} Threads coordinates...`); }}
                >
                  <Text style={styles.threadsIcon}>@</Text>
                  <Text style={styles.threadsPillText}>
                    {username} <Text style={{ color: "rgba(255,255,255,0.4)" }}>2 new •</Text>
                  </Text>
                </TouchableOpacity>

                {/* Overlapping followed-by avatars list exactly matching Instagram screenshot */}
                <View style={styles.socialProofRow}>
                  <View style={styles.socialProofAvatars}>
                    <Image source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80" }} style={[styles.socialProofAvatar, { zIndex: 3 }]} />
                    <Image source={{ uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80" }} style={[styles.socialProofAvatar, { zIndex: 2, marginLeft: -10 }]} />
                    <Image source={{ uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=80" }} style={[styles.socialProofAvatar, { zIndex: 1, marginLeft: -10 }]} />
                  </View>
                  <Text style={styles.socialProofText} numberOfLines={1}>
                    Followed by <Text style={styles.socialProofBold}>studywithjasmeet</Text>, <Text style={styles.socialProofBold}>fitwithyashika_</Text> and <Text style={styles.socialProofBold}>23 others</Text>
                  </Text>
                </View>
              </View>

              {/* 🔴 HORIZONTAL TAG BADGES */}
              <View style={styles.tagsContainer}>
                {tags.map((tagItem, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.tagBadge}
                    onPress={() => handleRemoveTag(tagItem)}
                  >
                    <Text style={styles.tagBadgeText}>{tagItem}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addTagBtn} onPress={handleAddPress}>
                  <Lucide name="add" size={12} color="#00f5ff" />
                  <Text style={styles.addTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🔴 PROFESSIONAL DASHBOARD (CREATOR & BUSINESS ONLY) */}
            {!isPersonalProfile && (
              <TouchableOpacity 
                style={styles.dashboardCard}
                onPress={() => { 
                  triggerHaptic("medium"); 
                  if (isCreatorProfile) {
                    Alert.alert(
                      "Creator Insights", 
                      "AURA Creator Influence Matrix:\n\n• Aura Score: 9.8 (Top 1.2%)\n• Direct Commission Earned: ₹24,800\n• Brand Deal Campaign: Atelier Paris (Pending Approval)\n• Viral Rank: #42 Fashion Stylist"
                    );
                  } else {
                    Alert.alert(
                      "Professional Dashboard", 
                      "AURA Brand Merchant analytics:\n\n• Total Sales: ₹1,85,200\n• Active Inventory Items: 6 boutique items\n• Payouts: ₹85,200 (Escrow Lock settled)\n• Active Promotions: Quiet Luxury Campaign"
                    );
                  }
                }}
              >
                <View>
                  <Text style={styles.dashboardTitle}>Professional dashboard</Text>
                  <Text style={styles.dashboardSubtitle}>
                    {isCreatorProfile ? "Creator analytics & affiliate earnings" : "Brand tools & retail catalog metrics"}
                  </Text>
                </View>
                <View style={styles.dashboardIndicatorDot} />
              </TouchableOpacity>
            )}

            {/* 🔴 ACTION BUTTONS (EDIT PROFILE, SHARE PROFILE, SPONSORSHIPS) */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleEditProfilePress}>
                <Text style={styles.actionBtnText}>Edit profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={handleShareProfile}>
                <Text style={styles.actionBtnText}>Share profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: "rgba(0,245,255,0.08)", borderWidth: 1, borderColor: "rgba(0,245,255,0.25)" }]} 
                onPress={() => {
                  triggerHaptic("medium");
                  router.push("/maison/business-suite");
                }}
              >
                <Text style={[styles.actionBtnText, { color: "#00f5ff" }]}>AURA Suite</Text>
              </TouchableOpacity>

              {(isCreatorProfile || isBusinessProfile) && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }]} 
                  onPress={() => { triggerHaptic("medium"); router.push("/sponsorships" as any); }}
                >
                  <Text style={styles.actionBtnText}>Sponsors</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 🛡️ AURA VAULT SUBSCRIPTION TEST CARD */}
            <View style={{
              marginHorizontal: 24,
              marginTop: 16,
              marginBottom: 8,
              padding: 16,
              borderRadius: 20,
              backgroundColor: "rgba(11, 7, 30, 0.65)",
              borderWidth: 1,
              borderColor: isSubscribed ? "rgba(0, 245, 255, 0.45)" : "rgba(255, 255, 255, 0.08)",
              shadowColor: "#00f5ff",
              shadowOpacity: isSubscribed ? 0.15 : 0,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: 4,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>AURA VAULT MEMBER</Text>
                <View style={{ 
                  backgroundColor: isSubscribed ? "rgba(0, 245, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: isSubscribed ? "#00f5ff" : "rgba(255,255,255,0.15)"
                }}>
                  <Text style={{ color: isSubscribed ? "#00f5ff" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }}>
                    {isSubscribed ? "PREMIUM ⚡" : "FREE 📁"}
                  </Text>
                </View>
              </View>
              <Text style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: 12, lineHeight: 16, marginBottom: 12 }}>
                {isSubscribed 
                  ? "You have full access to direct search, categories, and immediate ledger checkout." 
                  : "Subscribe to unlock direct e-commerce catalog features and exclusive drops."}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: isSubscribed ? "rgba(255, 59, 48, 0.15)" : "#00f5ff",
                  borderWidth: isSubscribed ? 1 : 0,
                  borderColor: isSubscribed ? "#FF3B30" : "transparent",
                  borderRadius: 12,
                  height: 38,
                  justifyContent: "center",
                  alignItems: "center"
                }}
                onPress={() => {
                  triggerHaptic("medium");
                  setSubscribed(!isSubscribed);
                  Alert.alert(
                    "AURA Subscription Sync", 
                    isSubscribed 
                      ? "Premium subscription cancelled. Vault store features locked." 
                      : "Premium subscription activated! Vault store features unlocked."
                  );
                }}
              >
                <Text style={{ 
                  color: isSubscribed ? "#FF3B30" : "#000000", 
                  fontSize: 12, 
                  fontWeight: "bold",
                  letterSpacing: 0.5
                }}>
                  {isSubscribed ? "CANCEL VAULT MEMBERSHIP" : "UPGRADE TO VAULT MEMBER (₹299/mo)"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🛡️ AURA VAULT SUBSCRIPTION TEST CARD */}
            <View style={{
              marginHorizontal: 24,
              marginTop: 16,
              marginBottom: 8,
              padding: 16,
              borderRadius: 20,
              backgroundColor: "rgba(11, 7, 30, 0.65)",
              borderWidth: 1,
              borderColor: isSubscribed ? "rgba(0, 245, 255, 0.45)" : "rgba(255, 255, 255, 0.08)",
              shadowColor: "#00f5ff",
              shadowOpacity: isSubscribed ? 0.15 : 0,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: 4,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>AURA VAULT MEMBER</Text>
                <View style={{ 
                  backgroundColor: isSubscribed ? "rgba(0, 245, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: isSubscribed ? "#00f5ff" : "rgba(255,255,255,0.15)"
                }}>
                  <Text style={{ color: isSubscribed ? "#00f5ff" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }}>
                    {isSubscribed ? "PREMIUM ⚡" : "FREE 📁"}
                  </Text>
                </View>
              </View>
              <Text style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: 12, lineHeight: 16, marginBottom: 12 }}>
                {isSubscribed 
                  ? "You have full access to direct search, categories, and immediate ledger checkout." 
                  : "Subscribe to unlock direct e-commerce catalog features and exclusive drops."}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: isSubscribed ? "rgba(255, 59, 48, 0.15)" : "#00f5ff",
                  borderWidth: isSubscribed ? 1 : 0,
                  borderColor: isSubscribed ? "#FF3B30" : "transparent",
                  borderRadius: 12,
                  height: 38,
                  justifyContent: "center",
                  alignItems: "center"
                }}
                onPress={() => {
                  triggerHaptic("medium");
                  setSubscribed(!isSubscribed);
                  Alert.alert(
                    "AURA Subscription Sync", 
                    isSubscribed 
                      ? "Premium subscription cancelled. Vault store features locked." 
                      : "Premium subscription activated! Vault store features unlocked."
                  );
                }}
              >
                <Text style={{ 
                  color: isSubscribed ? "#FF3B30" : "#000000", 
                  fontSize: 12, 
                  fontWeight: "bold",
                  letterSpacing: 0.5
                }}>
                  {isSubscribed ? "CANCEL VAULT MEMBERSHIP" : "UPGRADE TO VAULT MEMBER (₹299/mo)"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🔴 INTERACTIVE HIGHLIGHTS ROW */}
            <View style={styles.highlightsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
                
                {/* "+" New Button */}
                <TouchableOpacity style={styles.highlightItem} onPress={handleAddHighlight}>
                  <View style={styles.highlightPlusCircle}>
                    <Lucide name="add" size={24} color="#ffffff" />
                  </View>
                  <Text style={styles.highlightTitle}>New</Text>
                </TouchableOpacity>

                {/* Highlights List */}
                {highlights.map((hl) => (
                  <TouchableOpacity 
                    key={hl.id} 
                    style={styles.highlightItem} 
                    onPress={() => { triggerHaptic("light"); Alert.alert("Highlight folder", `Auditing story slides inside "${hl.title}" highlights folder.`); }}
                  >
                    <View style={styles.highlightCircle}>
                      <Image source={{ uri: hl.avatar }} style={styles.highlightImage} />
                    </View>
                    <Text style={styles.highlightTitle} numberOfLines={1}>{hl.title}</Text>
                  </TouchableOpacity>
                ))}

              </ScrollView>
            </View>

            {/* 🔮 CREATOR SCORE INFLUENCE BANNER (CREATOR ONLY) */}
            {isCreatorProfile && (
              <View style={styles.creatorBannerCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={styles.auraBadgeCircle}>
                    <Text style={styles.auraBadgeText}>AURA</Text>
                  </View>
                  <View>
                    <Text style={styles.creatorBannerTitle}>Creator Rank • Global #42</Text>
                    <Text style={styles.creatorBannerScore}>Aura Score: 9.8/10 ✦ High Influence</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.creatorBadgeBtn}
                  onPress={() => { triggerHaptic("medium"); Alert.alert("AURA Score System", "Calculated hourly by matching engagement velocity, purchase triggers, and lookbook curations."); }}
                >
                  <Text style={styles.creatorBadgeBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 🔴 GRID TAB BAR (POSTS, REELS, PRODUCTS, COLLABS) */}
            <View style={styles.gridTabBar}>
              {[
                { tab: "posts", icon: "grid-outline" },
                { tab: "reels", icon: "film-outline" },
                { tab: "products", icon: "bag-handle-outline" },
                { tab: "collabs", icon: "repeat-outline" }
              ].map((item) => (
                <TouchableOpacity 
                   key={item.tab} 
                   style={[styles.gridTabBtn, activeGridTab === item.tab && styles.gridTabBtnActive]} 
                   onPress={() => { triggerHaptic("light"); setActiveGridTab(item.tab as any); }}
                >
                  <Lucide 
                     name={item.icon as any} 
                     size={22} 
                     color={activeGridTab === item.tab ? "#00f5ff" : "rgba(255,255,255,0.4)"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* 🔴 GRID OF PRODUCTS / PERSONAL POSTS */}
            <View style={styles.gridWrapper}>
              {activeGridTab === "posts" && (
                // 👥 Posts lookbook - photo items
                presetPosts.filter((post: any) => !post.isVideo).map((post: any) => (
                  <TouchableOpacity 
                    key={post.id} 
                    style={styles.gridImageContainer}
                    onPress={() => { triggerHaptic("medium"); Alert.alert("Look Curation", "Opening premium look detail view..."); }}
                  >
                    <Image source={{ uri: post.url }} style={styles.gridPostImage} />
                  </TouchableOpacity>
                ))
              )}

              {activeGridTab === "reels" && (
                // 🎥 Reels - video items
                presetPosts.filter((post: any) => post.isVideo).map((post: any) => (
                  <TouchableOpacity 
                    key={post.id} 
                    style={styles.gridImageContainer}
                    onPress={() => { triggerHaptic("medium"); Alert.alert("Reel Curation", "Playing high-fidelity visual reel..."); }}
                  >
                    <Image source={{ uri: post.url }} style={styles.gridPostImage} />
                    <View style={styles.gridVideoBadge}>
                      <Lucide name="play" size={11} color="#ffffff" />
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {activeGridTab === "products" && (
                // 🏛️ storefront products with price tag overlays
                maisonProducts.length > 0 ? (
                  maisonProducts.map((product) => {
                    const imageUrl = product.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400";
                    return (
                      <TouchableOpacity 
                        key={product.id} 
                        style={styles.gridImageContainer}
                        onPress={() => { triggerHaptic("medium"); router.push(`/product/${product.id}` as any); }}
                      >
                        <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                        <View style={styles.gridPriceBadge}>
                          <Text style={styles.gridPriceText}>₹{product.price?.toLocaleString()}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  // Fallback storefront products mock grid
                  [
                    { id: "fp1", price: 185000, img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400" },
                    { id: "fp2", price: 245000, img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400" },
                    { id: "fp3", price: 340000, img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400" }
                  ].map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.gridImageContainer}
                      onPress={() => triggerHaptic("medium")}
                    >
                      <Image source={{ uri: product.img }} style={styles.gridPostImage} />
                      <View style={styles.gridPriceBadge}>
                        <Text style={styles.gridPriceText}>₹{product.price.toLocaleString()}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )
              )}

              {activeGridTab === "collabs" && (
                // 🔮 Collabs - affiliate commission lookbook
                maisonProducts.length > 0 ? (
                  maisonProducts.map((product) => {
                    const imageUrl = product.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400";
                    return (
                      <TouchableOpacity 
                        key={product.id} 
                        style={styles.gridImageContainer}
                        onPress={() => { triggerHaptic("medium"); router.push(`/product/${product.id}` as any); }}
                      >
                        <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                        <View style={styles.gridAffiliateBadge}>
                          <Text style={styles.gridAffiliateText}>10% Commission</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  // Fallback collabs affiliate lookbook grid
                  [
                    { id: "fc1", rate: "10% Commission", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400" },
                    { id: "fc2", rate: "12% Commission", img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=400" },
                    { id: "fc3", rate: "8% Commission", img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=400" }
                  ].map((collab) => (
                    <TouchableOpacity
                      key={collab.id}
                      style={styles.gridImageContainer}
                      onPress={() => triggerHaptic("medium")}
                    >
                      <Image source={{ uri: collab.img }} style={styles.gridPostImage} />
                      <View style={styles.gridAffiliateBadge}>
                        <Text style={styles.gridAffiliateText}>{collab.rate}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )
              )}
            </View>

          </ScrollView>

      </SafeAreaView>

      {/* 👥 FOLLOWERS / FOLLOWING NETWORK LIST MODAL */}
      <Modal
        visible={showNetworkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.networkModalContainer}>
            <View style={styles.modalHeaderBar}>
              <View style={styles.modalIndicator} />
            </View>
            
            {/* Tab selector */}
            <View style={styles.networkTabContainer}>
              <TouchableOpacity 
                style={[styles.networkTabItem, networkTab === "followers" && styles.networkTabItemActive]} 
                onPress={() => { triggerHaptic("light"); setNetworkTab("followers"); }}
              >
                <Text style={[styles.networkTabText, networkTab === "followers" && styles.networkTabTextActive]}>
                  {formatCompactNumber(followersCount)} Followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.networkTabItem, networkTab === "following" && styles.networkTabItemActive]} 
                onPress={() => { triggerHaptic("light"); setNetworkTab("following"); }}
              >
                <Text style={[styles.networkTabText, networkTab === "following" && styles.networkTabTextActive]}>
                  {formatCompactNumber(followingCount)} Following
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={networkUsers.filter(u => networkTab === "followers" ? u.isFollower : !u.isFollower)}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <View style={styles.networkUserRow}>
                  <View style={styles.networkUserLeft}>
                    <Image source={{ uri: item.avatar }} style={styles.networkUserAvatar} />
                    <View>
                      <Text style={styles.networkUserName}>{item.name}</Text>
                      <Text style={styles.networkUserHandle}>@{item.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.networkFollowBtn,
                      item.followed ? styles.networkFollowBtnOutline : styles.networkFollowBtnPrimary
                    ]}
                    onPress={() => {
                      triggerHaptic("medium");
                      setNetworkUsers(prev => prev.map(u => u.id === item.id ? { ...u, followed: !u.followed } : u));
                    }}
                  >
                    <Text style={[styles.networkFollowBtnText, item.followed && { color: "#fff" }]}>
                      {item.followed ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => { triggerHaptic("light"); setShowNetworkModal(false); }}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔴 FULLY FUNCTIONAL PROFILE EDITING MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Nav Bar */}
          <View style={styles.editModalNavBar}>
            <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowEditModal(false); }}>
              <Text style={styles.editModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.editModalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
            {/* Circular Logo Editor */}
            <View style={styles.editModalAvatarContainer}>
              <View style={styles.editModalAvatarCircle}>
                {logo ? (
                  <Image 
                    source={{ uri: logo }} 
                    style={{ width: "100%", height: "100%", borderRadius: 40 }} 
                  />
                ) : (
                  <Text style={styles.editModalAvatarText}>{profileName[0]?.toUpperCase() || "R"}</Text>
                )}
              </View>
              <TouchableOpacity onPress={handleAvatarPress}>
                <Text style={styles.editModalChangeAvatarText}>Change profile photo</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput 
                style={styles.inputField} 
                value={editUsername} 
                onChangeText={setEditUsername}
                placeholder="e.g. rare_raven"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput 
                style={styles.inputField} 
                value={editProfileName} 
                onChangeText={setEditProfileName}
                placeholder="e.g. Rare Raven"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput 
                style={styles.inputField} 
                value={editCategory} 
                onChangeText={setEditCategory}
                placeholder="e.g. Clothing (Brand)"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput 
                style={[styles.inputField, { height: 80, textAlignVertical: "top" }]} 
                value={editBioText} 
                onChangeText={setEditBioText}
                multiline
                numberOfLines={4}
                placeholder="Streetwear + Gen Z Aesthetic..."
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput 
                style={styles.inputField} 
                value={editWebsiteLink} 
                onChangeText={setEditWebsiteLink}
                placeholder="e.g. clothikoo.in"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.editorDividerRow}>
              <Text style={styles.editorSectionTitle}>Stats Calibration</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Posts Count</Text>
              <TextInput 
                style={styles.inputField} 
                value={editPostsCount} 
                onChangeText={setEditPostsCount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Followers Count</Text>
              <TextInput 
                style={styles.inputField} 
                value={editFollowersCount} 
                onChangeText={setEditFollowersCount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Following Count</Text>
              <TextInput 
                style={styles.inputField} 
                value={editFollowingCount} 
                onChangeText={setEditFollowingCount}
                keyboardType="numeric"
              />
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* 🏛️ INSTAGRAM-STYLE MULTI-PROFILE SWITCHER BOTTOM SHEET */}
      <Modal
        visible={showSwitcherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSwitcherModal(false)}
      >
        <TouchableOpacity 
          style={styles.switcherBackdrop} 
          activeOpacity={1} 
          onPress={() => setShowSwitcherModal(false)}
        >
          <View style={styles.switcherPanel}>
            <View style={styles.switcherHandle} />
            <Text style={styles.switcherTitle}>Switch Identity Profile</Text>
            
            <ScrollView style={styles.switcherList} showsVerticalScrollIndicator={false}>
              {userProfiles.map((m) => {
                const isActive = m.id === activeProfile?.id;
                const initials = m.name ? m.name.substring(0, 2).toUpperCase() : (m.username || "").substring(0, 2).toUpperCase();
                
                return (
                  <TouchableOpacity 
                    key={m.id} 
                    style={[styles.switcherItem, isActive && styles.switcherItemActive]}
                    onPress={() => handleSwitchMaison(m.id)}
                  >
                    <View style={[styles.switcherAvatar, isActive && styles.switcherAvatarActive]}>
                      <Text style={styles.switcherAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.switcherInfo}>
                      <Text style={styles.switcherMaisonId}>@{m.username}</Text>
                      <Text style={styles.switcherMaisonName}>
                        {m.name || "AURA Profile"} • <Text style={{ color: "#00f5ff", fontSize: 10.5 }}>{m.category || "Personal"}</Text>
                      </Text>
                    </View>
                    {isActive && (
                      <View style={styles.switcherCheck}>
                        <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.addBrandBtn} onPress={handleAddBrandProfile}>
              <Lucide name="add-circle-outline" size={22} color="#00f5ff" />
              <Text style={styles.addBrandBtnText}>Mint new brand profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ➕ INSTAGRAM-STYLE CREATE BOTTOM SHEET */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity 
          style={styles.switcherBackdrop} 
          activeOpacity={1} 
          onPress={() => setShowCreateModal(false)}
        >
          <View style={styles.createPanel}>
            <View style={styles.switcherHandle} />
            <Text style={styles.createTitle}>Create</Text>
            
            <ScrollView style={styles.createList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.createItem} onPress={() => { 
                setShowCreateModal(false); 
                triggerHaptic("medium"); 
                router.push({ pathname: "/", params: { activeTab: "reels" } } as any);
              }}>
                <Lucide name="film-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Reel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => { 
                setShowCreateModal(false); 
                triggerHaptic("medium"); 
                handleEditProfilePress();
              }}>
                <Lucide name="copy-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Edits</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => { 
                setShowCreateModal(false); 
                triggerHaptic("medium"); 
                setShowPostModal(true);
              }}>
                <Lucide name="grid-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => { 
                setShowCreateModal(false); 
                triggerHaptic("medium"); 
                router.push({ pathname: "/", params: { activeTab: "reels", openCamera: "true" } } as any);
              }}>
                <Lucide name="add-circle-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Story</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => { 
                setShowCreateModal(false); 
                triggerHaptic("medium"); 
                handleAddHighlight(); 
              }}>
                <Lucide name="heart-circle-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Highlights</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => { 
                setShowCreateModal(false); 
                triggerHaptic("medium"); 
                setShowLiveModal(true);
                startLiveSimulation();
              }}>
                <Lucide name="radio-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Live</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => { 
                setShowCreateModal(false); 
                triggerHaptic("medium"); 
                setShowAIModal(true);
              }}>
                <Lucide name="sparkles-outline" size={24} color="#00f5ff" />
                <Text style={[styles.createItemText, { color: "#00f5ff" }]}>AI</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 📸 FUNCTIONAL PORTAL 1: POST CURATOR */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <Text style={styles.editModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>{category === "Personal Profile" ? "New Look Post" : "Curate Artifact"}</Text>
              <TouchableOpacity onPress={handlePublishPost}>
                <Text style={styles.editModalDoneText}>Publish</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              {category === "Personal Profile" ? (
                // 👥 Personal Look/Post inputs
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Caption / Description</Text>
                  <TextInput
                    style={[styles.inputField, { height: 80, textAlignVertical: "top" }]}
                    value={postTitle}
                    onChangeText={setPostTitle}
                    multiline
                    numberOfLines={3}
                    placeholder="Write a caption for your aesthetic look..."
                    placeholderTextColor="#8e8e8e"
                  />
                </View>
              ) : (
                // 🏛️ Brand Boutique Product inputs
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product Title</Text>
                    <TextInput
                      style={styles.inputField}
                      value={postTitle}
                      onChangeText={setPostTitle}
                      placeholder="e.g. Atelier Silk Drape Vestment"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Retail Price (INR)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={postPrice}
                      onChangeText={postPrice => setPostPrice(postPrice.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="e.g. 185000"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Aesthetic / Vibe Profile</Text>
                    <TextInput
                      style={styles.inputField}
                      value={postVibe}
                      onChangeText={setPostVibe}
                      placeholder="e.g. Cyberpunk, Brutalist, Quiet Luxury"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description / Curation Notes</Text>
                    <TextInput
                      style={[styles.inputField, { height: 70, textAlignVertical: "top" }]}
                      value={postDescription}
                      onChangeText={setPostDescription}
                      multiline
                      numberOfLines={3}
                      placeholder="Bespoke luxury drape fabric elements..."
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>
                </>
              )}

              <Text style={[styles.inputLabel, { marginTop: 10, marginBottom: 12 }]}>Select Design Texture Image</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 40 }}>
                {[
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
                  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400",
                  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400"
                ].map((url, i) => {
                  const isSelected = postImage === url;
                  return (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setPostImage(url)}
                      style={{ marginRight: 10, borderWidth: 2, borderColor: isSelected ? "#00f5ff" : "transparent", borderRadius: 8, overflow: "hidden" }}
                    >
                      <Image source={{ uri: url }} style={{ width: 80, height: 80 }} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 📡 FUNCTIONAL PORTAL 2: LIVE BROADCAST ATELIER SHOWROOM */}
      <LiveShowroom
        visible={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        initialMode="broadcaster"
        maisonId={username}
        maisonName={profileName}
      />

      {/* 🌌 FUNCTIONAL PORTAL 3: AI GENERATIVE FASHION ARCHITECT */}
      <Modal
        visible={showAIModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => { setShowAIModal(false); setGeneratedProduct(null); }}>
                <Text style={styles.editModalCancelText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>AI Design Assistant</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              {!generatedProduct && !aiGenerating && (
                <>
                  <Text style={{ color: "#00f5ff", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>AURA Deep-Fashion Architect</Text>
                  <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Synthesize Sovereign Blueprints</Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24, lineHeight: 18 }}>
                    Describe your high-fidelity fashion vision. AURA-AI will dynamically synthesize ambient textures, geometry mesh models, and calculate market metrics immediately.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Design Prompt</Text>
                    <TextInput
                      style={[styles.inputField, { height: 80, textAlignVertical: "top" }]}
                      value={aiPrompt}
                      onChangeText={setAiPrompt}
                      multiline
                      numberOfLines={4}
                      placeholder="e.g. brutalist trench coat in liquid gold mercury drape fabric with modular cargo modules..."
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <TouchableOpacity 
                    style={{ backgroundColor: "#00f5ff", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 20 }}
                    onPress={handleStartAIGeneration}
                  >
                    <Text style={{ color: "#000000", fontSize: 14, fontWeight: "bold" }}>Synthesize Fashion Blueprint</Text>
                  </TouchableOpacity>
                </>
              )}

              {aiGenerating && (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}>
                  <ActivityIndicator size="large" color="#00f5ff" style={{ marginBottom: 24 }} />
                  <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>AURA AI is curating...</Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", paddingHorizontal: 30, marginBottom: 30, height: 40 }}>{aiStep}</Text>
                  
                  {/* Custom progress HUD */}
                  <View style={{ width: "80%", height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ width: `${aiProgress}%`, height: "100%", backgroundColor: "#00f5ff" }} />
                  </View>
                  <Text style={{ color: "#00f5ff", fontSize: 12, fontFamily: "monospace", marginTop: 10 }}>{aiProgress}% COMPLETE</Text>
                </View>
              )}

              {generatedProduct && !aiGenerating && (
                <View style={{ paddingBottom: 40 }}>
                  <Text style={{ color: "#00f5ff", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Synthesis Successful</Text>
                  <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Synthesized Artifact Render</Text>

                  <View style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
                    <Image source={{ uri: generatedProduct.image }} style={{ width: "100%", height: 260 }} />
                    <View style={{ padding: 16, backgroundColor: "#0b071e" }}>
                      <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{aiTitle}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12 }}>{generatedProduct.description}</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Generated Title Override</Text>
                    <TextInput
                      style={styles.inputField}
                      value={aiTitle}
                      onChangeText={setAiTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hydrate Price Override (INR)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={aiPrice}
                      onChangeText={price => setAiPrice(price.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                    <TouchableOpacity 
                      style={{ flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingVertical: 14, borderRadius: 8, alignItems: "center" }}
                      onPress={() => setGeneratedProduct(null)}
                    >
                      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Regenerate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: "#00f5ff", paddingVertical: 14, borderRadius: 8, alignItems: "center" }}
                      onPress={handleMintGeneratedProduct}
                    >
                      <Text style={{ color: "#000000", fontSize: 13, fontWeight: "bold" }}>Hydrate to Ledger</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🏛️ FUNCTIONAL PORTAL 4: AURA UNIFIED ACCOUNTS CENTER (META-STYLE HUB) */}
      <Modal
        visible={showAccountsCenter}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAccountsCenter(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => setShowAccountsCenter(false)}>
                <Text style={styles.editModalCancelText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Accounts Center</Text>
              <TouchableOpacity onPress={() => setShowAccountsCenter(false)}>
                <Text style={styles.editModalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              
              {/* META-STYLE SUBTITLE & DECK INFO */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>AURA Identity & Access</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 12, lineHeight: 16 }}>Manage your connected profiles, personal governance, payments, and system security credentials across all ledger flagships.</Text>
              </View>

              {/* 1. CONNECTED PROFILES DECK */}
              <Text style={styles.accountsCenterSectionTitle}>Profiles Mesh</Text>
              <View style={styles.accountsCenterCard}>
                {/* Personal Profile */}
                {personalProfile && (
                  <TouchableOpacity 
                    style={styles.accountsCenterProfileRow}
                    onPress={() => {
                      triggerHaptic("medium");
                      handleSwitchMaison(personalProfile.id);
                      setShowAccountsCenter(false);
                    }}
                  >
                    <View style={[styles.profileTabCircle, { borderWidth: (activeProfile?.id === personalProfile.id) ? 1.5 : 0, borderColor: "#00f5ff", width: 40, height: 40, borderRadius: 20, overflow: "hidden", marginRight: 12, padding: 0 }]}>
                      <Image 
                        source={{ uri: personalProfile.logo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150" }} 
                        style={{ width: "100%", height: "100%" }} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>{personalProfile.name || currentUser?.name || "Curator"}</Text>
                      <Text style={{ color: "#8e8e8e", fontSize: 11 }}>Personal Creator Profile (@{personalProfile.username})</Text>
                    </View>
                    {activeProfile?.id === personalProfile.id && (
                      <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                    )}
                  </TouchableOpacity>
                )}

                {/* Available Brand profiles */}
                {brandProfiles.map((m, idx) => {
                  const isActive = m.id === activeProfile?.id;
                  const initials = m.name[0]?.toUpperCase() || "R";
                  return (
                    <TouchableOpacity 
                      key={m.id || idx}
                      style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}
                      onPress={() => {
                        triggerHaptic("medium");
                        handleSwitchMaison(m.id);
                        setShowAccountsCenter(false);
                      }}
                    >
                      <View style={[styles.profileTabCircle, { width: 40, height: 40, borderRadius: 20, backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center", marginRight: 12, borderWidth: isActive ? 1.5 : 0, borderColor: "#00f5ff", padding: 0 }]}>
                        <Text style={{ color: "#000000", fontSize: 14, fontWeight: "bold" }}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>{m.name}</Text>
                        <Text style={{ color: "#8e8e8e", fontSize: 11 }}>Sovereign Brand Maison (@{m.username})</Text>
                      </View>
                      {isActive && (
                        <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 👥 PERSONAL DETAILS SECTION */}
              <Text style={styles.accountsCenterSectionTitle}>Personal Information</Text>
              <View style={styles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={() => {
                    triggerHaptic("medium");
                    setShowPersonalDetails(true);
                  }}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="person-circle-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Personal Details</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Manage Date of Birth, Gender, and contact phone/email verification nodes.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 💼 AURA BUSINESS SUITE SECTION */}
              <Text style={styles.accountsCenterSectionTitle}>AURA Business & Marketing</Text>
              <View style={styles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={() => {
                    triggerHaptic("medium");
                    setShowAccountsCenter(false);
                    router.push("/maison/business-suite");
                  }}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="business-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>AURA Business Suite</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Manage e-commerce catalogs, billing ad accounts, team members, and pixel conversion stats.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 2. DATA SOVEREIGNITY & GOVERNANCE */}
              <Text style={styles.accountsCenterSectionTitle}>Sovereign Data & Portability</Text>
              <View style={styles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={handleDownloadInformation}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="cloud-download-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Download Your Information</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Export a JSON archive copy of your credentials, inventory, and ledgers.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12, paddingVertical: 4 }]}
                  onPress={handleDeactivateMaison}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="close-circle-outline" size={20} color="#ff3b30" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ff3b30", fontSize: 13, fontWeight: "bold" }}>Deactivate or Delete Node</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Temporarily suspend or permanently purge specific brand ledger nodes.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 3. FEDIVERSE & SOCIAL CROSSOVERS */}
              <Text style={styles.accountsCenterSectionTitle}>Connected Social & Fediverse</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.accountsCenterProfileRow}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="share-social-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Fediverse Sharing (ActivityPub)</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Federate and auto-broadcast your e-commerce artifacts to Mastodon & open platforms.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleFediverse}>
                    <Lucide name={fediverseSharing ? "toggle" : "toggle-outline"} size={36} color={fediverseSharing ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="globe-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Web Autoshare Crossovers</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Automatically mirror visual stories published in-app directly to the Next.js storefront.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleAlerts}>
                    <Lucide name={alertsEnabled ? "toggle" : "toggle-outline"} size={36} color={alertsEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. SECURITY PROTOCOLS */}
              <Text style={styles.accountsCenterSectionTitle}>Identity Security Protocol</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.accountsCenterProfileRow}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="finger-print-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Biometric Identification</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Use FaceID or TouchID for executing high-value ledger acquisitions.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleBiometric}>
                    <Lucide name={biometricEnabled ? "toggle" : "toggle-outline"} size={36} color={biometricEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="lock-closed-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Sovereign 2FA</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Direct hardware tokens required to commit critical parameter adjustments.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleTwoFactor}>
                    <Lucide name={twoFactorEnabled ? "toggle" : "toggle-outline"} size={36} color={twoFactorEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="shield-checkmark-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Geographic Node Lock</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Restrict profile operations to your current geographic coordinates.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleRegionLock}>
                    <Lucide name={regionLockEnabled ? "toggle" : "toggle-outline"} size={36} color={regionLockEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5. ACTIVE LOGINS & NODE DEVICES */}
              <Text style={styles.accountsCenterSectionTitle}>Active Node Logins (Where You're Logged In)</Text>
              <View style={styles.accountsCenterCard}>
                {activeSessions.map((s, idx) => (
                  <View 
                    key={s.id}
                    style={[styles.accountsCenterProfileRow, idx > 0 && { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}
                  >
                    <View style={styles.accountsCenterIconWrapper}>
                      <Lucide name={s.icon as any} size={20} color="#00f5ff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>{s.device}</Text>
                      <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>{s.location} • {s.active ? "Active Node Session" : "Logged in recently"}</Text>
                    </View>
                    {!s.active ? (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,59,48,0.12)", borderRadius: 6 }}
                        onPress={() => handleRevokeSession(s.id)}
                      >
                        <Text style={{ color: "#ff3b30", fontSize: 10, fontWeight: "bold" }}>Revoke</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(0,245,255,0.12)", borderRadius: 6 }}>
                        <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold" }}>Current</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* SOVEREIGN MERCH ONBOARDING DECK */}
              <View style={{ marginHorizontal: 16, marginVertical: 30, padding: 20, backgroundColor: "rgba(0,245,255,0.03)", borderStyle: "dashed", borderWidth: 1.5, borderColor: "rgba(0,245,255,0.2)", borderRadius: 16, alignItems: "center" }}>
                <Lucide name="rocket-outline" size={32} color="#00f5ff" style={{ marginBottom: 12 }} />
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold", marginBottom: 6 }}>Become a Maison Director</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 11, textAlign: "center", lineHeight: 16, marginBottom: 16 }}>Transform from a consumer node to a primary e-commerce supply hub. Architect flagships, manage inventories, and publish design catalogs directly.</Text>
                <TouchableOpacity 
                  style={{ width: "100%", backgroundColor: "#00f5ff", paddingVertical: 12, borderRadius: 8, alignItems: "center" }}
                  onPress={() => {
                    triggerHaptic("success");
                    Linking.openURL(`${API_HOST}/discover/onboarding`);
                  }}
                >
                  <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5 }}>Commence Onboarding</Text>
                </TouchableOpacity>
              </View>

              {/* LOG OUT BUTTON */}
              <View style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 30 }}>
                <TouchableOpacity 
                  style={{ width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(255, 59, 48, 0.15)", borderWidth: 1, borderColor: "rgba(255, 59, 48, 0.25)", alignItems: "center" }}
                  onPress={() => {
                    authLogOut();
                    setShowAccountsCenter(false);
                    Alert.alert("Session Revoked", "Logged out of your active AURA mesh identity node successfully.");
                    router.replace("/login");
                  }}
                >
                  <Text style={{ color: "#ff3b30", fontSize: 12, fontWeight: "bold", letterSpacing: 1.5 }}>LOG OUT OF NODE</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🏛️ SUB-PORTAL: PERSONAL DETAILS CONSOLE */}
      <Modal
        visible={showPersonalDetails}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPersonalDetails(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => setShowPersonalDetails(false)}>
                <Text style={styles.editModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Personal Details</Text>
              <TouchableOpacity onPress={handleSavePersonalDetails} disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator color="#00f5ff" size="small" />
                ) : (
                  <Text style={styles.editModalDoneText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Social Data Ledger</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 12, lineHeight: 16 }}>AURA keeps your personal metadata secure. It is never federated to standard advertising systems or public catalog nodes.</Text>
              </View>

              {/* Date of Birth Form block */}
              <Text style={styles.accountsCenterSectionTitle}>Date of Birth</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.inputFieldRow}>
                  <Lucide name="calendar-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#555"
                    value={personalDob}
                    onChangeText={setPersonalDob}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Gender selection Form block */}
              <Text style={styles.accountsCenterSectionTitle}>Gender</Text>
              <View style={[styles.accountsCenterCard, { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingVertical: 16 }]}>
                {["Male", "Female", "Non-Binary", "Prefer Not to Say"].map((g) => {
                  const isSelected = personalGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#00f5ff" : "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: isSelected ? "#00f5ff" : "rgba(255,255,255,0.08)",
                      }}
                      onPress={() => {
                        triggerHaptic("light");
                        setPersonalGender(g);
                      }}
                    >
                      <Text style={{ color: isSelected ? "#080415" : "#fff", fontSize: 12, fontWeight: "bold" }}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Contact Information Form block */}
              <Text style={styles.accountsCenterSectionTitle}>Contact Information</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.inputFieldRow}>
                  <Lucide name="mail-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="Email Address"
                    placeholderTextColor="#555"
                    value={personalEmail}
                    onChangeText={setPersonalEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
                <View style={[styles.inputFieldRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <Lucide name="call-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="Phone Number"
                    placeholderTextColor="#555"
                    value={personalPhone}
                    onChangeText={setPersonalPhone}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Identity Verification Badging status */}
              <Text style={styles.accountsCenterSectionTitle}>Identity Verification Node</Text>
              <TouchableOpacity style={styles.accountsCenterCard} onPress={handleRequestVerification}>
                <View style={styles.accountsCenterProfileRow}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="shield-checkmark-outline" size={20} color={isVerifiedUser ? "#00f5ff" : "#8e8e8e"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                      {isVerifiedUser ? "Sovereign Mark Verified" : "Unverified Identity node"}
                    </Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>
                      {isVerifiedUser 
                        ? "Your identity ledger keys match AURA cryptographic primary trust." 
                        : "Submit government-issued business tax registers to unlock verified metadata markers."}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 📤 PREMIUM INSTAGRAM-STYLE SHARE PROFILE BOTTOM SHEET MODAL */}
      {showShareProfileSheet && (
        <Modal
          visible={showShareProfileSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowShareProfileSheet(false)}
        >
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowShareProfileSheet(false)}
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
                <TouchableOpacity style={styles.shareAddFriendBtn} onPress={() => { triggerHaptic("light"); Alert.alert("Contacts Synced", "Your dynamic contact nodes have been successfully synchronized."); }}>
                  <Lucide name="person-add-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Direct Message Contacts Grid */}
              <View style={styles.shareContactsContainer}>
                {(() => {
                  const allContacts = [
                    { id: "c1", name: "Kiran Soni", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150" },
                    { id: "c2", name: "S U R A J", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150" },
                    { id: "c3", name: "Dr. Rashneet ✨", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150" },
                    { id: "c4", name: "Rhythm Bhatia", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150" },
                    { id: "c5", name: "the.priyas...", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150" },
                    { id: "c6", name: "Mandy", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150" },
                  ];
                  const filtered = allContacts.filter(c => 
                    c.name.toLowerCase().includes(shareSearch.toLowerCase())
                  );
                  
                  // Chunk into groups of 3
                  const rows = [];
                  for (let i = 0; i < filtered.length; i += 3) {
                    rows.push(filtered.slice(i, i + 3));
                  }
                  
                  if (filtered.length === 0) {
                    return (
                      <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No contacts found</Text>
                      </View>
                    );
                  }
                  
                  return rows.map((rowContacts, rowIndex) => (
                    <View key={`row_${rowIndex}`} style={[styles.shareContactsRow, rowIndex > 0 && { marginTop: 20 }]}>
                      {rowContacts.map((contact) => (
                        <TouchableOpacity 
                          key={contact.id} 
                          style={styles.shareContactCard} 
                          onPress={() => {
                            triggerHaptic("success");
                            setShowShareProfileSheet(false);
                            Alert.alert("Sent", `AURA profile shared successfully with ${contact.name}!`);
                          }}
                        >
                          <Image source={{ uri: contact.avatar }} style={styles.shareContactAvatar} />
                          <Text style={styles.shareContactName} numberOfLines={1}>{contact.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {/* Placeholders if row has < 3 elements to maintain space-between layout alignments */}
                      {rowContacts.length < 3 && Array.from({ length: 3 - rowContacts.length }).map((_, placeholderIdx) => (
                        <View key={`placeholder_${placeholderIdx}`} style={{ width: 90 }} />
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
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  try {
                    await Clipboard.setStringAsync(profileUrl);
                    Alert.alert("Link Copied", "Instant match! The luxury profile coordinates have been copied to your clipboard.");
                  } catch (e) {
                    console.warn("Clipboard copy failed:", e);
                    Alert.alert("Link Copied", `Coordinate: ${profileUrl}`);
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
                  setShowShareProfileSheet(false);
                  
                  const newSlide = {
                    id: `ys_${Date.now()}`,
                    url: logo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400",
                    caption: `Check out my official AURA profile coordinates ✨: "${profileName}" (@${username})`,
                    isVideo: false,
                    artifact: null
                  };

                  addInstaStorySlide(newSlide);
                  Alert.alert("Story Shared", "Profile shared successfully to your Stories feed! View it at the top of your home screen.");
                }}>
                  <View style={styles.shareActionCircle}>
                    <Lucide name="add-circle-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Add to story</Text>
                </TouchableOpacity>

                {/* 💬 WHATSAPP */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  const text = `Connect with me on AURA: "${profileName}" (@${username}) ✨\n\nLink: ${profileUrl}`;
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
                  setShowShareProfileSheet(false);
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
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  const text = `Connect with me on AURA: "${profileName}" (@${username}) ✨\n\nLink: ${profileUrl}`;
                  const telegramUrl = `tg://msg?text=${encodeURIComponent(text)}`;
                  Linking.openURL(telegramUrl).catch(() => {
                    Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`);
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
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  const text = `Connect with me on AURA: "${profileName}" (@${username}) ✨`;
                  Share.share({
                    message: `${text}\n\nLink: ${profileUrl}`,
                    url: profileUrl,
                    title: "AURA Profile coordinates"
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
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Products</Text>
        </TouchableOpacity>

        {/* TAB 5 — Profile */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/account");
          }}
        >
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "#00f5ff", overflow: "hidden" }]}>
            {username === "aloksingh" ? (
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80" }} 
                style={styles.profileTabImg} 
              />
            ) : (
              <View style={[styles.profileTabImg, { backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: "#000000", fontSize: 10, fontWeight: "bold" }}>{username[0]?.toUpperCase() || "R"}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.auraTabLabel, { color: "#00f5ff" }]}>Profile</Text>
        </TouchableOpacity>

      </View>

      {/* ➕ CUSTOM PROMPT MODAL */}
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptVisible(false)}
      >
        <TouchableOpacity
          style={styles.promptOverlay}
          activeOpacity={1}
          onPress={() => setPromptVisible(false)}
        >
          <View style={styles.promptContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.promptTitle}>{promptTitle}</Text>
            {promptDesc ? <Text style={styles.promptDesc}>{promptDesc}</Text> : null}
            <TextInput
              style={styles.promptInput}
              placeholder={promptPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={promptValue}
              onChangeText={setPromptValue}
              keyboardAppearance="dark"
              autoFocus
            />
            <View style={styles.promptActionRow}>
              <TouchableOpacity
                style={[styles.promptButton, styles.promptCancelButton]}
                onPress={() => setPromptVisible(false)}
              >
                <Text style={styles.promptCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promptButton, styles.promptSubmitButton]}
                onPress={() => {
                  setPromptVisible(false);
                  if (promptOnSubmit) {
                    promptOnSubmit(promptValue);
                  }
                }}
              >
                <Text style={styles.promptSubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 💖 WISHLIST MODAL OVERLAY */}
      <Modal
        visible={showWishlistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWishlistModal(false)}
      >
        <View style={styles.wishlistOverlay}>
          <View style={styles.wishlistContainer}>
            <View style={styles.wishlistHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Lucide name="heart" size={22} color="#00f5ff" />
                <Text style={styles.wishlistTitle}>SAVED ARTIFACTS</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWishlistModal(false)}>
                <Lucide name="close" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {wishlist && wishlist.length > 0 ? (
              <FlatList
                data={wishlist}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.wishlistListContent}
                renderItem={({ item }) => {
                  const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
                  return (
                    <View style={styles.wishlistItemCard}>
                      <TouchableOpacity 
                        style={styles.wishlistItemMain} 
                        onPress={() => {
                          setShowWishlistModal(false);
                          router.push(`/product/${item.id}`);
                        }}
                      >
                        <Image source={{ uri: imageUrl }} style={styles.wishlistItemImg} />
                        <View style={styles.wishlistItemInfo}>
                          <Text style={styles.wishlistItemMaison} numberOfLines={1}>
                            {item.maison?.name || "AURAGRAM Maison"}
                          </Text>
                          <Text style={styles.wishlistItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.wishlistItemVibe}>
                            ✦ {item.vibe || "Quiet Luxury"}
                          </Text>
                          <Text style={styles.wishlistItemPrice}>
                            ₹{item.price?.toLocaleString()}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.wishlistItemActions}>
                        <TouchableOpacity
                          style={styles.wishlistAddToCartBtn}
                          onPress={() => {
                            addToCart(item);
                            const uid = currentUser?.id || activeProfile?.userId;
                            if (uid) {
                              toggleWishlist(uid, item.id);
                            }
                            triggerHaptic("success");
                            Alert.alert("Artifact Moved", "Added to your checkout casket.");
                          }}
                        >
                          <Lucide name="basket-outline" size={16} color="#000000" />
                          <Text style={styles.wishlistAddToCartText}>Move to Cart</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.wishlistRemoveBtn}
                          onPress={() => {
                            const uid = currentUser?.id || activeProfile?.userId;
                            if (uid) {
                              toggleWishlist(uid, item.id);
                            }
                            triggerHaptic("light");
                          }}
                        >
                          <Lucide name="trash-outline" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.wishlistEmpty}>
                <Lucide name="heart-dislike-outline" size={48} color="rgba(255,255,255,0.1)" />
                <Text style={styles.wishlistEmptyTitle}>No saved designs</Text>
                <Text style={styles.wishlistEmptyDesc}>
                  Discover premium items from the atelier shop and save them here.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415", // Premium luxury dark background
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#080415"
  },
  loadingText: {
    color: "#00f5ff", 
    fontSize: 13, 
    marginTop: 12, 
    textTransform: "uppercase", 
    letterSpacing: 1.5
  },
  // Immersive Canvas Header
  canvasHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  canvasHeaderDropdown: {
    flexDirection: "row",
    alignItems: "center",
  },
  canvasHeaderUsername: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  canvasHeaderRightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  avatarStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarGroup: {
    position: "relative",
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRingOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "#d946ef", // Vibrant Magenta/Pink from fluid image
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatarMiddleRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: "#8b5cf6", // Deep Purple/Violet from fluid image
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatarInnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: "#00f5ff", // Vibrant Cyan/Sky Blue from fluid image
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#080415", // Premium Instagram black gap
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "300",
    fontFamily: "System",
  },
  avatarPlusBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#00f5ff", // Sleek AURA blue
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#080415",
  },
  bubbleOverlay: {
    position: "absolute",
    top: -24,
    backgroundColor: "#0b071e",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 100,
    alignItems: "center",
  },
  bubbleText: {
    color: "#00f5ff",
    fontSize: 10.5,
    fontWeight: "500",
  },
  bubblePointer: {
    position: "absolute",
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: "#0b071e",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    transform: [{ rotate: "45deg" }],
  },
  
  // Stats
  statsRow: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
    paddingLeft: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    fontWeight: "400",
    marginTop: 2,
  },

  // Bio Description
  bioContainer: {
    marginTop: 12,
  },
  bioBrandName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  bioCategory: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "400",
    marginTop: 2,
  },
  bioDescriptionText: {
    color: "#ffffff",
    fontSize: 13.5,
    lineHeight: 18.5,
    marginTop: 5,
    fontWeight: "500",
  },
  websiteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  websiteText: {
    color: "#00f5ff",
    fontSize: 13.5,
    fontWeight: "bold",
  },

  // Tag Badges
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 14,
  },
  tagBadgeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11.5,
    fontWeight: "600",
  },
  addTagBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 14,
  },
  addTagBtnText: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
  },

  // Professional Dashboard
  dashboardCard: {
    backgroundColor: "rgba(255,255,255,0.035)", // High-end translucent glass card
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dashboardTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  dashboardSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  dashboardIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00f5ff",
  },

  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)", // Translucent premium grey
    borderRadius: 10, // Modern rounded corners
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "600",
  },

  // Highlights Row
  highlightsContainer: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 16,
  },
  highlightsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  highlightItem: {
    alignItems: "center",
    width: 64,
  },
  highlightPlusCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  highlightCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightImage: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
  },
  highlightTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },

  // Grid Tabs
  gridTabBar: {
    flexDirection: "row",
    marginTop: 4,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  gridTabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderColor: "transparent",
  },
  gridTabBtnActive: {
    borderColor: "#00f5ff", 
  },

  // Posts Grid
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    paddingTop: 1,
  },
  gridImageContainer: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: "relative",
    marginBottom: 1,
  },
  gridPostImage: {
    width: "100%",
    height: "100%",
  },
  gridVideoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 4,
    borderRadius: 4,
  },
  gridPriceBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridPriceText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Edit Modal Styling
  editModalContainer: {
    flex: 1,
    backgroundColor: "#080415",
  },
  editModalNavBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  editModalCancelText: {
    color: "#ffffff",
    fontSize: 15.5,
  },
  editModalTitle: {
    color: "#ffffff",
    fontSize: 16.5,
    fontWeight: "bold",
  },
  editModalDoneText: {
    color: "#00f5ff",
    fontSize: 15.5,
    fontWeight: "bold",
  },
  editModalScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    backgroundColor: "#080415",
  },
  editModalAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  editModalAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0b071e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  editModalAvatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "300",
  },
  editModalChangeAvatarText: {
    color: "#00f5ff",
    fontSize: 13.5,
    fontWeight: "bold",
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 8,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputField: {
    color: "#ffffff",
    fontSize: 14.5,
    paddingVertical: 4,
  },
  editorDividerRow: {
    marginTop: 20,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 6,
  },
  editorSectionTitle: {
    color: "#00f5ff",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 1,
  },

  // Bottom Navigation Bar replica
  instagramBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(8,4,21,0.88)", // Premium glassmorphic background
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tabBtn: {
    padding: 8,
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
  profileTabCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: "relative",
    overflow: "hidden",
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
  // Switcher modal styles
  switcherBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  switcherPanel: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  switcherHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  switcherTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  switcherList: {
    marginBottom: 20,
  },
  switcherItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  switcherItemActive: {
    backgroundColor: "rgba(0, 245, 255, 0.05)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  switcherAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#20183e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  switcherAvatarActive: {
    borderColor: "#00f5ff",
    borderWidth: 1.5,
  },
  switcherAvatarText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  switcherInfo: {
    flex: 1,
    marginLeft: 12,
  },
  switcherMaisonId: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  switcherMaisonName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  switcherCheck: {
    paddingLeft: 10,
  },
  addBrandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.3)",
    borderRadius: 8,
    marginTop: 10,
  },
  addBrandBtnText: {
    color: "#00f5ff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  // Create bottom sheet styles
  createPanel: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  createTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  createList: {
    marginBottom: 10,
  },
  createItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  createItemText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 14,
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Accounts Center specific styles
  accountsCenterSectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  accountsCenterCard: {
    backgroundColor: "#0f0b25",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  accountsCenterProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountsCenterIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(0, 245, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inputFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 4,
  },
  // 📤 Share Profile bottom sheet styles
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  bottomSheetDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginVertical: 12,
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
  },

  // Creator Influence Card
  creatorBannerCard: {
    backgroundColor: "rgba(0,245,255,0.04)", // Light neon cyan glass background
    borderWidth: 0.5,
    borderColor: "rgba(0,245,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auraBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00f5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  auraBadgeText: {
    color: "#080415",
    fontSize: 9,
    fontWeight: "900",
  },
  creatorBannerTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  creatorBannerScore: {
    color: "#00f5ff",
    fontSize: 11.5,
    marginTop: 2,
  },
  creatorBadgeBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  creatorBadgeBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },

  // Grid affiliate curations
  gridAffiliateBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,245,255,0.85)", // Vibrant cyan badge
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridAffiliateText: {
    color: "#080415",
    fontSize: 9,
    fontWeight: "900",
  },
  
  // Threads & Social Proof elements exactly mirroring Instagram screenshots
  threadsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 30,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  threadsIcon: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 4,
  },
  threadsPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  socialProofRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  socialProofAvatars: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
  },
  socialProofAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#080415",
  },
   socialProofText: {
    color: "#fff",
    fontSize: 13,
  },
  socialProofBold: {
    fontWeight: "bold",
  },
  // Custom prompt modal styles
  promptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  promptContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0b071e",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  promptTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  promptDesc: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  promptInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 20,
  },
  promptActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  promptButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  promptCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  promptCancelButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  promptSubmitButton: {
    backgroundColor: "#00f5ff",
  },
  promptSubmitButtonText: {
    color: "#080415",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Modal overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  
  // Followers/Following Modal list styles
  networkModalContainer: {
    height: "65%",
    backgroundColor: "#0d0920",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 0,
  },
  modalHeaderBar: {
    width: "100%",
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalIndicator: {
    width: 36,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  networkTabContainer: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    height: 44,
  },
  networkTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  networkTabItemActive: {
    borderBottomColor: "#00f5ff",
  },
  networkTabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "600",
  },
  networkTabTextActive: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
  networkUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.04)",
  },
  networkUserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  networkUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  networkUserName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  networkUserHandle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    marginTop: 1,
  },
  networkFollowBtn: {
    paddingHorizontal: 16,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  networkFollowBtnPrimary: {
    backgroundColor: "#00f5ff",
  },
  networkFollowBtnOutline: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  networkFollowBtnText: {
    color: "#080415",
    fontSize: 11.5,
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: "rgba(255,255,255,0.04)",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalCloseButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  wishlistOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 4, 21, 0.95)",
    justifyContent: "flex-end",
  },
  wishlistContainer: {
    height: "80%",
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  wishlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 16,
  },
  wishlistTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
  },
  wishlistListContent: {
    paddingBottom: 40,
    gap: 16,
  },
  wishlistItemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 12,
    gap: 12,
  },
  wishlistItemMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  wishlistItemImg: {
    width: 80,
    height: 80,
    borderRadius: 16,
    resizeMode: "cover",
  },
  wishlistItemInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 2,
  },
  wishlistItemMaison: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  wishlistItemTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  wishlistItemVibe: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "500",
  },
  wishlistItemPrice: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  wishlistItemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
    paddingTop: 10,
  },
  wishlistAddToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00f5ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  wishlistAddToCartText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "700",
  },
  wishlistRemoveBtn: {
    padding: 8,
  },
  wishlistEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
    gap: 12,
  },
  wishlistEmptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  wishlistEmptyDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
