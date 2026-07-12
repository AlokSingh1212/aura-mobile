import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import {
  fetchProfessionalInsights,
  type InsightsPeriod,
  type MobileInsights,
} from "@/lib/insightsApi";
import { formatCompactNumber } from "@/constants/format";

const { width } = Dimensions.get("window");

type Tab = "overview" | "content" | "audience" | "money";

const PERIODS: { key: InsightsPeriod; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );
}

export default function ProInsightsScreen() {
  const { currentUser, activeProfile, triggerHaptic, authHydrated } = useStore();
  const [period, setPeriod] = useState<InsightsPeriod>("30d");
  const [tab, setTab] = useState<Tab>("overview");
  const [insights, setInsights] = useState<MobileInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    const data = await fetchProfessionalInsights({
      userId: currentUser.id,
      profileId: activeProfile?.id,
      period,
    });
    setInsights(data);
  }, [currentUser?.id, activeProfile?.id, period]);

  useEffect(() => {
    if (!authHydrated) return;
    if (!currentUser?.id) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [authHydrated, currentUser?.id, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const ov = insights?.accountOverview;
  const content = insights?.contentInsights;
  const audience = insights?.audience;
  const money = insights?.monetization;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Lucide name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional dashboard</Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic("light");
              router.push("/settings/store" as any);
            }}
          >
            <Lucide name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              onPress={() => {
                triggerHaptic("light");
                setPeriod(p.key);
              }}
            >
              <Text
                style={[styles.periodText, period === p.key && styles.periodTextActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.tabRow}>
          {(
            [
              ["overview", "Overview"],
              ["content", "Content"],
              ["audience", "Audience"],
              ["money", "Money"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic("light");
                setTab(key);
              }}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading && !insights ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00f5ff" />
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f5ff" />
          }
        >
          {!insights ? (
            <Text style={styles.empty}>Could not load insights. Pull to refresh.</Text>
          ) : null}

          {tab === "overview" && ov ? (
            <>
              <Text style={styles.sectionTitle}>Account overview</Text>
              <View style={styles.metricGrid}>
                <MetricCard
                  label="Accounts reached"
                  value={formatCompactNumber(ov.accountsReached)}
                />
                <MetricCard
                  label="Total interactions"
                  value={formatCompactNumber(ov.totalInteractions)}
                />
                <MetricCard
                  label="Followers"
                  value={formatCompactNumber(ov.followersCount)}
                  sub={
                    ov.newFollowers > 0
                      ? `+${ov.newFollowers} (${ov.followerGrowthPct}%)`
                      : undefined
                  }
                />
                <MetricCard label="Aura score" value={String(ov.auraScore)} />
                <MetricCard label="Posts" value={String(ov.postsCount)} />
                <MetricCard label="Active stories" value={String(ov.activeStoriesCount)} />
                <MetricCard
                  label="Profile visits"
                  value={formatCompactNumber(ov.profileVisits ?? 0)}
                  sub={
                    ov.uniqueProfileVisitors
                      ? `${formatCompactNumber(ov.uniqueProfileVisitors)} unique`
                      : undefined
                  }
                />
                <MetricCard
                  label="Unfollows"
                  value={formatCompactNumber(ov.unfollows ?? 0)}
                />
              </View>

              <Text style={styles.sectionTitle}>Interaction breakdown</Text>
              <View style={styles.breakdownCard}>
                {Object.entries(ov.interactionBreakdown).map(([k, v]) => (
                  <View key={k} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{k.replace("_", " ")}</Text>
                    <Text style={styles.breakdownVal}>{formatCompactNumber(v)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.quickLinks}>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => router.push("/maison/business-suite" as any)}
                >
                  <Lucide name="megaphone-outline" size={20} color="#00f5ff" />
                  <Text style={styles.linkText}>Business Suite</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => router.push("/settings/store/promotions" as any)}
                >
                  <Lucide name="pricetag-outline" size={20} color="#00f5ff" />
                  <Text style={styles.linkText}>Promotions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => router.push("/sponsorships" as any)}
                >
                  <Lucide name="briefcase-outline" size={20} color="#00f5ff" />
                  <Text style={styles.linkText}>Brand deals</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {tab === "content" && content ? (
            <>
              <Text style={styles.sectionTitle}>Content performance</Text>
              {(["posts", "reels", "stories"] as const).map((kind) => {
                const s = content.summary[kind];
                return (
                  <View key={kind} style={styles.contentKindCard}>
                    <Text style={styles.contentKindTitle}>
                      {kind.charAt(0).toUpperCase() + kind.slice(1)}
                    </Text>
                    <View style={styles.contentStatsRow}>
                      <Text style={styles.contentStat}>Count {s.count ?? 0}</Text>
                      <Text style={styles.contentStat}>Views {s.views ?? 0}</Text>
                      <Text style={styles.contentStat}>Likes {s.likes ?? 0}</Text>
                    </View>
                  </View>
                );
              })}

              <Text style={styles.sectionTitle}>Top content</Text>
              {content.topContent.length === 0 ? (
                <Text style={styles.empty}>Publish posts or reels to see performance here.</Text>
              ) : (
                content.topContent.map((item) => (
                  <View key={item.postId} style={styles.topItem}>
                    <Image source={{ uri: item.thumbnail }} style={styles.topThumb} />
                    <View style={styles.topMeta}>
                      <Text style={styles.topType}>{item.contentType.toUpperCase()}</Text>
                      <Text numberOfLines={2} style={styles.topCaption}>
                        {item.caption || "Untitled"}
                      </Text>
                      <Text style={styles.topStats}>
                        {item.views} views · {item.likes} likes · {item.comments} comments
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : null}

          {tab === "audience" && audience ? (
            <>
              <Text style={styles.sectionTitle}>Audience</Text>
              <View style={styles.metricGrid}>
                <MetricCard
                  label="Followers"
                  value={formatCompactNumber(audience.followersCount)}
                />
                <MetricCard
                  label="New followers"
                  value={formatCompactNumber(audience.newFollowers)}
                />
                <MetricCard
                  label="Profile visits"
                  value={formatCompactNumber(audience.profileVisits ?? 0)}
                />
                <MetricCard
                  label="Unfollows"
                  value={formatCompactNumber(audience.unfollows ?? 0)}
                />
              </View>

              <Text style={styles.sectionTitle}>Top countries (new followers)</Text>
              {audience.topCountries.length === 0 ? (
                <Text style={styles.empty}>Not enough follower data yet.</Text>
              ) : (
                audience.topCountries.map((c) => (
                  <View key={c.countryCode} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{c.countryCode}</Text>
                    <Text style={styles.breakdownVal}>
                      {c.count} ({c.pct}%)
                    </Text>
                  </View>
                ))
              )}

              {audience.topCities.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Store views by city</Text>
                  {audience.topCities.map((c) => (
                    <View key={c.city} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{c.city}</Text>
                      <Text style={styles.breakdownVal}>{c.views} views</Text>
                    </View>
                  ))}
                </>
              ) : null}

              {audience.contentLocations.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Tagged locations</Text>
                  {audience.contentLocations.map((l) => (
                    <View key={l.location} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{l.location}</Text>
                      <Text style={styles.breakdownVal}>{l.postCount} posts</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </>
          ) : null}

          {tab === "money" && money ? (
            <>
              <Text style={styles.sectionTitle}>Monetization</Text>
              <View style={styles.metricGrid}>
                <MetricCard
                  label="Affiliate earnings"
                  value={`₹${money.affiliate.totalEarnings.toLocaleString()}`}
                  sub={`${money.affiliate.totalReferrals} referrals`}
                />
                <MetricCard
                  label="Wallet balance"
                  value={`₹${money.walletBalance.toLocaleString()}`}
                />
                <MetricCard label="Brand deals active" value={String(money.brandDeals.active)} />
                <MetricCard label="Deals pending" value={String(money.brandDeals.pending)} />
              </View>

              {money.maisonPayouts ? (
                <>
                  <Text style={styles.sectionTitle}>Maison payouts</Text>
                  <View style={styles.breakdownCard}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Settled</Text>
                      <Text style={styles.breakdownVal}>
                        ₹{money.maisonPayouts.settled.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Escrow</Text>
                      <Text style={styles.breakdownVal}>
                        ₹{money.maisonPayouts.escrowLocked.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}

              {insights?.ads ? (
                <>
                  <Text style={styles.sectionTitle}>Ads performance</Text>
                  <View style={styles.breakdownCard}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Impressions</Text>
                      <Text style={styles.breakdownVal}>
                        {formatCompactNumber(insights.ads.totalImpressions)}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Clicks</Text>
                      <Text style={styles.breakdownVal}>
                        {formatCompactNumber(insights.ads.totalClicks)}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Spend</Text>
                      <Text style={styles.breakdownVal}>
                        ₹{insights.ads.totalSpent.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>CTR</Text>
                      <Text style={styles.breakdownVal}>{insights.ads.ctr}%</Text>
                    </View>
                  </View>
                </>
              ) : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/settings/store/payouts" as any)}
              >
                <Text style={styles.primaryBtnText}>View payouts & earnings</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#05030f" },
  safe: { backgroundColor: "#05030f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  periodRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  periodChipActive: { backgroundColor: "rgba(0,245,255,0.15)" },
  periodText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  periodTextActive: { color: "#00f5ff" },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: "#00f5ff" },
  tabText: { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 42) / 2,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metricValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  metricLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 },
  metricSub: { color: "#00f5ff", fontSize: 11, marginTop: 4 },
  breakdownCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  breakdownLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, textTransform: "capitalize" },
  breakdownVal: { color: "#fff", fontWeight: "600" },
  quickLinks: { gap: 10, marginTop: 8 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  linkText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  contentKindCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  contentKindTitle: { color: "#00f5ff", fontWeight: "700", marginBottom: 8 },
  contentStatsRow: { flexDirection: "row", gap: 16 },
  contentStat: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  topItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: 8,
  },
  topThumb: { width: 56, height: 72, borderRadius: 6, backgroundColor: "#111" },
  topMeta: { flex: 1 },
  topType: { color: "#00f5ff", fontSize: 10, fontWeight: "700" },
  topCaption: { color: "#fff", fontSize: 13, marginTop: 4 },
  topStats: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 6 },
  empty: { color: "rgba(255,255,255,0.45)", textAlign: "center", padding: 24 },
  primaryBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  primaryBtnText: { color: "#05030f", fontWeight: "800", fontSize: 15 },
});
