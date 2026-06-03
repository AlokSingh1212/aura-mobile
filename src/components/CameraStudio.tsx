import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, useMicrophonePermissions, CameraRecordingOptions } from "expo-camera";
import { setAudioModeAsync, createAudioPlayer } from "expo-audio";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { AudioSelectorDrawer } from "@/components/AudioSelectorDrawer";

const { height, width } = Dimensions.get("window");

export interface CameraStudioProps {
  visible: boolean;
  onClose: () => void;
  insets: { top: number; bottom: number };
  products?: any[];
  onPostPublished?: (reelData: any) => void;
}

export const CameraStudio: React.FC<CameraStudioProps> = ({
  visible,
  onClose,
  insets,
  products = [],
  onPostPublished,
}) => {
  const { triggerHaptic } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // Real camera ref for recordAsync / stopRecording
  const cameraRef = useRef<CameraView>(null);

  // Audio states
  const soundRef = useRef<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<any>({
    title: "Phoolon Ka Taron Ka (Bespoke Mix)",
    artist: "Vedang Raina x A.R. Rahman",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=80",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    category: "bollywood",
  });
  const [audioSearchQuery, setAudioSearchQuery] = useState("");
  const [activeAudioCategory, setActiveAudioCategory] = useState<"all" | "trending" | "pop" | "bollywood" | "hiphop" | "electronic">("all");

  // Camera states
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [flashMode, setFlashMode] = useState<"off" | "on" | "auto">("off");
  const [recordingSpeed, setRecordingSpeed] = useState<0.3 | 0.5 | 1 | 2 | 3>(1);
  const [countdownDuration, setCountdownDuration] = useState<0 | 3 | 10>(0);
  const [activeCountdown, setActiveCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [alignGhostActive, setAlignGhostActive] = useState(false);
  const [videoLayoutMode, setVideoLayoutMode] = useState<"single" | "split" | "grid" | "triptych">("single");
  const [activeFilter, setActiveFilter] = useState<"none" | "platinum" | "neon" | "obsidian">("none");
  const [selectedLength, setSelectedLength] = useState<15 | 30 | 60 | 90>(60);
  const [touchUpStrength, setTouchUpStrength] = useState(70);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Teleprompter
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterText] = useState(
    "AURA Obsidian Gold Vestment coordinate sync...\nDesigned in Milano.\nLimited run of 50 pieces active.\n\nCrafted for the discerning few who understand that fashion is not just clothing — it is armour.\n\nAURA. Wear the future."
  );
  const teleprompterScrollY = useRef(new Animated.Value(0)).current;
  const teleprompterAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Sub-drawer states
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSpeedDrawer, setShowSpeedDrawer] = useState(false);
  const [showCountdownDrawer, setShowCountdownDrawer] = useState(false);
  const [showFlashDrawer, setShowFlashDrawer] = useState(false);
  const [showRetouchSlider, setShowRetouchSlider] = useState(false);
  const [showLayoutDrawer, setShowLayoutDrawer] = useState(false);

  // Share studio states
  const [showShareStudio, setShowShareStudio] = useState(false);
  const [taggedProduct, setTaggedProduct] = useState<any>(null);
  const [affiliateCommission, setAffiliateCommission] = useState(10);
  const [affiliateHandle, setAffiliateHandle] = useState("");
  const [reelCaption, setReelCaption] = useState("");

  // Audio setup
  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
        });
      } catch (err) {
        console.warn("Failed to configure Audio Mode:", err);
      }
    };
    if (visible) setupAudioMode();
  }, [visible]);

  // Teleprompter animation
  useEffect(() => {
    if (isRecording && showTeleprompter) {
      teleprompterScrollY.setValue(0);
      teleprompterAnimRef.current = Animated.timing(teleprompterScrollY, {
        toValue: -400,
        duration: selectedLength * 1000,
        useNativeDriver: true,
      });
      teleprompterAnimRef.current.start();
    } else {
      teleprompterAnimRef.current?.stop();
      teleprompterScrollY.setValue(0);
    }
  }, [isRecording, showTeleprompter]);

  const playTrack = async (url: string) => {
    try {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }
      if (!url) return;
      const player = createAudioPlayer(url, { downloadFirst: false });
      player.loop = true;
      player.play();
      soundRef.current = player;
      setIsPlayingAudio(true);
    } catch (e) {
      console.warn("Error playing audio track:", e);
    }
  };

  const stopTrack = async () => {
    try {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }
      setIsPlayingAudio(false);
    } catch (e) {
      console.warn("Error stopping audio track:", e);
    }
  };

  const handleClose = () => {
    // Stop any active recording before closing
    if (isRecording) {
      cameraRef.current?.stopRecording();
    }
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    stopTrack();
    setShowShareStudio(false);
    setIsRecording(false);
    setRecordingProgress(0);
    setRecordedVideoUri(null);
    onClose();
  };

  /** Starts the real camera recording and drives the progress bar */
  const startRealRecording = async () => {
    if (!cameraRef.current) return;

    setIsRecording(true);
    setRecordingProgress(0);
    if (selectedAudio?.url) playTrack(selectedAudio.url);

    // Drive progress bar using an interval timed to selected length
    const totalMs = selectedLength * 1000;
    const intervalMs = 200;
    const startTime = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalMs) * 100, 100);
      setRecordingProgress(pct);
    }, intervalMs);

    try {
      const options: CameraRecordingOptions = {
        maxDuration: selectedLength,
      };
      // recordAsync resolves when maxDuration is hit OR stopRecording is called
      const result = await cameraRef.current.recordAsync(options);
      // Recording finished (either via maxDuration or stop press)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsRecording(false);
      setRecordingProgress(0);
      stopTrack();
      if (result?.uri) {
        setRecordedVideoUri(result.uri);
        setShowShareStudio(true);
      }
    } catch (err) {
      console.warn("Recording error:", err);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsRecording(false);
      setRecordingProgress(0);
      stopTrack();
    }
  };

  const stopRealRecording = () => {
    cameraRef.current?.stopRecording();
    // The recordAsync promise will resolve and handle cleanup
  };

  const handleRecordPress = () => {
    triggerHaptic("heavy");
    if (isRecording) {
      stopRealRecording();
    } else {
      if (countdownDuration > 0) {
        setIsCountingDown(true);
        let tick = countdownDuration;
        setActiveCountdown(tick);
        const tickTimer = setInterval(() => {
          tick--;
          triggerHaptic("medium");
          if (tick <= 0) {
            clearInterval(tickTimer);
            setIsCountingDown(false);
            startRealRecording();
          } else {
            setActiveCountdown(tick);
          }
        }, 1000);
      } else {
        startRealRecording();
      }
    }
  };

  const handlePublish = () => {
    triggerHaptic("heavy");
    const newReel = {
      id: `user_reel_${Date.now()}`,
      // Use the real recorded video URI if available, else fallback
      url: recordedVideoUri || "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40149-large.mp4",
      caption: reelCaption.trim() || `by @${affiliateHandle || "curator"} · ${affiliateCommission}% commission`,
      likesCount: 0,
      comments: [],
      user: { name: "You" },
      artifactId: taggedProduct?.id,
      artifact: taggedProduct,
      thumbnail: taggedProduct?.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
      isVideo: true,
      isLocal: !!recordedVideoUri,
      affiliateLink: taggedProduct ? `https://aura.luxury/aff/${affiliateHandle || "curator"}/${taggedProduct.id}` : null,
      filterApplied: activeFilter,
      touchUpApplied: touchUpStrength,
      audioTrack: selectedAudio,
      lengthApplied: selectedLength,
    };
    onPostPublished?.(newReel);
    // Reset all state
    setShowShareStudio(false);
    setTaggedProduct(null);
    setReelCaption("");
    setActiveFilter("none");
    setTouchUpStrength(70);
    setSelectedLength(60);
    setShowTeleprompter(false);
    setAffiliateCommission(10);
    setAffiliateHandle("");
    setRecordedVideoUri(null);
    handleClose();
    alert(`✅ Reel published! ${recordedVideoUri ? "Real recording saved." : ""} ${taggedProduct ? `Tagged: "${newReel.artifact.title}"` : ""}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.cameraContainer}>
        {/* PERMISSION CHECKER — camera + microphone both required for video */}
        {!permission || !micPermission ? (
          <View style={[styles.cameraContainer, { justifyContent: "center", alignItems: "center" }]}>
            <ActivityIndicator size="large" color="#00f5ff" />
          </View>
        ) : !permission.granted || !micPermission.granted ? (
          <View style={styles.permissionContainer}>
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
              <View style={styles.permissionIconCircle}>
                <Lucide name={!permission.granted ? "camera-outline" : "mic-outline"} size={44} color="#00f5ff" />
              </View>
              <Text style={styles.permissionTitle}>
                {!permission.granted ? "Camera Access Required" : "Microphone Access Required"}
              </Text>
              <Text style={styles.permissionText}>
                AURA needs camera and microphone access to record Reels with live audio.
              </Text>
              {!permission.granted && (
                <TouchableOpacity style={styles.permissionBtn} onPress={() => { triggerHaptic("heavy"); requestPermission(); }}>
                  <Text style={styles.permissionBtnText}>Enable Camera</Text>
                </TouchableOpacity>
              )}
              {!micPermission.granted && (
                <TouchableOpacity style={[styles.permissionBtn, { marginTop: 8 }]} onPress={() => { triggerHaptic("heavy"); requestMicPermission(); }}>
                  <Text style={styles.permissionBtnText}>Enable Microphone</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.permissionCancelBtn} onPress={handleClose}>
                <Text style={styles.permissionCancelText}>Cancel</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        ) : (
          <>
            {/* Live CameraView with real recording ref */}
            <CameraView
              ref={cameraRef}
              style={styles.cameraViewfinder}
              facing={cameraFacing}
              mode="video"
              videoQuality="1080p"
            />

            {/* Flash overlay */}
            {flashMode === "on" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 20, borderColor: "#fffaf0", backgroundColor: "rgba(255,250,240,0.15)", zIndex: 4 }]} />
            )}

            {/* Collage overlays */}
            {videoLayoutMode === "split" && (
              <View pointerEvents="none" style={styles.collageSplitOverlay}>
                <View style={{ flex: 1, borderBottomWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                <View style={{ flex: 1 }} />
              </View>
            )}
            {videoLayoutMode === "grid" && (
              <View pointerEvents="none" style={styles.collageGridOverlay}>
                <View style={{ flex: 1, flexDirection: "row", borderBottomWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }}>
                  <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                  <View style={{ flex: 1 }} />
                </View>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                  <View style={{ flex: 1 }} />
                </View>
              </View>
            )}
            {videoLayoutMode === "triptych" && (
              <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, flexDirection: "row", zIndex: 3 }}>
                <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                <View style={{ flex: 1, borderRightWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" }} />
                <View style={{ flex: 1 }} />
              </View>
            )}

            {/* Align ghost */}
            {alignGhostActive && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}>
                <Image source={{ uri: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600" }}
                  style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]} />
              </View>
            )}

            {/* Countdown */}
            {isCountingDown && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownTitle}>Hands-free Recording</Text>
                <Text style={styles.countdownTimerText}>{activeCountdown}</Text>
                <Text style={styles.countdownSub}>Position your camera and prepare...</Text>
              </View>
            )}

            {/* Filter overlays */}
            {activeFilter === "platinum" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.12)", zIndex: 1 }]} />
            )}
            {activeFilter === "neon" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 4, borderColor: "#00f5ff", backgroundColor: "rgba(0,245,255,0.06)", zIndex: 1 }]} />
            )}
            {activeFilter === "obsidian" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(8,4,21,0.55)", zIndex: 1 }]} />
            )}

            {/* Touch-up glow */}
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.02)", opacity: touchUpStrength / 100, zIndex: 1 }]} />

            {/* UI Controls */}
            <View style={[styles.cameraSafe, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6, zIndex: 10 }]}>
              {/* TOP BAR */}
              <View style={styles.cameraTopBar}>
                <TouchableOpacity style={styles.cameraCircleBtn} onPress={handleClose}>
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={styles.cameraTopRightGroup}>
                  <TouchableOpacity
                    style={[styles.cameraCircleBtn, flashMode !== "off" && { backgroundColor: flashMode === "on" ? "rgba(255,255,255,0.2)" : "rgba(255,223,0,0.2)" }]}
                    onPress={() => { triggerHaptic("medium"); setShowFlashDrawer(true); }}
                  >
                    <Lucide name={flashMode === "off" ? "flash-off" : "flash"} size={23} color={flashMode === "off" ? "#fff" : flashMode === "on" ? "#00f5ff" : "#ffdf00"} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraBadgeBtn} onPress={() => { triggerHaptic("medium"); setShowSpeedDrawer(true); }}>
                    <Text style={styles.cameraBadgeText}>{recordingSpeed}x</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cameraCircleBtn, countdownDuration > 0 && { backgroundColor: "rgba(0,245,255,0.2)" }]}
                    onPress={() => { triggerHaptic("medium"); setShowCountdownDrawer(true); }}
                  >
                    <Lucide name="time-outline" size={23} color={countdownDuration > 0 ? "#00f5ff" : "#fff"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* RECORDING PROGRESS */}
              {isRecording && (
                <View style={styles.recordingProgressContainer}>
                  <View style={[styles.recordingProgressBar, { width: `${recordingProgress}%` as any }]} />
                </View>
              )}

              {/* SOUNDTRACK VISUALIZER */}
              {isRecording && selectedAudio && (
                <View style={styles.soundtrackVisualizerOverlay}>
                  <Image source={{ uri: selectedAudio.cover }} style={styles.soundtrackVisualizerCover} />
                  <Text style={styles.soundtrackVisualizerText} numberOfLines={1}>Now playing: "{selectedAudio.title}"</Text>
                  <View style={styles.musicWaveContainer}>
                    {[8, 16, 10, 14].map((h, i) => (
                      <View key={i} style={[styles.musicWaveBar, { height: h }]} />
                    ))}
                  </View>
                </View>
              )}

              {/* TELEPROMPTER */}
              {showTeleprompter && (
                <View style={styles.teleprompterBox}>
                  <View style={styles.teleprompterHeaderRow}>
                    <View style={styles.teleprompterLiveDot} />
                    <Text style={styles.teleprompterHeader}>{isRecording ? "● LIVE" : "AURA Studio Prompter"}</Text>
                    {!isRecording && <Text style={styles.teleprompterHint}>Scrolls when recording starts</Text>}
                  </View>
                  <View style={styles.teleprompterScrollArea}>
                    <Animated.Text style={[styles.teleprompterScrollText, { transform: [{ translateY: teleprompterScrollY }] }]}>
                      {teleprompterText}
                    </Animated.Text>
                  </View>
                </View>
              )}

              {/* AUDIO BUBBLE */}
              <TouchableOpacity style={styles.suggestedAudioBubble} onPress={() => { triggerHaptic("medium"); setShowAudioDrawer(true); }}>
                <Image source={{ uri: selectedAudio.cover }} style={styles.suggestedAudioArt} />
                <View style={styles.suggestedAudioTextWrap}>
                  <Text style={styles.suggestedAudioTitle} numberOfLines={1}>{selectedAudio.title}</Text>
                  <Text style={styles.suggestedAudioSub} numberOfLines={1}>{selectedAudio.artist} • Tap to change</Text>
                </View>
                <Lucide name="chevron-forward" size={17} color="#fff" />
              </TouchableOpacity>

              {/* LEFT TOOLBAR */}
              <View style={styles.cameraLeftToolbar}>
                {[
                  { label: "Audio", icon: "musical-notes-outline", active: false, onPress: () => setShowAudioDrawer(true) },
                  { label: "Effects", icon: "sparkles-outline", active: activeFilter !== "none", onPress: () => setShowFilterDrawer(true) },
                  { label: "Touch Up", icon: "color-wand-outline", active: showRetouchSlider, badge: "NEW", onPress: () => setShowRetouchSlider(!showRetouchSlider) },
                  { label: "Prompter", icon: "document-text-outline", active: showTeleprompter, badge: "NEW", onPress: () => setShowTeleprompter(!showTeleprompter) },
                  { label: "Layout", icon: "grid-outline", active: videoLayoutMode !== "single", onPress: () => setShowLayoutDrawer(true) },
                  { label: "Align", icon: "copy-outline", active: alignGhostActive, onPress: () => setAlignGhostActive(!alignGhostActive) },
                ].map((tool) => (
                  <TouchableOpacity key={tool.label} style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); tool.onPress(); }}>
                    <View style={[styles.cameraToolIconWrap, tool.active && { backgroundColor: "#00f5ff" }]}>
                      <Lucide name={tool.icon as any} size={22} color={tool.active ? "#000" : "#fff"} />
                      {tool.badge && <View style={styles.cameraNewBadge}><Text style={styles.cameraNewBadgeText}>{tool.badge}</Text></View>}
                    </View>
                    <Text style={styles.cameraToolLabel}>{tool.label}</Text>
                  </TouchableOpacity>
                ))}
                {/* Length toggle */}
                <TouchableOpacity style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); setSelectedLength((p) => p === 15 ? 30 : p === 30 ? 60 : p === 60 ? 90 : 15); }}>
                  <View style={styles.cameraToolIconWrap}>
                    <View style={styles.cameraLengthCircle}><Text style={styles.cameraLengthText}>{selectedLength}s</Text></View>
                  </View>
                  <Text style={styles.cameraToolLabel}>Length</Text>
                </TouchableOpacity>
              </View>

              {/* BOTTOM CONTROLS */}
              <View style={styles.cameraBottomWrapper}>
                <View style={styles.cameraBottomContainer}>
                  <TouchableOpacity style={styles.cameraGalleryBtn} onPress={() => triggerHaptic("light")}>
                    <Image source={{ uri: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=80" }} style={styles.cameraGalleryImg} />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.9} style={[styles.cameraRecordOuter, isRecording && styles.cameraRecordOuterRecording]} onPress={handleRecordPress}>
                    <View style={[styles.cameraRecordInner, isRecording && styles.cameraRecordInnerRecording]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraFlipBtn} onPress={() => { triggerHaptic("medium"); setCameraFacing(p => p === "back" ? "front" : "back"); }}>
                    <Lucide name="camera-reverse-outline" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.cameraSwiperFooter}>
                  <View style={styles.cameraSwiperOptionActive}>
                    <Text style={styles.cameraSwiperTextActive}>REEL</Text>
                    <View style={styles.cameraSwiperDot} />
                  </View>
                  <TouchableOpacity style={styles.cameraSwiperOption} onPress={() => triggerHaptic("light")}>
                    <Text style={styles.cameraSwiperText}>TEMPLATES</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── DRAWERS ── */}

            {/* AUDIO DRAWER */}
            {showAudioDrawer && (
              <AudioSelectorDrawer
                setShowAudioDrawer={setShowAudioDrawer}
                stopTrack={stopTrack}
                audioSearchQuery={audioSearchQuery}
                setAudioSearchQuery={setAudioSearchQuery}
                activeAudioCategory={activeAudioCategory}
                setActiveAudioCategory={setActiveAudioCategory}
                selectedAudio={selectedAudio}
                setSelectedAudio={setSelectedAudio}
                isPlayingAudio={isPlayingAudio}
                soundRef={soundRef}
                playTrack={playTrack}
              />
            )}

            {/* FILTER DRAWER */}
            {showFilterDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Visual Effects Matrix</Text>
                  <TouchableOpacity onPress={() => setShowFilterDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={styles.filterGrid}>
                  {[
                    { key: "none", label: "No Filter", icon: "ban-outline" },
                    { key: "platinum", label: "Platinum Glow", icon: "sparkles" },
                    { key: "neon", label: "Neon Bloom", icon: "color-palette" },
                    { key: "obsidian", label: "Obsidian Chrome", icon: "moon" },
                  ].map((f) => (
                    <TouchableOpacity key={f.key} style={[styles.filterGridItem, activeFilter === f.key && styles.filterGridItemActive]}
                      onPress={() => { triggerHaptic("light"); setActiveFilter(f.key as any); setShowFilterDrawer(false); }}>
                      <Lucide name={f.icon as any} size={26} color={activeFilter === f.key ? "#00f5ff" : "#fff"} />
                      <Text style={[styles.filterGridLabel, activeFilter === f.key && { color: "#00f5ff" }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* TOUCH UP DRAWER */}
            {showRetouchSlider && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Retouching Strength: {touchUpStrength}%</Text>
                  <TouchableOpacity onPress={() => setShowRetouchSlider(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    {[0, 25, 50, 70, 90, 100].map((val) => (
                      <TouchableOpacity key={val} style={[styles.strengthItemBtn, touchUpStrength === val && styles.strengthItemBtnActive]}
                        onPress={() => { triggerHaptic("light"); setTouchUpStrength(val); }}>
                        <Text style={[styles.strengthItemText, touchUpStrength === val && { color: "#000" }]}>{val}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* FLASH DRAWER */}
            {showFlashDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Flash Control</Text>
                  <TouchableOpacity onPress={() => setShowFlashDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 20, flexDirection: "row", gap: 12, justifyContent: "center" }}>
                  {[
                    { key: "off", label: "Off", icon: "flash-off-outline" },
                    { key: "on", label: "Ring Light", icon: "flash" },
                    { key: "auto", label: "Auto", icon: "flash-outline" },
                  ].map((m) => (
                    <TouchableOpacity key={m.key} style={[styles.filterGridItem, flashMode === m.key && styles.filterGridItemActive, { width: 100, height: 90 }]}
                      onPress={() => { triggerHaptic("medium"); setFlashMode(m.key as any); setShowFlashDrawer(false); }}>
                      <Lucide name={m.icon as any} size={26} color={flashMode === m.key ? "#000" : "#fff"} />
                      <Text style={[styles.filterGridLabel, flashMode === m.key && { color: "#000", fontWeight: "bold" }]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* SPEED DRAWER */}
            {showSpeedDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Recording Speed</Text>
                  <TouchableOpacity onPress={() => setShowSpeedDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 20, flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {([0.3, 0.5, 1, 2, 3] as const).map((spd) => (
                    <TouchableOpacity key={spd} style={[styles.strengthItemBtn, recordingSpeed === spd && styles.strengthItemBtnActive, { width: 90 }]}
                      onPress={() => { triggerHaptic("medium"); setRecordingSpeed(spd); setShowSpeedDrawer(false); }}>
                      <Text style={[styles.strengthItemText, recordingSpeed === spd && { color: "#000" }]}>{spd === 1 ? "1.0x" : `${spd}x`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* COUNTDOWN DRAWER */}
            {showCountdownDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Hands-Free Timer</Text>
                  <TouchableOpacity onPress={() => setShowCountdownDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 20, flexDirection: "row", gap: 12, justifyContent: "center" }}>
                  {[{ val: 0, label: "Off" }, { val: 3, label: "3s" }, { val: 10, label: "10s" }].map((t) => (
                    <TouchableOpacity key={t.val} style={[styles.strengthItemBtn, countdownDuration === t.val && styles.strengthItemBtnActive, { width: 90 }]}
                      onPress={() => { triggerHaptic("medium"); setCountdownDuration(t.val as any); setShowCountdownDrawer(false); }}>
                      <Text style={[styles.strengthItemText, countdownDuration === t.val && { color: "#000" }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* LAYOUT DRAWER */}
            {showLayoutDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Video Grid Layout</Text>
                  <TouchableOpacity onPress={() => setShowLayoutDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={styles.filterGrid}>
                  {[
                    { key: "single", label: "Single", icon: "square-outline" },
                    { key: "split", label: "Split", icon: "menu-outline" },
                    { key: "grid", label: "Grid", icon: "grid-outline" },
                    { key: "triptych", label: "Triptych", icon: "ellipsis-vertical-outline" },
                  ].map((lay) => (
                    <TouchableOpacity key={lay.key} style={[styles.filterGridItem, videoLayoutMode === lay.key && styles.filterGridItemActive]}
                      onPress={() => { triggerHaptic("medium"); setVideoLayoutMode(lay.key as any); setShowLayoutDrawer(false); }}>
                      <Lucide name={lay.icon as any} size={26} color={videoLayoutMode === lay.key ? "#00f5ff" : "#fff"} />
                      <Text style={[styles.filterGridLabel, videoLayoutMode === lay.key && { color: "#00f5ff" }]}>{lay.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── SHARE STUDIO ── */}
            {showShareStudio && (
              <View style={[styles.shareStudioOverlay, { paddingTop: insets.top }]}>
                <View style={{ flex: 1 }}>
                  {/* Header */}
                  <View style={styles.shareHeaderRow}>
                    <TouchableOpacity onPress={() => setShowShareStudio(false)}>
                      <Lucide name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.shareHeaderTitle}>Tag Affiliate Curation</Text>
                    <TouchableOpacity
                      style={[styles.sharePublishBtn, !taggedProduct && styles.sharePublishBtnDisabled]}
                      disabled={!taggedProduct}
                      onPress={handlePublish}
                    >
                      <Text style={styles.sharePublishText}>Publish Reel</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.shareStudioContent}>
                    {/* Caption */}
                    <View style={styles.shareCaptionBlock}>
                      <Image source={{ uri: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=150" }} style={styles.shareCaptionArt} />
                      <TextInput
                        style={styles.shareCaptionInput}
                        placeholder="Write a caption..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={reelCaption}
                        onChangeText={setReelCaption}
                        multiline
                      />
                    </View>

                    <View style={styles.dividerLine} />

                    {/* Tag Product */}
                    <View style={styles.shareSection}>
                      <Text style={styles.shareSectionTitle}>🏷️ Tag Product from Boutique</Text>
                      {taggedProduct ? (
                        <View style={styles.taggedProductCard}>
                          <Image source={{ uri: taggedProduct.images?.[0] }} style={styles.taggedProductImg} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.taggedProductMaison}>{taggedProduct.maison?.name || "AURA Maison"}</Text>
                            <Text style={styles.taggedProductTitle}>{taggedProduct.title}</Text>
                            <Text style={styles.taggedProductPrice}>₹{taggedProduct.price?.toLocaleString()}</Text>
                          </View>
                          <TouchableOpacity style={styles.taggedProductRemoveBtn} onPress={() => { triggerHaptic("light"); setTaggedProduct(null); }}>
                            <Lucide name="trash-outline" size={21} color="#ff3b30" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.taggedProductPrompt}>No product tagged. Select a coordinate item below!</Text>
                      )}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        {products.map((p: any) => (
                          <TouchableOpacity key={p.id}
                            style={[styles.selectProdBtn, taggedProduct?.id === p.id && styles.selectProdBtnActive]}
                            onPress={() => { triggerHaptic("medium"); setTaggedProduct(p); }}>
                            <Image source={{ uri: p.images?.[0] }} style={styles.selectProdImg} />
                            <Text style={styles.selectProdText} numberOfLines={1}>{p.title}</Text>
                            <Text style={styles.selectProdPrice}>₹{p.price?.toLocaleString()}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.dividerLine} />

                    {/* Affiliate */}
                    <View style={styles.shareSection}>
                      <Text style={styles.shareSectionTitle}>💹 Creator Affiliate Commission</Text>
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.commissionLabel}>Commission Rate: <Text style={{ color: "#00f5ff", fontWeight: "bold" }}>{affiliateCommission}%</Text></Text>
                        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                          {[5, 10, 15, 20].map((rate) => (
                            <TouchableOpacity key={rate}
                              style={[styles.rateBtn, affiliateCommission === rate && styles.rateBtnActive]}
                              onPress={() => { triggerHaptic("light"); setAffiliateCommission(rate); }}>
                              <Text style={[styles.rateText, affiliateCommission === rate && { color: "#000" }]}>{rate}%</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={{ marginTop: 16 }}>
                        <Text style={styles.commissionLabel}>Affiliate Handle:</Text>
                        <TextInput
                          style={styles.affiliateHandleInput}
                          placeholder="e.g. alok_curator"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={affiliateHandle}
                          onChangeText={setAffiliateHandle}
                        />
                      </View>
                      <View style={styles.affLinkPreviewCard}>
                        <Text style={styles.affLinkPreviewTitle}>Generated Purchase Link</Text>
                        <Text style={styles.affLinkPreviewText}>
                          {`https://aura.luxury/aff/${affiliateHandle.trim() || "curator"}/${taggedProduct?.id || "product_id"}`}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  cameraViewfinder: { ...StyleSheet.absoluteFillObject },
  permissionContainer: { flex: 1, backgroundColor: "#080415" },
  permissionIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(0,245,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  permissionTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  permissionText: { color: "rgba(255,255,255,0.6)", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  permissionBtn: { backgroundColor: "#00f5ff", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginBottom: 16 },
  permissionBtnText: { color: "#080415", fontWeight: "bold", fontSize: 15 },
  permissionCancelBtn: { paddingVertical: 10 },
  permissionCancelText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  cameraSafe: { flex: 1, justifyContent: "space-between" },
  cameraTopBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 },
  cameraTopRightGroup: { flexDirection: "row", gap: 10, alignItems: "center" },
  cameraCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  cameraBadgeBtn: { backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  cameraBadgeText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  recordingProgressContainer: { height: 3, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 16, borderRadius: 2 },
  recordingProgressBar: { height: "100%", backgroundColor: "#ff3b30", borderRadius: 2 },
  soundtrackVisualizerOverlay: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12, padding: 8, gap: 8 },
  soundtrackVisualizerCover: { width: 28, height: 28, borderRadius: 6 },
  soundtrackVisualizerText: { flex: 1, color: "#fff", fontSize: 12 },
  musicWaveContainer: { flexDirection: "row", alignItems: "center", gap: 2 },
  musicWaveBar: { width: 2, height: 8, backgroundColor: "#00f5ff", borderRadius: 1 },
  teleprompterBox: { marginHorizontal: 16, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 14, padding: 12, maxHeight: 140, overflow: "hidden" },
  teleprompterHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  teleprompterLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff3b30" },
  teleprompterHeader: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  teleprompterHint: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  teleprompterScrollArea: { overflow: "hidden", maxHeight: 90 },
  teleprompterScrollText: { color: "#fff", fontSize: 17, lineHeight: 26, fontWeight: "600", textAlign: "center" },
  suggestedAudioBubble: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 16, gap: 10 },
  suggestedAudioArt: { width: 28, height: 28, borderRadius: 6 },
  suggestedAudioTextWrap: { flex: 1 },
  suggestedAudioTitle: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  suggestedAudioSub: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  cameraLeftToolbar: { position: "absolute", left: 12, top: "25%", gap: 12 },
  cameraToolItem: { alignItems: "center", gap: 3 },
  cameraToolIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", position: "relative" },
  cameraToolLabel: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cameraLengthCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center" },
  cameraLengthText: { color: "#000", fontWeight: "bold", fontSize: 11 },
  cameraNewBadge: { position: "absolute", top: -4, right: -6, backgroundColor: "#ff3b30", borderRadius: 6, paddingHorizontal: 3 },
  cameraNewBadgeText: { color: "#fff", fontSize: 7, fontWeight: "bold" },
  cameraBottomWrapper: { paddingHorizontal: 16, gap: 16 },
  cameraBottomContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cameraGalleryBtn: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "#fff" },
  cameraGalleryImg: { width: "100%", height: "100%" },
  cameraRecordOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  cameraRecordOuterRecording: { borderColor: "#ff3b30" },
  cameraRecordInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#ff3b30" },
  cameraRecordInnerRecording: { width: 30, height: 30, borderRadius: 6 },
  cameraFlipBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  cameraSwiperFooter: { flexDirection: "row", justifyContent: "center", gap: 24 },
  cameraSwiperOptionActive: { alignItems: "center", gap: 4 },
  cameraSwiperTextActive: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  cameraSwiperDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#fff" },
  cameraSwiperOption: { alignItems: "center" },
  cameraSwiperText: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  collageSplitOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  collageGridOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, alignItems: "center", justifyContent: "center" },
  countdownTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  countdownTimerText: { color: "#00f5ff", fontSize: 80, fontWeight: "900" },
  countdownSub: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 12 },
  cameraOverlayDrawer: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: 440, backgroundColor: "#080415", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingTop: 16, zIndex: 999 },
  drawerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  drawerTitle: { color: "#fff", fontSize: 13.5, fontWeight: "bold", letterSpacing: 0.5, textTransform: "uppercase" },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, justifyContent: "center", paddingBottom: 20 },
  filterGridItem: { width: 110, height: 100, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", gap: 8 },
  filterGridItemActive: { backgroundColor: "rgba(0,245,255,0.12)", borderWidth: 1.5, borderColor: "#00f5ff" },
  filterGridLabel: { color: "#fff", fontSize: 12, fontWeight: "600", textAlign: "center" },
  strengthItemBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" },
  strengthItemBtnActive: { backgroundColor: "#00f5ff" },
  strengthItemText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  // Share Studio
  shareStudioOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#080415", zIndex: 100 },
  shareHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  shareHeaderTitle: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  sharePublishBtn: { backgroundColor: "#00f5ff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  sharePublishBtnDisabled: { backgroundColor: "rgba(0,245,255,0.2)" },
  sharePublishText: { color: "#080415", fontWeight: "bold", fontSize: 13 },
  shareStudioContent: { paddingBottom: 60 },
  shareCaptionBlock: { flexDirection: "row", gap: 12, padding: 16, alignItems: "flex-start" },
  shareCaptionArt: { width: 62, height: 62, borderRadius: 10, backgroundColor: "#1a1a2e" },
  shareCaptionInput: { flex: 1, color: "#fff", fontSize: 14, minHeight: 60, textAlignVertical: "top" },
  dividerLine: { height: 0.5, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 16 },
  shareSection: { padding: 16 },
  shareSectionTitle: { color: "#fff", fontSize: 13.5, fontWeight: "bold", marginBottom: 12 },
  taggedProductCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12, gap: 12 },
  taggedProductImg: { width: 56, height: 56, borderRadius: 10 },
  taggedProductMaison: { color: "#00f5ff", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", marginBottom: 2 },
  taggedProductTitle: { color: "#fff", fontSize: 13, fontWeight: "600" },
  taggedProductPrice: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  taggedProductRemoveBtn: { padding: 4 },
  taggedProductPrompt: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  selectProdBtn: { width: 100, marginRight: 10, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 8 },
  selectProdBtnActive: { backgroundColor: "rgba(0,245,255,0.1)", borderWidth: 1.5, borderColor: "#00f5ff" },
  selectProdImg: { width: 70, height: 70, borderRadius: 10, marginBottom: 6 },
  selectProdText: { color: "#fff", fontSize: 11, textAlign: "center", fontWeight: "600" },
  selectProdPrice: { color: "#00f5ff", fontSize: 11, marginTop: 2 },
  commissionLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  rateBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)" },
  rateBtnActive: { backgroundColor: "#00f5ff" },
  rateText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  affiliateHandleInput: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 13 },
  affLinkPreviewCard: { marginTop: 16, backgroundColor: "rgba(0,245,255,0.05)", borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: "rgba(0,245,255,0.3)" },
  affLinkPreviewTitle: { color: "#00f5ff", fontSize: 11, fontWeight: "bold", marginBottom: 6, textTransform: "uppercase" },
  affLinkPreviewText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
