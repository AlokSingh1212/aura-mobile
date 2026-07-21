import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgBodyText,
  IgRow,
} from "@/components/settings/InstagramSettingsUI";
import {
  fetchPayoutProfile,
  submitPayoutKycApi,
  addPayoutBeneficiaryApi,
  payoutErrorMessage,
  type PayoutProfile,
} from "@/lib/payoutApi";
import { IG } from "@/theme/settingsTheme";

export default function PayoutsSetupScreen() {
  const [profile, setProfile] = useState<PayoutProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [legalName, setLegalName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [accountType, setAccountType] = useState<"BANK" | "UPI">("BANK");
  const [accountHolder, setAccountHolder] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchPayoutProfile();
    setProfile(data);
    if (data?.kyc?.legalName) setLegalName(data.kyc.legalName);
    if (data?.beneficiary?.accountHolder) setAccountHolder(data.beneficiary.accountHolder);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const submitKyc = async () => {
    setSubmitting(true);
    const res = await submitPayoutKycApi({
      legalName: legalName.trim(),
      panNumber: panNumber.trim(),
    });
    setSubmitting(false);
    if (res.success) {
      Alert.alert("Submitted", "Identity verification is under review.");
      reload();
    } else {
      Alert.alert("Verification", payoutErrorMessage(res.error));
    }
  };

  const submitBank = async () => {
    setSubmitting(true);
    const res = await addPayoutBeneficiaryApi({
      accountType,
      accountHolder: accountHolder.trim(),
      ifsc: accountType === "BANK" ? ifsc.trim() : undefined,
      accountNumber: accountType === "BANK" ? accountNumber.trim() : undefined,
      upiId: accountType === "UPI" ? upiId.trim() : undefined,
    });
    setSubmitting(false);
    if (res.success) {
      Alert.alert(
        "Account linked",
        res.cooldownUntil
          ? "Payouts will activate after a short security cooldown."
          : "Your payout account is ready."
      );
      reload();
    } else {
      Alert.alert("Bank account", res.message || payoutErrorMessage(res.error));
    }
  };

  const kycApproved = profile?.kyc?.status === "APPROVED";

  return (
    <IgSettingsScreen title="Bank payouts">
      <IgBodyText>
        Earnings from shop sales, commissions, and brand partnerships are sent directly to your
        verified bank account. Identity verification is required by law and protects against fraud.
      </IgBodyText>

      {loading ? (
        <ActivityIndicator color={IG.text} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>Payout status</Text>
            <Text style={styles.statusLine}>
              {profile?.rail.canReceivePayouts
                ? "✓ Ready to receive bank transfers"
                : profile?.rail.blockReason || "Setup required"}
            </Text>
          </View>

          <IgSectionTitle>Step 1 · Identity (KYC)</IgSectionTitle>
          {profile?.kyc?.status === "APPROVED" ? (
            <Text style={styles.okText}>
              Verified · {profile.kyc.legalName} · PAN ····{profile.kyc.panLast4}
            </Text>
          ) : profile?.kyc?.status === "UNDER_REVIEW" || profile?.kyc?.status === "PENDING" ? (
            <Text style={styles.pendingText}>Under review — we verify PAN matches your legal name.</Text>
          ) : (
            <>
              <Field label="Legal name (as on PAN)" value={legalName} onChangeText={setLegalName} />
              <Field
                label="PAN number"
                value={panNumber}
                onChangeText={(t) => setPanNumber(t.toUpperCase())}
                autoCapitalize="characters"
              />
              <PrimaryBtn label="Submit for verification" onPress={submitKyc} loading={submitting} />
            </>
          )}

          <IgSectionTitle>Step 2 · Payout account</IgSectionTitle>
          {!kycApproved ? (
            <Text style={styles.hint}>Complete KYC before linking a bank account.</Text>
          ) : profile?.beneficiary?.status === "ACTIVE" ? (
            <View style={styles.linkedBox}>
              <Text style={styles.okText}>
                {profile.beneficiary.accountType === "UPI"
                  ? `UPI ${profile.beneficiary.upiMasked}`
                  : `Bank ····${profile.beneficiary.accountLast4} · ${profile.beneficiary.ifsc}`}
              </Text>
              {profile.beneficiary.cooldownUntil ? (
                <Text style={styles.hint}>Cooldown until new account is payout-active.</Text>
              ) : null}
              <IgRow label="Update payout account" onPress={() => setProfile({ ...profile!, beneficiary: null })} />
            </View>
          ) : (
            <>
              <View style={styles.toggleRow}>
                {(["BANK", "UPI"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.toggle, accountType === t && styles.toggleActive]}
                    onPress={() => setAccountType(t)}
                  >
                    <Text style={[styles.toggleText, accountType === t && styles.toggleTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="Account holder name" value={accountHolder} onChangeText={setAccountHolder} />
              {accountType === "BANK" ? (
                <>
                  <Field label="IFSC" value={ifsc} onChangeText={(t) => setIfsc(t.toUpperCase())} autoCapitalize="characters" />
                  <Field label="Account number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" secure />
                </>
              ) : (
                <Field label="UPI ID" value={upiId} onChangeText={setUpiId} autoCapitalize="none" />
              )}
              <PrimaryBtn label="Link payout account" onPress={submitBank} loading={submitting} />
            </>
          )}

          {profile?.transfers?.length ? (
            <>
              <IgSectionTitle>Recent transfers</IgSectionTitle>
              {profile.transfers.slice(0, 10).map((t) => (
                <View key={t.id} style={styles.transferRow}>
                  <Text style={styles.transferAmt}>₹{Math.round(t.amount).toLocaleString("en-IN")}</Text>
                  <Text style={styles.transferMeta}>
                    {t.purpose} · {t.status}
                    {t.utr ? ` · UTR ${t.utr}` : ""}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          <View style={styles.securityNote}>
            <Text style={styles.securityTitle}>Security</Text>
            <Text style={styles.securityText}>
              • PAN and account numbers are encrypted at rest{"\n"}
              • Name on bank account must match KYC{"\n"}
              • 48h cooldown after changing payout account{"\n"}
              • Daily and per-transfer limits apply{"\n"}
              • All payouts are audit-logged
            </Text>
          </View>
        </ScrollView>
      )}
    </IgSettingsScreen>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  autoCapitalize?: "none" | "characters";
  keyboardType?: "default" | "number-pad";
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholderTextColor={IG.textMuted}
        autoCapitalize={props.autoCapitalize || "words"}
        keyboardType={props.keyboardType}
        secureTextEntry={props.secure}
      />
    </View>
  );
}

function PrimaryBtn(props: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity style={styles.primaryBtn} onPress={props.onPress} disabled={props.loading}>
      {props.loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryBtnText}>{props.label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  statusBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: IG.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
  },
  statusTitle: { color: IG.text, fontWeight: "700", marginBottom: 4 },
  statusLine: { color: IG.textSecondary, fontSize: 13 },
  okText: { color: "#16a34a", paddingHorizontal: 16, fontSize: 14, marginBottom: 8 },
  pendingText: { color: IG.textSecondary, paddingHorizontal: 16, fontSize: 13, marginBottom: 8 },
  hint: { color: IG.textMuted, paddingHorizontal: 16, fontSize: 13, marginBottom: 12 },
  field: { paddingHorizontal: 16, marginBottom: 10 },
  fieldLabel: { color: IG.textSecondary, fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: IG.text,
    backgroundColor: IG.surface,
  },
  primaryBtn: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#0095f6",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  toggleRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  toggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    alignItems: "center",
  },
  toggleActive: { borderColor: "#0095f6", backgroundColor: "#0095f612" },
  toggleText: { color: IG.textSecondary, fontWeight: "600" },
  toggleTextActive: { color: "#0095f6" },
  linkedBox: { paddingHorizontal: 16, marginBottom: 8 },
  transferRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  transferAmt: { color: IG.text, fontWeight: "700" },
  transferMeta: { color: IG.textMuted, fontSize: 12, marginTop: 2 },
  securityNote: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: IG.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
  },
  securityTitle: { color: IG.text, fontWeight: "700", marginBottom: 6 },
  securityText: { color: IG.textSecondary, fontSize: 12, lineHeight: 18 },
});
