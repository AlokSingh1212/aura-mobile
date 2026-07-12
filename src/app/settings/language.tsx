import React, { useState } from "react";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgCheckRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { CountrySearchPicker } from "@/components/settings/CountrySearchPicker";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { countriesAsOptions } from "@/lib/worldLocations";

const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "hi", label: "Hindi (हिन्दी)" },
  { key: "bn", label: "Bengali (বাংলা)" },
  { key: "ta", label: "Tamil (தமிழ்)" },
  { key: "te", label: "Telugu (తెలుగు)" },
  { key: "mr", label: "Marathi (मराठी)" },
  { key: "fr", label: "French (Français)" },
  { key: "de", label: "German (Deutsch)" },
  { key: "es", label: "Spanish (Español)" },
  { key: "pt", label: "Portuguese (Português)" },
  { key: "ar", label: "Arabic (العربية)" },
  { key: "ja", label: "Japanese (日本語)" },
  { key: "ko", label: "Korean (한국어)" },
  { key: "zh", label: "Chinese (中文)" },
  { key: "it", label: "Italian (Italiano)" },
];

export default function LanguageSettingsScreen() {
  const { data, patch } = useSettingsSection("language");
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  if (!data) return null;

  const regionLabel =
    countriesAsOptions().find((c) => c.id === data.region)?.label || data.region;

  return (
    <>
      <IgSettingsScreen title="Language">
        <IgBodyText>
          Choose the language and region for AURA. Shop checkout uses your delivery country in Shop
          preferences.
        </IgBodyText>

        <IgSectionTitle>Preferences</IgSectionTitle>
        {LANGUAGES.map((lang, idx) => (
          <IgCheckRow
            key={lang.key}
            label={lang.label}
            selected={data.appLanguage === lang.key}
            onPress={() => patch({ appLanguage: lang.key })}
            last={idx === LANGUAGES.length - 1}
          />
        ))}

        <IgSectionTitle>Region</IgSectionTitle>
        <IgCheckRow
          label="Content region"
          hint={regionLabel}
          selected={false}
          onPress={() => setRegionPickerOpen(true)}
          last
        />

        <IgSectionTitle>Display</IgSectionTitle>
        <IgToggle
          label="Use system language when available"
          value={data.useDeviceLanguage}
          onValueChange={(v) => patch({ useDeviceLanguage: v })}
          last
        />
      </IgSettingsScreen>

      <CountrySearchPicker
        visible={regionPickerOpen}
        onClose={() => setRegionPickerOpen(false)}
        title="Content region"
        onSelectIso={(iso) => patch({ region: iso })}
      />
    </>
  );
}
