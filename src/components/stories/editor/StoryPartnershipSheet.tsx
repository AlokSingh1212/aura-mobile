import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { fetchPartnershipAdCode } from "@/lib/partnershipCode";

export type PartnershipSettings = {
  paidPartnershipLabel: boolean;
  partnershipAdCode: boolean;
  partnershipAdCodeValue?: string | null;
};

type Props = {
  visible: boolean;
  settings: PartnershipSettings;
  userId: string;
  profileId?: string | null;
  onClose: () => void;
  onChange: (settings: PartnershipSettings) => void;
};

export function StoryPartnershipSheet({
  visible,
  settings,
  userId,
  profileId,
  onClose,
  onChange,
}: Props) {
  const [local, setLocal] = useState(settings);
  const [loadingCode, setLoadingCode] = useState(false);

  React.useEffect(() => {
    if (visible) setLocal(settings);
  }, [visible, settings]);

  const toggleAdCode = async (enabled: boolean) => {
    if (!enabled) {
      setLocal((s) => ({ ...s, partnershipAdCode: false, partnershipAdCodeValue: null }));
      return;
    }
    setLoadingCode(true);
    try {
      const code = await fetchPartnershipAdCode(userId, profileId);
      setLocal((s) => ({
        ...s,
        partnershipAdCode: true,
        partnershipAdCodeValue: code,
      }));
    } catch (e) {
      setLocal((s) => ({ ...s, partnershipAdCode: false, partnershipAdCodeValue: null }));
    } finally {
      setLoadingCode(false);
    }
  };

  const apply = () => {
    onChange(local);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="close" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Partnership label & ads</Text>
          <TouchableOpacity onPress={apply}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Branded Content</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setLocal((s) => ({ ...s, paidPartnershipLabel: !s.paidPartnershipLabel }))}
        >
          <Text style={styles.rowLabel}>Add paid partnership label</Text>
          <Lucide name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <Text style={styles.hint}>
          Adding the label helps us show your content to relevant audiences and complies with our
          Branded Content Policies.
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Partnership ad permissions</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Get partnership ad code</Text>
          {loadingCode ? (
            <ActivityIndicator color="#0095f6" />
          ) : (
            <Switch value={local.partnershipAdCode} onValueChange={toggleAdCode} />
          )}
        </View>
        {local.partnershipAdCodeValue ? (
          <Text style={styles.code}>Code: {local.partnershipAdCodeValue}</Text>
        ) : null}
        <Text style={styles.hint}>
          Sharing a code with a partner allows them to boost this content as a partnership ad.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff", paddingTop: 56 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111" },
  done: { fontSize: 16, fontWeight: "700", color: "#0095f6" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, color: "#111", flex: 1 },
  hint: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  code: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0095f6",
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
