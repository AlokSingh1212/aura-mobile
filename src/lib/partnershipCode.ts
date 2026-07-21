import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export async function fetchPartnershipAdCode(
  userId: string,
  profileId?: string | null
): Promise<string> {
  const res = await fetch(`${API_HOST}/api/mobile/stories/partnership-code`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId, profileId }),
  });
  const data = await res.json();
  if (!data.success || !data.code) {
    throw new Error(data.error || "Could not generate partnership ad code");
  }
  return String(data.code);
}
