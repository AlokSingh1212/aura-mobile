import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Vibration,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

export interface PeekPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  type: "POST" | "PROFILE";
  data: {
    id: string;
    title?: string;
    thumbnail?: string;
    caption?: string;
    maisonName?: string;
    maisonAvatar?: string;
    about?: string;
    followersCount?: number;
    designType?: string;
  };
  onActionPress?: (action: string) => void;
}

/**
 * AURA Premium "Peek & Pop" gestural preview modal.
 * Pops up when a user long-presses an item. Triggers custom haptic feedback patterns
 * and displays a styled content preview overlay.
 */
export const PeekPreviewModal: React.FC<PeekPreviewModalProps> = ({
  visible,
  onClose,
  type,
  data,
  onActionPress
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger a double haptic click for tactile response
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible || !data) return null;

  const handleAction = (action: string) => {
    Haptics.selectionAsync();
    if (onActionPress) {
      onActionPress(action);
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Header: Profile Metadata */}
            <View style={styles.header}>
              <Image 
                source={{ uri: data.maisonAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100" }} 
                style={styles.avatar}
              />
              <View style={styles.headerInfo}>
                <Text style={styles.name}>{data.maisonName || "AURA Atelier"}</Text>
                <Text style={styles.subtext}>
                  {type === "PROFILE" ? `${data.designType || "Brutalist"} • Designer` : "Feed Preview"}
                </Text>
              </View>
            </View>

            {/* Media Body */}
            {type === "POST" && data.thumbnail && (
              <Image 
                source={{ uri: data.thumbnail }}
                style={styles.media}
                contentFit="cover"
              />
            )}

            {/* Content Text Description */}
            <View style={styles.body}>
              {type === "POST" ? (
                <Text style={styles.caption} numberOfLines={3}>
                  {data.caption || data.title || "No description provided."}
                </Text>
              ) : (
                <View>
                  <Text style={styles.bio}>
                    {data.about || "Atelier of fine garments & digital craftsmanship."}
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statNum}>{data.followersCount || "12.4K"}</Text>
                      <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                      <Text style={styles.statNum}>{data.designType || "Brutalist"}</Text>
                      <Text style={styles.statLabel}>Aesthetic</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Action Bar */}
            <View style={styles.actions}>
              <TouchableWithoutFeedback onPress={() => handleAction("VIEW")}>
                <View style={styles.actionBtn}>
                  <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.actionText}>View Profile</Text>
                </View>
              </TouchableWithoutFeedback>
              
              <TouchableWithoutFeedback onPress={() => handleAction("SHARE")}>
                <View style={styles.actionBtn}>
                  <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.actionText}>Share Link</Text>
                </View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={() => handleAction("CLOSE")}>
                <View style={[styles.actionBtn, styles.closeBtn]}>
                  <Ionicons name="close-circle-outline" size={18} color="#8E8E93" />
                  <Text style={[styles.actionText, { color: "#8E8E93" }]}>Dismiss</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center"
  },
  cardContainer: {
    width: width * 0.88,
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16,
    elevation: 24
  },
  header: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)"
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  headerInfo: {
    flex: 1
  },
  name: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  subtext: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2
  },
  media: {
    width: "100%",
    height: width * 0.7,
    backgroundColor: "#2C2C2E"
  },
  body: {
    padding: 20
  },
  caption: {
    color: "#E5E5EA",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1
  },
  bio: {
    color: "#E5E5EA",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)"
  },
  statCol: {
    alignItems: "center"
  },
  statNum: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  statLabel: {
    color: "#8E8E93",
    fontSize: 11,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)"
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.04)"
  },
  closeBtn: {
    borderRightWidth: 0
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6
  }
});
