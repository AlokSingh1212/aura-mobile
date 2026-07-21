import React, { useState, useRef, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, useMicrophonePermissions, CameraRecordingOptions } from "expo-camera";
import { setAudioModeAsync, createAudioPlayer } from "expo-audio";
import { Image } from "expo-image";
import { SafeVideoPlayer } from "@/components/SafeVideoPlayer";
import Lucide from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import { AudioSelectorDrawer } from "@/components/AudioSelectorDrawer";
import { ReelTimelineEditor } from "@/components/create/ReelTimelineEditor";
import { AudioSegmentPicker } from "@/components/create/AudioSegmentPicker";
import { PrompterDrawer } from "@/components/create/PrompterDrawer";
import { AlignToolDrawer } from "@/components/create/AlignToolDrawer";
import { ReelLengthDrawer } from "@/components/create/ReelLengthDrawer";
import { EffectsDrawer } from "@/components/create/EffectsDrawer";
import { getEnforcedSettings } from "@/lib/settingsEnforcement";
import { uploadAndPublish } from "@/lib/publishContent";
import { syncAfterPublish } from "@/hooks/useCreateAuth";
import { resetExportJob, subscribeExportJob, type ExportJob } from "@/lib/exportJob";
import { saveDraft, createEmptyDraft, type ClipSegment } from "@/lib/createDraft";
import { fetchAudioCatalog, type AudioTrack } from "@/lib/audioLibrary";
import {
  DEFAULT_PROMPTER,
  DEFAULT_ALIGN,
  REEL_EFFECTS,
  REEL_PLAYBACK_SPEEDS,
  type PrompterSettings,
  type AlignSettings,
  type ReelLength,
  type ReelCountdownSeconds,
} from "@/constants/reelStudio";
import { API_HOST } from "@/constants/api";
import { CameraSettingsSheet } from "@/components/create/CameraSettingsSheet";
import { loadCameraSettings, type CameraToolbarSide } from "@/lib/cameraSettings";
import { loadRecentGalleryAssets, resolveGalleryUri } from "@/lib/galleryAssets";
import { router } from "expo-router";
import { createProductTagSticker } from "@/lib/productTagUtils";
import { STORY_CANVAS_W, STORY_CANVAS_H } from "@/lib/storyLayers";

const { height, width } = Dimensions.get("window");

type CaptureMode = "post" | "story" | "reel" | "product";

function SharePreviewVideo({ uri }: { uri: string }) {
  return (
    <SafeVideoPlayer
      source={uri}
      playing
      style={{ width: "100%", height: "100%" }}
      contentFit="cover"
    />
  );
}

export interface CameraStudioProps {
  visible: boolean;
  onClose: () => void;
  insets: { top: number; bottom: number };
  products?: any[];
  countdownSeconds?: ReelCountdownSeconds;
  onCountdownChange?: (seconds: ReelCountdownSeconds) => void;
  onPostPublished?: (reelData: any) => void;
}

export const CameraStudio: React.FC<CameraStudioProps> = ({
  visible,
  onClose,
  insets,
  products = [],
  countdownSeconds = 0,
  onCountdownChange,
  onPostPublished,
}) => {
  const { triggerHaptic, currentUser, activeProfile } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);

  const soundRef = useRef<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [audioSearchQuery, setAudioSearchQuery] = useState("");
  const [activeAudioCategory, setActiveAudioCategory] = useState<
    "all" | "trending" | "pop" | "bollywood" | "hiphop" | "electronic" | "house" | "lofi" | "ambient" | "cinematic" | "acoustic"
  >("trending");
  const [audioStartMs, setAudioStartMs] = useState(0);
  const [musicVolume, setMusicVolume] = useState(1);
  const [isMicMuted, setIsMicMuted] = useState(false);

  useEffect(() => {
    if (selectedAudio) {
      setIsMicMuted(true);
    } else {
      setIsMicMuted(false);
    }
  }, [selectedAudio]);

  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [flashMode, setFlashMode] = useState<"off" | "on" | "auto">("off");
  const [recordingSpeed, setRecordingSpeed] = useState<0.5 | 1 | 2>(1);
  const [countdownDuration, setCountdownDuration] = useState<ReelCountdownSeconds>(countdownSeconds);
  const [activeCountdown, setActiveCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [activeFilter, setActiveFilter] = useState("none");
  const [selectedLength, setSelectedLength] = useState<ReelLength>(60);
  const [prompter, setPrompter] = useState<PrompterSettings>(DEFAULT_PROMPTER);
  const [align, setAlign] = useState<AlignSettings>(DEFAULT_ALIGN);
  const teleprompterScrollY = useRef(new Animated.Value(0)).current;
  const teleprompterAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [reelClips, setReelClips] = useState<ClipSegment[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (visible) {
      setCountdownDuration(countdownSeconds);
      AsyncStorage.getItem("@aura/reels_onboarding_seen").then((val) => {
        if (!val) {
          setShowOnboarding(true);
        }
      });
      const creator = getEnforcedSettings()?.creator;
      if (creator?.showPrompterByDefault && !prompter.text) {
        setPrompter((prev) => ({
          ...prev,
          text: DEFAULT_PROMPTER.text,
        }));
      }
    }
  }, [visible, countdownSeconds]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSpeedDrawer, setShowSpeedDrawer] = useState(false);
  const [showCountdownDrawer, setShowCountdownDrawer] = useState(false);
  const [showFlashDrawer, setShowFlashDrawer] = useState(false);
  const [showPrompterDrawer, setShowPrompterDrawer] = useState(false);
  const [showAlignDrawer, setShowAlignDrawer] = useState(false);
  const [showLengthDrawer, setShowLengthDrawer] = useState(false);

  const [showShareStudio, setShowShareStudio] = useState(false);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [toolbarSide, setToolbarSide] = useState<CameraToolbarSide>("right");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("reel");
  const [galleryThumb, setGalleryThumb] = useState<string | null>(null);
  const [taggedProduct, setTaggedProduct] = useState<any>(null);
  const [affiliateCommission, setAffiliateCommission] = useState(10);
  const [affiliateHandle, setAffiliateHandle] = useState("");
  const [reelCaption, setReelCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob>({ phase: "idle", label: "", progress: 0 });

  const previewClip = reelClips.find((c) => c.id === activeClipId) || reelClips[reelClips.length - 1];
  const ghostUri = align.useLastClip ? previewClip?.uri : undefined;
  const activeEffect = REEL_EFFECTS.find((f) => f.id === activeFilter);

  useEffect(() => {
    if (!visible) return;
    return subscribeExportJob(setExportJob);
  }, [visible]);

  // Trigger background wakeup ping to Render worker when camera opens
  useEffect(() => {
    if (visible) {
      fetch(`${API_HOST}/api/mobile/media/compose`)
        .catch(() => {});
    }
  }, [visible]);

  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
        });
      } catch {
        /* ignore */
      }
    };
    if (visible) setupAudioMode();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    loadCameraSettings().then((s) => {
      setCameraFacing(s.defaultFrontCamera ? "front" : "back");
      setToolbarSide(s.toolbarSide || "right");
      setSelectedLength(s.reels.defaultLengthSec);
    });
    loadRecentGalleryAssets(1).then(async (assets) => {
      if (assets[0]) {
        const uri = await resolveGalleryUri(assets[0]);
        setGalleryThumb(uri);
      }
    });
    fetchAudioCatalog().catch(() => {});
  }, [visible]);

  const handleCaptureModeChange = (mode: CaptureMode) => {
    triggerHaptic("light");
    setCaptureMode(mode);
    if (mode === "post") {
      onClose();
      router.push("/create/post");
      return;
    }
    if (mode === "story") {
      onClose();
      router.push("/create/story");
      return;
    }
    if (mode === "product") {
      onClose();
      router.push({ pathname: "/account", params: { openCreate: "product" } } as any);
      return;
    }
  };

  useEffect(() => {
    if (isRecording && prompter.text) {
      teleprompterScrollY.setValue(0);
      const duration = (selectedLength * 1000) / prompter.scrollSpeed;
      teleprompterAnimRef.current = Animated.timing(teleprompterScrollY, {
        toValue: -500,
        duration,
        useNativeDriver: true,
      });
      teleprompterAnimRef.current.start();
    } else {
      teleprompterAnimRef.current?.stop();
      teleprompterScrollY.setValue(0);
    }
  }, [isRecording, prompter, selectedLength]);

  const playTrack = async (url: string) => {
    try {
      soundRef.current?.pause?.();
      soundRef.current?.remove?.();
      if (!url) return;
      const player = createAudioPlayer(url, { downloadFirst: false });
      player.loop = true;
      player.play();
      soundRef.current = player;
      setIsPlayingAudio(true);
    } catch {
      /* ignore */
    }
  };

  const stopTrack = async () => {
    try {
      soundRef.current?.pause?.();
      soundRef.current?.remove?.();
      soundRef.current = null;
      setIsPlayingAudio(false);
    } catch {
      /* ignore */
    }
  };

  const resetStudio = useCallback(() => {
    if (isRecording) cameraRef.current?.stopRecording();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    stopTrack();
    setShowShareStudio(false);
    setIsRecording(false);
    setRecordingProgress(0);
    setReelClips([]);
    setActiveClipId(null);
    setReelCaption("");
    setActiveFilter("none");
    setAudioStartMs(0);
    resetExportJob();
  }, [isRecording]);

  const handleClose = () => {
    resetStudio();
    onClose();
  };

  const addClip = async (uri: string) => {
    const clip: ClipSegment = {
      id: `clip_${Date.now()}`,
      uri,
      inMs: 0,
      outMs: 0,
      playbackRate: recordingSpeed,
    };
    setReelClips((prev) => {
      const next = [...prev, clip];
      return next;
    });
    setActiveClipId(clip.id);
    triggerHaptic("success");

    const draft = createEmptyDraft("reel");
    draft.clips = [...reelClips, clip];
    draft.filterId = activeFilter;
    draft.audio = selectedAudio?.url
      ? { trackId: selectedAudio.id, url: selectedAudio.url, startMs: audioStartMs, volume: musicVolume }
      : undefined;
    await saveDraft(draft);
  };

  const startRealRecording = async () => {
    if (!cameraRef.current) return;

    setIsRecording(true);
    setRecordingProgress(0);
    if (selectedAudio?.url) playTrack(selectedAudio.url);

    const totalMs = selectedLength * 1000;
    const startTime = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setRecordingProgress(Math.min((elapsed / totalMs) * 100, 100));
    }, 200);

    try {
      const result = await cameraRef.current.recordAsync({ 
        maxDuration: selectedLength,
      });
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsRecording(false);
      setRecordingProgress(0);
      stopTrack();
      if (result?.uri) await addClip(result.uri);
    } catch {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsRecording(false);
      setRecordingProgress(0);
      stopTrack();
    }
  };

  const stopRealRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const handleRecordPress = () => {
    triggerHaptic("heavy");
    if (isRecording) {
      stopRealRecording();
      return;
    }
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
  };

  const handleGalleryPress = async () => {
    triggerHaptic("light");
    onClose();
    router.push("/create/reel");
  };

  const handleRemoveClip = (id: string) => {
    setReelClips((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeClipId === id) setActiveClipId(next[next.length - 1]?.id ?? null);
      return next;
    });
  };

  const openShareStudio = () => {
    if (!reelClips.length) {
      Alert.alert("Record first", "Record or import at least one clip.");
      return;
    }
    triggerHaptic("medium");
    setShowShareStudio(true);
  };

  const handlePublish = async () => {
    const primary = reelClips[0];
    if (!primary?.uri) {
      Alert.alert("No video", "Record a reel first.");
      return;
    }
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Sign in to publish reels.");
      return;
    }

    triggerHaptic("heavy");
    setIsPublishing(true);
    resetExportJob();
    try {
      const caption =
        reelCaption.trim() ||
        (taggedProduct ? `${taggedProduct.title} · @${affiliateHandle || "curator"}` : "New reel");

      const productStickers = taggedProduct
        ? [
            {
              productId: taggedProduct.id,
              title: taggedProduct.title || "Product",
              image: taggedProduct.images?.[0] || "",
              price: taggedProduct.price,
            },
          ]
        : [];
      const storyLayers = productStickers.length
        ? [createProductTagSticker(productStickers, STORY_CANVAS_W, STORY_CANVAS_H)]
        : [];

      const result = await uploadAndPublish(primary.uri, "reel", {
        userId: currentUser.id,
        profileId: activeProfile?.id ?? null,
        profileName: activeProfile?.name ?? currentUser.name ?? "You",
        caption,
        productId: taggedProduct?.id ?? null,
        productStickers,
        storyLayers,
        clips: reelClips.length > 1 ? reelClips : undefined,
        audioTrack: selectedAudio?.url
          ? { url: selectedAudio.url, trackId: selectedAudio.id, startMs: audioStartMs, volume: musicVolume }
          : null,
        filterId: activeFilter !== "none" ? activeFilter : undefined,
      });

      syncAfterPublish("reel", result, caption, true);

      onPostPublished?.({
        id: result.contentId || `user_reel_${Date.now()}`,
        url: result.publicUrl,
        caption,
        isVideo: true,
        filterApplied: activeFilter,
        audioTrack: selectedAudio,
        clipCount: reelClips.length,
      });

      resetStudio();
      onClose();
      Alert.alert("Reel published", "Music, filters, and clips are baked into your reel.");
    } catch (err) {
      console.error("[CameraStudio] publish failed:", err);
      Alert.alert("Publish failed", err instanceof Error ? err.message : "Could not upload your reel.");
    } finally {
      setIsPublishing(false);
      resetExportJob();
      stopTrack();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.cameraContainer}>
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
              <Text style={styles.permissionText}>Allow access to record reels with audio.</Text>
              {!permission.granted && (
                <TouchableOpacity style={styles.permissionBtn} onPress={() => requestPermission()}>
                  <Text style={styles.permissionBtnText}>Enable Camera</Text>
                </TouchableOpacity>
              )}
              {!micPermission.granted && (
                <TouchableOpacity style={[styles.permissionBtn, { marginTop: 8 }]} onPress={() => requestMicPermission()}>
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
            <CameraView ref={cameraRef} style={styles.cameraViewfinder} facing={cameraFacing} mode="video" videoQuality="720p" mute={isMicMuted} />

            {flashMode === "on" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderWidth: 20, borderColor: "#fffaf0", backgroundColor: "rgba(255,250,240,0.15)", zIndex: 4 }]} />
            )}

            {align.enabled && ghostUri && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}>
                <Image source={{ uri: ghostUri }} style={[StyleSheet.absoluteFillObject, { opacity: align.opacity / 100 }]} contentFit="cover" />
              </View>
            )}

            {isCountingDown && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownTimerText}>{activeCountdown}</Text>
              </View>
            )}

            {activeEffect && activeEffect.previewColor !== "transparent" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: activeEffect.previewColor, zIndex: 1 }]} />
            )}

            <View style={[styles.cameraSafe, { paddingTop: insets.top + 2, paddingBottom: insets.bottom + 6, zIndex: 10 }]}>
              <View style={styles.cameraTopBar}>
                <TouchableOpacity style={styles.cameraCircleBtn} onPress={handleClose}>
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>

                <View style={styles.cameraTopCenterGroup}>
                  <TouchableOpacity style={styles.cameraCircleBtn} onPress={() => setShowFlashDrawer(true)}>
                    <Lucide name={flashMode === "off" ? "flash-off" : "flash"} size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraBadgeBtn} onPress={() => setShowSpeedDrawer(true)}>
                    <Text style={styles.cameraBadgeText}>{recordingSpeed === 1 ? "1x" : `${recordingSpeed}x`}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraCircleBtn} onPress={() => setShowCountdownDrawer(true)}>
                    <Lucide name="time-outline" size={22} color={countdownDuration > 0 ? "#00f5ff" : "#fff"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.cameraTopRightGroup}>
                  {reelClips.length > 0 && !isRecording ? (
                    <TouchableOpacity style={styles.nextBtnCompact} onPress={openShareStudio}>
                      <Text style={styles.nextBtnText}>Next</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.cameraCircleBtn} onPress={() => setShowCameraSettings(true)}>
                    <Lucide name="settings-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {!selectedAudio && !isRecording ? (
                <TouchableOpacity style={styles.addAudioPill} onPress={() => setShowAudioDrawer(true)}>
                  <Lucide name="musical-notes" size={16} color="#fff" />
                  <Text style={styles.addAudioPillText}>Add audio</Text>
                </TouchableOpacity>
              ) : null}

              {isRecording && (
                <View style={styles.recordingProgressContainer}>
                  <View style={[styles.recordingProgressBar, { width: `${recordingProgress}%` as `${number}%` }]} />
                </View>
              )}

              {reelClips.length > 0 && !showShareStudio && (
                <View style={styles.clipSegmentsRow}>
                  {reelClips.map((clip) => (
                    <View
                      key={clip.id}
                      style={[styles.clipSegment, activeClipId === clip.id && styles.clipSegmentActive]}
                    />
                  ))}
                </View>
              )}

              {prompter.text && isRecording && (
                <View style={[
                  styles.teleprompterBox,
                  prompter.position === "top" && { marginTop: 0 },
                  prompter.position === "bottom" && { marginBottom: 120 },
                ]}>
                  <Animated.Text style={[
                    styles.teleprompterScrollText,
                    { fontSize: prompter.fontSize, transform: [{ translateY: teleprompterScrollY }] },
                  ]}>
                    {prompter.text}
                  </Animated.Text>
                </View>
              )}

              {selectedAudio && !isRecording && (
              <TouchableOpacity style={styles.suggestedAudioBubble} onPress={() => setShowAudioDrawer(true)}>
                <Image source={{ uri: selectedAudio.cover }} style={styles.suggestedAudioArt} />
                <View style={styles.suggestedAudioTextWrap}>
                  <Text style={styles.suggestedAudioTitle} numberOfLines={1}>{selectedAudio.title}</Text>
                  <Text style={styles.suggestedAudioSub} numberOfLines={1}>{selectedAudio.artist} · tap to browse library</Text>
                </View>
                <Lucide name="chevron-forward" size={17} color="#fff" />
              </TouchableOpacity>
              )}

              {!isRecording && (
                <View style={[styles.cameraSideToolbar, toolbarSide === "right" ? styles.cameraSideToolbarRight : styles.cameraSideToolbarLeft]}>
                  {[
                    { label: "Audio", icon: "musical-notes-outline", active: !!selectedAudio, onPress: () => setShowAudioDrawer(true) },
                    { label: "Effects", icon: "sparkles-outline", active: activeFilter !== "none", onPress: () => setShowFilterDrawer(true) },
                    { label: "Length", icon: "timer-outline", active: true, onPress: () => setShowLengthDrawer(true), isLength: true },
                    { label: "Green Screen", icon: "person-outline", active: align.enabled, onPress: () => setShowAlignDrawer(true) },
                    { label: "Teleprompter", icon: "document-text-outline", badge: "NEW", active: !!prompter.text, onPress: () => setShowPrompterDrawer(true) },
                    { label: "Touch Up", icon: "color-wand-outline", badge: "NEW", active: activeFilter !== "none", onPress: () => setShowFilterDrawer(true) },
                  ].map((tool) => (
                    <TouchableOpacity
                      key={tool.label}
                      style={[styles.cameraToolItem, { flexDirection: toolbarSide === "left" ? "row" : "row-reverse", justifyContent: "flex-start" }]}
                      onPress={() => { triggerHaptic("light"); tool.onPress(); }}
                    >
                      {"isLength" in tool && tool.isLength ? (
                        <View style={styles.cameraLengthCircle}>
                          <Text style={styles.cameraLengthText}>{selectedLength}</Text>
                        </View>
                      ) : (
                        <View style={[styles.cameraToolIconWrap, tool.active && styles.cameraToolIconWrapActive]}>
                          <Lucide name={tool.icon as any} size={19} color="#fff" />
                        </View>
                      )}

                      <Text style={styles.cameraToolLabelLeft}>{tool.label}</Text>

                      {"badge" in tool && tool.badge === "NEW" ? (
                        <View style={[styles.toolNewBadge, toolbarSide === "left" ? { left: 22, right: undefined } : { right: 22, left: undefined }]}>
                          <Text style={styles.toolNewBadgeText}>NEW</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.cameraBottomContainerParent}>
                <View style={styles.cameraBottomWrapper}>
                  <View style={styles.cameraBottomContainer}>
                    <TouchableOpacity style={styles.cameraGalleryBtn} onPress={handleGalleryPress}>
                      {galleryThumb ? (
                        <Image source={{ uri: galleryThumb }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      ) : previewClip ? (
                        <Image source={{ uri: previewClip.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      ) : (
                        <Lucide name="images-outline" size={24} color="#fff" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.cameraRecordOuter, isRecording && styles.cameraRecordOuterRecording]}
                      onPress={handleRecordPress}
                    >
                      <View style={[styles.cameraRecordInner, isRecording && styles.cameraRecordInnerRecording]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cameraFlipBtn}
                      onPress={() => setCameraFacing((p) => (p === "back" ? "front" : "back"))}
                    >
                      <Lucide name="camera-reverse-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.modeSelectorRow}
                  contentContainerStyle={styles.modeSelectorScrollView}
                >
                  {(
                    [
                      { key: "post" as const, label: "POST" },
                      { key: "story" as const, label: "STORY" },
                      { key: "reel" as const, label: "REEL" },
                      { key: "product" as const, label: "ADD PRODUCT" },
                    ] as const
                  ).map((mode) => (
                    <TouchableOpacity
                      key={mode.key}
                      onPress={() => handleCaptureModeChange(mode.key)}
                      style={styles.modeSelectorItem}
                    >
                      <Text style={[styles.modeSelectorText, captureMode === mode.key && styles.modeSelectorTextActive]}>
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

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

            {showFilterDrawer && (
              <EffectsDrawer
                activeFilter={activeFilter}
                onSelect={(id) => { setActiveFilter(id); setShowFilterDrawer(false); }}
                onClose={() => setShowFilterDrawer(false)}
              />
            )}

            {showPrompterDrawer && (
              <PrompterDrawer
                settings={prompter}
                onChange={setPrompter}
                onClose={() => setShowPrompterDrawer(false)}
              />
            )}

            {showAlignDrawer && (
              <AlignToolDrawer
                settings={align}
                onChange={setAlign}
                hasGhostClip={!!ghostUri}
                onClose={() => setShowAlignDrawer(false)}
              />
            )}

            {showLengthDrawer && (
              <ReelLengthDrawer
                selectedLength={selectedLength}
                onSelect={(len) => { setSelectedLength(len); setShowLengthDrawer(false); }}
                clipCount={reelClips.length}
                onClose={() => setShowLengthDrawer(false)}
              />
            )}

            {showFlashDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Flash</Text>
                  <TouchableOpacity onPress={() => setShowFlashDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 20, flexDirection: "row", gap: 12, justifyContent: "center" }}>
                  {(["off", "on", "auto"] as const).map((m) => (
                    <TouchableOpacity key={m} style={[styles.strengthItemBtn, flashMode === m && styles.strengthItemBtnActive]}
                      onPress={() => { setFlashMode(m); setShowFlashDrawer(false); }}>
                      <Text style={[styles.strengthItemText, flashMode === m && { color: "#000" }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {showSpeedDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Speed (preview)</Text>
                  <TouchableOpacity onPress={() => setShowSpeedDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 20, flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {REEL_PLAYBACK_SPEEDS.map((spd) => (
                    <TouchableOpacity key={spd} style={[styles.strengthItemBtn, recordingSpeed === spd && styles.strengthItemBtnActive]}
                      onPress={() => { setRecordingSpeed(spd); setShowSpeedDrawer(false); }}>
                      <Text style={[styles.strengthItemText, recordingSpeed === spd && { color: "#000" }]}>{spd}x</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {showCountdownDrawer && (
              <View style={styles.cameraOverlayDrawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Timer</Text>
                  <TouchableOpacity onPress={() => setShowCountdownDrawer(false)}><Lucide name="close-circle" size={24} color="#00f5ff" /></TouchableOpacity>
                </View>
                <View style={{ padding: 20, flexDirection: "row", gap: 12, justifyContent: "center" }}>
                  {[{ val: 0, label: "Off" }, { val: 3, label: "3s" }, { val: 5, label: "5s" }, { val: 10, label: "10s" }].map((t) => (
                    <TouchableOpacity key={t.val} style={[styles.strengthItemBtn, countdownDuration === t.val && styles.strengthItemBtnActive]}
                      onPress={() => {
                        const next = t.val as ReelCountdownSeconds;
                        setCountdownDuration(next);
                        onCountdownChange?.(next);
                        setShowCountdownDrawer(false);
                      }}>
                      <Text style={[styles.strengthItemText, countdownDuration === t.val && { color: "#000" }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {showShareStudio && (
              <View style={[styles.shareStudioOverlay, { paddingTop: insets.top }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.shareHeaderRow}>
                    <TouchableOpacity onPress={() => setShowShareStudio(false)}>
                      <Lucide name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.shareHeaderTitle}>Edit reel</Text>
                    <TouchableOpacity style={[styles.sharePublishBtn, isPublishing && styles.sharePublishBtnDisabled]} disabled={isPublishing} onPress={handlePublish}>
                      {isPublishing ? <ActivityIndicator size="small" color="#080415" /> : <Text style={styles.sharePublishText}>Share</Text>}
                    </TouchableOpacity>
                  </View>

                  {exportJob.phase !== "idle" && exportJob.phase !== "done" && (
                    <View style={styles.exportBar}>
                      <ActivityIndicator size="small" color="#00f5ff" />
                      <Text style={styles.exportBarText}>{exportJob.label} {exportJob.progress > 0 ? `${exportJob.progress}%` : ""}</Text>
                    </View>
                  )}

                  <ScrollView contentContainerStyle={styles.shareStudioContent}>
                    <View style={styles.sharePreviewLarge}>
                      {previewClip ? <SharePreviewVideo uri={previewClip.uri} /> : null}
                    </View>

                    <ReelTimelineEditor
                      clips={reelClips}
                      activeClipId={activeClipId}
                      onSelectClip={setActiveClipId}
                      onAddClip={handleGalleryPress}
                      onRemoveClip={handleRemoveClip}
                      filterId={activeFilter}
                      onFilterChange={(id) => setActiveFilter(id as typeof activeFilter)}
                    />

                    <TouchableOpacity style={styles.musicRow} onPress={() => setShowAudioDrawer(true)}>
                      <Lucide name="musical-notes" size={20} color="#00f5ff" />
                      <Text style={styles.musicRowText}>{selectedAudio?.title ?? "Choose music"}</Text>
                      <Text style={styles.musicRowChange}>Change</Text>
                    </TouchableOpacity>

                    {selectedAudio && (
                    <AudioSegmentPicker
                      durationMs={selectedAudio.durationMs}
                      startMs={audioStartMs}
                      onChange={setAudioStartMs}
                      trackTitle={selectedAudio.title}
                    />
                    )}

                    <View style={styles.volumeRow}>
                      <Text style={styles.volumeLabel}>Music volume</Text>
                      <View style={styles.volumeBtns}>
                        {[0.5, 0.75, 1].map((v) => (
                          <TouchableOpacity key={v} style={[styles.volumeBtn, musicVolume === v && styles.volumeBtnActive]} onPress={() => setMusicVolume(v)}>
                            <Text style={styles.volumeBtnText}>{Math.round(v * 100)}%</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.shareCaptionBlock}>
                      <TextInput
                        style={styles.shareCaptionInput}
                        placeholder="Write a caption..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={reelCaption}
                        onChangeText={setReelCaption}
                        multiline
                      />
                    </View>

                    {products.length > 0 && (
                      <>
                        <View style={styles.dividerLine} />
                        <View style={styles.shareSection}>
                          <Text style={styles.shareSectionTitle}>Tag product (optional)</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {products.slice(0, 8).map((p: { id: string; title?: string; price?: number; images?: string[] }) => (
                              <TouchableOpacity
                                key={p.id}
                                style={[styles.selectProdBtn, taggedProduct?.id === p.id && styles.selectProdBtnActive]}
                                onPress={() => setTaggedProduct(p)}
                              >
                                <Image source={{ uri: p.images?.[0] }} style={styles.selectProdImg} />
                                <Text style={styles.selectProdText} numberOfLines={1}>{p.title}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </>
                    )}
                  </ScrollView>
                </View>
              </View>
            )}
            <CameraSettingsSheet visible={showCameraSettings} onClose={() => setShowCameraSettings(false)} />
            {/* Onboarding Dialog Overlay */}
            {showOnboarding && (
              <LinearGradient
                colors={["rgba(8, 4, 21, 0.7)", "#080415"]}
                style={styles.onboardingOverlay}
                pointerEvents="auto"
              >
                <SafeAreaView style={styles.onboardingContainer}>
                  {/* Close Button */}
                  <TouchableOpacity 
                    style={styles.onboardingCloseBtn} 
                    onPress={() => { triggerHaptic("light"); handleClose(); }}
                  >
                    <Lucide name="close" size={24} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.onboardingHeader}>
                    {/* Reels Clapboard Icon */}
                    <View style={styles.onboardingIconCircle}>
                      <Lucide name="film" size={40} color="#00f5ff" />
                    </View>

                    {/* Title */}
                    <Text style={styles.onboardingTitle}>Create with Auragram Reels</Text>

                    {/* Subtitle */}
                    <Text style={styles.onboardingSub}>
                      Show off your aesthetic, tag collections, and explore digital fashion curations with the community.
                    </Text>
                  </View>

                  {/* Features List */}
                  <View style={styles.onboardingFeaturesList}>
                    <View style={styles.onboardingFeatureItem}>
                      <View style={styles.onboardingFeatureIconWrap}>
                        <Lucide name="shirt-outline" size={22} color="#00f5ff" />
                      </View>
                      <View style={styles.onboardingFeatureTextWrap}>
                        <Text style={styles.onboardingFeatureTitle}>Premium Curations</Text>
                        <Text style={styles.onboardingFeatureDesc}>
                          Share your luxury lookbooks, fashion edits, and unique style inspirations.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.onboardingFeatureItem}>
                      <View style={styles.onboardingFeatureIconWrap}>
                        <Lucide name="pricetag-outline" size={22} color="#00f5ff" />
                      </View>
                      <View style={styles.onboardingFeatureTextWrap}>
                        <Text style={styles.onboardingFeatureTitle}>Interactive Tagging</Text>
                        <Text style={styles.onboardingFeatureDesc}>
                          Tag products directly in your Reels. Allow your audience to shop your curations instantly.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.onboardingFeatureItem}>
                      <View style={styles.onboardingFeatureIconWrap}>
                        <Lucide name="sparkles-outline" size={22} color="#00f5ff" />
                      </View>
                      <View style={styles.onboardingFeatureTextWrap}>
                        <Text style={styles.onboardingFeatureTitle}>AI Fashion & Styling</Text>
                        <Text style={styles.onboardingFeatureDesc}>
                          Blend digital styling and AI-powered overlays to create next-generation content.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.onboardingFooter}>
                    {/* Privacy details */}
                    <Text style={styles.onboardingDetails}>
                      By using Reels, your content will be shared to the public Auragram feed. Anyone can view, share, or purchase tagged items. Manage your audience settings anytime.
                    </Text>

                    {/* Get Started Button */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.onboardingBtn}
                      onPress={async () => {
                        triggerHaptic("heavy");
                        try {
                          await AsyncStorage.setItem("@aura/reels_onboarding_seen", "true");
                        } catch {}
                        setShowOnboarding(false);
                      }}
                    >
                      <Text style={styles.onboardingBtnText}>Get started</Text>
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </LinearGradient>
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
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  onboardingContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 24,
  },
  onboardingCloseBtn: {
    position: "absolute",
    top: 48,
    right: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100000,
  },
  onboardingHeader: {
    alignItems: "center",
    marginTop: 64,
  },
  onboardingIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(0, 245, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  onboardingTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  onboardingSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  onboardingFeaturesList: {
    marginVertical: 20,
    gap: 20,
  },
  onboardingFeatureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  onboardingFeatureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  onboardingFeatureTextWrap: {
    flex: 1,
  },
  onboardingFeatureTitle: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  onboardingFeatureDesc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12.5,
    lineHeight: 18,
  },
  onboardingFooter: {
    width: "100%",
    alignItems: "center",
  },
  onboardingDetails: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  onboardingBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 26,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  onboardingBtnText: {
    color: "#080415",
    fontSize: 15,
    fontWeight: "bold",
  },
  permissionContainer: { flex: 1, backgroundColor: "#080415" },
  permissionIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(0,245,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  permissionTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  permissionText: { color: "rgba(255,255,255,0.6)", fontSize: 15, textAlign: "center", marginBottom: 32 },
  permissionBtn: { backgroundColor: "#00f5ff", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  permissionBtnText: { color: "#080415", fontWeight: "bold", fontSize: 15 },
  permissionCancelBtn: { paddingVertical: 10 },
  permissionCancelText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  cameraSafe: { flex: 1, justifyContent: "space-between" },
  cameraTopBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6, alignItems: "center" },
  cameraTopCenterGroup: { flexDirection: "row", gap: 8, alignItems: "center" },
  cameraTopRightGroup: { flexDirection: "row", gap: 8, alignItems: "center", minWidth: 88, justifyContent: "flex-end" },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#00f5ff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  nextBtnCompact: { backgroundColor: "#00f5ff", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  nextBtnText: { color: "#080415", fontWeight: "800", fontSize: 14 },
  addAudioPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    marginTop: 8,
    marginBottom: 4,
  },
  addAudioPillText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  cameraCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  cameraBadgeBtn: { backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  cameraBadgeText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  recordingProgressContainer: { height: 3, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 16, borderRadius: 2 },
  recordingProgressBar: { height: "100%", backgroundColor: "#ff3b30", borderRadius: 2 },
  clipSegmentsRow: { flexDirection: "row", marginHorizontal: 16, height: 4, gap: 3, marginTop: 8 },
  clipSegment: { flex: 1, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 2 },
  clipSegmentActive: { backgroundColor: "#00f5ff" },
  teleprompterBox: { marginHorizontal: 16, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 14, padding: 12, maxHeight: 100, overflow: "hidden" },
  teleprompterScrollText: { color: "#fff", fontSize: 16, lineHeight: 24, fontWeight: "600", textAlign: "center" },
  suggestedAudioBubble: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginLeft: 68, marginRight: 16, gap: 10 },
  suggestedAudioArt: { width: 28, height: 28, borderRadius: 6 },
  suggestedAudioTextWrap: { flex: 1 },
  suggestedAudioTitle: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  suggestedAudioSub: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  cameraSideToolbar: { position: "absolute", top: "18%", gap: 10 },
  cameraSideToolbarLeft: { left: 12 },
  cameraSideToolbarRight: { right: 12 },
  cameraToolItem: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" },
  cameraToolLabelLeft: { color: "#fff", fontSize: 11, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 },
  toolNewBadge: {
    position: "absolute",
    top: -10,
    right: 28,
    backgroundColor: "#0095f6",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  toolNewBadgeText: { color: "#fff", fontSize: 7, fontWeight: "800" },
  cameraToolIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  cameraToolIconWrapActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  cameraToolLabel: { color: "#fff", fontSize: 9, fontWeight: "600" },
  modeSelectorRow: {
    maxHeight: 50,
    marginVertical: 4,
  },
  modeSelectorScrollView: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: "100%",
    paddingHorizontal: 20,
  },
  modeSelectorItem: {
    marginHorizontal: 12,
    paddingVertical: 8,
  },
  modeSelectorText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  modeSelectorTextActive: { color: "#fff", fontSize: 14 },
  cameraLengthCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center" },
  cameraLengthText: { color: "#000", fontWeight: "bold", fontSize: 11 },
  cameraBottomContainerParent: {
    width: "100%",
  },
  cameraBottomWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  cameraBottomContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cameraGalleryBtn: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  cameraRecordOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  cameraRecordOuterRecording: { borderColor: "#ff3b30" },
  cameraRecordInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#fff" },
  cameraRecordInnerRecording: { width: 30, height: 30, borderRadius: 6 },
  cameraFlipBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  recordHint: { color: "rgba(255,255,255,0.45)", fontSize: 11, textAlign: "center", marginTop: 10 },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, alignItems: "center", justifyContent: "center" },
  countdownTimerText: { color: "#00f5ff", fontSize: 80, fontWeight: "900" },
  cameraOverlayDrawer: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: 360, backgroundColor: "#080415", borderTopLeftRadius: 28, borderTopRightRadius: 28, zIndex: 999 },
  drawerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, marginBottom: 12 },
  drawerTitle: { color: "#fff", fontSize: 13, fontWeight: "bold", textTransform: "uppercase" },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, justifyContent: "center", paddingBottom: 24 },
  filterGridItem: { width: 100, height: 90, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", gap: 6 },
  filterGridItemActive: { backgroundColor: "rgba(0,245,255,0.12)", borderWidth: 1.5, borderColor: "#00f5ff" },
  filterGridLabel: { color: "#fff", fontSize: 11, fontWeight: "600" },
  strengthItemBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  strengthItemBtnActive: { backgroundColor: "#00f5ff" },
  strengthItemText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  shareStudioOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#080415", zIndex: 100 },
  shareHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  shareHeaderTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sharePublishBtn: { backgroundColor: "#00f5ff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  sharePublishBtnDisabled: { opacity: 0.5 },
  sharePublishText: { color: "#080415", fontWeight: "bold", fontSize: 13 },
  exportBar: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "rgba(0,245,255,0.08)" },
  exportBarText: { color: "#00f5ff", fontSize: 13, fontWeight: "600" },
  shareStudioContent: { paddingBottom: 48 },
  sharePreviewLarge: { width: width * 0.55, height: width * 0.55 * (16 / 9), alignSelf: "center", marginVertical: 16, borderRadius: 12, overflow: "hidden", backgroundColor: "#111" },
  musicRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12 },
  musicRowText: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  musicRowChange: { color: "#00f5ff", fontWeight: "700" },
  volumeRow: { marginHorizontal: 16, marginTop: 8 },
  volumeLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 },
  volumeBtns: { flexDirection: "row", gap: 8 },
  volumeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)" },
  volumeBtnActive: { backgroundColor: "rgba(0,245,255,0.2)", borderWidth: 1, borderColor: "#00f5ff" },
  volumeBtnText: { color: "#fff", fontWeight: "600" },
  shareCaptionBlock: { padding: 16 },
  shareCaptionInput: { color: "#fff", fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  dividerLine: { height: 0.5, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 16 },
  shareSection: { padding: 16 },
  shareSectionTitle: { color: "#fff", fontSize: 13, fontWeight: "bold", marginBottom: 10 },
  selectProdBtn: { width: 90, marginRight: 10, alignItems: "center", padding: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)" },
  selectProdBtnActive: { borderWidth: 1.5, borderColor: "#00f5ff" },
  selectProdImg: { width: 64, height: 64, borderRadius: 8, marginBottom: 4 },
  selectProdText: { color: "#fff", fontSize: 10, textAlign: "center" },
});
