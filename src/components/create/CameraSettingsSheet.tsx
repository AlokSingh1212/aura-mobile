import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  loadCameraSettings,
  saveCameraSettings,
  type CameraSettings,
  type ReplyAudience,
} from "@/lib/cameraSettings";

type SubScreen = "main" | "story" | "reels" | "live" | "product";

interface CameraSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress}>
      <Text style={styles.rowTitle}>{label}</Text>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#333", true: "#0095f6" }}
        thumbColor="#fff"
      />
    </View>
  );
}

export function CameraSettingsSheet({ visible, onClose }: CameraSettingsSheetProps) {
  const [screen, setScreen] = useState<SubScreen>("main");
  const [settings, setSettings] = useState<CameraSettings | null>(null);

  const refresh = useCallback(async () => {
    setSettings(await loadCameraSettings());
  }, []);

  useEffect(() => {
    if (visible) {
      refresh();
      setScreen("main");
    }
  }, [visible, refresh]);

  const patch = async (partial: Partial<CameraSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveCameraSettings(next);
  };

  const patchStory = async (partial: Partial<CameraSettings["story"]>) => {
    if (!settings) return;
    const next = { ...settings, story: { ...settings.story, ...partial } };
    setSettings(next);
    await saveCameraSettings(next);
  };

  const patchReels = async (partial: Partial<CameraSettings["reels"]>) => {
    if (!settings) return;
    const next = { ...settings, reels: { ...settings.reels, ...partial } };
    setSettings(next);
    await saveCameraSettings(next);
  };

  const patchLive = async (partial: Partial<CameraSettings["live"]>) => {
    if (!settings) return;
    const next = { ...settings, live: { ...settings.live, ...partial } };
    setSettings(next);
    await saveCameraSettings(next);
  };

  const patchProduct = async (partial: Partial<CameraSettings["product"]>) => {
    if (!settings) return;
    const next = { ...settings, product: { ...settings.product, ...partial } };
    setSettings(next);
    await saveCameraSettings(next);
  };

  const headerTitle =
    screen === "main"
      ? "Camera settings"
      : screen === "story"
        ? "Story"
        : screen === "reels"
          ? "Reels"
          : screen === "live"
            ? "Live"
            : "Product";

  if (!settings) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          {screen === "main" ? (
            <View style={{ width: 56 }} />
          ) : (
            <TouchableOpacity onPress={() => setScreen("main")} hitSlop={12}>
              <Lucide name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.doneBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {screen === "main" ? (
            <>
              <Text style={styles.sectionHead}>Mode settings</Text>
              {(
                [
                  { key: "story" as const, label: "Story", icon: "add-circle-outline" },
                  { key: "reels" as const, label: "Reels", icon: "film-outline" },
                  { key: "live" as const, label: "Live", icon: "radio-outline" },
                  { key: "product" as const, label: "Product", icon: "pricetag-outline" },
                ] as const
              ).map((row) => (
                <TouchableOpacity key={row.key} style={styles.navRow} onPress={() => setScreen(row.key)}>
                  <Lucide name={row.icon} size={22} color="#fff" />
                  <Text style={styles.navLabel}>{row.label}</Text>
                  <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionHead}>Controls</Text>
              <ToggleRow
                title="Default to front camera"
                value={settings.defaultFrontCamera}
                onValueChange={(defaultFrontCamera) => patch({ defaultFrontCamera })}
              />
              <Text style={styles.sectionHead}>Camera tools</Text>
              <Text style={styles.sectionSub}>
                Choose which side of the screen you want your camera toolbar on.
              </Text>
              <RadioRow
                label="Left side"
                selected={settings.toolbarSide === "left"}
                onPress={() => patch({ toolbarSide: "left" })}
              />
              <RadioRow
                label="Right side"
                selected={settings.toolbarSide === "right"}
                onPress={() => patch({ toolbarSide: "right" })}
              />

              <Text style={styles.sectionHead}>Camera roll</Text>
              <ToggleRow
                title="Allow access"
                subtitle="Let AURA suggest stories, posts, and ready-made reels from photos and videos on your device."
                value={settings.cameraRollAccess}
                onValueChange={(cameraRollAccess) => patch({ cameraRollAccess })}
              />
            </>
          ) : null}

          {screen === "story" ? (
            <>
              <Text style={styles.sectionHead}>Viewing</Text>
              <TouchableOpacity style={styles.navRow}>
                <Text style={styles.navLabel}>Hide story from</Text>
                <Text style={styles.navValue}>{settings.story.hideStoryFromCount} people</Text>
                <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
              <Text style={styles.rowSubPad}>Hide your story and live videos from specific people.</Text>
              <TouchableOpacity style={styles.navRow}>
                <Text style={styles.navLabel}>Close friends</Text>
                <Text style={styles.navValue}>{settings.story.closeFriendsCount} people</Text>
                <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
              <Text style={styles.rowSubPad}>Share your story only with specific people.</Text>

              <Text style={styles.sectionHead}>Replying</Text>
              <Text style={styles.sectionSub}>Choose who can reply to your story.</Text>
              {(
                [
                  { key: "everyone" as ReplyAudience, label: "Everyone" },
                  { key: "following" as ReplyAudience, label: "People you follow" },
                  { key: "off" as ReplyAudience, label: "Off" },
                ] as const
              ).map((opt) => (
                <RadioRow
                  key={opt.key}
                  label={opt.label}
                  selected={settings.story.allowMessageReplies === opt.key}
                  onPress={() => patchStory({ allowMessageReplies: opt.key })}
                />
              ))}

              <Text style={styles.sectionHead}>Commenting</Text>
              <ToggleRow
                title="Allow comments"
                subtitle="Choose who can leave comments on your story."
                value={settings.story.allowComments}
                onValueChange={(allowComments) => patchStory({ allowComments })}
              />

              <Text style={styles.sectionHead}>Saving</Text>
              <ToggleRow
                title="Save story to camera roll"
                subtitle="Automatically save photos and videos to your phone's camera roll."
                value={settings.story.saveToCameraRoll}
                onValueChange={(saveToCameraRoll) => patchStory({ saveToCameraRoll })}
              />
              <ToggleRow
                title="Save story to archive"
                subtitle="Automatically save photos and videos to your archive."
                value={settings.story.saveToArchive}
                onValueChange={(saveToArchive) => patchStory({ saveToArchive })}
              />

              <Text style={styles.sectionHead}>Sharing</Text>
              <ToggleRow
                title="Allow sharing to story"
                subtitle="Let people add your posts to their story. Your username will always show."
                value={settings.story.allowSharingToStory}
                onValueChange={(allowSharingToStory) => patchStory({ allowSharingToStory })}
              />
              <ToggleRow
                title="Allow sharing to messages"
                subtitle="Let people share your story in a message."
                value={settings.story.allowSharingToMessages}
                onValueChange={(allowSharingToMessages) => patchStory({ allowSharingToMessages })}
              />
            </>
          ) : null}

          {screen === "reels" ? (
            <>
              <Text style={styles.sectionHead}>Recording</Text>
              <Text style={styles.sectionSub}>Default reel length when recording from camera.</Text>
              {([15, 30, 60, 90] as const).map((sec) => (
                <RadioRow
                  key={sec}
                  label={`${sec} seconds`}
                  selected={settings.reels.defaultLengthSec === sec}
                  onPress={() => patchReels({ defaultLengthSec: sec })}
                />
              ))}
              <Text style={styles.sectionHead}>Publishing</Text>
              <ToggleRow
                title="Show in feed"
                subtitle="Share reels to your followers' home feed on AURA."
                value={settings.reels.showInFeed}
                onValueChange={(showInFeed) => patchReels({ showInFeed })}
              />
              <ToggleRow
                title="Allow comments"
                value={settings.reels.allowComments}
                onValueChange={(allowComments) => patchReels({ allowComments })}
              />
              <ToggleRow
                title="Allow remix"
                subtitle="Let others create reels using your audio."
                value={settings.reels.allowRemix}
                onValueChange={(allowRemix) => patchReels({ allowRemix })}
              />
              <ToggleRow
                title="Save reel to camera roll"
                value={settings.reels.saveToCameraRoll}
                onValueChange={(saveToCameraRoll) => patchReels({ saveToCameraRoll })}
              />
            </>
          ) : null}

          {screen === "live" ? (
            <>
              <Text style={styles.sectionHead}>Viewing</Text>
              <TouchableOpacity style={styles.navRow}>
                <Text style={styles.navLabel}>Hide live from</Text>
                <Text style={styles.navValue}>{settings.live.hideLiveFromCount} people</Text>
                <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
              <Text style={styles.sectionHead}>Broadcast</Text>
              <ToggleRow
                title="Notify followers"
                subtitle="Send a notification when you go live."
                value={settings.live.notifyFollowers}
                onValueChange={(notifyFollowers) => patchLive({ notifyFollowers })}
              />
              <ToggleRow
                title="Allow comments"
                value={settings.live.allowComments}
                onValueChange={(allowComments) => patchLive({ allowComments })}
              />
              <ToggleRow
                title="Save replay"
                subtitle="Save your live video to replay after the stream ends."
                value={settings.live.saveReplay}
                onValueChange={(saveReplay) => patchLive({ saveReplay })}
              />
            </>
          ) : null}

          {screen === "product" ? (
            <>
              <Text style={styles.sectionHead}>Shoppable reels</Text>
              <ToggleRow
                title="Auto-tag store"
                subtitle="Default to your brand store when adding products to reels."
                value={settings.product.autoTagStore}
                onValueChange={(autoTagStore) => patchProduct({ autoTagStore })}
              />
              <ToggleRow
                title="Show price on reel"
                value={settings.product.showPriceOnReel}
                onValueChange={(showPriceOnReel) => patchProduct({ showPriceOnReel })}
              />
              <ToggleRow
                title="Enable affiliate"
                subtitle="Allow creators to earn commission when tagging your products."
                value={settings.product.enableAffiliate}
                onValueChange={(enableAffiliate) => patchProduct({ enableAffiliate })}
              />
            </>
          ) : null}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  doneBtn: { color: "#0095f6", fontSize: 16, fontWeight: "700", width: 56, textAlign: "right" },
  scroll: { flex: 1 },
  sectionHead: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  navLabel: { color: "#fff", fontSize: 16, flex: 1 },
  navValue: { color: "rgba(255,255,255,0.45)", fontSize: 15, marginRight: 4 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowTitle: { color: "#fff", fontSize: 16 },
  rowSub: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4, lineHeight: 18 },
  rowSubPad: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    paddingHorizontal: 16,
    marginTop: -6,
    marginBottom: 8,
    lineHeight: 18,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: "#fff" },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#fff" },
});
