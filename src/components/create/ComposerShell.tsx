import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

type Props = {
  title: string;
  stepLabel?: string;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightDisabled?: boolean;
  rightLoading?: boolean;
  children: React.ReactNode;
};

export function ComposerShell({
  title,
  stepLabel,
  onBack,
  rightLabel,
  onRightPress,
  rightDisabled,
  rightLoading,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={onBack ?? (() => router.back())}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Lucide name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{title}</Text>
          {stepLabel ? <Text style={styles.stepLabel}>{stepLabel}</Text> : null}
        </View>
        {rightLabel ? (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={onRightPress}
            disabled={rightDisabled || rightLoading}
          >
            {rightLoading ? (
              <ActivityIndicator size="small" color="#00f5ff" />
            ) : (
              <Text
                style={[
                  styles.rightText,
                  (rightDisabled || rightLoading) && styles.rightTextDisabled,
                ]}
              >
                {rightLabel}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.navBtn} />
        )}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080415",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  navBtn: {
    width: 72,
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  navCenter: {
    flex: 1,
    alignItems: "center",
  },
  navTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  stepLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  rightText: {
    color: "#00f5ff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
    width: "100%",
  },
  rightTextDisabled: {
    opacity: 0.35,
  },
  body: {
    flex: 1,
  },
});
