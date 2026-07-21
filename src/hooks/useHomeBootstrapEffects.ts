import { useEffect } from "react";
import { router } from "expo-router";

type UseHomeBootstrapEffectsOptions = {
  detectLocation: () => void;
  currentUser: any;
  authHydrated: boolean;
  activeProfileLogo?: string | null;
  loadUserStories: (userId: string) => void;
  loadStoryRings: (userId: string) => void;
  fetchProfiles: (userId: string) => void;
  fetchFeed: () => void;
  fetchProducts: () => void;
  fetchFeedItems: (category?: string, tab?: "For You" | "Following", reset?: boolean) => void | Promise<void>;
};

export function useHomeBootstrapEffects({
  detectLocation,
  currentUser,
  authHydrated,
  activeProfileLogo,
  loadUserStories,
  loadStoryRings,
  fetchProfiles,
  fetchFeed,
  fetchProducts,
  fetchFeedItems,
}: UseHomeBootstrapEffectsOptions) {
  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadUserStories(currentUser.id);
      loadStoryRings(currentUser.id);
    }
  }, [currentUser?.id, activeProfileLogo, loadStoryRings, loadUserStories]);

  useEffect(() => {
    if (!authHydrated) return;
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, authHydrated]);

  useEffect(() => {
    if (currentUser) {
      fetchProfiles(currentUser.id);
    }
  }, [currentUser, fetchProfiles]);

  useEffect(() => {
    fetchFeed();
    fetchProducts();
    fetchFeedItems("", "For You", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
