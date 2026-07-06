import React, { useMemo } from "react";
import { Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  IgSettingsScreen,
  IgRow,
  IgSectionTitle,
  IgBodyText,
  IgToggle,
} from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { useEnforcedSettings } from "@/context/SettingsEnforcementContext";
import { IG } from "@/theme/settingsTheme";

export default function StoreManagementHub() {
  const { activeProfile, activeMaisonId, triggerHaptic, currentUser } = useStore();
  const { data: store, patch } = useSettingsSection("store");
  const { t } = useEnforcedSettings();

  const isSeller =
    activeProfile?.type === "BUSINESS" || !!activeMaisonId || !!activeProfile?.maisonId;
  const maisonId = activeMaisonId || activeProfile?.maisonId || currentUser?.maisonId;

  const storeName = useMemo(
    () => activeProfile?.name || activeProfile?.username || "Your store",
    [activeProfile]
  );

  if (!isSeller) {
    return (
      <IgSettingsScreen title={t("store.hub.title", "Store management")}>
        <IgBodyText>
          Switch to a Business or Maison profile to manage your shop catalog, orders, shipping and
          payouts — similar to Instagram&apos;s professional dashboard.
        </IgBodyText>
        <IgRow
          label="Accounts Center"
          sublabel="Switch to a business profile"
          onPress={() => router.push("/settings/accounts" as any)}
          last
        />
      </IgSettingsScreen>
    );
  }

  if (!dataReady(store)) return null;

  return (
    <IgSettingsScreen title={t("store.hub.title", "Store management")} largeTitle={storeName}>
      <View style={styles.badgeRow}>
        <Lucide name="storefront-outline" size={18} color={IG.accent} />
        <Text style={styles.badge}>Professional shop · {maisonId?.slice(0, 8) || "linked"}</Text>
      </View>

      {store.vacationMode ? (
        <View style={styles.vacationBanner}>
          <Text style={styles.vacationText}>Vacation mode is ON — buyers see your shop as closed.</Text>
        </View>
      ) : null}

      <IgSectionTitle>Shop status</IgSectionTitle>
      <IgToggle
        label={t("store.vacation", "Vacation mode")}
        hint="Hide checkout and show a closed message to buyers"
        value={store.vacationMode}
        onValueChange={(v) => {
          triggerHaptic("light");
          patch({ vacationMode: v });
        }}
      />
      <IgToggle
        label="Customer messages"
        hint="Allow order enquiries in inbox"
        value={store.customerMessagesEnabled}
        onValueChange={(v) => patch({ customerMessagesEnabled: v })}
      />
      <IgToggle
        label="Show inventory on listings"
        value={store.showInventoryCount}
        onValueChange={(v) => patch({ showInventoryCount: v })}
        last
      />

      <IgSectionTitle>Manage your shop</IgSectionTitle>
      <IgRow
        label={t("store.catalog", "Catalog")}
        sublabel="Products, variants and listings"
        onPress={() => router.push("/settings/store/catalog" as any)}
      />
      <IgRow
        label={t("store.orders", "Orders")}
        sublabel="Fulfillment and order status"
        onPress={() => router.push("/settings/store/orders" as any)}
      />
      <IgRow
        label={t("store.shipping", "Shipping & delivery")}
        sublabel="Processing time and free shipping rules"
        onPress={() => router.push("/settings/store/shipping" as any)}
      />
      <IgRow
        label={t("store.payouts", "Payouts & earnings")}
        sublabel="Escrow, settlements and affiliate"
        onPress={() => router.push("/settings/store/payouts" as any)}
      />
      <IgRow
        label={t("store.customers", "Customer messages")}
        sublabel="Order enquiries and support"
        onPress={() => router.push("/settings/store/customers" as any)}
      />
      <IgRow
        label={t("store.promotions", "Promotions")}
        sublabel="Coupons and discount codes"
        onPress={() => router.push("/settings/store/promotions" as any)}
      />
      <IgRow
        label={t("store.policies", "Shop policies")}
        sublabel="Returns, offers and automation"
        onPress={() => router.push("/settings/store/policies" as any)}
        last
      />

      <IgSectionTitle>Quick tools</IgSectionTitle>
      <IgRow
        label="AURA Business Suite"
        sublabel="Ads, analytics and team"
        onPress={() => router.push("/maison/business-suite" as any)}
      />
      <IgRow
        label="Add product"
        onPress={() => router.push("/create" as any)}
        last
      />
    </IgSettingsScreen>
  );
}

function dataReady<T>(v: T | null): v is T {
  return v != null;
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  badge: { color: IG.textSecondary, fontSize: 13 },
  vacationBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 152, 0, 0.15)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 152, 0, 0.4)",
  },
  vacationText: { color: "#FFB74D", fontSize: 13, lineHeight: 18 },
});
