import React from "react";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgCheckRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";

export default function TagsSettingsScreen() {
  const { data, patch } = useSettingsSection("tags");
  if (!data) return null;

  const setTagsFrom = (key: string) => patch({ allowTagsFrom: key as typeof data.allowTagsFrom });
  const setMentionsFrom = (key: string) =>
    patch({ allowMentionsFrom: key as typeof data.allowMentionsFrom });

  return (
    <IgSettingsScreen title="Tags and mentions">
      <IgBodyText>
        Control who can tag you in posts and mention you in captions, comments and stories.
      </IgBodyText>

      <IgSectionTitle>Tags</IgSectionTitle>
      <IgCheckRow
        label="Allow tags from everyone"
        selected={data.allowTagsFrom === "everyone"}
        onPress={() => setTagsFrom("everyone")}
      />
      <IgCheckRow
        label="Allow tags from people you follow"
        selected={data.allowTagsFrom === "following"}
        onPress={() => setTagsFrom("following")}
      />
      <IgCheckRow
        label="Don't allow tags"
        selected={data.allowTagsFrom === "none"}
        onPress={() => setTagsFrom("none")}
        last
      />

      <IgToggle
        label="Manually approve tags"
        hint="Review tags before they appear on your profile"
        value={data.manualTagApproval}
        onValueChange={(v) => patch({ manualTagApproval: v })}
        last
      />

      <IgSectionTitle>Mentions</IgSectionTitle>
      <IgCheckRow
        label="Allow mentions from everyone"
        selected={data.allowMentionsFrom === "everyone"}
        onPress={() => setMentionsFrom("everyone")}
      />
      <IgCheckRow
        label="Allow mentions from people you follow"
        selected={data.allowMentionsFrom === "following"}
        onPress={() => setMentionsFrom("following")}
      />
      <IgCheckRow
        label="Don't allow mentions"
        selected={data.allowMentionsFrom === "none"}
        onPress={() => setMentionsFrom("none")}
        last
      />
    </IgSettingsScreen>
  );
}
