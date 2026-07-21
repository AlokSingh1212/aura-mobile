import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { formatCompactNumber } from "@/constants/format";
import type { NetworkProfile } from "@/lib/profileApi";

type ProfileNetworkModalProps = {
  visible: boolean;
  networkTab: "followers" | "following";
  networkUsers: NetworkProfile[];
  loadingNetwork: boolean;
  followersCount: number;
  followingCount: number;
  activeProfileId?: string;
  triggerHaptic: (style: any) => void;
  onClose: () => void;
  onTabChange: (tab: "followers" | "following") => void;
  onFollowToggle: (user: NetworkProfile) => void;
};

export function ProfileNetworkModal({
  visible,
  networkTab,
  networkUsers,
  loadingNetwork,
  followersCount,
  followingCount,
  activeProfileId,
  triggerHaptic,
  onClose,
  onTabChange,
  onFollowToggle,
}: ProfileNetworkModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.networkModalContainer}>
          <View style={styles.modalHeaderBar}>
            <View style={styles.modalIndicator} />
          </View>

          <View style={styles.networkTabContainer}>
            <TouchableOpacity
              style={[styles.networkTabItem, networkTab === "followers" && styles.networkTabItemActive]}
              onPress={() => {
                triggerHaptic("light");
                onTabChange("followers");
              }}
            >
              <Text style={[styles.networkTabText, networkTab === "followers" && styles.networkTabTextActive]}>
                {formatCompactNumber(followersCount)} Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.networkTabItem, networkTab === "following" && styles.networkTabItemActive]}
              onPress={() => {
                triggerHaptic("light");
                onTabChange("following");
              }}
            >
              <Text style={[styles.networkTabText, networkTab === "following" && styles.networkTabTextActive]}>
                {formatCompactNumber(followingCount)} Following
              </Text>
            </TouchableOpacity>
          </View>

          {loadingNetwork ? (
            <ActivityIndicator size="small" color="#00f5ff" style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={networkUsers}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40, flexGrow: 1 }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                    {networkTab === "followers" ? "No followers yet" : "Not following anyone yet"}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.networkUserRow}>
                  <TouchableOpacity
                    style={styles.networkUserLeft}
                    onPress={() => {
                      triggerHaptic("light");
                      onClose();
                      router.push(`/profile/${item.username}` as any);
                    }}
                  >
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.networkUserAvatar} />
                    ) : (
                      <View style={[styles.networkUserAvatar, { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }]}>
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{item.name[0]?.toUpperCase() || "?"}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.networkUserName}>{item.name}</Text>
                      <Text style={styles.networkUserHandle}>@{item.username}</Text>
                    </View>
                  </TouchableOpacity>
                  {item.id !== activeProfileId && (
                    <TouchableOpacity
                      style={[styles.networkFollowBtn, item.followed ? styles.networkFollowBtnOutline : styles.networkFollowBtnPrimary]}
                      onPress={() => onFollowToggle(item)}
                    >
                      <Text style={[styles.networkFollowBtnText, item.followed && { color: "#fff" }]}>
                        {item.followed ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}

          <TouchableOpacity style={styles.modalCloseButton} onPress={() => { triggerHaptic("light"); onClose(); }}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalHeaderBar: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  modalIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  networkModalContainer: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    minHeight: "50%",
    paddingBottom: 20,
  },
  networkTabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  networkTabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  networkTabItemActive: {
    borderBottomColor: "#00f5ff",
  },
  networkTabText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: "600",
  },
  networkTabTextActive: {
    color: "#ffffff",
  },
  networkUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  networkUserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  networkUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  networkUserName: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
  },
  networkUserHandle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12.5,
    marginTop: 2,
  },
  networkFollowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  networkFollowBtnPrimary: {
    backgroundColor: "#00f5ff",
  },
  networkFollowBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  networkFollowBtnText: {
    color: "#080415",
    fontSize: 13,
    fontWeight: "700",
  },
  modalCloseButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
