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
  Dimensions,
} from "react-native";
import { profilePortalStyles as portalStyles } from "@/components/profile/profilePortalStyles";

const { width } = Dimensions.get("window");

const STOCK_TEXTURES = [
  "https://auragram.com/logo.png",
  "https://auragram.com/logo.png",
  "https://auragram.com/logo.png",
  "https://auragram.com/logo.png",
];

type ProfilePostCuratorModalProps = {
  visible: boolean;
  topInset: number;
  category: string;
  postTitle: string;
  postPrice: string;
  postDescription: string;
  postVibe: string;
  postImage: string;
  isUploadingMedia: boolean;
  onClose: () => void;
  onPublish: () => void;
  setPostTitle: (v: string) => void;
  setPostPrice: (v: string) => void;
  setPostDescription: (v: string) => void;
  setPostVibe: (v: string) => void;
  setPostImage: (v: string) => void;
};

export function ProfilePostCuratorModal({
  visible,
  topInset,
  category,
  postTitle,
  postPrice,
  postDescription,
  postVibe,
  postImage,
  isUploadingMedia,
  onClose,
  onPublish,
  setPostTitle,
  setPostPrice,
  setPostDescription,
  setPostVibe,
  setPostImage,
}: ProfilePostCuratorModalProps) {
  return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={[portalStyles.editModalContainer, { paddingTop: topInset }]}>
          <View style={{ flex: 1 }}>
            <View style={portalStyles.editModalNavBar}>
              <TouchableOpacity onPress={onClose}>
                <Text style={portalStyles.editModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={portalStyles.editModalTitle}>{category === "Personal Profile" ? "New Look Post" : "Curate Artifact"}</Text>
              <TouchableOpacity onPress={onPublish} disabled={isUploadingMedia}>
                {isUploadingMedia ? (
                  <ActivityIndicator size="small" color="#00f5ff" />
                ) : (
                  <Text style={portalStyles.editModalDoneText}>Publish</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={portalStyles.editModalScroll} showsVerticalScrollIndicator={false}>
              {category === "Personal Profile" ? (
                // 👥 Personal Look/Post inputs
                <View style={portalStyles.inputGroup}>
                  <Text style={portalStyles.inputLabel}>Caption / Description</Text>
                  <TextInput
                    style={[portalStyles.inputField, { height: 80, textAlignVertical: "top" }]}
                    value={postTitle}
                    onChangeText={setPostTitle}
                    multiline
                    numberOfLines={3}
                    placeholder="Write a caption for your aesthetic look..."
                    placeholderTextColor="#8e8e8e"
                  />
                </View>
              ) : (
                // 🏛️ Brand Boutique Product inputs
                <>
                  <View style={portalStyles.inputGroup}>
                    <Text style={portalStyles.inputLabel}>Product Title</Text>
                    <TextInput
                      style={portalStyles.inputField}
                      value={postTitle}
                      onChangeText={setPostTitle}
                      placeholder="e.g. Atelier Silk Drape Vestment"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={portalStyles.inputGroup}>
                    <Text style={portalStyles.inputLabel}>Retail Price (INR)</Text>
                    <TextInput
                      style={portalStyles.inputField}
                      value={postPrice}
                      onChangeText={postPrice => setPostPrice(postPrice.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="e.g. 185000"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={portalStyles.inputGroup}>
                    <Text style={portalStyles.inputLabel}>Aesthetic / Vibe Profile</Text>
                    <TextInput
                      style={portalStyles.inputField}
                      value={postVibe}
                      onChangeText={setPostVibe}
                      placeholder="e.g. Cyberpunk, Brutalist, Quiet Luxury"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={portalStyles.inputGroup}>
                    <Text style={portalStyles.inputLabel}>Description / Curation Notes</Text>
                    <TextInput
                      style={[portalStyles.inputField, { height: 70, textAlignVertical: "top" }]}
                      value={postDescription}
                      onChangeText={setPostDescription}
                      multiline
                      numberOfLines={3}
                      placeholder="Bespoke luxury drape fabric elements..."
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>
                </>
              )}

              {postImage && !postImage.includes("images.unsplash.com") ? (
                <View style={{ marginBottom: 20, alignItems: "center" }}>
                  <Image
                    source={{ uri: postImage }}
                    style={{
                      width: width - 48,
                      height: (width - 48) * 1.05,
                      borderRadius: 12,
                      backgroundColor: "#111",
                    }}
                    resizeMode="cover"
                  />
                  <Text style={{ color: "#8e8e8e", fontSize: 12, marginTop: 8 }}>
                    Selected from your gallery
                  </Text>
                </View>
              ) : null}

              <Text style={[portalStyles.inputLabel, { marginTop: 10, marginBottom: 12 }]}>
                {postImage && !postImage.includes("images.unsplash.com")
                  ? "Or pick a stock texture"
                  : "Select Design Texture Image"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 40 }}>
                {[
                  "https://auragram.com/logo.png",
                  "https://auragram.com/logo.png",
                  "https://auragram.com/logo.png",
                  "https://auragram.com/logo.png"
                ].map((url, i) => {
                  const isSelected = postImage === url;
                  return (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setPostImage(url)}
                      style={{ marginRight: 10, borderWidth: 2, borderColor: isSelected ? "#00f5ff" : "transparent", borderRadius: 8, overflow: "hidden" }}
                    >
                      <Image source={{ uri: url }} style={{ width: 80, height: 80 }} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </Modal>

  );
}
