import React, { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { useStore } from "@/store/useStore";
import {
  addPaymentMethod,
  fetchPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
  type SavedPaymentMethod,
} from "@/lib/paymentMethodsApi";

export default function PaymentsSettingsScreen() {
  const { currentUser } = useStore();
  const { data, patch } = useSettingsSection("payments");
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const remote = await fetchPaymentMethods(currentUser.id);
    if (remote) {
      setMethods(remote.methods);
      setWalletBalance(remote.walletBalance);
    }
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!data) return null;

  const addMethod = () => {
    if (!currentUser?.id) {
      Alert.alert("Sign in required");
      return;
    }

    Alert.alert("Add payment method", undefined, [
      {
        text: "UPI",
        onPress: () => {
          const promptUpi = (upiId: string) => {
            if (!upiId.trim()) return;
            addPaymentMethod({
              userId: currentUser.id,
              type: "UPI",
              label: `UPI · ${upiId.trim()}`,
              upiId: upiId.trim(),
              isDefault: methods.length === 0,
            }).then(() => reload());
          };
          if (Alert.prompt) {
            Alert.prompt("UPI ID", "Enter your UPI address", promptUpi);
          } else {
            promptUpi("user@upi");
          }
        },
      },
      {
        text: "Credit / Debit card",
        onPress: () => {
          addPaymentMethod({
            userId: currentUser.id,
            type: "CARD",
            label: "Card",
            last4: "4242",
            isDefault: methods.length === 0,
          }).then(() => reload());
        },
      },
      {
        text: "AURA Wallet",
        onPress: () => {
          addPaymentMethod({
            userId: currentUser.id,
            type: "WALLET",
            label: "AURA Wallet",
            isDefault: methods.length === 0,
          }).then(() => reload());
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const setDefault = async (id: string) => {
    if (!currentUser?.id) return;
    const ok = await setDefaultPaymentMethod(currentUser.id, id);
    if (ok) await reload();
  };

  const removeMethod = (id: string, label: string) => {
    if (!currentUser?.id) return;
    Alert.alert("Remove payment method?", label, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removePaymentMethod(currentUser.id, id);
          await reload();
        },
      },
    ]);
  };

  return (
    <IgSettingsScreen title="Payment methods">
      <IgBodyText>
        Manage how you pay on AURA Shop. Methods sync to your account for faster checkout.
      </IgBodyText>

      {loading ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator color="#0095f6" />
        </View>
      ) : null}

      <IgSectionTitle>Saved methods</IgSectionTitle>
      <IgRow
        label="AURA Wallet balance"
        sublabel={`₹${walletBalance.toLocaleString()} · refunds and store credit`}
        onPress={() => router.push("/account/wallet" as any)}
      />
      {methods.length === 0 ? (
        <IgRow label="No payment methods yet" showChevron={false} last />
      ) : (
        methods.map((m, idx) => (
          <IgRow
            key={m.id}
            label={`${m.label}${m.last4 ? ` ··· ${m.last4}` : ""}`}
            sublabel={m.isDefault ? "Default for checkout" : "Tap to set as default"}
            rightText={m.isDefault ? "✓" : undefined}
            onPress={() => setDefault(m.id)}
            last={idx === methods.length - 1}
          />
        ))
      )}

      <IgRow label="Add payment method" onPress={addMethod} />

      {methods.map((m) => (
        <IgRow
          key={`remove-${m.id}`}
          label={`Remove ${m.label}`}
          danger
          onPress={() => removeMethod(m.id, m.label)}
        />
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
