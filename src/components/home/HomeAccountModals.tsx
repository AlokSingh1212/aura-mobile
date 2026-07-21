import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { InAppBrowserModal } from "@/components/InAppBrowserModal";
import { ExploreProductsSheet } from "@/components/ExploreProductsSheet";
import { LeadGenSheet } from "@/components/LeadGenSheet";
import { HomeOnboardingModal } from "@/components/home/HomeOnboardingModal";
import { HomeProfileSwitcherModal } from "@/components/home/HomeProfileSwitcherModal";
import { HomeActivityDrawer } from "@/components/home/HomeActivityDrawer";
import { HomeAddProfileModal } from "@/components/home/HomeAddProfileModal";
import type { OnboardAccountType, OnboardStep } from "@/components/home/homeOnboardingConstants";

type HomeAccountModalsProps = {
  isScreenFocused: boolean;
  showOnboardModal: boolean;
  setShowOnboardModal: (show: boolean) => void;
  onboardStep: OnboardStep;
  setOnboardStep: (step: OnboardStep) => void;
  onboardPrivate: boolean;
  setOnboardPrivate: (value: boolean) => void;
  onboardLoading: boolean;
  onboardInfluencerCategory: string;
  setOnboardInfluencerCategory: (value: string) => void;
  onboardBrandName: string;
  setOnboardBrandName: (value: string) => void;
  onboardWebsite: string;
  setOnboardWebsite: (value: string) => void;
  onboardGstExempt: boolean;
  setOnboardGstExempt: (value: boolean) => void;
  onboardTaxId: string;
  setOnboardTaxId: (value: string) => void;
  influencerCategories: string[];
  handleSubmitOnboarding: (type: "PERSONAL" | "INFLUENCER" | "BUSINESS") => void | Promise<void>;
  showProfileSwitcher: boolean;
  setShowProfileSwitcher: (show: boolean) => void;
  userProfiles: any[];
  activeProfile: any;
  switchActiveProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  onAddProfile: () => void;
  showActivityDrawer: boolean;
  setShowActivityDrawer: (show: boolean) => void;
  currentUserId?: string;
  notifications: any[];
  loadingNotifications: boolean;
  fetchNotifications: (profileId: string, type?: "ALL" | "LIKE" | "COMMENT" | "FOLLOW") => void;
  navigateToUserProfile: (username: string) => void;
  addProfile: {
    showAddProfileModal: boolean;
    setShowAddProfileModal: (show: boolean) => void;
    profileType: OnboardAccountType;
    setProfileType: (type: OnboardAccountType) => void;
    profileName: string;
    setProfileName: (value: string) => void;
    username: string;
    setUsername: (value: string) => void;
    profilePrivate: boolean;
    setProfilePrivate: (value: boolean) => void;
    profileCategory: string;
    setProfileCategory: (value: string) => void;
    profileWebsite: string;
    setProfileWebsite: (value: string) => void;
    profileGstExempt: boolean;
    setProfileGstExempt: (value: boolean) => void;
    profileTaxId: string;
    setProfileTaxId: (value: string) => void;
    addProfileLoading: boolean;
    handleAddProfileSubmit: () => void | Promise<void>;
  };
  browserModalVisible: boolean;
  setBrowserModalVisible: (show: boolean) => void;
  browserUrl: string;
  productsSheetVisible: boolean;
  setProductsSheetVisible: (show: boolean) => void;
  productsSheetItems: any[];
  leadGenVisible: boolean;
  setLeadGenVisible: (show: boolean) => void;
  leadGenMeta: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function HomeAccountModals({
  isScreenFocused,
  showOnboardModal,
  setShowOnboardModal,
  onboardStep,
  setOnboardStep,
  onboardPrivate,
  setOnboardPrivate,
  onboardLoading,
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
  influencerCategories,
  handleSubmitOnboarding,
  showProfileSwitcher,
  setShowProfileSwitcher,
  userProfiles,
  activeProfile,
  switchActiveProfile,
  onAddProfile,
  showActivityDrawer,
  setShowActivityDrawer,
  currentUserId,
  notifications,
  loadingNotifications,
  fetchNotifications,
  navigateToUserProfile,
  addProfile,
  browserModalVisible,
  setBrowserModalVisible,
  browserUrl,
  productsSheetVisible,
  setProductsSheetVisible,
  productsSheetItems,
  leadGenVisible,
  setLeadGenVisible,
  leadGenMeta,
  triggerHaptic,
}: HomeAccountModalsProps) {
  return (
    <>
      <HomeOnboardingModal
        visible={showOnboardModal && isScreenFocused}
        step={onboardStep}
        onboardPrivate={onboardPrivate}
        onboardLoading={onboardLoading}
        onboardInfluencerCategory={onboardInfluencerCategory}
        onboardBrandName={onboardBrandName}
        onboardWebsite={onboardWebsite}
        onboardGstExempt={onboardGstExempt}
        onboardTaxId={onboardTaxId}
        influencerCategories={[...influencerCategories]}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowOnboardModal(false)}
        onSkipToSettings={() => {
          setShowOnboardModal(false);
          router.push("/settings" as any);
        }}
        setStep={setOnboardStep}
        setOnboardPrivate={setOnboardPrivate}
        setOnboardInfluencerCategory={setOnboardInfluencerCategory}
        setOnboardBrandName={setOnboardBrandName}
        setOnboardWebsite={setOnboardWebsite}
        setOnboardGstExempt={setOnboardGstExempt}
        setOnboardTaxId={setOnboardTaxId}
        onSubmit={handleSubmitOnboarding}
      />

      <HomeProfileSwitcherModal
        visible={showProfileSwitcher}
        userProfiles={userProfiles}
        activeProfileId={activeProfile?.id}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowProfileSwitcher(false)}
        onSwitchProfile={switchActiveProfile}
        onAddProfile={onAddProfile}
      />

      <HomeActivityDrawer
        visible={showActivityDrawer}
        activeProfile={activeProfile}
        currentUserId={currentUserId}
        notifications={notifications}
        loadingNotifications={loadingNotifications}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowActivityDrawer(false)}
        onOpenAdsHub={() => {
          triggerHaptic("medium");
          Alert.alert(
            "Ad Campaign Hub",
            "Recent Activity from your ads:\n• Reach: 24.8K (+12% this week)\n• Auction Wins: 94.2%\n• Total Spent: 14,250 INR",
            [
              { text: "View Dashboard", onPress: () => router.push("/dashboard") },
              { text: "Dismiss", style: "cancel" },
            ]
          );
        }}
        onOpenDashboard={() => router.push("/dashboard")}
        onRefreshNotifications={(type) => {
          if (activeProfile?.id) fetchNotifications(activeProfile.id, type);
        }}
        onOpenProfile={navigateToUserProfile}
      />

      <HomeAddProfileModal
        visible={addProfile.showAddProfileModal}
        profileType={addProfile.profileType}
        profileName={addProfile.profileName}
        username={addProfile.username}
        profilePrivate={addProfile.profilePrivate}
        profileCategory={addProfile.profileCategory}
        profileWebsite={addProfile.profileWebsite}
        profileGstExempt={addProfile.profileGstExempt}
        profileTaxId={addProfile.profileTaxId}
        addProfileLoading={addProfile.addProfileLoading}
        influencerCategories={[...influencerCategories]}
        triggerHaptic={triggerHaptic}
        onClose={() => addProfile.setShowAddProfileModal(false)}
        setProfileType={addProfile.setProfileType}
        setProfileName={addProfile.setProfileName}
        setUsername={addProfile.setUsername}
        setProfilePrivate={addProfile.setProfilePrivate}
        setProfileCategory={addProfile.setProfileCategory}
        setProfileWebsite={addProfile.setProfileWebsite}
        setProfileGstExempt={addProfile.setProfileGstExempt}
        setProfileTaxId={addProfile.setProfileTaxId}
        onSubmit={addProfile.handleAddProfileSubmit}
      />

      <InAppBrowserModal
        visible={browserModalVisible}
        url={browserUrl}
        onClose={() => setBrowserModalVisible(false)}
      />

      <ExploreProductsSheet
        visible={productsSheetVisible}
        products={productsSheetItems}
        onClose={() => setProductsSheetVisible(false)}
        onProductPress={(productId) => {
          setProductsSheetVisible(false);
          router.push(`/product/${productId}` as any);
        }}
      />

      <LeadGenSheet
        visible={leadGenVisible}
        brandName={leadGenMeta.brandName || "Brand"}
        brandLogo={leadGenMeta.brandLogo}
        formTitle={leadGenMeta.formTitle || "Get in Touch"}
        formDescription={leadGenMeta.formDescription || "Fill in your details and we'll reach out."}
        customQuestion={leadGenMeta.customQuestion}
        onClose={() => setLeadGenVisible(false)}
        onSubmit={() => {
          setLeadGenVisible(false);
          Alert.alert("Submitted!", "Your information has been sent to the brand.");
        }}
      />
    </>
  );
}
