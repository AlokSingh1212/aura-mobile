import React from "react";
import { PostAudioSheet } from "@/components/create/PostAudioSheet";
import type { AudioTrack } from "@/lib/audioLibrary";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (track: AudioTrack) => void;
};

export function StoryMusicPicker({ visible, onClose, onSelect }: Props) {
  return (
    <PostAudioSheet
      visible={visible}
      onClose={onClose}
      onSelect={(track) => {
        onSelect(track);
        onClose();
      }}
    />
  );
}
