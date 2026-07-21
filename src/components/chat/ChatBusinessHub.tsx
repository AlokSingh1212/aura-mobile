import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";
import { ChatThreadAvatar } from "@/components/chat/ChatThreadAvatar";
import { BUSINESS_TOOLS } from "@/components/chat/businessToolsConstants";
import { collabInvitePreviewText } from "@/lib/collabMessage";
import { productCollabPreviewText } from "@/lib/productCollabMessage";
import { brandPartnershipPreviewText } from "@/lib/brandPartnershipMessage";
import {
  partnershipTypeLabel,
  proposeBrandPartnershipApi,
  respondBrandPartnershipWithConfirmation,
} from "@/lib/brandPartnershipApi";
import type { ManagedStore } from "@/lib/managedStores";

export type ChatBusinessHubProps = {
  managedStores: ManagedStore[];
  showStorePicker: boolean;
  setShowStorePicker: React.Dispatch<React.SetStateAction<boolean>>;
  activeBusinessStore: ManagedStore | null;
  sellerMaisonId: string;
  statsLoading: boolean;
  liveBusinessStats: { label: string; icon: string; color: string; value: string }[];
  statsError: string | null;
  activeBusinessTool: string | null;
  setActiveBusinessTool: (tool: string | null) => void;
  setBroadcastSent: (sent: boolean) => void;
  customerEnquiries: any[];
  storeCustomerMessagesEnabled: boolean;
  triggerHaptic: (style: any) => void;
  setActiveChat: (thread: any) => void;
  activeInstaStories: any[];
  onOpenStoryGroup?: (story: any) => void;
  broadcastFollowerReach: number;
  broadcastText: string;
  setBroadcastText: (t: string) => void;
  broadcastSent: boolean;
  broadcastRecipientCount: number | null;
  sendBroadcast: (subject: string, body: string) => Promise<{ success: boolean; error?: string }>;
  fetchBroadcasts: () => void;
  loadingPromos: boolean;
  livePromos: any[];
  showNewPromoForm: boolean;
  setShowNewPromoForm: (v: boolean) => void;
  newPromoCode: string;
  setNewPromoCode: (v: string) => void;
  newPromoDiscount: string;
  setNewPromoDiscount: (v: string) => void;
  createPromo: (code: string, discount: number, type: string) => Promise<boolean>;
  liveAds: any[];
  onClose: () => void;
  maisonProducts: any[];
  loadingAutoReply: boolean;
  autoReplyEnabled: boolean;
  setAutoReplyEnabled: (v: boolean) => void;
  autoReplySaved: boolean;
  setAutoReplySaved: (v: boolean) => void;
  greetingMessage: string;
  setGreetingMessage: (v: string) => void;
  awayMessage: string;
  setAwayMessage: (v: string) => void;
  quietHoursStart: string;
  setQuietHoursStart: (v: string) => void;
  quietHoursEnd: string;
  setQuietHoursEnd: (v: string) => void;
  saveAutoReply: () => Promise<boolean>;
  brandPartnershipsEnabled: boolean;
  partnershipTab: "list" | "propose";
  setPartnershipTab: (tab: "list" | "propose") => void;
  loadingPartnerships: boolean;
  partnershipDeals: any[];
  partnershipCreators: any[];
  selectedCreatorProfileId: string;
  setSelectedCreatorProfileId: (id: string) => void;
  partnershipTitle: string;
  setPartnershipTitle: (v: string) => void;
  partnershipBudget: string;
  setPartnershipBudget: (v: string) => void;
  partnershipType: string;
  setPartnershipType: (t: string) => void;
  partnershipTerms: string;
  setPartnershipTerms: (v: string) => void;
  submittingPartnership: boolean;
  setSubmittingPartnership: (v: boolean) => void;
  currentUserId?: string;
  activeProfile: any;
  loadPartnershipData: () => void;
  handleSelectBusinessStore: (store: ManagedStore) => void;
};

function StoreContextPill({
  accent,
  activeBusinessStore,
  managedStores,
  triggerHaptic,
  setShowStorePicker,
}: {
  accent: string;
  activeBusinessStore: ManagedStore | null;
  managedStores: ManagedStore[];
  triggerHaptic: (style: any) => void;
  setShowStorePicker: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  if (!activeBusinessStore) return null;
  return (
    <TouchableOpacity
      style={[styles.bizStoreContextPill, { borderColor: accent + "44" }]}
      onPress={() => {
        if (managedStores.length > 1) {
          triggerHaptic("light");
          setShowStorePicker(true);
        }
      }}
      activeOpacity={managedStores.length > 1 ? 0.75 : 1}
    >
      {activeBusinessStore.logo ? (
        <Image source={{ uri: activeBusinessStore.logo }} style={styles.bizStoreContextAvatar} />
      ) : (
        <View style={[styles.bizStoreContextAvatar, styles.bizStoreContextAvatarPh]}>
          <Text style={styles.bizStoreContextInitial}>{activeBusinessStore.name[0]?.toUpperCase() || "S"}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.bizStoreContextLabel, { color: accent }]}>Acting as store</Text>
        <Text style={styles.bizStoreContextName} numberOfLines={1}>{activeBusinessStore.name}</Text>
        <Text style={styles.bizStoreContextHandle} numberOfLines={1}>@{activeBusinessStore.username}</Text>
      </View>
      {managedStores.length > 1 ? <Lucide name="chevron-down" size={18} color={accent} /> : null}
    </TouchableOpacity>
  );
}

export function ChatBusinessHub(props: ChatBusinessHubProps) {
  const router = useRouter();
  const {
    managedStores,
    showStorePicker,
    setShowStorePicker,
    activeBusinessStore,
    sellerMaisonId,
    statsLoading,
    liveBusinessStats,
    statsError,
    activeBusinessTool,
    setActiveBusinessTool,
    setBroadcastSent,
    customerEnquiries,
    storeCustomerMessagesEnabled,
    triggerHaptic,
    setActiveChat,
    activeInstaStories,
    onOpenStoryGroup,
    broadcastFollowerReach,
    broadcastText,
    setBroadcastText,
    broadcastSent,
    broadcastRecipientCount,
    sendBroadcast,
    fetchBroadcasts,
    loadingPromos,
    livePromos,
    showNewPromoForm,
    setShowNewPromoForm,
    newPromoCode,
    setNewPromoCode,
    newPromoDiscount,
    setNewPromoDiscount,
    createPromo,
    liveAds,
    onClose,
    maisonProducts,
    loadingAutoReply,
    autoReplyEnabled,
    setAutoReplyEnabled,
    autoReplySaved,
    setAutoReplySaved,
    greetingMessage,
    setGreetingMessage,
    awayMessage,
    setAwayMessage,
    quietHoursStart,
    setQuietHoursStart,
    quietHoursEnd,
    setQuietHoursEnd,
    saveAutoReply,
    brandPartnershipsEnabled,
    partnershipTab,
    setPartnershipTab,
    loadingPartnerships,
    partnershipDeals,
    partnershipCreators,
    selectedCreatorProfileId,
    setSelectedCreatorProfileId,
    partnershipTitle,
    setPartnershipTitle,
    partnershipBudget,
    setPartnershipBudget,
    partnershipType,
    setPartnershipType,
    partnershipTerms,
    setPartnershipTerms,
    submittingPartnership,
    setSubmittingPartnership,
    currentUserId,
    activeProfile,
    loadPartnershipData,
    handleSelectBusinessStore,
  } = props;

  const renderStoreContextPill = (accent = "#00f5ff") => (
    <StoreContextPill
      accent={accent}
      activeBusinessStore={activeBusinessStore}
      managedStores={managedStores}
      triggerHaptic={triggerHaptic}
      setShowStorePicker={setShowStorePicker}
    />
  );

  const renderThreadAvatar = (thread: any) => (
    <ChatThreadAvatar
      thread={thread}
      activeInstaStories={activeInstaStories}
      onOpenStoryGroup={onOpenStoryGroup}
      triggerHaptic={triggerHaptic}
    />
  );

  return (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

              {/* ── Active store selector ── */}
              {managedStores.length === 0 ? (
                <View style={styles.bizStoreEmptyCard}>
                  <Lucide name="storefront-outline" size={28} color="#fb923c" />
                  <Text style={styles.bizStoreEmptyTitle}>No stores linked</Text>
                  <Text style={styles.bizStoreEmptyBody}>
                    Create a brand profile from Account to manage business tools for a store.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.bizStoreBar}>
                    <Text style={styles.bizStoreBarLabel}>Managing store</Text>
                    <TouchableOpacity
                      style={styles.bizStoreBarMain}
                      onPress={() => {
                        if (managedStores.length > 1) {
                          triggerHaptic("light");
                          setShowStorePicker((v) => !v);
                        }
                      }}
                      activeOpacity={managedStores.length > 1 ? 0.8 : 1}
                    >
                      {activeBusinessStore?.logo ? (
                        <Image source={{ uri: activeBusinessStore.logo }} style={styles.bizStoreBarAvatar} />
                      ) : (
                        <View style={[styles.bizStoreBarAvatar, styles.bizStoreContextAvatarPh]}>
                          <Text style={styles.bizStoreContextInitial}>
                            {activeBusinessStore?.name?.[0]?.toUpperCase() || "S"}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bizStoreBarName} numberOfLines={1}>
                          {activeBusinessStore?.name || "Store"}
                        </Text>
                        <Text style={styles.bizStoreBarHandle} numberOfLines={1}>
                          @{activeBusinessStore?.username} · stats, promos & inbox scoped here
                        </Text>
                      </View>
                      {managedStores.length > 1 ? (
                        <Lucide name={showStorePicker ? "chevron-up" : "chevron-down"} size={20} color="#00f5ff" />
                      ) : null}
                    </TouchableOpacity>
                  </View>

                  {showStorePicker && managedStores.length > 1 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.bizStorePickerRow}
                    >
                      {managedStores.map((store) => {
                        const selected = store.maisonId === sellerMaisonId;
                        return (
                          <TouchableOpacity
                            key={store.maisonId}
                            style={[styles.bizStoreChip, selected && styles.bizStoreChipActive]}
                            onPress={() => handleSelectBusinessStore(store)}
                          >
                            {store.logo ? (
                              <Image source={{ uri: store.logo }} style={styles.bizStoreChipAvatar} />
                            ) : (
                              <View style={[styles.bizStoreChipAvatar, styles.bizStoreContextAvatarPh]}>
                                <Text style={styles.bizStoreContextInitial}>{store.name[0]?.toUpperCase()}</Text>
                              </View>
                            )}
                            <Text style={[styles.bizStoreChipText, selected && styles.bizStoreChipTextActive]} numberOfLines={1}>
                              {store.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : null}
                </>
              )}

              {/* ── Quick Stats Bar ── */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}
              >
                {statsLoading ? (
                  <ActivityIndicator color="#00f5ff" style={{ marginHorizontal: 24 }} />
                ) : (
                  liveBusinessStats.map((stat) => (
                    <View key={stat.label} style={styles.bizStatCard}>
                      <Lucide name={stat.icon as any} size={23} color={stat.color} />
                      <Text style={[styles.bizStatValue, { color: stat.color }]}>{stat.value}</Text>
                      <Text style={styles.bizStatLabel}>{stat.label}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
              {statsError ? (
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, paddingHorizontal: 16, marginBottom: 8 }}>
                  {statsError}
                </Text>
              ) : null}

              {/* ── Business Tools Grid ── */}
              {!activeBusinessTool && (
                <>
                  <Text style={styles.bizSectionLabel}>Business Tools</Text>
                  <View style={styles.bizToolsGrid}>
                    {BUSINESS_TOOLS.map((tool) => (
                      <TouchableOpacity
                        key={tool.id}
                        style={styles.bizToolCard}
                        onPress={() => { triggerHaptic("medium"); setActiveBusinessTool(tool.id); setBroadcastSent(false); }}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.bizToolIconWrap, { backgroundColor: tool.color + "22" }]}>
                          <Lucide name={tool.icon as any} size={26} color={tool.color} />
                        </View>
                        <Text style={styles.bizToolName}>{tool.label}</Text>
                        <Text style={styles.bizToolDesc}>{tool.desc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ── Customer Enquiries ── */}
                  <Text style={styles.bizSectionLabel}>Customer Enquiries</Text>
                  {!storeCustomerMessagesEnabled ? (
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginHorizontal: 16, marginBottom: 12 }}>
                      Customer messages are disabled in Store settings.
                    </Text>
                  ) : null}
                  {customerEnquiries.length === 0 ? (
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginHorizontal: 16, marginBottom: 16 }}>
                      No customer enquiries yet.
                    </Text>
                  ) : (
                  customerEnquiries.map((thread) => (
                    <View style={[styles.threadItemRow, { marginHorizontal: 16 }]} key={thread.id}>
                      {renderThreadAvatar(thread)}
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                      >
                        <View style={styles.threadDetails}>
                          <View style={styles.threadNameRow}>
                            <Text style={styles.threadNameText}>{thread.name}</Text>
                            <View style={[styles.bizTagBadge, { backgroundColor: thread.unread ? "#00f5ff22" : "#ffffff11" }]}>
                              <Text style={[styles.bizTagText, { color: thread.unread ? "#00f5ff" : "rgba(255,255,255,0.4)" }]}>Enquiry</Text>
                            </View>
                          </View>
                          <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                            {brandPartnershipPreviewText(thread.lastMessage || "") ||
                              productCollabPreviewText(thread.lastMessage || "") ||
                              collabInvitePreviewText(thread.lastMessage || "") ||
                              thread.lastMessage ||
                              "Secure direct message sync handshake established."}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {thread.unread && <View style={styles.bizUnreadDot} />}
                    </View>
                  ))
                  )}
                  <View style={{ height: 32 }} />
                </>
              )}

              {/* ── Sub-panels ── */}

              {/* BROADCAST */}
              {activeBusinessTool === "broadcast" && (
                <View style={styles.bizSubPanel}>
                  <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                    <Lucide name="chevron-back" size={23} color="#00f5ff" />
                    <Text style={styles.bizSubBackText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.bizSubTitle}>📣 Broadcast Message</Text>
                  {renderStoreContextPill("#00f5ff")}
                  <Text style={styles.bizSubSubtitle}>Send to followers of this store</Text>
                  <View style={styles.bizAudiencePill}>
                    <Lucide name="people" size={17} color="#00f5ff" />
                    <Text style={{ color: "#00f5ff", fontSize: 14.5, marginLeft: 6 }}>
                      {broadcastFollowerReach.toLocaleString("en-IN")} followers will receive this
                    </Text>
                  </View>
                  <TextInput
                    style={styles.bizBroadcastInput}
                    placeholder="Write your message..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={broadcastText}
                    onChangeText={setBroadcastText}
                    multiline
                    numberOfLines={5}
                  />
                  {broadcastSent ? (
                    <View style={styles.bizSuccessBanner}>
                      <Lucide name="checkmark-circle" size={23} color="#34d399" />
                      <Text style={{ color: "#34d399", marginLeft: 8, fontWeight: "600" }}>
                        {broadcastRecipientCount != null
                          ? `Broadcast sent to ${broadcastRecipientCount} followers.`
                          : "Broadcast saved and queued."}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.bizSendBtn, !broadcastText && { opacity: 0.4 }]}
                      disabled={!broadcastText}
                      onPress={async () => {
                        triggerHaptic("heavy");
                        const result = await sendBroadcast(broadcastText.trim(), broadcastText.trim());
                        if (result.success) {
                          setBroadcastSent(true);
                          setBroadcastText("");
                          fetchBroadcasts();
                        } else {
                          Alert.alert("Broadcast failed", result.error || "Could not send broadcast.");
                        }
                      }}
                    >
                      <Lucide name="megaphone" size={19} color="#000" />
                      <Text style={styles.bizSendBtnText}>Send Broadcast</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* PROMOTIONS */}
              {activeBusinessTool === "promotions" && (
                <View style={styles.bizSubPanel}>
                  <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                    <Lucide name="chevron-back" size={23} color="#fb923c" />
                    <Text style={[styles.bizSubBackText, { color: "#fb923c" }]}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.bizSubTitle}>🏷️ Promotions</Text>
                  {renderStoreContextPill("#fb923c")}
                  <Text style={styles.bizSubSubtitle}>Discount codes for this store · checkout sync</Text>
                  {loadingPromos ? (
                    <ActivityIndicator size="small" color="#fb923c" style={{ marginTop: 16 }} />
                  ) : livePromos.length === 0 ? (
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 12, marginBottom: 8 }}>
                      No active promo codes. Create one below — it syncs to checkout.
                    </Text>
                  ) : (
                    livePromos.map((promo: any) => (
                      <View key={promo.code} style={styles.bizPromoCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#fb923c", fontWeight: "bold", fontSize: 17.5, letterSpacing: 1 }}>{promo.code}</Text>
                          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14.5, marginTop: 2 }}>
                            {promo.type === "PERCENTAGE" ? `${promo.discount}% off` : `₹${promo.discount} off`}
                          </Text>
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13.5, marginTop: 2 }}>
                            Used {promo.uses || 0}× {promo.expiresAt ? `· Expires ${new Date(promo.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                          </Text>
                        </View>
                        <View style={[styles.bizTagBadge, { backgroundColor: "#fb923c22" }]}>
                          <Text style={{ color: "#fb923c", fontSize: 13.5 }}>{promo.status || "Active"}</Text>
                        </View>
                      </View>
                    ))
                  )}
                  {showNewPromoForm ? (
                    <View style={{ marginBottom: 12 }}>
                      <TextInput
                        style={[styles.bizBroadcastInput, { borderColor: "#fb923c44", minHeight: 46 }]}
                        placeholder="Promo code (e.g. SALE25)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={newPromoCode}
                        onChangeText={setNewPromoCode}
                        autoCapitalize="characters"
                      />
                      <TextInput
                        style={[styles.bizBroadcastInput, { borderColor: "#fb923c44", minHeight: 46 }]}
                        placeholder="Discount % (e.g. 25)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={newPromoDiscount}
                        onChangeText={setNewPromoDiscount}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={[styles.bizSendBtn, { backgroundColor: "#fb923c" }, (!newPromoCode || !newPromoDiscount) && { opacity: 0.4 }]}
                        disabled={!newPromoCode || !newPromoDiscount}
                        onPress={async () => {
                          triggerHaptic("heavy");
                          const ok = await createPromo(newPromoCode, parseFloat(newPromoDiscount), "PERCENTAGE");
                          if (ok) { setNewPromoCode(""); setNewPromoDiscount(""); setShowNewPromoForm(false); }
                        }}
                      >
                        <Lucide name="checkmark" size={19} color="#000" />
                        <Text style={styles.bizSendBtnText}>Save Promo</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={[styles.bizSendBtn, { backgroundColor: "#fb923c" }]} onPress={() => setShowNewPromoForm(true)}>
                      <Lucide name="add" size={19} color="#000" />
                      <Text style={styles.bizSendBtnText}>Create New Promo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ADS MANAGER */}
              {activeBusinessTool === "ads" && (
                <View style={styles.bizSubPanel}>
                  <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                    <Lucide name="chevron-back" size={23} color="#a78bfa" />
                    <Text style={[styles.bizSubBackText, { color: "#a78bfa" }]}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.bizSubTitle}>📊 Ads Manager</Text>
                  {renderStoreContextPill("#a78bfa")}
                  <Text style={styles.bizSubSubtitle}>Campaigns for {activeBusinessStore?.name || "this store"}</Text>
                  {liveAds.length === 0 ? (
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginVertical: 12 }}>
                      No ad campaigns yet. Launch one in Business Suite.
                    </Text>
                  ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
                    {liveAds.map((ad: any) => (
                      <View key={ad.name} style={styles.bizAdCard}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16.5 }}>{ad.name}</Text>
                          <View style={[styles.bizTagBadge, { backgroundColor: ad.status === "Live" ? "#34d39922" : "#ffffff11" }]}>
                            <Text style={{ color: ad.status === "Live" ? "#34d399" : "rgba(255,255,255,0.4)", fontSize: 13.5 }}>{ad.status}</Text>
                          </View>
                        </View>
                        {[
                          { k: "Spend", v: ad.spend },
                          { k: "Reach", v: ad.reach },
                          { k: "Clicks", v: ad.clicks },
                        ].map((row) => (
                          <View key={row.k} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14.5 }}>{row.k}</Text>
                            <Text style={{ color: "#a78bfa", fontSize: 14.5, fontWeight: "600" }}>{row.v}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                  )}
                  <TouchableOpacity
                    style={[styles.bizSendBtn, { backgroundColor: "#a78bfa" }]}
                    onPress={() => {
                      triggerHaptic("medium");
                      onClose();
                      router.push({
                        pathname: "/maison/business-suite",
                        params: { maisonId: sellerMaisonId },
                      } as any);
                    }}
                  >
                    <Lucide name="add" size={19} color="#000" />
                    <Text style={styles.bizSendBtnText}>Create New Ad</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* CATALOGUE */}
              {activeBusinessTool === "catalogue" && (
                <View style={styles.bizSubPanel}>
                  <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                    <Lucide name="chevron-back" size={23} color="#34d399" />
                    <Text style={[styles.bizSubBackText, { color: "#34d399" }]}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.bizSubTitle}>🗂️ Catalogue</Text>
                  {renderStoreContextPill("#34d399")}
                  <Text style={styles.bizSubSubtitle}>Listings for {activeBusinessStore?.name || "this store"}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                    {maisonProducts.slice(0, 12).map((p: any) => (
                      <View key={p.id} style={styles.bizCatalogueItem}>
                        <Image source={{ uri: p.images?.[0] || p.thumbnail }} style={styles.bizCatalogueImg} />
                        <Text style={styles.bizCatalogueName} numberOfLines={1}>{p.name || p.title}</Text>
                        <Text style={styles.bizCataloguePrice}>₹{p.price?.toLocaleString()}</Text>
                      </View>
                    ))}
                    {maisonProducts.length === 0 && (
                      <View style={{ alignItems: "center", paddingVertical: 32, width: "100%" }}>
                        <Lucide name="grid-outline" size={40} color="rgba(255,255,255,0.2)" />
                        <Text style={{ color: "rgba(255,255,255,0.3)", marginTop: 12, fontSize: 15.5, textAlign: "center" }}>
                          No products linked to this store yet.
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.bizSendBtn, { backgroundColor: "#34d399", marginTop: 12 }]}
                    onPress={() => {
                      triggerHaptic("medium");
                      onClose();
                      router.push({
                        pathname: "/settings/store",
                        params: { maisonId: sellerMaisonId },
                      } as any);
                    }}
                  >
                    <Lucide name="settings-outline" size={19} color="#000" />
                    <Text style={styles.bizSendBtnText}>Manage store & inventory</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* AUTO-REPLY */}
              {activeBusinessTool === "autoreply" && (
                <View style={styles.bizSubPanel}>
                  <TouchableOpacity style={styles.bizSubBack} onPress={() => { setActiveBusinessTool(null); setAutoReplySaved(false); }}>
                    <Lucide name="chevron-back" size={23} color="#f472b6" />
                    <Text style={[styles.bizSubBackText, { color: "#f472b6" }]}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.bizSubTitle}>⚡ Auto-Reply</Text>
                  {renderStoreContextPill("#f472b6")}
                  <Text style={styles.bizSubSubtitle}>Automated replies for {activeBusinessStore?.name || "this store"}</Text>

                  {loadingAutoReply ? (
                    <ActivityIndicator size="small" color="#f472b6" style={{ marginTop: 24 }} />
                  ) : (
                    <>
                      {/* Enable toggle */}
                      <TouchableOpacity
                        style={styles.bizAutoReplyToggleRow}
                        onPress={() => { triggerHaptic("light"); setAutoReplyEnabled(!autoReplyEnabled); setAutoReplySaved(false); }}
                        activeOpacity={0.8}
                      >
                        <View>
                          <Text style={{ color: "#fff", fontSize: 16.5, fontWeight: "600" }}>Auto-Reply Enabled</Text>
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13.5, marginTop: 2 }}>
                            {autoReplyEnabled ? "Replies sent automatically" : "Currently disabled"}
                          </Text>
                        </View>
                        <View style={[styles.bizToggle, { backgroundColor: autoReplyEnabled ? "#f472b633" : "rgba(255,255,255,0.1)" }]}>
                          <View style={[
                            styles.bizToggleThumb,
                            { backgroundColor: autoReplyEnabled ? "#f472b6" : "rgba(255,255,255,0.3)", marginLeft: autoReplyEnabled ? "auto" : 0 }
                          ]} />
                        </View>
                      </TouchableOpacity>

                      {/* Greeting message */}
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6, marginTop: 4 }}>GREETING MESSAGE</Text>
                      <TextInput
                        style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 80 }]}
                        value={greetingMessage}
                        onChangeText={(t) => { setGreetingMessage(t); setAutoReplySaved(false); }}
                        multiline
                        placeholder="Sent when someone first messages you"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                      />

                      {/* Away message */}
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 }}>AWAY MESSAGE</Text>
                      <TextInput
                        style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 80 }]}
                        value={awayMessage}
                        onChangeText={(t) => { setAwayMessage(t); setAutoReplySaved(false); }}
                        multiline
                        placeholder="Sent during quiet hours or when away"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                      />

                      {/* Quiet hours */}
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 }}>QUIET HOURS (24h format)</Text>
                      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 4 }}>From (hour)</Text>
                          <TextInput
                            style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 46, paddingVertical: 0 }]}
                            value={quietHoursStart}
                            onChangeText={(t) => { setQuietHoursStart(t); setAutoReplySaved(false); }}
                            keyboardType="numeric"
                            placeholder="e.g. 22"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            maxLength={2}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 4 }}>To (hour)</Text>
                          <TextInput
                            style={[styles.bizBroadcastInput, { borderColor: "#f472b633", minHeight: 46, paddingVertical: 0 }]}
                            value={quietHoursEnd}
                            onChangeText={(t) => { setQuietHoursEnd(t); setAutoReplySaved(false); }}
                            keyboardType="numeric"
                            placeholder="e.g. 8"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            maxLength={2}
                          />
                        </View>
                      </View>

                      {autoReplySaved ? (
                        <View style={styles.bizSuccessBanner}>
                          <Lucide name="checkmark-circle" size={23} color="#34d399" />
                          <Text style={{ color: "#34d399", marginLeft: 8, fontWeight: "600" }}>Auto-Reply saved & synced!</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.bizSendBtn, { backgroundColor: "#f472b6" }]}
                          onPress={async () => {
                            triggerHaptic("heavy");
                            const ok = await saveAutoReply();
                            setAutoReplySaved(ok);
                          }}
                        >
                          <Lucide name="save-outline" size={19} color="#000" />
                          <Text style={styles.bizSendBtnText}>Save & Sync Auto-Reply</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* PARTNERSHIPS */}
              {activeBusinessTool === "partnerships" && (
                <View style={styles.bizSubPanel}>
                  <TouchableOpacity style={styles.bizSubBack} onPress={() => { setActiveBusinessTool(null); setPartnershipTab("list"); }}>
                    <Lucide name="chevron-back" size={23} color="#818cf8" />
                    <Text style={[styles.bizSubBackText, { color: "#818cf8" }]}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.bizSubTitle}>🤝 Brand partnerships</Text>
                  {renderStoreContextPill("#818cf8")}
                  <Text style={styles.bizSubSubtitle}>Official creator contracts · budget held in escrow</Text>

                  {!brandPartnershipsEnabled ? (
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 12 }}>
                      Partnership offers are off. Enable in Settings → Store → Brand partnerships.
                    </Text>
                  ) : null}

                  <View style={styles.bizToggleGroup}>
                    {(["list", "propose"] as const).map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[styles.bizToggleBtn, partnershipTab === tab && styles.bizToggleBtnActive]}
                        onPress={() => { triggerHaptic("light"); setPartnershipTab(tab); }}
                      >
                        <Text style={[styles.bizToggleText, partnershipTab === tab && styles.bizToggleTextActive]}>
                          {tab === "list" ? "Active deals" : "New offer"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {loadingPartnerships ? (
                    <ActivityIndicator color="#818cf8" style={{ marginVertical: 24 }} />
                  ) : partnershipTab === "list" ? (
                    partnershipDeals.length === 0 ? (
                      <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 8 }}>
                        No partnership offers yet. Propose an official deal to a creator.
                      </Text>
                    ) : (
                      partnershipDeals.map((deal) => (
                        <View key={deal.id} style={styles.bizPromoCard}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                            <Text style={{ color: "#fff", fontWeight: "700", flex: 1 }}>{deal.title}</Text>
                            <Text style={{ color: "#818cf8", fontSize: 11, fontWeight: "700" }}>{deal.status}</Text>
                          </View>
                          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 4 }}>
                            ₹{Math.round(deal.budget).toLocaleString("en-IN")} · {partnershipTypeLabel(deal.type)}
                          </Text>
                          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }} numberOfLines={3}>
                            {deal.terms}
                          </Text>
                          {deal.status === "ACCEPTED" && deal.escrowStatus === "LOCKED" ? (
                            <TouchableOpacity
                              style={[styles.bizSendBtn, { marginTop: 10, backgroundColor: "#818cf8" }]}
                              onPress={async () => {
                                if (!currentUserId || !activeProfile?.id) return;
                                const result = await respondBrandPartnershipWithConfirmation({
                                  userId: currentUserId,
                                  profileId: activeProfile.id,
                                  dealId: deal.id,
                                  respondAction: "confirm",
                                });
                                if (result.success) loadPartnershipData();
                              }}
                            >
                              <Text style={styles.bizSendBtnText}>Confirm & pay creator</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ))
                    )
                  ) : !brandPartnershipsEnabled ? (
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 8 }}>
                      Turn on partnership offers in store settings to propose new deals.
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.bizFieldLabel}>Select creator</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {partnershipCreators.map((c) => (
                          <TouchableOpacity
                            key={c.profileId}
                            style={[
                              styles.bizCreatorChip,
                              selectedCreatorProfileId === c.profileId && styles.bizCreatorChipActive,
                            ]}
                            onPress={() => { triggerHaptic("light"); setSelectedCreatorProfileId(c.profileId); }}
                          >
                            <Text style={{ color: selectedCreatorProfileId === c.profileId ? "#818cf8" : "#fff", fontSize: 12, fontWeight: "600" }}>
                              @{c.username}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.bizFieldLabel}>Campaign title</Text>
                      <TextInput
                        style={styles.bizBroadcastInput}
                        placeholder="Summer collection launch"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={partnershipTitle}
                        onChangeText={setPartnershipTitle}
                      />
                      <Text style={styles.bizFieldLabel}>Budget (₹)</Text>
                      <TextInput
                        style={styles.bizBroadcastInput}
                        placeholder="25000"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardType="numeric"
                        value={partnershipBudget}
                        onChangeText={setPartnershipBudget}
                      />
                      <Text style={styles.bizFieldLabel}>Campaign type</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {["SPONSORED_REEL", "STORY_FEATURE", "AFFILIATE_SHARE", "AMBASSADOR"].map((t) => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.bizCreatorChip, partnershipType === t && styles.bizCreatorChipActive]}
                            onPress={() => setPartnershipType(t)}
                          >
                            <Text style={{ color: partnershipType === t ? "#818cf8" : "#fff", fontSize: 11 }}>
                              {partnershipTypeLabel(t)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.bizFieldLabel}>Terms & deliverables</Text>
                      <TextInput
                        style={[styles.bizBroadcastInput, { minHeight: 88, textAlignVertical: "top" }]}
                        placeholder="1 reel + 2 stories within 14 days..."
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        multiline
                        value={partnershipTerms}
                        onChangeText={setPartnershipTerms}
                      />
                      <TouchableOpacity
                        style={[styles.bizSendBtn, { backgroundColor: "#818cf8", opacity: submittingPartnership ? 0.6 : 1 }]}
                        disabled={submittingPartnership}
                        onPress={async () => {
                          if (!currentUserId || !sellerMaisonId || !selectedCreatorProfileId || !partnershipBudget || !partnershipTerms.trim()) {
                            Alert.alert("Missing info", "Select a creator, budget, and terms.");
                            return;
                          }
                          setSubmittingPartnership(true);
                          const data = await proposeBrandPartnershipApi({
                            userId: currentUserId,
                            maisonId: sellerMaisonId,
                            creatorProfileId: selectedCreatorProfileId,
                            budget: parseFloat(partnershipBudget),
                            type: partnershipType,
                            terms: partnershipTerms.trim(),
                            title: partnershipTitle.trim() || undefined,
                          });
                          setSubmittingPartnership(false);
                          if (data.success) {
                            triggerHaptic("success");
                            setPartnershipTitle("");
                            setPartnershipBudget("");
                            setPartnershipTerms("");
                            setSelectedCreatorProfileId("");
                            setPartnershipTab("list");
                            loadPartnershipData();
                            Alert.alert("Offer sent", "Creator will receive a notification and DM invite.");
                          } else {
                            const err =
                              data.error === "BRAND_PARTNERSHIPS_DISABLED"
                                ? "Enable partnerships in Settings → Store → Brand partnerships."
                                : data.error === "CREATOR_PARTNERSHIPS_DISABLED"
                                  ? "This creator is not accepting partnership offers."
                                  : data.error === "INSUFFICIENT_BRAND_BALANCE"
                                    ? "Top up your brand wallet to lock escrow."
                                    : data.error || "Try again.";
                            Alert.alert("Could not send", err);
                          }
                        }}
                      >
                        <Text style={styles.bizSendBtnText}>Send partnership offer</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* CUSTOMER INBOX */}
              {activeBusinessTool === "inbox" && (
                <View style={styles.bizSubPanel}>
                  <TouchableOpacity style={styles.bizSubBack} onPress={() => setActiveBusinessTool(null)}>
                    <Lucide name="chevron-back" size={23} color="#fbbf24" />
                    <Text style={[styles.bizSubBackText, { color: "#fbbf24" }]}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.bizSubTitle}>👥 Customer Inbox</Text>
                  {renderStoreContextPill("#fbbf24")}
                  <Text style={styles.bizSubSubtitle}>Enquiries for {activeBusinessStore?.name || "this store"}</Text>
                  {!storeCustomerMessagesEnabled ? (
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 12 }}>
                      Enable customer messages in Settings → Store.
                    </Text>
                  ) : null}
                  {customerEnquiries.length === 0 ? (
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>No enquiries in your inbox.</Text>
                  ) : (
                  customerEnquiries.map((thread) => (
                    <View style={styles.threadItemRow} key={thread.id}>
                      {renderThreadAvatar(thread)}
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                        onPress={() => { triggerHaptic("medium"); setActiveChat(thread); }}
                      >
                        <View style={styles.threadDetails}>
                          <View style={styles.threadNameRow}>
                            <Text style={styles.threadNameText}>{thread.name}</Text>
                            <View style={[styles.bizTagBadge, { backgroundColor: "#fbbf2422" }]}>
                              <Text style={{ color: "#fbbf24", fontSize: 13.5 }}>Enquiry</Text>
                            </View>
                          </View>
                          <Text style={[styles.threadMessageText, thread.unread && styles.threadMessageTextUnread]} numberOfLines={1}>
                            {brandPartnershipPreviewText(thread.lastMessage || "") ||
                              productCollabPreviewText(thread.lastMessage || "") ||
                              collabInvitePreviewText(thread.lastMessage || "") ||
                              thread.lastMessage ||
                              "Secure direct message sync handshake established."}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {thread.unread && <View style={styles.bizUnreadDot} />}
                    </View>
                  ))
                  )}
                </View>
              )}

            </ScrollView>

  );
}
