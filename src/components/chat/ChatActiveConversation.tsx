import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";
import { CHAT_CONVERSATION_LABELS } from "@/components/chat/ChatPersonalInbox";
import { shouldShowReadReceipts as showReadReceiptsPref, shouldShowOnlineStatus } from "@/lib/settingsRuntime";
import { ChatAttachMenuSheet } from "@/components/chat/ChatAttachMenuSheet";
import { ChatInThreadCallOverlay } from "@/components/chat/ChatInThreadCallOverlay";
import { ChatMessageActionsOverlay } from "@/components/chat/ChatMessageActionsOverlay";
import { ChatLabelSheet } from "@/components/chat/ChatLabelSheet";
import { ChatCoinFlipPopup } from "@/components/chat/ChatCoinFlipPopup";
import { StoryGifPicker } from "@/components/stories/editor/StoryGifPicker";

export type ChatActiveConversationProps = {
  activeChat: any;
  chatTranslateX: Animated.Value;
  panHandlers: object;
  closeActiveChat: (callback?: () => void) => void;
  renderAvatarWithStory: (uri: string, chatName: string, chatUsername?: string, size?: number) => React.ReactNode;
  handleViewTargetProfile: (chatName: string, chatUsername?: string, chatAvatar?: string) => void;
  conversationLabels: Record<string, string>;
  setConversationLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  startCall: (type: "AUDIO" | "VIDEO") => void;
  triggerHaptic: (style: any) => void;
  setSelectedLabelTemp: (id: string | null) => void;
  setShowLabelSheet: (show: boolean) => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  chatScrollEnabled: boolean;
  chatReplyText: string;
  handleTextChange: (text: string) => void;
  handleSendChatMessage: () => void;
  isSeller: boolean;
  sellerMaisonId: string;
  currentUserId?: string;
  setLongPressedMessage: (msg: any) => void;
  renderMessageContent: (content: string, isMine: boolean) => React.ReactNode;
  replyTo: any;
  setReplyTo: (msg: any) => void;
  isRecording: boolean;
  handleStopRecording: () => void;
  handleStartRecording: () => void;
  showAttachMenu: boolean;
  setShowAttachMenu: (show: boolean) => void;
  sharingProductsList: boolean;
  setSharingProductsList: (v: boolean) => void;
  products: any[];
  handleShareProduct: (product: any) => void;
  handleCaptureCameraImage: () => void;
  handleShareImage: () => void;
  showGifPicker: boolean;
  setShowGifPicker: (show: boolean) => void;
  handleShareGif: (url: string) => void;
  toggleVanishMode: (enabled: boolean) => void;
  callState: string;
  activeCall: any;
  callerInfo: any;
  endCall: () => void;
  acceptCall: () => void;
  declineCall: () => void;
  longPressedMessage: any;
  REACTION_EMOJIS: string[];
  handleReactToMessage: (msgId: string, emoji: string) => void;
  handleMessageAction: (action: "REPLY" | "SAVE" | "STICKER" | "DELETE" | "UNSEND" | "MORE") => void;
  showLabelSheet: boolean;
  selectedLabelTemp: string | null;
  showCoinPopup: boolean;
  setShowCoinPopup: (show: boolean) => void;
  coinUser: any;
  handleCoinFlipPress: () => void;
  frontInterpolate: Animated.AnimatedInterpolation<string>;
  backInterpolate: Animated.AnimatedInterpolation<string>;
  messageReactions: Record<string, string[]>;
  typingUsers: Record<string, string>;
  callRemoteUid: number | null;
};

export function ChatActiveConversation(props: ChatActiveConversationProps) {
  const LABELS = CHAT_CONVERSATION_LABELS;
  const {
    activeChat,
    chatTranslateX,
    panHandlers,
    closeActiveChat,
    renderAvatarWithStory,
    handleViewTargetProfile,
    conversationLabels,
    setConversationLabels,
    startCall,
    triggerHaptic,
    setSelectedLabelTemp,
    setShowLabelSheet,
    scrollViewRef,
    chatScrollEnabled,
    chatReplyText,
    handleTextChange,
    handleSendChatMessage,
    isSeller,
    sellerMaisonId,
    currentUserId,
    setLongPressedMessage,
    renderMessageContent,
    replyTo,
    setReplyTo,
    isRecording,
    handleStopRecording,
    handleStartRecording,
    showAttachMenu,
    setShowAttachMenu,
    sharingProductsList,
    setSharingProductsList,
    products,
    handleShareProduct,
    handleCaptureCameraImage,
    handleShareImage,
    showGifPicker,
    setShowGifPicker,
    handleShareGif,
    toggleVanishMode,
    callState,
    activeCall,
    callerInfo,
    endCall,
    acceptCall,
    declineCall,
    longPressedMessage,
    REACTION_EMOJIS,
    handleReactToMessage,
    handleMessageAction,
    showLabelSheet,
    selectedLabelTemp,
    showCoinPopup,
    setShowCoinPopup,
    coinUser,
    handleCoinFlipPress,
    frontInterpolate,
    backInterpolate,
    messageReactions,
    typingUsers,
    callRemoteUid,
  } = props;

  return (
        <Animated.View 
          style={[styles.dmSlidePanel, { top: 0, bottom: 0, left: 0, right: 0, zIndex: 3000, transform: [{ translateX: chatTranslateX }] }]}
          {...panHandlers}
        >
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <SafeAreaView style={styles.dmSafeArea}>
            {/* Chat header */}
            <View style={styles.dmHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <TouchableOpacity onPress={() => closeActiveChat()}>
                  <Lucide name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                {renderAvatarWithStory(
                  activeChat?.avatar || "",
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
                      {activeChat?.id && conversationLabels[activeChat.id] && (() => {
                        const labelId = conversationLabels[activeChat.id];
                        const labelObj = LABELS.find(l => l.id === labelId);
                        if (!labelObj) return null;
                        return (
                          <View style={{
                            backgroundColor: labelObj.color + "33",
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 4,
                            marginLeft: 6
                          }}>
                            <Text style={{
                              color: labelObj.color,
                              fontSize: 10,
                              fontWeight: "bold"
                            }}>
                              {labelObj.name.toUpperCase()}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    <Text style={styles.headerUsernameText}>
                      @{activeChat?.username || activeChat?.name?.toLowerCase()?.replace(/\s+/g, "_")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => toggleVanishMode(!activeChat?.vanishMode)}
                >
                  <Lucide
                    name={activeChat?.vanishMode ? "eye-off" : "eye-off-outline"}
                    size={22}
                    color={activeChat?.vanishMode ? "#00f5ff" : "#fff"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => startCall("AUDIO")}>
                  <Lucide name="call-outline" size={23} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => startCall("VIDEO")}>
                  <Lucide name="videocam-outline" size={25} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { 
                  triggerHaptic("medium"); 
                  setSelectedLabelTemp(activeChat?.id ? (conversationLabels[activeChat.id] || null) : null); 
                  setShowLabelSheet(true); 
                }}>
                  <Lucide name="pricetag-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages feed list with auto-scroll integration */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.chatFeedScroll}
              scrollEnabled={chatScrollEnabled}
              contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Profile Social Context Information Block at top of chat scroll */}
              <View style={styles.socialContextContainer}>
                {renderAvatarWithStory(
                  activeChat?.avatar || "",
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
                const isMine = msg.senderId === (isSeller ? sellerMaisonId : currentUserId);
                
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
                    {isMine && (activeChat?.messages?.filter((m: any) => m.senderId === (isSeller ? sellerMaisonId : currentUserId)).slice(-1)[0]?.id === msg.id) && (
                      <Text style={styles.msgStatusText}>
                        {msg.status === "sending"
                          ? "Sending"
                          : msg.status === "error"
                            ? "Failed"
                            : showReadReceiptsPref()
                              ? msg.status === "read"
                                ? "Seen"
                                : msg.status === "delivered"
                                  ? "Delivered"
                                  : "Sent"
                              : "Sent"}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {activeChat && activeChat.id && typingUsers[activeChat.id] && shouldShowOnlineStatus() && (
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
            {replyTo && (
              <View style={styles.replyPreviewHeader}>
                <Text style={styles.replyPreviewTitle} numberOfLines={1}>
                  Replying to {replyTo.senderId === currentUserId ? "yourself" : activeChat?.name}: {
                    replyTo.content.startsWith("[REPLY:") 
                      ? replyTo.content.replace(/^\[REPLY:[^\]]+\]\s*/, "") 
                      : replyTo.content
                  }
                </Text>
                <TouchableOpacity onPress={() => { triggerHaptic("light"); setReplyTo(null); }}>
                  <Lucide name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
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
                {isRecording ? (
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                    <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "bold" }}>Recording Audio Note...</Text>
                  </View>
                ) : (
                  <TextInput
                    style={styles.capsuleInput}
                    placeholder="Message..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={chatReplyText}
                    onChangeText={handleTextChange}
                    onSubmitEditing={handleSendChatMessage}
                  />
                )}
                
                {chatReplyText.trim().length > 0 ? (
                  <TouchableOpacity onPress={handleSendChatMessage}>
                    <Text style={styles.chatSendText}>Send</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <TouchableOpacity onPress={isRecording ? handleStopRecording : handleStartRecording}>
                      <Lucide name={isRecording ? "stop-circle" : "mic-outline"} size={20} color={isRecording ? "#ef4444" : "#fff"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShareImage}>
                      <Lucide name="image-outline" size={20} color="#fff" />
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

          <ChatAttachMenuSheet
            visible={showAttachMenu}
            sharingProductsList={sharingProductsList}
            products={products}
            triggerHaptic={triggerHaptic}
            onClose={() => setShowAttachMenu(false)}
            onShowProducts={() => setSharingProductsList(true)}
            onHideProducts={() => setSharingProductsList(false)}
            onCaptureCamera={handleCaptureCameraImage}
            onShareImage={handleShareImage}
            onStartRecording={handleStartRecording}
            onShareProduct={handleShareProduct}
            onShowGifPicker={() => setShowGifPicker(true)}
          />

          <StoryGifPicker
            visible={showGifPicker}
            userId={currentUserId || ""}
            onClose={() => setShowGifPicker(false)}
            onPick={(gif) => handleShareGif(gif.url)}
          />

          <ChatInThreadCallOverlay
            callState={callState}
            activeCall={activeCall}
            activeChat={activeChat}
            callerInfo={callerInfo}
            callRemoteUid={callRemoteUid}
            endCall={endCall}
            acceptCall={acceptCall}
            declineCall={declineCall}
          />

          <ChatMessageActionsOverlay
            message={longPressedMessage}
            reactionEmojis={REACTION_EMOJIS}
            onDismiss={() => setLongPressedMessage(null)}
            onReact={handleReactToMessage}
            onAction={handleMessageAction}
          />

          <ChatLabelSheet
            visible={showLabelSheet}
            activeChat={activeChat}
            selectedLabelTemp={selectedLabelTemp}
            triggerHaptic={triggerHaptic}
            onClose={() => setShowLabelSheet(false)}
            onSelectLabel={setSelectedLabelTemp}
            onClearSelection={() => setSelectedLabelTemp(null)}
            setConversationLabels={setConversationLabels}
          />

          <ChatCoinFlipPopup
            visible={showCoinPopup}
            coinUser={coinUser}
            frontInterpolate={frontInterpolate}
            backInterpolate={backInterpolate}
            triggerHaptic={triggerHaptic}
            onClose={() => setShowCoinPopup(false)}
            onFlip={handleCoinFlipPress}
            onViewProfile={handleViewTargetProfile}
          />
        </Animated.View>
  );
}
