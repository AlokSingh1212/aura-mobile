import React from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { Avatar } from "@/components/ui/Avatar";
import { useRouter } from "expo-router";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";

export type ChatCoinFlipPopupProps = {
  visible: boolean;
  coinUser: any;
  frontInterpolate: Animated.AnimatedInterpolation<string>;
  backInterpolate: Animated.AnimatedInterpolation<string>;
  triggerHaptic: (style: any) => void;
  onClose: () => void;
  onFlip: () => void;
  onViewProfile: (name: string, username?: string, avatar?: string) => void;
};

export function ChatCoinFlipPopup({
  visible,
  coinUser,
  frontInterpolate,
  backInterpolate,
  triggerHaptic,
  onClose,
  onFlip,
  onViewProfile,
}: ChatCoinFlipPopupProps) {
  const router = useRouter();

  if (!visible || !coinUser) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <TouchableOpacity style={styles.coinPopupBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.coinCardContainer}>
          <TouchableOpacity activeOpacity={0.95} onPress={onFlip}>
            <View style={styles.coinWrapper}>
              <Animated.View
                style={[
                  styles.coinFace,
                  styles.coinFaceFront,
                  { transform: [{ rotateY: frontInterpolate }] },
                ]}
              >
                <Avatar
                  uri={coinUser.avatar}
                  name={coinUser.name || coinUser.username}
                  size={240}
                  style={styles.coinPhoto as any}
                />
                <View style={styles.coinFrontOverlay}>
                  <Text style={styles.coinFrontName}>{coinUser.name}</Text>
                  <Text style={styles.coinFrontUsername}>@{coinUser.username || "user"}</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgba(0,245,255,0.2)",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#00f5ff",
                      }}
                      onPress={(e) => {
                        e.stopPropagation();
                        triggerHaptic("medium");
                        onClose();
                        onViewProfile(coinUser.name, coinUser.username, coinUser.avatar);
                      }}
                    >
                      <Text style={{ color: "#00f5ff", fontSize: 11, fontWeight: "bold" }}>
                        View Profile
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.coinFlipHint, { marginTop: 8 }]}>Tap to flip 🔄</Text>
                </View>
              </Animated.View>

              <Animated.View
                style={[
                  styles.coinFace,
                  styles.coinFaceBack,
                  { transform: [{ rotateY: backInterpolate }] },
                ]}
              >
                <View style={styles.coinBackHeader}>
                  <Text style={styles.coinBackTitle}>Connected Stores</Text>
                </View>

                {coinUser.managedStoreId ? (
                  <View style={{ flex: 1, justifyContent: "space-between", paddingBottom: 10 }}>
                    <TouchableOpacity
                      style={styles.coinStoreRow}
                      onPress={() => {
                        triggerHaptic("medium");
                        onClose();
                        router.push(`/maison/${coinUser.managedStoreId}` as any);
                      }}
                    >
                      <Avatar
                        uri={coinUser.managedStoreLogo || coinUser.avatar}
                        name={coinUser.managedStoreName || coinUser.name}
                        size={48}
                        style={styles.coinStoreLogo as any}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.coinStoreName} numberOfLines={1}>
                          {coinUser.managedStoreName}
                        </Text>
                        <Text style={styles.coinStoreSubtext}>View Store</Text>
                      </View>
                      <Lucide name="chevron-forward" size={18} color="#00f5ff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.coinViewProfileBtn, { alignSelf: "center", marginTop: 10 }]}
                      onPress={() => {
                        triggerHaptic("medium");
                        onClose();
                        onViewProfile(coinUser.name, coinUser.username, coinUser.avatar);
                      }}
                    >
                      <Text style={styles.coinViewProfileBtnText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.coinNoStoresContainer}>
                    <Lucide name="pricetags-outline" size={32} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.coinNoStoresText}>No connected stores</Text>
                    <TouchableOpacity
                      style={styles.coinViewProfileBtn}
                      onPress={() => {
                        triggerHaptic("medium");
                        onClose();
                        onViewProfile(coinUser.name, coinUser.username, coinUser.avatar);
                      }}
                    >
                      <Text style={styles.coinViewProfileBtnText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}
