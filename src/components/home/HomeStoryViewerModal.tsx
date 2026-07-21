import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { StoryViewerSlide } from "@/components/stories/StoryViewerSlide";
import { AddYoursStorySticker } from "@/components/stories/AddYoursStorySticker";
import type { StorySlide } from "@/lib/storyLayers";
import type { AddYoursMeta } from "@/lib/storyTemplateApi";
import { homeModalStyles as modalStyles } from "@/components/home/homeModalStyles";

export type StoriesGroup = {
  username: string;
  avatar: string;
  slides?: StorySlide[];
};

type HomeStoryViewerModalProps = {
  storiesGroup: StoriesGroup | null;
  activeSlideIndex: number;
  storyProgress: number;
  storyPaused: boolean;
  storyReplyText: string;
  activeSlideAddYours: AddYoursMeta | null;
  userId?: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  setStoryPaused: (paused: boolean) => void;
  setStoryReplyText: (text: string) => void;
  onSendReply: () => void;
  onOpenProfile: (username: string) => void;
  onOpenProduct: (productId: string) => void;
  onQuestionPress: (question: string) => void;
  onAddYoursPress: () => void;
  onAddYoursStickerPress: () => void;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
};

export function HomeStoryViewerModal({
  storiesGroup,
  activeSlideIndex,
  storyProgress,
  storyPaused,
  storyReplyText,
  activeSlideAddYours,
  userId,
  onClose,
  onPrev,
  onNext,
  setStoryPaused,
  setStoryReplyText,
  onSendReply,
  onOpenProfile,
  onOpenProduct,
  onQuestionPress,
  onAddYoursPress,
  onAddYoursStickerPress,
  triggerHaptic,
}: HomeStoryViewerModalProps) {
  if (!storiesGroup) return null;
  return (
        <Modal 
          visible={!!storiesGroup} 
          transparent 
          animationType="fade"
          onRequestClose={onClose}
        >
          <View style={modalStyles.storyModalContainer}>
            {/* Tap controls left/right — long press to pause story */}
            <TouchableOpacity 
              style={[modalStyles.storyTapDetector, { left: 0 }]} 
              activeOpacity={1}
              onPress={onPrev}
              onPressIn={() => setStoryPaused(true)}
              onPressOut={() => setStoryPaused(false)}
              delayLongPress={150}
            />
            <TouchableOpacity 
              style={[modalStyles.storyTapDetector, { right: 0 }]} 
              activeOpacity={1}
              onPress={onNext}
              onPressIn={() => setStoryPaused(true)}
              onPressOut={() => setStoryPaused(false)}
              delayLongPress={150}
            />

            <SafeAreaView style={modalStyles.storyModalSafe}>
              {/* Progress bars strip — hidden when story is paused (hold-to-inspect) */}
              {!storyPaused && (
                <View style={modalStyles.storyProgressStrip}>
                  {(storiesGroup.slides || []).map((slide: any, idx: number) => {
                    let widthPercent = 0;
                    if (idx < activeSlideIndex) widthPercent = 100;
                    else if (idx === activeSlideIndex) widthPercent = storyProgress;
                    
                    return (
                      <View key={slide.id} style={modalStyles.storyProgressBarBg}>
                        <View style={[modalStyles.storyProgressBarFill, { width: `${widthPercent}%` }]} />
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Story Header */}
              <View style={modalStyles.storyModalHeader}>
                <TouchableOpacity 
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  onPress={() => onOpenProfile(storiesGroup.username)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: storiesGroup.avatar }} style={modalStyles.storyHeaderAvatar} />
                  <Text style={modalStyles.storyHeaderUsername}>{storiesGroup.username}</Text>
                  <Text style={modalStyles.storyHeaderTime}>12h</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { triggerHaptic("light"); onClose(); }}>
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Slide with interactive sticker layers */}
              <View style={modalStyles.storySlideContent}>
                {storiesGroup.slides?.[activeSlideIndex] ? (
                  <StoryViewerSlide
                    slide={storiesGroup.slides[activeSlideIndex] as StorySlide}
                    userId={userId}
                    onOpenProfile={onOpenProfile}
                    onOpenProduct={(productId) => {
                      triggerHaptic("light");
                      onOpenProduct(productId);
                    }}
                    onQuestionPress={onQuestionPress}
                    onAddYoursPress={() => {
                      triggerHaptic("light");
                      if (activeSlideAddYours?.templateId) {
                        onAddYoursStickerPress();
                      } else {
                        onAddYoursPress();
                      }
                    }}
                  />
                ) : null}

                {storiesGroup.slides?.[activeSlideIndex]?.caption && (
                  <View style={modalStyles.storySlideCaptionOverlay}>
                    <Text style={modalStyles.storySlideCaptionText}>
                      {storiesGroup.slides[activeSlideIndex].caption}
                    </Text>
                  </View>
                )}

                {activeSlideAddYours &&
                !storyPaused &&
                !(storiesGroup.slides?.[activeSlideIndex] as StorySlide)?.storyLayers?.some(
                  (l) => l.type === "add_yours"
                ) ? (
                  <AddYoursStorySticker
                    addYours={activeSlideAddYours}
                    onPress={() => {
                      triggerHaptic("light");
                      onAddYoursStickerPress();
                    }}
                  />
                ) : null}
              </View>

              {/* Message Reply Keyboard footer — hidden when paused */}
              {!storyPaused && (
                <View style={modalStyles.storyReplyFooter}>
                  <TextInput
                    style={modalStyles.storyReplyInput}
                    placeholder={`Reply to ${storiesGroup.username}...`}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={storyReplyText}
                    onChangeText={setStoryReplyText}
                    onSubmitEditing={onSendReply}
                  />
                  <TouchableOpacity onPress={onSendReply} style={modalStyles.storyReplySendBtn}>
                    <Lucide name="paper-plane-outline" size={23} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

            </SafeAreaView>
          </View>
        </Modal>
  );
}
