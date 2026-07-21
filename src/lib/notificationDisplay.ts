export type ActivityNotification = {
  id: string;
  senderUsername: string;
  senderLogo: string | null;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  groupedCount?: number;
  groupedMessage?: string;
  groupedSenderUsernames?: string[];
  groupedNotificationIds?: string[];
  groupKey?: string;
  relatedPostId?: string | null;
  relatedDealId?: string | null;
  relatedPostThumbnail?: string | null;
};

export function notificationDisplayText(item: ActivityNotification): string {
  if (item.groupedMessage?.trim()) {
    return item.groupedMessage.trim();
  }
  if (item.senderUsername && item.senderUsername !== "system") {
    return `@${item.senderUsername} ${item.message}`.trim();
  }
  return item.message;
}

export function isGroupedEngagement(item: ActivityNotification): boolean {
  return (item.groupedCount ?? 1) > 1;
}

export function unreadNotificationCount(notifications: ActivityNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}
