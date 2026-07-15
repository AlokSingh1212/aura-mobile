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

let authLogoutHandler: (() => void) | null = null;
let authSuspensionHandler: (() => void) | null = null;

export function registerAuthLogoutHandler(handler: () => void) {
  authLogoutHandler = handler;
}

export function registerAuthSuspensionHandler(handler: () => void) {
  authSuspensionHandler = handler;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...authHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    authLogoutHandler?.();
  }
  if (res.status === 403) {
    try {
      const clone = res.clone();
      const body = await clone.json();
      if (body?.error === "ACCOUNT_SUSPENDED") {
        authSuspensionHandler?.();
      }
    } catch {
      // Ignored
    }
  }
  return res;
}

export async function apiFetchJson<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await apiFetch(path, init);
  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

export const IS_PRODUCTION_APP = !__DEV__;
