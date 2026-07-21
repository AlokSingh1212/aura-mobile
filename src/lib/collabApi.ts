import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import type { CollabPartner } from "@/lib/postComposerTypes";

export type CollabAction = "accept" | "decline";

export async function respondToCollabInviteApi(opts: {
  postId: string;
  userId: string;
  profileId: string;
  action: CollabAction;
}): Promise<{ success: boolean; collabs?: CollabPartner[]; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/posts/collab/respond`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || "Could not update collab invite." };
  }
  return { success: true, collabs: data.collabs };
}

export function confirmCollabAction(action: CollabAction): Promise<boolean> {
  return new Promise((resolve) => {
    const { Alert } = require("react-native");
    const title = action === "accept" ? "Accept collab?" : "Decline collab?";
    const message =
      action === "accept"
        ? "This post will appear on your profile and both audiences will be credited as co-authors."
        : "You will not be listed as a co-author on this post.";
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      {
        text: action === "accept" ? "Accept" : "Decline",
        style: action === "accept" ? "default" : "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

export async function respondToCollabWithConfirmation(opts: {
  postId: string;
  userId: string;
  profileId: string;
  action: CollabAction;
}): Promise<{ success: boolean; error?: string }> {
  const confirmed = await confirmCollabAction(opts.action);
  if (!confirmed) return { success: false, error: "cancelled" };
  const result = await respondToCollabInviteApi(opts);
  if (!result.success) {
    const { Alert } = require("react-native");
    Alert.alert("Collab", result.error || "Something went wrong.");
  }
  return result;
}
