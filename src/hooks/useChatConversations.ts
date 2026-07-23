import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_HOST } from "@/constants/api";
import { getLocalConversations, cacheConversations, updateConversationCategory } from "@/utils/localDb";
import { filterConversations, isConversationBlocked } from "@/lib/feedSocialFilter";
import { canReceiveDm } from "@/lib/settingsEnforcement";
import { createGroupChat } from "@/lib/chatEnhancements";
import { shouldFilterMessageRequests } from "@/lib/settingsRuntime";
import { authHeaders } from "@/lib/apiClient";

type UseChatConversationsOptions = {
  visible: boolean;
  currentUserId: string;
  currentUser: any;
  activeProfile: any;
  isSeller: boolean;
  sellerMaisonId: string;
  activeMaisonId: string;
  initialConversationId: string | null;
  socialGraph: any;
  socialGraphVersion: number;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useChatConversations({
  visible,
  currentUserId,
  currentUser,
  activeProfile,
  isSeller,
  sellerMaisonId,
  activeMaisonId,
  initialConversationId,
  socialGraph,
  socialGraphVersion,
  triggerHaptic,
}: UseChatConversationsOptions) {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [dmSearch, setDmSearch] = useState("");
  const [activeDmFilter, setActiveDmFilter] = useState("Primary");
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [conversationLabels, setConversationLabels] = useState<Record<string, string>>({});

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatMode, setNewChatMode] = useState<"direct" | "group">("direct");
  const [groupSelectedMembers, setGroupSelectedMembers] = useState<
    { userId: string; name: string; username: string }[]
  >([]);
  const [searchNewChat, setSearchNewChat] = useState("");
  const [suggestedProfiles, setSuggestedProfiles] = useState<any[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  const [longPressedThread, setLongPressedThread] = useState<any>(null);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>([]);
  const [mutedThreadIds, setMutedThreadIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("@pinned_threads").then((val) => {
      if (val) setPinnedThreadIds(JSON.parse(val));
    }).catch(() => {});
    AsyncStorage.getItem("@muted_threads").then((val) => {
      if (val) setMutedThreadIds(JSON.parse(val));
    }).catch(() => {});
  }, []);

  const handleTogglePin = useCallback((thread: any) => {
    setPinnedThreadIds((prev) => {
      const next = prev.includes(thread.id)
        ? prev.filter((id) => id !== thread.id)
        : [...prev, thread.id];
      AsyncStorage.setItem("@pinned_threads", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const handleToggleMute = useCallback((thread: any) => {
    setMutedThreadIds((prev) => {
      const next = prev.includes(thread.id)
        ? prev.filter((id) => id !== thread.id)
        : [...prev, thread.id];
      AsyncStorage.setItem("@muted_threads", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const handleToggleUnread = useCallback((thread: any) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === thread.id ? { ...c, unread: !c.unread } : c))
    );
  }, []);

  const handleDeleteThread = useCallback((thread: any) => {
    setConversations((prev) => prev.filter((c) => c.id !== thread.id));
  }, []);

  const applySocialFilters = useCallback(
    (list: any[]) => {
      let out = list;
      if (socialGraph) out = filterConversations(out, socialGraph);
      // Sort: pinned first, then by updatedAt desc
      out = [...out].sort((a, b) => {
        const aPinned = pinnedThreadIds.includes(a.id);
        const bPinned = pinnedThreadIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      });
      return out;
    },
    [socialGraph, pinnedThreadIds]
  );

  const fetchChats = useCallback(async (isBackground = false) => {
    try {
      const localConvs = getLocalConversations();
      if (localConvs && localConvs.length > 0) {
        setConversations(applySocialFilters(localConvs));
      }
    } catch (err) {
      console.warn("Failed to load local SQLite conversations:", err);
    }

    if (!isBackground) {
      setLoadingChats(true);
    }
    try {
      const activeProfileId = activeProfile?.id || "";
      const activeProfileType = activeProfile?.type || "PERSONAL";
      const effectiveMaisonId = activeProfile?.maisonId || activeProfile?.username || activeMaisonId || sellerMaisonId || "";
      const effectiveSellerMode = isSeller || activeProfileType === "BUSINESS" || !!activeProfile?.maisonId;

      const res = await fetch(
        `${API_HOST}/api/mobile/chat?userId=${currentUserId}&profileId=${activeProfileId}&maisonId=${effectiveMaisonId}&mode=${effectiveSellerMode ? "seller" : "buyer"}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (data.success && data.conversations.length > 0) {
        const localConvs = getLocalConversations();
        const localCategoryMap: Record<string, string> = {};
        localConvs.forEach((lc: any) => {
          if (lc.id && lc.category) {
            localCategoryMap[lc.id] = lc.category;
          }
        });

        const mapped = data.conversations.map((c: any) => {
          let category = localCategoryMap[c.id];
          if (!category) {
            const ctxText = (c.socialContextText || "").toLowerCase();
            const filterRequests = shouldFilterMessageRequests();
            if (ctxText.includes("follows you")) {
              category = "Requests";
            } else if (ctxText.includes("don't follow") || ctxText.includes("dont follow")) {
              category = filterRequests ? "Requests" : "General";
            } else if (ctxText.includes("ad") || c.name.toLowerCase().includes("ad")) {
              category = "From ads";
            } else if (
              filterRequests &&
              !ctxText.includes("mutual") &&
              !canReceiveDm({
                profileId: c.peerProfileId || c.profileId,
                isFollowing: c.isFollowing,
                isFollower: c.isFollower,
              })
            ) {
              category = "Requests";
            } else {
              category = "Primary";
            }
          }
          return { ...c, category };
        });
        setConversations(applySocialFilters(mapped));

        setActiveChat((prevActive: any) => {
          if (!prevActive) return null;
          const updatedConvo = mapped.find((c: any) => c.id === prevActive.id);
          if (updatedConvo) {
            return {
              ...prevActive,
              ...updatedConvo,
              messages: updatedConvo.messages || []
            };
          }
          return prevActive;
        });

        const labelMap: Record<string, string> = {};
        mapped.forEach((c: any) => {
          if (c.label) labelMap[c.id] = c.label;
        });
        setConversationLabels(labelMap);

        try {
          cacheConversations(mapped);
        } catch (err) {
          console.warn("Failed to cache conversations in SQLite:", err);
        }
      } else {
        setConversations([]);
      }
    } catch (e) {
      console.warn("fetchChats API call failed:", e);
    } finally {
      if (!isBackground) {
        setLoadingChats(false);
      }
    }
  }, [activeMaisonId, applySocialFilters, currentUserId, isSeller, sellerMaisonId, setActiveChat]);

  const performShiftCategory = async (convoId: string, targetCategory: string) => {
    try {
      updateConversationCategory(convoId, targetCategory);
      setConversations((prevList) =>
        prevList.map((convo) =>
          convo.id === convoId ? { ...convo, category: targetCategory } : convo
        )
      );
      triggerHaptic("success");
    } catch (err) {
      console.warn("Failed to shift category:", err);
    }
  };

  const handleShiftCategoryPrompt = (thread: any) => {
    triggerHaptic("heavy");
    Alert.alert(
      "Shift Category",
      `Move conversation with ${thread.name} to section:`,
      [
        { text: "Primary", onPress: () => performShiftCategory(thread.id, "Primary") },
        { text: "From ads", onPress: () => performShiftCategory(thread.id, "From ads") },
        { text: "Requests", onPress: () => performShiftCategory(thread.id, "Requests") },
        { text: "General", onPress: () => performShiftCategory(thread.id, "General") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const fetchSuggestedProfiles = useCallback(async () => {
    setLoadingSuggested(true);
    try {
      const res = await fetch(
        `${API_HOST}/api/mobile/profile/suggested?viewerProfileId=${activeProfile?.id || "prof_active"}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles)) {
        setSuggestedProfiles(data.profiles);
      }
    } catch (e) {
      console.warn("Failed to fetch suggested profiles:", e);
    } finally {
      setLoadingSuggested(false);
    }
  }, [activeProfile?.id]);

  const handleSearchProfiles = async (query: string) => {
    setSearchNewChat(query);
    if (query.trim().length < 2) {
      fetchSuggestedProfiles();
      return;
    }
    setLoadingSuggested(true);
    try {
      const res = await fetch(
        `${API_HOST}/api/mobile/profile/search?q=${encodeURIComponent(query)}`,
        { headers: authHeaders() }
      );
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
    if (newChatMode === "group") {
      const memberUserId = profile.userId as string | undefined;
      if (!memberUserId) {
        Alert.alert("Search required", "Search for people by name to add them to a group.");
        return;
      }
      triggerHaptic("light");
      setGroupSelectedMembers((prev) => {
        if (prev.some((m) => m.userId === memberUserId)) {
          return prev.filter((m) => m.userId !== memberUserId);
        }
        return [
          ...prev,
          {
            userId: memberUserId,
            name: profile.name || profile.username,
            username: profile.username || profile.name,
          },
        ];
      });
      return;
    }

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
        headers: authHeaders(),
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

  const handleCreateGroupChat = () => {
    if (groupSelectedMembers.length < 1) {
      Alert.alert("Add members", "Select at least one other person for the group.");
      return;
    }

    const submitGroup = async (name: string | undefined) => {
      const trimmed = name?.trim();
      if (!trimmed) return;
      triggerHaptic("medium");
      const result = await createGroupChat({
        userId: currentUserId,
        name: trimmed,
        memberUserIds: groupSelectedMembers.map((m) => m.userId),
        initialMessage: "Group created 👋",
      });
      if (!result.success || !result.group) {
        Alert.alert("Could not create group", result.error || "Try again.");
        return;
      }
      triggerHaptic("success");
      setShowNewChatModal(false);
      setSearchNewChat("");
      setNewChatMode("direct");
      setGroupSelectedMembers([]);
      await fetchChats();
      setActiveChat({
        id: result.group.id,
        name: result.group.name,
        type: "GROUP",
        avatar: result.group.avatarUrl,
        messages: [],
        lastMessage: result.group.lastMessage,
        memberCount: result.group.members.length,
        socialContextText: `${result.group.members.length} members`,
        updatedAt: result.group.updatedAt,
      });
    };

    if (Alert.prompt) {
      Alert.prompt("Group name", "Name this group chat", (name) => void submitGroup(name), "plain-text");
    } else {
      void submitGroup(`${groupSelectedMembers[0]?.name || "Group"} + friends`);
    }
  };

  useEffect(() => {
    if (showNewChatModal) {
      fetchSuggestedProfiles();
    }
  }, [showNewChatModal, fetchSuggestedProfiles]);

  useEffect(() => {
    if (visible && initialConversationId && conversations.length > 0) {
      const found = conversations.find((c) => c.id === initialConversationId);
      if (found) {
        setActiveChat(found);
      }
    }
  }, [initialConversationId, conversations, visible]);

  useEffect(() => {
    if (!socialGraph) return;
    setConversations((prev) => applySocialFilters(prev));
    setActiveChat((prev: any) =>
      prev && isConversationBlocked(prev, socialGraph) ? null : prev
    );
  }, [socialGraphVersion, socialGraph, applySocialFilters]);

  useEffect(() => {
    if (!visible) return;
    fetchChats();

    const pollInterval = setInterval(() => {
      fetchChats(true);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [visible, isSeller, sellerMaisonId, currentUserId, fetchChats]);

  useEffect(() => {
    if (!visible || conversations.length === 0) return;

    let pusher: any = null;
    const activeChannels: any[] = [];

    try {
      const PusherClient = require("pusher-js").default;
      const pusherKey = process.env.EXPO_PUBLIC_PUSHER_KEY || "mock-key";
      pusher = new PusherClient(pusherKey, {
        cluster: "ap2",
        forceTLS: true,
      });

      conversations.forEach((convo: any) => {
        const channelName = `conversation-${convo.id}`;
        const channel = pusher.subscribe(channelName);
        activeChannels.push({ channel, name: channelName });

        channel.bind("NEW_MESSAGE", (msg: any) => {
          const mySenderId = isSeller ? sellerMaisonId : currentUserId;
          if (msg.senderId !== mySenderId) {
            triggerHaptic("light");

            setActiveChat((prev: any) => {
              if (!prev || prev.id !== msg.conversationId) return prev;
              const exists = prev.messages?.some((m: any) => m.id === msg.id);
              if (exists) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), msg],
                lastMessage: msg.content,
              };
            });

            setConversations((prevList) => {
              const updatedList = prevList.map((c) => {
                if (c.id === msg.conversationId) {
                  const exists = c.messages?.some((m: any) => m.id === msg.id);
                  const newMsgs = exists ? c.messages : [...(c.messages || []), msg];
                  return {
                    ...c,
                    messages: newMsgs,
                    lastMessage: msg.content,
                    unread: activeChat?.id !== msg.conversationId,
                    updatedAt: msg.createdAt || new Date().toISOString(),
                  };
                }
                return c;
              });
              return [...updatedList].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              );
            });
          }
        });

        channel.bind("TYPING", (eventData: any) => {
          setTypingUsers((prev) => {
            const updated = { ...prev };
            if (eventData.isTyping) {
              updated[eventData.conversationId] = eventData.username;
            } else {
              delete updated[eventData.conversationId];
            }
            return updated;
          });
        });
      });
    } catch (err) {
      console.warn("[ChatDrawer] Pusher initialization or subscription failed:", err);
    }

    return () => {
      if (pusher) {
        activeChannels.forEach((item) => {
          pusher.unsubscribe(item.name);
        });
        pusher.disconnect();
      }
    };
  }, [
    visible,
    conversations.map((c: any) => c.id).join(","),
    isSeller,
    activeMaisonId,
    currentUserId,
    activeChat?.id,
    sellerMaisonId,
    triggerHaptic,
  ]);

  return {
    activeChat,
    setActiveChat,
    loadingChats,
    conversations,
    setConversations,
    dmSearch,
    setDmSearch,
    activeDmFilter,
    setActiveDmFilter,
    typingUsers,
    setTypingUsers,
    conversationLabels,
    setConversationLabels,
    showNewChatModal,
    setShowNewChatModal,
    newChatMode,
    setNewChatMode,
    groupSelectedMembers,
    setGroupSelectedMembers,
    searchNewChat,
    setSearchNewChat,
    suggestedProfiles,
    loadingSuggested,
    fetchChats,
    handleShiftCategoryPrompt,
    handleSearchProfiles,
    handleInitiateNewChat,
    handleCreateGroupChat,
    longPressedThread,
    setLongPressedThread,
    pinnedThreadIds,
    mutedThreadIds,
    handleTogglePin,
    handleToggleMute,
    handleToggleUnread,
    handleDeleteThread,
  };
}
