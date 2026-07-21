import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { OnboardAccountType } from "@/components/home/homeOnboardingConstants";

type UseHomeAddProfileOptions = {
  currentUser: any;
  createNewProfile: (payload: any) => Promise<{ success: boolean; error?: string }>;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useHomeAddProfile({
  currentUser,
  createNewProfile,
  triggerHaptic,
}: UseHomeAddProfileOptions) {
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [profileType, setProfileType] = useState<OnboardAccountType>("PERSONAL");
  const [profileName, setProfileName] = useState("");
  const [username, setUsername] = useState("");
  const [profileCategory, setProfileCategory] = useState("Fashion");
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [profileTaxId, setProfileTaxId] = useState("");
  const [profileWebsite, setProfileWebsite] = useState("");
  const [profileGstExempt, setProfileGstExempt] = useState(false);
  const [addProfileLoading, setAddProfileLoading] = useState(false);

  const resetForm = useCallback(() => {
    setProfileName("");
    setUsername("");
    setProfilePrivate(false);
    setProfileTaxId("");
    setProfileWebsite("");
  }, []);

  const handleAddProfileSubmit = useCallback(async () => {
    if (!profileName.trim() || !username.trim()) return;
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Log in before minting a new profile.");
      return;
    }
    setAddProfileLoading(true);
    triggerHaptic("medium");
    const payload = {
      userId: currentUser.id,
      type: profileType,
      name: profileName.trim(),
      username: username.trim(),
      category:
        profileType === "INFLUENCER"
          ? profileCategory
          : profileType === "BUSINESS"
            ? "Business"
            : null,
      isPrivate: profileType === "PERSONAL" ? profilePrivate : false,
      taxId: profileType === "BUSINESS" ? (profileGstExempt ? null : profileTaxId) : null,
      website: profileType === "BUSINESS" ? profileWebsite.trim() : null,
      isGstExempt: profileType === "BUSINESS" ? profileGstExempt : false,
    };
    const res = await createNewProfile(payload);
    setAddProfileLoading(false);
    if (res.success) {
      triggerHaptic("success");
      Alert.alert("Identity Minted", `Seamlessly set active profile to @${username.toLowerCase()}`);
      resetForm();
      setShowAddProfileModal(false);
    } else {
      triggerHaptic("heavy");
      Alert.alert("Handshake Interrupted", res.error || "Handle registration failed.");
    }
  }, [
    createNewProfile,
    currentUser?.id,
    profileCategory,
    profileGstExempt,
    profileName,
    profilePrivate,
    profileTaxId,
    profileType,
    profileWebsite,
    resetForm,
    triggerHaptic,
    username,
  ]);

  return {
    showAddProfileModal,
    setShowAddProfileModal,
    profileType,
    setProfileType,
    profileName,
    setProfileName,
    username,
    setUsername,
    profileCategory,
    setProfileCategory,
    profilePrivate,
    setProfilePrivate,
    profileTaxId,
    setProfileTaxId,
    profileWebsite,
    setProfileWebsite,
    profileGstExempt,
    setProfileGstExempt,
    addProfileLoading,
    handleAddProfileSubmit,
  };
}
