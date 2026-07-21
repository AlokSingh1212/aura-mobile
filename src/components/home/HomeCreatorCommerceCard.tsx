import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { SafeVideoPlayer } from "@/components/SafeVideoPlayer";
import { isReelVideoUrl } from "@/lib/reelMedia";
import { Avatar } from "@/components/ui/Avatar";

export interface HomeCreatorCommerceCardProps {
  item: any;
  feedMuted: boolean;
  setFeedMuted: (muted: boolean) => void;
  triggerHaptic: (style: any) => void;
  setSelectedProductForPreview: (product: any) => void;
  setPreviewFeedItemId: (id: any) => void;
  setPreviewSheetVisible: (visible: boolean) => void;
  formatPrice: (price: number) => string;
  onPressVideo?: () => void;
  handleThreeDotsPress: (item: any) => void;
  shouldPlayVideo?: boolean;
  mountVideo?: boolean;
  isScreenFocused?: boolean;
}

export const HomeCreatorCommerceCard: React.FC<HomeCreatorCommerceCardProps> = ({
  item,
  feedMuted,
  setFeedMuted,
  triggerHaptic,
  setSelectedProductForPreview,
  setPreviewFeedItemId,
  setPreviewSheetVisible,
  formatPrice,
  onPressVideo,
  handleThreeDotsPress,
  shouldPlayVideo = false,
  mountVideo = false,
  isScreenFocused = true,
}) => {
  const prod = item.product || {};
  const video = item.content?.videoUrl || item.content?.mediaUrl || "";
  const hasVideo = isReelVideoUrl(video);
  const thumbnail = item.content?.thumbnail || (!hasVideo ? item.content?.mediaUrl : "") || video;
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [localPlayOverride, setLocalPlayOverride] = useState(false);
  const isPlayActive = (shouldPlayVideo || localPlayOverride) && isScreenFocused && hasVideo && !isPausedByUser;

  useEffect(() => {
    if (!shouldPlayVideo) {
      setIsPausedByUser(false);
      setLocalPlayOverride(false);
    }
  }, [shouldPlayVideo]);

  const caption = item.content?.caption || "";
  const creatorName = item.creator?.name || "AURA Creator";
  const creatorUsername = item.creator?.username || "aura_curator";
  const creatorAvatar = item.creator?.avatar;

  return (
    <View style={{ backgroundColor: "#FFFFFF", marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#F5F5F7", paddingBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar uri={creatorAvatar} name={creatorName} size={36} style={{ marginRight: 8 }} />
          <View>
            <Text style={{ fontWeight: "700", fontSize: 14, color: "#111111" }}>{creatorName}</Text>
            <Text style={{ fontSize: 11, color: "#8E8E93" }}>@{creatorUsername} • Commerce</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleThreeDotsPress(item)}>
          <Lucide name="ellipsis-horizontal" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPressVideo}
        style={{ width: "100%", height: 380, position: "relative", backgroundColor: "#000000" }}
      >
        {hasVideo && mountVideo ? (
          <SafeVideoPlayer
            source={video}
            muted={feedMuted}
            playing={isPlayActive}
            loop
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : thumbnail ? (
          <Image source={{ uri: thumbnail }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: "#000000" }} />
        )}
        {hasVideo && !isPlayActive ? (
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              triggerHaptic("light");
              setIsPausedByUser(false);
              setLocalPlayOverride(true);
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lucide name="play" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : null}
        {hasVideo && isPlayActive && (
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              triggerHaptic("light");
              setIsPausedByUser(true);
              setLocalPlayOverride(false);
            }}
          >
            <Lucide name="pause" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={(e) => {
            e.stopPropagation();
            setFeedMuted(!feedMuted);
          }}
        >
          <Lucide name={feedMuted ? "volume-mute" : "volume-high"} size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ fontSize: 13, color: "#111111", lineHeight: 18 }}>
          <Text style={{ fontWeight: "700" }}>{creatorUsername} </Text>
          {caption}
        </Text>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F5F5F7",
            borderWidth: 1,
            borderColor: "#EAEAEA",
            borderRadius: 14,
            padding: 10,
            marginTop: 12,
          }}
          onPress={() => {
            triggerHaptic("medium");
            setSelectedProductForPreview(prod);
            setPreviewFeedItemId(item.id);
            setPreviewSheetVisible(true);
          }}
        >
          <Image source={{ uri: prod.images?.[0] }} style={{ width: 44, height: 44, borderRadius: 8 }} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: "#8E8E93", textTransform: "uppercase" }}>FEATURED PRODUCT</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#111111", marginTop: 2 }}>{prod.name}</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#111111", marginRight: 8 }}>{formatPrice(prod.price)}</Text>
          <Lucide name="chevron-forward" size={16} color="#111111" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
