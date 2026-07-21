import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@aura/camera_settings_v1";

export type CameraToolbarSide = "left" | "right";
export type ReplyAudience = "everyone" | "following" | "off";

export interface ModeStorySettings {
  hideStoryFromCount: number;
  closeFriendsCount: number;
  allowMessageReplies: ReplyAudience;
  allowComments: boolean;
  saveToCameraRoll: boolean;
  saveToArchive: boolean;
  allowSharingToStory: boolean;
  allowSharingToMessages: boolean;
}

export interface ModeReelSettings {
  defaultLengthSec: 15 | 30 | 60 | 90;
  saveToCameraRoll: boolean;
  allowComments: boolean;
  allowRemix: boolean;
  showInFeed: boolean;
}

export interface ModeLiveSettings {
  hideLiveFromCount: number;
  allowComments: boolean;
  saveReplay: boolean;
  notifyFollowers: boolean;
}

export interface ModeProductSettings {
  autoTagStore: boolean;
  showPriceOnReel: boolean;
  enableAffiliate: boolean;
}

export interface CameraSettings {
  defaultFrontCamera: boolean;
  toolbarSide: CameraToolbarSide;
  cameraRollAccess: boolean;
  story: ModeStorySettings;
  reels: ModeReelSettings;
  live: ModeLiveSettings;
  product: ModeProductSettings;
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  defaultFrontCamera: true,
  toolbarSide: "right",
  cameraRollAccess: true,
  story: {
    hideStoryFromCount: 0,
    closeFriendsCount: 0,
    allowMessageReplies: "everyone",
    allowComments: true,
    saveToCameraRoll: false,
    saveToArchive: false,
    allowSharingToStory: true,
    allowSharingToMessages: true,
  },
  reels: {
    defaultLengthSec: 60,
    saveToCameraRoll: false,
    allowComments: true,
    allowRemix: true,
    showInFeed: true,
  },
  live: {
    hideLiveFromCount: 0,
    allowComments: true,
    saveReplay: true,
    notifyFollowers: true,
  },
  product: {
    autoTagStore: true,
    showPriceOnReel: true,
    enableAffiliate: false,
  },
};

export async function loadCameraSettings(): Promise<CameraSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CAMERA_SETTINGS };
    return { ...DEFAULT_CAMERA_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CAMERA_SETTINGS };
  }
}

export async function saveCameraSettings(settings: CameraSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function patchCameraSettings(patch: Partial<CameraSettings>): Promise<CameraSettings> {
  const current = await loadCameraSettings();
  const next = { ...current, ...patch };
  await saveCameraSettings(next);
  return next;
}
