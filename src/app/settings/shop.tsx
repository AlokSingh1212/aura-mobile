import React, { useState } from "react";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { CountrySearchPicker } from "@/components/settings/CountrySearchPicker";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { countriesAsOptions } from "@/lib/worldLocations";

export default function ShopSettingsScreen() {
  const { data, patch } = useSettingsSection("shop");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  if (!data) return null;

  const countryLabel =
    countriesAsOptions().find((c) => c.id === data.defaultCountryIso)?.label ||
    data.defaultCountryIso;

  return (
    <>
      <IgSettingsScreen title="Shop preferences">
        <IgBodyText>
          Checkout defaults for AURA Shop — synced with delivery addresses and order notifications.
        </IgBodyText>

        <IgSectionTitle>Delivery & checkout</IgSectionTitle>
        <IgRow
          label="Default country"
          sublabel={countryLabel}
          onPress={() => setCountryPickerOpen(true)}
        />
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
          label="Bank offers at checkout"
          value={data.showBankOffers}
          onValueChange={(v) => patch({ showBankOffers: v })}
        />
        <IgToggle
          label="Price history on products"
          value={data.showPriceHistory}
          onValueChange={(v) => patch({ showPriceHistory: v })}
        />
        <IgToggle
          label="Auto-apply best coupon"
          hint="When available at checkout"
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
        <IgRow label="Payment methods" onPress={() => router.push("/settings/payments" as any)} last />
      </IgSettingsScreen>

      <CountrySearchPicker
        visible={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        onSelectIso={(iso) => patch({ defaultCountryIso: iso })}
        title="Default country"
      />
    </>
  );
}
