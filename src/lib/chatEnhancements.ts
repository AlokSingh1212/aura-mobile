import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type ChatScope = "PRIVATE" | "GROUP";

export type GroupChatSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdById: string;
  lastMessage: string | null;
  members: { userId: string; role: string; joinedAt: string }[];
  createdAt: string;
  updatedAt: string;
};

export function resolveChatScope(conversationType?: string): ChatScope | null {
  if (conversationType === "GROUP") return "GROUP";
  if (conversationType === "PRIVATE") return "PRIVATE";
  return null;
}

export async function markMessagesRead(opts: {
  userId: string;
  conversationId: string;
  scope?: ChatScope;
  messageIds?: string[];
}): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/chat/messages/read`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: opts.userId,
      conversationId: opts.conversationId,
      scope: opts.scope ?? "PRIVATE",
      messageIds: opts.messageIds,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || "Could not mark messages read." };
  }
  return { success: true, updatedCount: data.updatedCount };
}

export async function reactToMessage(opts: {
  userId: string;
  messageId: string;
  emoji: string;
  scope?: ChatScope;
  remove?: boolean;
}): Promise<{ success: boolean; reactions?: Record<string, string[]>; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/chat/messages/react`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: opts.userId,
      messageId: opts.messageId,
      emoji: opts.emoji,
      scope: opts.scope ?? "PRIVATE",
      remove: opts.remove ?? false,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || "Could not react to message." };
  }
  return { success: true, reactions: data.reactions };
}

export async function createGroupChat(opts: {
  userId: string;
  name: string;
  memberUserIds: string[];
  avatarUrl?: string;
  initialMessage?: string;
}): Promise<{ success: boolean; group?: GroupChatSummary; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/chat/groups`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: opts.userId,
      name: opts.name,
      memberUserIds: opts.memberUserIds,
      avatarUrl: opts.avatarUrl,
      initialMessage: opts.initialMessage,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || "Could not create group chat." };
  }
  return { success: true, group: data.group as GroupChatSummary };
}
