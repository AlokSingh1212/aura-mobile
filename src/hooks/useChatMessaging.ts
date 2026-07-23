import { useState, useRef } from "react";
import { Alert } from "react-native";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { validateOutboundText } from "@/lib/moderation";
import { API_HOST } from "@/constants/api";
import { cacheConversations, addPendingAction } from "@/utils/localDb";
import { isConversationBlocked } from "@/lib/feedSocialFilter";
import { reactToMessage, resolveChatScope } from "@/lib/chatEnhancements";
import { authHeaders } from "@/lib/apiClient";
import { useStore } from "@/store/useStore";

export const CHAT_REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👏"];

type UseChatMessagingOptions = {
  activeChat: any;
  setActiveChat: React.Dispatch<React.SetStateAction<any>>;
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  currentUserId: string;
  currentUser: any;
  isSeller: boolean;
  sellerMaisonId: string;
  activeMaisonId: string;
  socialGraph: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

function resolveChatSenderName(isSeller: boolean, activeMaisonId: string, currentUser: any) {
  if (!isSeller) return currentUser?.name || "Alok Singh";
  if (activeMaisonId === "rare_raven") return "Rare Raven";
  if (activeMaisonId === "aloksingh") return "Alok Singh";
  return activeMaisonId.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveTypingUsername(isSeller: boolean, activeMaisonId: string, currentUser: any) {
  if (!isSeller) return currentUser?.name || "Alok Singh";
  if (activeMaisonId === "rare_raven") return "Rare Raven";
  if (activeMaisonId === "aloksingh") return "Alok Singh";
  return activeMaisonId;
}

function attachmentPreview(attachType: "IMAGE" | "LOCATION" | "PRODUCT" | "AUDIO" | "GIF") {
  if (attachType === "IMAGE") return "📷 Sent an image";
  if (attachType === "GIF") return "GIF";
  if (attachType === "LOCATION") return "📍 Sent a location";
  if (attachType === "AUDIO") return "🎵 Sent a voice note";
  return "🛍️ Sent a product card";
}

export function useChatMessaging({
  activeChat,
  setActiveChat,
  setConversations,
  currentUserId,
  currentUser,
  isSeller,
  sellerMaisonId,
  activeMaisonId,
  socialGraph,
  triggerHaptic,
}: UseChatMessagingOptions) {
  const [chatReplyText, setChatReplyText] = useState("");
  const [isTypingSent, setIsTypingSent] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const isSendingMessageRef = useRef(false);
  
  const { activeProfile } = useStore();

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [sharingProductsList, setSharingProductsList] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const [longPressedMessage, setLongPressedMessage] = useState<any>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
  const [replyTo, setReplyTo] = useState<any>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const resolveMessageSenderId = () =>
    activeChat?.type === "GROUP" ? currentUserId : isSeller ? sellerMaisonId : currentUserId;

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
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: authHeaders().Authorization || "",
        },
      });

      const data = await res.json();
      if (data.success && data.url) {
        return `${API_HOST}${data.url}`;
      }
      throw new Error(data.error || "Upload failed");
    } catch (e) {
      console.warn("Image upload failed:", e);
      throw e;
    }
  };

  const uploadAudioFile = async (localUri: string): Promise<string> => {
    try {
      const filename = localUri.split("/").pop() || "voice.m4a";
      const formData = new FormData();
      formData.append("file", {
        uri: localUri,
        name: filename,
        type: "audio/m4a",
      } as any);

      const res = await fetch(`${API_HOST}/api/mobile/chat/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: authHeaders().Authorization || "",
        },
      });

      const data = await res.json();
      if (data.success && data.url) {
        return data.url.startsWith("http") ? data.url : `${API_HOST}${data.url}`;
      }
      throw new Error(data.error || "Upload failed");
    } catch (e) {
      console.warn("Audio upload failed:", e);
      throw e;
    }
  };

  const sendAttachmentMessage = async (
    attachType: "IMAGE" | "LOCATION" | "PRODUCT" | "AUDIO" | "GIF",
    content: string
  ) => {
    if (isSendingMessageRef.current) return;
    if (!activeChat) return;
    isSendingMessageRef.current = true;
    const currentSenderName = resolveChatSenderName(isSeller, activeMaisonId, currentUser);
    const formattedContent = `[ATTACHMENT:${attachType}]${content}`;
    const preview = attachmentPreview(attachType);
    const tempMessage = {
      id: `m_${Date.now()}`,
      content: formattedContent,
      senderId: resolveMessageSenderId(),
      senderName: currentSenderName,
      createdAt: new Date().toISOString(),
      isAdmin: isSeller,
      status: "sending" as const,
    };
    setActiveChat((prev: any) => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage],
      lastMessage: preview,
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              messages: [...(c.messages || []), tempMessage],
              lastMessage: preview,
            }
          : c
      )
    );
    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          conversationId: activeChat.id,
          senderId: resolveMessageSenderId(),
          senderName: currentSenderName,
          content: formattedContent,
          type: activeChat.type || "MAISON",
          isAdmin: isSeller,
          profileId: activeProfile?.id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const realMsg = { ...data.message, status: "sent" };
        setActiveChat((prev: any) => ({
          ...prev,
          messages: prev.messages.map((m: any) => (m.id === tempMessage.id ? realMsg : m)),
        }));
      }
    } catch (err) {
      console.warn("Failed to dispatch attachment message:", err);
    } finally {
      isSendingMessageRef.current = false;
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
        const remoteUrl = await uploadImageFile(result.assets[0].uri);
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
        const remoteUrl = await uploadImageFile(result.assets[0].uri);
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
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.coords.latitude},${loc.coords.longitude}`;
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
      image: product.images?.[0] || product.image,
    });
    await sendAttachmentMessage("PRODUCT", productPayload);
  };

  const handleShareGif = async (gifUrl: string) => {
    setShowGifPicker(false);
    setShowAttachMenu(false);
    triggerHaptic("medium");
    await sendAttachmentMessage("GIF", gifUrl);
  };

  const toggleVanishMode = async (enabled: boolean) => {
    if (!activeChat?.id || !currentUserId) return;
    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat/vanish-mode`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUserId,
          conversationId: activeChat.id,
          enabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat((prev: any) => (prev ? { ...prev, vanishMode: enabled } : prev));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeChat.id ? { ...c, vanishMode: enabled } : c))
        );
        triggerHaptic("success");
        Alert.alert(
          enabled ? "Vanish mode on" : "Vanish mode off",
          enabled
            ? "New messages will disappear after they're seen."
            : "Messages will stay in this chat."
        );
      }
    } catch {
      Alert.alert("Could not update vanish mode", "Try again in a moment.");
    }
  };

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Microphone permission is required to record audio.");
        return;
      }
      triggerHaptic("medium");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.warn("Failed to start audio recording:", err);
      Alert.alert("Error", "Could not start audio recording.");
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;
    triggerHaptic("success");
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        const remoteUrl = await uploadAudioFile(uri);
        await sendAttachmentMessage("AUDIO", remoteUrl);
      }
    } catch (err) {
      console.warn("Failed to stop audio recording:", err);
      Alert.alert("Error", "Failed to process audio recording.");
    }
  };

  const handleReactToMessage = (msgId: string, emoji: string) => {
    triggerHaptic("medium");
    setLongPressedMessage(null);

    const current = messageReactions[msgId] || [];
    const isRemoving = current.includes(emoji);

    setMessageReactions((prev) => {
      const cur = prev[msgId] || [];
      if (cur.includes(emoji)) {
        return { ...prev, [msgId]: cur.filter((e) => e !== emoji) };
      }
      return { ...prev, [msgId]: [...cur, emoji] };
    });

    const scope = activeChat ? resolveChatScope(activeChat.type) : null;
    if (!scope || !currentUserId) return;

    reactToMessage({
      userId: currentUserId,
      messageId: msgId,
      emoji,
      scope,
      remove: isRemoving,
    }).catch((err) => {
      console.warn("[ChatDrawer] Reaction sync failed:", err);
    });
  };

  const handleUnsendMessage = async (msgId: string) => {
    triggerHaptic("heavy");
    setLongPressedMessage(null);

    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.filter((m: any) => m.id !== msgId),
      };
    });

    try {
      await fetch(`${API_HOST}/api/mobile/chat/unsend`, {
        method: "POST",
        body: JSON.stringify({ messageId: msgId, type: activeChat?.type }),
        headers: authHeaders(),
      });
    } catch (e) {
      console.warn("Unsend backend sync failed:", e);
    }
  };

  const handleMessageAction = (action: "REPLY" | "SAVE" | "STICKER" | "DELETE" | "UNSEND" | "MORE") => {
    if (!longPressedMessage) return;
    const msgId = longPressedMessage.id;

    if (action === "REPLY") {
      setReplyTo(longPressedMessage);
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

  const sendTypingStatus = async (typing: boolean) => {
    if (!activeChat) return;
    const username = resolveTypingUsername(isSeller, activeMaisonId, currentUser);

    if (typing === isTypingSent) return;
    setIsTypingSent(typing);

    try {
      await fetch(`${API_HOST}/api/mobile/chat/typing`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          conversationId: activeChat.id,
          username,
          isTyping: typing,
        }),
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
    if (isSendingMessageRef.current) return;
    if (!chatReplyText.trim() || !activeChat) return;
    isSendingMessageRef.current = true;

    if (socialGraph && isConversationBlocked(activeChat, socialGraph)) {
      Alert.alert("Blocked", "Unblock this account to send messages.");
      isSendingMessageRef.current = false;
      return;
    }

    const moderation = validateOutboundText(chatReplyText);
    if (!moderation.ok) {
      Alert.alert("Message not sent", moderation.error || "This content is not allowed.");
      isSendingMessageRef.current = false;
      return;
    }

    triggerHaptic("medium");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);

    const textToSend = replyTo
      ? `[REPLY:${replyTo.id}] ${moderation.cleanText}`
      : moderation.cleanText;

    setReplyTo(null);
    setChatReplyText("");

    const currentSenderName = resolveChatSenderName(isSeller, activeMaisonId, currentUser);

    const senderId = resolveMessageSenderId();

    const tempMessage = {
      id: `m_${Date.now()}`,
      content: textToSend,
      senderId,
      senderName: currentSenderName,
      createdAt: new Date().toISOString(),
      isAdmin: isSeller,
      status: "sending" as const,
    };

    setActiveChat((prev: any) => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage],
      lastMessage: textToSend,
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              messages: [...(c.messages || []), tempMessage],
              lastMessage: textToSend,
            }
          : c
      )
    );

    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          conversationId: activeChat.id,
          senderId: resolveMessageSenderId(),
          senderName: currentSenderName,
          content: textToSend,
          type: activeChat.type || "MAISON",
          isAdmin: isSeller,
          profileId: activeProfile?.id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const realMsg = { ...data.message, status: "sent" };
        setActiveChat((prev: any) => ({
          ...prev,
          messages: prev.messages.map((m: any) => (m.id === tempMessage.id ? realMsg : m)),
        }));

        let updatedList: any[] = [];
        setConversations((prev) => {
          updatedList = prev.map((c) =>
            c.id === activeChat.id
              ? {
                  ...c,
                  messages: c.messages.map((m: any) => (m.id === tempMessage.id ? realMsg : m)),
                  lastMessage: textToSend,
                }
              : c
          );
          return updatedList;
        });

        try {
          cacheConversations(updatedList);
        } catch {
          /* offline cache optional */
        }
      } else {
        throw new Error("API responded with success=false");
      }
    } catch (e) {
      console.warn("Could not sync message to server, queuing offline.", e);
      const failedMsg = { ...tempMessage, status: "error" as const };
      setActiveChat((prev: any) => ({
        ...prev,
        messages: prev.messages.map((m: any) => (m.id === tempMessage.id ? failedMsg : m)),
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                messages: c.messages.map((m: any) => (m.id === tempMessage.id ? failedMsg : m)),
                lastMessage: textToSend,
              }
            : c
        )
      );

      try {
        addPendingAction("sendMessage", {
          conversationId: activeChat.id,
          senderId: resolveMessageSenderId(),
          senderName: currentSenderName,
          content: textToSend,
          type: activeChat.type || "MAISON",
          isAdmin: isSeller,
        });
      } catch (err) {
        console.warn("Offline action queue write error:", err);
      }
    } finally {
      isSendingMessageRef.current = false;
    }
  };

  return {
    chatReplyText,
    showAttachMenu,
    setShowAttachMenu,
    sharingProductsList,
    setSharingProductsList,
    longPressedMessage,
    setLongPressedMessage,
    messageReactions,
    replyTo,
    setReplyTo,
    isRecording,
    handleStartRecording,
    handleStopRecording,
    handleShareImage,
    handleCaptureCameraImage,
    handleShareLocation,
    handleShareProduct,
    handleShareGif,
    toggleVanishMode,
    showGifPicker,
    setShowGifPicker,
    handleReactToMessage,
    handleMessageAction,
    handleTextChange,
    handleSendChatMessage,
    REACTION_EMOJIS: CHAT_REACTION_EMOJIS,
  };
}
