import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeActivityStyles as styles } from "@/components/home/homeActivityStyles";
import { respondBrandPartnershipWithConfirmation } from "@/lib/brandPartnershipApi";
import { respondProductCollabWithConfirmation } from "@/lib/productCollabApi";
import { respondToCollabWithConfirmation } from "@/lib/collabApi";
import {
  notificationDisplayText,
  isGroupedEngagement,
  type ActivityNotification,
} from "@/lib/notificationDisplay";
import { useA11yProps } from "@/hooks/useA11yProps";

type HomeActivityDrawerProps = {
  visible: boolean;
  activeProfile: any;
  currentUserId?: string;
  notifications: ActivityNotification[];
  loadingNotifications: boolean;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onOpenAdsHub: () => void;
  onOpenDashboard: () => void;
  onRefreshNotifications: (type?: "ALL" | "LIKE" | "COMMENT" | "FOLLOW") => void;
  onOpenProfile: (username: string) => void;
};

export function HomeActivityDrawer({
  visible,
  activeProfile,
  currentUserId,
  notifications,
  loadingNotifications,
  triggerHaptic,
  onClose,
  onOpenAdsHub,
  onOpenDashboard,
  onRefreshNotifications,
  onOpenProfile,
}: HomeActivityDrawerProps) {
  const { a11yProps } = useA11yProps();
  const [filter, setFilter] = useState<"ALL" | "LIKE" | "COMMENT" | "FOLLOW">("ALL");

  useEffect(() => {
    if (visible && activeProfile?.id) {
      onRefreshNotifications(filter);
    }
  }, [visible, filter, activeProfile?.id, onRefreshNotifications]);

  const filters: { id: "ALL" | "LIKE" | "COMMENT" | "FOLLOW"; label: string }[] = [
    { id: "ALL", label: "All" },
    { id: "LIKE", label: "Likes" },
    { id: "COMMENT", label: "Comments" },
    { id: "FOLLOW", label: "Follows" },
  ];

  return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.dismissTouchable} 
            onPress={() => onClose()} 
          />
          <View style={styles.panel}>
            {/* Header notch indicator */}
            <View style={styles.notch} />
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => onClose()} style={styles.backBtn} {...a11yProps("Close activity", { role: "button" })}>
                <Lucide name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.headerTitleWrapper}>
                <Text style={styles.headerTitle}>
                  {activeProfile ? activeProfile.username : "activity"}
                </Text>
                <Lucide name="chevron-down" size={12} color="#00f5ff" style={{ marginLeft: 3, marginTop: 2 }} />
                {/* Red dot notification */}
                <View style={styles.headerRedDot} />
              </View>

              <TouchableOpacity onPress={() => onClose()}>
                <Lucide name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* 📈 DYNAMIC PROFESSIONAL ADS PROMOTIONS BANNER */}
            {(activeProfile?.type === "BUSINESS" || activeProfile?.type === "INFLUENCER") && (
              <TouchableOpacity 
                style={styles.adsBanner}
                onPress={() => {
                  triggerHaptic("medium");
                  onOpenAdsHub();
                }}
              >
                <View style={styles.adsIconContainer}>
                  <Lucide name="trending-up" size={20} color="#fff" />
                </View>
                <View style={styles.adsTextContainer}>
                  <Text style={styles.adsTitle}>Ads</Text>
                  <Text style={styles.adsSubtitle}>Recent activity from your ads.</Text>
                </View>
                <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filters.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setFilter(f.id);
                  }}
                >
                  <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.notificationList} showsVerticalScrollIndicator={false}>
              {loadingNotifications ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#00f5ff" />
                  <Text style={styles.loadingText}>Fetching activity pulse...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Lucide name="heart-outline" size={40} color="rgba(255,255,255,0.2)" />
                  </View>
                  <Text style={styles.emptyTitle}>No Activity Yet</Text>
                  <Text style={styles.emptySubtitle}>When other users follow you, comment, or send brand offers, they'll pulse here!</Text>
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

                  if (
                    (item.type === "BRAND_DEAL" ||
                      item.type === "BRAND_DEAL_COMPLETED" ||
                      item.type === "COLLAB_INVITE" ||
                      item.type === "PRODUCT_COLLAB_INVITE") &&
                    !item.read
                  ) {
                    highlights.push(item);
                  } else if (elapsedDays <= 7) {
                    last7Days.push(item);
                  } else {
                    last30Days.push(item);
                  }
                });

                const renderCard = (item: ActivityNotification) => {
                  let badgeColor = "#8b5cf6"; // Purple default
                  let badgeIcon = "notifications-outline";
                  if (item.type === "FOLLOW") {
                    badgeColor = "#fb923c"; // Orange
                    badgeIcon = "person-add-outline";
                  } else if (item.type === "BRAND_DEAL") {
                    badgeColor = "#818cf8";
                    badgeIcon = "briefcase-outline";
                  } else if (item.type === "BRAND_DEAL_ACCEPTED") {
                    badgeColor = "#34d399";
                    badgeIcon = "checkmark-circle-outline";
                  } else if (item.type === "BRAND_DEAL_DECLINED") {
                    badgeColor = "#94a3b8";
                    badgeIcon = "close-outline";
                  } else if (item.type === "BRAND_DEAL_COMPLETED") {
                    badgeColor = "#818cf8";
                    badgeIcon = "wallet-outline";
                  } else if (item.type === "LIKE") {
                    badgeColor = "#d946ef"; // Magenta
                    badgeIcon = "heart";
                  } else if (item.type === "COMMENT") {
                    badgeColor = "#3b82f6"; // Blue
                    badgeIcon = "chatbubble-outline";
                  } else if (item.type === "COLLAB_INVITE") {
                    badgeColor = "#00f5ff";
                    badgeIcon = "people-outline";
                  } else if (item.type === "PRODUCT_COLLAB_INVITE") {
                    badgeColor = "#fbbf24";
                    badgeIcon = "bag-handle-outline";
                  } else if (item.type === "PRODUCT_COLLAB_ACCEPTED") {
                    badgeColor = "#34d399";
                    badgeIcon = "checkmark-circle-outline";
                  } else if (item.type === "COLLAB_ACCEPTED" || item.type === "COLLAB_POST") {
                    badgeColor = "#34d399";
                    badgeIcon = "people-outline";
                  } else if (item.type === "COLLAB_DECLINED") {
                    badgeColor = "#94a3b8";
                    badgeIcon = "close-outline";
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

                  const grouped = isGroupedEngagement(item);
                  const bodyText = notificationDisplayText(item);

                  return (
                    <View
                      key={item.groupKey ?? item.id}
                      style={[styles.card, !item.read && styles.cardUnread]}
                    >
                      <TouchableOpacity
                        onPress={() => onOpenProfile(item.senderUsername)}
                        activeOpacity={0.85}
                        {...a11yProps(`Open profile ${item.senderUsername}`, { role: "button" })}
                      >
                        <View style={styles.avatarWrapper}>
                          <Image
                            source={{
                              uri:
                                item.senderLogo ||
                                "https://auragram.com/logo.png",
                            }}
                            style={styles.avatar}
                          />
                          {grouped && (item.groupedCount ?? 0) > 1 && (
                            <View style={styles.groupCountBadge}>
                              <Text style={styles.groupCountBadgeText}>
                                {(item.groupedCount ?? 0) > 99 ? "99+" : item.groupedCount}
                              </Text>
                            </View>
                          )}
                          <View style={[styles.badgeDot, { backgroundColor: badgeColor }]}>
                            <Lucide name={badgeIcon as any} size={8} color="#fff" />
                          </View>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.contentBlock}>
                        <Text style={styles.messageText}>
                          {grouped || item.senderUsername === "system" ? (
                            <>
                              {bodyText}
                              <Text style={styles.timeText}>  {formattedTime()}</Text>
                            </>
                          ) : (
                            <>
                              <Text
                                style={styles.senderUsername}
                                onPress={() => onOpenProfile(item.senderUsername)}
                              >
                                @{item.senderUsername}{" "}
                              </Text>
                              {item.message}
                              <Text style={styles.timeText}>  {formattedTime()}</Text>
                            </>
                          )}
                        </Text>
                      </View>
                      
                      {item.type === "FOLLOW" && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => {
                            triggerHaptic("medium");
                            Alert.alert("Network Node Sync", `Following back @${item.senderUsername} dynamically.`);
                          }}
                        >
                          <Text style={styles.actionButtonText}>Follow back</Text>
                        </TouchableOpacity>
                      )}

                      {item.type === "BRAND_DEAL_COMPLETED" &&
                        item.relatedDealId &&
                        activeProfile?.type === "BUSINESS" && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: "#818cf8" }]}
                            onPress={async () => {
                              if (!currentUserId || !activeProfile?.id) return;
                              const result = await respondBrandPartnershipWithConfirmation({
                                userId: currentUserId,
                                profileId: activeProfile.id,
                                dealId: item.relatedDealId!,
                                respondAction: "confirm",
                              });
                              if (result.success) onRefreshNotifications();
                            }}
                          >
                            <Text style={[styles.actionButtonText, { color: "#080415", fontWeight: "bold" }]}>
                              Confirm & pay
                            </Text>
                          </TouchableOpacity>
                        )}

                      {item.type === "BRAND_DEAL" && item.relatedDealId && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: "#00f5ff" }]}
                            onPress={async () => {
                              if (!currentUserId || !activeProfile?.id) return;
                              triggerHaptic("medium");
                              const result = await respondBrandPartnershipWithConfirmation({
                                userId: currentUserId,
                                profileId: activeProfile.id,
                                dealId: item.relatedDealId!,
                                respondAction: "accept",
                              });
                              if (result.success) {
                                triggerHaptic("success");
                                onRefreshNotifications();
                              }
                            }}
                          >
                            <Text style={[styles.actionButtonText, { color: "#080415", fontWeight: "bold" }]}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: "rgba(255,255,255,0.08)" }]}
                            onPress={async () => {
                              if (!currentUserId || !activeProfile?.id) return;
                              const result = await respondBrandPartnershipWithConfirmation({
                                userId: currentUserId,
                                profileId: activeProfile.id,
                                dealId: item.relatedDealId!,
                                respondAction: "decline",
                              });
                              if (result.success) onRefreshNotifications();
                            }}
                          >
                            <Text style={[styles.actionButtonText, { color: "#fff" }]}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {item.type === "PRODUCT_COLLAB_INVITE" && item.relatedDealId && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={async () => {
                              if (!currentUserId || !activeProfile?.id) return;
                              triggerHaptic("medium");
                              const result = await respondProductCollabWithConfirmation({
                                userId: currentUserId,
                                profileId: activeProfile.id,
                                collabId: item.relatedDealId!,
                                respondAction: "accept",
                              });
                              if (result.success) {
                                triggerHaptic("success");
                                onRefreshNotifications();
                              }
                            }}
                          >
                            <Text style={styles.actionButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: "rgba(255,255,255,0.08)" }]}
                            onPress={async () => {
                              if (!currentUserId || !activeProfile?.id) return;
                              const result = await respondProductCollabWithConfirmation({
                                userId: currentUserId,
                                profileId: activeProfile.id,
                                collabId: item.relatedDealId!,
                                respondAction: "decline",
                              });
                              if (result.success) onRefreshNotifications();
                            }}
                          >
                            <Text style={[styles.actionButtonText, { color: "#fff" }]}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {item.type === "COLLAB_INVITE" && item.relatedPostId && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={async () => {
                              if (!currentUserId || !activeProfile?.id) return;
                              triggerHaptic("medium");
                              const result = await respondToCollabWithConfirmation({
                                postId: item.relatedPostId!,
                                userId: currentUserId,
                                profileId: activeProfile.id,
                                action: "accept",
                              });
                              if (result.success) {
                                triggerHaptic("success");
                                onRefreshNotifications();
                              }
                            }}
                          >
                            <Text style={styles.actionButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: "rgba(255,255,255,0.08)" }]}
                            onPress={async () => {
                              if (!currentUserId || !activeProfile?.id) return;
                              triggerHaptic("light");
                              const result = await respondToCollabWithConfirmation({
                                postId: item.relatedPostId!,
                                userId: currentUserId,
                                profileId: activeProfile.id,
                                action: "decline",
                              });
                              if (result.success) {
                                onRefreshNotifications();
                              }
                            }}
                          >
                            <Text style={[styles.actionButtonText, { color: "#fff" }]}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Thumbnail Preview on absolute right exactly matching Instagram! */}
                      {item.relatedPostThumbnail && (
                        <Image source={{ uri: item.relatedPostThumbnail }} style={styles.postThumbnail} />
                      )}
                    </View>
                  );
                };

                return (
                  <>
                    {/* Section 1: Highlights */}
                    {highlights.length > 0 && (
                      <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>Highlights</Text>
                        {highlights.map(renderCard)}
                      </View>
                    )}

                    {/* Section 2: Last 7 days */}
                    {last7Days.length > 0 && (
                      <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>Last 7 days</Text>
                        {last7Days.map(renderCard)}
                      </View>
                    )}

                    {/* Section 3: Last 30 days */}
                    {last30Days.length > 0 && (
                      <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>Last 30 days</Text>
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


  );
}
