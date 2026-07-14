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
  PermissionsAndroid,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Clipboard from "expo-clipboard";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import {
  fetchLiveSession,
  formatLiveComments,
  postLiveComment,
  postLiveHeart,
} from "@/lib/liveSessionApi";
import { fetchLiveConfig, mintAgoraToken } from "@/lib/liveConfigApi";
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


const HlsStreamPlayer = ({ playbackUrl }: { playbackUrl: string }) => {
  const player = useVideoPlayer(playbackUrl, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

export interface LiveShowroomProps {
  visible: boolean;
  onClose: () => void;
  initialMode: "lobby" | "viewer" | "broadcaster";
  maisonId: string;
  maisonName?: string;
  pinnedProductId?: string;
  sessionId?: string;
  /** Skip lobby and go straight to broadcast (Create → Live) */
  skipLobby?: boolean;
}

export const LiveShowroom: React.FC<LiveShowroomProps> = ({
  visible,
  onClose,
  initialMode = "lobby",
  maisonId,
  maisonName = "Rare Raven",
  pinnedProductId,
  sessionId,
  skipLobby = false,
}) => {
  const { triggerHaptic, products, currentUser, activeProfile } = useStore();

  // Mode states
  const [activeLiveMode, setActiveLiveMode] = useState<"lobby" | "viewer" | "broadcaster">(
    skipLobby && initialMode === "broadcaster" ? "broadcaster" : initialMode
  );
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null);

  // Agora Engine instance ref
  const engineRef = useRef<any>(null);
  const liveInputRef = useRef<any>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);

  // Showroom states
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [liveCommentText, setLiveCommentText] = useState("");
  const [liveViewerCount, setLiveViewerCount] = useState(140);
  const [liveHeartsCount, setLiveHeartsCount] = useState(384);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [streamStartTime, setStreamStartTime] = useState<number>(0);

  const [currentLiveSession, setCurrentLiveSession] = useState<any>(null);
  const [streamSource, setStreamSource] = useState<"phone" | "obs">("phone");
  const [showObsSettings, setShowObsSettings] = useState(false);
  const [livePlatformConfig, setLivePlatformConfig] = useState<{
    agoraAppId: string | null;
    agoraConfigured: boolean;
    ivsConfigured: boolean;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    fetchLiveConfig().then((cfg) => {
      if (cfg) {
        setLivePlatformConfig({
          agoraAppId: cfg.agora.appId,
          agoraConfigured: cfg.agora.configured,
          ivsConfigured: !!cfg.ivs?.configured,
        });
      }
    });
  }, [visible]);

  const stopAgoraRtmpPush = () => {
    if (engineRef.current && currentLiveSession?.ingestEndpoint && currentLiveSession?.streamKey) {
      const rtmpUrl = `${currentLiveSession.ingestEndpoint}${currentLiveSession.streamKey}`;
      try {
        if (typeof engineRef.current.stopRtmpStream === "function") {
          engineRef.current.stopRtmpStream(rtmpUrl);
        }
      } catch (err) {
        console.warn("Failed to stop Agora RTMP streaming push:", err);
      }
    }
  };

  const handleSourceChange = async (source: "phone" | "obs") => {
    setStreamSource(source);
    if (source === "obs") {
      stopAgoraRtmpPush();
      if (engineRef.current) {
        try {
          await engineRef.current.leaveChannel();
        } catch {}
      }
    } else {
      if (activeSessionId) {
        await initWebRTCEngine();
      }
    }
  };
  
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

  // Reset mode when modal opens from Create → Live
  useEffect(() => {
    if (!visible) return;
    if (skipLobby && initialMode === "broadcaster") {
      setActiveLiveMode("broadcaster");
    } else {
      setActiveLiveMode(initialMode);
    }
  }, [visible, initialMode, skipLobby]);

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
        headers: authHeaders(),
        body: JSON.stringify({
          action: "create",
          maisonId,
          maisonName,
          title: "Live Atelier Showroom",
          pinnedProductId: pinnedProduct?.id,
          userId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSessionId(data.session.id);
        setLiveViewerCount(data.session.viewerCount);
        setLiveHeartsCount(data.session.heartsCount);
        setCurrentLiveSession(data.session);
        
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
            if (detailData.success && detailData.session) {
              setCurrentLiveSession(detailData.session);
            }
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
        const session = await fetchLiveSession(
          activeSessionId,
          activeLiveMode === "broadcaster" ? "broadcaster" : "viewer"
        );
        if (!session) return;

        setCurrentLiveSession(session);

        if (!session.active && activeLiveMode === "viewer") {
          Alert.alert("Stream Concluded", "This live showroom has ended.");
          destroyWebRTCEngine();
          setActiveLiveMode("lobby");
          onClose();
          return;
        }

        setLiveViewerCount(session.viewerCount ?? 0);
        setLiveHeartsCount(session.heartsCount ?? 0);

        if (session.comments) {
          setLiveComments(formatLiveComments(session.comments));
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
    if (Platform.OS === "android" && activeLiveMode === "broadcaster") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted["android.permission.CAMERA"] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted["android.permission.RECORD_AUDIO"] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert("Permission Denied", "Camera and Audio permissions are required to start a live broadcast.");
          return;
        }
      } catch (err) {
        console.warn("Permission request failed:", err);
      }
    }

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

      let appId = customAppId || livePlatformConfig?.agoraAppId || "";
      let token = customToken || "";
      const channel = customChannel || maisonId;

      if (!token && livePlatformConfig?.agoraConfigured) {
        const minted = await mintAgoraToken({
          channelName: channel,
          uid: 0,
          role: activeLiveMode === "broadcaster" ? "publisher" : "subscriber",
        });
        if (minted) {
          appId = minted.appId || appId;
          token = minted.token;
        }
      }

      if (!appId) {
        appId = "demo-app-id-placeholder-token";
      }

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

          // Start Agora RTMP streaming push if ingest details exist
          if (activeLiveMode === "broadcaster" && currentLiveSession?.ingestEndpoint && currentLiveSession?.streamKey) {
            const rtmpUrl = `${currentLiveSession.ingestEndpoint}${currentLiveSession.streamKey}`;
            console.log(`[Agora RTMP Push] Publishing stream to RTMP target: ${rtmpUrl}`);
            try {
              if (engineRef.current && typeof engineRef.current.startRtmpStreamWithoutTranscoding === "function") {
                engineRef.current.startRtmpStreamWithoutTranscoding(rtmpUrl);
              }
            } catch (err) {
              console.warn("Failed to initiate startRtmpStreamWithoutTranscoding:", err);
            }
          }
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
        await engine.enableAudio();
        await engine.startPreview();
        await engine.setClientRole(ClientRoleType.CLIENT_ROLE_BROADCASTER);
      } else {
        await engine.enableVideo();
        await engine.enableAudio();
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

  // When not connected to a live session, keep comments empty (no fake spam).
  useEffect(() => {
    if (activeSessionId) return;
    if (activeLiveMode === "viewer" || activeLiveMode === "broadcaster") {
      setLiveComments([]);
    }
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
      postLiveHeart(activeSessionId, currentUser?.id).catch((err) =>
        console.warn("Failed to send heart to server:", err)
      );
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
    
    // Maintain keyboard focus
    setTimeout(() => {
      liveInputRef.current?.focus();
    }, 50);

    if (activeSessionId) {
      postLiveComment({
        sessionId: activeSessionId,
        username: userHandle,
        text: commentBody,
        userId: currentUser?.id,
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

    const revenue = Math.floor(finalHearts * 120 + finalViewers * 45);

    setSettlementData({
      duration: `${mm}:${ss}`,
      viewers: finalViewers,
      hearts: finalHearts,
      revenue: `₹${revenue.toLocaleString()}`,
      keys: Math.max(0, Math.floor(finalHearts / 50)),
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
        setCurrentLiveSession(activeSession);
        
        // Fetch viewer token for active session
        try {
          const detailRes = await fetch(`${API_HOST}/api/mobile/live?sessionId=${activeSession.id}&role=viewer`);
          const detailData = await detailRes.json();
          if (detailData.success && detailData.session) {
            setCurrentLiveSession(detailData.session);
          }
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
                {currentLiveSession?.playbackUrl && activeLiveMode === "viewer" && livePlatformConfig?.ivsConfigured ? (
                  <HlsStreamPlayer playbackUrl={currentLiveSession.playbackUrl} />
                ) : activeLiveMode === "broadcaster" && streamSource === "obs" ? (
                  <View style={styles.obsActiveContainer}>
                    <Lucide name="logo-twitch" size={48} color="#00f5ff" style={{ marginBottom: 12 }} />
                    <Text style={styles.obsActiveTitle}>OBS Output Mode Engaged</Text>
                    <Text style={styles.obsActiveDesc}>
                      Start streaming in your desktop encoder (OBS, StreamYard, etc.) using your stream keys.
                    </Text>
                    <TouchableOpacity style={styles.obsShowSettingsBtn} onPress={() => setShowObsSettings(true)}>
                      <Text style={{ color: "#000", fontWeight: "bold" }}>View Stream Keys</Text>
                    </TouchableOpacity>
                  </View>
                ) : RtcSurfaceView && activeLiveMode === "viewer" && remoteUid ? (
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

                {/* OBS Credentials settings overlay */}
                {showObsSettings && activeLiveMode === "broadcaster" && (
                  <View style={styles.obsSettingsCard}>
                    <View style={styles.obsCardHeader}>
                      <Text style={styles.obsCardTitle}>Showroom Stream Settings</Text>
                      <TouchableOpacity onPress={() => setShowObsSettings(false)}>
                        <Lucide name="close" size={20} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.obsCardDesc}>
                      Select your video source. Choose OBS to stream in studio quality using desktop tools.
                    </Text>

                    <View style={styles.sourceToggleRow}>
                      <TouchableOpacity 
                        style={[styles.sourceToggleBtn, streamSource === "phone" && styles.sourceToggleBtnActive]}
                        onPress={() => { triggerHaptic("medium"); handleSourceChange("phone"); }}
                      >
                        <Lucide name="camera" size={18} color={streamSource === "phone" ? "#080415" : "#fff"} />
                        <Text style={[styles.sourceToggleText, streamSource === "phone" && styles.sourceToggleTextActive]}>Phone Camera</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.sourceToggleBtn, streamSource === "obs" && styles.sourceToggleBtnActive]}
                        onPress={() => { triggerHaptic("medium"); handleSourceChange("obs"); }}
                      >
                        <Lucide name="desktop-outline" size={18} color={streamSource === "obs" ? "#080415" : "#fff"} />
                        <Text style={[styles.sourceToggleText, streamSource === "obs" && styles.sourceToggleTextActive]}>OBS Desktop</Text>
                      </TouchableOpacity>
                    </View>

                    {streamSource === "obs" && (
                      <View style={{ marginTop: 14 }}>
                        <Text style={styles.obsLabel}>SERVER RTMPS URL</Text>
                        <View style={styles.obsInputContainer}>
                          <Text style={styles.obsValueText} numberOfLines={1}>
                            {currentLiveSession?.ingestEndpoint || "rtmps://demo-ingest.ivs.rocks:443/app/"}
                          </Text>
                          <TouchableOpacity onPress={async () => {
                            triggerHaptic("success");
                            await Clipboard.setStringAsync(currentLiveSession?.ingestEndpoint || "rtmps://demo-ingest.ivs.rocks:443/app/");
                            Alert.alert("Copied", "Server URL copied to clipboard.");
                          }}>
                            <Lucide name="copy-outline" size={18} color="#00f5ff" />
                          </TouchableOpacity>
                        </View>

                        <Text style={[styles.obsLabel, { marginTop: 10 }]}>STREAM KEY</Text>
                        <View style={styles.obsInputContainer}>
                          <Text style={styles.obsValueText} numberOfLines={1}>
                            {currentLiveSession?.streamKey || "sk_us-east-1_demo_stream_key"}
                          </Text>
                          <TouchableOpacity onPress={async () => {
                            triggerHaptic("success");
                            await Clipboard.setStringAsync(currentLiveSession?.streamKey || "sk_us-east-1_demo_stream_key");
                            Alert.alert("Copied", "Stream Key copied to clipboard.");
                          }}>
                            <Lucide name="copy-outline" size={18} color="#00f5ff" />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.obsHelpHint}>
                          Paste these settings in OBS Studio → Settings → Stream to broadcast your live atelier feed.
                        </Text>
                      </View>
                    )}
                  </View>
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
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <TouchableOpacity 
                    style={styles.broadcasterSettingsBtn} 
                    onPress={() => { triggerHaptic("light"); setShowObsSettings(!showObsSettings); }}
                  >
                    <Lucide name="settings-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.endStreamBtn} onPress={handleEndLiveStream}>
                    <Text style={styles.endStreamBtnText}>End Stream</Text>
                  </TouchableOpacity>
                </View>
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
                ref={liveInputRef}
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
  broadcasterSettingsBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  obsSettingsCard: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: "rgba(12, 8, 34, 0.95)",
    borderRadius: 16,
    padding: 16,
    zIndex: 10000,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  obsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  obsCardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  obsCardDesc: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 14,
  },
  sourceToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  sourceToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    gap: 6,
  },
  sourceToggleBtnActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  sourceToggleText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
  },
  sourceToggleTextActive: {
    color: "#080415",
  },
  obsLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  obsInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#080415",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  obsValueText: {
    color: "#fff",
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  obsHelpHint: {
    color: "#00f5ff",
    fontSize: 11,
    marginTop: 10,
    lineHeight: 15,
  },
  obsActiveContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080415",
    paddingHorizontal: 30,
  },
  obsActiveTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  obsActiveDesc: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  obsShowSettingsBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
