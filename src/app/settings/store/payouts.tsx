import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { IgSettingsScreen, IgSectionTitle, IgBodyText } from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { fetchEarnings, type MaisonEarnings } from "@/lib/earningsApi";
import { IG } from "@/theme/settingsTheme";

export default function StorePayoutsSettings() {
  const { activeMaisonId, activeProfile } = useStore();
  const maisonId = activeMaisonId || activeProfile?.maisonId;
  const [loading, setLoading] = useState(true);
  const [maison, setMaison] = useState<MaisonEarnings | null>(null);
  const [creatorTotal, setCreatorTotal] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchEarnings(maisonId || undefined);
      if (res.success) {
        setMaison(res.maison || null);
        setCreatorTotal(res.creator?.totalEarnings || 0);
      }
      setLoading(false);
    })();
  }, [maisonId]);

  return (
    <IgSettingsScreen title="Payouts & earnings">
      <IgBodyText>
        Track escrow, settled payouts from shop sales, and affiliate commissions.
      </IgBodyText>

      {loading ? (
        <ActivityIndicator color={IG.text} style={{ marginTop: 24 }} />
      ) : (
        <>
          {maison ? (
            <>
              <IgSectionTitle>{maison.maisonName}</IgSectionTitle>
              <View style={styles.grid}>
                <Stat label="In escrow" value={`₹${maison.escrowLocked.toLocaleString("en-IN")}`} />
                <Stat label="Settled" value={`₹${maison.settled.toLocaleString("en-IN")}`} />
                <Stat label="Refunded" value={`₹${maison.refunded.toLocaleString("en-IN")}`} />
              </View>
              <IgSectionTitle>Recent ledger</IgSectionTitle>
              {maison.entries.slice(0, 8).map((e) => (
                <View key={e.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{e.type} · ₹{e.amount.toLocaleString("en-IN")}</Text>
                  <Text style={styles.rowMeta}>{e.status}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.empty}>Link a Maison to view shop payouts.</Text>
          )}

          {creatorTotal > 0 ? (
            <>
              <IgSectionTitle>Affiliate</IgSectionTitle>
              <Text style={styles.affiliate}>Total affiliate earnings: ₹{creatorTotal.toLocaleString("en-IN")}</Text>
            </>
          ) : null}
        </>
      )}
    </IgSettingsScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  stat: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: IG.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
  },
  statLabel: { color: IG.textSecondary, fontSize: 11, marginBottom: 4 },
  statValue: { color: IG.text, fontWeight: "700", fontSize: 15 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  rowTitle: { color: IG.text, fontSize: 14 },
  rowMeta: { color: IG.textMuted, fontSize: 12, marginTop: 2 },
  empty: { color: IG.textSecondary, padding: 16 },
  affiliate: { color: IG.text, paddingHorizontal: 16, fontSize: 15 },
});
