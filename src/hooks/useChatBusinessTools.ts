import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { getEnforcedSettings } from "@/lib/settingsEnforcement";
import {
  businessStatsToCards,
  createPromotionApi,
  EMPTY_BUSINESS_STATS,
  fetchAdsMetricsApi,
  fetchAutoReplyApi,
  fetchBroadcastsApi,
  fetchBusinessStatsApi,
  fetchPromotionsApi,
  formatBusinessRevenue,
  saveAutoReplyApi,
  sendBroadcastApi,
} from "@/lib/businessToolsApi";
import {
  fetchBrandPartnerships,
  fetchPartnershipCreators,
  type BrandPartnershipDeal,
  type PartnershipCreator,
} from "@/lib/brandPartnershipApi";

type UseChatBusinessToolsOptions = {
  visible: boolean;
  isSeller: boolean;
  currentUserId: string;
  sellerMaisonId: string;
  conversations: any[];
  dmSearch: string;
  products: any[];
  activeBusinessTool: string | null;
  fetchProducts: () => void;
};

export function useChatBusinessTools({
  visible,
  isSeller,
  currentUserId,
  sellerMaisonId,
  conversations,
  dmSearch,
  products,
  activeBusinessTool,
  fetchProducts,
}: UseChatBusinessToolsOptions) {
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [livePromos, setLivePromos] = useState<any[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [showNewPromoForm, setShowNewPromoForm] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("");
  const [liveAds, setLiveAds] = useState<any[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [broadcastRecipientCount, setBroadcastRecipientCount] = useState<number | null>(null);

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState(
    "Thanks for reaching out! We'll respond shortly."
  );
  const [awayMessage, setAwayMessage] = useState(
    "We're currently away. We'll get back to you within 24 hours."
  );
  const [quietHoursStart, setQuietHoursStart] = useState("");
  const [quietHoursEnd, setQuietHoursEnd] = useState("");
  const [loadingAutoReply, setLoadingAutoReply] = useState(false);
  const [autoReplySaved, setAutoReplySaved] = useState(false);

  const [partnershipDeals, setPartnershipDeals] = useState<BrandPartnershipDeal[]>([]);
  const [partnershipCreators, setPartnershipCreators] = useState<PartnershipCreator[]>([]);
  const [loadingPartnerships, setLoadingPartnerships] = useState(false);
  const [partnershipTab, setPartnershipTab] = useState<"list" | "propose">("list");
  const [selectedCreatorProfileId, setSelectedCreatorProfileId] = useState("");
  const [partnershipTitle, setPartnershipTitle] = useState("");
  const [partnershipBudget, setPartnershipBudget] = useState("");
  const [partnershipTerms, setPartnershipTerms] = useState("");
  const [partnershipType, setPartnershipType] = useState("SPONSORED_REEL");
  const [submittingPartnership, setSubmittingPartnership] = useState(false);

  const [liveBusinessStats, setLiveBusinessStats] = useState(() =>
    businessStatsToCards(EMPTY_BUSINESS_STATS)
  );

  const maisonProducts = useMemo(
    () =>
      (products || []).filter(
        (p: any) =>
          p.maison?.id === sellerMaisonId ||
          p.maisonId === sellerMaisonId ||
          p.managedStoreId === sellerMaisonId
      ),
    [products, sellerMaisonId]
  );

  const customerEnquiries = useMemo(() => {
    const list = conversations.filter(
      (c) =>
        (c.type === "MAISON" || !!c.maisonId || !!c.userId) &&
        (!sellerMaisonId || !c.maisonId || c.maisonId === sellerMaisonId)
    );
    const q = dmSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.username || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q)
    );
  }, [conversations, dmSearch, sellerMaisonId]);

  const storeCustomerMessagesEnabled =
    getEnforcedSettings()?.store?.customerMessagesEnabled !== false;
  const brandPartnershipsEnabled =
    getEnforcedSettings()?.store?.allowBrandPartnerships !== false;

  const fetchBusinessStats = useCallback(async () => {
    if (!sellerMaisonId || !currentUserId) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchBusinessStatsApi(sellerMaisonId, currentUserId);
      if (data.success && data.stats) {
        setLiveBusinessStats(businessStatsToCards(data.stats));
      } else {
        setLiveBusinessStats(businessStatsToCards(EMPTY_BUSINESS_STATS));
        setStatsError(data.error || "Could not load store stats.");
      }
    } catch {
      setLiveBusinessStats(businessStatsToCards(EMPTY_BUSINESS_STATS));
      setStatsError("Store stats unavailable offline.");
    } finally {
      setStatsLoading(false);
    }
  }, [currentUserId, sellerMaisonId]);

  const fetchPromotions = useCallback(async () => {
    if (!sellerMaisonId || !currentUserId) return;
    setLoadingPromos(true);
    try {
      const data = await fetchPromotionsApi(sellerMaisonId, currentUserId);
      if (data.success && Array.isArray(data.promos)) {
        setLivePromos(data.promos);
      } else {
        setLivePromos([]);
      }
    } catch {
      setLivePromos([]);
    } finally {
      setLoadingPromos(false);
    }
  }, [currentUserId, sellerMaisonId]);

  const fetchBroadcasts = useCallback(async () => {
    if (!sellerMaisonId || !currentUserId) return;
    try {
      const data = await fetchBroadcastsApi(sellerMaisonId, currentUserId);
      if (data.success) setLiveBroadcasts(data.broadcasts || []);
    } catch {
      setLiveBroadcasts([]);
    }
  }, [currentUserId, sellerMaisonId]);

  const fetchAds = useCallback(async () => {
    if (!sellerMaisonId || !currentUserId) return;
    try {
      const data = await fetchAdsMetricsApi(sellerMaisonId, currentUserId);
      if (data.success && data.metrics?.bids?.length > 0) {
        setLiveAds(
          data.metrics.bids.map((b: any) => ({
            name: b.keyword || b.name || "Campaign",
            spend: formatBusinessRevenue(Math.round(b.spent || 0)),
            reach:
              b.impressions >= 1000
                ? `${(b.impressions / 1000).toFixed(1)}K`
                : String(b.impressions || 0),
            clicks:
              b.clicks >= 1000 ? `${(b.clicks / 1000).toFixed(1)}K` : String(b.clicks || 0),
            status: b.status === "ACTIVE" ? "Live" : "Paused",
          }))
        );
      } else {
        setLiveAds([]);
      }
    } catch {
      setLiveAds([]);
    }
  }, [currentUserId, sellerMaisonId]);

  const sendBroadcast = async (title: string, content: string) => {
    if (!currentUserId) return { success: false, error: "Sign in required" };
    try {
      const data = await sendBroadcastApi(currentUserId, {
        maisonId: sellerMaisonId,
        title,
        content,
        audience: "ALL",
        type: "TEXT",
      });
      if (data.success) {
        setBroadcastRecipientCount(data.recipientCount ?? null);
      }
      return data;
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const createPromo = async (code: string, discount: number, type: string) => {
    if (!currentUserId) return false;
    try {
      const data = await createPromotionApi(currentUserId, {
        maisonId: sellerMaisonId,
        code,
        discount,
        type,
      });
      if (data.success) {
        fetchPromotions();
        return true;
      }
      Alert.alert("Promo failed", data.error || "Could not create promotion.");
      return false;
    } catch {
      return false;
    }
  };

  const fetchAutoReply = useCallback(async () => {
    if (!sellerMaisonId || !currentUserId) return;
    setLoadingAutoReply(true);
    try {
      const data = await fetchAutoReplyApi(sellerMaisonId, currentUserId);
      if (data.success && data.config) {
        setAutoReplyEnabled(data.config.enabled);
        setGreetingMessage(data.config.greetingMessage);
        setAwayMessage(data.config.awayMessage);
        if (data.config.quietHoursStart != null) {
          setQuietHoursStart(String(data.config.quietHoursStart));
        }
        if (data.config.quietHoursEnd != null) {
          setQuietHoursEnd(String(data.config.quietHoursEnd));
        }
      }
    } catch {
      /* keep last saved values */
    } finally {
      setLoadingAutoReply(false);
    }
  }, [currentUserId, sellerMaisonId]);

  const saveAutoReply = async () => {
    if (!currentUserId) return false;
    try {
      const data = await saveAutoReplyApi(currentUserId, {
        maisonId: sellerMaisonId,
        enabled: autoReplyEnabled,
        greetingMessage,
        awayMessage,
        quietHoursStart: quietHoursStart ? parseInt(quietHoursStart, 10) : null,
        quietHoursEnd: quietHoursEnd ? parseInt(quietHoursEnd, 10) : null,
      });
      return data.success === true;
    } catch {
      return false;
    }
  };

  const loadPartnershipData = useCallback(async () => {
    if (!currentUserId || !sellerMaisonId) return;
    setLoadingPartnerships(true);
    try {
      const [deals, creators] = await Promise.all([
        fetchBrandPartnerships({ userId: currentUserId, maisonId: sellerMaisonId }),
        fetchPartnershipCreators(currentUserId),
      ]);
      setPartnershipDeals(deals);
      setPartnershipCreators(creators);
    } catch {
      setPartnershipDeals([]);
      setPartnershipCreators([]);
    } finally {
      setLoadingPartnerships(false);
    }
  }, [currentUserId, sellerMaisonId]);

  useEffect(() => {
    if (activeBusinessTool === "partnerships" && isSeller) {
      loadPartnershipData();
    }
  }, [activeBusinessTool, isSeller, loadPartnershipData]);

  useEffect(() => {
    if (!visible || !isSeller) return;
    fetchBusinessStats();
    fetchPromotions();
    fetchAds();
    fetchBroadcasts();
    fetchAutoReply();
    fetchProducts();
  }, [
    visible,
    isSeller,
    sellerMaisonId,
    currentUserId,
    fetchBusinessStats,
    fetchPromotions,
    fetchAds,
    fetchBroadcasts,
    fetchAutoReply,
    fetchProducts,
  ]);

  return {
    broadcastText,
    setBroadcastText,
    broadcastSent,
    setBroadcastSent,
    livePromos,
    loadingPromos,
    showNewPromoForm,
    setShowNewPromoForm,
    newPromoCode,
    setNewPromoCode,
    newPromoDiscount,
    setNewPromoDiscount,
    liveAds,
    liveBroadcasts,
    statsLoading,
    statsError,
    broadcastRecipientCount,
    setBroadcastRecipientCount,
    autoReplyEnabled,
    setAutoReplyEnabled,
    greetingMessage,
    setGreetingMessage,
    awayMessage,
    setAwayMessage,
    quietHoursStart,
    setQuietHoursStart,
    quietHoursEnd,
    setQuietHoursEnd,
    loadingAutoReply,
    autoReplySaved,
    setAutoReplySaved,
    partnershipDeals,
    partnershipCreators,
    loadingPartnerships,
    partnershipTab,
    setPartnershipTab,
    selectedCreatorProfileId,
    setSelectedCreatorProfileId,
    partnershipTitle,
    setPartnershipTitle,
    partnershipBudget,
    setPartnershipBudget,
    partnershipTerms,
    setPartnershipTerms,
    partnershipType,
    setPartnershipType,
    submittingPartnership,
    setSubmittingPartnership,
    liveBusinessStats,
    maisonProducts,
    customerEnquiries,
    storeCustomerMessagesEnabled,
    brandPartnershipsEnabled,
    fetchBusinessStats,
    fetchPromotions,
    fetchBroadcasts,
    fetchAds,
    sendBroadcast,
    createPromo,
    fetchAutoReply,
    saveAutoReply,
    loadPartnershipData,
  };
}
