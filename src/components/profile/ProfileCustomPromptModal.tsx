import React from "react";
import { Modal, View, Text, TouchableOpacity, TextInput } from "react-native";
import { profileModalStyles as styles } from "@/components/profile/profileModalStyles";

type ProfileCustomPromptModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ProfileCustomPromptModal({
  visible,
  title,
  description,
  placeholder,
  value,
  onChangeText,
  onClose,
  onSubmit,
}: ProfileCustomPromptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.promptOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.promptContainer} onStartShouldSetResponder={() => true}>
          <Text style={styles.promptTitle}>{title}</Text>
          {description ? <Text style={styles.promptDesc}>{description}</Text> : null}
          <TextInput
            style={styles.promptInput}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={value}
            onChangeText={onChangeText}
            keyboardAppearance="dark"
            autoFocus
          />
          <View style={styles.promptActionRow}>
            <TouchableOpacity style={[styles.promptButton, styles.promptCancelButton]} onPress={onClose}>
              <Text style={styles.promptCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.promptButton, styles.promptSubmitButton]} onPress={onSubmit}>
              <Text style={styles.promptSubmitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
