import React from "react";
import { ChatDrawerInboxPanel } from "@/components/chat/ChatDrawerInboxPanel";
import { ChatActiveConversation } from "@/components/chat/ChatActiveConversation";
import { ChatNewMessageModal } from "@/components/chat/ChatNewMessageModal";
import { ChatDrawerCallOverlay } from "@/components/chat/ChatDrawerCallOverlay";
import { useChatDrawer, type ChatDrawerProps } from "@/hooks/useChatDrawer";

export type { ChatDrawerProps } from "@/hooks/useChatDrawer";

export const ChatDrawer: React.FC<ChatDrawerProps> = (props) => {
  const { inbox, conversation, newChatModal, callOverlay } = useChatDrawer(props);

  if (!props.visible) return null;

  return (
    <>
      <ChatDrawerInboxPanel {...inbox} />
      {conversation !== null && <ChatActiveConversation {...conversation} />}
      <ChatNewMessageModal {...newChatModal} />
      {callOverlay !== null && <ChatDrawerCallOverlay {...callOverlay} />}
    </>
  );
};
