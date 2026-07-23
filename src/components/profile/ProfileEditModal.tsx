import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { profileHeaderStyles as styles } from "@/components/profile/profileHeaderStyles";

type ProfileEditModalProps = {
  visible: boolean;
  topInset: number;
  bottomInset: number;
  logo: string | null;
  profileName: string;
  editUsername: string;
  editProfileName: string;
  editCategory: string;
  editBioText: string;
  editWebsiteLink: string;
  isSavingProfile: boolean;
  triggerHaptic: (style: any) => void;
  onClose: () => void;
  onSave: () => void;
  onAvatarPress: () => void;
  onRemoveAvatar?: () => void;
  setEditUsername: (v: string) => void;
  setEditProfileName: (v: string) => void;
  setEditCategory: (v: string) => void;
  setEditBioText: (v: string) => void;
  setEditWebsiteLink: (v: string) => void;
};

export function ProfileEditModal({
  visible,
  topInset,
  bottomInset,
  logo,
  profileName,
  editUsername,
  editProfileName,
  editCategory,
  editBioText,
  editWebsiteLink,
  isSavingProfile,
  triggerHaptic,
  onClose,
  onSave,
  onAvatarPress,
  onRemoveAvatar,
  setEditUsername,
  setEditProfileName,
  setEditCategory,
  setEditBioText,
  setEditWebsiteLink,
}: ProfileEditModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.editModalContainer, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <View style={styles.editModalNavBar}>
          <TouchableOpacity onPress={() => { triggerHaptic("light"); onClose(); }}>
            <Text style={styles.editModalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.editModalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={onSave} disabled={isSavingProfile}>
            {isSavingProfile ? (
              <ActivityIndicator size="small" color="#00f5ff" />
            ) : (
              <Text style={styles.editModalDoneText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.editModalAvatarContainer}>
            <View style={styles.editModalAvatarCircle}>
              {logo ? (
                <Image source={{ uri: logo }} style={{ width: "100%", height: "100%", borderRadius: 40 }} />
              ) : (
                <Text style={styles.editModalAvatarText}>{profileName[0]?.toUpperCase() || "R"}</Text>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
              <TouchableOpacity onPress={onAvatarPress}>
                <Text style={styles.editModalChangeAvatarText}>Change profile photo</Text>
              </TouchableOpacity>
              {logo ? (
                <TouchableOpacity onPress={onRemoveAvatar || onAvatarPress}>
                  <Text style={[styles.editModalChangeAvatarText, { color: "#ff3b30" }]}>Remove photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.inputField}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="e.g. rare_raven"
              placeholderTextColor="#8e8e8e"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.inputField}
              value={editProfileName}
              onChangeText={setEditProfileName}
              placeholder="e.g. Rare Raven"
              placeholderTextColor="#8e8e8e"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.inputField}
              value={editCategory}
              onChangeText={setEditCategory}
              placeholder="e.g. Clothing (Brand)"
              placeholderTextColor="#8e8e8e"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.inputField, { height: 80, textAlignVertical: "top" }]}
              value={editBioText}
              onChangeText={setEditBioText}
              multiline
              numberOfLines={4}
              placeholder="Streetwear + Gen Z Aesthetic..."
              placeholderTextColor="#8e8e8e"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.inputField}
              value={editWebsiteLink}
              onChangeText={setEditWebsiteLink}
              placeholder="e.g. clothikoo.in"
              placeholderTextColor="#8e8e8e"
            />
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}
