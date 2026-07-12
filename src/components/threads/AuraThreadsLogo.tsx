import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  size?: number;
  color?: string;
}

export function AuraThreadsLogo({ size = 24, color = "#d4af37" }: Props) {
  const innerSize = size * 0.7;
  return (
    <View style={[styles.container, { width: size, height: size, borderColor: color }]}>
      {/* Stylised thread weave 1 */}
      <View style={[styles.threadLine, { 
        width: innerSize, 
        height: innerSize * 0.4, 
        borderColor: color, 
        borderTopWidth: 1.2,
        borderRightWidth: 1.2,
        transform: [{ rotate: "-20deg" }]
      }]} />
      {/* Stylised thread weave 2 */}
      <View style={[styles.threadLine, { 
        width: innerSize, 
        height: innerSize * 0.4, 
        borderColor: color, 
        borderBottomWidth: 1.2,
        borderLeftWidth: 1.2,
        position: "absolute",
        transform: [{ rotate: "40deg" }]
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  threadLine: {
    borderRadius: 4,
    opacity: 0.9,
  }
});
