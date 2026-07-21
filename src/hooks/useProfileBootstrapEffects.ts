import { useEffect, useCallback } from "react";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

type UseProfileBootstrapEffectsOptions = {
  authHydrated: boolean;
  currentUser: any;
  activeProfile: any;
  fetchProducts: () => void;
  loadUserStories: (userId: string) => void;
  loadProfileFromServer: () => Promise<void>;
  loadProfilePosts: () => Promise<void>;
  loadProfileProducts: () => Promise<void>;
  loadProductCollabs: () => Promise<void>;
  loadProfileHighlights: () => Promise<void>;
  loadTaggedPosts: () => Promise<void>;
  mediaUploadInFlight: React.MutableRefObject<boolean>;
  isUploadingMedia: boolean;
  logo: string | null;
  setLogo: (value: string | null) => void;
  setEditLogo: (value: string | null) => void;
  onCurrentUserSync: (user: NonNullable<UseProfileBootstrapEffectsOptions["currentUser"]>) => void;
};

export function useProfileBootstrapEffects({
  authHydrated,
  currentUser,
  activeProfile,
  fetchProducts,
  loadUserStories,
  loadProfileFromServer,
  loadProfilePosts,
  loadProfileProducts,
  loadProductCollabs,
  loadProfileHighlights,
  loadTaggedPosts,
  mediaUploadInFlight,
  isUploadingMedia,
  logo,
  setLogo,
  setEditLogo,
  onCurrentUserSync,
}: UseProfileBootstrapEffectsOptions) {
  useEffect(() => {
    if (!authHydrated) return;
    if (!currentUser) {
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 1);
      return () => clearTimeout(timer);
    }
    onCurrentUserSync(currentUser);
  }, [currentUser, authHydrated, onCurrentUserSync]);

  useFocusEffect(
    useCallback(() => {
      loadProfileFromServer();
      loadProfilePosts();
      loadProfileProducts();
      loadProductCollabs();
      loadProfileHighlights();
      loadTaggedPosts();
      if (currentUser?.id) {
        loadUserStories(currentUser.id);
      }
    }, [
      loadProfileFromServer,
      loadProfilePosts,
      loadProfileProducts,
      loadProductCollabs,
      loadProfileHighlights,
      loadTaggedPosts,
      loadUserStories,
      currentUser?.id,
      activeProfile?.id,
    ])
  );

  useEffect(() => {
    if (mediaUploadInFlight.current || isUploadingMedia) return;
    const storeLogo = activeProfile?.logo;
    if (storeLogo && storeLogo !== logo) {
      setLogo(storeLogo);
      setEditLogo(storeLogo);
    }
  }, [activeProfile?.logo, isUploadingMedia, logo, mediaUploadInFlight, setLogo, setEditLogo]);

  useEffect(() => {
    if (!authHydrated || !currentUser?.id) return;
    loadProfileFromServer();
    fetchProducts();
  }, [authHydrated, currentUser?.id, activeProfile?.id, loadProfileFromServer, fetchProducts]);
}
