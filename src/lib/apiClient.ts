import { API_BASE } from "@/constants/api";

let authTokenGetter: (() => string | null) | null = null;

export function registerAuthTokenGetter(getter: () => string | null) {
  authTokenGetter = getter;
}

export function getAuthToken(): string | null {
  return authTokenGetter?.() ?? null;
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra || {}),
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...authHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export const IS_PRODUCTION_APP = !__DEV__;
