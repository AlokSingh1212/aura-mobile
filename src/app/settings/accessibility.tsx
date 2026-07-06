import React from "react";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";

export default function AccessibilitySettingsScreen() {
  const { data, patch } = useSettingsSection("accessibility");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Accessibility">
      <IgBodyText>
        Customize AURA for your vision, hearing and motion needs. Some features require an app restart.
      </IgBodyText>

      <IgSectionTitle>Vision</IgSectionTitle>
      <IgToggle
        label="High contrast text"
        value={data.highContrast}
        onValueChange={(v) => patch({ highContrast: v })}
      />
      <IgToggle
        label="Larger text"
        hint="Increase font size across feed and settings"
        value={data.largerText}
        onValueChange={(v) => patch({ largerText: v })}
        last
      />

      <IgSectionTitle>Hearing</IgSectionTitle>
      <IgToggle
        label="Auto-generated captions"
        hint="Show captions on reels and live when available"
        value={data.autoCaptions}
        onValueChange={(v) => patch({ autoCaptions: v })}
        last
      />

      <IgSectionTitle>Motion</IgSectionTitle>
      <IgToggle
        label="Reduce motion"
        hint="Minimize animations in feed and stories"
        value={data.reduceMotion}
        onValueChange={(v) => patch({ reduceMotion: v })}
        last
      />

      <IgSectionTitle>Screen reader</IgSectionTitle>
      <IgToggle
        label="Enhanced screen reader labels"
        value={data.screenReaderHints}
        onValueChange={(v) => patch({ screenReaderHints: v })}
        last
      />
    </IgSettingsScreen>
  );
}
