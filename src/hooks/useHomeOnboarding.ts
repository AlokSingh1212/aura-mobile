import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useStore } from "@/store/useStore";
import type { OnboardAccountType, OnboardStep } from "@/components/home/homeOnboardingConstants";

type UseHomeOnboardingOptions = {
  currentUser: any;
  authHydrated: boolean;
  userProfiles: any[];
  isScreenFocused: boolean;
  authOnboard: (payload: any) => Promise<{ success: boolean; user?: any; error?: string }>;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useHomeOnboarding({
  currentUser,
  authHydrated,
  userProfiles,
  isScreenFocused,
  authOnboard,
  triggerHaptic,
}: UseHomeOnboardingOptions) {
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardStep, setOnboardStep] = useState<OnboardStep>("select");
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardPrivate, setOnboardPrivate] = useState(false);
  const [onboardInfluencerCategory, setOnboardInfluencerCategory] = useState("Fashion");
  const [onboardBrandName, setOnboardBrandName] = useState("");
  const [onboardWebsite, setOnboardWebsite] = useState("");
  const [onboardGstExempt, setOnboardGstExempt] = useState(false);
  const [onboardTaxId, setOnboardTaxId] = useState("");

  const needsOnboarding = useMemo(
    () =>
      !!currentUser &&
      (currentUser.isOnboarded === false || (authHydrated && userProfiles.length === 0)),
    [authHydrated, currentUser, userProfiles.length]
  );

  useEffect(() => {
    if (needsOnboarding && isScreenFocused) {
      setShowOnboardModal(true);
    } else {
      setShowOnboardModal(false);
    }
  }, [needsOnboarding, isScreenFocused, authHydrated, currentUser?.id, userProfiles.length]);

  const handleSubmitOnboarding = useCallback(
    async (accountType: OnboardAccountType) => {
      if (!currentUser) return;
      setOnboardLoading(true);
      triggerHaptic("medium");

      const payload: any = {
        userId: currentUser.id,
        accountType,
      };

      if (accountType === "PERSONAL") {
        payload.isPrivate = onboardPrivate;
      } else if (accountType === "INFLUENCER") {
        payload.influencerCategory = onboardInfluencerCategory;
      } else if (accountType === "BUSINESS") {
        payload.brandName = onboardBrandName.trim();
        payload.website = onboardWebsite.trim();
        payload.isGstExempt = onboardGstExempt;
        if (!onboardGstExempt) {
          payload.taxId = onboardTaxId.trim();
        }
      }

      try {
        const res = await authOnboard(payload);
        if (res.success) {
          triggerHaptic("success");
          if (res.user) {
            useStore.setState({ currentUser: res.user, activeMaisonId: res.user.maisonId });
          }
          setShowOnboardModal(false);
          setOnboardStep("select");
          Alert.alert(
            "Sovereign Identity Activated",
            `Your ${accountType === "PERSONAL" ? "Personal" : accountType === "INFLUENCER" ? "Creator" : "Business Maison"} profile is now live on the AURA mesh!`
          );
        } else {
          triggerHaptic("heavy");
          Alert.alert("Onboarding Failed", res.error || "Could not activate your sovereign identity.");
        }
      } catch (e: any) {
        triggerHaptic("heavy");
        Alert.alert("Connection Failure", e.message || "Failed to reach onboarding gateway.");
      } finally {
        setOnboardLoading(false);
      }
    },
    [
      authOnboard,
      currentUser,
      onboardBrandName,
      onboardGstExempt,
      onboardInfluencerCategory,
      onboardPrivate,
      onboardTaxId,
      onboardWebsite,
      triggerHaptic,
    ]
  );

  return {
    showOnboardModal,
    setShowOnboardModal,
    onboardStep,
    setOnboardStep,
    onboardLoading,
    onboardPrivate,
    setOnboardPrivate,
    onboardInfluencerCategory,
    setOnboardInfluencerCategory,
    onboardBrandName,
    setOnboardBrandName,
    onboardWebsite,
    setOnboardWebsite,
    onboardGstExempt,
    setOnboardGstExempt,
    onboardTaxId,
    setOnboardTaxId,
    handleSubmitOnboarding,
  };
}
