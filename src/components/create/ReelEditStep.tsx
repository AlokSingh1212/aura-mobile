import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SafeVideoPlayer } from "@/components/SafeVideoPlayer";
import Lucide from "@expo/vector-icons/Ionicons";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { AudioSelectorDrawer, type AudioCategory } from "@/components/AudioSelectorDrawer";
import { fetchAudioCatalog, type AudioTrack } from "@/lib/audioLibrary";
import { ReelTimelineEditor } from "@/components/create/ReelTimelineEditor";
import { AudioSegmentPicker } from "@/components/create/AudioSegmentPicker";
import type { ClipSegment } from "@/lib/createDraft";
import { REEL_EFFECTS, REEL_PLAYBACK_SPEEDS } from "@/constants/reelStudio";

const { width, height } = Dimensions.get("window");

function ClipPreview({ uri, isMuted, playbackRate }: { uri: string; isMuted: boolean; playbackRate: number }) {
  return (
    <SafeVideoPlayer
      source={uri}
      muted={isMuted}
      playing
      playbackRate={playbackRate}
      style={styles.previewVideo}
      contentFit="contain"
    />
  );
}

interface ReelEditStepProps {
  clips: ClipSegment[];
  activeClipId: string | null;
  filterId: string;
  onClipsChange: (clips: ClipSegment[]) => void;
  onActiveClipChange: (id: string | null) => void;
  onFilterChange: (id: string) => void;
  onAddClip: () => void;
  onRemoveClip: (id: string) => void;
  selectedAudio: AudioTrack | null;
  onAudioChange: (track: AudioTrack | null) => void;
  audioStartMs: number;
  onAudioStartMsChange: (ms: number) => void;
  onClose: () => void;
  onNext: () => void;
}

export function ReelEditStep({
  clips,
  activeClipId,
  filterId,
  onClipsChange,
  onActiveClipChange,
  onFilterChange,
  onAddClip,
  onRemoveClip,
  selectedAudio,
  onAudioChange,
  audioStartMs,
  onAudioStartMsChange,
  onClose,
  onNext,
}: ReelEditStepProps) {
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [audioSearchQuery, setAudioSearchQuery] = useState("");
  const [activeAudioCategory, setActiveAudioCategory] = useState<AudioCategory>("trending");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const soundRef = useRef<any>(null);

  // Functional Editing States
  const [activeEditTool, setActiveEditTool] = useState<string | null>(null);
  const [isOriginalMuted, setIsOriginalMuted] = useState(false);
  const [isVoiceoverEnabled, setIsVoiceoverEnabled] = useState(false);
  const [textOverlay, setTextOverlay] = useState<string | null>(null);
  const [textOverlayColor, setTextOverlayColor] = useState("#ffffff");
  const [overlaySticker, setOverlaySticker] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("luxury");
  const [currentCaptionText, setCurrentCaptionText] = useState("✨ AURAGRAM Quiet Luxury Collection ✨");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);

  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0];
  const activeEffect = REEL_EFFECTS.find((f) => f.id === filterId);
  const activePlaybackRate = activeClip?.playbackRate ?? 1;
  const trackRef = useRef<View>(null);

  const setClipPlaybackRate = (rate: number) => {
    if (!activeClip) return;
    onClipsChange(
      clips.map((c) => (c.id === activeClip.id ? { ...c, playbackRate: rate } : c))
    );
  };

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    fetchAudioCatalog().then(({ tracks }) => {
      if (!selectedAudio && tracks[0]) onAudioChange(tracks[0]);
    });
  }, []);

  const playTrack = async (url: string) => {
    try {
      soundRef.current?.pause?.();
      soundRef.current?.remove?.();
      const player = createAudioPlayer(url, { downloadFirst: false });
      player.loop = true;
      player.play();
      soundRef.current = player;
      setIsPlayingAudio(true);
    } catch {
      /* ignore */
    }
  };

  const stopTrack = () => {
    soundRef.current?.pause?.();
    soundRef.current?.remove?.();
    soundRef.current = null;
    setIsPlayingAudio(false);
  };

  const tools = [
    { key: "audio", label: "Audio", icon: "musical-notes-outline", onPress: () => { setActiveEditTool(null); setShowAudioDrawer(true); } },
    { key: "text", label: "Text", icon: "text-outline", onPress: () => setActiveEditTool(activeEditTool === "text" ? null : "text") },
    { key: "voice", label: "Voice", icon: "mic-outline", badge: "NEW", onPress: () => setActiveEditTool(activeEditTool === "voice" ? null : "voice") },
    { key: "captions", label: "Captions", icon: "document-text-outline", onPress: () => setActiveEditTool(activeEditTool === "captions" ? null : "captions") },
    { key: "overlay", label: "Overlay", icon: "layers-outline", onPress: () => setActiveEditTool(activeEditTool === "overlay" ? null : "overlay") },
  ];

  const moreTools = [
    { key: "effects", label: "Effects", icon: "sparkles-outline", onPress: () => setActiveEditTool(activeEditTool === "effects" ? null : "effects") },
    { key: "trim", label: "Trim", icon: "cut-outline", onPress: () => setActiveEditTool(activeEditTool === "trim" ? null : "trim") },
    { key: "speed", label: "Speed", icon: "speedometer-outline", onPress: () => setActiveEditTool(activeEditTool === "speed" ? null : "speed") },
  ];

  const handleRemoveClip = (id: string) => {
    if (clips.length <= 1) {
      Alert.alert("Failed", "You must have at least one clip remaining.");
      return;
    }
    onRemoveClip(id);
  };

  const handleTrackTouch = (event: any) => {
    const pageX = event.nativeEvent.pageX;
    trackRef.current?.measure((x, y, w, h, px, py) => {
      const relativeX = pageX - px;
      const pct = Math.max(0, Math.min(1, relativeX / w));
      const value = Number((pct * 15).toFixed(1));
      
      if (Math.abs(value - trimStart) < Math.abs(value - trimEnd)) {
        setTrimStart(Math.min(trimEnd - 0.5, value));
      } else {
        setTrimEnd(Math.max(trimStart + 0.5, value));
      }
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Lucide name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      {/* Video Preview Block with Real-time Filters & Overlays */}
      <View style={styles.previewWrap}>
        {activeClip ? (
          <ClipPreview uri={activeClip.uri} isMuted={isOriginalMuted} playbackRate={activePlaybackRate} />
        ) : null}

        {activePlaybackRate !== 1 ? (
          <View style={styles.speedBadge} pointerEvents="none">
            <Text style={styles.speedBadgeText}>{activePlaybackRate}x</Text>
          </View>
        ) : null}

        {/* Real-time Filter Tint Overlay */}
        {activeEffect && activeEffect.previewColor !== "transparent" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: activeEffect.previewColor, zIndex: 1 }]} />
        )}

        {/* Real-time Custom Text Overlay */}
        {textOverlay && (
          <View style={[styles.textOverlayContainer, { zIndex: 2 }]} pointerEvents="none">
            <Text style={[styles.textOverlayText, { color: textOverlayColor }]}>{textOverlay}</Text>
          </View>
        )}

        {/* Real-time Custom Sticker Overlay */}
        {overlaySticker && (
          <View style={[styles.stickerOverlayContainer, { zIndex: 2 }]} pointerEvents="none">
            <View style={styles.stickerBadge}>
              <Text style={styles.stickerBadgeText}>{overlaySticker}</Text>
            </View>
          </View>
        )}

        {/* Real-time Auto Captions Overlay */}
        {showCaptions && (
          <View style={[styles.captionsOverlayContainer, { zIndex: 2 }]} pointerEvents="none">
            <Text style={styles.captionsText}>{currentCaptionText}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.expandTools} onPress={() => setShowMoreTools((v) => !v)}>
        <Lucide name={showMoreTools ? "chevron-down" : "chevron-up"} size={22} color="#fff" />
      </TouchableOpacity>

      {/* Vertical ScrollView enclosing Tools & Timeline to prevent cutting off */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Core Tools Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsRow}>
          {tools.map((tool) => (
            <TouchableOpacity 
              key={tool.key} 
              style={[styles.toolItem, activeEditTool === tool.key && styles.toolItemActive]} 
              onPress={tool.onPress}
            >
              {"badge" in tool && tool.badge ? (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>{tool.badge}</Text>
                </View>
              ) : null}
              <Lucide name={tool.icon as any} size={24} color={activeEditTool === tool.key ? "#00f5ff" : "#fff"} />
              <Text style={[styles.toolLabel, activeEditTool === tool.key && { color: "#00f5ff" }]}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Expanded Extra Tools Row */}
        {showMoreTools ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.toolsRow, { marginTop: 8 }]}>
            {moreTools.map((tool) => (
              <TouchableOpacity 
                key={tool.key} 
                style={[styles.toolItem, activeEditTool === tool.key && styles.toolItemActive]} 
                onPress={tool.onPress}
              >
                <Lucide name={tool.icon as any} size={24} color={activeEditTool === tool.key ? "#00f5ff" : "#fff"} />
                <Text style={[styles.toolLabel, activeEditTool === tool.key && { color: "#00f5ff" }]}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {/* ─── DYNAMIC EDITING PANELS ─── */}

        {/* Clip Manager (toggled by Edit Video button) */}
        {activeEditTool === "clip_manager" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Manage Clips</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clipManagerRow}>
              {clips.map((clip, idx) => (
                <View key={clip.id} style={styles.clipManagerItem}>
                  <Text style={styles.clipManagerIndex}>Clip {idx + 1}</Text>
                  <TouchableOpacity style={styles.clipManagerDelete} onPress={() => handleRemoveClip(clip.id)}>
                    <Lucide name="trash-outline" size={14} color="#ff3b30" />
                    <Text style={{ color: "#ff3b30", fontSize: 10, fontWeight: "700" }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.clipManagerAdd} onPress={onAddClip}>
                <Lucide name="add-circle-outline" size={20} color="#00f5ff" />
                <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "700" }}>Add Clip</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Text Editor Panel */}
        {activeEditTool === "text" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Text Overlay</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.textPanelInput}
                placeholder="Enter custom text..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={textOverlay || ""}
                onChangeText={(val) => setTextOverlay(val.trim() ? val : null)}
              />
              {textOverlay ? (
                <TouchableOpacity onPress={() => setTextOverlay(null)}>
                  <Lucide name="trash" size={20} color="#ff3b30" />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.colorRow}>
              {["#ffffff", "#00f5ff", "#bf5af2", "#ffd60a", "#30d158", "#ff453a"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorBubble, { backgroundColor: c }, textOverlayColor === c && styles.colorBubbleActive]}
                  onPress={() => setTextOverlayColor(c)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Voice Controls Panel */}
        {activeEditTool === "voice" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Audio controls</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            <View style={styles.audioToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.audioToggleLabel}>Mute Original Voice</Text>
                <Text style={styles.audioToggleDesc}>Mutes the original sound recorded with the video.</Text>
              </View>
              <Switch
                value={isOriginalMuted}
                onValueChange={setIsOriginalMuted}
                trackColor={{ false: "#333", true: "rgba(0,245,255,0.35)" }}
                thumbColor={isOriginalMuted ? "#00f5ff" : "#888"}
              />
            </View>
            <View style={[styles.audioToggleRow, { marginTop: 12, borderTopWidth: 0.5, borderColor: "rgba(255,255,255,0.08)", paddingTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.audioToggleLabel}>AI Narration Voiceover</Text>
                <Text style={styles.audioToggleDesc}>Enable automated studio narration of tagged styling.</Text>
              </View>
              <Switch
                value={isVoiceoverEnabled}
                onValueChange={setIsVoiceoverEnabled}
                trackColor={{ false: "#333", true: "rgba(0,245,255,0.35)" }}
                thumbColor={isVoiceoverEnabled ? "#00f5ff" : "#888"}
              />
            </View>
          </View>
        )}

        {/* Captions Editor Panel */}
        {activeEditTool === "captions" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Auto Captions</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            <View style={styles.audioToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.audioToggleLabel}>Display Captions</Text>
                <Text style={styles.audioToggleDesc}>Overlay transcription subtitles on the video preview.</Text>
              </View>
              <Switch
                value={showCaptions}
                onValueChange={setShowCaptions}
                trackColor={{ false: "#333", true: "rgba(0,245,255,0.35)" }}
                thumbColor={showCaptions ? "#00f5ff" : "#888"}
              />
            </View>
            {showCaptions && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.presetLabel}>Select Theme Preset</Text>
                <View style={styles.presetRow}>
                  {[
                    { id: "luxury", label: "Quiet Luxury", text: "✨ AURAGRAM Quiet Luxury Collection ✨" },
                    { id: "cyber", label: "Cyber Neon", text: "⚡️ NEXT GEN DIGITAL DESIGN ⚡️" },
                    { id: "vintage", label: "Film Vintage", text: "🎞️ Autumn Lookbook Curation 🎞️" }
                  ].map((theme) => (
                    <TouchableOpacity
                      key={theme.id}
                      style={[styles.presetChip, currentTheme === theme.id && styles.presetChipActive]}
                      onPress={() => { setCurrentTheme(theme.id); setCurrentCaptionText(theme.text); }}
                    >
                      <Text style={[styles.presetChipText, currentTheme === theme.id && { color: "#000" }]}>{theme.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Overlay Sticker Panel */}
        {activeEditTool === "overlay" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Sticker Overlays</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            <View style={styles.stickerSelectionGrid}>
              {[
                { id: "auragram", label: "AURAGRAM" },
                { id: "couture", label: "COUTURE" },
                { id: "creator", label: "CREATOR" },
                { id: "digital", label: "100% DIGITAL" }
              ].map((sticker) => (
                <TouchableOpacity
                  key={sticker.id}
                  style={[styles.stickerSelectorItem, overlaySticker === sticker.label && styles.stickerSelectorItemActive]}
                  onPress={() => setOverlaySticker(overlaySticker === sticker.label ? null : sticker.label)}
                >
                  <Text style={[styles.stickerSelectorLabel, overlaySticker === sticker.label && { color: "#080415" }]}>{sticker.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Effects Picker Panel with Graphical Icons */}
        {activeEditTool === "effects" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Visual Effects</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectsPickerRow}>
              {REEL_EFFECTS.map((fx) => (
                <TouchableOpacity
                  key={fx.id}
                  style={[styles.effectPickerChip, filterId === fx.id && styles.effectPickerChipActive]}
                  onPress={() => onFilterChange(fx.id)}
                >
                  <View style={[
                    styles.effectColorBox, 
                    { backgroundColor: fx.previewColor === "transparent" ? "rgba(255,255,255,0.06)" : fx.previewColor },
                    filterId === fx.id && { backgroundColor: "#00f5ff", borderColor: "#00f5ff" }
                  ]}>
                    <Lucide name={fx.icon as any} size={22} color={filterId === fx.id ? "#080415" : "#00f5ff"} />
                  </View>
                  <Text style={[styles.effectPickerText, filterId === fx.id && { color: "#00f5ff" }]}>{fx.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Speed Controls Panel */}
        {activeEditTool === "speed" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Clip speed</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            <Text style={styles.audioToggleDesc}>Playback rate for the active clip (stored as clip metadata).</Text>
            <View style={[styles.presetRow, { marginTop: 12, justifyContent: "center" }]}>
              {REEL_PLAYBACK_SPEEDS.map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.presetChip, activePlaybackRate === rate && styles.presetChipActive]}
                  onPress={() => setClipPlaybackRate(rate)}
                >
                  <Text style={[styles.presetChipText, activePlaybackRate === rate && { color: "#000" }]}>{rate}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Professional Trimmer Panel with Filmstrip sprocket holes & drag highlight */}
        {activeEditTool === "trim" && (
          <View style={styles.controlPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Trim Video Clip</Text>
              <TouchableOpacity onPress={() => setActiveEditTool(null)}><Lucide name="close-circle" size={20} color="#00f5ff" /></TouchableOpacity>
            </View>
            
            <Text style={styles.trimRangeLabel}>Trim Range: {trimStart.toFixed(1)}s - {trimEnd.toFixed(1)}s</Text>
            
            {/* Interactive Professional Filmstrip Track */}
            <View 
              ref={trackRef}
              style={styles.filmstripTrack}
              onStartShouldSetResponder={() => true}
              onResponderMove={handleTrackTouch}
              onResponderRelease={handleTrackTouch}
            >
              {/* Filmstrip Sprocket Holes Top */}
              <View style={styles.filmHolesRow}>
                {[...Array(14)].map((_, i) => <View key={i} style={styles.filmHole} />)}
              </View>

              {/* Faint Film Frames backgrounds */}
              <View style={styles.filmFramesContainer}>
                {[...Array(5)].map((_, i) => (
                  <View key={i} style={styles.filmFrame}>
                    <Lucide name="image-outline" size={14} color="rgba(255,255,255,0.12)" />
                  </View>
                ))}
              </View>

              {/* Dynamic Trim Selection Bracket Highlight Overlay */}
              <View style={[
                styles.trimHighlightBracket,
                {
                  left: `${(trimStart / 15) * 100}%`,
                  width: `${((trimEnd - trimStart) / 15) * 100}%`
                }
              ]}>
                {/* Left Handle Grabber */}
                <View style={styles.trimHandleLeft}>
                  <View style={styles.trimHandleBar} />
                </View>
                
                {/* Right Handle Grabber */}
                <View style={styles.trimHandleRight}>
                  <View style={styles.trimHandleBar} />
                </View>
              </View>

              {/* Filmstrip Sprocket Holes Bottom */}
              <View style={[styles.filmHolesRow, { bottom: 2 }]}>
                {[...Array(14)].map((_, i) => <View key={i} style={styles.filmHole} />)}
              </View>
            </View>

            {/* Time labels below filmstrip */}
            <View style={styles.timeMarkersRow}>
              <Text style={styles.timeMarkerText}>0:00</Text>
              <Text style={styles.timeMarkerText}>0:05</Text>
              <Text style={styles.timeMarkerText}>0:10</Text>
              <Text style={styles.timeMarkerText}>0:15</Text>
            </View>

            {/* Precision +/- Buttons */}
            <View style={styles.trimControlRow}>
              <View style={styles.trimPrecisionCol}>
                <Text style={styles.precisionLabel}>Start Position</Text>
                <View style={styles.precisionButtons}>
                  <TouchableOpacity style={styles.precisionBtn} onPress={() => setTrimStart(prev => Math.max(0, Number((prev - 0.5).toFixed(1))))}>
                    <Text style={styles.precisionBtnText}>-0.5s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.precisionBtn} onPress={() => setTrimStart(prev => Math.min(trimEnd - 0.5, Number((prev + 0.5).toFixed(1))))}>
                    <Text style={styles.precisionBtnText}>+0.5s</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.trimPrecisionCol}>
                <Text style={styles.precisionLabel}>End Position</Text>
                <View style={styles.precisionButtons}>
                  <TouchableOpacity style={styles.precisionBtn} onPress={() => setTrimEnd(prev => Math.max(trimStart + 0.5, Number((prev - 0.5).toFixed(1))))}>
                    <Text style={styles.precisionBtnText}>-0.5s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.precisionBtn} onPress={() => setTrimEnd(prev => Math.min(15, Number((prev + 0.5).toFixed(1))))}>
                    <Text style={styles.precisionBtnText}>+0.5s</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Timeline View */}
        <View style={styles.timelineWrap}>
          <ReelTimelineEditor
            clips={clips}
            activeClipId={activeClipId}
            onSelectClip={onActiveClipChange}
            onAddClip={onAddClip}
            onRemoveClip={handleRemoveClip}
            filterId={filterId}
            onFilterChange={onFilterChange}
          />
          {selectedAudio ? (
            <AudioSegmentPicker
              durationMs={selectedAudio.durationMs}
              startMs={audioStartMs}
              onChange={onAudioStartMsChange}
              trackTitle={selectedAudio.title}
            />
          ) : null}
        </View>

      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.editVideoBtn, activeEditTool === "clip_manager" && styles.editVideoBtnActive]} 
          onPress={() => setActiveEditTool(activeEditTool === "clip_manager" ? null : "clip_manager")}
        >
          <Text style={styles.editVideoText}>Edit video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>Next</Text>
          <Lucide name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {showAudioDrawer ? (
        <AudioSelectorDrawer
          setShowAudioDrawer={setShowAudioDrawer}
          stopTrack={stopTrack}
          audioSearchQuery={audioSearchQuery}
          setAudioSearchQuery={setAudioSearchQuery}
          activeAudioCategory={activeAudioCategory}
          setActiveAudioCategory={setActiveAudioCategory}
          selectedAudio={selectedAudio}
          setSelectedAudio={onAudioChange}
          isPlayingAudio={isPlayingAudio}
          soundRef={soundRef}
          playTrack={playTrack}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 8 },
  previewWrap: {
    height: height * 0.40,
    backgroundColor: "#000",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  previewVideo: { width, height: height * 0.40 },
  speedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 3,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  speedBadgeText: { color: "#00f5ff", fontSize: 13, fontWeight: "800" },
  expandTools: { alignItems: "center", paddingVertical: 4 },
  scrollContent: { paddingBottom: 24 },
  toolsRow: { paddingHorizontal: 16, gap: 14, paddingBottom: 8 },
  toolItem: { 
    alignItems: "center", 
    width: 68, 
    position: "relative",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  toolItemActive: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderWidth: 0.5,
    borderColor: "#00f5ff",
  },
  toolLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 6, fontWeight: "600" },
  newBadge: {
    position: "absolute",
    top: -4,
    right: 0,
    backgroundColor: "#0095f6",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 2,
  },
  newBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  
  // Real-time Text Overlay Style
  textOverlayContainer: {
    position: "absolute",
    top: "35%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  textOverlayText: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  
  // Real-time Sticker Overlay Style
  stickerOverlayContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  stickerBadge: {
    backgroundColor: "#00f5ff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#00f5ff",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  stickerBadgeText: {
    color: "#080415",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  
  // Real-time Captions Overlay Style
  captionsOverlayContainer: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(8,4,21,0.75)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  captionsText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "700",
    textAlign: "center",
  },
  
  // Dynamic Editor Panel styles
  controlPanel: {
    backgroundColor: "#0d091e",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  panelTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  
  // Text editor
  textInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  textPanelInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    justifyContent: "center",
  },
  colorBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  colorBubbleActive: {
    borderColor: "#fff",
    transform: [{ scale: 1.15 }],
  },
  
  // Voice & Captions
  audioToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  audioToggleLabel: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "700",
  },
  audioToggleDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  presetLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  presetChipActive: {
    backgroundColor: "#00f5ff",
  },
  presetChipText: {
    color: "#fff",
    fontSize: 11.5,
    fontWeight: "700",
  },
  
  // Stickers
  stickerSelectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  stickerSelectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  stickerSelectorItemActive: {
    backgroundColor: "#00f5ff",
  },
  stickerSelectorLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  
  // Effects Picker Row
  effectsPickerRow: {
    gap: 12,
    paddingVertical: 4,
  },
  effectPickerChip: {
    alignItems: "center",
    gap: 6,
    width: 68,
  },
  effectColorBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  effectPickerChipActive: {
    transform: [{ scale: 1.08 }],
  },
  effectPickerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10.5,
    fontWeight: "700",
    textAlign: "center",
  },
  
  trimRangeLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  // Professional Filmstrip & Trimmer styles
  filmstripTrack: {
    height: 64,
    backgroundColor: "#120e25",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    position: "relative",
    overflow: "visible",
    marginVertical: 10,
  },
  filmHolesRow: {
    position: "absolute",
    top: 2,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  filmHole: {
    width: 4,
    height: 4,
    backgroundColor: "#000",
    borderRadius: 1,
  },
  filmFramesContainer: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 8,
  },
  filmFrame: {
    flex: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  trimHighlightBracket: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderColor: "#ffd60a",
    borderWidth: 2.5,
    backgroundColor: "rgba(255,214,10,0.06)",
    borderRadius: 6,
  },
  trimHandleLeft: {
    position: "absolute",
    top: -2,
    bottom: -2,
    left: -6,
    width: 12,
    backgroundColor: "#ffd60a",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffd60a",
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  trimHandleRight: {
    position: "absolute",
    top: -2,
    bottom: -2,
    right: -6,
    width: 12,
    backgroundColor: "#ffd60a",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffd60a",
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  trimHandleBar: {
    width: 2,
    height: 16,
    backgroundColor: "#000",
    borderRadius: 1,
  },
  timeMarkersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  timeMarkerText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
  },
  trimControlRow: {
    flexDirection: "row",
    gap: 8,
  },
  trimPrecisionCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  precisionLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  precisionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  precisionBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  precisionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Clip manager list
  clipManagerRow: {
    gap: 10,
    alignItems: "center",
  },
  clipManagerItem: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    alignItems: "center",
    gap: 6,
    minWidth: 80,
  },
  clipManagerIndex: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  clipManagerDelete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255,59,48,0.1)",
  },
  clipManagerAdd: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#00f5ff",
    borderStyle: "dashed",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    gap: 4,
  },
  
  // Timeline wrap
  timelineWrap: { paddingHorizontal: 16, marginTop: 12 },
  
  // Fixed Bottom Bar styles
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  editVideoBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  editVideoBtnActive: {
    backgroundColor: "rgba(0,245,255,0.15)",
    borderWidth: 0.5,
    borderColor: "#00f5ff",
  },
  editVideoText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0095f6",
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
