import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { profilePortalStyles as portalStyles } from "@/components/profile/profilePortalStyles";

type ProfileMediaBusyOverlayProps = {
  visible: boolean;
  isOpeningPicker: boolean;
  isUploadingMedia: boolean;
};

export function ProfileMediaBusyOverlay({ visible, isOpeningPicker, isUploadingMedia }: ProfileMediaBusyOverlayProps) {
  if (!visible) return null;
  return (
    <View style={portalStyles.mediaBusyOverlay} pointerEvents="box-none">
      <View style={portalStyles.mediaBusyCard}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={portalStyles.mediaBusyText}>
          {isOpeningPicker ? "Opening gallery…" : "Publishing…"}
        </Text>
      </View>
    </View>
  );
}
