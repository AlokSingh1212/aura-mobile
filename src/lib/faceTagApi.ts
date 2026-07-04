import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type DetectedFace = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FaceMatchSuggestion = {
  profileId: string;
  username: string;
  name: string;
  logo: string | null;
  confidence: number;
};

export async function detectFacesInPhoto(opts: {
  imageUrl: string;
  userId?: string;
  profileId?: string;
}): Promise<{
  success: boolean;
  faces?: DetectedFace[];
  matches?: Record<string, FaceMatchSuggestion[]>;
  engine?: string;
  error?: string;
}> {
  const res = await fetch(`${API_HOST}/api/mobile/media/detect-faces`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(opts),
  });
  return res.json();
}

export async function fetchFaceTagSettings(profileId: string): Promise<{
  optIn: boolean;
  enrolled: boolean;
}> {
  const res = await fetch(
    `${API_HOST}/api/mobile/profile/face-tag?profileId=${encodeURIComponent(profileId)}`,
    { headers: authHeaders() }
  );
  const data = await res.json();
  if (data.success) {
    return { optIn: !!data.optIn, enrolled: !!data.enrolled };
  }
  return { optIn: false, enrolled: false };
}

export async function enrollFaceTagRecognition(opts: {
  userId: string;
  profileId: string;
  avatarUrl?: string | null;
  optIn: boolean;
}): Promise<{ success: boolean; enrolled?: boolean; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/profile/face-tag`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(opts),
  });
  return res.json();
}

export async function optOutFaceTagRecognition(opts: {
  userId: string;
  profileId: string;
}): Promise<{ success: boolean }> {
  const res = await fetch(`${API_HOST}/api/mobile/profile/face-tag`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(opts),
  });
  return res.json();
}
