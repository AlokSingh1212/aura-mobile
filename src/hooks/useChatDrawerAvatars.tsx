import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type UseChatDrawerAvatarsOptions = {
  activeChat: any;
  activeInstaStories: any[];
  onOpenStoryGroup?: (story: any) => void;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  openCoinPopup: (user: any) => void;
};

export function useChatDrawerAvatars({
  activeChat,
  activeInstaStories,
  onOpenStoryGroup,
  triggerHaptic,
  openCoinPopup,
}: UseChatDrawerAvatarsOptions) {
  const router = useRouter();

  const findActiveStory = useCallback(
    (chatName: string, chatUsername?: string) => {
      if (!activeInstaStories) return null;

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
    },
    [activeInstaStories]
  );

  const handleViewTargetProfile = useCallback(
    (chatName: string, chatUsername?: string, chatAvatar?: string) => {
      let username = (chatUsername && chatUsername.trim() !== "") 
        ? chatUsername 
        : chatName.toLowerCase().replace(/\s+/g, "_");
      
      // Dynamic fallback mapping for real profiles in database
      const cleanName = chatName.toLowerCase().trim();
      if (cleanName === "aurafashion" || cleanName === "aura fashion") {
        username = "aura_fashion";
      } else if (cleanName === "cjsingh" || cleanName === "cjsingh1135") {
        username = "cjsingh1135";
      } else if (cleanName === "priyanka" || cleanName === "priyanka172356") {
        username = "priyanka172356";
      } else if (cleanName === "aloksingh" || cleanName === "alok singh") {
        username = "aloksingh";
      }

      triggerHaptic("light");
      router.push({
        pathname: `/profile/${username}`,
        params: { name: chatName, avatar: chatAvatar || activeChat?.avatar },
      } as any);
    },
    [activeChat?.avatar, router, triggerHaptic]
  );

  const renderAvatarWithStory = useCallback(
    (uri: string, chatName: string, chatUsername?: string, size: number = 44) => {
      const storyGroup = findActiveStory(chatName, chatUsername);
      const hasStory = storyGroup !== null;

      const onPress = () => {
        triggerHaptic("medium");
        openCoinPopup(activeChat);
      };

      if (hasStory) {
        return (
          <TouchableOpacity onPress={onPress}>
            <LinearGradient
              colors={["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: size + 6,
                height: size + 6,
                borderRadius: (size + 6) / 2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: size + 2,
                  height: size + 2,
                  borderRadius: (size + 2) / 2,
                  backgroundColor: "#080415",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={{ uri }}
                  style={{ width: size, height: size, borderRadius: size / 2 }}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity onPress={onPress}>
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        </TouchableOpacity>
      );
    },
    [activeChat, findActiveStory, openCoinPopup, triggerHaptic]
  );

  return {
    findActiveStory,
    handleViewTargetProfile,
    renderAvatarWithStory,
  };
}
