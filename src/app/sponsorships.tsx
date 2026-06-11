import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function SponsorshipsScreen() {
  const {
    brandDeals,
    loadingDeals,
    fetchBrandDeals,
    proposeBrandDeal,
    respondToBrandDeal,
    influencers,
    fetchInfluencers,
    triggerHaptic,
    currentUser,
    activeMaisonId,
    activeProfile
  } = useStore();

  const [activeTab, setActiveTab] = useState<"proposals" | "propose">("proposals");

  // Form states (Maison Brand only)
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [budget, setBudget] = useState("");
  const [terms, setTerms] = useState("");
  const [selectedType, setSelectedType] = useState<"SPONSORED_REEL" | "AFFILIATE_SHARE">("SPONSORED_REEL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect perspective: Creator vs Brand
  const isCreatorMode =
    activeProfile?.type === "INFLUENCER" ||
    activeProfile?.category?.toLowerCase().includes("creator") ||
    activeProfile?.category?.toLowerCase().includes("influencer") ||
    activeProfile?.category?.toLowerCase().includes("stylist") ||
    activeProfile?.category?.toLowerCase().includes("artist");

  useEffect(() => {
    const userId = currentUser?.id || "cmpctrlqn000004ktfuqga0td";
    const maisonId = activeMaisonId;
    
    if (isCreatorMode) {
      // Influencer fetches deals assigned to them
      fetchBrandDeals({ creatorId: userId });
    } else {
      // Brand fetches deals created by them and queries influencers
      fetchBrandDeals({ maisonId });
      fetchInfluencers();
    }
  }, [isCreatorMode, activeMaisonId, currentUser]);

  const handleProposeDeal = async () => {
    if (!selectedInfluencerId || !budget || !terms) {
      triggerHaptic("heavy");
      Alert.alert("Missing Parameters", "Influencer, Budget, and Terms are required to launch a B2B contract.");
      return;
    }

    setIsSubmitting(true);
    triggerHaptic("medium");

    const payload = {
      creatorId: selectedInfluencerId,
      maisonId: activeMaisonId,
      budget: parseFloat(budget),
      type: selectedType,
      terms
    };

    const success = await proposeBrandDeal(payload);
    if (success) {
      Alert.alert("Proposal Dispatched", "Sponsorship contract proposal has been registered and sent to the creator.");
      setBudget("");
      setTerms("");
      setSelectedInfluencerId("");
      setActiveTab("proposals");
    } else {
      Alert.alert("Proposal Failed", "Failed to dispatch proposal contract.");
    }
    setIsSubmitting(false);
  };

  const handleRespond = async (dealId: string, status: "ACCEPTED" | "DECLINED" | "COMPLETED") => {
    triggerHaptic("medium");
    const actionText = status === "ACCEPTED" ? "accept" : status === "DECLINED" ? "decline" : "complete";
    
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${actionText} this contract?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const success = await respondToBrandDeal(dealId, status);
            if (success) {
              Alert.alert("Contract Updated", `Deal status updated to ${status}.`);
            } else {
              Alert.alert("Update Denied", "Failed to resolve contract status.");
            }
          }
        }
      ]
    );
  };

  const renderDealCard = ({ item }: { item: any }) => {
    const isPending = item.status === "PENDING";
    const isAccepted = item.status === "ACCEPTED";
    const isCompleted = item.status === "COMPLETED";

    let statusColor = "#ffa500"; // orange for pending
    if (isAccepted) statusColor = "#00f5ff"; // cyan
    if (isCompleted) statusColor = "#00ff00"; // green
    if (item.status === "DECLINED") statusColor = "#ff0055"; // red

    return (
      <View style={styles.dealCard}>
        <View style={styles.dealHeader}>
          <View>
            <Text style={styles.dealLabel}>
              {isCreatorMode ? "Client Brand" : "Content Partner"}
            </Text>
            <Text style={styles.dealTitle}>
              {isCreatorMode ? item.maison?.name || "Premium Brand" : `@${item.creator?.name || "Creator"}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.dealMetaRow}>
          <View>
            <Text style={styles.dealMetaLabel}>Budget Contract</Text>
            <Text style={styles.dealMetaVal}>₹{item.budget?.toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.dealMetaLabel}>Campaign Nodes</Text>
            <Text style={styles.dealMetaVal}>{item.type?.replace("_", " ")}</Text>
          </View>
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Contract Specifications</Text>
          <Text style={styles.termsText}>{item.terms}</Text>
        </View>

        {isCreatorMode && isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleRespond(item.id, "DECLINED")}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleRespond(item.id, "ACCEPTED")}
            >
              <Text style={styles.acceptText}>Accept Contract</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCreatorMode && isAccepted && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => handleRespond(item.id, "COMPLETED")}
          >
            <Lucide name="checkmark-circle-outline" size={16} color="#000" />
            <Text style={styles.completeText}>Submit Deliverables (Complete)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Nav Header */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); router.back(); }}>
            <Lucide name="chevron-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Sponsorship Portal</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Selection Bar (Only for Brand perspective to create deals) */}
        {!isCreatorMode && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "proposals" && styles.tabBtnActive]}
              onPress={() => { triggerHaptic("light"); setActiveTab("proposals"); }}
            >
              <Text style={[styles.tabText, activeTab === "proposals" && styles.tabTextActive]}>Active Deals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "propose" && styles.tabBtnActive]}
              onPress={() => { triggerHaptic("light"); setActiveTab("propose"); }}
            >
              <Text style={[styles.tabText, activeTab === "propose" && styles.tabTextActive]}>Propose Contract</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCreatorMode || activeTab === "proposals" ? (
          <FlatList
            data={brandDeals}
            renderItem={renderDealCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isCreatorMode ? (
                <View style={styles.creatorBanner}>
                  <Lucide name="briefcase-outline" size={32} color="#00f5ff" />
                  <Text style={styles.bannerTitle}>Influencer Partnerships Ledger</Text>
                  <Text style={styles.bannerSub}>Accept incoming brand contracts and coordinate deliverables below.</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              loadingDeals ? (
                <ActivityIndicator size="large" color="#00f5ff" style={{ marginTop: 40 }} />
              ) : (
                <View style={styles.emptyBox}>
                  <Lucide name="file-tray-outline" size={36} color="rgba(255,255,255,0.15)" />
                  <Text style={styles.emptyText}>No sponsorship contracts cataloged on the ledger.</Text>
                </View>
              )
            }
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Draft B2B Sponsorship Proposal</Text>

              {/* Influencer Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Content Creator</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.influencerScroll}>
                  {influencers.map((inf: any) => {
                    const isSel = selectedInfluencerId === inf.userId;
                    return (
                      <TouchableOpacity
                        key={inf.id}
                        style={[styles.influencerCard, isSel && styles.influencerCardActive]}
                        onPress={() => setSelectedInfluencerId(inf.userId)}
                      >
                        <Lucide name="person-circle-outline" size={24} color={isSel ? "#00f5ff" : "#fff"} />
                        <Text style={[styles.influencerName, isSel && styles.influencerNameActive]}>
                          @{inf.username || "creator"}
                        </Text>
                        <Text style={styles.influencerCat}>{inf.category || "Influencer"}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Budget */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sponsorship Budget (₹ INR)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 25000"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>

              {/* Campaign Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contract Type</Text>
                <View style={styles.toggleGroup}>
                  {(["SPONSORED_REEL", "AFFILIATE_SHARE"] as const).map((ch) => {
                    const isSel = selectedType === ch;
                    return (
                      <TouchableOpacity
                        key={ch}
                        style={[styles.toggleBtn, isSel && styles.toggleBtnActive]}
                        onPress={() => setSelectedType(ch)}
                      >
                        <Text style={[styles.toggleText, isSel && styles.toggleTextActive]}>
                          {ch.replace("_", " ")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Terms contract specifications */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contract Terms & Deliverables</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe content deliverables, timelines, and post guidelines..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                  numberOfLines={4}
                  value={terms}
                  onChangeText={setTerms}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleProposeDeal}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.submitText}>Dispatch Sponsorship Contract</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
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
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
  },
  tabBtnActive: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  tabTextActive: {
    color: "#00f5ff",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  creatorBanner: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.15)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  bannerSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 15,
  },
  emptyBox: {
    paddingVertical: 80,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    textAlign: "center",
  },
  dealCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  dealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dealLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  dealTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dealMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    paddingVertical: 10,
  },
  dealMetaLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  dealMetaVal: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  termsBox: {
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  termsTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  termsText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.2)",
  },
  declineText: {
    color: "#ff0055",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  acceptBtn: {
    backgroundColor: "#00f5ff",
  },
  acceptText: {
    color: "#000",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  completeBtn: {
    backgroundColor: "#00ff00",
    flexDirection: "row",
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  completeText: {
    color: "#000",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  formCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 28,
    padding: 22,
    gap: 16,
  },
  formTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  influencerScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  influencerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 18,
    padding: 12,
    width: 140,
    alignItems: "center",
    gap: 4,
  },
  influencerCardActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0, 245, 255, 0.04)",
  },
  influencerName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  influencerNameActive: {
    color: "#00f5ff",
  },
  influencerCat: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10.5,
    textAlign: "center",
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    color: "#fff",
    paddingHorizontal: 16,
    fontSize: 14.5,
    height: 48,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  toggleGroup: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
  },
  toggleBtnActive: {
    backgroundColor: "#00f5ff",
  },
  toggleText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  toggleTextActive: {
    color: "#000",
  },
  submitBtn: {
    backgroundColor: "#00f5ff",
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
