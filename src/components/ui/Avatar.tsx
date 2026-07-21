import React from "react";
import { View, Text, ViewStyle } from "react-native";
import { Image } from "expo-image";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 36, style }: AvatarProps) {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: "#2C2C2E", // Default dark grey background for fallback
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...style,
  };

  if (uri && !uri.includes("images.unsplash.com")) {
    return <Image source={{ uri }} style={containerStyle as any} />;
  }

  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <View style={containerStyle}>
      <Text style={{ color: "#FFFFFF", fontSize: size * 0.45, fontWeight: "600" }}>
        {initial}
      </Text>
    </View>
  );
}
