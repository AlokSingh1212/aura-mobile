import React, { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import {
  IgSettingsScreen,
  IgRow,
  IgSectionTitle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import {
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "@/lib/themeStore";
import { IG } from "@/theme/settingsTheme";

const OPTIONS: { id: ThemePreference; label: string; hint?: string }[] = [
  { id: "system", label: "Use device setting", hint: "Match iOS/Android appearance" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function AppearanceSettingsScreen() {
  const [selected, setSelected] = useState<ThemePreference>("system");

  useEffect(() => {
    loadThemePreference().then(setSelected);
  }, []);

  const apply = async (pref: ThemePreference) => {
    setSelected(pref);
    await saveThemePreference(pref);
  };

  return (
    <IgSettingsScreen title="Appearance">
      <IgBodyText>
        Choose how AURA looks on this device. Theme preference is saved locally on this phone.
      </IgBodyText>

      <IgSectionTitle>Theme</IgSectionTitle>
      {OPTIONS.map((opt, idx) => (
        <IgRow
          key={opt.id}
          label={opt.label}
          sublabel={opt.hint}
          rightText={selected === opt.id ? "✓" : undefined}
          showChevron={false}
          last={idx === OPTIONS.length - 1}
          onPress={() => apply(opt.id)}
        />
      ))}

      <Text style={styles.note}>
        Feed and profile screens use the AURA dark canvas by default. Light mode applies to settings and supported surfaces.
      </Text>
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  note: {
    color: IG.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
