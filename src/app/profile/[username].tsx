import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Linking,
  Share,
  Modal,
  TextInput,
  FlatList
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { API_HOST } from "@/constants/api";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { formatCompactNumber } from "@/constants/format";
import { ProfileGridEmpty } from "@/components/ProfileGridEmpty";
import {
  fetchProfileNetwork,
  fetchProfilePosts,
  fetchSuggestedProfiles,
  toggleFollowProfile,
  type NetworkProfile,
  type ProfilePost,
} from "@/lib/profileApi";
import { useProfileGridViewer } from "@/lib/profileGridNavigation";
import { ProfileGridViewer } from "@/components/profile/ProfileGridViewer";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { isUserBlocked, unblockUser } from "@/lib/socialGraph";

const { width } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 2) / 3;

export default function ViewProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const insets = useSafeAreaInsets();
  const {
    triggerHaptic,
    activeProfile,
    viewingProfile,
    viewingProducts,
    viewingHighlights,
    loadingViewProfile,
    fetchViewProfile,
    clearViewProfile,
    followProfile,
    currentUser,
  } = useStore();

  const [activeGridTab, setActiveGridTab] = useState<"posts" | "reels" | "products" | "collabs">("posts");
  const [followLoading, setFollowLoading] = useState(false);
  const [profilePosts, setProfilePosts] = useState<ProfilePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const { viewer: gridViewer, openGridItem, closeViewer: closeGridViewer } = useProfileGridViewer();
  const { graph: socialGraph, version: socialGraphVersion, blockAccount, refresh: refreshSocialGraph } = useSocialGraph();

  const [showSuggested, setShowSuggested] = useState(false);
  const [suggestedProfiles, setSuggestedProfiles] = useState<NetworkProfile[]>([]);

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkTab, setNetworkTab] = useState<"followers" | "following">("followers");
  const [networkUsers, setNetworkUsers] = useState<NetworkProfile[]>([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);

  const loadNetworkList = useCallback(
    async (tab: "followers" | "following", profileId: string) => {
      setLoadingNetwork(true);
      try {
        const list = await fetchProfileNetwork(profileId, tab, activeProfile?.id);
        setNetworkUsers(list);
      } catch (e) {
        console.warn("Could not load profile network.", e);
        setNetworkUsers([]);
      } finally {
        setLoadingNetwork(false);
      }
    },
    [activeProfile?.id]
  );

  const handleNetworkFollowToggle = async (item: NetworkProfile) => {
    if (!activeProfile?.id || item.id === activeProfile.id) return;
    triggerHaptic("medium");
    const data = await toggleFollowProfile(activeProfile.id, item.id);
    if (!data.success) return;
    setNetworkUsers((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, followed: !!data.isFollowing } : u))
    );
    if (networkTab === "following" && !data.isFollowing) {
      setNetworkUsers((prev) => prev.filter((u) => u.id !== item.id));
    }
  };

  const handleSuggestedFollow = async (p: NetworkProfile) => {
    if (!activeProfile?.id) {
      Alert.alert("Login Required", "Please log in to follow profiles.");
      return;
    }
    triggerHaptic("medium");
    const data = await toggleFollowProfile(activeProfile.id, p.id);
    if (data.success) {
      setSuggestedProfiles((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, followed: !!data.isFollowing } : x))
      );
    }
  };

  // 💬 DMs States
  const [showMessageSheet, setShowMessageSheet] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: "m1", text: "Hello! Absolutely loved your sustainable calfskin commission look ✦", isSender: false, time: "10:14 AM" },
    { id: "m2", text: "Is there any upcoming restock for Bengaluru node?", isSender: false, time: "10:15 AM" }
  ]);

  // 📞 Contact sheet states
  const [showContactSheet, setShowContactSheet] = useState(false);

  // ➕ Tags and Custom prompt modal states
  const [tags, setTags] = useState<string[]>([]);
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
                maisonId: profile.username || "rare_raven",
                oldMaisonId: profile.username,
                profileName: profile.profileName,
                category: profile.category,
                bioText: profile.bioText,
                websiteLink: profile.websiteLink,
                logo: profile.logo,
                tags: newTags,
              })
            });

            // Also update activeProfile store state so it propagates immediately to account.tsx
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
            console.warn("Failed to save tag in dynamic profile view", e);
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
                  maisonId: profile.username || "rare_raven",
                  oldMaisonId: profile.username,
                  profileName: profile.profileName,
                  category: profile.category,
                  bioText: profile.bioText,
                  websiteLink: profile.websiteLink,
                  logo: profile.logo,
                  tags: newTags,
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
              console.warn("Failed to remove tag in dynamic profile view", e);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (username) {
      fetchViewProfile(username, activeProfile?.id);
    }
    return () => {
      clearViewProfile();
    };
  }, [username, activeProfile?.id]);

  const profile = viewingProfile;
  const isOwnProfile =
    profile?.username === activeProfile?.username ||
    profile?.profileId === activeProfile?.id;
  const isPersonalProfile = profile?.profileType === "PERSONAL";
  const isCreatorProfile = profile?.profileType === "CREATOR";
  const isBusinessProfile = profile?.profileType === "BUSINESS";
  const isFollowing = profile?.isFollowing || false;
  const isPrivate = profile?.isPrivate || false;
  const isBlockedProfile =
    !!profile?.profileId &&
    !!socialGraph &&
    isUserBlocked(profile.profileId, socialGraph, profile.username);
  const showPrivateOverlay = isPrivate && !isFollowing && !isOwnProfile && !isBlockedProfile;
  const followedBy = (profile as { followedBy?: { username: string; name: string; logo: string | null }[] })?.followedBy || [];
  const followedByOthersCount = (profile as { followedByOthersCount?: number })?.followedByOthersCount || 0;

  useEffect(() => {
    if (viewingProfile?.tags) {
      setTags(viewingProfile.tags);
    }
  }, [viewingProfile]);

  useEffect(() => {
    if (showNetworkModal && profile?.profileId && !profile.profileId.startsWith("mock_")) {
      loadNetworkList(networkTab, profile.profileId);
    }
  }, [showNetworkModal, networkTab, profile?.profileId, loadNetworkList]);

  useEffect(() => {
    if (!activeProfile?.id || profile?.profileId?.startsWith("mock_")) return;
    fetchSuggestedProfiles(activeProfile.id).then(setSuggestedProfiles);
  }, [activeProfile?.id, profile?.profileId]);

  useEffect(() => {
    if (!profile?.profileId || profile.profileId.startsWith("mock_") || showPrivateOverlay) {
      setProfilePosts([]);
      return;
    }
    setLoadingPosts(true);
    fetchProfilePosts({
      username: profile.username,
      profileId: profile.profileId,
    })
      .then(setProfilePosts)
      .finally(() => setLoadingPosts(false));
  }, [profile?.profileId, profile?.username, showPrivateOverlay]);

  // Handle follow/unfollow toggle
  const handleFollowToggle = async () => {
    if (!activeProfile?.id || !profile?.profileId) {
      Alert.alert("Login Required", "Please log in to follow this profile.");
      return;
    }
    
    if (isFollowing) {
      Alert.alert(
        `Unfollow @${profile.username}?`,
        `Are you sure you want to unfollow ${profile.profileName || profile.username}?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Unfollow",
            style: "destructive",
            onPress: async () => {
              triggerHaptic("medium");
              setFollowLoading(true);
              await followProfile(activeProfile.id, profile.profileId);
              setFollowLoading(false);
            }
          }
        ],
        { cancelable: true }
      );
    } else {
      triggerHaptic("success");
      setFollowLoading(true);
      await followProfile(activeProfile.id, profile.profileId);
      setFollowLoading(false);
    }
  };

  // Handle message button
  const handleMessage = async () => {
    if (isBlockedProfile) {
      Alert.alert("Blocked", "Unblock this account to send a message.");
      return;
    }
    triggerHaptic("medium");
    try {
      const userVal = currentUser || activeProfile;
      const uId = userVal?.id || "user_2pk5xskr";
      const uName = userVal?.profileName || userVal?.name || "Alok Singh";
      
      const res = await fetch(`${API_HOST}/api/mobile/chat/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uId,
          userName: uName,
          maisonId: profile?.username || username,
          maisonName: profile?.profileName || username,
          initialMessage: "Hey there! 👋"
        })
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        router.push({
          pathname: "/",
          params: { openDMs: "true", conversationId: data.conversation.id }
        } as any);
      } else {
        Alert.alert("DM Error", data.error || "Could not initiate conversation.");
      }
    } catch (e) {
      console.warn("Could not initiate conversation:", e);
      Alert.alert("Connection Failure", "Failed to connect to direct message gateway.");
    }
  };

  // Handle share profile
  const handleShareProfile = async () => {
    triggerHaptic("light");
    try {
      await Share.share({
        message: `Check out @${profile?.username || username} on AURA ✦\nhttps://aura.app/${profile?.username || username}`,
        title: `${profile?.profileName || username} on AURA`
      });
    } catch (e) {
      // User cancelled
    }
  };

  // Loading state
  if (loadingViewProfile) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#080415" />
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // Profile Not Found state (when load finishes but profile is null)
  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#080415" />
        <Lucide name="person-remove-outline" size={54} color="#ff3b30" style={{ marginBottom: 16 }} />
        <Text style={[styles.loadingText, { color: "#ff3b30", fontSize: 16, marginBottom: 8 }]}>Profile Not Found</Text>
        <Text style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", paddingHorizontal: 40, marginBottom: 24, fontSize: 13 }}>
          This user profile coordinates could not be resolved or do not exist in the AURA ledger.
        </Text>
        <TouchableOpacity
          onPress={() => { triggerHaptic("light"); router.back(); }}
          style={{
            backgroundColor: "rgba(255,255,255,0.07)",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)"
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "bold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080415" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* 🔙 HEADER — Back button + Username (read-only, no switcher) */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { triggerHaptic("light"); router.back(); }} style={styles.backBtn}>
              <Lucide name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Lucide name="lock-closed" size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
              <Text style={styles.headerUsername}>{profile.username}</Text>
              {profile.auraScore >= 9.5 && (
                <Lucide name="checkmark-circle" size={16} color="#00f5ff" style={{ marginLeft: 4 }} />
              )}
            </View>

            <TouchableOpacity onPress={() => {
              triggerHaptic("light");
              Alert.alert(
                "More Options",
                `@${profile.username}`,
                [
                  { text: "Report", style: "destructive", onPress: () => Alert.alert("Reported", "This profile has been flagged for review.") },
                  {
                    text: "Block",
                    style: "destructive",
                    onPress: () => {
                      if (!profile?.profileId) return;
                      Alert.alert(
                        "Block account?",
                        `@${profile.username} won't be able to see your profile or message you.`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Block",
                            style: "destructive",
                            onPress: async () => {
                              await blockAccount({
                                profileId: profile.profileId,
                                username: profile.username,
                                name: profile.profileName || profile.username,
                                avatar: profile.logo,
                              });
                              router.back();
                              Alert.alert("Blocked", `@${profile.username} has been blocked.`);
                            },
                          },
                        ]
                      );
                    },
                  },
                  { text: "Copy Profile Link", onPress: () => Alert.alert("Copied", "Profile link copied to clipboard.") },
                  { text: "Cancel", style: "cancel" }
                ]
              );
            }}>
              <Lucide name="ellipsis-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 🔴 PROFILE SUMMARY AND STATS BLOCK — Exact parity with account.tsx */}
          <View style={styles.profileSection}>
            <View style={styles.avatarStatsRow}>
              {/* Avatar with gradient ring (NO + badge, NO bubble overlay) */}
              <View style={styles.avatarGroup}>
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
                      {profile.logo ? (
                        <Image
                          source={{ uri: profile.logo }}
                          style={{ width: "100%", height: "100%", borderRadius: 38 }}
                        />
                      ) : (
                        <Text style={styles.avatarInitial}>
                          {profile.profileName?.[0]?.toUpperCase() || "?"}
                        </Text>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Stats Columns */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatCompactNumber(profile.postsCount || 0)}</Text>
                  <Text style={styles.statLabel}>posts</Text>
                </View>
                <TouchableOpacity style={styles.statItem} onPress={() => {
                  triggerHaptic("light");
                  setNetworkTab("followers");
                  setShowNetworkModal(true);
                }}>
                  <Text style={styles.statNumber}>{formatCompactNumber(profile.followersCount || 0)}</Text>
                  <Text style={styles.statLabel}>followers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statItem} onPress={() => {
                  triggerHaptic("light");
                  setNetworkTab("following");
                  setShowNetworkModal(true);
                }}>
                  <Text style={styles.statNumber}>{formatCompactNumber(profile.followingCount || 0)}</Text>
                  <Text style={styles.statLabel}>following</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🔴 BIO DESCRIPTION & WEBSITES */}
            <View style={styles.bioContainer}>
              <Text style={styles.bioBrandName}>{profile.profileName}</Text>
              <Text style={styles.bioCategory}>{profile.category}</Text>
              <Text style={styles.bioDescriptionText}>{profile.bioText}</Text>

              {profile.websiteLink ? (
                <TouchableOpacity
                  style={styles.websiteRow}
                  onPress={() => {
                    triggerHaptic("light");
                    openExternalUrl(profile.websiteLink);
                  }}
                >
                  <Lucide name="link-outline" size={15} color="#00f5ff" />
                  <Text style={styles.websiteText}>{profile.websiteLink}</Text>
                </TouchableOpacity>
              ) : null}

              {/* Threads pill badge exactly matching Instagram screenshot */}
              <TouchableOpacity 
                style={styles.threadsPill} 
                onPress={() => { triggerHaptic("light"); openExternalUrl(`https://threads.net/@${profile.username}`); }}
              >
                <Text style={styles.threadsIcon}>@</Text>
                <Text style={styles.threadsPillText}>{profile.username}</Text>
              </TouchableOpacity>

              {followedBy.length > 0 && (
                <View style={styles.socialProofRow}>
                  <View style={styles.socialProofAvatars}>
                    {followedBy.slice(0, 3).map((person, idx) => (
                      person.logo ? (
                        <Image
                          key={person.username}
                          source={{ uri: person.logo }}
                          style={[styles.socialProofAvatar, { zIndex: 3 - idx, marginLeft: idx > 0 ? -10 : 0 }]}
                        />
                      ) : (
                        <View
                          key={person.username}
                          style={[styles.socialProofAvatar, { zIndex: 3 - idx, marginLeft: idx > 0 ? -10 : 0, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }]}
                        >
                          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{person.name[0]?.toUpperCase()}</Text>
                        </View>
                      )
                    ))}
                  </View>
                  <Text style={styles.socialProofText} numberOfLines={2}>
                    Followed by{" "}
                    {followedBy.slice(0, 2).map((person, idx) => (
                      <Text key={person.username}>
                        {idx > 0 ? ", " : ""}
                        <Text style={styles.socialProofBold}>{person.username}</Text>
                      </Text>
                    ))}
                    {followedByOthersCount + Math.max(0, followedBy.length - 2) > 0 && (
                      <Text style={styles.socialProofBold}>
                        {" "}and {followedByOthersCount + Math.max(0, followedBy.length - 2)} others
                      </Text>
                    )}
                  </Text>
                </View>
              )}
            </View>

            {/* 🔴 HORIZONTAL TAG BADGES */}
            {((isOwnProfile ? tags : (profile.tags || [])).length > 0 || isOwnProfile) && (
              <View style={styles.tagsContainer}>
                {(isOwnProfile ? tags : (profile.tags || [])).map((tagItem: string, idx: number) => {
                  if (isOwnProfile) {
                    return (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.tagBadge}
                        onPress={() => handleRemoveTag(tagItem)}
                      >
                        <Text style={styles.tagBadgeText}>{tagItem}</Text>
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <View key={idx} style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>{tagItem}</Text>
                    </View>
                  );
                })}
                {isOwnProfile && (
                  <TouchableOpacity style={styles.addTagBtn} onPress={handleAddPress}>
                    <Lucide name="add" size={12} color="#00f5ff" />
                    <Text style={styles.addTagBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* 🔴 ACTION BUTTONS — Follow / Message / Contact / Add Coords exactly matching Instagram screenshot */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isFollowing
                  ? styles.actionBtnOutline
                  : styles.actionBtnPrimary
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? "#fff" : "#080415"} />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[
                    styles.actionBtnText,
                    !isFollowing && styles.actionBtnTextPrimary
                  ]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                  {isFollowing && <Lucide name="chevron-down" size={13} color="#fff" />}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => { triggerHaptic("light"); setShowContactSheet(true); }}>
              <Text style={styles.actionBtnText}>Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.actionBtnSmall, 
                showSuggested && { backgroundColor: "rgba(0, 245, 255, 0.12)", borderWidth: 1, borderColor: "#00f5ff" }
              ]} 
              onPress={() => { triggerHaptic("light"); setShowSuggested(!showSuggested); }}
            >
              <Lucide name={showSuggested ? "person-remove-outline" : "person-add-outline"} size={16} color={showSuggested ? "#00f5ff" : "#fff"} />
            </TouchableOpacity>
          </View>

          {/* 👥 SUGGESTED CREATORS COLLAPSIBLE TRAY */}
          {showSuggested && (
            <View style={styles.suggestedContainer}>
              <View style={styles.suggestedHeader}>
                <Text style={styles.suggestedTitle}>Suggested for you</Text>
                <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowSuggested(false); }}>
                  <Text style={styles.suggestedSeeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedScroll}>
                {suggestedProfiles.length === 0 ? (
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, paddingVertical: 12 }}>No suggestions right now</Text>
                ) : (
                  suggestedProfiles.map((p) => (
                    <View key={p.id} style={styles.suggestedCard}>
                      <TouchableOpacity style={styles.suggestedCloseBtn} onPress={() => {
                        triggerHaptic("light");
                        setSuggestedProfiles(prev => prev.filter(x => x.id !== p.id));
                      }}>
                        <Lucide name="close" size={14} color="rgba(255,255,255,0.3)" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push(`/profile/${p.username}` as any)}>
                        {p.avatar ? (
                          <Image source={{ uri: p.avatar }} style={styles.suggestedAvatar} />
                        ) : (
                          <View style={[styles.suggestedAvatar, { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }]}>
                            <Text style={{ color: "#fff", fontWeight: "700" }}>{p.name[0]?.toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={styles.suggestedName} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.suggestedHandle} numberOfLines={1}>@{p.username}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.suggestedFollowBtn,
                          p.followed ? styles.suggestedFollowBtnActive : styles.suggestedFollowBtnPrimary
                        ]}
                        onPress={() => handleSuggestedFollow(p)}
                      >
                        <Text style={[
                          styles.suggestedFollowText,
                          p.followed && { color: "#ffffff" }
                        ]}>
                          {p.followed ? "Following" : "Follow"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* 🔴 HIGHLIGHTS ROW (no "New" / "+" button for other user) */}
          {viewingHighlights.length > 0 && (
          <View style={styles.highlightsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
              {viewingHighlights.map((hl: any) => (
                <TouchableOpacity
                  key={hl.id}
                  style={styles.highlightItem}
                  onPress={() => {
                    triggerHaptic("light");
                    Alert.alert("Highlight", `Viewing "${hl.title}" story highlight.`);
                  }}
                >
                  <View style={styles.highlightCircle}>
                    <Image source={{ uri: hl.avatar }} style={styles.highlightImage} />
                  </View>
                  <Text style={styles.highlightTitle} numberOfLines={1}>{hl.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          )}

          {/* 🔮 CREATOR SCORE INFLUENCE BANNER (CREATOR ONLY) */}
          {isCreatorProfile && (
            <View style={styles.creatorBannerCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.auraBadgeCircle}>
                  <Text style={styles.auraBadgeText}>AURA</Text>
                </View>
                <View>
                  <Text style={styles.creatorBannerTitle}>Creator Rank • Verified</Text>
                  <Text style={styles.creatorBannerScore}>Aura Score: {profile.auraScore || "9.8"}/10 ✦ High Influence</Text>
                </View>
              </View>
            </View>
          )}

          {isBlockedProfile ? (
            <View style={styles.privateContainer}>
              <View style={styles.privateIconCircle}>
                <Lucide name="ban-outline" size={38} color="#8e8e8e" />
              </View>
              <Text style={styles.privateTitle}>You blocked this account</Text>
              <Text style={styles.privateSubtitle}>
                You won't see posts from @{profile.username}. Unblock to view their profile again.
              </Text>
              <TouchableOpacity
                style={styles.unblockBtn}
                onPress={async () => {
                  triggerHaptic("medium");
                  await unblockUser(profile.profileId);
                  await refreshSocialGraph();
                  Alert.alert("Unblocked", `@${profile.username} has been unblocked.`);
                }}
              >
                <Text style={styles.unblockBtnText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          ) : showPrivateOverlay ? (
            /* 🔒 PRIVATE ACCOUNT COORDINATES LOCK */
            <View style={styles.privateContainer}>
              <View style={styles.privateIconCircle}>
                <Lucide name="lock-closed-outline" size={38} color="#8e8e8e" />
              </View>
              <Text style={styles.privateTitle}>This Account is Private</Text>
              <Text style={styles.privateSubtitle}>
                Follow @{profile.username} to view their curated lookbook posts, reels, and storefront products.
              </Text>
            </View>
          ) : (
            <>
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
                {loadingPosts && (activeGridTab === "posts" || activeGridTab === "reels") ? (
                  <ActivityIndicator size="small" color="#00f5ff" style={{ marginVertical: 32, width: "100%" }} />
                ) : null}

                {activeGridTab === "posts" && (
                  profilePosts.filter((post) => !post.isVideo).length > 0 ? (
                    profilePosts.filter((post) => !post.isVideo).map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        style={styles.gridImageContainer}
                        onPress={() => {
                          triggerHaptic("medium");
                          openGridItem("posts", post.id);
                        }}
                      >
                        <Image source={{ uri: post.thumbnail || post.url }} style={styles.gridPostImage} />
                      </TouchableOpacity>
                    ))
                  ) : !loadingPosts ? (
                    <ProfileGridEmpty tab="posts" />
                  ) : null
                )}

                {activeGridTab === "reels" && (
                  profilePosts.filter((post) => post.isVideo).length > 0 ? (
                    profilePosts.filter((post) => post.isVideo).map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        style={styles.gridImageContainer}
                        onPress={() => {
                          triggerHaptic("medium");
                          openGridItem("reels", post.id);
                        }}
                      >
                        <Image source={{ uri: post.thumbnail || post.url }} style={styles.gridPostImage} />
                        <View style={styles.gridVideoBadge}>
                          <Lucide name="play" size={11} color="#ffffff" />
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : !loadingPosts ? (
                    <ProfileGridEmpty tab="reels" />
                  ) : null
                )}

                {activeGridTab === "products" && (
                  viewingProducts.length > 0 ? (
                    viewingProducts.map((product: any) => {
                      const imageUrl = product.images?.[0] || "";
                      return (
                        <TouchableOpacity
                          key={product.id}
                          style={styles.gridImageContainer}
                          onPress={() => {
                            triggerHaptic("medium");
                            openGridItem("products", product.id);
                          }}
                        >
                          <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                          <View style={styles.gridPriceBadge}>
                            <Text style={styles.gridPriceText}>₹{product.price?.toLocaleString()}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <ProfileGridEmpty tab="products" />
                  )
                )}

                {activeGridTab === "collabs" && (
                  viewingProducts.length > 0 ? (
                    viewingProducts.map((product: any) => {
                      const imageUrl = product.images?.[0] || "";
                      return (
                        <TouchableOpacity
                          key={product.id}
                          style={styles.gridImageContainer}
                          onPress={() => {
                            triggerHaptic("medium");
                            openGridItem("collabs", product.id);
                          }}
                        >
                          <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                          <View style={styles.gridAffiliateBadge}>
                            <Text style={styles.gridAffiliateText}>10% Commission</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <ProfileGridEmpty tab="collabs" />
                  )
                )}
              </View>
            </>
          )}

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
                  {formatCompactNumber(profile.followersCount || 0)} Followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.networkTabItem, networkTab === "following" && styles.networkTabItemActive]} 
                onPress={() => { triggerHaptic("light"); setNetworkTab("following"); }}
              >
                <Text style={[styles.networkTabText, networkTab === "following" && styles.networkTabTextActive]}>
                  {formatCompactNumber(profile.followingCount || 0)} Following
                </Text>
              </TouchableOpacity>
            </View>

            {loadingNetwork ? (
              <ActivityIndicator size="small" color="#00f5ff" style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={networkUsers}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40, flexGrow: 1 }}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                      {networkTab === "followers" ? "No followers yet" : "Not following anyone yet"}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.networkUserRow}>
                    <TouchableOpacity
                      style={styles.networkUserLeft}
                      onPress={() => {
                        triggerHaptic("light");
                        setShowNetworkModal(false);
                        router.push(`/profile/${item.username}` as any);
                      }}
                    >
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.networkUserAvatar} />
                      ) : (
                        <View style={[styles.networkUserAvatar, { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }]}>
                          <Text style={{ color: "#fff", fontWeight: "700" }}>{item.name[0]?.toUpperCase() || "?"}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={styles.networkUserName}>{item.name}</Text>
                        <Text style={styles.networkUserHandle}>@{item.username}</Text>
                      </View>
                    </TouchableOpacity>
                    {item.id !== activeProfile?.id && activeProfile?.id && (
                      <TouchableOpacity
                        style={[
                          styles.networkFollowBtn,
                          item.followed ? styles.networkFollowBtnOutline : styles.networkFollowBtnPrimary
                        ]}
                        onPress={() => handleNetworkFollowToggle(item)}
                      >
                        <Text style={[styles.networkFollowBtnText, item.followed && { color: "#fff" }]}>
                          {item.followed ? "Following" : "Follow"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            )}
            
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => { triggerHaptic("light"); setShowNetworkModal(false); }}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 💬 DIRECT MESSAGE CHAT DRAWER */}
      <Modal
        visible={showMessageSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMessageSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatModalContainer}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <Image source={{ uri: profile.logo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100" }} style={styles.chatHeaderAvatar} />
                <View>
                  <Text style={styles.chatHeaderTitle}>{profile.profileName}</Text>
                  <Text style={styles.chatHeaderSubtitle}>Active now • curator-node</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowMessageSheet(false); }}>
                <Lucide name="close-circle-outline" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={chatMessages}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.chatBubbleContainer, item.isSender ? styles.chatBubbleSender : styles.chatBubbleReceiver]}>
                  <View style={[styles.chatBubble, item.isSender ? styles.chatBubbleSenderStyle : styles.chatBubbleReceiverStyle]}>
                    <Text style={styles.chatBubbleText}>{item.text}</Text>
                  </View>
                  <Text style={styles.chatBubbleTime}>{item.time}</Text>
                </View>
              )}
            />

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatTextInput}
                value={typedMessage}
                onChangeText={setTypedMessage}
                placeholder="Message..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <TouchableOpacity 
                style={[styles.chatSendBtn, !typedMessage.trim() && { opacity: 0.5 }]} 
                disabled={!typedMessage.trim()}
                onPress={() => {
                  if (!typedMessage.trim()) return;
                  triggerHaptic("medium");
                  const userMsg = { id: Date.now().toString(), text: typedMessage, isSender: true, time: "Just now" };
                  setChatMessages(prev => [...prev, userMsg]);
                  setTypedMessage("");

                  // Trigger simulated reply from the curator/brand agent!
                  setTimeout(() => {
                    triggerHaptic("success");
                    const replies = [
                      `Greetings! Thank you for reaching out ✦. Curation coordinates for @${profile.username} are actively queued.`,
                      `High-fidelity quiet luxury coords are reviewing. Let us know if you need specific catalog pricing!`,
                      `Thank you for connecting! We have logged your request on the AURA ledger. An atelier node will ping back shortly.`
                    ];
                    const replyText = replies[Math.floor(Math.random() * replies.length)];
                    const replyMsg = { id: (Date.now() + 1).toString(), text: replyText, isSender: false, time: "Just now" };
                    setChatMessages(prev => [...prev, replyMsg]);
                  }, 1500);
                }}
              >
                <Lucide name="send" size={20} color="#00f5ff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📞 CONTACT BOTTOM SHEET ACTION PANEL */}
      <Modal
        visible={showContactSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.contactModalContainer}>
            <View style={styles.modalHeaderBar}>
              <View style={styles.modalIndicator} />
            </View>
            <Text style={styles.contactModalTitle}>Contact @{profile.username}</Text>
            
            <TouchableOpacity 
              style={styles.contactModalBtn}
              onPress={() => {
                triggerHaptic("medium");
                setShowContactSheet(false);
                Linking.openURL("mailto:curator-node-5@aura.luxury");
              }}
            >
              <Lucide name="mail-outline" size={22} color="#00f5ff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.contactBtnTitle}>Send Email</Text>
                <Text style={styles.contactBtnSubtitle}>curator-node-5@aura.luxury</Text>
              </View>
              <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactModalBtn}
              onPress={() => {
                triggerHaptic("medium");
                setShowContactSheet(false);
                Linking.openURL("https://t.me/aura_curator");
              }}
            >
              <Lucide name="paper-plane-outline" size={22} color="#a78bfa" />
              <View style={{ flex: 1 }}>
                <Text style={styles.contactBtnTitle}>Telegram Chat</Text>
                <Text style={styles.contactBtnSubtitle}>@aura_curator</Text>
              </View>
              <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactModalBtn, { borderBottomWidth: 0 }]}
              onPress={() => {
                triggerHaptic("medium");
                setShowContactSheet(false);
                Linking.openURL(`https://instagram.com/${profile.username}`);
              }}
            >
              <Lucide name="logo-instagram" size={22} color="#fb923c" />
              <View style={{ flex: 1 }}>
                <Text style={styles.contactBtnTitle}>Instagram Coordinate</Text>
                <Text style={styles.contactBtnSubtitle}>instagram.com/{profile.username}</Text>
              </View>
              <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactCloseBtn} 
              onPress={() => { triggerHaptic("light"); setShowContactSheet(false); }}
            >
              <Text style={styles.contactCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {profile ? (
        <ProfileGridViewer
          visible={gridViewer.visible}
          onClose={closeGridViewer}
          tab={gridViewer.tab}
          initialItemId={gridViewer.initialItemId}
          profile={{
            username: profile.username,
            name: profile.profileName || profile.username,
            logo: profile.logo,
            profileId: profile.profileId,
          }}
          posts={profilePosts}
          products={viewingProducts}
          isOwnProfile={isOwnProfile}
          onPostDeleted={(postId) => {
            setProfilePosts((prev) => {
              const next = prev.filter((p) => p.id !== postId);
              if (next.length === 0) closeGridViewer();
              return next;
            });
            if (username) fetchViewProfile(username, activeProfile?.id);
          }}
        />
      ) : null}

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },

  // ==========================================
  // INTERACTIVE PORTAL STYLES (DMs, SUGGESTED, MODALS)
  // ==========================================
  
  // Suggested curators collapsible tray styles
  suggestedContainer: {
    backgroundColor: "rgba(255,255,255,0.015)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
  },
  suggestedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  suggestedTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  suggestedSeeAll: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "600",
  },
  suggestedScroll: {
    paddingHorizontal: 10,
    gap: 8,
  },
  suggestedCard: {
    width: 110,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    position: "relative",
  },
  suggestedCloseBtn: {
    position: "absolute",
    right: 6,
    top: 6,
    zIndex: 2,
  },
  suggestedAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.2)",
  },
  suggestedName: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  suggestedHandle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9.5,
    marginTop: 1,
    marginBottom: 8,
    textAlign: "center",
    width: "100%",
  },
  suggestedFollowBtn: {
    width: "100%",
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestedFollowBtnPrimary: {
    backgroundColor: "#00f5ff",
  },
  suggestedFollowBtnActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  suggestedFollowText: {
    color: "#080415",
    fontSize: 10.5,
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

  // DM Chat modal styles
  chatModalContainer: {
    height: "75%",
    backgroundColor: "#0d0920",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 0,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#00f5ff",
  },
  chatHeaderTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  chatHeaderSubtitle: {
    color: "#00f5ff",
    fontSize: 10.5,
    marginTop: 1.5,
  },
  chatBubbleContainer: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  chatBubbleSender: {
    alignSelf: "flex-end",
  },
  chatBubbleReceiver: {
    alignSelf: "flex-start",
  },
  chatBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9.5,
  },
  chatBubbleSenderStyle: {
    backgroundColor: "#00f5ff",
    borderBottomRightRadius: 2,
  },
  chatBubbleReceiverStyle: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 2,
  },
  chatBubbleText: {
    color: "#080415",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  chatBubbleTime: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9.5,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  chatInputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0d0920",
    alignItems: "center",
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    height: 38,
    paddingHorizontal: 16,
    color: "#ffffff",
    fontSize: 13,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,245,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Contact modal sheet styles
  contactModalContainer: {
    backgroundColor: "#0d0920",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 0,
  },
  contactModalTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  contactModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 14,
  },
  contactBtnTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  contactBtnSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    marginTop: 2,
  },
  contactCloseBtn: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  contactCloseText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "bold",
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

  // Header Row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  backBtn: {
    padding: 2,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUsername: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
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
  avatarInitial: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "300",
    fontFamily: "System",
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
    backgroundColor: "rgba(255,255,255,0.035)",
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

  // Action Buttons Row — Follow / Message / Share
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnPrimary: {
    backgroundColor: "#00f5ff",
  },
  actionBtnOutline: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "600",
  },
  actionBtnTextPrimary: {
    color: "#080415",
    fontWeight: "bold",
  },
  actionBtnSmall: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "center",
    alignItems: "center",
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

  // Creator Influence Banner
  creatorBannerCard: {
    backgroundColor: "rgba(0,245,255,0.04)",
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
  gridAffiliateBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,245,255,0.85)",
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
  
  // Private lock container elements exactly matching Instagram aesthetics
  privateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    marginTop: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  privateIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  privateTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  privateSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 18.5,
  },
  unblockBtn: {
    marginTop: 20,
    backgroundColor: "#00f5ff",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  unblockBtnText: {
    color: "#080415",
    fontWeight: "700",
    fontSize: 14,
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
});
