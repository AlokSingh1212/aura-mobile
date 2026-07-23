import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { formatCompactNumber } from "@/constants/format";
import { useA11yProps } from "@/hooks/useA11yProps";

export type LikedUserItem = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  hasStory?: boolean;
  isFollowing?: boolean;
};

type HomeFeedLikesViewsModalProps = {
  visible: boolean;
  targetPost: any;
  sheetHeight?: number;
  bottomInset?: number;
  likesCount?: number;
  viewsCount?: number;
  likersList?: LikedUserItem[];
  currentUserId?: string;
  currentProfileId?: string;
  triggerHaptic?: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onOpenProfile: (username: string) => void;
  onToggleFollow: (profileId: string) => void;
};

const DEFAULT_MOCK_LIKERS: LikedUserItem[] = [
  {
    id: "liker_1",
    username: "yudhveer_singh_palri",
    fullName: "Yudhveer Rao",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    hasStory: false,
    isFollowing: true,
  },
  {
    id: "liker_2",
    username: "sudhir_karwasara",
    fullName: "SUDHIR CHOUDHARY",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    hasStory: false,
    isFollowing: false,
  },
  {
    id: "liker_3",
    username: "raunak.kr",
    fullName: "Kumar Raunak",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    hasStory: false,
    isFollowing: false,
  },
  {
    id: "liker_4",
    username: "ishaan_rautela",
    fullName: "Ishaan Rautela ✌️",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    hasStory: true,
    isFollowing: false,
  },
  {
    id: "liker_5",
    username: "tripathy_chan",
    fullName: "Chandan Tripathy",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    hasStory: false,
    isFollowing: false,
  },
  {
    id: "liker_6",
    username: "aarav_verma",
    fullName: "Aarav Verma",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    hasStory: false,
    isFollowing: true,
  },
];

export function HomeFeedLikesViewsModal({
  visible,
  targetPost,
  sheetHeight = 560,
  bottomInset = 20,
  likesCount,
  viewsCount,
  likersList,
  currentUserId,
  currentProfileId,
  triggerHaptic,
  onClose,
  onOpenProfile,
  onToggleFollow,
}: HomeFeedLikesViewsModalProps) {
  const { a11yProps } = useA11yProps();
  const [searchQuery, setSearchQuery] = useState("");
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  const displayLikes = likesCount ?? targetPost?.content?.likesCount ?? targetPost?.likesCount ?? 103000;
  const displayViews = viewsCount ?? targetPost?.content?.viewsCount ?? targetPost?.viewsCount ?? 1000000;

  const rawLikers = useMemo(() => {
    if (likersList && likersList.length > 0) return likersList;
    if (targetPost?.likers && Array.isArray(targetPost.likers) && targetPost.likers.length > 0) {
      return targetPost.likers;
    }
    return DEFAULT_MOCK_LIKERS;
  }, [likersList, targetPost]);

  const filteredLikers = useMemo(() => {
    if (!searchQuery.trim()) return rawLikers;
    const q = searchQuery.toLowerCase().trim();
    return rawLikers.filter(
      (u: LikedUserItem) =>
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q)
    );
  }, [rawLikers, searchQuery]);

  const handleToggle = (user: LikedUserItem) => {
    triggerHaptic?.("medium");
    const currentStatus = followingStates[user.id] ?? user.isFollowing ?? false;
    setFollowingStates((prev) => ({
      ...prev,
      [user.id]: !currentStatus,
    }));
    onToggleFollow(user.id);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContent, { height: sheetHeight, paddingBottom: bottomInset + 12 }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Likes and views</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              {...a11yProps("Close likes and views", { role: "button" })}
            >
              <Lucide name="close" size={22} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Top Metrics Row: Likes & Views */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Lucide name="heart-outline" size={26} color="#000000" />
              <Text style={styles.metricValue}>{formatCompactNumber(displayLikes)}</Text>
            </View>

            <View style={styles.metricItem}>
              <Lucide name="eye-outline" size={26} color="#000000" />
              <Text style={styles.metricValue}>{formatCompactNumber(displayViews)}</Text>
            </View>
          </View>

          {/* Subheader Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Liked by</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Lucide name="search-outline" size={18} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Likers List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredLikers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No matches found</Text>
              </View>
            ) : (
              filteredLikers.map((user: LikedUserItem) => {
                const isFollowing = followingStates[user.id] ?? user.isFollowing ?? false;
                const isMe =
                  (currentUserId && user.id === currentUserId) ||
                  (currentProfileId && user.id === currentProfileId);

                return (
                  <View key={user.id} style={styles.userRow}>
                    <TouchableOpacity
                      style={styles.userProfileTouch}
                      onPress={() => {
                        onClose();
                        onOpenProfile(user.username);
                      }}
                      activeOpacity={0.7}
                    >
                      {/* Avatar with Ring */}
                      <View style={[styles.avatarContainer, user.hasStory && styles.storyRing]}>
                        <Image
                          source={{ uri: user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" }}
                          style={styles.avatarImg}
                        />
                      </View>

                      {/* Username & Full Name */}
                      <View style={styles.userInfo}>
                        <Text style={styles.username} numberOfLines={1}>
                          {user.username}
                        </Text>
                        <Text style={styles.fullName} numberOfLines={1}>
                          {user.fullName}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Follow Action Button */}
                    {!isMe && (
                      <TouchableOpacity
                        style={[
                          styles.followBtn,
                          isFollowing ? styles.followingBtn : styles.followBtnActive,
                        ]}
                        onPress={() => handleToggle(user)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.followBtnText,
                            isFollowing ? styles.followingBtnText : styles.followBtnTextActive,
                          ]}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    padding: 4,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 48,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEEF6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
    paddingVertical: 0,
  },
  scrollList: {
    flex: 1,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  userProfileTouch: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    marginRight: 12,
  },
  storyRing: {
    borderWidth: 2,
    borderColor: "#E1306C",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  username: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  fullName: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: "#3897F0",
  },
  followingBtn: {
    backgroundColor: "#EFEFEF",
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  followBtnTextActive: {
    color: "#FFFFFF",
  },
  followingBtnText: {
    color: "#000000",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
  },
});
