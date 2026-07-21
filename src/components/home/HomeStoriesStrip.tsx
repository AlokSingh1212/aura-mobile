import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";

type LiveSession = {
  id: string;
  maisonId: string;
  maisonName: string;
};

type InstaStory = {
  id: string;
  username: string;
  avatar: string;
  active?: boolean;
  isYourStory?: boolean;
};

type HomeStoriesStripProps = {
  profileLogo: string | null;
  profileTabInitial: string;
  isCurrentlyLive: boolean;
  myLiveSession: LiveSession | null;
  yourStoryHasSlides: boolean;
  yourStoryNode: InstaStory | undefined;
  otherLiveSessions: LiveSession[];
  visibleInstaStories: InstaStory[];
  triggerHaptic: (style: any) => void;
  onOpenLiveShowroom: (params: { mode: "viewer" | "lobby"; maisonId: string; maisonName: string; sessionId: string }) => void;
  onOpenStoryGroup: (story: InstaStory) => void;
};

export function HomeStoriesStrip({
  profileLogo,
  profileTabInitial,
  isCurrentlyLive,
  myLiveSession,
  yourStoryHasSlides,
  yourStoryNode,
  otherLiveSessions,
  visibleInstaStories,
  triggerHaptic,
  onOpenLiveShowroom,
  onOpenStoryGroup,
}: HomeStoriesStripProps) {
  const renderProfileAvatar = (size: number, innerSize: number) => {
    if (profileLogo) {
      return (
        <Image
          source={{ uri: profileLogo }}
          key={profileLogo.slice(0, 64)}
          style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
        />
      );
    }
    return (
      <View style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: innerSize * 0.33, fontWeight: "700" }}>{profileTabInitial}</Text>
      </View>
    );
  };

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F5F5F7",
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() => {
            triggerHaptic("medium");
            if (isCurrentlyLive && myLiveSession) {
              onOpenLiveShowroom({
                mode: "lobby",
                maisonId: myLiveSession.maisonId,
                maisonName: myLiveSession.maisonName,
                sessionId: myLiveSession.id,
              });
            } else if (yourStoryHasSlides && yourStoryNode) {
              onOpenStoryGroup(yourStoryNode);
            } else {
              router.push("/create/story");
            }
          }}
        >
          <View style={{ position: "relative" }}>
            {isCurrentlyLive ? (
              <LinearGradient colors={["#FF2D55", "#FF9500"]} style={{ width: 66, height: 66, borderRadius: 33, justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                  {renderProfileAvatar(66, 54)}
                </View>
              </LinearGradient>
            ) : yourStoryHasSlides ? (
              <LinearGradient colors={["#fb923c", "#d946ef", "#8b5cf6"]} style={{ width: 66, height: 66, borderRadius: 33, justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                  {renderProfileAvatar(66, 54)}
                </View>
              </LinearGradient>
            ) : profileLogo ? (
              <Image source={{ uri: profileLogo }} key={profileLogo.slice(0, 64)} style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: "#EAEAEA" }} />
            ) : (
              <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: "#EAEAEA", backgroundColor: "#111", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>{profileTabInitial}</Text>
              </View>
            )}
            {isCurrentlyLive && (
              <View style={{ position: "absolute", bottom: 0, backgroundColor: "#FF3B30", paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3, borderWidth: 1.5, borderColor: "#FFFFFF", alignSelf: "center", zIndex: 2 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "bold" }}>LIVE</Text>
              </View>
            )}
            {!yourStoryHasSlides && !isCurrentlyLive ? (
              <View style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "#111111", width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                <Lucide name="add" size={12} color="#FFFFFF" />
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 11, color: "#8E8E93", marginTop: 6, fontWeight: "500" }}>Your Story</Text>
        </TouchableOpacity>

        {otherLiveSessions.map((session) => {
          const hostAvatar = "https://auragram.com/logo.png";
          return (
            <TouchableOpacity
              key={session.id}
              style={{ alignItems: "center" }}
              onPress={() => {
                triggerHaptic("medium");
                onOpenLiveShowroom({
                  mode: "viewer",
                  maisonId: session.maisonId,
                  maisonName: session.maisonName,
                  sessionId: session.id,
                });
              }}
            >
              <LinearGradient colors={["#FF2D55", "#FF9500"]} style={{ width: 66, height: 66, borderRadius: 33, justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }}>
                  <Image source={{ uri: hostAvatar }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                </View>
              </LinearGradient>
              <View style={{ position: "absolute", bottom: 16, backgroundColor: "#FF3B30", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: "#FFFFFF" }}>
                <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "bold" }}>LIVE</Text>
              </View>
              <Text style={{ fontSize: 11, color: "#111111", marginTop: 6, fontWeight: "600" }}>
                {session.maisonName.length > 10 ? `${session.maisonName.substring(0, 8)}...` : session.maisonName}
              </Text>
            </TouchableOpacity>
          );
        })}

        {visibleInstaStories.filter((s) => !s.isYourStory).map((story) => (
          <TouchableOpacity
            key={story.id}
            style={{ alignItems: "center" }}
            onPress={() => {
              triggerHaptic("medium");
              onOpenStoryGroup(story);
            }}
          >
            <LinearGradient colors={story.active ? ["#fb923c", "#d946ef", "#8b5cf6"] : ["#EAEAEA", "#EAEAEA"]} style={{ width: 66, height: 66, borderRadius: 33, justifyContent: "center", alignItems: "center" }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }}>
                <Image source={{ uri: story.avatar }} style={{ width: 54, height: 54, borderRadius: 27 }} />
              </View>
            </LinearGradient>
            <Text style={{ fontSize: 11, color: "#111111", marginTop: 6, fontWeight: "500" }}>
              {story.username.length > 10 ? `${story.username.substring(0, 8)}...` : story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
