import React, { useEffect, useState } from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { getThumbnailAsync } from "expo-video-thumbnails";

export function ProfileGridVideoThumbnail({ videoUrl }: { videoUrl: string }) {
  const [thumbUri, setThumbUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getThumbnailAsync(videoUrl, { time: 1000 })
      .then((res) => {
        if (active) {
          setThumbUri(res.uri);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Grid thumbnail gen failed:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [videoUrl]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080415", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color="#00f5ff" />
      </View>
    );
  }

  if (!thumbUri) {
    return (
      <LinearGradient
        colors={["#7b2cbf", "#3c096c", "#10002b"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Lucide name="videocam" size={24} color="#00f5ff" />
      </LinearGradient>
    );
  }

  return <Image source={{ uri: thumbUri }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />;
}
