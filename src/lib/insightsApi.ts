import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type InsightsPeriod = "7d" | "30d" | "90d" | "all";

export type MobileInsights = {
  meta: {
    profileId: string;
    profileType: string;
    username: string;
    displayName: string;
    period: string;
  };
  accountOverview: {
    postsCount: number;
    activeStoriesCount: number;
    followersCount: number;
    followingCount: number;
    auraScore: number;
    newFollowers: number;
    followerGrowthPct: number;
    accountsReached: number;
    totalInteractions: number;
    interactionBreakdown: Record<string, number>;
    profileVisits: number;
    uniqueProfileVisitors: number;
    unfollows: number;
  };
  contentInsights: {
    summary: {
      posts: Record<string, number>;
      reels: Record<string, number>;
      stories: Record<string, number>;
    };
    topContent: {
      postId: string;
      contentType: string;
      thumbnail: string;
      caption: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
    }[];
  };
  audience: {
    followersCount: number;
    newFollowers: number;
    unfollows: number;
    profileVisits: number;
    uniqueProfileVisitors: number;
    topCountries: { countryCode: string; count: number; pct: number }[];
    topCities: { city: string; views: number }[];
    contentLocations: { location: string; postCount: number }[];
  };
  monetization: {
    affiliate: {
      linksCount: number;
      totalReferrals: number;
      pendingCommissions: number;
      paidCommissions: number;
      totalEarnings: number;
    };
    brandDeals: {
      pending: number;
      active: number;
      completed: number;
      totalBudgetAccepted: number;
    };
    maisonPayouts: {
      escrowLocked: number;
      settled: number;
      refunded: number;
    } | null;
    walletBalance: number;
  };
  ads: {
    activeCount: number;
    totalImpressions: number;
    totalClicks: number;
    totalSpent: number;
    ctr: number;
  } | null;
};

export async function fetchProfessionalInsights(opts: {
  userId: string;
  profileId?: string | null;
  period?: InsightsPeriod;
}): Promise<MobileInsights | null> {
  const q = new URLSearchParams({ userId: opts.userId });
  if (opts.profileId) q.set("profileId", opts.profileId);
  if (opts.period) q.set("period", opts.period);

  const res = await fetch(`${API_BASE}/insights?${q.toString()}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.success ? (data.insights as MobileInsights) : null;
}
