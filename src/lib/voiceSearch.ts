import { Audio } from "expo-av";
import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

/** Record ~3s audio and transcribe via /api/mobile/voice-search */
export async function recordAndTranscribeVoiceSearch(): Promise<string | null> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Microphone permission is required for voice search.");
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();

  await new Promise((r) => setTimeout(r, 2800));

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  if (!uri) return null;

  const form = new FormData();
  form.append("file", {
    uri,
    name: "voice.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  const res = await fetch(`${API_BASE}/voice-search`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  const data = await res.json();
  if (data.success && data.text) {
    return String(data.text).trim();
  }
  return null;
}
