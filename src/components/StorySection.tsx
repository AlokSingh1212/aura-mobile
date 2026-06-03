import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";

export interface StorySectionProps {
  isReelsFullScreen: boolean;
  activeFeedTab: string;
  activeInstaStories: any[];
  setSelectedStoriesGroup: (story: any) => void;
  setActiveSlideIndex: (index: number) => void;
  setStoryProgress: (progress: number) => void;
}

export const StorySection: React.FC<StorySectionProps> = ({
  isReelsFullScreen,
  activeFeedTab,
  activeInstaStories,
  setSelectedStoriesGroup,
  setActiveSlideIndex,
  setStoryProgress,
}) => {
  const { triggerHaptic } = useStore();

  if (isReelsFullScreen && activeFeedTab === "reels") {
    return null;
  }

  return (
    <View style={styles.storiesBubbleContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
        {activeInstaStories.map((story) => (
          <TouchableOpacity 
            key={story.id} 
            style={styles.storyBubbleItem}
            onPress={() => {
              triggerHaptic("medium");
              setSelectedStoriesGroup(story);
              setActiveSlideIndex(0);
              setStoryProgress(0);
            }}
          >
            {story.active ? (
              <LinearGradient
                colors={["#fb923c", "#d946ef", "#8b5cf6"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: 66, height: 66, borderRadius: 33,
                  justifyContent: "center", alignItems: "center",
                }}
              >
                <View style={{
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: "#080415",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Image source={{ uri: story.avatar }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: story.avatar }} style={styles.storyAvatarImg} />
                {story.isYourStory && (
                  <View style={styles.yourStoryPlusBadge}>
                    <Lucide name="add-circle" size={19} color="#00f5ff" />
                  </View>
                )}
              </View>
            )}
            <Text style={styles.storyUsername} numberOfLines={1}>{story.username}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  storiesBubbleContainer: {
    height: 98,
    backgroundColor: "#080415",
  },
  storiesScroll: {
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 16,
  },
  storyBubbleItem: {
    alignItems: "center",
    gap: 4,
    width: 72,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: "#080415",
    position: "relative",
  },
  storyAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  yourStoryPlusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  storyUsername: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12.5,
    textAlign: "center",
  },
});
