import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Image as RNImage, Alert, Modal, TextInput, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { ChatThreadAvatar } from "@/components/chat/ChatThreadAvatar";
import { collabInvitePreviewText } from "@/lib/collabMessage";
import { productCollabPreviewText } from "@/lib/productCollabMessage";
import { brandPartnershipPreviewText } from "@/lib/brandPartnershipMessage";
import { Avatar } from "@/components/ui/Avatar";

const { width, height } = Dimensions.get("window");

export const CHAT_CONVERSATION_LABELS = [
  { id: "flag", name: "Flag", icon: "flag-outline", color: "#ef4444" },
  { id: "booked", name: "Booked", icon: "calendar-outline", color: "#3b82f6" },
  { id: "lead", name: "Lead", icon: "pricetag-outline", color: "#10b981" },
  { id: "ordered", name: "Ordered", icon: "cart-outline", color: "#fbbf24" },
  { id: "paid", name: "Paid", icon: "cash-outline", color: "#8b5cf6" },
  { id: "shipped", name: "Shipped", icon: "bus-outline", color: "#ec4899" },
] as const;

const DM_FILTERS = ["Primary", "From ads", "Requests", "General"] as const;

type ChatPersonalInboxProps = {
  activeInstaStories: any[];
  activeProfile: any;
  currentUser: any;
  activeDmFilter: string;
  dmSearch: string;
  conversations: any[];
  loadingChats: boolean;
  conversationLabels: Record<string, string>;
  pinnedThreadIds: string[];
  mutedThreadIds: string[];
  triggerHaptic: (style: any) => void;
  onFilterChange: (filter: string) => void;
  onOpenStoryGroup?: (story: any) => void;
  onOpenThread: (thread: any) => void;
  onLongPressThread: (thread: any) => void;
};

export function ChatPersonalInbox({
  activeInstaStories,
  activeProfile,
  currentUser,
  activeDmFilter,
  dmSearch,
  conversations,
  loadingChats,
  conversationLabels,
  pinnedThreadIds,
  mutedThreadIds,
  triggerHaptic,
  onFilterChange,
  onOpenStoryGroup,
  onOpenThread,
  onLongPressThread,
}: ChatPersonalInboxProps) {
  const router = useRouter();
  const [inboxLocationInfo, setInboxLocationInfo] = useState<{ note: string | null; isGhostMode: boolean }>({
    note: null,
    isGhostMode: true
  });

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [updatingNote, setUpdatingNote] = useState(false);

  // Story state inside inbox
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const fetchInfo = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/mobile/location/friends?userId=${currentUser?.id || ""}`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success && data.myLocation) {
        setInboxLocationInfo({
          note: data.myLocation.note,
          isGhostMode: data.myLocation.isGhostMode
        });
        setNoteText(data.myLocation.note || "");
      }
    } catch (e) {
      console.warn("Failed to fetch location/note info for inbox:", e);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchInfo();
    }
  }, [currentUser?.id]);

  const submitNote = async () => {
    if (updatingNote) return;
    setUpdatingNote(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/profile/note`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUser?.id,
          profileId: activeProfile?.id,
          note: noteText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNoteModal(false);
        await fetchInfo();
      } else {
        Alert.alert("Error", data.error || "Failed to update note");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update status note");
    } finally {
      setUpdatingNote(false);
    }
  };

  const handleStoryTap = (story: any) => {
    if (story.isYourStory && (!story.slides || story.slides.length === 0)) {
      router.push("/create/story" as any);
      return;
    }
    if (story.slides && story.slides.length > 0) {
      setSelectedStory(story);
      setCurrentSlideIndex(0);
    } else {
      Alert.alert(`@${story.username}`, "No active slides today");
    }
  };

  const handleNextSlide = () => {
    if (!selectedStory) return;
    if (currentSlideIndex < selectedStory.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      setSelectedStory(null);
    }
  };

  const handlePrevSlide = () => {
    if (!selectedStory) return;
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const previewText = (message: string) =>
    brandPartnershipPreviewText(message) ||
    productCollabPreviewText(message) ||
    collabInvitePreviewText(message) ||
    message ||
    "Secure direct message sync handshake established.";

  return (
    <>
      <View style={{ height: 110, marginBottom: 8, marginTop: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, alignItems: "center", gap: 24 }}
          style={{ flex: 1 }}
        >
          {/* 1. Your Note */}
          <TouchableOpacity
            style={{ alignItems: "center", width: 68, position: "relative" }}
            onPress={() => {
              triggerHaptic("medium");
              setShowNoteModal(true);
            }}
            activeOpacity={0.75}
          >
            <View style={localInboxStyles.bubbleContainer}>
              <Text style={localInboxStyles.bubbleText} numberOfLines={1}>
                {inboxLocationInfo.note || "Today's vibe..."}
              </Text>
              <View style={localInboxStyles.bubbleArrow} />
            </View>
            
            <Avatar
              uri={activeProfile?.logo || currentUser?.avatar}
              name={activeProfile?.name || currentUser?.name || currentUser?.username}
              size={54}
              style={{ borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)" }}
            />
            
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600", marginTop: 4 }} numberOfLines={1}>
              Your note
            </Text>
            
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 1 }}>
              <Lucide
                name={inboxLocationInfo.isGhostMode ? "airplane" : "checkmark-circle"}
                size={8}
                color={inboxLocationInfo.isGhostMode ? "#ef4444" : "#10b981"}
              />
              <Text style={{ color: inboxLocationInfo.isGhostMode ? "#ef4444" : "#10b981", fontSize: 8, fontWeight: "700" }}>
                {inboxLocationInfo.isGhostMode ? "Location off" : "Location active"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 2. Map Globe */}
          <TouchableOpacity
            style={{ alignItems: "center", width: 60 }}
            onPress={() => {
              triggerHaptic("medium");
              router.push("/map");
            }}
            activeOpacity={0.75}
          >
            <View style={{ width: 54, height: 54, borderRadius: 27, overflow: "hidden", borderWidth: 1.5, borderColor: "#00f5ff" }}>
              <RNImage
                source={require("../../../assets/images/aura_earth_globe.jpg")}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600", marginTop: 4 }}>
              Map
            </Text>
          </TouchableOpacity>

          {/* 3. Other stories */}
          {activeInstaStories.map((story) => (
            <TouchableOpacity
              key={story.id}
              style={{ alignItems: "center", gap: 5 }}
              onPress={() => {
                triggerHaptic("medium");
                handleStoryTap(story);
              }}
              activeOpacity={0.75}
            >
              {(story.slides && story.slides.length > 0) ? (
                <LinearGradient
                  colors={["#fb923c", "#d946ef", "#8b5cf6"]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" }}
                >
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: "#080415", justifyContent: "center", alignItems: "center" }}>
                    <Image
                      source={{ uri: story.isYourStory ? activeProfile?.logo || currentUser?.avatar || story.avatar : story.avatar }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    borderWidth: story.isYourStory ? 1.5 : 1,
                    borderColor: story.isYourStory ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
                    padding: 2,
                    backgroundColor: "#080415",
                    position: "relative",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={{ uri: story.isYourStory ? activeProfile?.logo || currentUser?.avatar || story.avatar : story.avatar }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />
                  {story.isYourStory && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: -1,
                        right: -1,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: "#00f5ff",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: "#080415",
                      }}
                    >
                      <Lucide name="add" size={12} color="#000" />
                    </View>
                  )}
                </View>
              )}
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, maxWidth: 64 }} numberOfLines={1}>
                {story.isYourStory ? "Your story" : story.username || story.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal - Update Status Note Inline in Inbox */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Today's Vibe</Text>
            <Text style={styles.modalSubtitle}>Floating note bubble on your profile avatar</Text>
            
            <TextInput
              style={styles.noteInput}
              placeholder="What's your vibe today?..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              maxLength={60}
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />
            
            <Text style={styles.charCount}>{noteText.length}/60</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={submitNote}
                disabled={updatingNote}
              >
                {updatingNote ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveBtnText}>Share vibe</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal - Inbox Story Viewer */}
      <Modal
        visible={selectedStory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStory(null)}
      >
        <View style={localInboxStyles.storyContainer}>
          {/* Top progress bar strip */}
          <View style={localInboxStyles.progressStrip}>
            {selectedStory?.slides.map((_: any, idx: number) => (
              <View
                key={idx}
                style={[
                  localInboxStyles.progressBar,
                  { backgroundColor: idx <= currentSlideIndex ? "#00f5ff" : "rgba(255,255,255,0.2)" }
                ]}
              />
            ))}
          </View>

          {/* Header (Avatar & Username & Close) */}
          <View style={localInboxStyles.storyHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Avatar
                uri={selectedStory?.avatar}
                name={selectedStory?.username}
                size={36}
              />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {selectedStory?.username}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedStory(null)}>
              <Lucide name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Slide Content */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {selectedStory?.slides[currentSlideIndex] && (
              <>
                {/* Tap targets for navigation */}
                <TouchableOpacity
                  style={[localInboxStyles.tapTarget, { left: 0 }]}
                  activeOpacity={1}
                  onPress={handlePrevSlide}
                />
                <TouchableOpacity
                  style={[localInboxStyles.tapTarget, { right: 0 }]}
                  activeOpacity={1}
                  onPress={handleNextSlide}
                />

                {/* Show media (image or video) */}
                {selectedStory.slides[currentSlideIndex].url.includes(".mp4") || selectedStory.slides[currentSlideIndex].url.includes("video") ? (
                  <View style={{ width: width, height: height * 0.7, backgroundColor: "#000", borderRadius: 16, overflow: "hidden" }}>
                    <WebView
                      style={{ flex: 1, backgroundColor: "#000" }}
                      originWhitelist={["*"]}
                      source={{
                        html: `
                          <!DOCTYPE html>
                          <html>
                          <body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
                            <video src="${selectedStory.slides[currentSlideIndex].url}" autoplay loop playsinline style="max-width:100%;max-height:100%;object-fit:contain;"></video>
                          </body>
                          </html>
                        `
                      }}
                    />
                  </View>
                ) : (
                  <Image
                    source={{ uri: selectedStory.slides[currentSlideIndex].url }}
                    style={{ width: width, height: height * 0.7 }}
                    contentFit="contain"
                  />
                )}

                {/* Caption overlay */}
                {selectedStory.slides[currentSlideIndex].caption && (
                  <View style={localInboxStyles.captionContainer}>
                    <Text style={localInboxStyles.captionText}>
                      {selectedStory.slides[currentSlideIndex].caption}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={{ height: 44, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }} style={{ flex: 1 }}>
          {DM_FILTERS.map((filt) => {
            const isAct = activeDmFilter === filt;
            return (
              <TouchableOpacity key={filt} style={[styles.dmFilterTab, isAct && styles.dmFilterTabActive]} onPress={() => { triggerHaptic("light"); onFilterChange(filt); }}>
                <Text style={[styles.dmFilterText, isAct && styles.dmFilterTextActive]}>{filt}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loadingChats && conversations.length === 0 ? (
        <ActivityIndicator size="small" color="#00f5ff" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView style={styles.dmThreadsScroll} showsVerticalScrollIndicator={false}>
          {conversations
            .filter((t) => t.name.toLowerCase().includes(dmSearch.toLowerCase()))
            .filter((t) => (t.category || "Primary") === activeDmFilter)
            .map((thread) => (
              <View style={styles.threadItemRow} key={thread.id}>
                <ChatThreadAvatar
                  thread={thread}
                  activeInstaStories={activeInstaStories}
                  onOpenStoryGroup={handleStoryTap}
                  triggerHaptic={triggerHaptic}
                />
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                  onPress={() => { triggerHaptic("medium"); onOpenThread(thread); }}
                  onLongPress={() => onLongPressThread(thread)}
                >
                  <View style={styles.threadDetails}>
                    <View style={styles.threadNameRow}>
                      <Text style={styles.threadNameText}>{thread.name}</Text>
                      {thread.verified && <Lucide name="checkmark-circle" size={17} color="#0095f6" style={styles.verifiedCheck} />}
                      {pinnedThreadIds.includes(thread.id) && (
                        <Lucide name="pin" size={12} color="#00f5ff" style={{ marginLeft: 6 }} />
                      )}
                      {mutedThreadIds.includes(thread.id) && (
                        <Lucide name="volume-mute-outline" size={13} color="rgba(255,255,255,0.4)" style={{ marginLeft: 6 }} />
                      )}
                      {conversationLabels[thread.id] && (
                        <View
                          style={{
                            backgroundColor: `${CHAT_CONVERSATION_LABELS.find((l) => l.id === conversationLabels[thread.id])?.color || "#fff"}33`,
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 4,
                            marginLeft: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: CHAT_CONVERSATION_LABELS.find((l) => l.id === conversationLabels[thread.id])?.color,
                              fontSize: 10,
                              fontWeight: "bold",
                            }}
                          >
                            {CHAT_CONVERSATION_LABELS.find((l) => l.id === conversationLabels[thread.id])?.name}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                      {previewText(thread.lastMessage || "")}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraIconBtn} onPress={() => { triggerHaptic("medium"); onOpenThread(thread); }}>
                  <Lucide name="camera-outline" size={26} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dmFilterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dmFilterTabActive: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderColor: "rgba(0,245,255,0.35)",
  },
  dmFilterText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13.5,
    fontWeight: "600",
  },
  dmFilterTextActive: {
    color: "#00f5ff",
  },
  dmThreadsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  threadItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  threadDetails: {
    flex: 1,
  },
  threadNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  threadNameText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  verifiedCheck: {
    marginLeft: 4,
  },
  threadMessageText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13.5,
    marginTop: 2,
  },
  threadMessageTextUnread: {
    color: "#ffffff",
    fontWeight: "600",
  },
  cameraIconBtn: {
    padding: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0d0b20",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  noteInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    padding: 16,
    fontSize: 15,
    height: 80,
  },
  charCount: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cancelBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#00f5ff",
  },
  saveBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
});

const localInboxStyles = StyleSheet.create({
  bubbleContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 75,
    borderWidth: 1,
    borderColor: "#080415",
    position: "absolute",
    top: -14,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    alignItems: "center",
  },
  bubbleText: {
    color: "#0c0a1c",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(255, 255, 255, 0.95)",
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
  },
  storyContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    paddingTop: 50,
  },
  progressStrip: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  storyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tapTarget: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "40%",
    zIndex: 90,
  },
  captionContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  captionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  }
});
