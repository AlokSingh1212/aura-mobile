import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";

export type ChatAttachMenuSheetProps = {
  visible: boolean;
  sharingProductsList: boolean;
  products: any[];
  triggerHaptic: (style: any) => void;
  onClose: () => void;
  onShowProducts: () => void;
  onHideProducts: () => void;
  onCaptureCamera: () => void;
  onShareImage: () => void;
  onStartRecording: () => void;
  onShareProduct: (product: any) => void;
  onShowGifPicker?: () => void;
};

export function ChatAttachMenuSheet({
  visible,
  sharingProductsList,
  products,
  triggerHaptic,
  onClose,
  onShowProducts,
  onHideProducts,
  onCaptureCamera,
  onShareImage,
  onStartRecording,
  onShareProduct,
  onShowGifPicker,
}: ChatAttachMenuSheetProps) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <TouchableOpacity style={styles.attachMenuBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.attachMenuContent}>
          <View style={styles.attachMenuHeader}>
            <View style={styles.attachMenuHandle} />
          </View>

          <Text style={styles.attachMenuTitle}>Share Attachment</Text>

          {sharingProductsList ? (
            <View style={{ height: 200, marginTop: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "bold" }}>
                  SELECT PRODUCT
                </Text>
                <TouchableOpacity onPress={onHideProducts}>
                  <Text style={{ color: "#00f5ff", fontSize: 13 }}>Back</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {products.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.shareProductItem}
                    onPress={() => onShareProduct(p)}
                  >
                    <Image source={{ uri: p.images?.[0] }} style={styles.shareProductImg} />
                    <Text style={styles.shareProductTitle} numberOfLines={1}>
                      {p.name || p.title}
                    </Text>
                    <Text style={styles.shareProductPrice}>
                      ₹{parseFloat(p.price).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.attachVerticalList}>
              <TouchableOpacity style={styles.attachVerticalItem} onPress={onCaptureCamera}>
                <View style={[styles.attachIconBg, { backgroundColor: "#1e1e1f" }]}>
                  <Lucide name="camera" size={22} color="#00f5ff" />
                </View>
                <Text style={styles.attachVerticalLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachVerticalItem} onPress={onShareImage}>
                <View style={[styles.attachIconBg, { backgroundColor: "#ff5e7e22" }]}>
                  <Lucide name="image" size={22} color="#ff5e7e" />
                </View>
                <Text style={styles.attachVerticalLabel}>Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachVerticalItem}
                onPress={() => {
                  onClose();
                  triggerHaptic("light");
                  onShowGifPicker?.();
                }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#00bcd422" }]}>
                  <Lucide name="film-outline" size={22} color="#00bcd4" />
                </View>
                <Text style={styles.attachVerticalLabel}>GIF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachVerticalItem}
                onPress={() => {
                  onClose();
                  triggerHaptic("light");
                  Alert.alert("Stickers", "Launch sticker options.");
                }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#af52de22" }]}>
                  <Lucide name="happy" size={22} color="#af52de" />
                </View>
                <Text style={styles.attachVerticalLabel}>Stickers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachVerticalItem}
                onPress={() => {
                  onClose();
                  triggerHaptic("light");
                  Alert.alert("Aura Cash", "Aura Cash request generated!");
                }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#34c75922" }]}>
                  <Lucide name="cash" size={22} color="#34c759" />
                </View>
                <Text style={styles.attachVerticalLabel}>Aura Cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachVerticalItem}
                onPress={() => {
                  onClose();
                  onStartRecording();
                }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#ff950022" }]}>
                  <Lucide name="mic" size={22} color="#ff9500" />
                </View>
                <Text style={styles.attachVerticalLabel}>Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachVerticalItem}
                onPress={() => {
                  onClose();
                  triggerHaptic("light");
                  Alert.alert("Send Later", "Message scheduled!");
                }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#007aff22" }]}>
                  <Lucide name="time" size={22} color="#007aff" />
                </View>
                <Text style={styles.attachVerticalLabel}>Send Later</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachVerticalItem} onPress={onShowProducts}>
                <View style={[styles.attachIconBg, { backgroundColor: "#5856d622" }]}>
                  <Lucide name="basket" size={22} color="#5856d6" />
                </View>
                <Text style={styles.attachVerticalLabel}>Store</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
