const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const normalizeApiBaseUrl = (rawValue: string | undefined, localHost: boolean): string => {
  const fallback = localHost ? "http://localhost:5000" : "/backend";
  if (!rawValue) return fallback;

  let normalized = rawValue.trim();
  if (!normalized) return fallback;

  normalized = normalized.replace(/\/+$/, "");
  normalized = normalized.replace(/\/api$/i, "");

  return normalized || fallback;
};

const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL, isLocalHost);

const ADMIN_ACCESS_TOKEN_KEY = "fiesta_admin_access_token";

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
  if (!isBrowser) return null;
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
};

const setAccessToken = (token: string): void => {
  if (!isBrowser) return;
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token);
};

const clearAccessToken = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
};

export const isAdminAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpiredOrNearExpiry(token);
};

export const loginAdmin = async (email: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok || !data?.accessToken) return false;

    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
};

export const refreshAdminSession = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok || !data?.accessToken) {
      clearAccessToken();
      return false;
    }

    setAccessToken(data.accessToken);
    return true;
  } catch {
    clearAccessToken();
    return false;
  }
};

export const logoutAdmin = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  } catch {
    // no-op
  } finally {
    clearAccessToken();
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

  const refreshed = await refreshAdminSession();
  if (!refreshed) {
    clearAccessToken();
    return response;
  }

  response = await execute();
  if (response.status === 401) {
    clearAccessToken();
  }

  return response;
};
