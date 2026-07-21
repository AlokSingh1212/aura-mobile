import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { formatCompactNumber } from "@/constants/format";
import { useA11yProps } from "@/hooks/useA11yProps";

interface PostActionRowProps {
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  repostsCount?: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onReshare?: () => void;
  onSave: () => void;
  theme?: "light" | "dark";
}

function ActionWithCount({
  icon,
  activeIcon,
  active,
  count,
  onPress,
  iconColor,
  countColor,
  label,
}: {
  icon: React.ComponentProps<typeof Lucide>["name"];
  activeIcon: React.ComponentProps<typeof Lucide>["name"];
  active: boolean;
  count: number;
  onPress: () => void;
  iconColor: string;
  countColor: string;
  label: string;
}) {
  const { a11yProps } = useA11yProps();
  return (
    <TouchableOpacity
      style={styles.action}
      onPress={onPress}
      activeOpacity={0.75}
      {...a11yProps(`${label}, ${formatCompactNumber(count)}`, { role: "button" })}
    >
      <Lucide name={active ? activeIcon : icon} size={24} color={active && icon === "heart" ? "#FF3B30" : iconColor} />
      <Text style={[styles.count, { color: countColor }]}>{formatCompactNumber(count)}</Text>
    </TouchableOpacity>
  );
}

export function PostActionRow({
  isLiked,
  isSaved,
  likesCount,
  commentsCount,
  sharesCount,
  repostsCount = 0,
  onLike,
  onComment,
  onShare,
  onReshare,
  onSave,
  theme = "light",
}: PostActionRowProps) {
  const { a11yProps } = useA11yProps();
  const isDark = theme === "dark";
  const iconColor = isDark ? "#fff" : "#111111";
  const countColor = isDark ? "#fff" : "#111111";

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <ActionWithCount
          icon="heart-outline"
          activeIcon="heart"
          active={isLiked}
          count={likesCount}
          onPress={onLike}
          iconColor={iconColor}
          countColor={countColor}
          label={isLiked ? "Unlike" : "Like"}
        />
        <ActionWithCount
          icon="chatbubble-outline"
          activeIcon="chatbubble"
          active={false}
          count={commentsCount}
          onPress={onComment}
          iconColor={iconColor}
          countColor={countColor}
          label="Comment"
        />
        <ActionWithCount
          icon="paper-plane-outline"
          activeIcon="paper-plane"
          active={false}
          count={sharesCount}
          onPress={onShare}
          iconColor={iconColor}
          countColor={countColor}
          label="Share"
        />
        {onReshare ? (
          <ActionWithCount
            icon="repeat-outline"
            activeIcon="repeat"
            active={false}
            count={repostsCount}
            onPress={onReshare}
            iconColor={iconColor}
            countColor={countColor}
            label="Repost"
          />
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onSave}
        activeOpacity={0.75}
        {...a11yProps(isSaved ? "Unsave post" : "Save post", { role: "button" })}
      >
        <Lucide
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={23}
          color={isSaved ? (isDark ? "#00f5ff" : "#111111") : iconColor}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 52,
  },
  count: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 18,
  },
});
