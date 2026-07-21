import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { STORY_GRADIENT, THREADS_THEME as T } from "@/constants/threadsTheme";

type Props = {
  size: number;
  ringWidth?: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function StoryGradientRing({ size, ringWidth = 2.5, children, style }: Props) {
  const inner = size - ringWidth * 2;
  return (
    <LinearGradient
      colors={[...STORY_GRADIENT.colors]}
      start={STORY_GRADIENT.start}
      end={STORY_GRADIENT.end}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: T.bg,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

type PillProps = {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
};

/** Gradient border pill for active tabs / buttons. */
export function StoryGradientPill({ children, active, style }: PillProps) {
  if (!active) {
    return <View style={[styles.inactivePill, style]}>{children}</View>;
  }
  return (
    <LinearGradient
      colors={[...STORY_GRADIENT.colors]}
      start={STORY_GRADIENT.start}
      end={STORY_GRADIENT.end}
      style={[styles.gradientOuter, style]}
    >
      <View style={styles.gradientInner}>{children}</View>
    </LinearGradient>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function StoryGradientButton({ children, style }: ButtonProps) {
  return (
    <LinearGradient
      colors={[...STORY_GRADIENT.colors]}
      start={STORY_GRADIENT.start}
      end={STORY_GRADIENT.end}
      style={[styles.button, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inactivePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradientOuter: {
    padding: 1.5,
    borderRadius: 17,
  },
  gradientInner: {
    backgroundColor: T.surfaceElevated,
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 15,
  },
  button: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
});
