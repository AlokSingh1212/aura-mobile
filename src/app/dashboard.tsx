import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  ScrollView,
  Image,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import MainHeader from "@/components/MainHeader";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const TOP_COUNTRIES = [
  { code: "IN", name: "India", phone: "+91" },
  { code: "US", name: "United States", phone: "+1" },
  { code: "GB", name: "United Kingdom", phone: "+44" },
  { code: "FR", name: "France", phone: "+33" },
  { code: "AE", name: "United Arab Emirates", phone: "+971" }
];

const COUNTRY_CITIES: Record<string, string[]> = {
  "IN": ["Mumbai", "Bengaluru", "New Delhi", "Chennai", "Kolkata"],
  "US": ["New York", "Los Angeles", "Chicago", "Miami", "San Francisco"],
  "GB": ["London", "Manchester", "Birmingham", "Edinburgh"],
  "FR": ["Paris", "Lyon", "Marseille", "Nice"],
  "AE": ["Dubai", "Abu Dhabi", "Sharjah"]
};

const CATEGORIES_SPEC_FIELDS: Record<string, { label: string; placeholder: string }[]> = {
  "Fashion": [
    { label: "Brand", placeholder: "e.g. Prada" },
    { label: "Size", placeholder: "e.g. M" },
    { label: "Material", placeholder: "e.g. 100% Cashmere" }
  ],
  "Mobiles": [
    { label: "Brand", placeholder: "e.g. Apple" },
    { label: "Model Name", placeholder: "e.g. iPhone 17 Pro" },
    { label: "Storage", placeholder: "e.g. 256GB" }
  ],
  "Beauty": [
    { label: "Brand", placeholder: "e.g. Chanel" },
    { label: "Volume", placeholder: "e.g. 100ml" },
    { label: "Fragrance Notes", placeholder: "e.g. Sandalwood" }
  ],
  "Electronics": [
    { label: "Brand", placeholder: "e.g. Sony" },
    { label: "Processor", placeholder: "e.g. M4 Max" },
    { label: "Battery Life", placeholder: "e.g. 18 hours" }
  ]
};

export default function DashboardScreen() {
  const { 
    warehouses, loadingWarehouses, fetchWarehouses, createWarehouse,
    products, loadingProducts, fetchProducts, createProduct,
    orders, loadingOrders, fetchOrders,
    triggerHaptic,
    activeMaisonId,
    activeProfile
  } = useStore();

  const [activeSegment, setActiveSegment] = useState<"logistics" | "inventory" | "orders">("inventory");
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active seller node details (Synchronized with profile!)
  const maisonId = activeMaisonId;

  // Form: Warehouse
  const [wForm, setWForm] = useState({
    name: "",
    countryCode: "IN",
    city: "Bengaluru",
    stateCode: "KA",
    complianceId: "",
    phone: ""
  });

  // Form: Product creation
  const [pForm, setPForm] = useState({
    title: "",
    price: "",
    vibe: "Quiet Luxury",
    category: "Fashion",
    specs: {} as Record<string, string>
  });

  useEffect(() => {
    fetchWarehouses(maisonId);
    fetchProducts();
    fetchOrders(maisonId);
  }, [maisonId]);

  const handleSegmentChange = (segment: "logistics" | "inventory" | "orders") => {
    triggerHaptic("light");
    setActiveSegment(segment);
  };

  const handleWarehouseRegister = async () => {
    if (!wForm.name || !wForm.complianceId || !wForm.phone) {
      triggerHaptic("heavy");
      alert("Please fill in all compliance details.");
      return;
    }
    setIsSubmitting(true);
    triggerHaptic("medium");

    const countryObj = TOP_COUNTRIES.find(c => c.code === wForm.countryCode);
    const fullPhone = `${countryObj?.phone || ""} ${wForm.phone}`;

    const payload = {
      name: wForm.name,
      city: wForm.city,
      stateCode: wForm.stateCode,
      countryCode: wForm.countryCode,
      compliance: { taxId: wForm.complianceId, phone: fullPhone },
      maisonId
    };

    const success = await createWarehouse(payload);
    if (success) {
      triggerHaptic("success");
      setWarehouseModalVisible(false);
      setWForm({ name: "", countryCode: "IN", city: "Bengaluru", stateCode: "KA", complianceId: "", phone: "" });
      alert("Profile successfully synced!");
    } else {
      triggerHaptic("heavy");
      alert("Failed to synchronize node.");
    }
    setIsSubmitting(false);
  };

  const handleProductCreate = async () => {
    if (!pForm.title || !pForm.price) {
      triggerHaptic("heavy");
      alert("Please enter artifact title and pricing.");
      return;
    }
    setIsSubmitting(true);
    triggerHaptic("medium");

    const payload = {
      maisonId,
      title: pForm.title,
      price: pForm.price,
      vibe: pForm.vibe,
      type: pForm.category,
      arMetadata: pForm.specs
    };

    const success = await createProduct(payload);
    if (success) {
      triggerHaptic("success");
      setProductModalVisible(false);
      setPForm({ title: "", price: "", vibe: "Quiet Luxury", category: "Fashion", specs: {} });
      alert("New Luxury Artifact Successfully Commissioned & Auto-Syndicated!");
    } else {
      triggerHaptic("heavy");
      alert("Failed to catalog artifact.");
    }
    setIsSubmitting(false);
  };

  // Aggregates for Inventory mirroring web stats exactly
  const maisonProducts = products.filter(p => p.maisonId === maisonId || p.maison?.id === maisonId);
  const totalVaultValue = maisonProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const maxAuraGramScore = activeProfile?.auragramScore 
    ? activeProfile.auragramScore.toFixed(1) 
    : (maisonProducts.length > 0 ? "9.8" : "0.0");

  // RENDERS
  const renderInventoryHeader = () => (
    <View style={styles.inventoryHeaderLayout}>
      
      {/* Maison Oracle & Live Telemetry Grid */}
      <View style={styles.oracleTelemetryContainer}>
        
        {/* Maison Oracle Live Strategy card */}
        <View style={styles.oracleCard}>
          <View style={styles.oracleHeaderRow}>
            <View style={styles.pulseDotGold} />
            <Text style={styles.oracleBadgeText}>Maison Oracle — Live Strategy</Text>
            <Lucide name="sparkles" size={15} color="#00f5ff" style={styles.oracleSparkles} />
          </View>

          <Text style={styles.oracleSentimentQuote}>
            {"\"Surfacing Quiet Luxury collections is recommended.\""}
          </Text>
          
          <Text style={styles.oracleDescription}>
            Global telemetry indicates a shift toward quiet luxury and earthy tones. AURAGRAM recommends surfacing your <Text style={styles.highlightText}>Heritage Calfskin Tote</Text> to targeted collectors in the network.
          </Text>

          <View style={styles.oracleButtonsRow}>
            <TouchableOpacity 
              style={styles.applyStrategyBtn}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic("heavy");
                alert("Global Strategy Synchronized: Neural nodes updating.");
              }}
            >
              <Text style={styles.applyStrategyBtnText}>Apply Strategy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.manageLogisticsBtn}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic("light");
                setActiveSegment("logistics");
              }}
            >
              <Text style={styles.manageLogisticsBtnText}>Manage Logistics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Telemetry Radar Map card */}
        <View style={styles.radarCard}>
          <View style={styles.radarHeader}>
            <Text style={styles.radarSub}>Live Telemetry</Text>
            <Text style={styles.radarTitle}>Global Interaction</Text>
          </View>

          {/* Radar circle layout with pulsating dots */}
          <View style={styles.radarCircleContainer}>
            <View style={styles.radarCircleOutline1} />
            <View style={styles.radarCircleOutline2} />
            <View style={styles.radarCircleOutline3} />
            <View style={styles.radarCorePulse} />
            
            {/* Ping hotspots */}
            <View style={[styles.pingDot, { top: "20%", right: "30%" }]} />
            <View style={[styles.pingDot, { bottom: "40%", left: "20%" }]} />
            <View style={[styles.pingDot, { top: "60%", left: "50%" }]} />
          </View>

          <View style={styles.radarFooterRow}>
            <View>
              <Text style={styles.radarFooterLabel}>Current Hotspots</Text>
              <Text style={styles.radarHotspots}>Paris, Milan, Tokyo</Text>
            </View>
            <Text style={styles.radarViewsCount}>1,420 Live Views</Text>
          </View>
        </View>

      </View>

      {/* Atelier B2B Operations Panel */}
      <View style={styles.b2bContainer}>
        <Text style={styles.b2bSectionTitle}>Atelier B2B Operations</Text>
        <View style={styles.b2bGrid}>
          <TouchableOpacity 
            style={styles.b2bCard}
            onPress={() => {
              triggerHaptic("medium");
              router.push("/maison/ads-studio");
            }}
          >
            <View style={styles.b2bIconCircle}>
              <Lucide name="megaphone-outline" size={19} color="#00f5ff" />
            </View>
            <Text style={styles.b2bCardTitle}>Ads Studio</Text>
            <Text style={styles.b2bCardDesc}>Programmatic demographics bids & MTA models.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.b2bCard}
            onPress={() => {
              triggerHaptic("medium");
              router.push("/maison/repricer");
            }}
          >
            <View style={styles.b2bIconCircle}>
              <Lucide name="analytics-outline" size={19} color="#00f5ff" />
            </View>
            <Text style={styles.b2bCardTitle}>AI Repricer</Text>
            <Text style={styles.b2bCardDesc}>Competitor Buy Box strategy bot triggers.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.b2bCard}
            onPress={() => {
              triggerHaptic("medium");
              router.push("/maison/wms-picker");
            }}
          >
            <View style={styles.b2bIconCircle}>
              <Lucide name="barcode-outline" size={19} color="#00f5ff" />
            </View>
            <Text style={styles.b2bCardTitle}>WMS Picker</Text>
            <Text style={styles.b2bCardDesc}>Aisle coordinates picking sheet & JSON catalog.</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📈 DYNAMIC VERHULST LOGISTIC AUDIENCE FORECAST */}
      {(() => {
        const p0 = activeProfile?.followersCount || 10;
        const k = 50000; // Carrying capacity
        const rVal = 0.12; // Growth constant velocity (12% daily)
        
        const getProjectedFollowers = (days: number) => {
          const ert = Math.exp(rVal * days);
          const projection = (k * p0 * ert) / (k + p0 * (ert - 1));
          return Math.round(projection);
        };

        const day5 = getProjectedFollowers(5);
        const day15 = getProjectedFollowers(15);
        const day30 = getProjectedFollowers(30);

        return (
          <View style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <Lucide name="analytics-outline" size={18} color="#00f5ff" />
              <Text style={styles.forecastTitle}>Verhulst Logistic Audience Forecast</Text>
            </View>
            <Text style={styles.forecastDesc}>
              Predictive mathematical model projecting growth trajectory based on active category carrying capacity (K = 50k) and follow velocity dynamics.
            </Text>
            
            <View style={styles.forecastMetricsGrid}>
              <View style={styles.forecastMetricCol}>
                <Text style={styles.forecastDayLabel}>Day 5</Text>
                <Text style={styles.forecastDayValue}>{day5.toLocaleString()}</Text>
                <Text style={styles.forecastGrowthPct}>+{Math.round(((day5 - p0)/p0)*100)}% reach</Text>
              </View>
              <View style={styles.forecastMetricCol}>
                <Text style={styles.forecastDayLabel}>Day 15</Text>
                <Text style={styles.forecastDayValue}>{day15.toLocaleString()}</Text>
                <Text style={styles.forecastGrowthPct}>+{Math.round(((day15 - p0)/p0)*100)}% reach</Text>
              </View>
              <View style={styles.forecastMetricCol}>
                <Text style={styles.forecastDayLabel}>Day 30</Text>
                <Text style={styles.forecastDayValue}>{day30.toLocaleString()}</Text>
                <Text style={styles.forecastGrowthPct}>+{Math.round(((day30 - p0)/p0)*100)}% reach</Text>
              </View>
            </View>
          </View>
        );
      })()}

      {/* Vault Metrics */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Atelier Valuation</Text>
            <Lucide name="cube-outline" size={17} color="#00f5ff" />
          </View>
          <Text style={styles.statVal}>₹{totalVaultValue.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Artifact Count</Text>
            <Lucide name="trending-up-outline" size={17} color="#00f5ff" />
          </View>
          <Text style={styles.statVal}>
            {maisonProducts.length.toString().padStart(2, "0")} Units
          </Text>
        </View>
        <View style={[styles.statBox, styles.statBoxPeak]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, styles.statLabelPeak]}>Maison AuraGram Peak</Text>
            <Lucide name="flash" size={17} color="#00f5ff" />
          </View>
          <Text style={[styles.statVal, styles.statValPeak]}>{maxAuraGramScore}</Text>
        </View>
      </View>

      {/* Active Artifacts Subtitle bar */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listSectionTitle}>Active Artifacts</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live on Marketplace</Text>
        </View>
      </View>

    </View>
  );

  const renderWarehouseCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <View style={styles.cardIcon}>
            <Lucide name="business" size={19} color="#00f5ff" />
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.city}, {item.countryCode} • Compliance ID: {item.compliance?.taxId || "N/A"}
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active Node</Text>
        </View>
      </View>
    </View>
  );

  const renderArtifactCard = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    return (
      <View style={styles.inventoryCard}>
        <Image source={{ uri: imageUrl }} style={styles.inventoryImg} />
        <View style={styles.inventoryInfo}>
          <View style={styles.inventoryTitleRow}>
            <Text style={styles.inventoryTitle} numberOfLines={1}>{item.title}</Text>
            {item.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.sovereignIdText}>Profile ID: AR-{item.id.substring(0, 8).toUpperCase()}</Text>
          <View style={styles.engagementRow}>
            <Text style={styles.viewsCount}>84 </Text>
            <Text style={styles.viewsLabel}>Unique Node Views</Text>
          </View>
          <Text style={styles.inventoryPrice}>₹{item.price?.toLocaleString()}</Text>
        </View>
        <View style={styles.itemStatusBadge}>
          <Text style={styles.itemStatusText}>Live</Text>
        </View>
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{item.buyerName}</Text>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>{item.status}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.orderItemsBox}>
        {item.items.map((i: any, idx: number) => (
          <Text key={idx} style={styles.orderItemName}>
            • {i.title} (₹{i.price?.toLocaleString()})
          </Text>
        ))}
      </View>

      {/* Splits courier tracking */}
      <View style={styles.splitBox}>
        <Text style={styles.splitTitle}>Parcel Node Splits</Text>
        {item.splits.map((s: any, idx: number) => {
          const isDone = s.status === "COMPLETED";
          return (
            <View key={idx} style={styles.splitRow}>
              <Lucide 
                name={isDone ? "checkmark-circle" : s.status === "PROCESSING" ? "sync-circle" : "ellipse-outline"} 
                size={17} 
                color={isDone ? "#00ff00" : s.status === "PROCESSING" ? "#00f5ff" : "rgba(255,255,255,0.2)"} 
              />
              <Text style={[styles.splitLabel, isDone && styles.splitLabelDone]}>{s.name}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.orderTotalRow}>
        <Text style={styles.orderTotalLabel}>Amount Processed</Text>
        <Text style={styles.orderTotalVal}>₹{item.totalPrice?.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Reusable Brand MainHeader */}
        <MainHeader />

        {/* Header (Mirroring Web Header Vault layout exactly) */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Welcome back, Director</Text>
            <Text style={styles.headerTitle}>Maison Overview</Text>
          </View>

          {activeSegment === "logistics" && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setWarehouseModalVisible(true)}>
              <Lucide name="add-circle" size={28} color="#00f5ff" />
            </TouchableOpacity>
          )}

          {activeSegment === "inventory" && (
            <TouchableOpacity style={styles.commissionBtn} onPress={() => setProductModalVisible(true)}>
              <View style={styles.commissionIconBox}>
                <Lucide name="add" size={17} color="#000" />
              </View>
              <Text style={styles.commissionBtnText}>Commission</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Segment Switcher Bar */}
        <View style={styles.segmentBar}>
          {(["inventory", "logistics", "orders"] as const).map((seg) => {
            const isAct = activeSegment === seg;
            return (
              <TouchableOpacity
                key={seg}
                style={[styles.segmentBtn, isAct && styles.segmentBtnActive]}
                onPress={() => handleSegmentChange(seg)}
              >
                <Text style={[styles.segmentText, isAct && styles.segmentTextActive]}>
                  {seg === "inventory" ? "Vault Inventory" : seg === "logistics" ? "Regional Nodes" : "Order Logs"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CONTENT SWITCH */}
        {activeSegment === "inventory" && (
          <View style={styles.flex1}>
            {loadingProducts ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00f5ff" />
              </View>
            ) : (
              <FlatList
                data={maisonProducts.length > 0 ? maisonProducts : products.slice(0, 4)}
                renderItem={renderArtifactCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={renderInventoryHeader}
              />
            )}
          </View>
        )}

        {activeSegment === "logistics" && (
          <View style={styles.flex1}>
            {/* Telemetry Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Active Hubs</Text>
                  <Lucide name="grid" size={17} color="#00f5ff" />
                </View>
                <Text style={styles.statVal}>{warehouses.length.toString().padStart(2, "0")}</Text>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Coverage Regions</Text>
                  <Lucide name="globe" size={17} color="#00f5ff" />
                </View>
                <Text style={styles.statVal}>
                  {new Set(warehouses.map(h => h.countryCode)).size.toString().padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Ping Latency</Text>
                  <Lucide name="speedometer" size={17} color="#00f5ff" />
                </View>
                <Text style={styles.statVal}>2-4h</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listSectionTitle}>Operational Ledger</Text>
              </View>

              {loadingWarehouses ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#00f5ff" />
                </View>
              ) : (
                <FlatList
                  data={warehouses}
                  renderItem={renderWarehouseCard}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        )}

        {activeSegment === "orders" && (
          <View style={styles.flex1}>
            <View style={styles.listContainer}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listSectionTitle}>Incoming Order Invocations</Text>
              </View>

              {loadingOrders ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#00f5ff" />
                </View>
              ) : (
                <FlatList
                  data={orders}
                  renderItem={renderOrderCard}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Lucide name="receipt-outline" size={34} color="rgba(255,255,255,0.1)" />
                      <Text style={styles.emptyText}>No inbound transactions settled on ledger.</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        )}

        {/* MODAL: REGISTER WAREHOUSE */}
        <Modal
          visible={warehouseModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setWarehouseModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Physical Node</Text>
                <TouchableOpacity onPress={() => setWarehouseModalVisible(false)}>
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hub Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Mumbai Atelier Hub"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={wForm.name}
                    onChangeText={(text) => setWForm(prev => ({ ...prev, name: text }))}
                  />
                </View>

                {/* Country */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Country Node</Text>
                  <View style={styles.selectorRow}>
                    {TOP_COUNTRIES.map((c) => {
                      const isSel = wForm.countryCode === c.code;
                      return (
                        <TouchableOpacity
                          key={c.code}
                          style={[styles.selectorBtn, isSel && styles.selectorBtnActive]}
                          onPress={() => {
                            const cities = COUNTRY_CITIES[c.code] || [];
                            setWForm(prev => ({ ...prev, countryCode: c.code, city: cities[0] || "" }));
                          }}
                        >
                          <Text style={[styles.selectorText, isSel && styles.selectorTextActive]}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* City */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City Jurisdiction</Text>
                  <View style={styles.selectorRow}>
                    {(COUNTRY_CITIES[wForm.countryCode] || []).map((city) => {
                      const isSel = wForm.city === city;
                      return (
                        <TouchableOpacity
                          key={city}
                          style={[styles.selectorBtn, isSel && styles.selectorBtnActive]}
                          onPress={() => setWForm(prev => ({ ...prev, city }))}
                        >
                          <Text style={[styles.selectorText, isSel && styles.selectorTextActive]}>
                            {city}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Compliance Tax ID (GSTIN/VAT)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 29AABCA1234F1Z5"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={wForm.complianceId}
                    onChangeText={(text) => setWForm(prev => ({ ...prev, complianceId: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Phone (Local Number)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="phone-pad"
                    value={wForm.phone}
                    onChangeText={(text) => setWForm(prev => ({ ...prev, phone: text }))}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.submitBtn}
                  onPress={handleWarehouseRegister}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitText}>
                    {isSubmitting ? "Authorizing Security Node..." : "Authorize Node Registration"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL: MINT / CATALOG ARTIFACT */}
        <Modal
          visible={productModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setProductModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Commission New Artifact</Text>
                <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Artifact Title</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Obsidian Cashmere Coat"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={pForm.title}
                    onChangeText={(text) => setPForm(prev => ({ ...prev, title: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Curator Price (INR)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 185000"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="numeric"
                    value={pForm.price}
                    onChangeText={(text) => setPForm(prev => ({ ...prev, price: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vibe Designation</Text>
                  <View style={styles.selectorRow}>
                    {["Quiet Luxury", "Avant-Garde", "Brutalist Minimal", "Techno-Heritage"].map((v) => {
                      const isSel = pForm.vibe === v;
                      return (
                        <TouchableOpacity
                          key={v}
                          style={[styles.selectorBtn, isSel && styles.selectorBtnActive]}
                          onPress={() => setPForm(prev => ({ ...prev, vibe: v }))}
                        >
                          <Text style={[styles.selectorText, isSel && styles.selectorTextActive]}>
                            {v}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Retail Sector (Category)</Text>
                  <View style={styles.selectorRow}>
                    {["Fashion", "Mobiles", "Beauty", "Electronics"].map((cat) => {
                      const isSel = pForm.category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.selectorBtn, isSel && styles.selectorBtnActive]}
                          onPress={() => setPForm(prev => ({ ...prev, category: cat, specs: {} }))}
                        >
                          <Text style={[styles.selectorText, isSel && styles.selectorTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Dynamic Spec Matrix attributes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Dynamic specifications Matrix</Text>
                  {(CATEGORIES_SPEC_FIELDS[pForm.category] || []).map((field) => (
                    <View key={field.label} style={styles.specInputRow}>
                      <Text style={styles.specInputLabel}>{field.label}</Text>
                      <TextInput
                        style={styles.specTextInput}
                        placeholder={field.placeholder}
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        value={pForm.specs[field.label] || ""}
                        onChangeText={(text) => setPForm(prev => ({
                          ...prev,
                          specs: { ...prev.specs, [field.label]: text }
                        }))}
                      />
                    </View>
                  ))}
                </View>

                <TouchableOpacity 
                  style={styles.submitBtn}
                  onPress={handleProductCreate}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitText}>
                    {isSubmitting ? "Commissioning Asset..." : "Commission New Artifact"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415", // Brand black website color exact copy
  },
  b2bContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  b2bSectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12.5,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  b2bGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  b2bCard: {
    flex: 1,
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  b2bIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,245,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  b2bCardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  b2bCardDesc: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 11,
  },
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  headerSub: {
    color: "#00f5ff",
    fontSize: 12.5,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  commissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00f5ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  commissionIconBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  commissionBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addBtn: {
    padding: 4,
  },
  segmentBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 4,
    gap: 4,
    marginTop: 16,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: "#00f5ff",
  },
  segmentText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: "#000",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },
  statBoxPeak: {
    backgroundColor: "rgba(0,245,255,0.03)",
    borderColor: "rgba(0,245,255,0.1)",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statLabelPeak: {
    color: "#00f5ff",
  },
  statVal: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
  statValPeak: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingBottom: 12,
  },
  listSectionTitle: {
    color: "#fff",
    fontSize: 16.5,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,255,0,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#00ff00",
  },
  liveText: {
    color: "#00ff00",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(0,245,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.15)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,255,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,255,0,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00ff00",
    marginRight: 4,
  },
  statusText: {
    color: "#00ff00",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  inventoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 12,
    gap: 16,
    position: "relative",
  },
  inventoryImg: {
    width: 72,
    height: 72,
    borderRadius: 16,
    resizeMode: "cover",
  },
  inventoryInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  inventoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inventoryTitle: {
    color: "#fff",
    fontSize: 16.5,
    fontWeight: "bold",
  },
  typeBadge: {
    backgroundColor: "rgba(0,245,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: "#00f5ff",
    fontSize: 9.5,
    fontWeight: "bold",
  },
  sovereignIdText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  viewsCount: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  viewsLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inventoryPrice: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "300",
    marginTop: 2,
  },
  itemStatusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,255,0,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,0,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  itemStatusText: {
    color: "#00ff00",
    fontSize: 9.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingBottom: 10,
  },
  orderId: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  orderDate: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    marginTop: 2,
  },
  orderBadge: {
    backgroundColor: "rgba(0,245,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  orderBadgeText: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
  },
  orderItemsBox: {
    paddingVertical: 12,
    gap: 4,
  },
  orderItemName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
  },
  splitBox: {
    backgroundColor: "#080415",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 14,
    marginTop: 4,
    gap: 8,
  },
  splitTitle: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "500",
  },
  splitLabelDone: {
    color: "#fff",
  },
  orderTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
    marginTop: 12,
  },
  orderTotalLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  orderTotalVal: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  centerContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalForm: {
    flex: 1,
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: "#080415",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    color: "#fff",
    fontSize: 14.5,
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectorBtn: {
    backgroundColor: "#080415",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  selectorBtnActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  selectorText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "bold",
  },
  selectorTextActive: {
    color: "#000",
  },
  specInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#080415",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  specInputLabel: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    width: 80,
  },
  specTextInput: {
    flex: 1,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 13.5,
  },
  submitBtn: {
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  submitText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inventoryHeaderLayout: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },
  welcomeBox: {
    gap: 4,
    marginBottom: 8,
  },
  welcomeRole: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "300",
    letterSpacing: -1,
  },
  oracleTelemetryContainer: {
    gap: 20,
    width: "100%",
  },
  oracleCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.2)",
    borderRadius: 32,
    padding: 20,
    gap: 16,
  },
  oracleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDotGold: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00f5ff",
  },
  oracleBadgeText: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  oracleSparkles: {
    marginLeft: "auto",
  },
  oracleSentimentQuote: {
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "300",
    lineHeight: 22,
  },
  oracleDescription: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "300",
  },
  highlightText: {
    color: "#00f5ff",
    fontWeight: "bold",
    fontStyle: "italic",
  },
  oracleButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  applyStrategyBtn: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  applyStrategyBtnText: {
    color: "#000",
    fontSize: 12.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  manageLogisticsBtn: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  manageLogisticsBtnText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  radarCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 32,
    padding: 20,
    gap: 16,
  },
  radarHeader: {
    gap: 2,
  },
  radarSub: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  radarTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },
  radarCircleContainer: {
    height: 180,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  radarCircleOutline1: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.06)",
    borderStyle: "dashed",
  },
  radarCircleOutline2: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.08)",
  },
  radarCircleOutline3: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255,  0.12)",
    borderStyle: "dashed",
  },
  radarCorePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00f5ff",
    shadowColor: "#00f5ff",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  pingDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00f5ff",
  },
  radarFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    paddingTop: 14,
  },
  radarFooterLabel: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  radarHotspots: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  radarViewsCount: {
    color: "#00f5ff",
    fontSize: 12.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  forecastCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  forecastHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  forecastTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  forecastDesc: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  forecastMetricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  forecastMetricCol: {
    alignItems: "center",
    flex: 1,
  },
  forecastDayLabel: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  forecastDayValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  forecastGrowthPct: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
