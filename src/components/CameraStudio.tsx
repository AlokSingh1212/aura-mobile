import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { useVideoPlayer, VideoView } from "expo-video";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { AudioSelectorDrawer } from "@/components/AudioSelectorDrawer";
import { ReelTimelineEditor } from "@/components/create/ReelTimelineEditor";
import { AudioSegmentPicker } from "@/components/create/AudioSegmentPicker";
import { PrompterDrawer } from "@/components/create/PrompterDrawer";
import { AlignToolDrawer } from "@/components/create/AlignToolDrawer";
import { ReelLengthDrawer } from "@/components/create/ReelLengthDrawer";
import { EffectsDrawer } from "@/components/create/EffectsDrawer";
import { pickMediaFromLibrary } from "@/lib/createMediaPicker";
import { uploadAndPublish } from "@/lib/publishContent";
import { syncAfterPublish } from "@/hooks/useCreateAuth";
import { resetExportJob, subscribeExportJob, type ExportJob } from "@/lib/exportJob";
import { saveDraft, createEmptyDraft, type ClipSegment } from "@/lib/createDraft";
import { fetchAudioCatalog, type AudioTrack } from "@/lib/audioLibrary";
import {
  DEFAULT_PROMPTER,
  DEFAULT_ALIGN,
  REEL_EFFECTS,
  type PrompterSettings,
  type AlignSettings,
  type ReelLength,
} from "@/constants/reelStudio";

const { height, width } = Dimensions.get("window");

function SharePreviewVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

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

  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [flashMode, setFlashMode] = useState<"off" | "on" | "auto">("off");
  const [recordingSpeed, setRecordingSpeed] = useState<0.3 | 0.5 | 1 | 2 | 3>(1);
  const [countdownDuration, setCountdownDuration] = useState<0 | 3 | 10>(0);
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
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSpeedDrawer, setShowSpeedDrawer] = useState(false);
  const [showCountdownDrawer, setShowCountdownDrawer] = useState(false);
  const [showFlashDrawer, setShowFlashDrawer] = useState(false);
  const [showPrompterDrawer, setShowPrompterDrawer] = useState(false);
  const [showAlignDrawer, setShowAlignDrawer] = useState(false);
  const [showLengthDrawer, setShowLengthDrawer] = useState(false);

  const [showShareStudio, setShowShareStudio] = useState(false);
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
    fetchAudioCatalog().then(({ tracks }) => {
      if (tracks[0] && !selectedAudio) setSelectedAudio(tracks[0]);
    });
  }, [visible]);

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
      const result = await cameraRef.current.recordAsync({ maxDuration: selectedLength });
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
    const asset = await pickMediaFromLibrary("reel");
    if (asset?.uri) {
      await addClip(asset.uri);
    }
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

      const result = await uploadAndPublish(primary.uri, "reel", {
        userId: currentUser.id,
        profileId: activeProfile?.id ?? null,
        profileName: activeProfile?.name ?? currentUser.name ?? "You",
        caption,
        productId: taggedProduct?.id ?? null,
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
            <CameraView ref={cameraRef} style={styles.cameraViewfinder} facing={cameraFacing} mode="video" videoQuality="1080p" />

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

            <View style={[styles.cameraSafe, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6, zIndex: 10 }]}>
              <View style={styles.cameraTopBar}>
                <TouchableOpacity style={styles.cameraCircleBtn} onPress={handleClose}>
                  <Lucide name="close" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={styles.cameraTopRightGroup}>
                  {reelClips.length > 0 && !isRecording && (
                    <TouchableOpacity style={styles.nextBtn} onPress={openShareStudio}>
                      <Text style={styles.nextBtnText}>Next</Text>
                      <Lucide name="arrow-forward" size={16} color="#080415" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.cameraCircleBtn} onPress={() => setShowFlashDrawer(true)}>
                    <Lucide name={flashMode === "off" ? "flash-off" : "flash"} size={23} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraBadgeBtn} onPress={() => setShowSpeedDrawer(true)}>
                    <Text style={styles.cameraBadgeText}>{recordingSpeed}x</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraCircleBtn} onPress={() => setShowCountdownDrawer(true)}>
                    <Lucide name="time-outline" size={23} color={countdownDuration > 0 ? "#00f5ff" : "#fff"} />
                  </TouchableOpacity>
                </View>
              </View>

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
                <View style={styles.cameraLeftToolbar}>
                  {[
                    { label: "Audio", icon: "musical-notes-outline", active: !!selectedAudio, onPress: () => setShowAudioDrawer(true) },
                    { label: "Effects", icon: "sparkles-outline", active: activeFilter !== "none", onPress: () => setShowFilterDrawer(true) },
                    { label: "Prompter", icon: "document-text-outline", active: !!prompter.text, onPress: () => setShowPrompterDrawer(true) },
                    { label: "Align", icon: "copy-outline", active: align.enabled, onPress: () => setShowAlignDrawer(true) },
                    { label: "Length", icon: "timer-outline", active: true, onPress: () => setShowLengthDrawer(true) },
                  ].map((tool) => (
                    <TouchableOpacity key={tool.label} style={styles.cameraToolItem} onPress={() => { triggerHaptic("light"); tool.onPress(); }}>
                      <View style={[styles.cameraToolIconWrap, tool.active && { backgroundColor: "#00f5ff" }]}>
                        <Lucide name={tool.icon as any} size={22} color={tool.active ? "#000" : "#fff"} />
                      </View>
                      <Text style={styles.cameraToolLabel}>{tool.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.cameraBottomWrapper}>
                <View style={styles.cameraBottomContainer}>
                  <TouchableOpacity style={styles.cameraGalleryBtn} onPress={handleGalleryPress}>
                    {previewClip ? (
                      <SharePreviewVideo uri={previewClip.uri} />
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
                <Text style={styles.recordHint}>
                  {reelClips.length === 0
                    ? "Tap to record · add clips · tap Next to edit & share"
                    : `${reelClips.length} clip(s) · tap record to add more`}
                </Text>
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
                  {([0.3, 0.5, 1, 2, 3] as const).map((spd) => (
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
                  {[{ val: 0, label: "Off" }, { val: 3, label: "3s" }, { val: 10, label: "10s" }].map((t) => (
                    <TouchableOpacity key={t.val} style={[styles.strengthItemBtn, countdownDuration === t.val && styles.strengthItemBtnActive]}
                      onPress={() => { setCountdownDuration(t.val as 0 | 3 | 10); setShowCountdownDrawer(false); }}>
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
  permissionText: { color: "rgba(255,255,255,0.6)", fontSize: 15, textAlign: "center", marginBottom: 32 },
  permissionBtn: { backgroundColor: "#00f5ff", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  permissionBtnText: { color: "#080415", fontWeight: "bold", fontSize: 15 },
  permissionCancelBtn: { paddingVertical: 10 },
  permissionCancelText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  cameraSafe: { flex: 1, justifyContent: "space-between" },
  cameraTopBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, alignItems: "center" },
  cameraTopRightGroup: { flexDirection: "row", gap: 8, alignItems: "center" },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#00f5ff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  nextBtnText: { color: "#080415", fontWeight: "800", fontSize: 14 },
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
  cameraLeftToolbar: { position: "absolute", left: 12, top: "30%", gap: 14 },
  cameraToolItem: { alignItems: "center", gap: 3 },
  cameraToolIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  cameraToolLabel: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cameraLengthCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center" },
  cameraLengthText: { color: "#000", fontWeight: "bold", fontSize: 11 },
  cameraBottomWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  cameraBottomContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cameraGalleryBtn: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  cameraRecordOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  cameraRecordOuterRecording: { borderColor: "#ff3b30" },
  cameraRecordInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#ff3b30" },
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
