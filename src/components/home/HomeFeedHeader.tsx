import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeShellStyles as shellStyles } from "@/components/home/homeShellStyles";
import { homeFeedHeaderStyles as styles, isCategoryChip } from "@/components/home/homeFeedHeaderStyles";
import { useA11yProps } from "@/hooks/useA11yProps";

type HomeFeedHeaderProps = {
  activeFeedTab: "grid" | "reels" | "live" | "posts";
  selectedCategory: string;
  activeProfile: any;
  unreadNotificationsCount: number;
  cartItemCount: number;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onCategoryChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchQuery: (query: string) => void;
  onOpenProfileSwitcher: () => void;
  onOpenActivity: () => void;
  onOpenSearchOverlay?: () => void;
};

export function HomeFeedHeader({
  activeFeedTab,
  selectedCategory,
  activeProfile,
  unreadNotificationsCount,
  cartItemCount,
  triggerHaptic,
  onCategoryChange,
  onSearchClear,
  onSearchQuery,
  onOpenProfileSwitcher,
  onOpenActivity,
  onOpenSearchOverlay,
}: HomeFeedHeaderProps) {
  const { a11yProps, fontScale } = useA11yProps();
  const isPostsTab = activeFeedTab === "posts";
  const iconColor = isPostsTab ? "#111111" : "#ffffff";

  return (
    <View
      style={[
        shellStyles.instaHeader,
        isPostsTab && {
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#EAEAEA",
          height: 56,
        },
      ]}
    >
      <TouchableOpacity onPress={() => triggerHaptic("light")}>
        <Text
          style={[
            shellStyles.instaLogoText,
            isPostsTab && { color: "#111111", fontSize: 20, fontWeight: "900", letterSpacing: 1 },
          ]}
        >
          AURA
        </Text>
      </TouchableOpacity>

      {isPostsTab ? (
        <TouchableOpacity
          style={styles.postsSearchBar}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic("light");
            onOpenSearchOverlay?.();
          }}
          {...a11yProps("Search creators and products", { role: "button" })}
        >
          <Lucide name="search-outline" size={16} color="#8E8E93" style={{ marginRight: 6 }} />
          <Text
            style={[
              styles.postsSearchInput,
              { color: "#8E8E93" },
              fontScale > 1 && { fontSize: 15 * fontScale },
            ]}
          >
            Search creators, products...
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onOpenProfileSwitcher}
          style={styles.profileSwitcherRow}
          {...a11yProps("Switch profile", { role: "button" })}
        >
          <Text style={shellStyles.instaLogoText}>
            {activeProfile ? `@${activeProfile.username}`.toUpperCase() : "A U R A"}
          </Text>
          <Lucide name="chevron-down" size={14} color="#00f5ff" style={{ marginTop: 2 }} />
        </TouchableOpacity>
      )}

      <View style={shellStyles.headerRightIcons}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic("medium");
            onOpenActivity();
          }}
          {...a11yProps(
            unreadNotificationsCount > 0
              ? `Activity, ${unreadNotificationsCount} unread`
              : "Activity",
            { role: "button" }
          )}
        >
          <View style={styles.iconWrap}>
            <Lucide name="notifications-outline" size={24} color={iconColor} />
            {unreadNotificationsCount > 0 && (
              <View style={[styles.badge, styles.badgeNotification]}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic("medium");
            router.push("/cart");
          }}
          {...a11yProps(
            cartItemCount > 0 ? `Cart, ${cartItemCount} items` : "Cart",
            { role: "button" }
          )}
        >
          <View style={styles.iconWrap}>
            <Lucide name="cart-outline" size={24} color={iconColor} />
            {cartItemCount > 0 && (
              <View style={[styles.badge, styles.badgeCart]}>
                <Text style={styles.badgeText}>{cartItemCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
