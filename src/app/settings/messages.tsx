import React from "react";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgCheckRow,
  IgBodyText,
  IgRow,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { router } from "expo-router";

export default function MessagesSettingsScreen() {
  const { data, patch } = useSettingsSection("messages");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Messages and story replies">
      <IgBodyText>
        Choose who can message you and reply to your stories on AURA.
      </IgBodyText>

      <IgSectionTitle>Messages</IgSectionTitle>
      <IgCheckRow
        label="Your followers"
        hint="People you follow back can message you"
        selected={data.dmFrom === "everyone"}
        onPress={() => patch({ dmFrom: "everyone" })}
      />
      <IgCheckRow
        label="People you follow"
        selected={data.dmFrom === "following"}
        onPress={() => patch({ dmFrom: "following" })}
      />
      <IgCheckRow
        label="No one"
        selected={data.dmFrom === "none"}
        onPress={() => patch({ dmFrom: "none" })}
        last
      />

      <IgSectionTitle>Story replies</IgSectionTitle>
      <IgCheckRow
        label="Allow replies from everyone"
        selected={data.storyRepliesFrom === "everyone"}
        onPress={() => patch({ storyRepliesFrom: "everyone" })}
      />
      <IgCheckRow
        label="Allow replies from followers"
        selected={data.storyRepliesFrom === "following"}
        onPress={() => patch({ storyRepliesFrom: "following" })}
      />
      <IgCheckRow
        label="Don't allow replies"
        selected={data.storyRepliesFrom === "off"}
        onPress={() => patch({ storyRepliesFrom: "off" })}
        last
      />

      <IgSectionTitle>Privacy</IgSectionTitle>
      <IgToggle
        label="Show read receipts"
        value={data.showReadReceipts}
        onValueChange={(v) => patch({ showReadReceipts: v })}
      />
      <IgToggle
        label="Show activity status"
        hint="Let others see when you're active"
        value={data.showOnlineStatus}
        onValueChange={(v) => patch({ showOnlineStatus: v })}
      />
      <IgToggle
        label="Message request filtering"
        hint="Move messages from people you don't follow to Requests"
        value={data.requestFiltering}
        onValueChange={(v) => patch({ requestFiltering: v })}
        last
      />

      <IgRow
        label="Hidden Words"
        sublabel="Manage muted words for DMs"
        onPress={() => router.push("/settings/content" as any)}
        last
      />
    </IgSettingsScreen>
  );
}
