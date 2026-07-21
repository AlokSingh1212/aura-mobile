import { useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useChatBusinessTools } from "@/hooks/useChatBusinessTools";
import { useChatMessaging } from "@/hooks/useChatMessaging";
import { useChatCalls } from "@/hooks/useChatCalls";
import { useChatDrawerUiState } from "@/hooks/useChatDrawerUiState";
import { useChatDrawerStoreContext } from "@/hooks/useChatDrawerStoreContext";
import { useChatThreadTransition } from "@/hooks/useChatThreadTransition";
import { useChatDrawerAvatars } from "@/hooks/useChatDrawerAvatars";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { buildChatDrawerBags, type ChatDrawerProps, type ChatDrawerView } from "@/hooks/chatDrawerBags";
import type { ManagedStore } from "@/lib/managedStores";

export type { ChatDrawerProps, ChatDrawerView } from "@/hooks/chatDrawerBags";

export function useChatDrawer(props: ChatDrawerProps): ChatDrawerView {
  const {
    visible,
    isSeller,
    setIsSeller,
    products = [],
    activeInstaStories = [],
    activeMaisonId,
    initialConversationId = null,
    onConversationStateChange,
  } = props;

  const { triggerHaptic, currentUser, activeProfile, fetchProducts, userProfiles, setActiveMaisonId } =
    useStore();
  const { graph: socialGraph, version: socialGraphVersion } = useSocialGraph();
  const currentUserId = currentUser?.id || "";

  const drawerUi = useChatDrawerUiState(triggerHaptic);

  const storeContext = useChatDrawerStoreContext({
    visible,
    isSeller,
    activeMaisonId,
    userProfiles,
    products,
    activeProfile,
    currentUser,
    setActiveMaisonId,
    triggerHaptic,
    setActiveBusinessTool: drawerUi.setActiveBusinessTool,
  });

  const chatInbox = useChatConversations({
    visible,
    currentUserId,
    currentUser,
    activeProfile,
    isSeller,
    sellerMaisonId: storeContext.sellerMaisonId,
    activeMaisonId,
    initialConversationId,
    socialGraph,
    socialGraphVersion,
    triggerHaptic,
  });

  const chatMessaging = useChatMessaging({
    activeChat: chatInbox.activeChat,
    setActiveChat: chatInbox.setActiveChat,
    setConversations: chatInbox.setConversations,
    currentUserId,
    currentUser,
    isSeller,
    sellerMaisonId: storeContext.sellerMaisonId,
    activeMaisonId,
    socialGraph,
    triggerHaptic,
  });

  const chatCalls = useChatCalls({
    visible,
    currentUserId,
    activeChat: chatInbox.activeChat,
    triggerHaptic,
  });

  const chatBusiness = useChatBusinessTools({
    visible,
    isSeller,
    currentUserId,
    sellerMaisonId: storeContext.sellerMaisonId,
    conversations: chatInbox.conversations,
    dmSearch: chatInbox.dmSearch,
    products,
    activeBusinessTool: drawerUi.activeBusinessTool,
    fetchProducts,
  });

  const { handleSelectBusinessStore: selectBusinessStore, ...storeRest } = storeContext;

  const handleSelectBusinessStore = useCallback(
    (store: ManagedStore) => {
      selectBusinessStore(store);
      chatBusiness.setBroadcastSent(false);
      chatBusiness.setBroadcastRecipientCount(null);
    },
    [
      selectBusinessStore,
      chatBusiness.setBroadcastSent,
      chatBusiness.setBroadcastRecipientCount,
    ]
  );

  const thread = useChatThreadTransition({
    activeChat: chatInbox.activeChat,
    setActiveChat: chatInbox.setActiveChat,
    currentUserId,
    triggerHaptic,
    onConversationStateChange,
  });

  const avatars = useChatDrawerAvatars({
    activeChat: chatInbox.activeChat,
    activeInstaStories,
    onOpenStoryGroup: props.onOpenStoryGroup,
    triggerHaptic,
    openCoinPopup: drawerUi.openCoinPopup,
  });

  const renderMessageContent = useCallback(
    (content: string, isMine: boolean) => (
      <ChatMessageContent
        content={content}
        isMine={isMine}
        currentUserId={currentUserId}
        activeProfile={activeProfile}
        triggerHaptic={triggerHaptic}
      />
    ),
    [currentUserId, activeProfile, triggerHaptic]
  );

  const onToggleSellerMode = useCallback(() => {
    triggerHaptic("light");
    const next = !isSeller;
    setIsSeller(next);
    drawerUi.setActiveBusinessTool(null);
    if (next) {
      chatBusiness.fetchBusinessStats();
      chatBusiness.fetchPromotions();
      chatBusiness.fetchAds();
      chatBusiness.fetchBroadcasts();
      chatBusiness.fetchAutoReply();
    }
  }, [isSeller, setIsSeller, triggerHaptic, drawerUi, chatBusiness]);

  return buildChatDrawerBags({
    props,
    currentUserId,
    currentUser,
    activeProfile,
    triggerHaptic,
    products,
    activeInstaStories,
    store: {
      ...storeRest,
      handleSelectBusinessStore,
    },
    inbox: chatInbox,
    messaging: chatMessaging,
    calls: chatCalls,
    business: chatBusiness,
    ui: drawerUi,
    thread,
    avatars,
    renderMessageContent,
    onToggleSellerMode,
  });
}
