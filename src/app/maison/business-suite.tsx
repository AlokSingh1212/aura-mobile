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
  Alert,
  Modal,
  Clipboard,
  Switch,
  Platform,
  TextStyle,
  ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { API_BASE } from "@/constants/api";

const { width } = Dimensions.get("window");

export default function BusinessSuiteScreen() {
  const { triggerHaptic, activeMaisonId, products, currentUser } = useStore();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [activeP, setActiveP] = useState<any>(null);
  const [activeAcc, setActiveAcc] = useState<any>(null);
  const [linkedMaisons, setLinkedMaisons] = useState<any[]>([]);
  const [availableMaisons, setAvailableMaisons] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string>("EMPLOYEE");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spent: 0
  });

  // Action modals
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  
  // Campaign launch form states
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [campName, setCampName] = useState("");
  const [campObjective, setCampObjective] = useState<"WEBSITE_TRAFFIC" | "PRODUCT_SALES" | "DATA_LEAD_GEN">("WEBSITE_TRAFFIC");
  const [campBudget, setCampBudget] = useState("500");
  const [campDaily, setCampDaily] = useState("50");
  const [campTitle, setCampTitle] = useState("");
  const [campDesc, setCampDesc] = useState("");
  const [campMedia, setCampMedia] = useState("");
  const [campSku, setCampSku] = useState("");
  const [campLocation, setCampLocation] = useState("");
  const [campPlacements, setCampPlacements] = useState<string[]>(["FEED", "REELS", "SEARCH", "WEB"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PLACEMENT_OPTIONS = [
    { id: "FEED", label: "Feed" },
    { id: "REELS", label: "Reels" },
    { id: "SEARCH", label: "Search" },
    { id: "WEB", label: "Web" },
  ] as const;

  const toggleCampPlacement = (id: string) => {
    setCampPlacements((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((p) => p !== id);
        return next.length > 0 ? next : [id];
      }
      return [...prev, id];
    });
  };

  const userId = currentUser?.id;

  const fetchSuiteDetails = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/business-suite?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.portfolios) {
        setPortfolios(data.portfolios);
        const p = activeP && data.portfolios.find((x: any) => x.id === activeP.id)
          ? activeP
          : data.portfolios[0] || null;
        setActiveP(p);
        if (p) {
          await loadPortfolioDetails(p);
        }
      }
    } catch (err) {
      console.warn("Could not query Business Suite records:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioDetails = async (portfolio: any) => {
    const adAcc = portfolio.adAccounts?.[0] || null;
    setActiveAcc(adAcc);

    if (!adAcc) return;

    let totalImp = 0;
    let totalClk = 0;
    let totalConv = 0;
    let totalSpt = 0;
    let activeCampaigns: any[] = [];

    try {
      const detailsRes = await fetch(`${API_BASE}/business-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-portfolio-details", portfolioId: portfolio.id, userId }),
      });
      const detailsData = await detailsRes.json();

      if (detailsData.success && detailsData.portfolio) {
        const freshAcc = detailsData.portfolio.adAccounts?.[0];
        setActiveP(detailsData.portfolio);
        setActiveAcc(freshAcc);
        if (detailsData.membership?.role) setMyRole(detailsData.membership.role);

        const linkRes = await fetch(`${API_BASE}/business-suite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-linkable-maisons", portfolioId: portfolio.id, userId }),
        });
        const linkData = await linkRes.json();
        if (linkData.success) {
          setLinkedMaisons(linkData.linked || detailsData.portfolio.maisons || []);
          setAvailableMaisons(linkData.available || []);
        } else {
          setLinkedMaisons(detailsData.portfolio.maisons || []);
        }

        if (freshAcc?.campaigns) {
          activeCampaigns = freshAcc.campaigns;
          activeCampaigns.forEach((c: any) => {
            totalSpt += c.spent || 0;
            c.adSets?.forEach((adSet: any) => {
              adSet.ads?.forEach((ad: any) => {
                totalImp += ad.impressions || 0;
                totalClk += ad.clicks || 0;
                totalConv += ad.conversions || 0;
              });
            });
          });
        }
      }
    } catch (err) {
      console.warn("Error resolving metrics:", err);
    }

    setCampaigns(activeCampaigns);
    setStats({
      impressions: totalImp,
      clicks: totalClk,
      conversions: totalConv,
      spent: totalSpt,
    });
  };

  useEffect(() => {
    fetchSuiteDetails();
  }, [userId]);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName) return;
    triggerHaptic("medium");
    try {
      const res = await fetch(`${API_BASE}/business-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-portfolio",
          userId,
          name: newPortfolioName
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Portfolio Minted", `Business Portfolio '${newPortfolioName}' established.`);
        setPortfolioModalVisible(false);
        setNewPortfolioName("");
        await fetchSuiteDetails();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to create portfolio.");
    }
  };

  const handleManualSync = async () => {
    if (!activeP) return;
    triggerHaptic("medium");
    setSyncLoading(true);
    try {
      const res = await fetch(`${API_BASE}/business-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync-shopify",
          portfolioId: activeP.id,
          userId,
          isSimulator: true
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Sync Successful", "Shopify catalog item ledger synchronized locally.");
        await fetchSuiteDetails();
      }
    } catch (err) {
      Alert.alert("Error", "Shopify sync failed.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!campName || !campBudget || !campDaily || !activeAcc) {
      Alert.alert("Missing Details", "Name, budgets, and creative targets are required.");
      return;
    }

    triggerHaptic("medium");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/business-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-campaign",
          userId,
          campaignData: {
            adAccountId: activeAcc.id,
            maisonId: linkedMaisons[0]?.id || activeMaisonId,
            name: campName,
            objective: campObjective,
            budgetLimit: parseFloat(campBudget),
            dailyBudget: parseFloat(campDaily),
            adSetName: `${campName} AdSet`,
            targetVibes: ["Quiet Luxury"],
            targetGenders: ["ALL"],
            minAge: 18,
            maxAge: 65,
            targetLocations: campLocation ? [campLocation] : [],
            placements: campPlacements,
            maxCpc: 0.50,
            creativeTitle: campTitle || campName,
            creativeDescription: campDesc || "Curated showcase collection.",
            mediaUrl: campMedia || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
            thumbnail: campMedia || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
            ctaType: campObjective === "PRODUCT_SALES" ? "SHOP_NOW" : "LEARN_MORE",
            ctaText: campObjective === "PRODUCT_SALES" ? "Shop now" : "Learn more",
            targetUrl: campObjective === "WEBSITE_TRAFFIC" ? "https://www.insty.club" : undefined,
            associatedProducts: campSku ? [campSku] : []
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Campaign Live", "Ad launched successfully on AURA dynamic network.");
        setCampaignModalVisible(false);
        setCampName("");
        setCampTitle("");
        setCampDesc("");
        setCampMedia("");
        setCampSku("");
        await fetchSuiteDetails();
      } else {
        Alert.alert("Launch Aborted", data.error || "Ad account insufficient credits.");
      }
    } catch (err) {
      Alert.alert("Error", "Network connection timeout during auction seeding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPixel = (pixelId: string) => {
    Clipboard.setString(pixelId);
    triggerHaptic("success");
    Alert.alert("Copied", "Pixel ID copied to clipboard.");
  };

  const handleLinkMaison = async (maisonId: string) => {
    if (!activeP || !userId) return;
    try {
      const res = await fetch(`${API_BASE}/business-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link-maison", portfolioId: activeP.id, maisonId, userId }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Linked", "Maison connected to portfolio.");
        await loadPortfolioDetails(activeP);
      } else {
        Alert.alert("Error", data.error || "Could not link Maison.");
      }
    } catch {
      Alert.alert("Error", "Network failure.");
    }
  };

  const handleUnlinkMaison = async (maisonId: string) => {
    if (!activeP || !userId) return;
    try {
      const res = await fetch(`${API_BASE}/business-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink-maison", portfolioId: activeP.id, maisonId, userId }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Unlinked", "Maison removed from portfolio.");
        await loadPortfolioDetails(activeP);
      } else {
        Alert.alert("Error", data.error || "Could not unlink.");
      }
    } catch {
      Alert.alert("Error", "Network failure.");
    }
  };

  const handleSwitchPortfolio = async (portfolio: any) => {
    setActiveP(portfolio);
    await loadPortfolioDetails(portfolio);
  };

  const ctr = stats.impressions > 0 
    ? parseFloat(((stats.clicks / stats.impressions) * 100).toFixed(2)) 
    : 0.0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Nav Header */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); router.back(); }}>
            <Lucide name="chevron-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>AURA Business Suite</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchSuiteDetails}>
            <Lucide name="refresh" size={21} color="#00f5ff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#00f5ff" />
            <Text style={styles.loadingText}>Syncing Ledger Networks...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* 🏢 Portfolio Selector */}
            <View style={styles.portfolioCard}>
              <View style={styles.portfolioHeader}>
                <Lucide name="business-outline" size={18} color="#00f5ff" />
                <Text style={styles.portfolioLabel}>Active Business Portfolio</Text>
              </View>
              
              <View style={styles.portfolioRow}>
                {portfolios.length > 1 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    {portfolios.map((p: any) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => handleSwitchPortfolio(p)}
                        style={[styles.portfolioChip, activeP?.id === p.id && styles.portfolioChipActive]}
                      >
                        <Text style={[styles.portfolioChipText, activeP?.id === p.id && styles.portfolioChipTextActive]}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.portfolioName}>{activeP?.name || "No Business Found"}</Text>
                )}
                <TouchableOpacity 
                  style={styles.plusBtn} 
                  onPress={() => { triggerHaptic("light"); setPortfolioModalVisible(true); }}
                >
                  <Lucide name="add-circle-outline" size={24} color="#00f5ff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.roleBadge}>Role: {myRole}</Text>
            </View>

            {/* 🏪 Connected Maisons */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connected Maisons</Text>
              {linkedMaisons.length === 0 ? (
                <Text style={styles.emptyAssetsText}>No stores linked. Connect a Maison to run ads.</Text>
              ) : (
                linkedMaisons.map((m: any) => (
                  <View key={m.id} style={styles.assetRow}>
                    <Text style={styles.assetName}>{m.name}</Text>
                    {(myRole === "ADMIN") && (
                      <TouchableOpacity onPress={() => handleUnlinkMaison(m.id)}>
                        <Lucide name="unlink-outline" size={18} color="#ff6b6b" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
              {myRole === "ADMIN" && availableMaisons.map((m: any) => (
                <TouchableOpacity key={m.id} style={styles.linkAssetBtn} onPress={() => handleLinkMaison(m.id)}>
                  <Lucide name="link-outline" size={16} color="#00f5ff" />
                  <Text style={styles.linkAssetText}>Link {m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 📊 Metrics Overview Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>IMPRESSIONS</Text>
                <Text style={styles.statValue}>{stats.impressions.toLocaleString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>CLICKS</Text>
                <Text style={styles.statValue}>{stats.clicks.toLocaleString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>CTR</Text>
                <Text style={styles.statValue}>{ctr}%</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>CONVERSIONS</Text>
                <Text style={styles.statValue}>{stats.conversions}</Text>
              </View>
            </View>

            {/* 💳 Ad Account Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Funding & Ad Account</Text>
              <View style={styles.billingRow}>
                <View>
                  <Text style={styles.billingName}>{activeAcc?.name || "Billing Ledger"}</Text>
                  <Text style={styles.billingStatus}>Status: {activeAcc?.status || "PENDING"}</Text>
                </View>
                <View style={styles.balanceCol}>
                  <Text style={styles.balanceLabel}>AVAILABLE CREDITS</Text>
                  <Text style={styles.balanceVal}>${activeAcc?.balance?.toLocaleString() || "0.00"}</Text>
                </View>
              </View>
            </View>

            {/* 🛒 Shopify Sync & Pixel */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Shopify & Pixel Sync</Text>
              <View style={styles.syncRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.syncText}>
                    Synced Catalog: {activeP?.shopifyIntegration?.shopName || "Not Connected"}
                  </Text>
                  <Text style={styles.itemCountText}>
                    Total Synced: {activeP?.shopifyIntegration?.catalogItems?.length || 0} products
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.syncBtn} 
                  onPress={handleManualSync}
                  disabled={syncLoading}
                >
                  {syncLoading ? (
                    <ActivityIndicator size="small" color="#00f5ff" />
                  ) : (
                    <Text style={styles.syncBtnText}>Sync Now</Text>
                  )}
                </TouchableOpacity>
              </View>

              {activeP?.shopifyIntegration?.pixelId && (
                <TouchableOpacity 
                  style={styles.pixelBox}
                  onPress={() => handleCopyPixel(activeP.shopifyIntegration.pixelId)}
                >
                  <Lucide name="code-slash" size={16} color="#00f5ff" style={{ marginRight: 8 }} />
                  <Text style={styles.pixelText}>
                    Pixel ID: {activeP.shopifyIntegration.pixelId}
                  </Text>
                  <Lucide name="copy-outline" size={14} color="#8e8e8e" style={{ marginLeft: "auto" }} />
                </TouchableOpacity>
              )}
            </View>

            {/* 🚀 Campaigns Suite */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Campaigns</Text>
              <TouchableOpacity 
                style={styles.launchBtn} 
                onPress={() => { triggerHaptic("medium"); setCampaignModalVisible(true); }}
              >
                <Lucide name="rocket" size={14} color="#000" style={{ marginRight: 5 }} />
                <Text style={styles.launchBtnText}>Launch Ad</Text>
              </TouchableOpacity>
            </View>

            {campaigns.length > 0 ? (
              campaigns.map((c: any) => (
                <View key={c.id} style={styles.campaignRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.campName}>{c.name}</Text>
                    <Text style={styles.campSub}>
                      {c.objective} • Budget: ${c.budgetLimit}
                    </Text>
                  </View>
                  <View style={styles.campMeta}>
                    <Text style={styles.campSpent}>${c.spent.toFixed(2)} spent</Text>
                    <Text style={[styles.campStatus, c.status === "ACTIVE" ? styles.statusActive : styles.statusPaused] as any}>
                      {c.status}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No Active Campaigns Found</Text>
              </View>
            )}

          </ScrollView>
        )}
      </SafeAreaView>

      {/* MODAL 1: Create Portfolio */}
      <Modal
        visible={portfolioModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPortfolioModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>New Business Portfolio</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rare Group, Personal Account"
              placeholderTextColor="#555"
              value={newPortfolioName}
              onChangeText={setNewPortfolioName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPortfolioModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreatePortfolio}>
                <Text style={styles.saveText}>Establish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Create Campaign */}
      <Modal
        visible={campaignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCampaignModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={{ paddingVertical: 50, alignItems: "center" }}>
            <View style={[styles.modalBody, { width: width * 0.9 }]}>
              <Text style={styles.modalTitle}>Launch Ad Campaign</Text>

              <Text style={styles.inputLabel}>Campaign Name</Text>
              <TextInput style={styles.input} value={campName} onChangeText={setCampName} placeholder="Summer Drop" placeholderTextColor="#555" />

              <Text style={styles.inputLabel}>Objective</Text>
              <View style={styles.objectiveRow}>
                {(["WEBSITE_TRAFFIC", "PRODUCT_SALES", "DATA_LEAD_GEN"] as const).map((obj) => (
                  <TouchableOpacity
                    key={obj}
                    style={[styles.objBtn, campObjective === obj && styles.objBtnActive] as any}
                    onPress={() => setCampObjective(obj)}
                  >
                    <Text style={[styles.objBtnText, campObjective === obj && styles.objBtnTextActive] as any}>
                      {obj.split("_")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Total Budget ($)</Text>
              <TextInput style={styles.input} value={campBudget} onChangeText={setCampBudget} keyboardType="numeric" />

              <Text style={styles.inputLabel}>Daily Budget ($)</Text>
              <TextInput style={styles.input} value={campDaily} onChangeText={setCampDaily} keyboardType="numeric" />

              <Text style={styles.inputLabel}>Creative Headline</Text>
              <TextInput style={styles.input} value={campTitle} onChangeText={setCampTitle} placeholder="Heritage Leather Tote" placeholderTextColor="#555" />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput style={styles.input} value={campDesc} onChangeText={setCampDesc} placeholder="10% off raw canvas bags." placeholderTextColor="#555" />

              <Text style={styles.inputLabel}>Media URL (Video/Image Link)</Text>
              <TextInput style={styles.input} value={campMedia} onChangeText={setCampMedia} placeholder="https://images.unsplash.com/photo-..." placeholderTextColor="#555" />

              {campObjective === "PRODUCT_SALES" && (
                <>
                  <Text style={styles.inputLabel}>Shopify Product SKU Target</Text>
                  <TextInput style={styles.input} value={campSku} onChangeText={setCampSku} placeholder="SHPF-BAG-001" placeholderTextColor="#555" />
                </>
              )}

              <Text style={styles.inputLabel}>Location Target (Optional)</Text>
              <TextInput style={styles.input} value={campLocation} onChangeText={setCampLocation} placeholder="e.g. Milan, London" placeholderTextColor="#555" />

              <Text style={styles.inputLabel}>Placements</Text>
              <View style={styles.objectiveRow}>
                {PLACEMENT_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.objBtn, campPlacements.includes(p.id) && styles.objBtnActive] as any}
                    onPress={() => toggleCampPlacement(p.id)}
                  >
                    <Text style={[styles.objBtnText, campPlacements.includes(p.id) && styles.objBtnTextActive] as any}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCampaignModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleLaunchCampaign} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.saveText}>Deploy Ad</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  backBtn: {
    padding: 8
  },
  navTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center"
  },
  refreshBtn: {
    padding: 8
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  loadingText: {
    color: "#8e8e8e",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  portfolioCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20
  },
  portfolioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    opacity: 0.4,
    marginBottom: 6
  },
  portfolioLabel: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5
  },
  portfolioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  portfolioName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "300"
  },
  plusBtn: {
    padding: 4
  },
  portfolioChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
  },
  portfolioChipActive: {
    backgroundColor: "rgba(0,245,255,0.15)",
    borderColor: "#00f5ff",
  },
  portfolioChipText: {
    color: "#8e8e8e",
    fontSize: 12,
    fontWeight: "600",
  },
  portfolioChipTextActive: {
    color: "#00f5ff",
  },
  roleBadge: {
    color: "#8e8e8e",
    fontSize: 10,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyAssetsText: {
    color: "#8e8e8e",
    fontSize: 12,
    marginVertical: 8,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  assetName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  linkAssetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
  },
  linkAssetText: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)"
  },
  statLabel: {
    color: "#8e8e8e",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.2,
    marginBottom: 6
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "200"
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20,
    gap: 16
  },
  cardTitle: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  billingName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold"
  },
  billingStatus: {
    color: "#8e8e8e",
    fontSize: 10,
    marginTop: 4
  },
  balanceCol: {
    alignItems: "flex-end"
  },
  balanceLabel: {
    color: "#8e8e8e",
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1
  },
  balanceVal: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
    marginTop: 2
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  syncText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  },
  itemCountText: {
    color: "#8e8e8e",
    fontSize: 10,
    marginTop: 2
  },
  syncBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0,245,255,0.12)",
    borderRadius: 8
  },
  syncBtnText: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  pixelBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)"
  },
  pixelText: {
    color: "#8e8e8e",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5
  },
  launchBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00f5ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12
  },
  launchBtnText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  campaignRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    marginBottom: 10
  },
  campName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold"
  },
  campSub: {
    color: "#8e8e8e",
    fontSize: 10,
    marginTop: 4
  },
  campMeta: {
    alignItems: "flex-end"
  },
  campSpent: {
    color: "#fff",
    fontSize: 11
  },
  campStatus: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: "uppercase"
  },
  statusActive: {
    color: "#4cd964"
  },
  statusPaused: {
    color: "#ffcc00"
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.01)",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)"
  },
  emptyText: {
    color: "#8e8e8e",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  modalBody: {
    backgroundColor: "#120e28",
    padding: 24,
    borderRadius: 24,
    width: width * 0.85,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 16
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8
  },
  inputLabel: {
    color: "#8e8e8e",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: -4
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 13
  },
  objectiveRow: {
    flexDirection: "row",
    gap: 8
  },
  objBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    alignItems: "center"
  },
  objBtnActive: {
    borderColor: "#00f5ff",
    backgroundColor: "rgba(0,245,255,0.08)"
  },
  objBtnText: {
    color: "#8e8e8e",
    fontSize: 10,
    fontWeight: "bold"
  },
  objBtnTextActive: {
    color: "#00f5ff"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    alignItems: "center"
  },
  cancelText: {
    color: "#8e8e8e",
    fontSize: 12,
    fontWeight: "bold"
  },
  saveBtn: {
    flex: 2,
    padding: 14,
    backgroundColor: "#00f5ff",
    borderRadius: 12,
    alignItems: "center"
  },
  saveText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold"
  }
});
