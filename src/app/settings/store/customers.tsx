import React from "react";
import { IgSettingsScreen, IgBodyText, IgRow } from "@/components/settings/InstagramSettingsUI";
import { router } from "expo-router";
import { useSettingsSection } from "@/hooks/useSettingsSection";

export default function StoreCustomersSettings() {
  const { data } = useSettingsSection("store");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Customer messages">
      <IgBodyText>
        {data.customerMessagesEnabled
          ? "Buyers can message you about orders. Open your inbox in seller mode to reply."
          : "Customer messages are off. Enable them in Store management → Shop status."}
      </IgBodyText>
      <IgRow
        label="Open seller inbox"
        sublabel="Order enquiries and DMs"
        onPress={() => router.push("/account" as any)}
        last
      />
    </IgSettingsScreen>
  );
}
