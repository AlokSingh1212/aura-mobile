import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "@/store/useStore";
import { API_BASE } from "@/constants/api";
import Lucide from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

interface TimelineMilestone {
  name: string;
  status: "COMPLETED" | "PROCESSING" | "WAITING" | "PENDING";
  date: string | null;
}

interface TrackingData {
  success: boolean;
  orderNumber: string;
  status: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  items: {
    title: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  timeline: TimelineMilestone[];
}

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { triggerHaptic } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingData | null>(null);

  const fetchTrackingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/orders/track?orderId=${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Order tracking details could not be retrieved.");
      }
    } catch (err) {
      console.error("fetchTrackingDetails error:", err);
      setError("Network connectivity issues. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTrackingDetails();
    }
  }, [id]);

  const handleBack = () => {
    triggerHaptic("light");
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>RESOLVING LEDGER COORDINATES...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Lucide name="warning-outline" size={48} color="#ff3366" />
        <Text style={styles.errorTitle}>RESOLUTION ERROR</Text>
        <Text style={styles.errorText}>{error || "Order not found."}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>Return to Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Lucide name="checkmark-circle" size={20} color="#00f5ff" />;
      case "PROCESSING":
      case "PENDING":
        return <ActivityIndicator size="small" color="#00f5ff" />;
      default:
        return <Lucide name="ellipse-outline" size={16} color="rgba(255,255,255,0.2)" />;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Cinematic Header Navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.circleBtn} onPress={handleBack}>
            <Lucide name="arrow-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>TRACK SHIPMENT</Text>
          <TouchableOpacity style={styles.circleBtn} onPress={fetchTrackingDetails}>
            <Lucide name="refresh" size={21} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Order Header Glass Panel */}
          <View style={styles.glassPanel}>
            <View style={styles.orderMetaRow}>
              <View>
                <Text style={styles.metaLabel}>ORDER NUMBER</Text>
                <Text style={styles.metaValue}>{data.orderNumber}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{data.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.courierRow}>
              <View style={styles.courierCell}>
                <Text style={styles.metaLabel}>COURIER CARRIER</Text>
                <Text style={styles.courierValue} numberOfLines={1}>{data.carrier}</Text>
              </View>
              <View style={styles.courierCell}>
                <Text style={styles.metaLabel}>TRACKING ID</Text>
                <Text style={styles.courierValue} numberOfLines={1}>{data.trackingNumber}</Text>
              </View>
            </View>

            <View style={styles.estDeliveryBox}>
              <Lucide name="airplane-outline" size={18} color="#00f5ff" />
              <Text style={styles.estDeliveryText}>
                Estimated Arrival: <Text style={{ color: "#fff", fontWeight: "bold" }}>{data.estimatedDelivery}</Text>
              </Text>
            </View>
          </View>

          {/* Premium Vertical shipping Timeline */}
          <Text style={styles.sectionHeading}>LOGISTICS LEDGER STATUS</Text>
          <View style={styles.timelineCard}>
            {data.timeline.map((step, idx) => {
              const isLast = idx === data.timeline.length - 1;
              const isCompleted = step.status === "COMPLETED";
              const isProcessing = step.status === "PROCESSING" || step.status === "PENDING";
              
              return (
                <View key={idx} style={styles.timelineItem}>
                  {/* Left Column: Icons and connecting lines */}
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.iconContainer, 
                      isCompleted && styles.iconCompleted,
                      isProcessing && styles.iconProcessing
                    ]}>
                      {getMilestoneIcon(step.status)}
                    </View>
                    {!isLast && (
                      <View style={[
                        styles.connectorLine,
                        isCompleted && styles.connectorCompleted
                      ]} />
                    )}
                  </View>

                  {/* Right Column: Text descriptions */}
                  <View style={styles.timelineRight}>
                    <Text style={[
                      styles.stepName,
                      (isCompleted || isProcessing) && styles.stepNameActive
                    ]}>
                      {step.name}
                    </Text>
                    {step.date && (
                      <Text style={styles.stepDate}>
                        {new Date(step.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Purchased Items List */}
          <Text style={styles.sectionHeading}>SECURED ARTIFACTS</Text>
          <View style={styles.itemsCard}>
            {data.items.map((item, idx) => {
              const itemImg = item.image || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400";
              return (
                <View key={idx} style={styles.itemRow}>
                  <Image source={{ uri: itemImg }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemMeta}>QTY: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              );
            })}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: "#ff3366",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  errorText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  glassPanel: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  orderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    backgroundColor: "rgba(0, 245, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  courierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  courierCell: {
    flex: 1,
  },
  courierValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  estDeliveryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 245, 255, 0.04)",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.08)",
  },
  estDeliveryText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  sectionHeading: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginTop: 32,
    marginBottom: 16,
  },
  timelineCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 80,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 16,
    width: 32,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCompleted: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0, 245, 255, 0.05)",
  },
  iconProcessing: {
    borderColor: "#00f5ff",
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 4,
  },
  connectorCompleted: {
    backgroundColor: "#00f5ff",
  },
  timelineRight: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 16,
  },
  stepName: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontWeight: "600",
  },
  stepNameActive: {
    color: "#fff",
  },
  stepDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 4,
  },
  itemsCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    resizeMode: "cover",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 2,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  itemMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },
  itemPrice: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
