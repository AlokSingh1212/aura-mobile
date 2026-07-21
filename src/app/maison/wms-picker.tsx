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

export default function WmsPickerScreen() {
  const {
    pickTasks,
    loadingWMS,
    fetchPickTasks,
    completePickTask,
    importCatalog,
    triggerHaptic,
    activeMaisonId
  } = useStore();

  const maisonId = activeMaisonId;
  const [activeTab, setActiveTab] = useState<"wms" | "importer">("wms");
  const [pickerId, setPickerId] = useState("STAFF-NODE-01");
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchPickTasks(maisonId);
  }, [maisonId]);

  const handleCompleteTask = async (taskId: string) => {
    triggerHaptic("success");
    const success = await completePickTask(taskId, pickerId);
    if (success) {
      Alert.alert("Task Packed", "Pick list checked, items verified, and shipment status processed successfully!");
      fetchPickTasks(maisonId);
    } else {
      Alert.alert("Error", "Fulfillment database synchronization aborted.");
    }
  };

  const handleBulkImport = async () => {
    if (!csvContent.trim()) {
      triggerHaptic("heavy");
      Alert.alert("Empty Catalog", "Please paste valid catalog JSON records to ingest.");
      return;
    }

    setIsImporting(true);
    triggerHaptic("medium");

    try {
      // Ingesting mock catalog JSON records for high-fidelity native client
      const records = JSON.parse(csvContent);
      const payload = {
        maisonId,
        rows: Array.isArray(records) ? records : [records],
        mapping: {
          title: "title",
          price: "price",
          stock: "stock",
          description: "description",
          category: "category",
          image: "image"
        }
      };

      const success = await importCatalog(payload);
      if (success) {
        Alert.alert("Catalog Ingested", "Decentralized product nodes hydrated successfully!");
        setCsvContent("");
      } else {
        Alert.alert("Conflict Detetected", "Audit failed: Mapping parameters mismatched parent schema.");
      }
    } catch (e) {
      Alert.alert("JSON Parse Failed", "Please ensure catalog entries are formatted as valid JSON object arrays.");
    } finally {
      setIsImporting(false);
    }
  };

  const loadSimulatedCatalog = () => {
    triggerHaptic("light");
    const simulated = [
      {
        title: "Obsidian Gold Vestment",
        price: 185000,
        stock: 12,
        description: "Bespoke coordinates tailored for the winter solstice",
        category: "Fashion",
        image: ""
      },
      {
        title: "Techno Calfskin Travel Bag",
        price: 245000,
        stock: 6,
        description: "Fused liquid fiber weaves with calfskin textures",
        category: "Fashion",
        image: ""
      }
    ];
    setCsvContent(JSON.stringify(simulated, null, 2));
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Nav Header */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); router.back(); }}>
            <Lucide name="chevron-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Fulfillment Hub</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab switch bar */}
        <View style={styles.segmentBar}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "wms" && styles.segmentBtnActive]}
            onPress={() => { triggerHaptic("light"); setActiveTab("wms"); }}
          >
            <Text style={[styles.segmentText, activeTab === "wms" && styles.segmentTextActive]}>Picking Lists (WMS)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === "importer" && styles.segmentBtnActive]}
            onPress={() => { triggerHaptic("light"); setActiveTab("importer"); }}
          >
            <Text style={[styles.segmentText, activeTab === "importer" && styles.segmentTextActive]}>Bulk Importer</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "wms" ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Staff picker ID */}
            <View style={styles.pickerIdCard}>
              <Lucide name="person-outline" size={19} color="#00f5ff" />
              <Text style={styles.pickerIdLabel}>Current Picker Staff ID:</Text>
              <TextInput
                style={styles.pickerIdInput}
                value={pickerId}
                onChangeText={setPickerId}
              />
            </View>

            {/* Picking Tasks list */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Lucide name="map-outline" size={17} color="#00f5ff" />
                <Text style={styles.sectionTitle}>Spatial picking Coordinates</Text>
              </View>

              {loadingWMS ? (
                <ActivityIndicator size="large" color="#00f5ff" style={{ marginTop: 40 }} />
              ) : pickTasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Lucide name="cube-outline" size={30} color="rgba(255,255,255,0.1)" />
                  <Text style={styles.emptyText}>All warehouse pick lists cleared. Active nodes ready.</Text>
                </View>
              ) : (
                <View style={styles.tasksList}>
                  {pickTasks.map((task) => {
                    const rawItems = task.items || [];
                    const itemsList = Array.isArray(rawItems) ? rawItems : (rawItems.list || []);
                    
                    return (
                      <View key={task.id} style={styles.taskCard}>
                        <View style={styles.taskHeader}>
                          <Text style={styles.taskIdText}>Task ID: PK-{task.id.substring(0, 8).toUpperCase()}</Text>
                          <View style={[styles.statusBadge, task.status === "COMPLETED" && styles.statusBadgeDone]}>
                            <Text style={[styles.statusText, task.status === "COMPLETED" && styles.statusTextDone]}>{task.status}</Text>
                          </View>
                        </View>

                        {/* Items listed with bin locations */}
                        <View style={styles.itemsBlock}>
                          {itemsList.map((item: any, idx: number) => (
                            <View key={idx} style={styles.itemRow}>
                              <View style={styles.itemMain}>
                                <Text style={styles.itemTitle}>{item.title || "Luxury Item"}</Text>
                                <Text style={styles.itemQty}>Quantity: {item.quantity || 1}</Text>
                              </View>
                              <View style={styles.binBox}>
                                <Lucide name="compass-outline" size={13} color="#00f5ff" />
                                <Text style={styles.binText}>{item.bin || "B12-S4-A"}</Text>
                              </View>
                            </View>
                          ))}
                        </View>

                        {task.status !== "COMPLETED" && (
                          <TouchableOpacity 
                            style={styles.packBtn}
                            onPress={() => handleCompleteTask(task.id)}
                          >
                            <Lucide name="checkbox-outline" size={17} color="#000" />
                            <Text style={styles.packBtnText}>Confirm Pack & Settle</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Flat-file Catalog importer */}
            <View style={styles.importerCard}>
              <Text style={styles.importHeading}>Bulk catalog JSON parser</Text>
              <Text style={styles.importSub}>
                Ingest hundreds of active product nodes directly. Hydrates titles, price, stock tiers, and vibes directly in the ledger.
              </Text>

              <TouchableOpacity style={styles.simulatedBtn} onPress={loadSimulatedCatalog}>
                <Text style={styles.simulatedBtnText}>Load Simulated Catalog dataset</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.csvTextarea}
                placeholder="Paste Catalog JSON data here..."
                placeholderTextColor="rgba(255,255,255,0.15)"
                multiline={true}
                value={csvContent}
                onChangeText={setCsvContent}
              />

              <TouchableOpacity 
                style={styles.importSubmitBtn} 
                onPress={handleBulkImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Lucide name="cloud-upload-outline" size={19} color="#000" />
                    <Text style={styles.importSubmitText}>Run Bulk Ingestion</Text>
                  </>
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
  segmentBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 18,
  },
  segmentBtnActive: {
    backgroundColor: "#00f5ff",
  },
  segmentText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  segmentTextActive: {
    color: "#000",
  },
  scrollContent: {
    paddingBottom: 60,
  },
  pickerIdCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 20,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  pickerIdLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "bold",
  },
  pickerIdInput: {
    flex: 1,
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
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
    paddingVertical: 64,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    textAlign: "center",
  },
  tasksList: {
    gap: 16,
  },
  taskCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    paddingBottom: 8,
  },
  taskIdText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  statusBadge: {
    backgroundColor: "rgba(0,245,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeDone: {
    borderColor: "rgba(0,255,0,0.25)",
    backgroundColor: "rgba(0,255,0,0.05)",
  },
  statusText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusTextDone: {
    color: "#00ff00",
  },
  itemsBlock: {
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemMain: {
    gap: 2,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  itemQty: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12.5,
  },
  binBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  binText: {
    color: "#00f5ff",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  packBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  packBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  importerCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 28,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 24,
    gap: 12,
  },
  importHeading: {
    color: "#fff",
    fontSize: 16.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  importSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 15,
  },
  simulatedBtn: {
    backgroundColor: "rgba(0,245,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  simulatedBtnText: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  csvTextarea: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    color: "#00ff00",
    fontFamily: "Courier",
    fontSize: 13,
    padding: 14,
    height: 180,
    textAlignVertical: "top",
  },
  importSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  importSubmitText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
