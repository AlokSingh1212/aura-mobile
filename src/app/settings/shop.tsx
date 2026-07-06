import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { countriesAsOptions } from "@/lib/worldLocations";
import type { PaymentMethod } from "@/lib/ecosystemSettings";

export default function ShopSettingsScreen() {
  const { data, patch } = useSettingsSection("shop");
  if (!data) return null;

  const countryLabel =
    countriesAsOptions().find((c) => c.id === data.defaultCountryIso)?.label ||
    data.defaultCountryIso;

  const pickCountry = () => {
    Alert.alert("Default country", "Used at checkout for new addresses", [
      ...countriesAsOptions()
        .slice(0, 10)
        .map((c) => ({
          text: c.label,
          onPress: () => patch({ defaultCountryIso: c.id }),
        })),
      { text: "Manage addresses", onPress: () => router.push("/settings/delivery" as any) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <IgSettingsScreen title="Shop preferences">
      <IgBodyText>
        Checkout defaults for AURA Shop — synced with delivery addresses and order notifications.
      </IgBodyText>

      <IgSectionTitle>Delivery & checkout</IgSectionTitle>
      <IgRow label="Default country" sublabel={countryLabel} onPress={pickCountry} />
      <IgRow label="Delivery addresses" onPress={() => router.push("/settings/delivery" as any)} />
      <IgToggle
        label="Express delivery"
        hint="Prefer 1–2 day shipping (+₹49)"
        value={data.expressDelivery}
        onValueChange={(v) => patch({ expressDelivery: v })}
      />
      <IgToggle
        label="Cash on delivery"
        value={data.codEnabled}
        onValueChange={(v) => patch({ codEnabled: v })}
        last
      />

      <IgSectionTitle>Offers & pricing</IgSectionTitle>
      <IgToggle
        label="Bank offers on product pages"
        value={data.showBankOffers}
        onValueChange={(v) => patch({ showBankOffers: v })}
      />
      <IgToggle
        label="Show price history"
        hint="See lowest price in last 30 days on PDP"
        value={data.showPriceHistory}
        onValueChange={(v) => patch({ showPriceHistory: v })}
      />
      <IgToggle
        label="Auto-apply best coupon"
        hint="At checkout, apply the highest valid coupon"
        value={data.autoApplyCoupons}
        onValueChange={(v) => patch({ autoApplyCoupons: v })}
        last
      />

      <IgSectionTitle>Orders</IgSectionTitle>
      <IgToggle
        label="Email order updates"
        value={data.emailOrderUpdates}
        onValueChange={(v) => patch({ emailOrderUpdates: v })}
      />
      <IgRow label="Order history" onPress={() => router.push("/shop/orders" as any)} last />
    </IgSettingsScreen>
  );
}
