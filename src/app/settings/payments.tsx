import React from "react";
import { Alert } from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import type { PaymentMethod } from "@/lib/ecosystemSettings";

export default function PaymentsSettingsScreen() {
  const { data, patch } = useSettingsSection("payments");
  if (!data) return null;

  const addMethod = () => {
    Alert.alert("Add payment method", undefined, [
      {
        text: "UPI",
        onPress: () => {
          const m: PaymentMethod = {
            id: `upi_${Date.now()}`,
            type: "UPI",
            label: "UPI · alok@aura",
            isDefault: data.methods.length === 0,
          };
          patch({
            methods: [...data.methods, m],
            defaultMethodId: data.defaultMethodId || m.id,
          });
        },
      },
      {
        text: "Credit / Debit card",
        onPress: () => {
          const m: PaymentMethod = {
            id: `card_${Date.now()}`,
            type: "CARD",
            label: "Visa",
            last4: "4242",
            isDefault: data.methods.length === 0,
          };
          patch({
            methods: [...data.methods, m],
            defaultMethodId: data.defaultMethodId || m.id,
          });
        },
      },
      {
        text: "AURA Wallet",
        onPress: () => {
          const m: PaymentMethod = {
            id: `wallet_${Date.now()}`,
            type: "WALLET",
            label: "AURA Wallet",
            isDefault: data.methods.length === 0,
          };
          patch({
            methods: [...data.methods, m],
            defaultMethodId: data.defaultMethodId || m.id,
          });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const setDefault = (id: string) => {
    patch({
      defaultMethodId: id,
      methods: data.methods.map((m) => ({ ...m, isDefault: m.id === id })),
    });
  };

  const removeMethod = (id: string) => {
    Alert.alert("Remove payment method?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const methods = data.methods.filter((m) => m.id !== id);
          patch({
            methods,
            defaultMethodId:
              data.defaultMethodId === id ? methods[0]?.id || null : data.defaultMethodId,
          });
        },
      },
    ]);
  };

  return (
    <IgSettingsScreen title="Payment methods">
      <IgBodyText>
        Manage how you pay on AURA Shop. Methods are stored securely for faster checkout.
      </IgBodyText>

      <IgSectionTitle>Saved methods</IgSectionTitle>
      {data.methods.length === 0 ? (
        <IgRow label="No payment methods yet" showChevron={false} last />
      ) : (
        data.methods.map((m, idx) => (
          <IgRow
            key={m.id}
            label={`${m.label}${m.last4 ? ` ··· ${m.last4}` : ""}`}
            sublabel={m.isDefault ? "Default for checkout" : "Tap to set as default"}
            rightText={m.isDefault ? "✓" : undefined}
            onPress={() => setDefault(m.id)}
            last={idx === data.methods.length - 1}
          />
        ))
      )}

      <IgRow label="Add payment method" onPress={addMethod} />

      {data.methods.map((m) => (
        <IgRow key={`remove-${m.id}`} label={`Remove ${m.label}`} danger onPress={() => removeMethod(m.id)} />
      ))}

      <IgSectionTitle>Checkout</IgSectionTitle>
      <IgToggle
        label="Save cards for future checkout"
        value={data.saveCardsForCheckout}
        onValueChange={(v) => patch({ saveCardsForCheckout: v })}
        last
      />
    </IgSettingsScreen>
  );
}
