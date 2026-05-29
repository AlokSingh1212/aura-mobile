import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function AdsStudioScreen() {
  const {
    adBids,
    adMetrics,
    loadingAds,
    fetchAdBids,
    createAdBid,
    fundAdWallet,
    products,
    fetchProducts,
    triggerHaptic,
    activeMaisonId
  } = useStore();

  const maisonId = activeMaisonId;
  const [attributionModel, setAttributionModel] = useState<"LAST_TOUCH" | "LINEAR" | "POSITION_BASED" | "TIME_DECAY">("LAST_TOUCH");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [fundingVisible, setFundingVisible] = useState(false);

  // Form Bid States
  const [selectedProduct, setSelectedProduct] = useState("");
  const [keyword, setKeyword] = useState("");
  const [maxCpc, setMaxCpc] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedGender, setSelectedGender] = useState("ALL");
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("100");
  const [pincode, setPincode] = useState("");
  const [selectedPlacement, setSelectedPlacement] = useState<"SEARCH" | "SOCIAL_FEED" | "BOTH">("SEARCH");

  useEffect(() => {
    fetchAdBids(maisonId, attributionModel);
    fetchProducts();
  }, [attributionModel, maisonId]);

  const handleAttributionChange = (model: typeof attributionModel) => {
    triggerHaptic("medium");
    setAttributionModel(model);
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      triggerHaptic("heavy");
      Alert.alert("Invalid Input", "Please enter a valid credit amount to fund.");
      return;
    }
    triggerHaptic("medium");
    const success = await fundAdWallet(maisonId, parseFloat(topUpAmount));
    if (success) {
      Alert.alert("Deposit Settled", `Successfully loaded ₹${parseFloat(topUpAmount).toLocaleString()} credits into your Ad Wallet.`);
      setTopUpAmount("");
      setFundingVisible(false);
    } else {
      Alert.alert("Transaction Aborted", "Wallet top-up failed. Check your gateway connection.");
    }
  };

  const handleCreateBid = async () => {
    if (!selectedProduct || !maxCpc || !budget) {
      triggerHaptic("heavy");
      Alert.alert("Missing Parameters", "Artifact, Max CPC, and Budget are required parameters.");
      return;
    }

    triggerHaptic("medium");
    const payload = {
      maisonId,
      artifactId: selectedProduct,
      maxCpc: parseFloat(maxCpc),
      budget: parseFloat(budget),
      keyword: keyword || "General",
      targetGenders: [selectedGender],
      minAge: parseInt(minAge),
      maxAge: parseInt(maxAge),
      targetPincodes: pincode ? pincode.split(",").map(p => p.trim()) : [],
      placement: selectedPlacement
    };

    const success = await createAdBid(payload);
    if (success) {
      Alert.alert("Bid Registered", "Programmatic Ad Campaign successfully launched in second-price Vickrey auctions!");
      setBidModalVisible(false);
      setKeyword("");
      setMaxCpc("");
      setBudget("");
      setSelectedProduct("");
    } else {
      Alert.alert("Budget Reservation Denied", "Insufficient ad wallet balance. Please top up first.");
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Nav Header */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); router.back(); }}>
            <Lucide name="chevron-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Programmatic Ads Studio</Text>
          <TouchableOpacity style={styles.topUpBtn} onPress={() => { triggerHaptic("medium"); setFundingVisible(!fundingVisible); }}>
            <Lucide name="wallet-outline" size={21} color="#00f5ff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Ad Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Ad Wallet Prepaid Credits</Text>
              <Lucide name="sparkles" size={15} color="#00f5ff" />
            </View>
            <Text style={styles.balanceAmount}>₹{adMetrics?.adBalance?.toLocaleString() || "0.00"}</Text>
            <Text style={styles.balanceSub}>Google Ads / Amazon Ads bidding model</Text>
          </View>

          {/* Quick funding overlay panel */}
          {fundingVisible && (
            <View style={styles.fundingPanel}>
              <Text style={styles.panelTitle}>Load Ad Wallet Balance</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter credit amount (INR)"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="numeric"
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                />
                <TouchableOpacity style={styles.fundSubmitBtn} onPress={handleTopUp}>
                  <Text style={styles.fundSubmitText}>Deposit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Attribution Model Switcher */}
          <View style={styles.section}>
             <View style={styles.sectionHeaderRow}>
               <Lucide name="git-network-outline" size={17} color="#00f5ff" />
               <Text style={styles.sectionTitle}>Multi-Touch Attribution (MTA)</Text>
             </View>
             <Text style={styles.attributionDesc}>Select attribution model to calculate conversions dynamically:</Text>
             
             <View style={styles.attributionGrid}>
               {([
                 { key: "LAST_TOUCH", label: "Last Touch", desc: "100% to last click" },
                 { key: "LINEAR", label: "Linear", desc: "Equal split all clicks" },
                 { key: "POSITION_BASED", label: "Position", desc: "40-20-40 split" },
                 { key: "TIME_DECAY", label: "Time Decay", desc: "72h half-life exponential" }
               ] as const).map((model) => {
                 const isAct = attributionModel === model.key;
                 return (
                   <TouchableOpacity
                     key={model.key}
                     style={[styles.attributionBtn, isAct && styles.attributionBtnActive]}
                     onPress={() => handleAttributionChange(model.key)}
                     activeOpacity={0.8}
                   >
                     <Text style={[styles.attrLabel, isAct && styles.attrLabelActive]}>{model.label}</Text>
                     <Text style={styles.attrDesc}>{model.desc}</Text>
                   </TouchableOpacity>
                 );
               })}
             </View>
          </View>

          {/* Campaign Analytics Tally */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
               <Lucide name="analytics-outline" size={17} color="#00f5ff" />
               <Text style={styles.sectionTitle}>Performance Analytics</Text>
            </View>
            
            {loadingAds ? (
              <ActivityIndicator size="small" color="#00f5ff" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticCell}>
                  <Text style={styles.analLabel}>Attributed Revenue</Text>
                  <Text style={styles.analValue}>₹{adMetrics?.metrics?.totalAttributedRevenue?.toLocaleString() || "0"}</Text>
                </View>
                <View style={styles.analyticCell}>
                  <Text style={styles.analLabel}>Ad Spend</Text>
                  <Text style={styles.analValue}>₹{adMetrics?.metrics?.totalSpend?.toLocaleString() || "0"}</Text>
                </View>
                <View style={[styles.analyticCell, styles.cellPeak]}>
                  <Text style={[styles.analLabel, styles.cellPeakLabel]}>Overall ROAS</Text>
                  <Text style={[styles.analValue, styles.cellPeakVal]}>{adMetrics?.metrics?.overallROAS || "0.00x"}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Active Campaigns list */}
          <View style={styles.section}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>Active Ad Bid Campaigns</Text>
              <TouchableOpacity style={styles.launchBtn} onPress={() => { triggerHaptic("light"); setBidModalVisible(!bidModalVisible); }}>
                <Lucide name="add-circle" size={19} color="#00f5ff" />
                <Text style={styles.launchBtnText}>Launch Bid</Text>
              </TouchableOpacity>
            </View>

            {bidModalVisible && (
              <View style={styles.bidFormCard}>
                <Text style={styles.formTitle}>Launch Programmatic Bid Campaign</Text>
                
                {/* Product picker */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Target Artifact SKU</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizScroll}>
                    {products.map((p) => {
                      const isSel = selectedProduct === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.prodSelectBtn, isSel && styles.prodSelectBtnActive]}
                          onPress={() => setSelectedProduct(p.id)}
                        >
                          <Text style={[styles.prodSelectText, isSel && styles.prodSelectTextActive]}>{p.title}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Keyword */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Search Keyword Query</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. leather tote, apparel, luxury"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={keyword}
                    onChangeText={setKeyword}
                  />
                </View>

                <View style={styles.gridFormRow}>
                  {/* CPC */}
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Max CPC Bid (₹)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 15.00"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                      value={maxCpc}
                      onChangeText={setMaxCpc}
                    />
                  </View>

                  {/* Budget */}
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Campaign Budget (₹)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 5000"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                      value={budget}
                      onChangeText={setBudget}
                    />
                  </View>
                </View>

                {/* Placement */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Placement Node Channel</Text>
                  <View style={styles.toggleGroup}>
                    {(["SEARCH", "SOCIAL_FEED", "BOTH"] as const).map((ch) => {
                      const isSel = selectedPlacement === ch;
                      return (
                        <TouchableOpacity
                          key={ch}
                          style={[styles.toggleBtn, isSel && styles.toggleBtnActive]}
                          onPress={() => setSelectedPlacement(ch)}
                        >
                          <Text style={[styles.toggleText, isSel && styles.toggleTextActive]}>{ch}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Geo/Demo parameters */}
                <View style={styles.gridFormRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Target Pincodes</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 560001, 400001"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={pincode}
                      onChangeText={setPincode}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Demographics (Gender)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="ALL, MALE, FEMALE"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={selectedGender}
                      onChangeText={setSelectedGender}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.submitBidBtn} onPress={handleCreateBid}>
                  <Text style={styles.submitBidText}>Submit Auction Bid Campaign</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Campaign Cards lists */}
            {loadingAds ? (
              <ActivityIndicator size="small" color="#00f5ff" style={{ marginVertical: 32 }} />
            ) : adBids.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Lucide name="cash-outline" size={26} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>No programmatic ad bids active in auctions.</Text>
              </View>
            ) : (
              <View style={styles.campaignList}>
                {adBids.map((bid) => (
                  <View key={bid.id} style={styles.campaignCard}>
                    <View style={styles.campHeader}>
                      <View>
                        <Text style={styles.campTitle} numberOfLines={1}>{bid.artifact?.title || "Luxury Artifact"}</Text>
                        <Text style={styles.campSub}>Keyword: {bid.keyword || "General"}</Text>
                      </View>
                      <View style={styles.campBadge}>
                        <Text style={styles.campBadgeText}>{bid.status}</Text>
                      </View>
                    </View>

                    <View style={styles.campMetrics}>
                      <View style={styles.metricCellSmall}>
                        <Text style={styles.metricLabelSmall}>Max CPC</Text>
                        <Text style={styles.metricValSmall}>₹{bid.maxCpc}</Text>
                      </View>
                      <View style={styles.metricCellSmall}>
                        <Text style={styles.metricLabelSmall}>Spend/Budget</Text>
                        <Text style={styles.metricValSmall}>₹{bid.spent}/₹{bid.budget}</Text>
                      </View>
                      <View style={styles.metricCellSmall}>
                        <Text style={styles.metricLabelSmall}>Clicks</Text>
                        <Text style={styles.metricValSmall}>{bid.clicks || 0}</Text>
                      </View>
                      <View style={styles.metricCellSmall}>
                        <Text style={styles.metricLabelSmall}>ROAS</Text>
                        <Text style={[styles.metricValSmall, { color: "#00f5ff" }]}>{bid.roas || "0.00x"}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
  topUpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,245,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 60,
  },
  balanceCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 28,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 24,
    gap: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
  balanceSub: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  fundingPanel: {
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    borderRadius: 24,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 20,
    gap: 12,
  },
  panelTitle: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    color: "#fff",
    paddingHorizontal: 16,
    fontSize: 14.5,
    height: 48,
  },
  fundSubmitBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    height: 48,
  },
  fundSubmitText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingBottom: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  attributionDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    lineHeight: 15,
    marginBottom: 12,
  },
  attributionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  attributionBtn: {
    width: (width - 58) / 2,
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  attributionBtnActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.04)",
  },
  attrLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  attrLabelActive: {
    color: "#00f5ff",
  },
  attrDesc: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11.5,
    lineHeight: 12,
  },
  analyticsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  analyticCell: {
    flex: 1,
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  cellPeak: {
    borderColor: "rgba(0,245,255,0.25)",
    backgroundColor: "rgba(0,245,255,0.03)",
  },
  cellPeakLabel: {
    color: "#00f5ff",
  },
  cellPeakVal: {
    color: "#00f5ff",
  },
  analLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  analValue: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingBottom: 8,
    marginBottom: 12,
  },
  launchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,245,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  launchBtnText: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    textAlign: "center",
  },
  campaignList: {
    gap: 12,
  },
  campaignCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  campHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  campTitle: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
    maxWidth: width * 0.55,
  },
  campSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    marginTop: 2,
  },
  campBadge: {
    backgroundColor: "rgba(0,245,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  campBadgeText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  campMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    paddingTop: 10,
  },
  metricCellSmall: {
    alignItems: "center",
  },
  metricLabelSmall: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  metricValSmall: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
  bidFormCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  formTitle: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
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
  horizScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  prodSelectBtn: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  prodSelectBtnActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  prodSelectText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
  prodSelectTextActive: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
  formInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    color: "#fff",
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  gridFormRow: {
    flexDirection: "row",
    gap: 12,
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
  submitBidBtn: {
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBidText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
