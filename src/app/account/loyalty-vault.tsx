import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function LoyaltyVaultScreen() {
  const {
    loyaltyPoints,
    loyaltyElite,
    loyaltyEliteUntil,
    rewardLogs,
    loadingLoyalty,
    fetchLoyaltyInfo,
    redeemPoints,
    triggerHaptic
  } = useStore();

  const [activeTab, setActiveTab] = useState<"earn" | "redeem" | "history">("earn");
  const [selectedBenefit, setSelectedBenefit] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);

  // Default User ID
  const userId = "user_2pk5xskr";

  useEffect(() => {
    fetchLoyaltyInfo(userId);
  }, []);

  const handleRedeem = async (benefit: any) => {
    if (loyaltyPoints < benefit.cost) {
      triggerHaptic("heavy");
      Alert.alert(
        "Insufficient Credits",
        `You need ${benefit.cost - loyaltyPoints} more Curation Credits to unlock this early-access ledger artifact.`
      );
      return;
    }

    Alert.alert(
      "Confirm Redemption",
      `Are you sure you want to exchange ${benefit.cost} Curation Credits for "${benefit.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            setRedeeming(true);
            triggerHaptic("medium");
            try {
              const res = await redeemPoints({
                userId,
                cost: benefit.cost,
                title: benefit.title,
                type: benefit.type
              });
              if (res && res.success) {
                triggerHaptic("success");
                Alert.alert(
                  "Vault Secured!",
                  `Successfully minted coupon code: ${res.couponCode || "AURA-PRO-GOLD"}`
                );
                setSelectedBenefit(null);
                fetchLoyaltyInfo(userId);
              } else {
                Alert.alert("Redemption Issue", "Server was unable to process your sovereign vault transaction.");
              }
            } catch {
              Alert.alert("Network Failure", "Failed to connect to the AURA Loyalty node.");
            } finally {
              setRedeeming(false);
            }
          }
        }
      ]
    );
  };

  const REDEEMABLE_BENEFITS = [
    {
      id: "b1",
      title: "₹5,000 Maison Voucher",
      desc: "Stackable credit on your next bespoke couture acquisition.",
      cost: 500,
      icon: "gift-outline",
      type: "VOUCHER"
    },
    {
      id: "b2",
      title: "Paris Fashion Week Seat",
      desc: "Front-row early access reservation at the sovereign showcase.",
      cost: 2500,
      icon: "ribbon-outline",
      type: "EARLY_ACCESS"
    },
    {
      id: "b3",
      title: "Free Express Drone Courier",
      desc: "Complimentary global spatial drone delivery on all parcels.",
      cost: 200,
      icon: "airplane-outline",
      type: "SHIPPING"
    },
    {
      id: "b4",
      title: "Atelier Private Viewing",
      desc: "One-hour private showcase streaming with a certified master craftsman.",
      cost: 1200,
      icon: "videocam-outline",
      type: "PRIVATE_SHOWROOM"
    }
  ];

  const EARNING_MISSIONS = [
    {
      id: "m1",
      title: "Curate a Masterpiece",
      desc: "Upload a new visual reel showing off your latest styling.",
      reward: 150,
      icon: "camera-outline"
    },
    {
      id: "m2",
      title: "Complete WMS Pick Task",
      desc: "Help spatial sorting algorithms pack order warehouse logs.",
      reward: 100,
      icon: "cube-outline"
    },
    {
      id: "m3",
      title: "Verify Competitor Audits",
      desc: "Launch an automated AI repricing loop to secure lowest rates.",
      reward: 75,
      icon: "stats-chart-outline"
    },
    {
      id: "m4",
      title: "Syndicate Social Comments",
      desc: "Engage in live showroom WebRTC broadcasts with collectors.",
      reward: 50,
      icon: "chatbubbles-outline"
    }
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              triggerHaptic("light");
              router.back();
            }}
          >
            <Lucide name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loyalty Vault</Text>
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => {
              triggerHaptic("light");
              Alert.alert(
                "Loyalty Ledger",
                "Your AURA Curation Credits are accumulated across verified marketplace activities and catalog sorting interactions. Credits can be traded for premium early-access slots and bespoke atelier coupons."
              );
            }}
          >
            <Lucide name="information-circle-outline" size={24} color="#00f5ff" />
          </TouchableOpacity>
        </View>

        {/* Tier Card */}
        <View style={styles.tierCardGlow}>
          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <View style={styles.tierBadge}>
                <Lucide name="sparkles" size={17} color="#000" />
                <Text style={styles.tierBadgeText}>{loyaltyElite ? "ELITE CURATOR" : "SOVEREIGN MEMBER"}</Text>
              </View>
              <Lucide name="infinite" size={26} color="#00f5ff" />
            </View>

            <Text style={styles.pointsLabel}>Curation Balance</Text>
            <Text style={styles.pointsValue}>{loyaltyPoints.toLocaleString()} <Text style={styles.pointsSuffix}>Credits</Text></Text>

            {loyaltyElite && loyaltyEliteUntil ? (
              <Text style={styles.tierExpiry}>
                {"Elite status active through " + new Date(loyaltyEliteUntil).toLocaleDateString()}
              </Text>
            ) : (
              <Text style={styles.tierExpiry}>{"Redeem 2,500 credits to ascend to Elite Status."}</Text>
            )}

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min((loyaltyPoints / 2500) * 100, 100)}%` }]} />
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabelLeft}>0 CR</Text>
              <Text style={styles.progressLabelRight}>2,500 CR for VIP Tier</Text>
            </View>
          </View>
        </View>

        {/* Segmented Switcher */}
        <View style={styles.tabBar}>
          {(["earn", "redeem", "history"] as const).map((tab) => {
            const isAct = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isAct && styles.tabBtnActive]}
                onPress={() => {
                  triggerHaptic("light");
                  setActiveTab(tab);
                }}
              >
                <Text style={[styles.tabText, isAct && styles.tabTextActive]}>
                  {tab === "earn" ? "Earn Credits" : tab === "redeem" ? "Redeem Rewards" : "Ledger Logs"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content Section */}
        {loadingLoyalty ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00f5ff" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* EARN TAB */}
            {activeTab === "earn" && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeading}>Active Missions</Text>
                {EARNING_MISSIONS.map((mission) => (
                  <View key={mission.id} style={styles.missionCard}>
                    <View style={styles.missionIconBox}>
                      <Lucide name={mission.icon as any} size={23} color="#00f5ff" />
                    </View>
                    <View style={styles.missionInfo}>
                      <Text style={styles.missionTitle}>{mission.title}</Text>
                      <Text style={styles.missionDesc}>{mission.desc}</Text>
                    </View>
                    <View style={styles.missionRewardBox}>
                      <Text style={styles.missionRewardVal}>+{mission.reward}</Text>
                      <Text style={styles.missionRewardSub}>Credits</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* REDEEM TAB */}
            {activeTab === "redeem" && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeading}>Mint Sovereign Coupons</Text>
                <View style={styles.benefitsGrid}>
                  {REDEEMABLE_BENEFITS.map((benefit) => {
                    const isAffordable = loyaltyPoints >= benefit.cost;
                    return (
                      <TouchableOpacity
                        key={benefit.id}
                        style={[styles.benefitCard, !isAffordable && styles.benefitCardLocked]}
                        activeOpacity={0.8}
                        onPress={() => {
                          triggerHaptic("light");
                          setSelectedBenefit(benefit);
                        }}
                      >
                        <View style={styles.benefitHeader}>
                          <Lucide name={benefit.icon as any} size={24} color={isAffordable ? "#00f5ff" : "rgba(255,255,255,0.3)"} />
                          <View style={styles.costBadge}>
                            <Text style={styles.costBadgeText}>{benefit.cost} CR</Text>
                          </View>
                        </View>
                        <Text style={styles.benefitTitle} numberOfLines={1}>{benefit.title}</Text>
                        <Text style={styles.benefitDesc} numberOfLines={2}>{benefit.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeading}>Loyalty Transaction Ledger</Text>
                {rewardLogs.length === 0 ? (
                  <View style={styles.emptyLogsCard}>
                    <Lucide name="receipt-outline" size={34} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyLogsText}>{"No reward transactions recorded."}</Text>
                    <Text style={styles.emptyLogsSub}>Engage in verified mesh transactions to populate this ledger.</Text>
                  </View>
                ) : (
                  rewardLogs.map((log: any) => {
                    const isDebit = log.type === "DEBIT" || log.points < 0;
                    return (
                      <View key={log.id} style={styles.logCard}>
                        <View style={[styles.logIconBox, isDebit ? styles.logIconBoxDebit : styles.logIconBoxCredit]}>
                          <Lucide name={isDebit ? "arrow-up" : "arrow-down"} size={17} color="#000" />
                        </View>
                        <View style={styles.logInfo}>
                          <Text style={styles.logTitle}>{log.title || log.description}</Text>
                          <Text style={styles.logDate}>{new Date(log.createdAt).toLocaleString()}</Text>
                        </View>
                        <Text style={[styles.logPointsText, isDebit ? styles.logPointsDebit : styles.logPointsCredit]}>
                          {(isDebit ? "" : "+") + log.points}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}

          </ScrollView>
        )}

        {/* Modal Benefit Preview Detail Drawer */}
        {selectedBenefit && (
          <View style={styles.drawerOverlay}>
            <View style={styles.drawerContent}>
              <View style={styles.drawerHandle} />
              
              <View style={styles.drawerHeader}>
                <Lucide name={selectedBenefit.icon} size={34} color="#00f5ff" />
                <Text style={styles.drawerTitle}>{selectedBenefit.title}</Text>
                <Text style={styles.drawerCost}>{selectedBenefit.cost} Credits</Text>
              </View>

              <Text style={styles.drawerDesc}>{selectedBenefit.desc}</Text>
              <Text style={styles.drawerTelemetryText}>
                {"Every redemption initiates a validated cryptographic block update inside our AURA database. Coupon is generated immediately and remains stackable."}
              </Text>

              <View style={styles.drawerActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    triggerHaptic("light");
                    setSelectedBenefit(null);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmRedeemBtn, loyaltyPoints < selectedBenefit.cost && styles.confirmRedeemBtnDisabled]}
                  disabled={loyaltyPoints < selectedBenefit.cost || redeeming}
                  onPress={() => handleRedeem(selectedBenefit)}
                >
                  {redeeming ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.confirmRedeemBtnText}>Mint Coupon</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415"
  },
  safeArea: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  infoBtn: {
    padding: 4
  },
  tierCardGlow: {
    margin: 20,
    padding: 1,
    borderRadius: 24,
    backgroundColor: "rgba(0, 245, 255,  0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.3)"
  },
  tierCard: {
    backgroundColor: "#0d0822",
    padding: 20,
    borderRadius: 23,
    gap: 8
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00f5ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4
  },
  tierBadgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12
  },
  pointsValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  pointsSuffix: {
    color: "#00f5ff",
    fontSize: 16.5,
    fontWeight: "600"
  },
  tierExpiry: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 2,
    marginTop: 12
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#00f5ff",
    borderRadius: 2
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4
  },
  progressLabelLeft: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "600"
  },
  progressLabelRight: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "600"
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 8,
    gap: 20
  },
  tabBtn: {
    paddingBottom: 6
  },
  tabBtnActive: {
    borderBottomWidth: 1.5,
    borderColor: "#00f5ff"
  },
  tabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "bold",
    letterSpacing: 0.2
  },
  tabTextActive: {
    color: "#fff"
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50
  },
  scrollContent: {
    paddingBottom: 40
  },
  tabContent: {
    padding: 20
  },
  sectionHeading: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16
  },
  missionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12
  },
  missionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,245,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  missionInfo: {
    flex: 1,
    marginRight: 8
  },
  missionTitle: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold"
  },
  missionDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2
  },
  missionRewardBox: {
    alignItems: "flex-end"
  },
  missionRewardVal: {
    color: "#00f5ff",
    fontSize: 16.5,
    fontWeight: "bold"
  },
  missionRewardSub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12
  },
  benefitCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 16,
    width: (width - 52) / 2,
    gap: 12
  },
  benefitCardLocked: {
    opacity: 0.6
  },
  benefitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  costBadge: {
    backgroundColor: "rgba(0,245,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  costBadgeText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold"
  },
  benefitTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold"
  },
  benefitDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 11
  },
  emptyLogsCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 32,
    marginTop: 12,
    gap: 10
  },
  emptyLogsText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold"
  },
  emptyLogsSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 11
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12
  },
  logIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  logIconBoxCredit: {
    backgroundColor: "#00ff00"
  },
  logIconBoxDebit: {
    backgroundColor: "#ff3b30"
  },
  logInfo: {
    flex: 1,
    marginRight: 8
  },
  logTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold"
  },
  logDate: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2
  },
  logPointsText: {
    fontSize: 14.5,
    fontWeight: "bold"
  },
  logPointsCredit: {
    color: "#00ff00"
  },
  logPointsDebit: {
    color: "#ff3b30"
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end"
  },
  drawerContent: {
    backgroundColor: "#0d0822",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    gap: 16
  },
  drawerHandle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8
  },
  drawerHeader: {
    alignItems: "center",
    gap: 6
  },
  drawerTitle: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold"
  },
  drawerCost: {
    color: "#00f5ff",
    fontSize: 15.5,
    fontWeight: "bold"
  },
  drawerDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 14
  },
  drawerTelemetryText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 12,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    paddingTop: 12
  },
  drawerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  cancelBtnText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold"
  },
  confirmRedeemBtn: {
    flex: 1.5,
    backgroundColor: "#00f5ff",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center"
  },
  confirmRedeemBtnDisabled: {
    backgroundColor: "rgba(0,245,255,0.2)"
  },
  confirmRedeemBtnText: {
    color: "#000",
    fontSize: 14.5,
    fontWeight: "bold"
  }
});
