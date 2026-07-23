import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { fetchProfileNetwork, toggleFollowProfile, type NetworkProfile } from "@/lib/profileApi";

type UseProfileNetworkOptions = {
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  setFollowingCount: Dispatch<SetStateAction<number>>;
};

export function useProfileNetwork({
  activeProfile,
  triggerHaptic,
  setFollowingCount,
}: UseProfileNetworkOptions) {
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkTab, setNetworkTab] = useState<"followers" | "following">("followers");
  const [networkUsers, setNetworkUsers] = useState<NetworkProfile[]>([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [shareContacts, setShareContacts] = useState<NetworkProfile[]>([]);
  const [loadingShareContacts, setLoadingShareContacts] = useState(false);
  const [showShareProfileSheet, setShowShareProfileSheet] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [shareSearch, setShareSearch] = useState("");

  const loadNetworkList = useCallback(
    async (tab: "followers" | "following", targetProfileId?: string) => {
      const targetId = targetProfileId || activeProfile?.id;
      if (!targetId) return;
      setLoadingNetwork(true);
      try {
        const list = await fetchProfileNetwork(targetId, tab, activeProfile?.id);
        setNetworkUsers(list);
      } catch (e) {
        console.warn("Could not load profile network.", e);
        setNetworkUsers([]);
      } finally {
        setLoadingNetwork(false);
      }
    },
    [activeProfile?.id]
  );

  const loadShareContacts = useCallback(async () => {
    if (!activeProfile?.id) return;
    setLoadingShareContacts(true);
    try {
      const list = await fetchProfileNetwork(activeProfile.id, "following", activeProfile.id);
      setShareContacts(list);
    } catch (e) {
      console.warn("Could not load share contacts.", e);
      setShareContacts([]);
    } finally {
      setLoadingShareContacts(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    if (showNetworkModal && activeProfile?.id) {
      loadNetworkList(networkTab);
    }
  }, [showNetworkModal, networkTab, activeProfile?.id, loadNetworkList]);

  useEffect(() => {
    if (showShareProfileSheet && activeProfile?.id) {
      loadShareContacts();
    }
  }, [showShareProfileSheet, activeProfile?.id, loadShareContacts]);

  const handleNetworkFollowToggle = async (item: NetworkProfile) => {
    if (!activeProfile?.id || item.id === activeProfile.id) return;
    triggerHaptic("medium");
    const data = await toggleFollowProfile(activeProfile.id, item.id);
    if (!data.success) return;

    setNetworkUsers((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, followed: !!data.isFollowing } : u))
    );

    if (networkTab === "following" && !data.isFollowing) {
      setNetworkUsers((prev) => prev.filter((u) => u.id !== item.id));
    }

    if (typeof data.followingCount === "number") {
      setFollowingCount(data.followingCount);
    }
  };

  const handleShareProfile = () => {
    triggerHaptic("medium");
    setShareSearch("");
    setShowShareProfileSheet(true);
  };

  return {
    showNetworkModal,
    setShowNetworkModal,
    networkTab,
    setNetworkTab,
    networkUsers,
    loadingNetwork,
    shareContacts,
    loadingShareContacts,
    showShareProfileSheet,
    setShowShareProfileSheet,
    showQrModal,
    setShowQrModal,
    shareSearch,
    setShareSearch,
    loadNetworkList,
    loadShareContacts,
    handleNetworkFollowToggle,
    handleShareProfile,
  };
}
