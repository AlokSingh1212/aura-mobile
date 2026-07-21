import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "@/components/ui/Avatar";

type ChatThreadAvatarProps = {
  thread: { name: string; username?: string; avatar?: string };
  activeInstaStories: any[];
  onOpenStoryGroup?: (story: any) => void;
  triggerHaptic: (style: any) => void;
};

function findActiveStory(activeInstaStories: any[], chatName: string, chatUsername?: string) {
  const nameKey = chatName.toLowerCase().replace(/\s+/g, "");
  const usernameKey = (chatUsername || "").toLowerCase().replace(/\s+/g, "");

  return activeInstaStories.find((story: any) => {
    if (story.isYourStory) return false;
    const storyName = (story.name || "").toLowerCase().replace(/\s+/g, "");
    const storyUsername = (story.username || "").toLowerCase().replace(/\s+/g, "");
    return (
      (storyUsername && (storyUsername === usernameKey || storyUsername === nameKey)) ||
      (storyName && (storyName === nameKey || storyName === usernameKey))
    );
  });
}

export function ChatThreadAvatar({ thread, activeInstaStories, onOpenStoryGroup, triggerHaptic }: ChatThreadAvatarProps) {
  const storyGroup = findActiveStory(activeInstaStories, thread.name, thread.username);

  if (storyGroup) {
    return (
      <TouchableOpacity
        onPress={() => {
          triggerHaptic("medium");
          onOpenStoryGroup?.(storyGroup);
        }}
        style={{ marginRight: 12 }}
      >
        <LinearGradient
          colors={["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" }}
        >
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#080415", alignItems: "center", justifyContent: "center" }}>
            <Avatar uri={thread.avatar} name={thread.name || thread.username} size={48} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={{ marginRight: 12 }}>
      <Avatar uri={thread.avatar} name={thread.name || thread.username} size={56} />
    </TouchableOpacity>
  );
}
