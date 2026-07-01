/**
 * Centralized API configuration for AURAGRAM mobile.
 *
 * Set EXPO_PUBLIC_API_HOST in EAS build / .env for production:
 *   EXPO_PUBLIC_API_HOST=https://your-api.vercel.app
 */
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiHost?: string } | undefined;

const DEV_LAN_HOST = "http://192.168.1.5:3000";

function resolveApiHost(): string {
  if (process.env.EXPO_PUBLIC_API_HOST) {
    return process.env.EXPO_PUBLIC_API_HOST.replace(/\/$/, "");
  }
  if (extra?.apiHost) {
    return extra.apiHost.replace(/\/$/, "");
  }
  if (__DEV__) {
    return DEV_LAN_HOST;
  }
  console.warn(
    "[AURA] EXPO_PUBLIC_API_HOST not set for production build — using dev fallback."
  );
  return DEV_LAN_HOST;
}

export const API_HOST = resolveApiHost();
export const API_BASE = `${API_HOST}/api/mobile`;
