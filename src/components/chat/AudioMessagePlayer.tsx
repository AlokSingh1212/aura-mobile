import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { Audio } from "expo-av";

type AudioMessagePlayerProps = {
  uri: string;
  isMine: boolean;
};

export function AudioMessagePlayer({ uri, isMine }: AudioMessagePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayPause = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPosition(status.positionMillis);
              setDuration(status.durationMillis || 0);
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
              }
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Failed to play sound:", e);
    }
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingHorizontal: 8, gap: 10, minWidth: 150 }}>
      <TouchableOpacity onPress={handlePlayPause} style={{ backgroundColor: "rgba(0, 245, 255, 0.15)", borderRadius: 20, padding: 8 }}>
        <Lucide name={isPlaying ? "pause" : "play"} size={18} color="#00f5ff" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, backgroundColor: isMine ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)", borderRadius: 2, position: "relative" }}>
          <View
            style={{
              height: 4,
              backgroundColor: "#00f5ff",
              borderRadius: 2,
              width: duration > 0 ? `${(position / duration) * 100}%` : "0%",
            }}
          />
        </View>
        <Text style={{ fontSize: 10, color: isMine ? "rgba(255,255,255,0.6)" : "#666", marginTop: 4 }}>
          {formatTime(position)} / {formatTime(duration || 0)}
        </Text>
      </View>
    </View>
  );
}
