import React from "react";
import { Alert } from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgCheckRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";

const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "hi", label: "Hindi" },
  { key: "fr", label: "French" },
  { key: "ar", label: "Arabic" },
  { key: "ja", label: "Japanese" },
];

const REGIONS = [
  { key: "IN", label: "India" },
  { key: "US", label: "United States" },
  { key: "GB", label: "United Kingdom" },
  { key: "AE", label: "United Arab Emirates" },
  { key: "SG", label: "Singapore" },
];

export default function LanguageSettingsScreen() {
  const { data, patch } = useSettingsSection("language");
  if (!data) return null;

  const pickRegion = () => {
    Alert.alert("Region", "Affects shop currency, dates and recommendations", [
      ...REGIONS.map((r) => ({
        text: r.label,
        onPress: () => patch({ region: r.key }),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const regionLabel = REGIONS.find((r) => r.key === data.region)?.label || data.region;

  return (
    <IgSettingsScreen title="Language">
      <IgBodyText>
        Choose the language and region for AURA. Shop and checkout use your delivery country separately.
      </IgBodyText>

      <IgSectionTitle>Preferences</IgSectionTitle>
      <IgToggle
        label="Use device language"
        value={data.useDeviceLanguage}
        onValueChange={(v) => patch({ useDeviceLanguage: v })}
        last={data.useDeviceLanguage}
      />

      {!data.useDeviceLanguage && (
        <>
          <IgSectionTitle>App language</IgSectionTitle>
          {LANGUAGES.map((l, idx) => (
            <IgCheckRow
              key={l.key}
              label={l.label}
              selected={data.appLanguage === l.key}
              onPress={() => patch({ appLanguage: l.key })}
              last={idx === LANGUAGES.length - 1}
            />
          ))}
        </>
      )}

      <IgSectionTitle>Region</IgSectionTitle>
      <IgCheckRow label={regionLabel} selected onPress={pickRegion} last />
    </IgSettingsScreen>
  );
}
