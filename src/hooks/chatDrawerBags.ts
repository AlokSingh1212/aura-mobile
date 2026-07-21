import type { ChatActiveConversationProps } from "@/components/chat/ChatActiveConversation";
import type { ChatDrawerInboxPanelProps } from "@/components/chat/ChatDrawerInboxPanel";
import type { ChatBusinessHubProps } from "@/components/chat/ChatBusinessHub";
import type { ChatDrawerCallOverlayProps } from "@/components/chat/ChatDrawerCallOverlay";
import type { ManagedStore } from "@/lib/managedStores";
import type { ChatCallState } from "@/hooks/useChatCalls";

export type ChatDrawerProps = {
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
};

export type ChatDrawerNewChatModalProps = {
  visible: boolean;
  mode: "direct" | "group";
  searchNewChat: string;
  loadingSuggested: boolean;
  suggestedProfiles: any[];
  groupSelectedMembers: { userId: string; name: string; username: string }[];
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  onClose: () => void;
  onModeChange: (mode: "direct" | "group") => void;
  onSearchChange: (text: string) => void;
  onSelectProfile: (profile: any) => void;
  onCreateGroup: () => void;
};

export type ChatDrawerView = {
  visible: boolean;
  inbox: ChatDrawerInboxPanelProps;
  conversation: ChatActiveConversationProps | null;
  newChatModal: ChatDrawerNewChatModalProps;
  callOverlay: ChatDrawerCallOverlayProps | null;
};

type BuildChatDrawerBagsInput = {
  props: ChatDrawerProps;
  currentUserId: string;
  currentUser: any;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  products: any[];
  activeInstaStories: any[];
  store: {
    inboxTitle: string;
    managedStores: ManagedStore[];
    showStorePicker: boolean;
    setShowStorePicker: React.Dispatch<React.SetStateAction<boolean>>;
    sellerMaisonId: string;
    activeBusinessStore: ManagedStore | null;
    handleSelectBusinessStore: (store: ManagedStore) => void;
    broadcastFollowerReach: number;
  };
  inbox: {
    activeChat: any;
    setActiveChat: (chat: any) => void;
    loadingChats: boolean;
    conversations: any[];
    dmSearch: string;
    setDmSearch: (text: string) => void;
    activeDmFilter: string;
    setActiveDmFilter: (filter: string) => void;
    typingUsers: Record<string, string>;
    conversationLabels: Record<string, string>;
    setConversationLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    showNewChatModal: boolean;
    setShowNewChatModal: (show: boolean) => void;
    newChatMode: "direct" | "group";
    setNewChatMode: (mode: "direct" | "group") => void;
    groupSelectedMembers: { userId: string; name: string; username: string }[];
    setGroupSelectedMembers: React.Dispatch<
      React.SetStateAction<{ userId: string; name: string; username: string }[]>
    >;
    searchNewChat: string;
    setSearchNewChat: (text: string) => void;
    suggestedProfiles: any[];
    loadingSuggested: boolean;
    handleShiftCategoryPrompt: (thread: any) => void;
    handleSearchProfiles: (text: string) => void;
    handleInitiateNewChat: (profile: any) => void;
    handleCreateGroupChat: () => void;
    longPressedThread: any;
    setLongPressedThread: (thread: any) => void;
    pinnedThreadIds: string[];
    mutedThreadIds: string[];
    handleTogglePin: (thread: any) => void;
    handleToggleMute: (thread: any) => void;
    handleToggleUnread: (thread: any) => void;
    handleDeleteThread: (thread: any) => void;
  };
  messaging: {
    chatReplyText: string;
    showAttachMenu: boolean;
    setShowAttachMenu: (show: boolean) => void;
    sharingProductsList: boolean;
    setSharingProductsList: (v: boolean) => void;
    longPressedMessage: any;
    setLongPressedMessage: (msg: any) => void;
    messageReactions: Record<string, string[]>;
    replyTo: any;
    setReplyTo: (msg: any) => void;
    isRecording: boolean;
    handleStartRecording: () => void;
    handleStopRecording: () => void;
    handleShareImage: () => void;
    handleCaptureCameraImage: () => void;
    handleShareProduct: (product: any) => void;
    handleShareGif: (url: string) => void;
    toggleVanishMode: (enabled: boolean) => void;
    showGifPicker: boolean;
    setShowGifPicker: (show: boolean) => void;
    handleReactToMessage: (msgId: string, emoji: string) => void;
    handleMessageAction: (action: "REPLY" | "SAVE" | "STICKER" | "DELETE" | "UNSEND" | "MORE") => void;
    handleTextChange: (text: string) => void;
    handleSendChatMessage: () => void;
    REACTION_EMOJIS: string[];
  };
  calls: {
    activeCall: any;
    callState: ChatCallState;
    callerInfo: any;
    callRemoteUid: number | null;
    startCall: (type: "AUDIO" | "VIDEO") => void;
    acceptCall: () => void;
    declineCall: () => void;
    endCall: () => void;
  };
  business: Record<string, any>;
  ui: {
    activeBusinessTool: string | null;
    setActiveBusinessTool: (tool: string | null) => void;
    showLabelSheet: boolean;
    setShowLabelSheet: (show: boolean) => void;
    selectedLabelTemp: string | null;
    setSelectedLabelTemp: (id: string | null) => void;
    showCoinPopup: boolean;
    setShowCoinPopup: (show: boolean) => void;
    coinUser: any;
    handleCoinFlipPress: () => void;
    frontInterpolate: any;
    backInterpolate: any;
  };
  thread: {
    chatTranslateX: any;
    chatScrollEnabled: boolean;
    scrollViewRef: React.RefObject<any>;
    panHandlers: object;
    closeActiveChat: (callback?: () => void) => void;
  };
  avatars: {
    renderAvatarWithStory: ChatActiveConversationProps["renderAvatarWithStory"];
    handleViewTargetProfile: ChatActiveConversationProps["handleViewTargetProfile"];
  };
  renderMessageContent: ChatActiveConversationProps["renderMessageContent"];
  onToggleSellerMode: () => void;
};

export function buildChatDrawerBags(input: BuildChatDrawerBagsInput): ChatDrawerView {
  const {
    props,
    currentUserId,
    currentUser,
    activeProfile,
    triggerHaptic,
    products,
    activeInstaStories,
    store,
    inbox,
    messaging,
    calls,
    business,
    ui,
    thread,
    avatars,
    renderMessageContent,
    onToggleSellerMode,
  } = input;

  const businessHub: ChatBusinessHubProps | null = props.isSeller
    ? {
        managedStores: store.managedStores,
        showStorePicker: store.showStorePicker,
        setShowStorePicker: store.setShowStorePicker,
        activeBusinessStore: store.activeBusinessStore,
        sellerMaisonId: store.sellerMaisonId,
        statsLoading: business.statsLoading,
        liveBusinessStats: business.liveBusinessStats,
        statsError: business.statsError,
        activeBusinessTool: ui.activeBusinessTool,
        setActiveBusinessTool: ui.setActiveBusinessTool,
        setBroadcastSent: business.setBroadcastSent,
        customerEnquiries: business.customerEnquiries,
        storeCustomerMessagesEnabled: business.storeCustomerMessagesEnabled,
        triggerHaptic,
        setActiveChat: inbox.setActiveChat,
        activeInstaStories,
        onOpenStoryGroup: props.onOpenStoryGroup,
        broadcastFollowerReach: store.broadcastFollowerReach,
        broadcastText: business.broadcastText,
        setBroadcastText: business.setBroadcastText,
        broadcastSent: business.broadcastSent,
        broadcastRecipientCount: business.broadcastRecipientCount,
        sendBroadcast: business.sendBroadcast,
        fetchBroadcasts: business.fetchBroadcasts,
        loadingPromos: business.loadingPromos,
        livePromos: business.livePromos,
        showNewPromoForm: business.showNewPromoForm,
        setShowNewPromoForm: business.setShowNewPromoForm,
        newPromoCode: business.newPromoCode,
        setNewPromoCode: business.setNewPromoCode,
        newPromoDiscount: business.newPromoDiscount,
        setNewPromoDiscount: business.setNewPromoDiscount,
        createPromo: business.createPromo,
        liveAds: business.liveAds,
        onClose: props.onClose,
        maisonProducts: business.maisonProducts,
        loadingAutoReply: business.loadingAutoReply,
        autoReplyEnabled: business.autoReplyEnabled,
        setAutoReplyEnabled: business.setAutoReplyEnabled,
        autoReplySaved: business.autoReplySaved,
        setAutoReplySaved: business.setAutoReplySaved,
        greetingMessage: business.greetingMessage,
        setGreetingMessage: business.setGreetingMessage,
        awayMessage: business.awayMessage,
        setAwayMessage: business.setAwayMessage,
        quietHoursStart: business.quietHoursStart,
        setQuietHoursStart: business.setQuietHoursStart,
        quietHoursEnd: business.quietHoursEnd,
        setQuietHoursEnd: business.setQuietHoursEnd,
        saveAutoReply: business.saveAutoReply,
        brandPartnershipsEnabled: business.brandPartnershipsEnabled,
        partnershipTab: business.partnershipTab,
        setPartnershipTab: business.setPartnershipTab,
        loadingPartnerships: business.loadingPartnerships,
        partnershipDeals: business.partnershipDeals,
        partnershipCreators: business.partnershipCreators,
        selectedCreatorProfileId: business.selectedCreatorProfileId,
        setSelectedCreatorProfileId: business.setSelectedCreatorProfileId,
        partnershipTitle: business.partnershipTitle,
        setPartnershipTitle: business.setPartnershipTitle,
        partnershipBudget: business.partnershipBudget,
        setPartnershipBudget: business.setPartnershipBudget,
        partnershipType: business.partnershipType,
        setPartnershipType: business.setPartnershipType,
        partnershipTerms: business.partnershipTerms,
        setPartnershipTerms: business.setPartnershipTerms,
        submittingPartnership: business.submittingPartnership,
        setSubmittingPartnership: business.setSubmittingPartnership,
        currentUserId,
        activeProfile,
        loadPartnershipData: business.loadPartnershipData,
        handleSelectBusinessStore: store.handleSelectBusinessStore,
      }
    : null;

  const inboxPanel: ChatDrawerInboxPanelProps = {
    bottomBarHeight: props.bottomBarHeight,
    activeChat: inbox.activeChat,
    onClose: props.onClose,
    inboxTitle: store.inboxTitle,
    isSeller: props.isSeller,
    triggerHaptic,
    setShowNewChatModal: inbox.setShowNewChatModal,
    dmSearch: inbox.dmSearch,
    setDmSearch: inbox.setDmSearch,
    onToggleSellerMode,
    activeInstaStories,
    activeProfile,
    currentUser,
    activeDmFilter: inbox.activeDmFilter,
    conversations: inbox.conversations,
    loadingChats: inbox.loadingChats,
    conversationLabels: inbox.conversationLabels,
    setActiveDmFilter: inbox.setActiveDmFilter,
    onOpenStoryGroup: props.onOpenStoryGroup,
    setActiveChat: inbox.setActiveChat,
    onShiftCategory: inbox.handleShiftCategoryPrompt,
    businessHub,
    longPressedThread: inbox.longPressedThread,
    setLongPressedThread: inbox.setLongPressedThread,
    pinnedThreadIds: inbox.pinnedThreadIds,
    mutedThreadIds: inbox.mutedThreadIds,
    onTogglePin: inbox.handleTogglePin,
    onToggleMute: inbox.handleToggleMute,
    onToggleUnread: inbox.handleToggleUnread,
    onDeleteThread: inbox.handleDeleteThread,
    onMoveCategory: inbox.handleShiftCategoryPrompt,
    onSelectAddLabel: (thread: any) => {
      inbox.setActiveChat(thread);
      ui.setSelectedLabelTemp(inbox.conversationLabels[thread.id] || null);
      ui.setShowLabelSheet(true);
    },
  };

  const conversation: ChatActiveConversationProps | null =
    inbox.activeChat !== null
      ? {
          activeChat: inbox.activeChat,
          chatTranslateX: thread.chatTranslateX,
          panHandlers: thread.panHandlers,
          closeActiveChat: thread.closeActiveChat,
          renderAvatarWithStory: avatars.renderAvatarWithStory,
          handleViewTargetProfile: avatars.handleViewTargetProfile,
          conversationLabels: inbox.conversationLabels,
          setConversationLabels: inbox.setConversationLabels,
          startCall: calls.startCall,
          triggerHaptic,
          setSelectedLabelTemp: ui.setSelectedLabelTemp,
          setShowLabelSheet: ui.setShowLabelSheet,
          scrollViewRef: thread.scrollViewRef,
          chatScrollEnabled: thread.chatScrollEnabled,
          chatReplyText: messaging.chatReplyText,
          handleTextChange: messaging.handleTextChange,
          handleSendChatMessage: messaging.handleSendChatMessage,
          isSeller: props.isSeller,
          sellerMaisonId: store.sellerMaisonId,
          currentUserId,
          setLongPressedMessage: messaging.setLongPressedMessage,
          renderMessageContent,
          replyTo: messaging.replyTo,
          setReplyTo: messaging.setReplyTo,
          isRecording: messaging.isRecording,
          handleStopRecording: messaging.handleStopRecording,
          handleStartRecording: messaging.handleStartRecording,
          showAttachMenu: messaging.showAttachMenu,
          setShowAttachMenu: messaging.setShowAttachMenu,
          sharingProductsList: messaging.sharingProductsList,
          setSharingProductsList: messaging.setSharingProductsList,
          products,
          handleShareProduct: messaging.handleShareProduct,
          handleCaptureCameraImage: messaging.handleCaptureCameraImage,
          handleShareImage: messaging.handleShareImage,
          showGifPicker: messaging.showGifPicker,
          setShowGifPicker: messaging.setShowGifPicker,
          handleShareGif: messaging.handleShareGif,
          toggleVanishMode: messaging.toggleVanishMode,
          callState: calls.callState,
          activeCall: calls.activeCall,
          callerInfo: calls.callerInfo,
          endCall: calls.endCall,
          acceptCall: calls.acceptCall,
          declineCall: calls.declineCall,
          longPressedMessage: messaging.longPressedMessage,
          REACTION_EMOJIS: messaging.REACTION_EMOJIS,
          handleReactToMessage: messaging.handleReactToMessage,
          handleMessageAction: messaging.handleMessageAction,
          showLabelSheet: ui.showLabelSheet,
          selectedLabelTemp: ui.selectedLabelTemp,
          showCoinPopup: ui.showCoinPopup,
          setShowCoinPopup: ui.setShowCoinPopup,
          coinUser: ui.coinUser,
          handleCoinFlipPress: ui.handleCoinFlipPress,
          frontInterpolate: ui.frontInterpolate,
          backInterpolate: ui.backInterpolate,
          messageReactions: messaging.messageReactions,
          typingUsers: inbox.typingUsers,
          callRemoteUid: calls.callRemoteUid,
        }
      : null;

  const newChatModal: ChatDrawerNewChatModalProps = {
    visible: inbox.showNewChatModal,
    mode: inbox.newChatMode,
    searchNewChat: inbox.searchNewChat,
    loadingSuggested: inbox.loadingSuggested,
    suggestedProfiles: inbox.suggestedProfiles,
    groupSelectedMembers: inbox.groupSelectedMembers,
    triggerHaptic,
    onClose: () => {
      inbox.setShowNewChatModal(false);
      inbox.setSearchNewChat("");
      inbox.setNewChatMode("direct");
      inbox.setGroupSelectedMembers([]);
    },
    onModeChange: (mode) => {
      inbox.setNewChatMode(mode);
      if (mode === "direct") inbox.setGroupSelectedMembers([]);
    },
    onSearchChange: inbox.handleSearchProfiles,
    onSelectProfile: inbox.handleInitiateNewChat,
    onCreateGroup: inbox.handleCreateGroupChat,
  };

  const callOverlay: ChatDrawerCallOverlayProps | null =
    calls.callState !== "none" && calls.activeCall && !inbox.activeChat
      ? {
          callState: calls.callState,
          activeCall: calls.activeCall,
          callerInfo: calls.callerInfo,
          endCall: calls.endCall,
          acceptCall: calls.acceptCall,
          declineCall: calls.declineCall,
        }
      : null;

  return {
    visible: props.visible,
    inbox: inboxPanel,
    conversation,
    newChatModal,
    callOverlay,
  };
}
