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

export default function RepricerScreen() {
  const {
    repricerOffers,
    loadingRepricer,
    fetchRepricer,
    updateRepricerRule,
    triggerPriceAudit,
    triggerHaptic,
    activeMaisonId
  } = useStore();

  const maisonId = activeMaisonId;
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [step, setStep] = useState("");
  const [isAuditing, setIsAuditing] = useState<string | null>(null);

  useEffect(() => {
    fetchRepricer(maisonId);
  }, [maisonId]);

  const handleStrategyChange = async (offer: any, rule: "NONE" | "MATCH_LOWEST" | "BEAT_LOWEST") => {
    triggerHaptic("medium");
    const floor = minPrice ? parseFloat(minPrice) : (offer.repricerMinPrice || offer.price * 0.8);
    const stepVal = step ? parseFloat(step) : (offer.repricerStep || 5.00);

    const payload = {
      maisonId,
      offerId: offer.id,
      rule,
      minPrice: floor,
      step: stepVal
    };

    const success = await updateRepricerRule(payload);
    if (success) {
      Alert.alert("Strategy Hydrated", `Repricer Bot active with ${rule} matching strategy.`);
      setMinPrice("");
      setStep("");
      setSelectedOffer(null);
      fetchRepricer(maisonId);
    } else {
      Alert.alert("Error", "Failed to update strategy rules.");
    }
  };

  const handleManualAudit = async (offer: any) => {
    triggerHaptic("heavy");
    setIsAuditing(offer.id);
    const success = await triggerPriceAudit(offer.artifactId);
    
    setTimeout(() => {
      setIsAuditing(null);
      if (success) {
        Alert.alert("Evaluation Completed", "Dynamic Price audit checked. Ledger updated based on competitor delta.");
        fetchRepricer(maisonId);
      } else {
        Alert.alert("Audit Settled", "Ledger up to date. Prices aligned with rules.");
      }
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Nav Header */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); router.back(); }}>
            <Lucide name="chevron-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>AI Repricer Engine</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => { triggerHaptic("light"); fetchRepricer(maisonId); }}>
            <Lucide name="refresh" size={21} color="#00f5ff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Main Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoBadge}>Operational Ledger</Text>
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.infoTitle}>Competitor Price Auditing</Text>
            <Text style={styles.infoDesc}>
              Decentralized strategy engines dynamically adjust prices to secure Buy Box conversions while enforcing floor thresholds.
            </Text>
          </View>

          {/* Catalog Repricer listings */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Lucide name="barcode-outline" size={17} color="#00f5ff" />
              <Text style={styles.sectionTitle}>Competing Catalog Items</Text>
            </View>

            {loadingRepricer ? (
              <ActivityIndicator size="large" color="#00f5ff" style={{ marginTop: 40 }} />
            ) : repricerOffers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Lucide name="git-compare-outline" size={30} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>No active competitor listings registered on ledger.</Text>
              </View>
            ) : (
              <View style={styles.offersList}>
                {repricerOffers.map((item) => {
                  const isSelected = selectedOffer?.id === item.id;
                  const buyBoxName = item.buyBoxWinner?.maison?.name || "Alok's Maison";
                  const priceLogs = item.priceLogs || [];

                  return (
                    <View key={item.id} style={styles.offerCard}>
                      <View style={styles.offerMain}>
                        <View style={styles.offerDetails}>
                          <Text style={styles.offerTitle}>{item.artifact?.title}</Text>
                          <Text style={styles.offerPrice}>Current Price: <Text style={{ color: "#00f5ff", fontWeight: "bold" }}>₹{item.price?.toLocaleString()}</Text></Text>
                          <Text style={styles.ruleLabel}>Rule Status: <Text style={styles.ruleVal}>{item.repricerRule || "NONE"}</Text></Text>
                        </View>

                        <View style={styles.actionsBlock}>
                          <TouchableOpacity 
                            style={styles.auditBtn} 
                            onPress={() => handleManualAudit(item)}
                            disabled={isAuditing !== null}
                          >
                            {isAuditing === item.id ? (
                              <ActivityIndicator size="small" color="#000" />
                            ) : (
                              <>
                                <Lucide name="pulse" size={15} color="#000" />
                                <Text style={styles.auditBtnText}>Audit</Text>
                              </>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.settingsBtn}
                            onPress={() => { triggerHaptic("light"); setSelectedOffer(isSelected ? null : item); }}
                          >
                            <Lucide name="options-outline" size={17} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Repricer configure pane */}
                      {isSelected && (
                        <View style={styles.configPane}>
                          <Text style={styles.configTitle}>Update Repricing Strategy</Text>
                          
                          <View style={styles.configInputsRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.inputLabel}>Price Floor (₹)</Text>
                              <TextInput
                                style={styles.configInput}
                                placeholder={`Floor (e.g. ${item.price * 0.8})`}
                                placeholderTextColor="rgba(255,255,255,0.15)"
                                keyboardType="numeric"
                                value={minPrice}
                                onChangeText={setMinPrice}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.inputLabel}>Reprice Step Offset (₹)</Text>
                              <TextInput
                                style={styles.configInput}
                                placeholder="Offset (e.g. 5.00)"
                                placeholderTextColor="rgba(255,255,255,0.15)"
                                keyboardType="numeric"
                                value={step}
                                onChangeText={setStep}
                              />
                            </View>
                          </View>

                          <View style={styles.strategiesRow}>
                            <TouchableOpacity style={styles.stratBtn} onPress={() => handleStrategyChange(item, "NONE")}>
                              <Text style={styles.stratText}>Disable</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.stratBtn, styles.stratBtnLowest]} onPress={() => handleStrategyChange(item, "MATCH_LOWEST")}>
                              <Text style={[styles.stratText, styles.stratTextLowest]}>Match Lowest</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.stratBtn, styles.stratBtnBeat]} onPress={() => handleStrategyChange(item, "BEAT_LOWEST")}>
                              <Text style={[styles.stratText, styles.stratTextBeat]}>Beat Lowest</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Competitor checklists Buy Box status */}
                      <View style={styles.buyBoxTally}>
                        <View style={styles.buyBoxHeader}>
                          <Lucide name="medal-outline" size={16} color="#00f5ff" />
                          <Text style={styles.buyBoxTitle}>Buy Box Winner: <Text style={{ color: "#00f5ff", fontWeight: "bold" }}>{buyBoxName}</Text></Text>
                        </View>
                        
                        {/* Competitors loop list */}
                        {(item.competitors || []).map((comp: any, idx: number) => {
                          const isWinner = comp.maison?.id === item.buyBoxWinner?.maisonId;
                          return (
                            <View key={idx} style={styles.competitorRow}>
                              <Text style={styles.compName}>{comp.maison?.name}</Text>
                              <View style={styles.compRight}>
                                <Text style={styles.compPrice}>₹{comp.price?.toLocaleString()}</Text>
                                <View style={[styles.compScoreBadge, isWinner && styles.badgeWinner]}>
                                  <Text style={[styles.compScoreText, isWinner && styles.textWinner]}>
                                    {isWinner ? "Winner" : `${Math.floor((comp.buyBoxScore || 0.85) * 100)}% score`}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {/* Repricer adjustment history logs */}
                      {priceLogs.length > 0 && (
                        <View style={styles.logsTally}>
                          <Text style={styles.logsHeading}>Pricing Modification Logs</Text>
                          {priceLogs.map((log: any) => (
                            <View key={log.id} style={styles.logRow}>
                              <Text style={styles.logReason}>{log.reason.replace(/_/g, " ")}</Text>
                              <Text style={styles.logDelta}>₹{log.oldPrice?.toLocaleString()} ➜ ₹{log.newPrice?.toLocaleString()}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
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
  refreshBtn: {
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
  infoCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 28,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 24,
    gap: 8,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoBadge: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00ff00",
  },
  infoTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
  infoDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13.5,
    lineHeight: 16,
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
  offersList: {
    gap: 16,
  },
  offerCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  offerMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerDetails: {
    flex: 1,
    gap: 4,
  },
  offerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  offerPrice: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
  },
  ruleLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  ruleVal: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
  actionsBlock: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  auditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  auditBtnText: {
    color: "#000",
    fontSize: 12.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  configPane: {
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.15)",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  configTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  configInputsRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  configInput: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 13.5,
    height: 38,
    paddingHorizontal: 10,
  },
  strategiesRow: {
    flexDirection: "row",
    gap: 8,
  },
  stratBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    height: 38,
  },
  stratBtnLowest: {
    borderColor: "rgba(0,245,255,0.25)",
    backgroundColor: "rgba(0,245,255,0.04)",
  },
  stratBtnBeat: {
    borderColor: "#00ff00",
    backgroundColor: "rgba(0,255,0,0.03)",
  },
  stratText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  stratTextLowest: {
    color: "#00f5ff",
  },
  stratTextBeat: {
    color: "#00ff00",
  },
  buyBoxTally: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  buyBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    paddingBottom: 6,
  },
  buyBoxTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  competitorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compName: {
    color: "#fff",
    fontSize: 13.5,
  },
  compRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compPrice: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  compScoreBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  compScoreText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "bold",
  },
  badgeWinner: {
    backgroundColor: "rgba(0,255,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,255,0,0.25)",
  },
  textWinner: {
    color: "#00ff00",
  },
  logsTally: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    paddingTop: 8,
    gap: 6,
  },
  logsHeading: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logReason: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
  logDelta: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
