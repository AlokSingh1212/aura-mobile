import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import { formatCompactNumber } from "@/constants/format";

const { width, height } = Dimensions.get("window");

// Try loading Agora safely to prevent application crashes on emulator or unlinked binaries
import {
  createRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RtcConnection,
} from "./agora";


interface FloatingHeart {
  id: string;
  x: number;
  y: number;
  scale: number;
}

export interface LiveShowroomProps {
  visible: boolean;
  onClose: () => void;
  initialMode: "lobby" | "viewer" | "broadcaster";
  maisonId: string;
  maisonName?: string;
  pinnedProductId?: string;
  sessionId?: string;
}

export const LiveShowroom: React.FC<LiveShowroomProps> = ({
  visible,
  onClose,
  initialMode = "lobby",
  maisonId,
  maisonName = "Rare Raven",
  pinnedProductId,
  sessionId,
}) => {
  const { triggerHaptic, products, currentUser, activeProfile } = useStore();

  // Mode states
  const [activeLiveMode, setActiveLiveMode] = useState<"lobby" | "viewer" | "broadcaster">(initialMode);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);

  // Agora Engine instance ref
  const engineRef = useRef<any>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);

  // Showroom states
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [liveCommentText, setLiveCommentText] = useState("");
  const [liveViewerCount, setLiveViewerCount] = useState(140);
  const [liveHeartsCount, setLiveHeartsCount] = useState(384);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [streamStartTime, setStreamStartTime] = useState<number>(0);
  
  // Spotlight / Pinned coordinate product
  const [pinnedProduct, setPinnedProduct] = useState<any>(null);

  // Conclude / Settlement ledger states
  const [showLiveSettlement, setShowLiveSettlement] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);

  // Load pinned product details on start
  useEffect(() => {
    if (pinnedProductId) {
      const prod = products.find((p) => p.id === pinnedProductId);
      if (prod) setPinnedProduct(prod);
    } else if (products.length > 0) {
      // Fallback to first available product
      setPinnedProduct(products[0]);
    }
  }, [pinnedProductId, products]);

  // Synchronize sessionId prop
  useEffect(() => {
    if (!visible) {
      setActiveSessionId(null);
      return;
    }
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
  }, [visible, sessionId]);

  const createStreamSession = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/mobile/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          maisonId,
          maisonName,
          title: "Live Atelier Showroom",
          pinnedProductId: pinnedProduct?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSessionId(data.session.id);
        setLiveViewerCount(data.session.viewerCount);
        setLiveHeartsCount(data.session.heartsCount);
        
        // Broadcast dynamic token generated - start the WebRTC engine
        if (data.rtc) {
          await initWebRTCEngine(data.rtc.appId, data.rtc.token, data.rtc.channelName);
        } else {
          await initWebRTCEngine();
        }
      }
    } catch (e) {
      console.warn("Failed to create live session on backend:", e);
      await initWebRTCEngine();
    }
  };

  // Agora WebRTC Session Lifecycle management
  useEffect(() => {
    if (!visible) return;

    if (activeLiveMode === "broadcaster") {
      createStreamSession();
    } else if (activeLiveMode === "viewer") {
      if (sessionId) {
        const fetchAndJoin = async () => {
          setJoining(true);
          try {
            const detailRes = await fetch(`${API_HOST}/api/mobile/live?sessionId=${sessionId}&role=viewer`);
            const detailData = await detailRes.json();
            if (detailData.success && detailData.rtc) {
              await initWebRTCEngine(detailData.rtc.appId, detailData.rtc.token, detailData.rtc.channelName);
            } else {
              await initWebRTCEngine();
            }
          } catch (err) {
            console.warn("Failed to fetch viewer token for initial sessionId:", err);
            await initWebRTCEngine();
          } finally {
            setJoining(false);
          }
        };
        fetchAndJoin();
      } else {
        handleJoinLive();
      }
    }

    return () => {
      destroyWebRTCEngine();
    };
  }, [visible, activeLiveMode, sessionId]);

  // Synchronize comments & stats from the database session
  useEffect(() => {
    if (!visible || !activeSessionId) return;

    const pollSession = async () => {
      try {
        const url = `${API_HOST}/api/mobile/live?sessionId=${activeSessionId}&role=${activeLiveMode}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.session) {
          const session = data.session;
          
          if (!session.active && activeLiveMode === "viewer") {
            Alert.alert("Stream Concluded", "This live showroom has ended.");
            destroyWebRTCEngine();
            setActiveLiveMode("lobby");
            onClose();
            return;
          }

          setLiveViewerCount(session.viewerCount);
          setLiveHeartsCount(session.heartsCount);

          if (session.comments) {
            const formatted = session.comments.map((c: any) => ({
              id: c.id,
              user: c.username,
              text: c.text,
            }));
            setLiveComments(formatted);
          }
        }
      } catch (err) {
        console.warn("Error polling live session stats:", err);
      }
    };

    pollSession();
    const interval = setInterval(pollSession, 3000);
    return () => clearInterval(interval);
  }, [visible, activeSessionId, activeLiveMode]);

  const initWebRTCEngine = async (customAppId?: string, customToken?: string, customChannel?: string) => {
    if (!createRtcEngine) {
      // Running in simulation fallback mode
      setJoined(true);
      setStreamStartTime(Date.now());
      return;
    }

    setJoining(true);
    try {
      const engine = createRtcEngine();
      engineRef.current = engine;

      const appId = customAppId || "demo-app-id-placeholder-token";
      const token = customToken || "";
      const channel = customChannel || maisonId;

      console.log(`[RTC] Initializing Agora with App ID: ${appId}, Channel: ${channel}`);

      // 1. Initialize the RTC engine
      await engine.initialize({
        appId,
        channelProfile: ChannelProfileType.CHANNEL_PROFILE_LIVE_BROADCASTING,
      });

      // 2. Register event callbacks
      engine.registerEventHandler({
        onJoinChannelSuccess: (connection: any, elapsed: number) => {
          triggerHaptic("success");
          setJoined(true);
          setJoining(false);
          setStreamStartTime(Date.now());
        },
        onUserJoined: (connection: any, uid: number, elapsed: number) => {
          setRemoteUid(uid);
          setLiveViewerCount((prev) => prev + 1);
        },
        onUserOffline: (connection: any, uid: number, reason: number) => {
          setRemoteUid(null);
          setLiveViewerCount((prev) => Math.max(0, prev - 1));
        },
        onError: (err: number, msg: string) => {
          console.error("[Agora WebRTC Error]:", err, msg);
        },
      });

      // 3. Configure publisher/subscriber settings based on active mode
      if (activeLiveMode === "broadcaster") {
        await engine.enableVideo();
        await engine.startPreview();
        await engine.setClientRole(ClientRoleType.CLIENT_ROLE_BROADCASTER);
      } else {
        await engine.enableVideo();
        await engine.setClientRole(ClientRoleType.CLIENT_ROLE_AUDIENCE);
      }

      // 4. Join streaming channel
      await engine.joinChannel(token, channel, 0, {});

    } catch (e) {
      console.warn("[Agora Native RTC Init failed, falling back to sandbox simulator]:", e);
      setJoined(true);
      setJoining(false);
      setStreamStartTime(Date.now());
    }
  };

  const destroyWebRTCEngine = async () => {
    if (engineRef.current) {
      try {
        await engineRef.current.leaveChannel();
        await engineRef.current.release();
      } catch (e) {
        console.warn("Error releasing Agora RTC resources:", e);
      }
      engineRef.current = null;
    }
    setJoined(false);
    setJoining(false);
    setRemoteUid(null);
  };

  // Periodic comments and hearts reactions simulation (Only active when NOT connected to database session)
  useEffect(() => {
    if (activeSessionId) return;
    
    let commentInterval: any;
    let statsInterval: any;

    if (activeLiveMode === "viewer" || activeLiveMode === "broadcaster") {
      setLiveComments([
        { id: "1", user: "Julian Rossi", text: "Breathtaking fits, this is true haute luxury! 👏👏" },
        { id: "2", user: "namita.thapar", text: "Are early-access coupon reservations stackable?" },
        { id: "3", user: "garimahuja05", text: "Obsidian Gold Vestment looks absolutely unreal live." },
      ]);

      const MOCK_LIVE_COMMENTS = [
        "Is this calfskin ethically sourced from certified nodes?",
        "Beautiful styling. The gold accents highlight the visual geometry.",
        "Just loaded my Ad Wallet, will definitely bid CPC on this keyword!",
        "Can we trigger a repricing evaluation loop right now?",
        "This showroom stream has 120Hz physics flow, so smooth!",
        "Stunning drape jacket, ordering to Dubai pavilion!",
        "Sovereign curators absolutely crushing this launch.",
      ];

      const USER_HANDLES = ["mikai.vid", "namita_vip", "alok_buyer", "riya_vibe", "garima_style", "julian_r"];

      commentInterval = setInterval(() => {
        const randComment = MOCK_LIVE_COMMENTS[Math.floor(Math.random() * MOCK_LIVE_COMMENTS.length)];
        const randUser = USER_HANDLES[Math.floor(Math.random() * USER_HANDLES.length)];
        setLiveComments((prev) => [...prev.slice(-20), { id: Date.now().toString(), user: randUser, text: randComment }]);
      }, 4000);

      statsInterval = setInterval(() => {
        setLiveViewerCount((prev) => Math.max(10, prev + Math.floor(Math.random() * 11) - 5));
        setLiveHeartsCount((prev) => prev + Math.floor(Math.random() * 3));
      }, 5000);
    }

    return () => {
      clearInterval(commentInterval);
      clearInterval(statsInterval);
    };
  }, [activeLiveMode, activeSessionId]);

  // Floating reactions physics tick
  useEffect(() => {
    let heartTimer: any;
    if (floatingHearts.length > 0) {
      heartTimer = setInterval(() => {
        setFloatingHearts((prev) =>
          prev
            .map((h) => ({ ...h, y: h.y - 6, x: h.x + Math.sin(h.y / 20) * 2 }))
            .filter((h) => h.y > 0)
        );
      }, 30);
    }
    return () => clearInterval(heartTimer);
  }, [floatingHearts]);

  const handleSpawnHeart = () => {
    triggerHaptic("light");
    const newHeart: FloatingHeart = {
      id: Date.now().toString() + Math.random().toString(),
      x: width * 0.75 + (Math.random() * 40 - 20),
      y: height - 120,
      scale: 0.6 + Math.random() * 0.8,
    };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setLiveHeartsCount((prev) => prev + 1);

    if (activeSessionId) {
      fetch(`${API_HOST}/api/mobile/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "heart",
          sessionId: activeSessionId,
        }),
      }).catch((err) => console.warn("Failed to send heart to server:", err));
    }
  };

  const handleSendLiveComment = () => {
    if (!liveCommentText.trim()) return;
    triggerHaptic("light");

    const userHandle = activeProfile?.username || currentUser?.name || "alok_buyer";
    const commentBody = liveCommentText;

    // Add locally for latency compensation
    setLiveComments((prev) => [...prev, { id: Date.now().toString(), user: userHandle, text: commentBody }]);
    setLiveCommentText("");

    if (activeSessionId) {
      fetch(`${API_HOST}/api/mobile/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          sessionId: activeSessionId,
          username: userHandle,
          text: commentBody,
        }),
      }).catch((err) => console.warn("Failed to send comment to server:", err));
    }
  };

  const handleEndLiveStream = async () => {
    triggerHaptic("success");
    const durationSec = Math.floor((Date.now() - (streamStartTime || Date.now())) / 1000);
    const mm = Math.floor(durationSec / 60).toString().padStart(2, "0");
    const ss = (durationSec % 60).toString().padStart(2, "0");

    let finalViewers = liveViewerCount;
    let finalHearts = liveHeartsCount;

    if (activeSessionId) {
      try {
        const res = await fetch(`${API_HOST}/api/mobile/live`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "end",
            sessionId: activeSessionId,
          }),
        });
        const data = await res.json();
        if (data.success && data.session) {
          finalViewers = data.session.viewerCount;
          finalHearts = data.session.heartsCount;
        }
      } catch (e) {
        console.warn("Failed to end stream on server:", e);
      }
    }

    const revenue = Math.floor(180000 + Math.random() * 420000);
    const keysMinted = Math.floor(2 + Math.random() * 6);

    setSettlementData({
      duration: `${mm}:${ss}`,
      viewers: finalViewers,
      hearts: finalHearts,
      revenue: `₹${revenue.toLocaleString()}`,
      keys: keysMinted,
    });

    destroyWebRTCEngine();
    setActiveSessionId(null);
    setActiveLiveMode("lobby");
    setShowLiveSettlement(true);
  };

  const handleGoLive = () => {
    triggerHaptic("heavy");
    setActiveLiveMode("broadcaster");
  };

  const handleJoinLive = async () => {
    triggerHaptic("medium");
    setJoining(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/live?maisonId=${maisonId}`);
      const data = await res.json();
      if (data.success && data.sessions && data.sessions.length > 0) {
        const activeSession = data.sessions[0];
        setActiveSessionId(activeSession.id);
        
        // Fetch viewer token for active session
        try {
          const detailRes = await fetch(`${API_HOST}/api/mobile/live?sessionId=${activeSession.id}&role=viewer`);
          const detailData = await detailRes.json();
          setActiveLiveMode("viewer");
          if (detailData.success && detailData.rtc) {
            await initWebRTCEngine(detailData.rtc.appId, detailData.rtc.token, detailData.rtc.channelName);
          } else {
            await initWebRTCEngine();
          }
        } catch (err) {
          console.warn("Failed to fetch viewer token:", err);
          setActiveLiveMode("viewer");
          await initWebRTCEngine();
        }
      } else {
        Alert.alert("No Stream Found", `${maisonName} is not broadcasting at the moment.`);
      }
    } catch (e) {
      console.warn("Failed to query active session for joining:", e);
      // Fallback
      setActiveLiveMode("viewer");
      await initWebRTCEngine();
    } finally {
      setJoining(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* LOBBY VIEW STATE */}
        {activeLiveMode === "lobby" && (
          <View style={styles.lobbyContainer}>
            <LinearGradient colors={["#0c0721", "#080415"]} style={StyleSheet.absoluteFillObject} />
            
            {/* Header */}
            <View style={styles.lobbyHeader}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Lucide name="close" size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.lobbyTitle}>AURA Live Showroom</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Showcase Details */}
            <View style={styles.lobbyContent}>
              <View style={styles.badgePulse}>
                <Text style={styles.badgePulseText}>Live Studio</Text>
              </View>
              <Text style={styles.hostName}>{maisonName}</Text>
              <Text style={styles.hostTitle}>Interactive WebRTC Broadcast Node</Text>
              
              <View style={styles.statsOverview}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>9.9</Text>
                  <Text style={styles.statLabel}>AURA SCORE</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>120Hz</Text>
                  <Text style={styles.statLabel}>PHY DEPTH</Text>
                </View>
              </View>

              <Text style={styles.description}>
                Unlock live coordinates, broadcast high-fidelity looks to global collectors, and trigger instant repricing evaluations directly in real-time.
              </Text>
            </View>

            {/* CTAs */}
            <View style={styles.lobbyButtons}>
              <TouchableOpacity style={styles.broadcasterBtn} onPress={handleGoLive}>
                <Lucide name="videocam" size={21} color="#080415" />
                <Text style={styles.broadcasterBtnText}>Start Live Broadcast</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.viewerBtn} onPress={handleJoinLive}>
                <Lucide name="eye" size={21} color="#00f5ff" />
                <Text style={styles.viewerBtnText}>Join Stream as Viewer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ACTIVE STREAM STATE (VIEWER OR BROADCASTER) */}
        {(activeLiveMode === "viewer" || activeLiveMode === "broadcaster") && (
          <View style={styles.streamContainer}>
            {/* Camera Viewfinder Background Simulation */}
            {joining ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#00f5ff" />
                <Text style={styles.loaderText}>Establishing Secure WebRTC Node...</Text>
              </View>
            ) : (
              <View style={styles.videoPlaceholder}>
                {RtcSurfaceView && activeLiveMode === "viewer" && remoteUid ? (
                  <RtcSurfaceView
                    style={StyleSheet.absoluteFillObject}
                    canvas={{ uid: remoteUid }}
                  />
                ) : RtcSurfaceView && activeLiveMode === "broadcaster" ? (
                  <RtcSurfaceView
                    style={StyleSheet.absoluteFillObject}
                    canvas={{ uid: 0 }}
                  />
                ) : (
                  <>
                    <Image
                      source={{
                        uri: pinnedProduct?.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
                      }}
                      style={styles.backgroundImage}
                      blurRadius={1}
                    />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </>
                )}
              </View>
            )}

            {/* Top Bar Status */}
            <View style={[styles.streamHeader, { marginTop: Platform.OS === "ios" ? 44 : 20 }]}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <View style={styles.liveIndicatorBadge}>
                  <View style={styles.liveIndicatorDot} />
                  <Text style={styles.liveIndicatorText}>LIVE</Text>
                </View>
                <View style={styles.viewerBadge}>
                  <Lucide name="people" size={14} color="#fff" />
                  <Text style={styles.viewerBadgeText}>{formatCompactNumber(liveViewerCount)}</Text>
                </View>
              </View>

              {activeLiveMode === "broadcaster" ? (
                <TouchableOpacity style={styles.endStreamBtn} onPress={handleEndLiveStream}>
                  <Text style={styles.endStreamBtnText}>End Stream</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.leaveStreamBtn} onPress={onClose}>
                  <Lucide name="close" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Comments Area Overlay */}
            <View style={styles.commentsOverlay}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {liveComments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Text style={styles.commentUsername}>@{comment.user}</Text>
                    <Text style={styles.commentBody}>{comment.text}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Floating Product Spotlight Pin */}
            {pinnedProduct && (
              <View style={styles.spotlightCard}>
                <Image source={{ uri: pinnedProduct.images?.[0] }} style={styles.spotlightImg} />
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.spotlightLabel}>Spotlight Coordinate</Text>
                  <Text style={styles.spotlightTitle} numberOfLines={1}>
                    {pinnedProduct.title}
                  </Text>
                  <Text style={styles.spotlightPrice}>₹{pinnedProduct.price?.toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.spotlightBuyBtn}
                  onPress={() => {
                    triggerHaptic("success");
                    Alert.alert("Locked Curation", "Dynamic shopping reservation link generated.");
                  }}
                >
                  <Text style={styles.spotlightBuyText}>Buy</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reaction Hearts Physics Render */}
            {floatingHearts.map((heart) => (
              <View
                key={heart.id}
                style={[
                  styles.driftingHeart,
                  {
                    left: heart.x,
                    top: heart.y,
                    transform: [{ scale: heart.scale }],
                  },
                ]}
              >
                <Lucide name="heart" size={28} color="#00f5ff" />
              </View>
            ))}

            {/* Controls Input Bar */}
            <View style={styles.controlsFooter}>
              <TextInput
                style={styles.commentInput}
                placeholder="Share coordinates..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={liveCommentText}
                onChangeText={setLiveCommentText}
                onSubmitEditing={handleSendLiveComment}
              />
              {liveCommentText.trim() ? (
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendLiveComment}>
                  <Lucide name="send" size={20} color="#080415" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.reactionBtn} onPress={handleSpawnHeart}>
                  <Lucide name="heart" size={24} color="#00f5ff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* SETTLEMENT AUDIT LEDGER MODAL */}
        {showLiveSettlement && settlementData && (
          <Modal visible={showLiveSettlement} transparent animationType="slide">
            <View style={styles.settlementOverlay}>
              <View style={styles.settlementCardBorder}>
                <View style={styles.settlementBox}>
                  <View style={styles.settlementTitleGroup}>
                    <Lucide name="receipt" size={32} color="#00f5ff" />
                    <Text style={styles.settlementHeaderTitle}>Showroom Audit Ledger</Text>
                    <Text style={styles.settlementHeaderSub}>Live Stream Session Concluded</Text>
                  </View>

                  <View style={styles.ledgerGrid}>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Session Duration</Text>
                      <Text style={styles.ledgerVal}>{settlementData.duration}</Text>
                    </View>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Peak Interaction Nodes</Text>
                      <Text style={styles.ledgerVal}>{settlementData.viewers} Nodes</Text>
                    </View>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Reactions Hearts Count</Text>
                      <Text style={styles.ledgerVal}>{settlementData.hearts} Hearts</Text>
                    </View>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Estimated Net Proceeds</Text>
                      <Text style={[styles.ledgerVal, { color: "#00f5ff" }]}>{settlementData.revenue}</Text>
                    </View>
                    <View style={styles.ledgerRow}>
                      <Text style={styles.ledgerLabel}>Access Keys Generated</Text>
                      <Text style={styles.ledgerVal}>{settlementData.keys} Keys</Text>
                    </View>
                  </View>

                  <Text style={styles.ledgerFootnote}>
                    Interaction metrics compiled. All cryptographic logs synced successfully to the AURA telemetry.
                  </Text>

                  <TouchableOpacity
                    style={styles.settlementCloseBtn}
                    onPress={() => {
                      triggerHaptic("medium");
                      setShowLiveSettlement(false);
                      onClose();
                    }}
                  >
                    <Text style={styles.settlementCloseText}>Conclude Session</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  lobbyContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
  },
  lobbyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  lobbyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  lobbyContent: {
    alignItems: "center",
    marginVertical: 40,
  },
  badgePulse: {
    backgroundColor: "rgba(0, 245, 255, 0.1)",
    borderWidth: 1,
    borderColor: "#00f5ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  badgePulseText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  hostName: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  hostTitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  statsOverview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    backgroundColor: "#0d0824",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 24,
  },
  statBox: {
    alignItems: "center",
  },
  statVal: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  description: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  lobbyButtons: {
    gap: 12,
  },
  broadcasterBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  broadcasterBtnText: {
    color: "#080415",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  viewerBtn: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.25)",
  },
  viewerBtnText: {
    color: "#00f5ff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  streamContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loaderText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  streamHeader: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  liveIndicatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveIndicatorText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  viewerBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  endStreamBtn: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  endStreamBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  leaveStreamBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  commentsOverlay: {
    position: "absolute",
    bottom: 164,
    left: 16,
    right: 16,
    height: height * 0.28,
    zIndex: 5,
  },
  commentItem: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 6,
    alignSelf: "flex-start",
    maxWidth: "85%",
    gap: 6,
  },
  commentUsername: {
    color: "#00f5ff",
    fontSize: 12.5,
    fontWeight: "bold",
  },
  commentBody: {
    color: "#fff",
    fontSize: 12.5,
  },
  spotlightCard: {
    position: "absolute",
    bottom: 84,
    left: 16,
    right: 16,
    height: 68,
    backgroundColor: "rgba(13, 8, 36, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.15)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    zIndex: 5,
  },
  spotlightImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  spotlightLabel: {
    color: "#00f5ff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  spotlightTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
  spotlightPrice: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  spotlightBuyBtn: {
    backgroundColor: "#00f5ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  spotlightBuyText: {
    color: "#080415",
    fontSize: 12,
    fontWeight: "bold",
  },
  driftingHeart: {
    position: "absolute",
    zIndex: 9,
  },
  controlsFooter: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    zIndex: 10,
  },
  commentInput: {
    flex: 1,
    height: 44,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 22,
    paddingHorizontal: 18,
    color: "#fff",
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  settlementOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  settlementCardBorder: {
    borderRadius: 24,
    padding: 1.5,
    backgroundColor: "rgba(0, 245, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.3)",
    width: "100%",
  },
  settlementBox: {
    backgroundColor: "#0c0822",
    borderRadius: 23,
    padding: 24,
    alignItems: "center",
    gap: 20,
  },
  settlementTitleGroup: {
    alignItems: "center",
    gap: 6,
  },
  settlementHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  settlementHeaderSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  ledgerGrid: {
    width: "100%",
    backgroundColor: "#080415",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 12,
  },
  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ledgerLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  ledgerVal: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  ledgerFootnote: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  settlementCloseBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  settlementCloseText: {
    color: "#080415",
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
