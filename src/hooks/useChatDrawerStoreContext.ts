import { useState, useEffect, useMemo, useCallback } from "react";
import { getProfileDisplayName } from "@/lib/sessionIdentity";
import { listManagedStores, resolveManagedStore, type ManagedStore } from "@/lib/managedStores";

type UseChatDrawerStoreContextOptions = {
  visible: boolean;
  isSeller: boolean;
  activeMaisonId: string;
  userProfiles: any[];
  products: any[];
  activeProfile: any;
  currentUser: any;
  setActiveMaisonId: (id: string) => void;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  setActiveBusinessTool: (tool: string | null) => void;
};

export function useChatDrawerStoreContext({
  visible,
  isSeller,
  activeMaisonId,
  userProfiles,
  products,
  activeProfile,
  currentUser,
  setActiveMaisonId,
  triggerHaptic,
  setActiveBusinessTool,
}: UseChatDrawerStoreContextOptions) {
  const [businessMaisonId, setBusinessMaisonId] = useState(activeMaisonId || "");
  const [showStorePicker, setShowStorePicker] = useState(false);

  const managedStores = useMemo(
    () => listManagedStores(userProfiles, products, activeMaisonId || businessMaisonId),
    [userProfiles, products, activeMaisonId, businessMaisonId]
  );

  const sellerMaisonId = businessMaisonId || activeMaisonId || "";
  const activeBusinessStore = useMemo(
    () => resolveManagedStore(managedStores, sellerMaisonId),
    [managedStores, sellerMaisonId]
  );

  const handleSelectBusinessStore = useCallback(
    (store: ManagedStore) => {
      triggerHaptic("light");
      setBusinessMaisonId(store.maisonId);
      setActiveMaisonId(store.maisonId);
      setShowStorePicker(false);
      setActiveBusinessTool(null);
    },
    [triggerHaptic, setActiveMaisonId, setActiveBusinessTool]
  );

  const broadcastFollowerReach = useMemo(() => {
    const profile = userProfiles.find(
      (p) => (p.maisonId || p.username) === sellerMaisonId
    );
    return profile?.followersCount ?? activeProfile?.followersCount ?? 0;
  }, [userProfiles, sellerMaisonId, activeProfile?.followersCount]);

  const inboxTitle = isSeller
    ? getProfileDisplayName(activeProfile, currentUser)
    : getProfileDisplayName(activeProfile, currentUser);

  useEffect(() => {
    if (!visible || !isSeller || !activeMaisonId) return;
    if (managedStores.some((s) => s.maisonId === activeMaisonId)) {
      setBusinessMaisonId(activeMaisonId);
    }
  }, [visible, isSeller, activeMaisonId, managedStores]);

  useEffect(() => {
    if (!visible || !isSeller || managedStores.length === 0) return;
    if (!managedStores.some((s) => s.maisonId === businessMaisonId)) {
      const pick =
        managedStores.find((s) => s.maisonId === activeMaisonId) || managedStores[0];
      setBusinessMaisonId(pick.maisonId);
      setActiveMaisonId(pick.maisonId);
    }
  }, [visible, isSeller, managedStores, businessMaisonId, activeMaisonId, setActiveMaisonId]);

  return {
    businessMaisonId,
    setBusinessMaisonId,
    showStorePicker,
    setShowStorePicker,
    managedStores,
    sellerMaisonId,
    activeBusinessStore,
    handleSelectBusinessStore,
    broadcastFollowerReach,
    inboxTitle,
  };
}
