import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

export interface AdAccount {
  id: string;
  name: string;
  businessName: string;
  role: string;
  accountBalance: number;
}

export interface MetaCampaign {
  id: string;
  adAccountId: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "THROTTLED";
  dailyBudget: number;
  spentToDate: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cvr: number;
  cpc: number;
  pacingMultiplier: number;
  targetVibes: string[];
}

export interface AuraAdsManagerProps {
  onClose?: () => void;
}

export function AuraAdsManager({ onClose }: AuraAdsManagerProps) {
  const [activeTab, setActiveTab] = useState<"CAMPAIGNS" | "AD_SETS" | "CREATIVES">("CAMPAIGNS");
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Multi-Ad Account Switcher (Aura Business Manager)
  const [adAccounts] = useState<AdAccount[]>([
    {
      id: "act_9918231",
      name: "Aura Apparel Main",
      businessName: "Aura Commerce Inc.",
      role: "ADMIN",
      accountBalance: 4250.0,
    },
    {
      id: "act_4810294",
      name: "Cyberwear Agency",
      businessName: "Cyberwear Media Ltd.",
      role: "ADVERTISER",
      accountBalance: 1280.0,
    },
  ]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>("act_9918231");

  const [allCampaigns, setAllCampaigns] = useState<MetaCampaign[]>([
    {
      id: "camp_101",
      adAccountId: "act_9918231",
      name: "Luxury Hoodie Drop • Autumn Collection",
      status: "ACTIVE",
      dailyBudget: 100.0,
      spentToDate: 420.5,
      impressions: 142500,
      clicks: 4380,
      ctr: 3.07,
      cvr: 4.12,
      cpc: 0.1,
      pacingMultiplier: 1.25,
      targetVibes: ["streetwear", "luxury"],
    },
    {
      id: "camp_102",
      adAccountId: "act_9918231",
      name: "Retro Sneaker Retargeting Campaign",
      status: "THROTTLED",
      dailyBudget: 75.0,
      spentToDate: 310.0,
      impressions: 89200,
      clicks: 2410,
      ctr: 2.7,
      cvr: 3.85,
      cpc: 0.13,
      pacingMultiplier: 0.74,
      targetVibes: ["sneakers"],
    },
    {
      id: "camp_103",
      adAccountId: "act_4810294",
      name: "Cyberpunk Techwear Accessories",
      status: "PAUSED",
      dailyBudget: 50.0,
      spentToDate: 150.0,
      impressions: 45000,
      clicks: 980,
      ctr: 2.18,
      cvr: 2.9,
      cpc: 0.15,
      pacingMultiplier: 1.0,
      targetVibes: ["techwear", "cyber"],
    },
  ]);

  const currentAccount = adAccounts.find((a) => a.id === selectedAccountId) || adAccounts[0];
  const campaigns = allCampaigns.filter((c) => c.adAccountId === selectedAccountId);

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spentToDate, 0);
  const totalImp = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const avgCtr = totalImp > 0 ? ((totalClicks / totalImp) * 100).toFixed(2) : "0.00";
  const avgCpc = totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : "0.00";
  const avgCpm = totalImp > 0 ? ((totalSpent / totalImp) * 1000).toFixed(2) : "0.00";

  const toggleStatus = (id: string) => {
    setAllCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleCreateAiCampaign = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const newCamp: MetaCampaign = {
        id: `camp_${Date.now()}`,
        adAccountId: selectedAccountId,
        name: `AI: ${aiPrompt.slice(0, 24)}...`,
        status: "ACTIVE",
        dailyBudget: 50.0,
        spentToDate: 0.0,
        impressions: 0,
        clicks: 0,
        ctr: 0.0,
        cvr: 0.0,
        cpc: 0.0,
        pacingMultiplier: 1.0,
        targetVibes: ["ai-target", "custom"],
      };
      setAllCampaigns([newCamp, ...allCampaigns]);
      setIsGenerating(false);
      setAiModalVisible(false);
      setAiPrompt("");
    }, 1200);
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aura Ads Manager</Text>
          <Text style={styles.headerSubtitle}>Real-Time VCG Auction & Pacing Analytics</Text>
        </View>
        <TouchableOpacity style={styles.aiButton} onPress={() => setAiModalVisible(true)}>
          <Lucide name="sparkles" size={16} color="#ffffff" />
          <Text style={styles.aiButtonText}>AI Campaign</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Metrics Ribbon */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiRibbon}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL SPENT</Text>
            <Text style={styles.kpiValue}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.kpiSubtext}>+14.2% vs last week</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>IMPRESSIONS</Text>
            <Text style={styles.kpiValue}>{(totalImp / 1000).toFixed(1)}k</Text>
            <Text style={styles.kpiSubtext}>Ad delivery views</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CLICKS</Text>
            <Text style={styles.kpiValue}>{totalClicks.toLocaleString()}</Text>
            <Text style={styles.kpiSubtext}>Verified non-bot</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>AVG CTR</Text>
            <Text style={styles.kpiValue}>{avgCtr}%</Text>
            <Text style={styles.kpiSubtext}>Click-through rate</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>AVG CPC</Text>
            <Text style={styles.kpiValue}>${avgCpc}</Text>
            <Text style={styles.kpiSubtext}>Cost per click</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>AVG CPM</Text>
            <Text style={styles.kpiValue}>${avgCpm}</Text>
            <Text style={styles.kpiSubtext}>Cost per 1k views</Text>
          </View>
        </ScrollView>

        {/* 3-Tier Tab Bar */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "CAMPAIGNS" && styles.activeTabButton]}
            onPress={() => setActiveTab("CAMPAIGNS")}
          >
            <Text style={[styles.tabText, activeTab === "CAMPAIGNS" && styles.activeTabText]}>Campaigns</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "AD_SETS" && styles.activeTabButton]}
            onPress={() => setActiveTab("AD_SETS")}
          >
            <Text style={[styles.tabText, activeTab === "AD_SETS" && styles.activeTabText]}>Ad Sets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "CREATIVES" && styles.activeTabButton]}
            onPress={() => setActiveTab("CREATIVES")}
          >
            <Text style={[styles.tabText, activeTab === "CREATIVES" && styles.activeTabText]}>Ads & Creatives</Text>
          </TouchableOpacity>
        </View>

        {/* Main Campaign List */}
        {activeTab === "CAMPAIGNS" && (
          <View style={styles.campaignList}>
            {campaigns.map((c) => (
              <View key={c.id} style={styles.campaignCard}>
                <View style={styles.campaignCardHeader}>
                  <TouchableOpacity style={styles.statusToggle} onPress={() => toggleStatus(c.id)}>
                    <View
                      style={[
                        styles.statusDot,
                        c.status === "ACTIVE"
                          ? styles.dotActive
                          : c.status === "THROTTLED"
                          ? styles.dotThrottled
                          : styles.dotPaused,
                      ]}
                    />
                    <Text style={styles.statusText}>{c.status}</Text>
                  </TouchableOpacity>

                  <View style={styles.pacingBadge}>
                    <Lucide name="pulse-outline" size={12} color="#a855f7" />
                    <Text style={styles.pacingText}>PID α: {c.pacingMultiplier.toFixed(2)}x</Text>
                  </View>
                </View>

                <Text style={styles.campaignTitle}>{c.name}</Text>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>Daily Budget</Text>
                    <Text style={styles.metricItemValue}>${c.dailyBudget.toFixed(0)}/day</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>Spent</Text>
                    <Text style={styles.metricItemValue}>${c.spentToDate.toFixed(2)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>CTR</Text>
                    <Text style={styles.metricItemValue}>{c.ctr}%</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>CVR</Text>
                    <Text style={styles.metricItemValue}>{c.cvr}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Demographic & Pacing Analytics Cards */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Demographic & PID Pacing Insights</Text>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsCardTitle}>Age & Gender Affinity</Text>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>18-24 (Youth)</Text>
              <View style={[styles.barFill, { width: "68%" }]} />
              <Text style={styles.barPercent}>68%</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>25-34 (Core)</Text>
              <View style={[styles.barFill, { width: "24%" }]} />
              <Text style={styles.barPercent}>24%</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Conversational AI Modal */}
      <Modal visible={aiModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Conversational AI Campaign Builder</Text>
            <Text style={styles.modalSubtitle}>Describe your target audience and budget in plain language.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Create a $100/day campaign for luxury sneakers targeting 18-25 year olds"
              placeholderTextColor="#64748b"
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAiModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleCreateAiCampaign}>
                <Text style={styles.modalSubmitText}>{isGenerating ? "Building..." : "Generate"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#a855f7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  aiButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  kpiRibbon: {
    paddingLeft: 16,
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 130,
  },
  kpiLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
  },
  kpiValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 4,
  },
  kpiSubtext: {
    color: "#a855f7",
    fontSize: 10,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: "#a855f7",
  },
  tabText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#ffffff",
  },
  campaignList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  campaignCard: {
    backgroundColor: "#0f0a21",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  campaignCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: "#22c55e" },
  dotThrottled: { backgroundColor: "#f59e0b" },
  dotPaused: { backgroundColor: "#ef4444" },
  statusText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  pacingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pacingText: {
    color: "#a855f7",
    fontSize: 11,
    fontWeight: "600",
  },
  campaignTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 10,
    borderRadius: 8,
  },
  metricItem: {
    alignItems: "center",
  },
  metricItemLabel: {
    color: "#64748b",
    fontSize: 10,
  },
  metricItemValue: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  analyticsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  analyticsCard: {
    backgroundColor: "#0f0a21",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  analyticsCardTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    width: 90,
  },
  barFill: {
    height: 8,
    backgroundColor: "#a855f7",
    borderRadius: 4,
  },
  barPercent: {
    color: "#a855f7",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#0f0a21",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(168, 85, 247, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    fontSize: 14,
    height: 90,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: "#94a3b8",
    fontWeight: "600",
  },
  modalSubmit: {
    backgroundColor: "#a855f7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
