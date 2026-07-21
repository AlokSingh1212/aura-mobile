import React, { useCallback, useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  IgSettingsScreen,
  IgRow,
  IgSectionTitle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import {
  createMaisonPremiumCheckout,
  fetchMaisonPremiumStatus,
  verifyMaisonPremiumPayment,
  type MaisonPremiumStatus,
} from "@/lib/maisonPremiumApi";
import { IG } from "@/theme/settingsTheme";

export default function VerifiedMaisonPremiumScreen() {
  const { currentUser, activeMaisonId, activeProfile, triggerHaptic } = useStore();
  const maisonId = activeMaisonId || activeProfile?.maisonId || currentUser?.maisonId;
  const userId = currentUser?.id;

  const [status, setStatus] = useState<MaisonPremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !maisonId) return;
    setLoading(true);
    try {
      const s = await fetchMaisonPremiumStatus(userId, maisonId);
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, [userId, maisonId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubscribe = async () => {
    if (!userId || !maisonId) return;
    triggerHaptic("medium");
    setPaying(true);
    try {
      const checkout = await createMaisonPremiumCheckout(userId, maisonId);
      if (!checkout.success) {
        Alert.alert("Checkout failed", checkout.error || "Could not start payment");
        return;
      }

      const isSim =
        checkout.razorpayOrderId?.startsWith("order_sim_") ||
        !checkout.key ||
        checkout.key === "mock-key";

      if (isSim) {
        const verified = await verifyMaisonPremiumPayment({
          userId,
          maisonId,
          razorpayOrderId: checkout.razorpayOrderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
        });
        if (verified.success) {
          Alert.alert("Verified Maison active", "Your verified badge and showcase are live for 30 days.");
          await load();
        } else {
          Alert.alert("Verification failed", verified.error || "Try again");
        }
        return;
      }

      try {
        const RazorpayCheckout = require("react-native-razorpay").default;
        const payment = await RazorpayCheckout.open({
          key: checkout.key,
          amount: checkout.amountPaise,
          currency: checkout.currency || "INR",
          name: "AURA",
          description: checkout.description || "Verified Maison · 30 days",
          order_id: checkout.razorpayOrderId,
          prefill: { email: currentUser?.email || "" },
          theme: { color: "#000000" },
        });

        const verified = await verifyMaisonPremiumPayment({
          userId,
          maisonId,
          razorpayOrderId: checkout.razorpayOrderId,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature,
        });

        if (verified.success) {
          Alert.alert("Verified Maison active", "Badge + discover showcase enabled.");
          await load();
        } else {
          Alert.alert("Verification failed", verified.error || "Contact support");
        }
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code !== "PAYMENT_CANCELLED") {
          Alert.alert("Payment error", "Could not complete Razorpay checkout.");
        }
      }
    } finally {
      setPaying(false);
    }
  };

  if (!maisonId || !userId) {
    return (
      <IgSettingsScreen title="Verified Maison">
        <IgBodyText>Switch to a business Maison profile to subscribe.</IgBodyText>
        <IgRow label="Accounts Center" onPress={() => router.push("/settings/accounts" as any)} last />
      </IgSettingsScreen>
    );
  }

  if (loading) {
    return (
      <IgSettingsScreen title="Verified Maison">
        <ActivityIndicator color={IG.accent} style={{ marginTop: 40 }} />
      </IgSettingsScreen>
    );
  }

  const active = status?.isActive;
  const price = status?.priceInr ?? 999;

  return (
    <IgSettingsScreen title="Verified Maison">
      <View style={styles.hero}>
        <Lucide name="checkmark-circle" size={48} color="#0095f6" />
        <Text style={styles.heroTitle}>Verified Maison</Text>
        <Text style={styles.heroPrice}>₹{price.toLocaleString("en-IN")} / 30 days</Text>
        {active ? (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active until {formatDate(status?.premiumUntil)}</Text>
          </View>
        ) : null}
      </View>

      <IgSectionTitle>What you get</IgSectionTitle>
      <IgBodyText>
        {`• Blue verified badge on shop listings and your product pages
• Showcase listing — buyers discover your brand in the app
• Website / custom domain link visible on your public profile`}
      </IgBodyText>

      {status?.website ? (
        <>
          <IgSectionTitle>Public website</IgSectionTitle>
          <IgRow
            label={status.website}
            sublabel="Visible to all users while premium is active"
            onPress={() => Linking.openURL(status.website!.startsWith("http") ? status.website! : `https://${status.website}`)}
            last
          />
        </>
      ) : (
        <IgBodyText>
          Add a website in your profile or custom domain in admin to show it on your public Maison page.
        </IgBodyText>
      )}

      <IgSectionTitle>Plan</IgSectionTitle>
      <IgRow
        label={active ? "Renew Verified Maison" : "Subscribe — Verified Maison"}
        sublabel={paying ? "Processing…" : `₹${price} via Razorpay · 8% marketplace commission applies to sales`}
        onPress={paying ? undefined : handleSubscribe}
        last
      />
    </IgSettingsScreen>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingVertical: 24, gap: 8 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: IG.text },
  heroPrice: { fontSize: 16, color: IG.textSecondary },
  activePill: {
    marginTop: 8,
    backgroundColor: "rgba(0,149,246,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activePillText: { color: "#0095f6", fontSize: 13, fontWeight: "600" },
});
