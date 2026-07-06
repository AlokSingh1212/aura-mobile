import React from "react";
import { Linking } from "react-native";
import Constants from "expo-constants";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";

export default function AboutSettingsScreen() {
  const version = Constants.expoConfig?.version || "1.0.0";
  const build = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || "1";

  return (
    <IgSettingsScreen title="About">
      <IgBodyText>
        AURAGRAM — social commerce for creators, maisons and collectors. Quiet luxury meets live shopping.
      </IgBodyText>

      <IgSectionTitle>App</IgSectionTitle>
      <IgRow label="Version" sublabel={`${version} (${build})`} showChevron={false} />
      <IgRow
        label="What's New"
        onPress={() => Linking.openURL("https://auragram.vip/changelog")}
        last
      />

      <IgSectionTitle>Legal</IgSectionTitle>
      <IgRow label="Terms of Use" onPress={() => Linking.openURL("https://auragram.vip/terms")} />
      <IgRow label="Privacy Policy" onPress={() => Linking.openURL("https://auragram.vip/privacy")} />
      <IgRow
        label="Open source licenses"
        onPress={() => Linking.openURL("https://auragram.vip/licenses")}
        last
      />

      <IgSectionTitle>Company</IgSectionTitle>
      <IgRow label="AURA Technologies" sublabel="© 2026" showChevron={false} last />
    </IgSettingsScreen>
  );
}
