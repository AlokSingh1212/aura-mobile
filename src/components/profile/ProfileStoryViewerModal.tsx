import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { StoryViewerSlide } from "@/components/stories/StoryViewerSlide";
import type { StorySlide } from "@/lib/storyLayers";

type ProfileStoryViewerModalProps = {
  visible: boolean;
  topInset: number;
  bottomInset: number;
  username: string;
  profileLogo: string | null;
  storySlides: StorySlide[];
  viewerIndex: number;
  userId?: string;
  onClose: () => void;
  setViewerIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpenProfile: (username: string) => void;
  onOpenProduct: (productId: string) => void;
  onCreateStory: () => void;
};

export function ProfileStoryViewerModal({
  visible,
  topInset,
  bottomInset,
  username,
  profileLogo,
  storySlides,
  viewerIndex,
  userId,
  onClose,
  setViewerIndex,
  onOpenProfile,
  onOpenProduct,
  onCreateStory,
}: ProfileStoryViewerModalProps) {
  return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <StatusBar barStyle="light-content" />
          <View style={{ paddingTop: topInset + 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {profileLogo ? (
                <Image source={{ uri: profileLogo }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              ) : null}
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{username}</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Just now</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            {storySlides[viewerIndex] ? (
              <StoryViewerSlide
                slide={storySlides[viewerIndex] as StorySlide}
                userId={userId}
                onOpenProfile={(uname) => onOpenProfile(uname)}
                onOpenProduct={(productId) =>
                  onOpenProduct(productId)
                }
              />
            ) : null}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: bottomInset + 16 }}>
            <TouchableOpacity
              disabled={viewerIndex <= 0}
              onPress={() => setViewerIndex((i) => Math.max(0, i - 1))}
            >
              <Lucide name="chevron-back" size={28} color={viewerIndex <= 0 ? "rgba(255,255,255,0.2)" : "#fff"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onCreateStory()}>
              <Lucide name="add-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={viewerIndex >= storySlides.length - 1}
              onPress={() => setViewerIndex((i) => Math.min(storySlides.length - 1, i + 1))}
            >
              <Lucide name="chevron-forward" size={28} color={viewerIndex >= storySlides.length - 1 ? "rgba(255,255,255,0.2)" : "#fff"} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

  );
}
