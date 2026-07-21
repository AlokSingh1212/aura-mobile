import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";
import type { ChatCallState } from "@/hooks/useChatCalls";

export type ChatDrawerCallOverlayProps = {
  callState: ChatCallState;
  activeCall: any;
  callerInfo: any;
  endCall: () => void;
  acceptCall: () => void;
  declineCall: () => void;
};

export function ChatDrawerCallOverlay({
  callState,
  activeCall,
  callerInfo,
  endCall,
  acceptCall,
  declineCall,
}: ChatDrawerCallOverlayProps) {
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>
      <View style={styles.callOverlayContainer}>
        <LinearGradient colors={["#120d2c", "#080415"]} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.callSafeArea}>
          <View style={styles.callProfileCard}>
            <Image
              source={{
                uri:
                  callerInfo?.avatar ||
                  "https://auragram.com/logo.png",
              }}
              style={styles.callAvatar}
            />
            <Text style={styles.callName}>{callerInfo?.name || "Verified Citizen"}</Text>
            <Text style={styles.callStatusText}>
              {callState === "incoming"
                ? `Incoming ${activeCall.type.toLowerCase()} call...`
                : "Calling..."}
            </Text>
          </View>

          <View style={styles.callControlsRow}>
            {callState === "incoming" ? (
              <>
                <TouchableOpacity style={[styles.callBtn, styles.declineBtn]} onPress={declineCall}>
                  <Lucide name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={acceptCall}>
                  <Lucide name="checkmark" size={28} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.callBtn, styles.endCallBtn]} onPress={endCall}>
                <Lucide
                  name="call"
                  size={28}
                  color="#fff"
                  style={{ transform: [{ rotate: "135deg" }] }}
                />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
