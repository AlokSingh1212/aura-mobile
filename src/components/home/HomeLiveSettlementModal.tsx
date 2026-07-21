import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeModalStyles as modalStyles } from "@/components/home/homeModalStyles";

export type SettlementData = {
  duration: string;
  viewers: number | string;
  hearts: number | string;
  revenue: string;
  keys: number | string;
};

type HomeLiveSettlementModalProps = {
  visible: boolean;
  data: SettlementData | null;
  onClose: () => void;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
};

export function HomeLiveSettlementModal({ visible, data, onClose, triggerHaptic }: HomeLiveSettlementModalProps) {
  if (!data) return null;
  return (
        <Modal
          visible={visible}
          transparent
          animationType="slide"
          onRequestClose={onClose}
        >
          <View style={modalStyles.settlementOverlay}>
            <View style={modalStyles.settlementCardGlow}>
              <View style={modalStyles.settlementCard}>
                <View style={modalStyles.settlementHeader}>
                  <Lucide name="receipt" size={34} color="#00f5ff" />
                  <Text style={modalStyles.settlementTitle}>Showroom Settlement Ledger</Text>
                  <Text style={modalStyles.settlementSubtitle}>Live Stream Session Cryptographic Audit</Text>
                </View>

                <View style={modalStyles.settlementGrid}>
                  <View style={modalStyles.settlementRow}>
                    <Text style={modalStyles.settlementLabel}>Broadcast Duration</Text>
                    <Text style={modalStyles.settlementValue}>{data.duration}</Text>
                  </View>
                  <View style={modalStyles.settlementRow}>
                    <Text style={modalStyles.settlementLabel}>Peak Live Viewers</Text>
                    <Text style={modalStyles.settlementValue}>{data.viewers} Nodes</Text>
                  </View>
                  <View style={modalStyles.settlementRow}>
                    <Text style={modalStyles.settlementLabel}>Reactions Hearts Count</Text>
                    <Text style={modalStyles.settlementValue}>{data.hearts} Hearts</Text>
                  </View>
                  <View style={modalStyles.settlementRow}>
                    <Text style={modalStyles.settlementLabel}>Estimated Atelier Revenue</Text>
                    <Text style={[modalStyles.settlementValue, { color: "#00f5ff" }]}>{data.revenue}</Text>
                  </View>
                  <View style={modalStyles.settlementRow}>
                    <Text style={modalStyles.settlementLabel}>VIP Access Keys Minted</Text>
                    <Text style={modalStyles.settlementValue}>{data.keys} Keys</Text>
                  </View>
                </View>

                <Text style={modalStyles.settlementFootnote}>
                  {"All generated interaction telemetry blocks have been successfully hashed and committed to the AURA transaction logs."}
                </Text>

                <TouchableOpacity 
                  style={modalStyles.settlementCloseBtn}
                  onPress={() => {
                    triggerHaptic("medium");
                    onClose();
                  }}
                >
                  <Text style={modalStyles.settlementCloseBtnText}>Conclude Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
  );
}
