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
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  respondBrandPartnershipWithConfirmation,
  partnershipTypeLabel,
  fundPartnershipEscrowApi,
  verifyPartnershipEscrowApi,
} from "@/lib/brandPartnershipApi";
import { getEnforcedSettings } from "@/lib/settingsEnforcement";

let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require("react-native-razorpay").default || require("react-native-razorpay");
} catch {
  RazorpayCheckout = null;
}

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
    activeProfile,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"proposals" | "propose">("proposals");
  const [selectedCreatorProfileId, setSelectedCreatorProfileId] = useState("");
  const [partnershipTitle, setPartnershipTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [terms, setTerms] = useState("");
  const [selectedType, setSelectedType] = useState<
    "SPONSORED_REEL" | "STORY_FEATURE" | "AFFILIATE_SHARE" | "AMBASSADOR"
  >("SPONSORED_REEL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCreatorMode =
    activeProfile?.type === "INFLUENCER" ||
    activeProfile?.type === "CREATOR" ||
    activeProfile?.type === "PERSONAL" ||
    activeProfile?.category?.toLowerCase().includes("creator") ||
    activeProfile?.category?.toLowerCase().includes("influencer") ||
    activeProfile?.category?.toLowerCase().includes("stylist") ||
    activeProfile?.category?.toLowerCase().includes("artist");

  const brandPartnershipsAllowed =
    getEnforcedSettings()?.store?.allowBrandPartnerships !== false;
  const creatorAcceptsPartnerships =
    getEnforcedSettings()?.creator?.acceptBrandPartnerships !== false;

  useEffect(() => {
    const userId = currentUser?.id;
    const maisonId = activeMaisonId;
    if (!userId && !maisonId) return;

    if (isCreatorMode && activeProfile?.id) {
      fetchBrandDeals({ creatorId: userId!, creatorProfileId: activeProfile.id });
    } else if (maisonId) {
      fetchBrandDeals({ maisonId });
      fetchInfluencers();
    }
  }, [isCreatorMode, activeMaisonId, currentUser?.id, activeProfile?.id]);

  const refreshDeals = () => {
    const userId = currentUser?.id;
    const maisonId = activeMaisonId;
    if (isCreatorMode && userId && activeProfile?.id) {
      fetchBrandDeals({ creatorId: userId, creatorProfileId: activeProfile.id });
    } else if (maisonId) {
      fetchBrandDeals({ maisonId });
    }
  };

  const handleProposeDeal = async () => {
    if (!brandPartnershipsAllowed) {
      Alert.alert(
        "Partnerships disabled",
        "Enable brand partnerships in Settings → Store → Brand partnerships."
      );
      return;
    }
    if (!selectedCreatorProfileId || !budget || !terms.trim()) {
      triggerHaptic("heavy");
      Alert.alert("Missing info", "Creator, budget, and terms are required.");
      return;
    }
    if (!activeMaisonId) {
      Alert.alert("No store", "Switch to a store profile to propose partnerships.");
      return;
    }

    setIsSubmitting(true);
    triggerHaptic("medium");

    const success = await proposeBrandDeal({
      creatorProfileId: selectedCreatorProfileId,
      maisonId: activeMaisonId,
      budget: parseFloat(budget),
      type: selectedType,
      terms: terms.trim(),
      title: partnershipTitle.trim() || undefined,
    });

    if (success) {
      const isEnterprise = parseFloat(budget) > 500000;
      Alert.alert(
        "Offer sent",
        isEnterprise
          ? "Enterprise deal sent. Creator can accept now; payment is off-platform unless you fund optional escrow."
          : "Fund escrow via Razorpay so the creator can accept."
      );
      setBudget("");
      setTerms("");
      setPartnershipTitle("");
      setSelectedCreatorProfileId("");
      setActiveTab("proposals");
      refreshDeals();
    } else {
      Alert.alert("Proposal failed", "Could not send partnership offer. Check wallet balance and settings.");
    }
    setIsSubmitting(false);
  };

  const handleRespond = async (
    dealId: string,
    action: "accept" | "decline" | "complete" | "confirm"
  ) => {
    if (!currentUser?.id || !activeProfile?.id) return;
    triggerHaptic("medium");

    const result = await respondBrandPartnershipWithConfirmation({
      userId: currentUser.id,
      profileId: activeProfile.id,
      dealId,
      respondAction: action,
    });

    if (result.success) {
      triggerHaptic("success");
      refreshDeals();
    }
  };

  const handleFundEscrow = async (deal: any) => {
    if (!currentUser?.id) return;
    triggerHaptic("medium");
    const order = await fundPartnershipEscrowApi(currentUser.id, deal.id);
    if (!order.success) {
      Alert.alert("Escrow", order.error || "Could not create payment.");
      return;
    }
    if (order.alreadyFunded) {
      Alert.alert("Escrow", "Already funded.");
      refreshDeals();
      return;
    }

    const payWithRazorpay = async () => {
      if (!RazorpayCheckout || order.razorpayOrderId?.startsWith("order_sim_")) {
        const verify = await verifyPartnershipEscrowApi({
          userId: currentUser.id,
          dealId: deal.id,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: "pay_sim_escrow",
          razorpaySignature: "sig_sim",
        });
        if (verify.success) {
          triggerHaptic("success");
          refreshDeals();
          Alert.alert("Escrow funded", "Creator can now accept this partnership.");
        }
        return;
      }
      try {
        const data = await RazorpayCheckout.open({
          description: order.dealTitle || "Partnership escrow",
          currency: order.currency || "INR",
          key: order.key,
          amount: Math.round(order.amount * 100),
          order_id: order.razorpayOrderId,
          name: "AURA Partnership Escrow",
          prefill: { email: currentUser.email || "", contact: currentUser.phone || "" },
          theme: { color: "#818cf8" },
        });
        const verify = await verifyPartnershipEscrowApi({
          userId: currentUser.id,
          dealId: deal.id,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
        });
        if (verify.success) {
          triggerHaptic("success");
          refreshDeals();
          Alert.alert("Escrow funded", "Real funds locked — creator can accept.");
        } else {
          Alert.alert("Verification failed", verify.error || "Try again.");
        }
      } catch {
        Alert.alert("Payment cancelled");
      }
    };

    Alert.alert(
      "Fund partnership escrow",
      `Pay ₹${Math.round(deal.budget).toLocaleString("en-IN")} via Razorpay. Funds are held until deliverables are confirmed or refunded if declined.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Pay now", onPress: payWithRazorpay },
      ]
    );
  };

  const renderDealCard = ({ item }: { item: any }) => {
    const isPending = item.status === "PENDING";
    const isAccepted = item.status === "ACCEPTED";
    const isCompleted = item.status === "COMPLETED";
    const isOffPlatform = item.paymentMode === "OFF_PLATFORM";
    const escrowLocked =
      item.escrowStatus === "LOCKED" || item.escrowStatus === "FUNDED";
    const creatorCanAccept =
      isPending &&
      (isOffPlatform
        ? item.escrowStatus === "OFF_PLATFORM" || escrowLocked
        : escrowLocked);
    const brandMustFund =
      isPending && !isOffPlatform && !escrowLocked && item.escrowRequired !== false;
    const brandOptionalFund =
      isPending && isOffPlatform && item.escrowStatus === "OFF_PLATFORM";

    let statusColor = "#ffa500";
    if (isAccepted) statusColor = "#00f5ff";
    if (isCompleted) statusColor = "#00ff00";
    if (item.status === "DECLINED") statusColor = "#ff0055";

    return (
      <View style={styles.dealCard}>
        <View style={styles.dealHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.dealLabel}>
              {isCreatorMode ? "Brand" : "Creator"}
            </Text>
            <Text style={styles.dealTitle}>
              {item.title ||
                (isCreatorMode
                  ? item.maison?.name || "Brand"
                  : `@${item.creator?.name || "creator"}`)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.dealMetaRow}>
          <View>
            <Text style={styles.dealMetaLabel}>Budget</Text>
            <Text style={styles.dealMetaVal}>₹{Math.round(item.budget || 0).toLocaleString("en-IN")}</Text>
          </View>
          <View>
            <Text style={styles.dealMetaLabel}>Type</Text>
            <Text style={styles.dealMetaVal}>{partnershipTypeLabel(item.type || "")}</Text>
          </View>
          <View>
            <Text style={styles.dealMetaLabel}>Escrow</Text>
            <Text style={styles.dealMetaVal}>{item.escrowStatus || "NONE"}</Text>
          </View>
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Terms</Text>
          <Text style={styles.termsText}>{item.terms}</Text>
        </View>

        {isOffPlatform ? (
          <Text style={styles.enterpriseBadge}>
            Enterprise deal · payment off-platform (escrow optional below ₹5L threshold)
          </Text>
        ) : null}

        {brandMustFund && (
          <TouchableOpacity style={styles.fundEscrowBtn} onPress={() => handleFundEscrow(item)}>
            <Lucide name="card-outline" size={16} color="#000" />
            <Text style={styles.completeText}>Fund escrow (required)</Text>
          </TouchableOpacity>
        )}

        {brandOptionalFund && (
          <TouchableOpacity style={styles.fundEscrowOptionalBtn} onPress={() => handleFundEscrow(item)}>
            <Lucide name="card-outline" size={16} color="#fff" />
            <Text style={styles.optionalFundText}>Fund escrow via Razorpay (optional)</Text>
          </TouchableOpacity>
        )}

        {isCreatorMode && isPending && !creatorCanAccept && !isOffPlatform && (
          <Text style={styles.waitingEscrow}>
            Waiting for brand to fund escrow before you can accept.
          </Text>
        )}

        {isCreatorMode && isPending && isOffPlatform && item.escrowStatus === "OFF_PLATFORM" && (
          <Text style={styles.offPlatformHint}>
            You may accept now. Payment will be handled off-platform (invoice/wire) unless brand funds escrow.
          </Text>
        )}

        {isCreatorMode && isPending && creatorAcceptsPartnerships && creatorCanAccept && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleRespond(item.id, "decline")}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleRespond(item.id, "accept")}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCreatorMode && isAccepted && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => handleRespond(item.id, "complete")}
          >
            <Lucide name="checkmark-circle-outline" size={16} color="#000" />
            <Text style={styles.completeText}>Mark deliverables complete</Text>
          </TouchableOpacity>
        )}

        {!isCreatorMode && isAccepted && escrowLocked && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => handleRespond(item.id, "confirm")}
          >
            <Lucide name="wallet-outline" size={16} color="#000" />
            <Text style={styles.completeText}>Confirm & pay creator</Text>
          </TouchableOpacity>
        )}

        {!isCreatorMode && isAccepted && isOffPlatform && item.escrowStatus === "OFF_PLATFORM" && (
          <TouchableOpacity
            style={styles.confirmExternalBtn}
            onPress={() => handleRespond(item.id, "confirm")}
          >
            <Lucide name="checkmark-circle-outline" size={16} color="#000" />
            <Text style={styles.completeText}>Confirm deliverables (paid off-platform)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              triggerHaptic("light");
              router.back();
            }}
          >
            <Lucide name="chevron-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Brand partnerships</Text>
          <View style={{ width: 40 }} />
        </View>

        {!isCreatorMode && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "proposals" && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic("light");
                setActiveTab("proposals");
              }}
            >
              <Text style={[styles.tabText, activeTab === "proposals" && styles.tabTextActive]}>
                Active deals
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "propose" && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic("light");
                setActiveTab("propose");
              }}
            >
              <Text style={[styles.tabText, activeTab === "propose" && styles.tabTextActive]}>
                New offer
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isCreatorMode && !creatorAcceptsPartnerships ? (
          <View style={styles.disabledBanner}>
            <Text style={styles.bannerTitle}>Partnership offers paused</Text>
            <Text style={styles.bannerSub}>
              Enable offers in Settings → Creator → Brand partnerships.
            </Text>
          </View>
        ) : null}

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
                  <Lucide name="briefcase-outline" size={32} color="#818cf8" />
                  <Text style={styles.bannerTitle}>Official brand partnerships</Text>
                  <Text style={styles.bannerSub}>
                    Accept contracts, deliver content, and get paid after brand confirmation.
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              loadingDeals ? (
                <ActivityIndicator size="large" color="#818cf8" style={{ marginTop: 40 }} />
              ) : (
                <View style={styles.emptyBox}>
                  <Lucide name="file-tray-outline" size={36} color="rgba(255,255,255,0.15)" />
                  <Text style={styles.emptyText}>No partnership deals yet.</Text>
                </View>
              )
            }
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {!brandPartnershipsAllowed ? (
              <View style={styles.disabledBanner}>
                <Text style={styles.bannerTitle}>Partnerships disabled for this store</Text>
                <Text style={styles.bannerSub}>
                  Turn on in Settings → Store → Brand partnerships.
                </Text>
              </View>
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Propose partnership</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Select creator</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.influencerScroll}
                  >
                    {influencers.map((inf: any) => {
                      const profileId = inf.profileId || inf.id;
                      const isSel = selectedCreatorProfileId === profileId;
                      return (
                        <TouchableOpacity
                          key={profileId}
                          style={[styles.influencerCard, isSel && styles.influencerCardActive]}
                          onPress={() => setSelectedCreatorProfileId(profileId)}
                        >
                          <Lucide
                            name="person-circle-outline"
                            size={24}
                            color={isSel ? "#818cf8" : "#fff"}
                          />
                          <Text style={[styles.influencerName, isSel && styles.influencerNameActive]}>
                            @{inf.username || "creator"}
                          </Text>
                          <Text style={styles.influencerCat}>{inf.category || "Creator"}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Campaign title</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Summer collection launch"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={partnershipTitle}
                    onChangeText={setPartnershipTitle}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Budget (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="25000"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="numeric"
                    value={budget}
                    onChangeText={setBudget}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Campaign type</Text>
                  <View style={styles.toggleGroup}>
                    {(["SPONSORED_REEL", "STORY_FEATURE", "AFFILIATE_SHARE", "AMBASSADOR"] as const).map(
                      (ch) => {
                        const isSel = selectedType === ch;
                        return (
                          <TouchableOpacity
                            key={ch}
                            style={[styles.toggleBtn, isSel && styles.toggleBtnActive]}
                            onPress={() => setSelectedType(ch)}
                          >
                            <Text style={[styles.toggleText, isSel && styles.toggleTextActive]}>
                              {partnershipTypeLabel(ch)}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Terms & deliverables</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="1 reel + 2 stories within 14 days..."
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
                    <Text style={styles.submitText}>Send partnership offer</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080415" },
  safeArea: { flex: 1 },
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
  tabText: { color: "rgba(255,255,255,0.5)", fontSize: 12.5, fontWeight: "bold" },
  tabTextActive: { color: "#818cf8" },
  listContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 60 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 60 },
  creatorBanner: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  disabledBanner: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bannerTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  bannerSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 15,
  },
  emptyBox: { paddingVertical: 80, alignItems: "center", gap: 12 },
  emptyText: { color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center" },
  dealCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  dealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dealLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  dealTitle: { color: "#fff", fontSize: 15.5, fontWeight: "bold", marginTop: 2 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
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
  dealMetaVal: { color: "#fff", fontSize: 13.5, fontWeight: "bold", marginTop: 2 },
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
  termsText: { color: "rgba(255, 255, 255, 0.7)", fontSize: 12, lineHeight: 15 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  declineBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.2)",
  },
  declineText: { color: "#ff0055", fontSize: 12.5, fontWeight: "bold" },
  acceptBtn: { backgroundColor: "#818cf8" },
  acceptText: { color: "#000", fontSize: 12.5, fontWeight: "bold" },
  completeBtn: {
    backgroundColor: "#34d399",
    flexDirection: "row",
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: "#818cf8",
    flexDirection: "row",
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  fundEscrowBtn: {
    backgroundColor: "#fbbf24",
    flexDirection: "row",
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  waitingEscrow: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  offPlatformHint: {
    color: "#a5b4fc",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  enterpriseBadge: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 6,
  },
  fundEscrowOptionalBtn: {
    backgroundColor: "rgba(129, 140, 248, 0.25)",
    borderWidth: 1,
    borderColor: "#818cf8",
    flexDirection: "row",
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  optionalFundText: { color: "#c7d2fe", fontSize: 12, fontWeight: "600" },
  confirmExternalBtn: {
    backgroundColor: "#94a3b8",
    flexDirection: "row",
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  completeText: { color: "#000", fontSize: 12.5, fontWeight: "bold" },
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
  formGroup: { gap: 6 },
  formLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  influencerScroll: { gap: 10, paddingVertical: 4 },
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
    borderColor: "#818cf8",
    backgroundColor: "rgba(129, 140, 248, 0.08)",
  },
  influencerName: { color: "#fff", fontSize: 13, fontWeight: "600", textAlign: "center" },
  influencerNameActive: { color: "#818cf8" },
  influencerCat: { color: "rgba(255,255,255,0.3)", fontSize: 10.5, textAlign: "center" },
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
  textArea: { height: 90, paddingTop: 12, paddingBottom: 12, textAlignVertical: "top" },
  toggleGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  toggleBtnActive: { backgroundColor: "#818cf8", borderColor: "#818cf8" },
  toggleText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "bold" },
  toggleTextActive: { color: "#000" },
  submitBtn: {
    backgroundColor: "#818cf8",
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
