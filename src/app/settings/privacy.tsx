import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";

export default function PrivacySettingsScreen() {
  const { data, patch } = useSettingsSection("privacy");
  const { currentUser, activeProfile, triggerHaptic } = useStore();
  if (!data) return null;

  const syncPrivateAccount = async (isPrivate: boolean) => {
    if (!currentUser?.id) return;
    try {
      await fetch(`${API_HOST}/api/mobile/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          profileId: activeProfile?.id,
          isPrivate,
        }),
      });
    } catch {
      Alert.alert("Sync issue", "Privacy saved on device. Server sync will retry when online.");
    }
  };

  return (
    <IgSettingsScreen title="Account privacy">
      <IgBodyText>
        Control who sees your content, activity and shop interactions on AURA.
      </IgBodyText>

      <IgSectionTitle>Account</IgSectionTitle>
      <IgToggle
        label="Private account"
        hint="Only approved followers see your posts and stories"
        value={data.privateAccount}
        onValueChange={async (v) => {
          triggerHaptic("light");
          await patch({ privateAccount: v });
          await syncPrivateAccount(v);
        }}
      />
      <IgToggle
        label="Show activity status"
        value={data.showActivityStatus}
        onValueChange={(v) => patch({ showActivityStatus: v })}
      />
      <IgToggle
        label="Show followers and following lists"
        value={data.showFollowersList}
        onValueChange={(v) => patch({ showFollowersList: v })}
        last
      />

      <IgSectionTitle>Discoverability</IgSectionTitle>
      <IgToggle
        label="Suggest account to others"
        hint="Appear in suggestions and Explore"
        value={data.suggestAccountToOthers}
        onValueChange={(v) => patch({ suggestAccountToOthers: v })}
        last
      />

      <IgSectionTitle>Interactions</IgSectionTitle>
      <IgRow label="Tags and mentions" onPress={() => router.push("/settings/tags" as any)} />
      <IgRow label="Blocked accounts" onPress={() => router.push("/settings/blocked" as any)} />
      <IgRow label="Muted accounts" onPress={() => router.push("/settings/muted" as any)} last />

      <IgSectionTitle>Stories & shop</IgSectionTitle>
      <IgToggle
        label="Allow sharing of your stories"
        value={data.allowStorySharing}
        onValueChange={(v) => patch({ allowStorySharing: v })}
      />
      <IgToggle
        label="Show shop activity on profile"
        hint="Display recent purchases and wishlist highlights"
        value={data.showShopActivity}
        onValueChange={(v) => patch({ showShopActivity: v })}
        last
      />

      <IgSectionTitle>Ads</IgSectionTitle>
      <IgToggle
        label="Personalized ads"
        value={data.personalizedAds}
        onValueChange={(v) => patch({ personalizedAds: v })}
      />
      <IgToggle
        label="Allow tagging in posts"
        value={data.allowTagging}
        onValueChange={(v) => patch({ allowTagging: v })}
        last
      />
    </IgSettingsScreen>
  );
}
