import React from "react";
import { Alert } from "react-native";
import {
  IgSettingsScreen,
  IgRow,
  IgSectionTitle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { router } from "expo-router";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { deactivateAccount } from "@/lib/authApi";

export default function DeleteAccountScreen() {
  const { currentUser, triggerHaptic, authLogOut } = useStore() as any;

  const confirmDelete = () => {
    Alert.prompt
      ? Alert.prompt(
          "Confirm deletion",
          `Type your email (${currentUser?.email || "your email"}) to permanently delete your account.`,
          async (text) => {
            if (!text?.trim()) return;
            await performDelete(text.trim());
          }
        )
      : Alert.alert("Delete account?", "This cannot be undone.", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => performDelete(currentUser?.email || ""),
          },
        ]);
  };

  const performDelete = async (confirmEmail: string) => {
    if (!currentUser?.id) {
      Alert.alert("Sign in required");
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/api/mobile/auth/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: currentUser.id, confirmEmail }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        authLogOut?.();
        router.replace("/login" as any);
      } else {
        Alert.alert("Failed", data.error || "Could not delete account.");
      }
    } catch {
      Alert.alert("Error", "Network error.");
    }
  };

  const confirmDeactivate = () => {
    Alert.alert(
      "Temporarily deactivate?",
      "Your profile, posts and shop will be hidden until you sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: performDeactivate,
        },
      ]
    );
  };

  const performDeactivate = async () => {
    if (!currentUser?.id) {
      Alert.alert("Sign in required");
      return;
    }
    try {
      const data = await deactivateAccount(currentUser.id);
      if (data.success) {
        triggerHaptic("success");
        authLogOut?.();
        router.replace("/login" as any);
      } else {
        Alert.alert("Failed", data.error || "Could not deactivate account.");
      }
    } catch {
      Alert.alert("Error", "Network error.");
    }
  };

  return (
    <IgSettingsScreen title="Delete account">
      <IgBodyText>
        Deleting removes your profile, posts, shop history and messages from AURA. Some data may be
        kept where required by law.
      </IgBodyText>
      <IgSectionTitle>Account</IgSectionTitle>
      <IgRow
        label="Temporarily deactivate"
        sublabel="Hide your profile until you log back in"
        onPress={confirmDeactivate}
      />
      <IgRow label="Delete account permanently" danger onPress={confirmDelete} last />
    </IgSettingsScreen>
  );
}
