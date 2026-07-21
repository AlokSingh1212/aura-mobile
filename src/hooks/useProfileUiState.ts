import { useState } from "react";

export function useProfileUiState() {
  const [activeGridTab, setActiveGridTab] = useState<"posts" | "reels" | "tagged" | "products" | "collabs">("posts");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  return {
    activeGridTab,
    setActiveGridTab,
    isUploadingMedia,
    setIsUploadingMedia,
    showCreateModal,
    setShowCreateModal,
    showPostModal,
    setShowPostModal,
    showLiveModal,
    setShowLiveModal,
    showAIModal,
    setShowAIModal,
  };
}
