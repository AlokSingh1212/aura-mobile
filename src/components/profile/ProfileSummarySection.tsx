import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { formatCompactNumber } from "@/constants/format";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { profileHeaderStyles as styles } from "@/components/profile/profileHeaderStyles";

export type ProfileHighlight = { id: string; title: string; avatar: string };

export type ProfileSummarySectionProps = {
  displayLogo: string | null;
  profileName: string;
  username: string;
  category: string;
  bioText: string;
  websiteLink: string;
  tags: string[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  auraScore: number;
  hasActiveStory: boolean;
  isUploadingMedia: boolean;
  isPersonalProfile: boolean;
  isCreatorProfile: boolean;
  isBusinessProfile: boolean;
  highlights: ProfileHighlight[];
  activeProfile: any;
  currentUser: any;
  triggerHaptic: (style: any) => void;
  onProfileAvatarTap: () => void;
  onAvatarPress: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  onRemoveTag: (tag: string) => void;
  onAddTag: () => void;
  onEditProfile: () => void;
  onShareProfile: () => void;
  onOpenAddProduct: () => void;
  onAddHighlight: () => void;
  onNotesBubbleTap?: () => void;
};

export function ProfileSummarySection(props: ProfileSummarySectionProps) {
  const {
    displayLogo,
    profileName,
    username,
    category,
    bioText,
    websiteLink,
    tags,
    postsCount,
    followersCount,
    followingCount,
    auraScore,
    hasActiveStory,
    isUploadingMedia,
    isPersonalProfile,
    isCreatorProfile,
    isBusinessProfile,
    highlights,
    activeProfile,
    currentUser,
    triggerHaptic,
    onProfileAvatarTap,
    onAvatarPress,
    onOpenFollowers,
    onOpenFollowing,
    onRemoveTag,
    onAddTag,
    onEditProfile,
    onShareProfile,
    onOpenAddProduct,
    onAddHighlight,
    onNotesBubbleTap,
  } = props;

  return (
    <>
            {/* 🔴 PROFILE SUMMARY AND STATS BLOCK */}
            <View style={styles.profileSection}>
              <View style={styles.avatarStatsRow}>
                {/* Avatar with dynamic notes bubble and bottom "+" badge */}
                <View style={styles.avatarGroup}>
                  {(activeProfile?.note || isPersonalProfile) && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        if (isPersonalProfile) {
                          triggerHaptic("medium");
                          onNotesBubbleTap?.();
                        }
                      }}
                      style={styles.bubbleOverlay}
                    >
                      <Text style={styles.bubbleText} numberOfLines={1}>
                        {activeProfile?.note || "Share vibe..."}
                      </Text>
                      <View style={styles.bubblePointer} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity activeOpacity={0.85} onPress={onProfileAvatarTap} disabled={isUploadingMedia}>
                    {hasActiveStory ? (
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
                            {displayLogo ? (
                              <Image 
                                source={{ uri: displayLogo }} 
                                key={displayLogo.slice(0, 64)}
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
                    ) : (
                      <View style={{
                        width: 88,
                        height: 88,
                        borderRadius: 44,
                        borderWidth: 1.5,
                        borderColor: "rgba(255,255,255,0.25)",
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
                          {displayLogo ? (
                            <Image 
                              source={{ uri: displayLogo }} 
                              key={displayLogo.slice(0, 64)}
                              style={{ width: "100%", height: "100%", borderRadius: 38 }} 
                            />
                          ) : (
                            <Text style={styles.avatarInitial}>
                              {(profileName || activeProfile?.name || currentUser?.name || username || "R")[0]?.toUpperCase()}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.avatarPlusBadge} onPress={onAvatarPress} disabled={isUploadingMedia}>
                    {isUploadingMedia ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Lucide name="add" size={13} color="#ffffff" />
                    )}
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
                      onOpenFollowers();
                    }}
                  >
                    <Text style={styles.statNumber}>{formatCompactNumber(followersCount)}</Text>
                    <Text style={styles.statLabel}>followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.statItem} 
                    onPress={() => {
                      triggerHaptic("light");
                      onOpenFollowing();
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
                      openExternalUrl(websiteLink);
                    }}
                  >
                    <Lucide name="link-outline" size={15} color="#00f5ff" />
                    <Text style={styles.websiteText}>{websiteLink}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Threads pill badge exactly matching Instagram screenshot */}
                <TouchableOpacity 
                  style={styles.threadsPill} 
                  onPress={() => { triggerHaptic("light"); router.push("/threads" as any); }}
                >
                  <Text style={styles.threadsIcon}>@</Text>
                  <Text style={styles.threadsPillText}>{username}</Text>
                </TouchableOpacity>
              </View>

              {/* 🔴 HORIZONTAL TAG BADGES */}
              <View style={styles.tagsContainer}>
                {tags.map((tagItem, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.tagBadge}
                    onPress={() => onRemoveTag(tagItem)}
                  >
                    <Text style={styles.tagBadgeText}>{tagItem}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addTagBtn} onPress={onAddTag}>
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
                  router.push("/account/pro-insights" as any);
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
              <TouchableOpacity style={styles.actionBtn} onPress={onEditProfile}>
                <Text style={styles.actionBtnText}>Edit profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={onShareProfile}>
                <Text style={styles.actionBtnText}>Share profile</Text>
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

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={onOpenAddProduct}>
                <Text style={styles.actionBtnText}>Add product</Text>
              </TouchableOpacity>
            </View>

            {/* 🔴 INTERACTIVE HIGHLIGHTS ROW */}
            <View style={styles.highlightsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
                
                {/* "+" New Button */}
                <TouchableOpacity style={styles.highlightItem} onPress={onAddHighlight}>
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
                    <Text style={styles.creatorBannerTitle}>
                      Creator Rank • {formatCompactNumber(followersCount)} followers
                    </Text>
                    <Text style={styles.creatorBannerScore}>
                      Aura Score: {(auraScore || 0).toFixed(1)}/10
                    </Text>
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


    </>
  );
}
