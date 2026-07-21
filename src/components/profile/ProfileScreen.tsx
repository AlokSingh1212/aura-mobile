import React, { useState, useEffect } from "react";
import { View, ScrollView, StatusBar, Modal, TextInput, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileCanvasHeader } from "@/components/profile/ProfileCanvasHeader";
import { ProfileSummarySection } from "@/components/profile/ProfileSummarySection";
import { ProfileContentGrid } from "@/components/profile/ProfileContentGrid";
import { ProfileScreenModals } from "@/components/profile/ProfileScreenModals";
import { useProfileScreen } from "@/hooks/useProfileScreen";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { useStore } from "@/store/useStore";

export function ProfileScreen() {
  const { shell, modals } = useProfileScreen();
  const {
    styles,
    insets,
    username,
    isVerifiedUser,
    triggerHaptic,
    setShowCreateModal,
    setShowSwitcherModal,
    handleOpenWishlist,
    displayLogo,
    profileName,
    category,
    bioText,
    websiteLink,
    tags,
    postsCount,
    followersCount,
    followingCount,
    auraScore,
    hasActiveStory,
    isUploadingMedia,
    isPersonalProfile,
    isCreatorProfile,
    isBusinessProfile,
    highlights,
    activeProfile,
    currentUser,
    handleProfileAvatarTap,
    handleAvatarPress,
    setNetworkTab,
    setShowNetworkModal,
    handleRemoveTag,
    handleAddPress,
    handleEditProfilePress,
    handleShareProfile,
    handleOpenAddProduct,
    handleAddHighlight,
    activeGridTab,
    setActiveGridTab,
    visiblePresetPosts,
    visibleTaggedPosts,
    displayProducts,
    productCollabProducts,
    showStoreLabelsOnProducts,
    openGridItem,
    handleSwitchToStoreFromProduct,
  } = shell;

  // Local note states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState(activeProfile?.note || "");
  const [updatingNote, setUpdatingNote] = useState(false);

  useEffect(() => {
    if (activeProfile?.note) {
      setNoteText(activeProfile.note);
    }
  }, [activeProfile?.note]);

  const submitNote = async () => {
    if (updatingNote) return;
    setUpdatingNote(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/profile/note`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUser?.id,
          profileId: activeProfile?.id,
          note: noteText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNoteModal(false);
        // Instantly update the local store state for immediate visual propagation
        useStore.setState((state: any) => ({
          activeProfile: { ...state.activeProfile, note: noteText }
        }));
      } else {
        Alert.alert("Error", data.error || "Failed to update note");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update status note");
    } finally {
      setUpdatingNote(false);
    }
  };

  return (
    <ErrorBoundary screenName="profile">
      <View style={styles.container} collapsable={false}>
        <StatusBar barStyle="light-content" backgroundColor="#080415" />
        <SafeAreaView style={[styles.safeArea, { marginBottom: 62 + insets.bottom }]} edges={["top", "left", "right"]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <ProfileCanvasHeader
              username={username}
              isVerifiedUser={isVerifiedUser}
              triggerHaptic={triggerHaptic}
              onOpenCreate={() => setShowCreateModal(true)}
              onOpenSwitcher={() => setShowSwitcherModal(true)}
              onOpenWishlist={handleOpenWishlist}
            />

            <ProfileSummarySection
              displayLogo={displayLogo}
              profileName={profileName}
              username={username}
              category={category}
              bioText={bioText}
              websiteLink={websiteLink}
              tags={tags}
              postsCount={postsCount}
              followersCount={followersCount}
              followingCount={followingCount}
              auraScore={auraScore}
              hasActiveStory={hasActiveStory}
              isUploadingMedia={isUploadingMedia}
              isPersonalProfile={isPersonalProfile}
              isCreatorProfile={isCreatorProfile}
              isBusinessProfile={isBusinessProfile}
              highlights={highlights}
              activeProfile={activeProfile}
              currentUser={currentUser}
              triggerHaptic={triggerHaptic}
              onProfileAvatarTap={handleProfileAvatarTap}
              onAvatarPress={handleAvatarPress}
              onOpenFollowers={() => {
                triggerHaptic("light");
                setNetworkTab("followers");
                setShowNetworkModal(true);
              }}
              onOpenFollowing={() => {
                triggerHaptic("light");
                setNetworkTab("following");
                setShowNetworkModal(true);
              }}
              onRemoveTag={handleRemoveTag}
              onAddTag={handleAddPress}
              onEditProfile={handleEditProfilePress}
              onShareProfile={handleShareProfile}
              onOpenAddProduct={handleOpenAddProduct}
              onAddHighlight={handleAddHighlight}
              onNotesBubbleTap={() => setShowNoteModal(true)}
            />

            <ProfileContentGrid
              activeGridTab={activeGridTab}
              onTabChange={setActiveGridTab}
              visiblePresetPosts={visiblePresetPosts}
              visibleTaggedPosts={visibleTaggedPosts}
              displayProducts={displayProducts}
              productCollabProducts={productCollabProducts}
              showStoreLabelsOnProducts={showStoreLabelsOnProducts}
              triggerHaptic={triggerHaptic}
              onOpenGridItem={openGridItem}
              onSwitchToStore={handleSwitchToStoreFromProduct}
            />
          </ScrollView>
        </SafeAreaView>

        <ProfileScreenModals {...modals} />

        {/* Modal - Update Status Note on Profile Avatar Press */}
        <Modal
          visible={showNoteModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNoteModal(false)}
        >
          <View style={localProfileStyles.modalOverlay}>
            <View style={localProfileStyles.modalContent}>
              <Text style={localProfileStyles.modalTitle}>Share Today's Vibe</Text>
              <Text style={localProfileStyles.modalSubtitle}>Floating note bubble on your profile avatar</Text>
              
              <TextInput
                style={localProfileStyles.noteInput}
                placeholder="What's your vibe today?..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                maxLength={60}
                value={noteText}
                onChangeText={setNoteText}
                autoFocus
              />
              
              <Text style={localProfileStyles.charCount}>{noteText.length}/60</Text>

              <View style={localProfileStyles.modalButtons}>
                <TouchableOpacity
                  style={[localProfileStyles.modalBtn, localProfileStyles.cancelBtn]}
                  onPress={() => setShowNoteModal(false)}
                >
                  <Text style={localProfileStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[localProfileStyles.modalBtn, localProfileStyles.saveBtn]}
                  onPress={submitNote}
                  disabled={updatingNote}
                >
                  {updatingNote ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={localProfileStyles.saveBtnText}>Share vibe</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ErrorBoundary>
  );
}

const localProfileStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0d0b20",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  noteInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    padding: 16,
    fontSize: 15,
    height: 80,
  },
  charCount: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cancelBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#00f5ff",
  },
  saveBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
});
