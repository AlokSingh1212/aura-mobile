import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { Avatar } from "@/components/ui/Avatar";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";
import { RtcSurfaceView } from "../agora";
import type { ChatCallState } from "@/hooks/useChatCalls";

export type ChatInThreadCallOverlayProps = {
  callState: ChatCallState | string;
  activeCall: any;
  activeChat: any;
  callerInfo: any;
  callRemoteUid: number | null;
  endCall: () => void;
  acceptCall: () => void;
  declineCall: () => void;
};

export function ChatInThreadCallOverlay({
  callState,
  activeCall,
  activeChat,
  callerInfo,
  callRemoteUid,
  endCall,
  acceptCall,
  declineCall,
}: ChatInThreadCallOverlayProps) {
  if ((callState as ChatCallState) === "none" || !activeCall) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={styles.callOverlayContainer}>
        <LinearGradient colors={["#120d2c", "#080415"]} style={StyleSheet.absoluteFillObject} />

        {activeCall.type === "VIDEO" && callState === "active" && (
          <View style={StyleSheet.absoluteFillObject}>
            {RtcSurfaceView ? (
              <RtcSurfaceView
                style={StyleSheet.absoluteFillObject}
                canvas={{ uid: callRemoteUid || 0 }}
              />
            ) : (
              (callerInfo?.avatar || activeChat?.avatar) ? (
                <Image
                  source={{ uri: callerInfo?.avatar || activeChat?.avatar }}
                  style={StyleSheet.absoluteFillObject}
                  blurRadius={3}
                />
              ) : null
            )}
            <View style={styles.localVideoBox}>
              {RtcSurfaceView ? (
                <RtcSurfaceView style={StyleSheet.absoluteFillObject} canvas={{ uid: 0 }} />
              ) : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lucide name="camera" size={24} color="#00f5ff" />
                </View>
              )}
            </View>
          </View>
        )}

        <SafeAreaView style={styles.callSafeArea}>
          <View style={styles.callProfileCard}>
            <Avatar
              uri={callerInfo?.avatar || activeChat?.avatar}
              name={callState === "incoming" ? callerInfo?.name : activeChat?.name}
              size={100}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.1)",
                marginBottom: 16,
              }}
            />
            <Text style={styles.callName}>
              {callState === "incoming" ? callerInfo?.name : activeChat?.name}
            </Text>
            <Text style={styles.callStatusText}>
              {callState === "outgoing" && "Ringing..."}
              {callState === "incoming" && `Incoming ${activeCall.type.toLowerCase()} call...`}
              {callState === "active" && "Call Connected"}
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
