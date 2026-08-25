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
const TRACK_ENDPOINT = `${API_URL}/api/track`;
const TRACKING_SESSION_KEY = "fiesta_tracking_session_id";

const EVENT_NAME_ALIASES: Record<string, string> = {
  nav_mobile_click: "nav_click",
  video_gallery_click: "video_click",
  package_click: "pricing_package_click",
  voucher_click: "gift_voucher_click",
};

let trackingInitialized = false;
let cachedSessionId: string | null = null;

const isAdminPath = (path: string): boolean => path.startsWith("/admin");

const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
};

const generateSessionId = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
};

const getSessionId = (): string => {
  if (cachedSessionId) return cachedSessionId;

  try {
    const existing = window.localStorage.getItem(TRACKING_SESSION_KEY);
    if (existing) {
      cachedSessionId = existing;
      return existing;
    }

    const next = generateSessionId();
    window.localStorage.setItem(TRACKING_SESSION_KEY, next);
    cachedSessionId = next;
    return next;
  } catch {
    const ephemeral = generateSessionId();
    cachedSessionId = ephemeral;
    return ephemeral;
  }
};

const parseTrackAttribute = (value: string): { eventName: string; label: string | null } | null => {
  const [rawEvent, ...labelParts] = value.split(":");
  const eventName = (rawEvent || "").trim();
  if (!eventName) return null;
  const labelRaw = labelParts.join(":").trim();
  return {
    eventName,
    label: labelRaw || null,
  };
};

const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

const normalizeTrackPayload = (
  eventName: string,
  label?: string | null,
): { eventName: string; label: string | null } => {
  const baseEvent = normalizeKey(eventName);
  const normalizedEvent = EVENT_NAME_ALIASES[baseEvent] || baseEvent;

  if (!label) {
    return { eventName: normalizedEvent, label: null };
  }

  // Keep page_view labels as URL paths for page-level analytics.
  if (normalizedEvent === "page_view") {
    return { eventName: normalizedEvent, label };
  }

  const normalizedLabel = normalizeKey(label);
  return { eventName: normalizedEvent, label: normalizedLabel || null };
};

const postEvent = (payload: Record<string, unknown>): void => {
  try {
    const body = JSON.stringify(payload);
    const asBlob = new Blob([body], { type: "application/json" });

    if (navigator.sendBeacon && navigator.sendBeacon(TRACK_ENDPOINT, asBlob)) {
      return;
    }

    void fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Tracking should never block UX.
    });
  } catch {
    // Swallow tracking errors.
  }
};

export const trackEvent = (eventName: string, label?: string | null): void => {
  if (!isBrowser) return;
  if (!eventName || isAdminPath(window.location.pathname)) return;

  const normalized = normalizeTrackPayload(eventName, label);
  if (!normalized.eventName) return;

  postEvent({
    event_name: normalized.eventName,
    label: normalized.label,
    page_url: `${window.location.pathname}${window.location.search}`,
    session_id: getSessionId(),
    referrer: document.referrer || null,
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
  });
};

export const trackPageView = (): void => {
  if (!isBrowser || isAdminPath(window.location.pathname)) return;
  trackEvent("page_view", window.location.pathname);
};

export const initTracking = (): void => {
  if (!isBrowser || trackingInitialized) return;
  trackingInitialized = true;

  document.addEventListener(
    "click",
    (event) => {
      if (isAdminPath(window.location.pathname)) return;

      const target = event.target as HTMLElement | null;
      const trackedElement = target?.closest<HTMLElement>("[data-track]");
      if (!trackedElement) return;

      const dataTrack = trackedElement.getAttribute("data-track");
      if (!dataTrack) return;

      const parsed = parseTrackAttribute(dataTrack);
      if (!parsed) return;

      trackEvent(parsed.eventName, parsed.label);
    },
    { capture: true }
  );
};
