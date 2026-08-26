const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const normalizeApiBaseUrl = (rawValue: string | undefined, localHost: boolean): string => {
  const fallback = localHost
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "/backend";
  if (!rawValue) return fallback;

  let normalized = rawValue.trim();
  if (!normalized) return fallback;

  normalized = normalized.replace(/\/+$/, "");
  normalized = normalized.replace(/\/api$/i, "");

  return normalized || fallback;
};

const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL, isLocalHost);
const CSRF_COOKIE_NAME = "fh_csrf_token";
export const ADMIN_SESSION_EXPIRED_EVENT = "fh-admin-session-expired";
let accessTokenMemory: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let sessionInvalid = false;

const notifySessionExpired = (): void => {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT));
};

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return decoded;
  } catch {
    return null;
  }
};

const isTokenExpiredOrNearExpiry = (token: string, skewMs = 30_000): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewMs;
};

const getAccessToken = (): string | null => {
  return accessTokenMemory;
};

const setAccessToken = (token: string): void => {
  accessTokenMemory = token;
  sessionInvalid = false;
};

const clearAccessToken = (): void => {
  accessTokenMemory = null;
};

const getCookieValue = (name: string): string | null => {
  if (!isBrowser) return null;
  const parts = document.cookie.split(';').map((part) => part.trim());
  const prefix = `${name}=`;
  const match = parts.find((part) => part.startsWith(prefix));
  if (!match) return null;
  return decodeURIComponent(match.slice(prefix.length));
};

const applyCsrfHeader = (headers: Headers): void => {
  const csrfToken = getCookieValue(CSRF_COOKIE_NAME);
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
};

export const isAdminAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpiredOrNearExpiry(token);
};

export const loginAdmin = async (email: string, password: string): Promise<boolean> => {
  try {
    const headers = new Headers({ "Content-Type": "application/json" });
    applyCsrfHeader(headers);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok || !data?.accessToken) return false;

    setAccessToken(data.accessToken);
    sessionInvalid = false;
    return true;
  } catch {
    return false;
  }
};

const doRefreshAdminSession = async (): Promise<boolean> => {
  if (sessionInvalid) return false;

  try {
    const headers = new Headers();
    applyCsrfHeader(headers);

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers,
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok || !data?.accessToken) {
      clearAccessToken();
      sessionInvalid = true;
      notifySessionExpired();
      return false;
    }

    setAccessToken(data.accessToken);
    sessionInvalid = false;
    return true;
  } catch {
    clearAccessToken();
    sessionInvalid = true;
    notifySessionExpired();
    return false;
  }
};

export const refreshAdminSession = async (): Promise<boolean> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = doRefreshAdminSession().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

export const logoutAdmin = async (): Promise<void> => {
  try {
    const headers = new Headers();
    applyCsrfHeader(headers);

    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers,
      credentials: "include"
    });
  } catch {
    // no-op
  } finally {
    clearAccessToken();
    sessionInvalid = true;
  }
};

export const authenticatedFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const initialToken = getAccessToken();
  if (initialToken && isTokenExpiredOrNearExpiry(initialToken)) {
    const refreshed = await refreshAdminSession();
    if (!refreshed) {
      clearAccessToken();
    }
  }

  const execute = async (): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers
    });
  };

  let response = await execute();
  if (response.status !== 401) {
    return response;
  }

  if (sessionInvalid) {
    notifySessionExpired();
    return response;
  }

  const refreshed = await refreshAdminSession();
  if (!refreshed) {
    clearAccessToken();
    notifySessionExpired();
    return response;
  }

  response = await execute();
  if (response.status === 401) {
    clearAccessToken();
    sessionInvalid = true;
    notifySessionExpired();
  }

  return response;
};
