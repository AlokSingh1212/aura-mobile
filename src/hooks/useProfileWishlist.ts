import { useState } from "react";

type UseProfileWishlistOptions = {
  currentUser: any;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  fetchWishlist: (userId: string) => void;
};

export function useProfileWishlist({
  currentUser,
  activeProfile,
  triggerHaptic,
  fetchWishlist,
}: UseProfileWishlistOptions) {
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  const handleOpenWishlist = () => {
    const uid = currentUser?.id || activeProfile?.userId;
    if (uid && uid !== "patron_guest_sim") {
      fetchWishlist(uid);
    }
    triggerHaptic("medium");
    setShowWishlistModal(true);
  };

  return {
    showWishlistModal,
    setShowWishlistModal,
    handleOpenWishlist,
  };
}
