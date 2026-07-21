import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";
import { ChatPersonalInbox } from "@/components/chat/ChatPersonalInbox";
import { ChatBusinessHub, type ChatBusinessHubProps } from "@/components/chat/ChatBusinessHub";
import { ChatThreadOptionsSheet } from "@/components/chat/ChatThreadOptionsSheet";

export type ChatDrawerInboxPanelProps = {
  bottomBarHeight: number;
  activeChat: any;
  onClose: () => void;
  inboxTitle: string;
  isSeller: boolean;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  setShowNewChatModal: (show: boolean) => void;
  dmSearch: string;
  setDmSearch: (text: string) => void;
  onToggleSellerMode: () => void;
  activeInstaStories: any[];
  activeProfile: any;
  currentUser: any;
  activeDmFilter: string;
  conversations: any[];
  loadingChats: boolean;
  conversationLabels: Record<string, string>;
  setActiveDmFilter: (filter: string) => void;
  onOpenStoryGroup?: (story: any) => void;
  setActiveChat: (chat: any) => void;
  onShiftCategory: (thread: any) => void;
  businessHub: ChatBusinessHubProps | null;
  longPressedThread: any;
  setLongPressedThread: (thread: any) => void;
  pinnedThreadIds: string[];
  mutedThreadIds: string[];
  onTogglePin: (thread: any) => void;
  onToggleMute: (thread: any) => void;
  onToggleUnread: (thread: any) => void;
  onDeleteThread: (thread: any) => void;
  onSelectAddLabel: (thread: any) => void;
  onMoveCategory: (thread: any) => void;
};

export function ChatDrawerInboxPanel({
  bottomBarHeight,
  activeChat,
  onClose,
  inboxTitle,
  isSeller,
  triggerHaptic,
  setShowNewChatModal,
  dmSearch,
  setDmSearch,
  onToggleSellerMode,
  activeInstaStories,
  activeProfile,
  currentUser,
  activeDmFilter,
  conversations,
  loadingChats,
  conversationLabels,
  setActiveDmFilter,
  onOpenStoryGroup,
  setActiveChat,
  onShiftCategory,
  businessHub,
  longPressedThread,
  setLongPressedThread,
  pinnedThreadIds,
  mutedThreadIds,
  onTogglePin,
  onToggleMute,
  onToggleUnread,
  onDeleteThread,
  onSelectAddLabel,
  onMoveCategory,
}: ChatDrawerInboxPanelProps) {
  return (
    <View style={[styles.dmSlidePanel, { bottom: activeChat ? 0 : bottomBarHeight }]}>
      <SafeAreaView style={styles.dmSafeArea}>
        <View style={styles.dmHeaderRow}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dmTitleRow} onPress={onToggleSellerMode}>
            <Text style={styles.dmTitleText}>{inboxTitle}</Text>
            <Lucide name="chevron-down" size={17} color="#fff" />
            <View style={styles.dmTitleRedDot} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic("medium");
              setShowNewChatModal(true);
            }}
          >
            <Lucide name="create-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

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

        {!isSeller && (
          <ChatPersonalInbox
            activeInstaStories={activeInstaStories}
            activeProfile={activeProfile}
            currentUser={currentUser}
            activeDmFilter={activeDmFilter}
            dmSearch={dmSearch}
            conversations={conversations}
            loadingChats={loadingChats}
            conversationLabels={conversationLabels}
            pinnedThreadIds={pinnedThreadIds}
            mutedThreadIds={mutedThreadIds}
            triggerHaptic={triggerHaptic}
            onFilterChange={setActiveDmFilter}
            onOpenStoryGroup={onOpenStoryGroup}
            onOpenThread={setActiveChat}
            onLongPressThread={(thread) => setLongPressedThread(thread)}
          />
        )}

        {isSeller && businessHub !== null && <ChatBusinessHub {...businessHub} />}
      </SafeAreaView>

      <ChatThreadOptionsSheet
        visible={longPressedThread !== null}
        thread={longPressedThread}
        onClose={() => setLongPressedThread(null)}
        triggerHaptic={triggerHaptic}
        onToggleUnread={onToggleUnread}
        onMoveCategory={onMoveCategory}
        onAddLabel={onSelectAddLabel}
        onTogglePin={onTogglePin}
        onToggleMute={onToggleMute}
        onDeleteThread={onDeleteThread}
        isPinned={longPressedThread ? pinnedThreadIds.includes(longPressedThread.id) : false}
        isMuted={longPressedThread ? mutedThreadIds.includes(longPressedThread.id) : false}
      />
    </View>
  );
}
