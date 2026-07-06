import React from "react";
import { Alert } from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";

const LIMIT_OPTIONS = [30, 45, 60, 90, 120, 180];

export default function TimeSpentSettingsScreen() {
  const { data, patch } = useSettingsSection("time");
  if (!data) return null;

  const pickLimit = () => {
    Alert.alert(
      "Daily time limit",
      "Get notified when you reach this limit each day",
      [
        ...LIMIT_OPTIONS.map((m) => ({
          text: `${m} minutes`,
          onPress: () => patch({ dailyLimitMinutes: m, limitEnabled: true }),
        })),
        { text: "Turn off", style: "destructive", onPress: () => patch({ limitEnabled: false }) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const pickQuietStart = () => {
    Alert.alert("Quiet hours start", undefined, [
      { text: "10:00 PM", onPress: () => patch({ quietStart: "22:00", quietHoursEnabled: true }) },
      { text: "11:00 PM", onPress: () => patch({ quietStart: "23:00", quietHoursEnabled: true }) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <IgSettingsScreen title="Time spent">
      <IgBodyText>
        Set daily limits and quiet hours. AURA tracks approximate time in feed, reels and shop.
      </IgBodyText>

      <IgSectionTitle>Daily limit</IgSectionTitle>
      <IgRow
        label="Daily time limit"
        sublabel={
          data.limitEnabled
            ? `${data.dailyLimitMinutes} min / day`
            : "Off"
        }
        onPress={pickLimit}
      />
      <IgToggle
        label="Break reminders"
        hint="Remind you to take breaks while scrolling"
        value={data.breakReminders}
        onValueChange={(v) => patch({ breakReminders: v })}
        last
      />

      <IgSectionTitle>Quiet hours</IgSectionTitle>
      <IgToggle
        label="Enable quiet hours"
        hint="Mute non-urgent notifications overnight"
        value={data.quietHoursEnabled}
        onValueChange={(v) => patch({ quietHoursEnabled: v })}
      />
      <IgRow
        label="Start time"
        sublabel={data.quietStart}
        onPress={pickQuietStart}
      />
      <IgRow
        label="End time"
        sublabel={data.quietEnd}
        onPress={() => patch({ quietEnd: "08:00" })}
        last
      />
    </IgSettingsScreen>
  );
}
