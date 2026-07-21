import { StyleSheet } from "react-native";

export const homeFeedHeaderStyles = StyleSheet.create({
  postsSearchBar: {
    flex: 1,
    marginHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F5F7",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  postsSearchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111111",
    padding: 0,
  },
  profileSwitcherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeNotification: {
    backgroundColor: "#FF3B30",
  },
  badgeCart: {
    backgroundColor: "#111111",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  iconWrap: {
    position: "relative",
  },
});

const CATEGORY_CHIPS = [
  "For You",
  "Following",
  "Fashion",
  "Beauty",
  "Tech",
  "Fitness",
  "Luxury",
  "Trending",
  "Local",
] as const;

export function isCategoryChip(value: string): boolean {
  return (CATEGORY_CHIPS as readonly string[]).includes(value);
}
