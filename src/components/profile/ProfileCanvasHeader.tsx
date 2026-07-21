import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { AuraThreadsLogo } from "@/components/threads/AuraThreadsLogo";
import { profileHeaderStyles as styles } from "@/components/profile/profileHeaderStyles";

type ProfileCanvasHeaderProps = {
  username: string;
  isVerifiedUser: boolean;
  triggerHaptic: (style: any) => void;
  onOpenCreate: () => void;
  onOpenSwitcher: () => void;
  onOpenWishlist: () => void;
};

export function ProfileCanvasHeader({
  username,
  isVerifiedUser,
  triggerHaptic,
  onOpenCreate,
  onOpenSwitcher,
  onOpenWishlist,
}: ProfileCanvasHeaderProps) {
  return (
    <View style={styles.canvasHeaderRow}>
      <TouchableOpacity onPress={() => { triggerHaptic("light"); onOpenCreate(); }}>
        <Lucide name="add-outline" size={28} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.canvasHeaderDropdown} onPress={() => { triggerHaptic("medium"); onOpenSwitcher(); }}>
        <Text style={styles.canvasHeaderUsername}>{username}</Text>
        {isVerifiedUser && (
          <Lucide name="checkmark-circle" size={16} color="#00f5ff" style={{ marginLeft: 4 }} />
        )}
        <Lucide name="chevron-down-outline" size={14} color="#ffffff" style={{ marginLeft: 3 }} />
      </TouchableOpacity>

      <View style={styles.canvasHeaderRightIcons}>
        <TouchableOpacity style={{ marginRight: 16 }} onPress={onOpenWishlist}>
          <Lucide name="heart-outline" size={26} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => {
            triggerHaptic("light");
            router.push("/threads" as any);
          }}
        >
          <AuraThreadsLogo size={23} color="#d4af37" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { triggerHaptic("medium"); router.push("/settings" as any); }}>
          <Lucide name="menu-outline" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
