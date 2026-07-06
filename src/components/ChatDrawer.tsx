import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { getProfileDisplayName } from "@/lib/sessionIdentity";
import { API_HOST } from "@/constants/api";
import { getLocalConversations, cacheConversations, addPendingAction } from "@/utils/localDb";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { filterConversations, isConversationBlocked } from "@/lib/feedSocialFilter";
import { canReceiveDm, shouldShowReadReceipts } from "@/lib/settingsEnforcement";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { createRtcEngine, ChannelProfileType, ClientRoleType, RtcSurfaceView } from "./agora";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

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

const BUSINESS_TOOLS = [
  { id: "broadcast", label: "Broadcast", icon: "megaphone-outline", color: "#00f5ff", desc: "Message all followers" },
  { id: "promotions", label: "Promotions", icon: "pricetag-outline", color: "#fb923c", desc: "Discounts & offers" },
  { id: "ads", label: "Ads Manager", icon: "bar-chart-outline", color: "#a78bfa", desc: "Campaigns & spend" },
  { id: "catalogue", label: "Catalogue", icon: "grid-outline", color: "#34d399", desc: "Your listings" },
  { id: "autoreply", label: "Auto-Reply", icon: "flash-outline", color: "#f472b6", desc: "Automated messages" },
  { id: "inbox", label: "Customer Inbox", icon: "people-outline", color: "#fbbf24", desc: "Order enquiries" },
];

export interface ChatDrawerProps {
  visible: boolean;
  onClose: () => void;
  bottomBarHeight: number;
  activeMaisonId: string;
  isSeller: boolean;
  setIsSeller: (val: boolean) => void;
  products?: any[];
  activeInstaStories?: any[];
  onOpenStoryGroup?: (story: any) => void;
  initialConversationId?: string | null;
  onConversationStateChange?: (active: boolean) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  visible,
  onClose,
  bottomBarHeight,
  activeMaisonId,
  isSeller,
  setIsSeller,
  products = [],
  activeInstaStories = [],
  onOpenStoryGroup,
  initialConversationId = null,
  onConversationStateChange,
}) => {
  const { triggerHaptic, currentUser, activeProfile } = useStore();
  const router = useRouter();
  const { graph: socialGraph, version: socialGraphVersion } = useSocialGraph();
  const currentUserId = currentUser?.id || "";
  const inboxTitle = isSeller
    ? getProfileDisplayName(activeProfile, currentUser)
    : getProfileDisplayName(activeProfile, currentUser);

  // Chat states
  const [activeChat, setActiveChat] = useState<any>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatReplyText, setChatReplyText] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [isTypingSent, setIsTypingSent] = useState(false);
  const typingTimeoutRef = React.useRef<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [dmSearch, setDmSearch] = useState("");
  const [activeDmFilter, setActiveDmFilter] = useState("Primary");
  const [activeBusinessTool, setActiveBusinessTool] = useState<string | null>(null);

  // Call States
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callState, setCallState] = useState<"none" | "outgoing" | "incoming" | "active">("none");
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const [callAgoraToken, setCallAgoraToken] = useState("");
  const [callAgoraAppId, setCallAgoraAppId] = useState("");
  const callEngineRef = useRef<any>(null);
  const [callJoined, setCallJoined] = useState(false);
  const [callRemoteUid, setCallRemoteUid] = useState<number | null>(null);

  // Attach Menu States
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [sharingProductsList, setSharingProductsList] = useState(false);

  // Emoji States
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const EMOJIS = ["❤️", "😂", "🙌", "🔥", "👏", "😢", "😍", "😮", "👍", "🤔"];

  // Long press & reply States
  const [longPressedMessage, setLongPressedMessage] = useState<any>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

  // Scroll Ref
  const scrollViewRef = useRef<ScrollView>(null);

  const findActiveStory = (chatName: string, chatUsername?: string) => {
    if (!activeInstaStories) return null;
    
    // Normalize targets
    const nameKey = chatName.toLowerCase().replace(/\s+/g, "");
    const usernameKey = (chatUsername || "").toLowerCase().replace(/\s+/g, "");

    return activeInstaStories.find((story: any) => {
      if (story.isYourStory) return false;
      const storyName = (story.name || "").toLowerCase().replace(/\s+/g, "");
      const storyUsername = (story.username || "").toLowerCase().replace(/\s+/g, "");
      return (
        (storyUsername && (storyUsername === usernameKey || storyUsername === nameKey)) ||
        (storyName && (storyName === nameKey || storyName === usernameKey))
      );
    });
  };

  const handleViewProfile = () => {
    if (!activeChat) return;
    setActiveChat(null); // Close active chat modal so profile screen displays clearly
    onClose(); // Close the chat drawer
    triggerHaptic("light");
    
    // Resolve clean username
    const username = activeChat.username || activeChat.name.toLowerCase().replace(/\s+/g, "_");
    router.push(`/profile/${username}` as any);
  };

  const handleViewTargetProfile = (chatName: string, chatUsername?: string) => {
    setActiveChat(null); // Close modal
    onClose(); // Close drawer
    triggerHaptic("light");
    
    const username = chatUsername || chatName.toLowerCase().replace(/\s+/g, "_");
    router.push(`/profile/${username}` as any);
  };

  const renderAvatarWithStory = (uri: string, chatName: string, chatUsername?: string, size: number = 44) => {
    const storyGroup = findActiveStory(chatName, chatUsername);
    const hasStory = storyGroup !== null;

    if (hasStory) {
      return (
        <TouchableOpacity 
          onPress={() => {
            triggerHaptic("medium");
            setActiveChat(null); // Close active chat modal so story displays on screen
            if (onOpenStoryGroup) {
              onOpenStoryGroup(storyGroup);
            }
          }}
        >
          <LinearGradient
            colors={["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{
              width: size + 2,
              height: size + 2,
              borderRadius: (size + 2) / 2,
              backgroundColor: "#080415", // Matches theme dark background
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Image 
                source={{ uri }} 
                style={{ width: size, height: size, borderRadius: size / 2 }} 
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity onPress={() => handleViewTargetProfile(chatName, chatUsername)}>
        <Image 
          source={{ uri }} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
        />
      </TouchableOpacity>
    );
  };

  const renderThreadAvatar = (thread: any) => {
    const storyGroup = findActiveStory(thread.name, thread.username);
    const hasStory = storyGroup !== null;

    if (hasStory) {
      return (
        <TouchableOpacity 
          onPress={() => {
            triggerHaptic("medium");
            if (onOpenStoryGroup) {
              onOpenStoryGroup(storyGroup);
            }
          }}
          style={{ marginRight: 12 }}
        >
          <LinearGradient
            colors={["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#080415",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Image 
                source={{ uri: thread.avatar }} 
                style={{ width: 48, height: 48, borderRadius: 24 }} 
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
        style={{ marginRight: 12 }}
      >
        <Image 
          source={{ uri: thread.avatar }} 
          style={styles.threadAvatar} 
        />
      </TouchableOpacity>
    );
  };

  const startCall = async (type: "AUDIO" | "VIDEO") => {
    if (!activeChat) return;
    triggerHaptic("heavy");
    const peerUserId = activeChat.type === "PRIVATE"
      ? (activeChat.userOneId === currentUserId ? activeChat.userTwoId : activeChat.userOneId)
      : (activeChat.userId);
    if (!peerUserId) return;

    setCallState("outgoing");
    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          callerId: currentUserId,
          receiverId: peerUserId,
          type
        })
      });
      const data = await res.json();
      if (data.success && data.call) {
        setActiveCall(data.call);
        setCallAgoraToken(data.tokens.callerToken);
        setCallAgoraAppId(data.tokens.appId);
        await initCallRtcEngine(data.tokens.appId, data.tokens.callerToken, data.tokens.channelName, type);
      } else {
        setCallState("none");
        Alert.alert("Call Failed", data.error || "Unable to start call.");
      }
    } catch (err) {
      console.warn("Error starting call:", err);
      setCallState("none");
    }
  };

  const acceptCall = async () => {
    if (!activeCall) return;
    triggerHaptic("success");
    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          callId: activeCall.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setCallState("active");
        await initCallRtcEngine(callAgoraAppId, callAgoraToken, activeCall.channelName, activeCall.type);
      }
    } catch (err) {
      console.warn("Error accepting call:", err);
    }
  };

  const declineCall = async () => {
    if (!activeCall) return;
    triggerHaptic("medium");
    setCallState("none");
    try {
      await fetch(`${API_HOST}/api/mobile/chat/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          callId: activeCall.id
        })
      });
    } catch {}
    destroyCallRtcEngine();
    setActiveCall(null);
  };

  const endCall = async () => {
    if (!activeCall) return;
    triggerHaptic("medium");
    setCallState("none");
    try {
      await fetch(`${API_HOST}/api/mobile/chat/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          callId: activeCall.id
        })
      });
    } catch {}
    destroyCallRtcEngine();
    setActiveCall(null);
  };

  const initCallRtcEngine = async (appId: string, token: string, channelName: string, callType: string) => {
    if (!createRtcEngine) {
      setCallJoined(true);
      return;
    }
    try {
      const engine = createRtcEngine();
      callEngineRef.current = engine;
      await engine.initialize({
        appId: appId || "demo-app-id-placeholder",
        channelProfile: ChannelProfileType.CHANNEL_PROFILE_LIVE_BROADCASTING,
      });
      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          setCallJoined(true);
        },
        onUserJoined: (connection: any, uid: number) => {
          setCallRemoteUid(uid);
          setCallState("active");
        },
        onUserOffline: () => {
          endCall();
        },
        onError: (err: number, msg: string) => {
          console.error("[Agora Call Error]:", err, msg);
        }
      });
      await engine.enableVideo();
      if (callType === "AUDIO") {
        await engine.muteLocalVideoStream(true);
      } else {
        await engine.startPreview();
      }
      await engine.setClientRole(ClientRoleType.CLIENT_ROLE_BROADCASTER);
      await engine.joinChannel(token, channelName, 0, {});
    } catch (e) {
      console.warn("Agora call engine init failed, falling back to simulator:", e);
      setCallJoined(true);
    }
  };

  const destroyCallRtcEngine = async () => {
    if (callEngineRef.current) {
      try {
        await callEngineRef.current.leaveChannel();
        await callEngineRef.current.release();
      } catch {}
      callEngineRef.current = null;
    }
    setCallJoined(false);
    setCallRemoteUid(null);
  };

  const uploadImageFile = async (localUri: string): Promise<string> => {
    try {
      const filename = localUri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append("file", {
        uri: localUri,
        name: filename,
        type,
      } as any);

      const res = await fetch(`${API_HOST}/api/mobile/chat/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await res.json();
      if (data.success && data.url) {
        return `${API_HOST}${data.url}`;
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (e) {
      console.warn("Image upload failed, falling back to local URI:", e);
      return localUri;
    }
  };

  const handleShareImage = async () => {
    setShowAttachMenu(false);
    triggerHaptic("light");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "We need photo permissions to share images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        const remoteUrl = await uploadImageFile(selectedUri);
        await sendAttachmentMessage("IMAGE", remoteUrl);
      }
    } catch (e) {
      console.warn("Failed to pick image:", e);
    }
  };

  const handleCaptureCameraImage = async () => {
    triggerHaptic("medium");
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "We need camera permissions to capture photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        const remoteUrl = await uploadImageFile(selectedUri);
        await sendAttachmentMessage("IMAGE", remoteUrl);
      }
    } catch (e) {
      console.warn("Failed to launch camera:", e);
    }
  };

  const handleShareLocation = async () => {
    setShowAttachMenu(false);
    triggerHaptic("light");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "We need location permissions to share your coordinates.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      await sendAttachmentMessage("LOCATION", mapsUrl);
    } catch (e) {
      console.warn("Failed to get location:", e);
      Alert.alert("Location Error", "Unable to retrieve current coordinates.");
    }
  };

  const handleShareProduct = async (product: any) => {
    setSharingProductsList(false);
    setShowAttachMenu(false);
    triggerHaptic("medium");
    const productPayload = JSON.stringify({
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.images?.[0] || product.image
    });
    await sendAttachmentMessage("PRODUCT", productPayload);
  };



  const handleReactToMessage = (msgId: string, emoji: string) => {
    triggerHaptic("medium");
    setLongPressedMessage(null);
    if (emoji === "MORE") {
      Alert.alert("Reactions", "Custom emoji reactions sheet.");
      return;
    }
    setMessageReactions((prev: Record<string, string[]>) => {
      const current = prev[msgId] || [];
      if (current.includes(emoji)) {
        return { ...prev, [msgId]: current.filter((e) => e !== emoji) };
      }
      return { ...prev, [msgId]: [...current, emoji] };
    });
  };

  const handleUnsendMessage = async (msgId: string) => {
    triggerHaptic("heavy");
    setLongPressedMessage(null);
    
    // Update local state instantly (optimistic update)
    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.filter((m: any) => m.id !== msgId)
      };
    });

    try {
      await fetch(`${API_HOST}/api/mobile/chat/unsend`, {
        method: "POST",
        body: JSON.stringify({ messageId: msgId, type: activeChat.type }),
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      console.warn("Unsend backend sync failed:", e);
    }
  };

  const handleMessageAction = (action: "REPLY" | "SAVE" | "STICKER" | "DELETE" | "UNSEND" | "MORE") => {
    if (!longPressedMessage) return;
    const msgId = longPressedMessage.id;

    if (action === "REPLY") {
      setReplyingToMessage(longPressedMessage);
      setLongPressedMessage(null);
      triggerHaptic("light");
    } else if (action === "SAVE") {
      setLongPressedMessage(null);
      triggerHaptic("light");
      Alert.alert("Saved", "Response saved to quick replies!");
    } else if (action === "STICKER") {
      setLongPressedMessage(null);
      triggerHaptic("light");
      Alert.alert("Stickers", "Launch sticker options.");
    } else if (action === "DELETE" || action === "UNSEND") {
      handleUnsendMessage(msgId);
    } else if (action === "MORE") {
      setLongPressedMessage(null);
      triggerHaptic("light");
      Alert.alert("More Options", "Forward, copy, or report message.");
    }
  };

  const sendAttachmentMessage = async (attachType: "IMAGE" | "LOCATION" | "PRODUCT", content: string) => {
    if (!activeChat) return;
    const currentSenderName = isSeller 
      ? (activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()))) 
      : (currentUser?.name || "Alok Singh");
    const formattedContent = `[ATTACHMENT:${attachType}]${content}`;
    const tempMessage = {
      id: `m_${Date.now()}`,
      content: formattedContent,
      senderId: isSeller ? activeMaisonId : currentUserId,
      senderName: currentSenderName,
      createdAt: new Date().toISOString(),
      isAdmin: isSeller,
      status: "sending" as const
    };
    setActiveChat((prev: any) => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage],
      lastMessage: attachType === "IMAGE" ? "📷 Sent an image" : (attachType === "LOCATION" ? "📍 Sent a location" : "🛍️ Sent a product card")
    }));
    setConversations(prev => prev.map(c => c.id === activeChat.id ? {
      ...c,
      messages: [...(c.messages || []), tempMessage],
      lastMessage: attachType === "IMAGE" ? "📷 Sent an image" : (attachType === "LOCATION" ? "📍 Sent a location" : "🛍️ Sent a product card")
    } : c));
    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeChat.id,
          senderId: isSeller ? activeMaisonId : currentUserId,
          senderName: currentSenderName,
          content: formattedContent,
          type: activeChat.type || "MAISON",
          isAdmin: isSeller
        })
      });
      const data = await res.json();
      if (data.success) {
        const realMsg = { ...data.message, status: "sent" };
        setActiveChat((prev: any) => ({
          ...prev,
          messages: prev.messages.map((m: any) => m.id === tempMessage.id ? realMsg : m)
        }));
      }
    } catch (err) {
      console.warn("Failed to dispatch attachment message:", err);
    }
  };

  const renderMessageContent = (content: string, isMine: boolean) => {
    if (content.startsWith("[ATTACHMENT:IMAGE]")) {
      const uri = content.replace("[ATTACHMENT:IMAGE]", "");
      return (
        <View style={styles.msgImageContainer}>
          <Image source={{ uri }} style={styles.msgImage} />
        </View>
      );
    }
    if (content.startsWith("[ATTACHMENT:LOCATION]")) {
      const url = content.replace("[ATTACHMENT:LOCATION]", "");
      return (
        <TouchableOpacity 
          style={styles.msgLocationContainer}
          onPress={async () => {
            triggerHaptic("light");
            const WebBrowser = require("expo-web-browser");
            await WebBrowser.openBrowserAsync(url);
          }}
        >
          <Lucide name="map-outline" size={20} color="#00f5ff" />
          <Text style={styles.msgLocationText}>View Shared Location Pin</Text>
        </TouchableOpacity>
      );
    }
    if (content.startsWith("[ATTACHMENT:PRODUCT]")) {
      try {
        const product = JSON.parse(content.replace("[ATTACHMENT:PRODUCT]", ""));
        return (
          <View style={styles.msgProductCard}>
            <Image source={{ uri: product.image }} style={styles.msgProductImage} />
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={styles.msgProductName} numberOfLines={1}>{product.name}</Text>
              <Text style={styles.msgProductPrice}>₹{parseFloat(product.price).toLocaleString()}</Text>
              <TouchableOpacity 
                style={styles.msgProductBuyBtn}
                onPress={() => {
                  triggerHaptic("success");
                  Alert.alert("Direct Order", `Instant checkout initiated for ${product.name}!`);
                }}
              >
                <Text style={styles.msgProductBuyText}>Order Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      } catch {
        return <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>[Broken Product Card]</Text>;
      }
    }
    return <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>{content}</Text>;
  };

  // Poll for incoming calls
  useEffect(() => {
    if (!visible || callState !== "none" || !currentUserId) return;
    const pollIncomingCall = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "poll",
            receiverId: currentUserId
          })
        });
        const data = await res.json();
        if (data.success && data.call) {
          triggerHaptic("heavy");
          setActiveCall(data.call);
          setCallerInfo(data.caller);
          setCallAgoraToken(data.token);
          setCallAgoraAppId(data.appId);
          setCallState("incoming");
        }
      } catch {}
    };
    pollIncomingCall();
    const interval = setInterval(pollIncomingCall, 3500);
    return () => clearInterval(interval);
  }, [visible, callState, currentUserId]);

  // If in active call, poll call status to check if peer hung up
  useEffect(() => {
    if (callState === "none" || !activeCall) return;
    const checkCallActiveStatus = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "checkStatus",
            callId: activeCall.id
          })
        });
        const data = await res.json();
        if (data.success && (data.status === "ENDED" || data.status === "REJECTED")) {
          destroyCallRtcEngine();
          setCallState("none");
          setActiveCall(null);
          Alert.alert("Call Ended", "The calling connection was terminated by peer.");
        }
      } catch {}
    };
    const interval = setInterval(checkCallActiveStatus, 3000);
    return () => clearInterval(interval);
  }, [callState, activeCall]);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchNewChat, setSearchNewChat] = useState("");
  const [suggestedProfiles, setSuggestedProfiles] = useState<any[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  const fetchSuggestedProfiles = async () => {
    setLoadingSuggested(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/profile/suggested?viewerProfileId=${activeProfile?.id || "prof_active"}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles)) {
        setSuggestedProfiles(data.profiles);
      }
    } catch (e) {
      console.warn("Failed to fetch suggested profiles:", e);
    } finally {
      setLoadingSuggested(false);
    }
  };

  const handleSearchProfiles = async (query: string) => {
    setSearchNewChat(query);
    if (query.trim().length < 2) {
      fetchSuggestedProfiles();
      return;
    }
    setLoadingSuggested(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/profile/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles)) {
        setSuggestedProfiles(data.profiles);
      }
    } catch (e) {
      console.warn("Failed to search profiles:", e);
    } finally {
      setLoadingSuggested(false);
    }
  };

  const handleInitiateNewChat = async (profile: any) => {
    triggerHaptic("medium");
    try {
      const isMaison = !!profile.maisonId || profile.logo !== null;
      const type = isMaison ? "MAISON" : "PRIVATE";
      const payload: any = {
        userId: currentUserId,
        userName: currentUser?.name || "Alok Singh",
        type,
        initialMessage: "Hey there! 👋",
      };
      if (isMaison) {
        payload.maisonId = profile.maisonId || profile.id;
        payload.maisonName = profile.name;
      } else {
        payload.peerProfileId = profile.id;
      }

      const res = await fetch(`${API_HOST}/api/mobile/chat/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setShowNewChatModal(false);
        setSearchNewChat("");
        await fetchChats();
        setActiveChat(data.conversation);
      } else {
        Alert.alert("Error", data.error || "Failed to start chat.");
      }
    } catch (err) {
      console.warn("Error initiating chat:", err);
      Alert.alert("Error", "Handshake failed. Connection timeout.");
    }
  };

  useEffect(() => {
    if (showNewChatModal) {
      fetchSuggestedProfiles();
    }
  }, [showNewChatModal]);

  // Business states
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [livePromos, setLivePromos] = useState<any[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [showNewPromoForm, setShowNewPromoForm] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("");
  const [liveAds, setLiveAds] = useState<any[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);

  // Auto-Reply states
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState("Thanks for reaching out! We'll respond shortly.");
  const [awayMessage, setAwayMessage] = useState("We're currently away. We'll get back to you within 24 hours.");
  const [quietHoursStart, setQuietHoursStart] = useState("");
  const [quietHoursEnd, setQuietHoursEnd] = useState("");
  const [loadingAutoReply, setLoadingAutoReply] = useState(false);
  const [autoReplySaved, setAutoReplySaved] = useState(false);

  // Business stats
  const [liveBusinessStats, setLiveBusinessStats] = useState<any[]>([
    { label: "Orders Today", value: "12", icon: "bag-outline", color: "#00f5ff" },
    { label: "Revenue", value: "₹48.2K", icon: "cash-outline", color: "#a78bfa" },
    { label: "Enquiries", value: "7", icon: "chatbubble-outline", color: "#fb923c" },
    { label: "Store Views", value: "1.4K", icon: "eye-outline", color: "#34d399" },
  ]);

  useEffect(() => {
    if (visible && initialConversationId && conversations.length > 0) {
      const found = conversations.find(c => c.id === initialConversationId);
      if (found) {
        setActiveChat(found);
      }
    }
  }, [initialConversationId, conversations, visible]);

  const applySocialFilters = (list: any[]) => {
    let out = list;
    if (socialGraph) out = filterConversations(out, socialGraph);
    out = out.filter((c) =>
      canReceiveDm({
        profileId: c.profileId || c.peerProfileId || c.peerId,
        isFollowing: c.isFollowing === true,
        isFollower: c.isFollower === true,
      })
    );
    return out;
  };

  const fetchChats = async () => {
    // 💾 Hydrate instantly from local SQLite DB
    try {
      const localConvs = getLocalConversations();
      if (localConvs && localConvs.length > 0) {
        setConversations(applySocialFilters(localConvs));
      }
    } catch (err) {
      console.warn("Failed to load local SQLite conversations:", err);
    }

    setLoadingChats(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat?userId=${currentUserId}&maisonId=${activeMaisonId}&mode=${isSeller ? "seller" : "buyer"}`);
      const data = await res.json();
      if (data.success && data.conversations.length > 0) {
        const mapped = data.conversations.map((c: any) => {
          return { ...c, category: "Primary" };
        });
        setConversations(applySocialFilters(mapped));
        // 💾 Cache updated conversations and messages in SQLite
        try {
          cacheConversations(mapped);
        } catch (err) {
          console.warn("Failed to cache conversations in SQLite:", err);
        }
      } else {
        // Auto-seed a starter conversation if none exist yet
        try {
          await fetch(`${API_HOST}/api/mobile/seed-chat`, { method: "POST" });
          const retryRes = await fetch(`${API_HOST}/api/mobile/chat?userId=${currentUserId}&maisonId=${activeMaisonId}&mode=${isSeller ? "seller" : "buyer"}`);
          const retryData = await retryRes.json();
          if (retryData.success && retryData.conversations.length > 0) {
            const mappedRetry = retryData.conversations.map((c: any) => ({ ...c, category: "Primary" }));
            setConversations(applySocialFilters(mappedRetry));
            cacheConversations(mappedRetry);
          }
        } catch {
          // Keep local state if we have it, otherwise fallback
        }
      }
    } catch (e) {
      console.warn("fetchChats API call failed:", e);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchBusinessStats = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/mobile/business-stats?maisonId=${activeMaisonId}`);
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
      // keep fallback
    }
  };

  const fetchPromotions = async () => {
    setLoadingPromos(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/promotions?maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success && data.promos?.length > 0) {
        setLivePromos(data.promos);
      }
    } catch {
      // keep fallback
    } finally {
      setLoadingPromos(false);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/mobile/broadcast?maisonId=${activeMaisonId}`);
      const data = await res.json();
      if (data.success) setLiveBroadcasts(data.broadcasts || []);
    } catch { /* fallback */ }
  };

  const fetchAds = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/mobile/ads?maisonId=${activeMaisonId}`);
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
      const res = await fetch(`${API_HOST}/api/mobile/broadcast`, {
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
      const res = await fetch(`${API_HOST}/api/mobile/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maisonId: activeMaisonId, code, discount, type }),
      });
      const data = await res.json();
      if (data.success) { fetchPromotions(); return true; }
      return false;
    } catch { return false; }
  };

  const fetchAutoReply = async () => {
    setLoadingAutoReply(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/auto-reply?maisonId=${activeMaisonId}`);
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
      const res = await fetch(`${API_HOST}/api/mobile/auto-reply`, {
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

  useEffect(() => {
    if (!socialGraph) return;
    setConversations((prev) => applySocialFilters(prev));
    setActiveChat((prev: any) =>
      prev && isConversationBlocked(prev, socialGraph) ? null : prev
    );
  }, [socialGraphVersion, socialGraph]);

  // Trigger callback when activeChat changes to control bottom app menu visibility in parent view
  useEffect(() => {
    onConversationStateChange?.(activeChat !== null);
  }, [activeChat, onConversationStateChange]);

  useEffect(() => {
    let xhr: XMLHttpRequest | null = null;

    if (visible) {
      fetchChats();
      if (isSeller) {
        fetchBusinessStats();
        fetchPromotions();
        fetchAds();
        fetchBroadcasts();
        fetchAutoReply();
      }

      // Start SSE real-time stream connection
      try {
        const url = `${API_HOST}/api/realtime/stream`;
        const stream = new XMLHttpRequest();
        xhr = stream;
        stream.open("GET", url);
        
        let offset = 0;
        stream.onreadystatechange = () => {
          if (stream.readyState === 3 || stream.readyState === 4) {
            const chunk = stream.responseText.substring(offset);
            offset = stream.responseText.length;
            
            // Parse Server-Sent Events format block (separated by double newline)
            const blocks = chunk.split("\n\n");
            for (const block of blocks) {
              if (!block.trim()) continue;
              
              const eventMatch = block.match(/^event:\s*(.+)$/m);
              const dataMatch = block.match(/^data:\s*(.+)$/m);
              
              if (eventMatch && dataMatch) {
                const eventName = eventMatch[1].trim();
                const dataStr = dataMatch[1].trim();
                
                if (eventName === "NEW_MESSAGE") {
                  try {
                    const eventData = JSON.parse(dataStr);
                    const msg = {
                      id: eventData.id,
                      conversationId: eventData.conversationId,
                      senderId: eventData.senderId,
                      senderName: eventData.senderName || "Rare Raven",
                      content: eventData.content,
                      createdAt: eventData.createdAt,
                      isAdmin: eventData.isAdmin || false
                    };
                    
                    const mySenderId = isSeller ? activeMaisonId : currentUserId;
                    if (msg.senderId !== mySenderId) {
                      // Trigger haptic and play incoming message sound/dot
                      triggerHaptic("light");
                      
                      // 1. Update active chat if open
                      setActiveChat((prev: any) => {
                        if (!prev || prev.id !== msg.conversationId) return prev;
                        const exists = prev.messages?.some((m: any) => m.id === msg.id);
                        if (exists) return prev;
                        return {
                          ...prev,
                          messages: [...(prev.messages || []), msg],
                          lastMessage: msg.content
                        };
                      });
                      
                      // 2. Update conversation list & unread state
                      setConversations((prevList) => {
                        const updatedList = prevList.map((convo) => {
                          if (convo.id === msg.conversationId) {
                            const exists = convo.messages?.some((m: any) => m.id === msg.id);
                            const newMsgs = exists ? convo.messages : [...(convo.messages || []), msg];
                            return {
                              ...convo,
                              messages: newMsgs,
                              lastMessage: msg.content,
                              unread: activeChat?.id !== msg.conversationId, // Mark unread if not actively open
                              updatedAt: msg.createdAt || new Date().toISOString()
                            };
                          }
                          return convo;
                        });
                        return [...updatedList].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                      });
                    }
                  } catch (err) {
                    console.warn("[ChatDrawer] Error parsing SSE payload:", err);
                  }
                } else if (eventName === "TYPING") {
                  try {
                    const eventData = JSON.parse(dataStr);
                    setTypingUsers((prev) => {
                      const updated = { ...prev };
                      if (eventData.isTyping) {
                        updated[eventData.conversationId] = eventData.username;
                      } else {
                        delete updated[eventData.conversationId];
                      }
                      return updated;
                    });
                  } catch (err) {
                    console.warn("[ChatDrawer] Error parsing TYPING payload:", err);
                  }
                }
              }
            }
          }
        };
        
        stream.send();
      } catch (err) {
        console.warn("[ChatDrawer] Could not connect to real-time events gateway:", err);
      }
    }

    return () => {
      if (xhr) {
        try {
          xhr.abort();
        } catch (e) {}
      }
    };
  }, [visible, activeMaisonId, isSeller, activeChat?.id]);

  const sendTypingStatus = async (typing: boolean) => {
    if (!activeChat) return;
    const username = isSeller 
      ? (activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : activeMaisonId))
      : (currentUser?.name || "Alok Singh");
    
    if (typing === isTypingSent) return;
    setIsTypingSent(typing);

    try {
      await fetch(`${API_HOST}/api/mobile/chat/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeChat.id,
          username,
          isTyping: typing
        })
      });
    } catch (err) {
      console.warn("Failed to send typing status:", err);
    }
  };

  const handleTextChange = (text: string) => {
    setChatReplyText(text);
    sendTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const handleSendChatMessage = async () => {
    if (!chatReplyText.trim() || !activeChat) return;
    if (socialGraph && isConversationBlocked(activeChat, socialGraph)) {
      Alert.alert("Blocked", "Unblock this account to send messages.");
      return;
    }
    triggerHaptic("medium");
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);

    const textToSend = replyingToMessage 
      ? `[REPLY:${replyingToMessage.id}] ${chatReplyText}` 
      : chatReplyText;

    setReplyingToMessage(null);
    setChatReplyText("");

    const currentSenderName = isSeller 
      ? (activeMaisonId === "rare_raven" ? "Rare Raven" : (activeMaisonId === "aloksingh" ? "Alok Singh" : activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()))) 
      : (currentUser?.name || "Alok Singh");

    const tempMessage = {
      id: `m_${Date.now()}`,
      content: textToSend,
      senderId: isSeller ? activeMaisonId : currentUserId,
      senderName: currentSenderName,
      createdAt: new Date().toISOString(),
      isAdmin: isSeller,
      status: "sending" as const
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
      const res = await fetch(`${API_HOST}/api/mobile/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeChat.id,
          senderId: isSeller ? activeMaisonId : currentUserId,
          senderName: currentSenderName,
          content: textToSend,
          type: activeChat.type || "MAISON",
          isAdmin: isSeller
        })
      });
      const data = await res.json();
      if (data.success) {
        const realMsg = { ...data.message, status: "sent" };
        setActiveChat((prev: any) => ({
          ...prev,
          messages: prev.messages.map((m: any) => m.id === tempMessage.id ? realMsg : m)
        }));
        
        let updatedList: any[] = [];
        setConversations(prev => {
          updatedList = prev.map(c => c.id === activeChat.id ? {
            ...c,
            messages: c.messages.map((m: any) => m.id === tempMessage.id ? realMsg : m),
            lastMessage: textToSend
          } : c);
          return updatedList;
        });

        // 💾 Cache sent message details in SQLite
        try {
          cacheConversations(updatedList);
        } catch {}

      } else {
        throw new Error("API responded with success=false");
      }
    } catch (e) {
      console.warn("Could not sync message to server, queuing offline.", e);
      const failedMsg = { ...tempMessage, status: "error" as const };
      setActiveChat((prev: any) => ({
        ...prev,
        messages: prev.messages.map((m: any) => m.id === tempMessage.id ? failedMsg : m)
      }));
      setConversations(prev => prev.map(c => c.id === activeChat.id ? {
        ...c,
        messages: c.messages.map((m: any) => m.id === tempMessage.id ? failedMsg : m),
        lastMessage: textToSend
      } : c));

      // 💾 Queue sendMessage request to sync queue
      try {
        addPendingAction("sendMessage", {
          conversationId: activeChat.id,
          senderId: isSeller ? activeMaisonId : currentUserId,
          senderName: currentSenderName,
          content: textToSend,
          type: activeChat.type || "MAISON",
          isAdmin: isSeller
        });
      } catch (err) {
        console.warn("Offline action queue write error:", err);
      }
    }
  };

  if (!visible) return null;

  return (
    <>
      <View style={[styles.dmSlidePanel, { bottom: bottomBarHeight }]}>
        <SafeAreaView style={styles.dmSafeArea}>
          {/* DM Top Bar */}
          <View style={styles.dmHeaderRow}>
            <TouchableOpacity onPress={onClose}>
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
              <Text style={styles.dmTitleText}>{inboxTitle}</Text>
              <Lucide name="chevron-down" size={17} color="#fff" />
              <View style={styles.dmTitleRedDot} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { triggerHaptic("medium"); setShowNewChatModal(true); }}>
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
              {activeInstaStories.length > 0 && (
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
                          if (onOpenStoryGroup) onOpenStoryGroup(story);
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
                              <Image source={{ uri: story.isYourStory ? (activeProfile?.logo || currentUser?.avatar || story.avatar) : story.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
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
                            <Image source={{ uri: story.isYourStory ? (activeProfile?.logo || currentUser?.avatar || story.avatar) : story.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
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
              )}

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
                    <View style={styles.threadItemRow} key={thread.id}>
                      {renderThreadAvatar(thread)}
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                      >
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
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cameraIconBtn} onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}>
                        <Lucide name="camera-outline" size={26} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    </View>
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
                  {conversations.filter(t => t.name.toLowerCase().includes(dmSearch.toLowerCase())).map((thread) => (
                    <View style={[styles.threadItemRow, { marginHorizontal: 16 }]} key={thread.id}>
                      {renderThreadAvatar(thread)}
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                      >
                        <View style={styles.threadDetails}>
                          <View style={styles.threadNameRow}>
                            <Text style={styles.threadNameText}>{thread.name}</Text>
                            <View style={[styles.bizTagBadge, { backgroundColor: thread.unread ? "#00f5ff22" : "#ffffff11" }]}>
                              <Text style={[styles.bizTagText, { color: thread.unread ? "#00f5ff" : "rgba(255,255,255,0.4)" }]}>Enquiry</Text>
                            </View>
                          </View>
                          <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                            {thread.lastMessage || "Secure direct message sync handshake established."}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {thread.unread && <View style={styles.bizUnreadDot} />}
                    </View>
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
                  {conversations.map((thread) => (
                    <View style={styles.threadItemRow} key={thread.id}>
                      {renderThreadAvatar(thread)}
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                      >
                        <View style={styles.threadDetails}>
                          <View style={styles.threadNameRow}>
                            <Text style={styles.threadNameText}>{thread.name}</Text>
                            <View style={[styles.bizTagBadge, { backgroundColor: "#fbbf2422" }]}>
                              <Text style={{ color: "#fbbf24", fontSize: 13.5 }}>Enquiry</Text>
                            </View>
                          </View>
                          <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                            {thread.lastMessage || "Secure direct message sync handshake established."}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {thread.unread && <View style={styles.bizUnreadDot} />}
                    </View>
                  ))}
                </View>
              )}

            </ScrollView>
          )}
        </SafeAreaView>
      </View>

      <Modal
        visible={activeChat !== null}
        animationType="slide"
        onRequestClose={() => setActiveChat(null)}
      >
        <View style={[styles.dmSlidePanel, { top: 0, bottom: 0, left: 0, right: 0 }]}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <SafeAreaView style={styles.dmSafeArea}>
            {/* Chat header */}
            <View style={styles.dmHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <TouchableOpacity onPress={() => setActiveChat(null)}>
                  <Lucide name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                {renderAvatarWithStory(
                  activeChat?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100",
                  activeChat?.name || "",
                  activeChat?.username,
                  36
                )}
                <TouchableOpacity onPress={() => handleViewTargetProfile(activeChat?.name || "", activeChat?.username)}>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={styles.headerNameText}>{activeChat?.name}</Text>
                      {activeChat?.verified && (
                        <Lucide name="checkmark-circle" size={15} color="#00f5ff" />
                      )}
                    </View>
                    <Text style={styles.headerUsernameText}>
                      @{activeChat?.username || activeChat?.name?.toLowerCase()?.replace(/\s+/g, "_")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                <TouchableOpacity onPress={() => startCall("AUDIO")}>
                  <Lucide name="call-outline" size={23} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => startCall("VIDEO")}>
                  <Lucide name="videocam-outline" size={25} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => triggerHaptic("medium")}>
                  <Lucide name="information-circle-outline" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages feed list with auto-scroll integration */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.chatFeedScroll}
              contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Profile Social Context Information Block at top of chat scroll */}
              <View style={styles.socialContextContainer}>
                {renderAvatarWithStory(
                  activeChat?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100",
                  activeChat?.name || "",
                  activeChat?.username,
                  72
                )}
                <TouchableOpacity onPress={() => handleViewTargetProfile(activeChat?.name || "", activeChat?.username)}>
                  <Text style={styles.socialContextTitle}>{activeChat?.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleViewTargetProfile(activeChat?.name || "", activeChat?.username)}>
                  <Text style={styles.socialContextUsername}>@{activeChat?.username || activeChat?.name?.toLowerCase()?.replace(/\s+/g, "_")}</Text>
                </TouchableOpacity>
                
                {/* Dynamic details like Category and Followers count */}
                {activeChat?.followersCount !== undefined && (
                  <Text style={styles.socialContextSubtext}>
                    {activeChat.followersCount} followers • {activeChat.category || "Fashion Node"}
                  </Text>
                )}
                {/* If seller, the name of the store managed by them */}
                {activeChat?.managedStoreName ? (
                  <Text style={styles.socialContextSubtext}>
                    Store managed: {activeChat.managedStoreName}
                  </Text>
                ) : null}

                <Text style={styles.socialContextSubtext}>
                  {activeChat?.socialContextText || "You don't follow each other on Aura"}
                </Text>
                
                {/* Dynamically hidden View Profile Button (disappears once chat begins or text is typed) */}
                {(!activeChat?.messages || activeChat.messages.length === 0) && chatReplyText.trim().length === 0 && (
                  <TouchableOpacity 
                    style={styles.socialContextBtn}
                    onPress={() => handleViewTargetProfile(activeChat?.name || "", activeChat?.username)}
                  >
                    <Text style={styles.socialContextBtnText}>View profile</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {(activeChat?.messages || []).map((msg: any) => {
                const isMine = msg.senderId === (isSeller ? activeMaisonId : currentUserId);
                
                // Parse reply quotes
                let actualText = msg.content;
                let parentMsg: any = null;
                const match = msg.content.match(/^\[REPLY:([^\]]+)\]\s*(.*)$/);
                if (match) {
                  const parentMsgId = match[1];
                  actualText = match[2];
                  parentMsg = activeChat.messages?.find((m: any) => m.id === parentMsgId);
                }

                return (
                  <TouchableOpacity 
                    key={msg.id} 
                    onLongPress={() => { triggerHaptic("medium"); setLongPressedMessage(msg); }}
                    delayLongPress={350}
                    activeOpacity={0.9}
                    style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft, { flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                      {!isMine && (
                        <View style={styles.msgAvatar}>
                          <Text style={styles.msgAvatarText}>{activeChat?.name?.[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={[styles.msgBubble, isMine ? styles.msgBubbleRight : styles.msgBubbleLeft, { position: "relative" }]}>
                        {/* Quote preview rendering */}
                        {parentMsg && (
                          <View style={styles.bubbleReplyPreview}>
                            <Text style={styles.bubbleReplyText} numberOfLines={1}>
                              {parentMsg.content.startsWith("[REPLY:") 
                                ? parentMsg.content.replace(/^\[REPLY:[^\]]+\]\s*/, "") 
                                : parentMsg.content}
                            </Text>
                          </View>
                        )}
                        
                        <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" }}>
                          {renderMessageContent(actualText, isMine)}
                        </View>

                        {/* Bubble Reactions Row */}
                        {messageReactions[msg.id] && messageReactions[msg.id].length > 0 && (
                          <View style={styles.bubbleReactionsRow}>
                            {messageReactions[msg.id].map((emoji, index) => (
                              <Text key={index} style={{ fontSize: 13 }}>{emoji}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Status Text (Seen, Delivered, Sent) underneath the bubble, only show for my latest message */}
                    {isMine && (activeChat.messages.filter((m: any) => m.senderId === (isSeller ? activeMaisonId : currentUserId)).slice(-1)[0]?.id === msg.id) && (
                      <Text style={styles.msgStatusText}>
                        {msg.status === "sending" ? "Sending" : msg.status === "error" ? "Failed" : (msg.status === "read" ? "Seen" : (msg.status === "delivered" ? "Delivered" : "Sent"))}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {activeChat && activeChat.id && typingUsers[activeChat.id] && (
              <View style={styles.typingContainer}>
                <View style={styles.typingDotWrap}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { opacity: 0.3 }]} />
                </View>
                <Text style={styles.typingText}>
                  {typingUsers[activeChat.id]} is typing...
                </Text>
              </View>
            )}

            {/* Replying To Message Preview Bar */}
            {replyingToMessage && (
              <View style={styles.replyPreviewHeader}>
                <Text style={styles.replyPreviewTitle} numberOfLines={1}>
                  Replying to {replyingToMessage.senderId === currentUserId ? "yourself" : activeChat?.name}: {
                    replyingToMessage.content.startsWith("[REPLY:") 
                      ? replyingToMessage.content.replace(/^\[REPLY:[^\]]+\]\s*/, "") 
                      : replyingToMessage.content
                  }
                </Text>
                <TouchableOpacity onPress={() => { triggerHaptic("light"); setReplyingToMessage(null); }}>
                  <Lucide name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
            )}

            {/* EMOJI BAR OVERLAY */}
            {showEmojiBar && (
              <View style={styles.emojiBarContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 14 }}>
                  {EMOJIS.map((emoji) => (
                    <TouchableOpacity key={emoji} onPress={() => { triggerHaptic("light"); setChatReplyText((prev) => prev + emoji); }}>
                      <Text style={styles.emojiReactionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Input keyboard bar matching Instagram capsule style */}
            <View style={styles.chatInputBar}>
              <TouchableOpacity 
                style={styles.cameraCircleBtn} 
                onPress={handleCaptureCameraImage}
              >
                <Lucide name="camera" size={20} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.inputCapsule}>
                <TextInput
                  style={styles.capsuleInput}
                  placeholder="Message..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={chatReplyText}
                  onChangeText={handleTextChange}
                  onSubmitEditing={handleSendChatMessage}
                />
                
                {chatReplyText.trim().length > 0 ? (
                  <TouchableOpacity onPress={handleSendChatMessage}>
                    <Text style={styles.chatSendText}>Send</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <TouchableOpacity onPress={() => { triggerHaptic("light"); Alert.alert("Voice Message", "Recording simulated."); }}>
                      <Lucide name="mic-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShareImage}>
                      <Lucide name="image-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowEmojiBar(!showEmojiBar); }}>
                      <Lucide name={showEmojiBar ? "happy" : "happy-outline"} size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowAttachMenu(true); }}>
                      <Lucide name="add-circle-outline" size={21} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
            </View>
            </View>
          </SafeAreaView>
         </KeyboardAvoidingView>

          {/* ➕ ATTACHMENT / SHARING DRAWER BOTTOM SHEET (Rendered as View overlay inside chat Modal) */}
          {showAttachMenu && (
            <View style={StyleSheet.absoluteFillObject}>
              <TouchableOpacity 
                style={styles.attachMenuBackdrop} 
                activeOpacity={1} 
                onPress={() => setShowAttachMenu(false)}
              >
                <View style={styles.attachMenuContent}>
                  <View style={styles.attachMenuHeader}>
                    <View style={styles.attachMenuHandle} />
                  </View>
                  
                  <Text style={styles.attachMenuTitle}>Share Attachment</Text>

                  {sharingProductsList ? (
                    <View style={{ height: 200, marginTop: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10, paddingHorizontal: 16 }}>
                        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "bold" }}>SELECT PRODUCT</Text>
                        <TouchableOpacity onPress={() => setSharingProductsList(false)}>
                          <Text style={{ color: "#00f5ff", fontSize: 13 }}>Back</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                        {products.map((p) => (
                          <TouchableOpacity 
                            key={p.id} 
                            style={styles.shareProductItem}
                            onPress={() => handleShareProduct(p)}
                          >
                            <Image source={{ uri: p.images?.[0] }} style={styles.shareProductImg} />
                            <Text style={styles.shareProductTitle} numberOfLines={1}>{p.name || p.title}</Text>
                            <Text style={styles.shareProductPrice}>₹{parseFloat(p.price).toLocaleString()}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <ScrollView contentContainerStyle={styles.attachVerticalList}>
                      {/* Camera */}
                      <TouchableOpacity style={styles.attachVerticalItem} onPress={handleCaptureCameraImage}>
                        <View style={[styles.attachIconBg, { backgroundColor: "#1e1e1f" }]}>
                          <Lucide name="camera" size={22} color="#00f5ff" />
                        </View>
                        <Text style={styles.attachVerticalLabel}>Camera</Text>
                      </TouchableOpacity>

                      {/* Photos */}
                      <TouchableOpacity style={styles.attachVerticalItem} onPress={handleShareImage}>
                        <View style={[styles.attachIconBg, { backgroundColor: "#ff5e7e22" }]}>
                          <Lucide name="image" size={22} color="#ff5e7e" />
                        </View>
                        <Text style={styles.attachVerticalLabel}>Photos</Text>
                      </TouchableOpacity>

                      {/* Stickers */}
                      <TouchableOpacity style={styles.attachVerticalItem} onPress={() => { setShowAttachMenu(false); triggerHaptic("light"); setShowEmojiBar(true); }}>
                        <View style={[styles.attachIconBg, { backgroundColor: "#af52de22" }]}>
                          <Lucide name="happy" size={22} color="#af52de" />
                        </View>
                        <Text style={styles.attachVerticalLabel}>Stickers</Text>
                      </TouchableOpacity>

                      {/* Aura Cash */}
                      <TouchableOpacity style={styles.attachVerticalItem} onPress={() => { setShowAttachMenu(false); triggerHaptic("light"); Alert.alert("Aura Cash", "Aura Cash request generated!"); }}>
                        <View style={[styles.attachIconBg, { backgroundColor: "#34c75922" }]}>
                          <Lucide name="cash" size={22} color="#34c759" />
                        </View>
                        <Text style={styles.attachVerticalLabel}>Aura Cash</Text>
                      </TouchableOpacity>

                      {/* Audio */}
                      <TouchableOpacity 
                        style={styles.attachVerticalItem} 
                        onPress={() => { setShowAttachMenu(false); triggerHaptic("light"); Alert.alert("Voice Notes", "Recording simulated. Voice note shared!"); }}
                      >
                        <View style={[styles.attachIconBg, { backgroundColor: "#ff950022" }]}>
                          <Lucide name="mic" size={22} color="#ff9500" />
                        </View>
                        <Text style={styles.attachVerticalLabel}>Audio</Text>
                      </TouchableOpacity>

                      {/* Send Later */}
                      <TouchableOpacity 
                        style={styles.attachVerticalItem} 
                        onPress={() => { setShowAttachMenu(false); triggerHaptic("light"); Alert.alert("Send Later", "Message scheduled!"); }}
                      >
                        <View style={[styles.attachIconBg, { backgroundColor: "#007aff22" }]}>
                          <Lucide name="time" size={22} color="#007aff" />
                        </View>
                        <Text style={styles.attachVerticalLabel}>Send Later</Text>
                      </TouchableOpacity>

                      {/* Store */}
                      <TouchableOpacity style={styles.attachVerticalItem} onPress={() => setSharingProductsList(true)}>
                        <View style={[styles.attachIconBg, { backgroundColor: "#5856d622" }]}>
                          <Lucide name="basket" size={22} color="#5856d6" />
                        </View>
                        <Text style={styles.attachVerticalLabel}>Store</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 📞 CALLING / OVERLAY (Rendered as View overlay inside chat Modal) */}
          {(callState as any) !== "none" && activeCall && (
            <View style={StyleSheet.absoluteFillObject}>
              <View style={styles.callOverlayContainer}>
                <LinearGradient
                  colors={["#120d2c", "#080415"]}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Video preview for caller/receiver in Video Calls */}
                {activeCall.type === "VIDEO" && callState === "active" && (
                  <View style={StyleSheet.absoluteFillObject}>
                    {RtcSurfaceView ? (
                      <RtcSurfaceView
                        style={StyleSheet.absoluteFillObject}
                        canvas={{ uid: callRemoteUid || 0 }}
                      />
                    ) : (
                      <Image
                        source={{ uri: callerInfo?.avatar || activeChat?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400" }}
                        style={StyleSheet.absoluteFillObject}
                        blurRadius={3}
                      />
                    )}
                    {/* Floating local preview box */}
                    <View style={styles.localVideoBox}>
                      {RtcSurfaceView ? (
                        <RtcSurfaceView
                          style={StyleSheet.absoluteFillObject}
                          canvas={{ uid: 0 }}
                        />
                      ) : (
                        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                          <Lucide name="camera" size={24} color="#00f5ff" />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <SafeAreaView style={styles.callSafeArea}>
                  {/* Profile Card */}
                  <View style={styles.callProfileCard}>
                    <Image
                      source={{ uri: callerInfo?.avatar || activeChat?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100" }}
                      style={styles.callAvatar}
                    />
                    <Text style={styles.callName}>
                      {callState === "incoming" ? callerInfo?.name : activeChat?.name}
                    </Text>
                    <Text style={styles.callStatusText}>
                      {callState === "outgoing" && "Ringing..."}
                      {callState === "incoming" && `Incoming ${activeCall.type.toLowerCase()} call...`}
                      {callState === "active" && "Call Connected"}
                    </Text>
                  </View>

                  {/* Call Controls buttons row */}
                  <View style={styles.callControlsRow}>
                    {callState === "incoming" ? (
                      <>
                        <TouchableOpacity style={[styles.callBtn, styles.declineBtn]} onPress={declineCall}>
                          <Lucide name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={acceptCall}>
                          <Lucide name="checkmark" size={28} color="#fff" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={[styles.callBtn, styles.endCallBtn]} onPress={endCall}>
                        <Lucide name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
                      </TouchableOpacity>
                    )}
                  </View>
                </SafeAreaView>
              </View>
            </View>
          )}

          {/* 🔘 DYNAMIC LONG-PRESS MESSAGE OPTIONS DRAWER OVERLAY */}
          {longPressedMessage && (
            <View style={StyleSheet.absoluteFillObject}>
              <TouchableOpacity 
                style={styles.longPressBackdrop} 
                activeOpacity={1} 
                onPress={() => setLongPressedMessage(null)}
              >
                <View style={styles.longPressContainer}>
                  {/* 1. Emoji Reaction pill */}
                  <View style={styles.reactionPillContainer}>
                    {REACTION_EMOJIS.map((emoji) => (
                      <TouchableOpacity key={emoji} onPress={() => handleReactToMessage(longPressedMessage.id, emoji)}>
                        <Text style={styles.reactionEmojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => handleReactToMessage(longPressedMessage.id, "MORE")}>
                      <Lucide name="add-circle" size={26} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* 2. Options menu card */}
                  <View style={styles.longPressOptionsCard}>
                    <Text style={styles.longPressTimestamp}>
                      {new Date(longPressedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {/* Reply */}
                    <TouchableOpacity style={styles.longPressOptionItem} onPress={() => handleMessageAction("REPLY")}>
                      <Lucide name="arrow-undo-outline" size={22} color="#fff" />
                      <Text style={styles.longPressOptionLabel}>Reply</Text>
                    </TouchableOpacity>

                    {/* Save reply */}
                    <TouchableOpacity style={styles.longPressOptionItem} onPress={() => handleMessageAction("SAVE")}>
                      <Lucide name="chatbubble-outline" size={22} color="#fff" />
                      <Text style={styles.longPressOptionLabel}>Save reply</Text>
                    </TouchableOpacity>

                    {/* Add sticker */}
                    <TouchableOpacity style={styles.longPressOptionItem} onPress={() => handleMessageAction("STICKER")}>
                      <Lucide name="happy-outline" size={22} color="#fff" />
                      <Text style={styles.longPressOptionLabel}>Add sticker</Text>
                    </TouchableOpacity>

                    {/* Delete for you */}
                    <TouchableOpacity style={styles.longPressOptionItem} onPress={() => handleMessageAction("DELETE")}>
                      <Lucide name="trash-outline" size={22} color="#fff" />
                      <Text style={styles.longPressOptionLabel}>Delete for you</Text>
                    </TouchableOpacity>

                    {/* Unsend (in RED) */}
                    <TouchableOpacity style={styles.longPressOptionItem} onPress={() => handleMessageAction("UNSEND")}>
                      <Lucide name="arrow-undo" size={22} color="#ff4a4a" />
                      <Text style={[styles.longPressOptionLabel, { color: "#ff4a4a" }]}>Unsend</Text>
                    </TouchableOpacity>

                    {/* More */}
                    <TouchableOpacity style={styles.longPressOptionItem} onPress={() => handleMessageAction("MORE")}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flex: 1 }}>
                        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                          <Lucide name="ellipsis-horizontal" size={22} color="#fff" />
                          <Text style={styles.longPressOptionLabel}>More</Text>
                        </View>
                        <Lucide name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* 👤 NEW CHAT CREATOR/USER SELECTOR MODAL */}
      <Modal visible={showNewChatModal} animationType="slide" transparent>
        <View style={styles.newChatOverlay}>
          <SafeAreaView style={styles.newChatSafeArea}>
            {/* Header */}
            <View style={styles.newChatHeader}>
              <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowNewChatModal(false); setSearchNewChat(""); }}>
                <Text style={{ color: "#fff", fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.newChatTitle}>New Message</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Search Input */}
            <View style={styles.newChatSearchContainer}>
              <Text style={styles.newChatSearchTo}>To:</Text>
              <TextInput
                style={styles.newChatSearchInput}
                placeholder="Search profiles..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchNewChat}
                onChangeText={handleSearchProfiles}
                autoFocus
              />
            </View>

            {/* User List */}
            {loadingSuggested ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="small" color="#00f5ff" />
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
                <Text style={styles.newChatSuggestedTitle}>
                  {searchNewChat ? "SEARCH RESULTS" : "SUGGESTED"}
                </Text>
                {suggestedProfiles.length === 0 ? (
                  <Text style={styles.newChatEmptyText}>No profiles found.</Text>
                ) : (
                  suggestedProfiles.map((profile) => (
                    <TouchableOpacity
                      key={profile.id}
                      style={styles.newChatUserRow}
                      onPress={() => handleInitiateNewChat(profile)}
                    >
                      {profile.logo || profile.avatar ? (
                        <Image source={{ uri: profile.logo || profile.avatar }} style={styles.newChatAvatar} />
                      ) : (
                        <View style={[styles.newChatAvatar, styles.newChatAvatarFallback]}>
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            {profile.name[0]?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.newChatName}>{profile.name}</Text>
                        <Text style={styles.newChatUsername}>@{profile.username}</Text>
                      </View>
                      <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* 📞 ROOT LEVEL CALLING / OVERLAY (For when active chat thread is not open) */}
      {(callState as any) !== "none" && activeCall && !activeChat && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>
          <View style={styles.callOverlayContainer}>
            <LinearGradient
              colors={["#120d2c", "#080415"]}
              style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.callSafeArea}>
              <View style={styles.callProfileCard}>
                <Image
                  source={{ uri: callerInfo?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100" }}
                  style={styles.callAvatar}
                />
                <Text style={styles.callName}>{callerInfo?.name || "Verified Citizen"}</Text>
                <Text style={styles.callStatusText}>
                  {callState === "incoming" ? `Incoming ${activeCall.type.toLowerCase()} call...` : "Calling..."}
                </Text>
              </View>

              <View style={styles.callControlsRow}>
                {callState === "incoming" ? (
                  <>
                    <TouchableOpacity style={[styles.callBtn, styles.declineBtn]} onPress={declineCall}>
                      <Lucide name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={acceptCall}>
                      <Lucide name="checkmark" size={28} color="#fff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={[styles.callBtn, styles.endCallBtn]} onPress={endCall}>
                    <Lucide name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#8b5cf6",
  },
  headerNameText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  headerUsernameText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: -1,
  },
  socialContextContainer: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    marginBottom: 16,
  },
  socialContextAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#8b5cf6",
  },
  socialContextTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  socialContextUsername: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginBottom: 12,
  },
  socialContextSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
  },
  socialContextBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  socialContextBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
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
  dmFilterStrip: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 4,
  },
  msgBubbleRight: {
    backgroundColor: "#8b5cf6",
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
    color: "#fff",
    fontWeight: "500",
  },


  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
  },
  typingDotWrap: {
    flexDirection: "row",
    gap: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00f5ff",
  },
  typingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontStyle: "italic",
  },
  newChatOverlay: {
    flex: 1,
    backgroundColor: "#080415",
  },
  newChatSafeArea: {
    flex: 1,
  },
  newChatHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  newChatTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold" as const,
  },
  newChatSearchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  newChatSearchTo: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    marginRight: 12,
  },
  newChatSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  newChatSuggestedTitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12.5,
    fontWeight: "bold" as const,
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  newChatEmptyText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 15,
    textAlign: "center" as const,
    marginTop: 40,
  },
  newChatUserRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  newChatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  newChatAvatarFallback: {
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  newChatName: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "600" as const,
  },
  newChatUsername: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    marginTop: 1,
  },
  callOverlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  callSafeArea: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 50,
    zIndex: 10,
  },
  callProfileCard: {
    alignItems: "center",
    marginTop: 40,
    gap: 16,
  },
  callAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#00f5ff",
  },
  callName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  callStatusText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
  },
  callControlsRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 20,
  },
  callBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: "#10b981",
  },
  declineBtn: {
    backgroundColor: "#ef4444",
  },
  endCallBtn: {
    backgroundColor: "#ef4444",
  },
  localVideoBox: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#00f5ff",
    backgroundColor: "#000",
    zIndex: 100,
  },
  attachMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  attachMenuContent: {
    backgroundColor: "#0c0822",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  attachMenuHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  attachMenuHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  attachMenuTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  attachOptionsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  attachOptionBtn: {
    alignItems: "center",
    gap: 8,
  },
  attachIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  attachOptionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  shareProductItem: {
    backgroundColor: "#120d2c",
    width: 110,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  shareProductImg: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginBottom: 6,
  },
  shareProductTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    width: "100%",
    textAlign: "center",
  },
  shareProductPrice: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  msgImageContainer: {
    borderRadius: 14,
    overflow: "hidden",
    maxWidth: 220,
    height: 150,
  },
  msgImage: {
    width: "100%",
    height: "100%",
  },
  msgLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 6,
  },
  msgLocationText: {
    color: "#00f5ff",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  msgProductCard: {
    flexDirection: "row",
    backgroundColor: "#120d2c",
    borderRadius: 12,
    padding: 10,
    width: 220,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  msgProductImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  msgProductName: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  msgProductPrice: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 6,
  },
  msgProductBuyBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: "center",
  },
  msgProductBuyText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
  },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  cameraCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
  },
  inputCapsule: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  capsuleInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14.5,
    paddingVertical: 0,
    height: "100%",
  },
  chatSendText: {
    color: "#00f5ff",
    fontWeight: "bold",
    fontSize: 15,
    paddingHorizontal: 4,
  },
  emojiBarContainer: {
    backgroundColor: "#120d2c",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  emojiReactionText: {
    fontSize: 24,
  },
  attachVerticalList: {
    paddingHorizontal: 24,
    gap: 14,
    paddingTop: 10,
    paddingBottom: 30,
  },
  attachVerticalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 8,
    gap: 16,
  },
  attachVerticalLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  attachVerticalSubtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12.5,
    marginTop: 2,
  },
  bubbleReplyPreview: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderLeftWidth: 3,
    borderLeftColor: "#00f5ff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
    opacity: 0.85,
  },
  bubbleReplyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12.5,
    fontStyle: "italic",
  },
  bubbleReactionsRow: {
    flexDirection: "row",
    gap: 3,
    backgroundColor: "#1c1c1e",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#080415",
    position: "absolute",
    bottom: -11,
    right: 8,
    zIndex: 10,
  },
  longPressBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  longPressContainer: {
    width: "80%",
    alignItems: "center",
    gap: 16,
  },
  reactionPillContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  reactionEmojiText: {
    fontSize: 24,
  },
  longPressOptionsCard: {
    width: "100%",
    backgroundColor: "#1c1c1e",
    borderRadius: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  longPressTimestamp: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  longPressOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  longPressOptionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  replyPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  replyPreviewTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    flex: 1,
  },
  msgStatusText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 2.5,
    marginRight: 6,
  },
});
