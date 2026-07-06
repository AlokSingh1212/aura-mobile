import React from "react";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgBodyText,
  IgRow,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { router } from "expo-router";

export default function CreatorSettingsScreen() {
  const { data, patch } = useSettingsSection("creator");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Creator tools">
      <IgBodyText>
        Defaults for reels, stories and catalog uploads. Business catalog tools live in AURA Business Suite.
      </IgBodyText>

      <IgSectionTitle>Reels & video</IgSectionTitle>
      <IgToggle
        label="High quality upload"
        hint="Higher bitrate — uses more data"
        value={data.highQualityUpload}
        onValueChange={(v) => patch({ highQualityUpload: v })}
      />
      <IgToggle
        label="Upload on Wi‑Fi only"
        value={data.uploadOnWifiOnly}
        onValueChange={(v) => patch({ uploadOnWifiOnly: v })}
      />
      <IgToggle
        label="Save reels to gallery after posting"
        value={data.saveReelsToGallery}
        onValueChange={(v) => patch({ saveReelsToGallery: v })}
      />
      <IgToggle
        label="Show teleprompter by default"
        value={data.showPrompterByDefault}
        onValueChange={(v) => patch({ showPrompterByDefault: v })}
        last
      />

      <IgSectionTitle>Photos</IgSectionTitle>
      <IgToggle
        label="Save original photos"
        hint="Keep unedited versions in camera roll"
        value={data.saveOriginalPhotos}
        onValueChange={(v) => patch({ saveOriginalPhotos: v })}
        last
      />

      <IgSectionTitle>Affiliate earnings</IgSectionTitle>
      <IgRow
        label="View earnings"
        sublabel="Commissions and referrals"
        onPress={() => router.push("/maison/business-suite" as any)}
        last
      />

      <IgSectionTitle>Business</IgSectionTitle>
      <IgRow
        label="AURA Business Suite"
        sublabel="Catalog, ads, analytics"
        onPress={() => router.push("/maison/business-suite" as any)}
        last
      />
    </IgSettingsScreen>
  );
}
