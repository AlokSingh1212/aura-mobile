import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeModalStyles as modalStyles } from "@/components/home/homeModalStyles";

type HomeThreeDotsModalProps = {
  visible: boolean;
  isOwnPost: boolean;
  onClose: () => void;
  onAboutAccount: () => void;
  onSave: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onArchive: () => void;
  onInterested: () => void;
  onHidePost: () => void;
  onMute: () => void;
  onBlock: () => void;
  onNotInterested: () => void;
  onUnfollow: () => void;
  onReport: () => void;
};

export function HomeThreeDotsModal({
  visible,
  isOwnPost,
  onClose,
  onAboutAccount,
  onSave,
  onShare,
  onCopyLink,
  onArchive,
  onInterested,
  onHidePost,
  onMute,
  onBlock,
  onNotInterested,
  onUnfollow,
  onReport,
}: HomeThreeDotsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.bottomSheetBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={modalStyles.optionsBottomSheetContent} onStartShouldSetResponder={() => true}>
          <View style={modalStyles.bottomSheetDragHandle} />

          <View style={modalStyles.optionsGroupContainer}>
            {!isOwnPost ? (
              <>
                <TouchableOpacity style={modalStyles.optionRow} onPress={onAboutAccount}>
                  <Lucide name="person-circle-outline" size={24} color="#fff" />
                  <Text style={modalStyles.optionRowText}>About this account</Text>
                </TouchableOpacity>
                <View style={modalStyles.optionDivider} />
              </>
            ) : null}

            <TouchableOpacity style={modalStyles.optionRow} onPress={onSave}>
              <Lucide name="bookmark-outline" size={24} color="#fff" />
              <Text style={modalStyles.optionRowText}>Save to collection</Text>
            </TouchableOpacity>
            <View style={modalStyles.optionDivider} />

            <TouchableOpacity style={modalStyles.optionRow} onPress={onShare}>
              <Lucide name="share-social-outline" size={24} color="#fff" />
              <Text style={modalStyles.optionRowText}>Share to...</Text>
            </TouchableOpacity>
            <View style={modalStyles.optionDivider} />

            <TouchableOpacity style={modalStyles.optionRow} onPress={onCopyLink}>
              <Lucide name="link-outline" size={24} color="#fff" />
              <Text style={modalStyles.optionRowText}>Copy link</Text>
            </TouchableOpacity>

            {isOwnPost ? (
              <>
                <View style={modalStyles.optionDivider} />
                <TouchableOpacity style={modalStyles.optionRow} onPress={onArchive}>
                  <Lucide name="archive-outline" size={24} color="#fff" />
                  <Text style={modalStyles.optionRowText}>Archive</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          {!isOwnPost ? (
            <View style={modalStyles.optionsGroupContainer}>
              <TouchableOpacity style={modalStyles.optionRow} onPress={onInterested}>
                <Lucide name="checkmark-circle-outline" size={24} color="#fff" />
                <Text style={modalStyles.optionRowText}>Interested</Text>
              </TouchableOpacity>
              <View style={modalStyles.optionDivider} />

              <TouchableOpacity style={modalStyles.optionRow} onPress={onHidePost}>
                <Lucide name="eye-off-outline" size={24} color="#fff" />
                <Text style={modalStyles.optionRowText}>Hide post</Text>
              </TouchableOpacity>
              <View style={modalStyles.optionDivider} />

              <TouchableOpacity style={modalStyles.optionRow} onPress={onMute}>
                <Lucide name="volume-mute-outline" size={24} color="#fff" />
                <Text style={modalStyles.optionRowText}>Mute</Text>
              </TouchableOpacity>
              <View style={modalStyles.optionDivider} />

              <TouchableOpacity style={modalStyles.optionRow} onPress={onBlock}>
                <Lucide name="ban-outline" size={24} color="#fb923c" />
                <Text style={[modalStyles.optionRowText, { color: "#fb923c" }]}>Block</Text>
              </TouchableOpacity>
              <View style={modalStyles.optionDivider} />

              <TouchableOpacity style={modalStyles.optionRow} onPress={onNotInterested}>
                <Lucide name="close-circle-outline" size={24} color="#fff" />
                <Text style={modalStyles.optionRowText}>Not interested</Text>
              </TouchableOpacity>
              <View style={modalStyles.optionDivider} />

              <TouchableOpacity style={modalStyles.optionRow} onPress={onUnfollow}>
                <Lucide name="person-remove-outline" size={24} color="#fb923c" />
                <Text style={[modalStyles.optionRowText, { color: "#fb923c" }]}>Unfollow</Text>
              </TouchableOpacity>
              <View style={modalStyles.optionDivider} />

              <TouchableOpacity style={modalStyles.optionRow} onPress={onReport}>
                <Lucide name="alert-circle-outline" size={24} color="#ff3b30" />
                <Text style={[modalStyles.optionRowText, { color: "#ff3b30" }]}>Report post</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
