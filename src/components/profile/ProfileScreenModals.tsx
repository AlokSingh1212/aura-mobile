import React from "react";
import { Alert, Linking, Share } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { API_HOST } from "@/constants/api";
import { AuraBottomNav } from "@/components/shop/AuraBottomNav";
import type { StorySlide } from "@/lib/storyLayers";
import { sharePostToUser } from "@/lib/profileApi";
import { LiveShowroom } from "@/components/LiveShowroom";
import { ProfileGridViewer } from "@/components/profile/ProfileGridViewer";
import { CreateBrandProfileSheet } from "@/components/profile/CreateBrandProfileSheet";
import { AddProductSheet, type BrandStoreOption } from "@/components/profile/AddProductSheet";
import { ProfileNetworkModal } from "@/components/profile/ProfileNetworkModal";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ProfileSwitcherModal } from "@/components/profile/ProfileSwitcherModal";
import { ProfileCreateSheet } from "@/components/profile/ProfileCreateSheet";
import { ProfileShareSheet } from "@/components/profile/ProfileShareSheet";
import { ProfileCustomPromptModal } from "@/components/profile/ProfileCustomPromptModal";
import { ProfileWishlistModal } from "@/components/profile/ProfileWishlistModal";
import { ProfileMediaBusyOverlay } from "@/components/profile/ProfileMediaBusyOverlay";
import { ProfilePostCuratorModal } from "@/components/profile/ProfilePostCuratorModal";
import { ProfileAIModal } from "@/components/profile/ProfileAIModal";
import { ProfileAccountsCenterModal } from "@/components/profile/ProfileAccountsCenterModal";
import { ProfilePersonalDetailsModal } from "@/components/profile/ProfilePersonalDetailsModal";
import { ProfileStoryViewerModal } from "@/components/profile/ProfileStoryViewerModal";
import { ProfileQrModal } from "@/components/profile/ProfileQrModal";

export type ProfileScreenModalsProps = {
  insets: { top: number; bottom: number };
  showNetworkModal: boolean;
  setShowNetworkModal: (v: boolean) => void;
  networkTab: "followers" | "following";
  setNetworkTab: (v: "followers" | "following") => void;
  networkUsers: any[];
  loadingNetwork: boolean;
  followersCount: number;
  followingCount: number;
  activeProfile: any;
  triggerHaptic: (style: any) => void;
  handleNetworkFollowToggle: (item: any) => void;
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  logo: string | null;
  profileName: string;
  editUsername: string;
  editProfileName: string;
  editCategory: string;
  editBioText: string;
  editWebsiteLink: string;
  isSavingProfile: boolean;
  handleSaveProfile: () => void;
  handleAvatarPress: () => void;
  handleDeleteAvatar?: () => void;
  setEditUsername: (v: string) => void;
  setEditProfileName: (v: string) => void;
  setEditCategory: (v: string) => void;
  setEditBioText: (v: string) => void;
  setEditWebsiteLink: (v: string) => void;
  showSwitcherModal: boolean;
  setShowSwitcherModal: (v: boolean) => void;
  userProfiles: any[];
  handleSwitchMaison: (id: string) => void;
  handleAddBrandProfile: () => void;
  showCreateBrandSheet: boolean;
  setShowCreateBrandSheet: (v: boolean) => void;
  handleBrandProfileCreated: () => void;
  showAddProductSheet: boolean;
  setShowAddProductSheet: (v: boolean) => void;
  handleProductCreated: () => void;
  brandStoreOptions: BrandStoreOption[];
  isPersonalProfile: boolean;
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  queueCreateAction: (mode: any) => void;
  isOpeningPicker: boolean;
  isUploadingMedia: boolean;
  showPostModal: boolean;
  setShowPostModal: (v: boolean) => void;
  category: string;
  postTitle: string;
  postPrice: string;
  postDescription: string;
  postVibe: string;
  postImage: string;
  handlePublishPost: () => void;
  setPostTitle: (v: string) => void;
  setPostPrice: (v: string) => void;
  setPostDescription: (v: string) => void;
  setPostVibe: (v: string) => void;
  setPostImage: (v: string) => void;
  showLiveModal: boolean;
  setShowLiveModal: (v: boolean) => void;
  username: string;
  showAIModal: boolean;
  setShowAIModal: (v: boolean) => void;
  aiPrompt: string;
  aiProgress: number;
  aiGenerating: boolean;
  aiStep: string;
  generatedProduct: any;
  aiTitle: string;
  aiPrice: string;
  handleStartAIGeneration: () => void;
  handleMintGeneratedProduct: () => void;
  setGeneratedProduct: (v: any) => void;
  setAiPrompt: (v: string) => void;
  setAiTitle: (v: string) => void;
  setAiPrice: (v: string) => void;
  showAccountsCenter: boolean;
  setShowAccountsCenter: (v: boolean) => void;
  personalProfile: any;
  brandProfiles: any[];
  currentUser: any;
  activeSessions: any[];
  fediverseSharing: boolean;
  alertsEnabled: boolean;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  regionLockEnabled: boolean;
  handleDownloadInformation: () => void;
  handleDeactivateMaison: () => void;
  handleToggleFediverse: () => void;
  handleToggleAlerts: () => void;
  handleToggleBiometric: () => void;
  handleToggleTwoFactor: () => void;
  handleToggleRegionLock: () => void;
  handleRevokeSession: (id: string) => void;
  authLogOut: () => void;
  showPersonalDetails: boolean;
  setShowPersonalDetails: (v: boolean) => void;
  personalDob: string;
  personalGender: string;
  personalEmail: string;
  personalPhone: string;
  isVerifiedUser: boolean;
  isUpdating: boolean;
  handleSavePersonalDetails: () => void;
  handleRequestVerification: () => void;
  setPersonalDob: (v: string) => void;
  setPersonalGender: (v: string) => void;
  setPersonalEmail: (v: string) => void;
  setPersonalPhone: (v: string) => void;
  showShareProfileSheet: boolean;
  setShowShareProfileSheet: (v: boolean) => void;
  showQrModal: boolean;
  setShowQrModal: (v: boolean) => void;
  shareSearch: string;
  setShareSearch: (v: string) => void;
  shareContacts: any[];
  loadingShareContacts: boolean;
  addInstaStorySlide: (slide: any) => void;
  showStoryViewer: boolean;
  setShowStoryViewer: (v: boolean) => void;
  displayLogo: string | null;
  yourStorySlides: any[];
  storyViewerIndex: number;
  setStoryViewerIndex: React.Dispatch<React.SetStateAction<number>>;
  promptVisible: boolean;
  promptTitle: string;
  promptDesc: string;
  promptPlaceholder: string;
  promptValue: string;
  setPromptValue: (v: string) => void;
  setPromptVisible: (v: boolean) => void;
  promptOnSubmit: ((val: string) => void) | null;
  showWishlistModal: boolean;
  setShowWishlistModal: (v: boolean) => void;
  wishlist: any[];
  addToCart: (item: any) => void;
  toggleWishlist: (uid: string, id: string) => void;
  gridViewer: any;
  closeGridViewer: () => void;
  visiblePresetPosts: any[];
  visibleTaggedPosts: any[];
  productCollabProducts: any[];
  displayProducts: any[];
  setPresetPosts: React.Dispatch<React.SetStateAction<any[]>>;
  loadProfileFromServer: () => Promise<void>;
};

export function ProfileScreenModals({
  insets,
  showNetworkModal,
  setShowNetworkModal,
  networkTab,
  setNetworkTab,
  networkUsers,
  loadingNetwork,
  followersCount,
  followingCount,
  activeProfile,
  triggerHaptic,
  handleNetworkFollowToggle,
  showEditModal,
  setShowEditModal,
  logo,
  profileName,
  editUsername,
  editProfileName,
  editCategory,
  editBioText,
  editWebsiteLink,
  isSavingProfile,
  handleSaveProfile,
  handleAvatarPress,
  handleDeleteAvatar,
  setEditUsername,
  setEditProfileName,
  setEditCategory,
  setEditBioText,
  setEditWebsiteLink,
  showSwitcherModal,
  setShowSwitcherModal,
  userProfiles,
  handleSwitchMaison,
  handleAddBrandProfile,
  showCreateBrandSheet,
  setShowCreateBrandSheet,
  handleBrandProfileCreated,
  showAddProductSheet,
  setShowAddProductSheet,
  handleProductCreated,
  brandStoreOptions,
  isPersonalProfile,
  showCreateModal,
  setShowCreateModal,
  queueCreateAction,
  isOpeningPicker,
  isUploadingMedia,
  showPostModal,
  setShowPostModal,
  category,
  postTitle,
  postPrice,
  postDescription,
  postVibe,
  postImage,
  handlePublishPost,
  setPostTitle,
  setPostPrice,
  setPostDescription,
  setPostVibe,
  setPostImage,
  showLiveModal,
  setShowLiveModal,
  username,
  showAIModal,
  setShowAIModal,
  aiPrompt,
  aiProgress,
  aiGenerating,
  aiStep,
  generatedProduct,
  aiTitle,
  aiPrice,
  handleStartAIGeneration,
  handleMintGeneratedProduct,
  setGeneratedProduct,
  setAiPrompt,
  setAiTitle,
  setAiPrice,
  showAccountsCenter,
  setShowAccountsCenter,
  personalProfile,
  brandProfiles,
  currentUser,
  activeSessions,
  fediverseSharing,
  alertsEnabled,
  biometricEnabled,
  twoFactorEnabled,
  regionLockEnabled,
  handleDownloadInformation,
  handleDeactivateMaison,
  handleToggleFediverse,
  handleToggleAlerts,
  handleToggleBiometric,
  handleToggleTwoFactor,
  handleToggleRegionLock,
  handleRevokeSession,
  authLogOut,
  showPersonalDetails,
  setShowPersonalDetails,
  personalDob,
  personalGender,
  personalEmail,
  personalPhone,
  isVerifiedUser,
  isUpdating,
  handleSavePersonalDetails,
  handleRequestVerification,
  setPersonalDob,
  setPersonalGender,
  setPersonalEmail,
  setPersonalPhone,
  showShareProfileSheet,
  setShowShareProfileSheet,
  showQrModal,
  setShowQrModal,
  shareSearch,
  setShareSearch,
  shareContacts,
  loadingShareContacts,
  addInstaStorySlide,
  showStoryViewer,
  setShowStoryViewer,
  displayLogo,
  yourStorySlides,
  storyViewerIndex,
  setStoryViewerIndex,
  promptVisible,
  promptTitle,
  promptDesc,
  promptPlaceholder,
  promptValue,
  setPromptValue,
  setPromptVisible,
  promptOnSubmit,
  showWishlistModal,
  setShowWishlistModal,
  wishlist,
  addToCart,
  toggleWishlist,
  gridViewer,
  closeGridViewer,
  visiblePresetPosts,
  visibleTaggedPosts,
  productCollabProducts,
  displayProducts,
  setPresetPosts,
  loadProfileFromServer
}: ProfileScreenModalsProps) {

  return (
    <>
      <ProfileNetworkModal
        visible={showNetworkModal}
        networkTab={networkTab}
        networkUsers={networkUsers}
        loadingNetwork={loadingNetwork}
        followersCount={followersCount}
        followingCount={followingCount}
        activeProfileId={activeProfile?.id}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowNetworkModal(false)}
        onTabChange={setNetworkTab}
        onFollowToggle={handleNetworkFollowToggle}
      />

      <ProfileEditModal
        visible={showEditModal}
        topInset={insets.top}
        bottomInset={insets.bottom}
        logo={logo}
        profileName={profileName}
        editUsername={editUsername}
        editProfileName={editProfileName}
        editCategory={editCategory}
        editBioText={editBioText}
        editWebsiteLink={editWebsiteLink}
        isSavingProfile={isSavingProfile}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
        onAvatarPress={handleAvatarPress}
        onRemoveAvatar={handleDeleteAvatar}
        setEditUsername={setEditUsername}
        setEditProfileName={setEditProfileName}
        setEditCategory={setEditCategory}
        setEditBioText={setEditBioText}
        setEditWebsiteLink={setEditWebsiteLink}
      />

      <ProfileSwitcherModal
        visible={showSwitcherModal}
        userProfiles={userProfiles}
        activeProfileId={activeProfile?.id}
        onClose={() => setShowSwitcherModal(false)}
        onSwitchProfile={handleSwitchMaison}
        onAddBrandProfile={handleAddBrandProfile}
      />

      <CreateBrandProfileSheet
        visible={showCreateBrandSheet}
        onClose={() => setShowCreateBrandSheet(false)}
        onCreated={handleBrandProfileCreated}
      />

      <AddProductSheet
        visible={showAddProductSheet}
        onClose={() => setShowAddProductSheet(false)}
        onCreated={handleProductCreated}
        brandStores={brandStoreOptions}
        defaultStoreId={
          activeProfile?.type === "BUSINESS" ? activeProfile.id : null
        }
        showStorePicker={isPersonalProfile || brandStoreOptions.length > 1}
      />

      <ProfileCreateSheet
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelectAction={queueCreateAction}
      />

            <ProfileMediaBusyOverlay
        visible={isOpeningPicker || isUploadingMedia}
        isOpeningPicker={isOpeningPicker}
        isUploadingMedia={isUploadingMedia}
      />

            <ProfilePostCuratorModal
        visible={showPostModal}
        topInset={insets.top}
        category={category}
        postTitle={postTitle}
        postPrice={postPrice}
        postDescription={postDescription}
        postVibe={postVibe}
        postImage={postImage}
        isUploadingMedia={isUploadingMedia}
        onClose={() => setShowPostModal(false)}
        onPublish={handlePublishPost}
        setPostTitle={setPostTitle}
        setPostPrice={setPostPrice}
        setPostDescription={setPostDescription}
        setPostVibe={setPostVibe}
        setPostImage={setPostImage}
      />

      {/* 📡 FUNCTIONAL PORTAL 2: LIVE BROADCAST ATELIER SHOWROOM */}
      <LiveShowroom
        visible={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        initialMode="broadcaster"
        skipLobby
        maisonId={username}
        maisonName={profileName}
      />

            <ProfileAIModal
        visible={showAIModal}
        topInset={insets.top}
        aiPrompt={aiPrompt}
        aiProgress={aiProgress}
        aiGenerating={aiGenerating}
        aiStep={aiStep}
        generatedProduct={generatedProduct}
        aiTitle={aiTitle}
        aiPrice={aiPrice}
        onClose={() => {
          setShowAIModal(false);
          setGeneratedProduct(null);
        }}
        onStartGeneration={handleStartAIGeneration}
        onMintProduct={handleMintGeneratedProduct}
        onRegenerate={() => setGeneratedProduct(null)}
        setAiPrompt={setAiPrompt}
        setAiTitle={setAiTitle}
        setAiPrice={setAiPrice}
      />

            <ProfileAccountsCenterModal
        visible={showAccountsCenter}
        topInset={insets.top}
        personalProfile={personalProfile}
        brandProfiles={brandProfiles}
        activeProfileId={activeProfile?.id}
        currentUserName={currentUser?.name}
        activeSessions={activeSessions}
        fediverseSharing={fediverseSharing}
        alertsEnabled={alertsEnabled}
        biometricEnabled={biometricEnabled}
        twoFactorEnabled={twoFactorEnabled}
        regionLockEnabled={regionLockEnabled}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowAccountsCenter(false)}
        onSwitchProfile={handleSwitchMaison}
        onOpenPersonalDetails={() => setShowPersonalDetails(true)}
        onOpenBusinessSuite={() => {
          setShowAccountsCenter(false);
          router.push("/maison/business-suite");
        }}
        onDownloadInformation={handleDownloadInformation}
        onDeactivateMaison={handleDeactivateMaison}
        onToggleFediverse={handleToggleFediverse}
        onToggleAlerts={handleToggleAlerts}
        onToggleBiometric={handleToggleBiometric}
        onToggleTwoFactor={handleToggleTwoFactor}
        onToggleRegionLock={handleToggleRegionLock}
        onRevokeSession={handleRevokeSession}
        onOpenOnboarding={() => Linking.openURL(`${API_HOST}/discover/onboarding`)}
        onLogout={() => {
          authLogOut();
          setShowAccountsCenter(false);
          Alert.alert("Session Revoked", "Logged out of your active AURA mesh identity node successfully.");
          router.replace("/login");
        }}
      />

            <ProfilePersonalDetailsModal
        visible={showPersonalDetails}
        topInset={insets.top}
        personalDob={personalDob}
        personalGender={personalGender}
        personalEmail={personalEmail}
        personalPhone={personalPhone}
        isVerifiedUser={isVerifiedUser}
        isUpdating={isUpdating}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowPersonalDetails(false)}
        onSave={handleSavePersonalDetails}
        onRequestVerification={handleRequestVerification}
        setPersonalDob={setPersonalDob}
        setPersonalGender={setPersonalGender}
        setPersonalEmail={setPersonalEmail}
        setPersonalPhone={setPersonalPhone}
      />

      <ProfileShareSheet
        visible={showShareProfileSheet}
        onClose={() => setShowShareProfileSheet(false)}
        shareSearch={shareSearch}
        onShareSearchChange={setShareSearch}
        contacts={shareContacts}
        loadingContacts={loadingShareContacts}
        onAddFriend={() => {
          triggerHaptic("light");
          Alert.alert("Contacts Synced", "Your dynamic contact nodes have been successfully synchronized.");
        }}
        onShareToContact={async (contact) => {
          triggerHaptic("success");
          if (!currentUser?.id || !contact.userId) {
            Alert.alert("Sign in required", "Sign in and follow people to share via DM.");
            return;
          }
          setShowShareProfileSheet(false);
          try {
            const profileUrl = `https://aura.app/${username}`;
            const result = await sharePostToUser({
              senderId: currentUser.id,
              receiverUserId: contact.userId,
              postId: `profile_${activeProfile?.id || currentUser.id}`,
              postUrl: profileUrl,
              caption: `Check out my profile @${username}`,
            });
            if (result.success) {
              Alert.alert("Sent", `Profile shared with ${contact.name}`);
            } else {
              Alert.alert("Could not send", result.error || "Try again");
            }
          } catch {
            Alert.alert("Could not send", "Network error");
          }
        }}
        onCopyLink={async () => {
          triggerHaptic("success");
          setShowShareProfileSheet(false);
          const profileUrl = `${API_HOST}/maison/${username}`;
          try {
            await Clipboard.setStringAsync(profileUrl);
            Alert.alert("Link Copied", "Instant match! The luxury profile coordinates have been copied to your clipboard.");
          } catch (e) {
            console.warn("Clipboard copy failed:", e);
            Alert.alert("Link Copied", `Coordinate: ${profileUrl}`);
          }
        }}
        onAddToStory={() => {
          triggerHaptic("success");
          setShowShareProfileSheet(false);
          const newSlide = {
            id: `ys_${Date.now()}`,
            url: logo || "https://auragram.com/logo.png",
            caption: `Check out my official AURA profile coordinates ✨: "${profileName}" (@${username})`,
            isVideo: false,
            artifact: null,
          };
          addInstaStorySlide(newSlide);
          Alert.alert("Story Shared", "Profile shared successfully to your Stories feed! View it at the top of your home screen.");
        }}
        onWhatsApp={() => {
          triggerHaptic("success");
          setShowShareProfileSheet(false);
          const profileUrl = `${API_HOST}/maison/${username}`;
          const textMsg = `Connect with me on AURA: "${profileName}" (@${username}) ✨\n\nLink: ${profileUrl}`;
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(textMsg)}`;
          Linking.openURL(whatsappUrl).catch(() => {
            Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`);
          });
        }}
        onInstagram={() => {
          triggerHaptic("success");
          setShowShareProfileSheet(false);
          Linking.openURL("instagram://camera").catch(() => {
            Linking.openURL("https://instagram.com");
          });
        }}
        onTelegram={() => {
          triggerHaptic("success");
          setShowShareProfileSheet(false);
          const profileUrl = `${API_HOST}/maison/${username}`;
          const textMsg = `Connect with me on AURA: "${profileName}" (@${username}) ✨\n\nLink: ${profileUrl}`;
          const telegramUrl = `tg://msg?text=${encodeURIComponent(textMsg)}`;
          Linking.openURL(telegramUrl).catch(() => {
            Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(textMsg)}`);
          });
        }}
        onNativeShare={() => {
          triggerHaptic("success");
          setShowShareProfileSheet(false);
          const profileUrl = `${API_HOST}/maison/${username}`;
          const textMsg = `Connect with me on AURA: "${profileName}" (@${username}) ✨`;
          Share.share({
            message: `${textMsg}\n\nLink: ${profileUrl}`,
            url: profileUrl,
            title: "AURA Profile coordinates",
          }).catch((err) => {
            console.warn("Native share failed:", err);
          });
        }}
        onShowQr={() => {
          triggerHaptic("light");
          setShowShareProfileSheet(false);
          setShowQrModal(true);
        }}
      />

      <ProfileQrModal
        visible={showQrModal}
        username={username}
        profileName={profileName}
        avatarUrl={displayLogo}
        onClose={() => setShowQrModal(false)}
        triggerHaptic={triggerHaptic}
      />

      <AuraBottomNav activeTab="profile" />

            <ProfileStoryViewerModal
        visible={showStoryViewer}
        topInset={insets.top}
        bottomInset={insets.bottom}
        username={username}
        profileLogo={displayLogo}
        storySlides={yourStorySlides as StorySlide[]}
        viewerIndex={storyViewerIndex}
        userId={currentUser?.id}
        onClose={() => setShowStoryViewer(false)}
        setViewerIndex={setStoryViewerIndex}
        onOpenProfile={(uname) => router.push(`/profile/${uname}` as any)}
        onOpenProduct={(productId) =>
          router.push(`/shop/all-products?productId=${encodeURIComponent(productId)}` as any)
        }
        onCreateStory={() => router.push("/create/story")}
      />

      <ProfileCustomPromptModal
        visible={promptVisible}
        title={promptTitle}
        description={promptDesc}
        placeholder={promptPlaceholder}
        value={promptValue}
        onChangeText={setPromptValue}
        onClose={() => setPromptVisible(false)}
        onSubmit={() => {
          setPromptVisible(false);
          if (promptOnSubmit) {
            promptOnSubmit(promptValue);
          }
        }}
      />

      <ProfileWishlistModal
        visible={showWishlistModal}
        wishlist={wishlist}
        onClose={() => setShowWishlistModal(false)}
        onOpenProduct={(productId) => {
          setShowWishlistModal(false);
          router.push(`/product/${productId}`);
        }}
        onMoveToCart={(item) => {
          addToCart(item);
          const uid = currentUser?.id || activeProfile?.userId;
          if (uid) {
            toggleWishlist(uid, item.id);
          }
          triggerHaptic("success");
          Alert.alert("Artifact Moved", "Added to your checkout casket.");
        }}
        onRemove={(item) => {
          const uid = currentUser?.id || activeProfile?.userId;
          if (uid) {
            toggleWishlist(uid, item.id);
          }
          triggerHaptic("light");
        }}
      />

      <ProfileGridViewer
        visible={gridViewer.visible}
        onClose={closeGridViewer}
        tab={gridViewer.tab}
        initialItemId={gridViewer.initialItemId}
        profile={{
          username,
          name: profileName,
          logo: displayLogo,
          profileId: activeProfile?.id,
        }}
        posts={gridViewer.tab === "tagged" ? visibleTaggedPosts : visiblePresetPosts}
        products={gridViewer.tab === "collabs" ? productCollabProducts : displayProducts}
        isOwnProfile
        onPostDeleted={(postId) => {
          setPresetPosts((prev) => {
            const next = prev.filter((p) => p.id !== postId);
            if (next.length === 0) closeGridViewer();
            return next;
          });
          loadProfileFromServer();
        }}
        onPostArchived={(postId) => {
          setPresetPosts((prev) => {
            const next = prev.filter((p) => p.id !== postId);
            if (next.length === 0) closeGridViewer();
            return next;
          });
        }}
      />
    </>
  );
}
