import React from "react";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";

export default function NotificationSettingsScreen() {
  const { data, patch } = useSettingsSection("notifications");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Notifications">
      <IgBodyText>
        Choose what you're notified about. Order alerts respect your quiet hours in Time spent.
      </IgBodyText>

      <IgSectionTitle>Channels</IgSectionTitle>
      <IgToggle
        label="Push notifications"
        value={data.pushEnabled}
        onValueChange={(v) => patch({ pushEnabled: v })}
      />
      <IgToggle
        label="SMS"
        hint="Order and delivery updates via text"
        value={data.smsEnabled}
        onValueChange={(v) => patch({ smsEnabled: v })}
      />
      <IgToggle
        label="Email digest"
        hint="Weekly summary of activity and deals"
        value={data.emailDigest}
        onValueChange={(v) => patch({ emailDigest: v })}
        last
      />

      <IgSectionTitle>Shopping</IgSectionTitle>
      <IgToggle label="Order updates" value={data.orderUpdates} onValueChange={(v) => patch({ orderUpdates: v })} />
      <IgToggle label="Price drops" value={data.priceDrops} onValueChange={(v) => patch({ priceDrops: v })} />
      <IgToggle label="New arrivals" value={data.newArrivals} onValueChange={(v) => patch({ newArrivals: v })} last />

      <IgSectionTitle>Social</IgSectionTitle>
      <IgToggle label="Posts" value={data.posts} onValueChange={(v) => patch({ posts: v })} />
      <IgToggle label="Stories" value={data.stories} onValueChange={(v) => patch({ stories: v })} />
      <IgToggle label="Reels" value={data.reels} onValueChange={(v) => patch({ reels: v })} />
      <IgToggle label="Live shows" value={data.liveShows} onValueChange={(v) => patch({ liveShows: v })} />
      <IgToggle label="Messages" value={data.messages} onValueChange={(v) => patch({ messages: v })} />
      <IgToggle label="Mentions" value={data.mentions} onValueChange={(v) => patch({ mentions: v })} last />
    </IgSettingsScreen>
  );
}
