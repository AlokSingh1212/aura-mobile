import { useCallback } from "react";
import { router } from "expo-router";

type UseHomeProfileNavigationOptions = {
  activeProfile: any;
  activeMaisonId?: string;
  userProfiles: any[];
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  setShowCommentsModal: (show: boolean) => void;
  setShowActivityDrawer: (show: boolean) => void;
};

export function useHomeProfileNavigation({
  activeProfile,
  activeMaisonId,
  userProfiles,
  triggerHaptic,
  setShowCommentsModal,
  setShowActivityDrawer,
}: UseHomeProfileNavigationOptions) {
  const navigateToUserProfile = useCallback(
    (username: string) => {
      triggerHaptic("medium");
      setShowCommentsModal(false);
      setShowActivityDrawer(false);

      const cleanUsername = username.toLowerCase().replace(/\s+/g, "_").replace(/['']/g, "");

      const isOwnProfile =
        (activeProfile && activeProfile.username?.toLowerCase() === cleanUsername) ||
        (activeMaisonId && activeMaisonId.toLowerCase() === cleanUsername) ||
        (userProfiles && userProfiles.some((p: any) => p.username?.toLowerCase() === cleanUsername));

      if (isOwnProfile) {
        router.push("/account");
      } else {
        router.push(`/profile/${cleanUsername}` as any);
      }
    },
    [activeMaisonId, activeProfile, setShowActivityDrawer, setShowCommentsModal, triggerHaptic, userProfiles]
  );

  const handleMaisonProfilePress = useCallback(
    (item: any) => {
      const creatorName = item.user?.name || "Alok Maison";
      navigateToUserProfile(creatorName);
    },
    [navigateToUserProfile]
  );

  return { navigateToUserProfile, handleMaisonProfilePress };
}
