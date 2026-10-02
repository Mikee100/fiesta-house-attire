const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const normalizeApiBaseUrl = (rawValue: string | undefined, localHost: boolean): string => {
  const fallback = localHost ? "http://localhost:5000" : "/backend";
  if (!rawValue) return fallback;

  let normalized = rawValue.trim();
  if (!normalized) return fallback;

  normalized = normalized.replace(/\/+$/, "");
  normalized = normalized.replace(/\/api$/i, "");
  normalized = normalized.replace(/\/_\/backend$/i, "/backend");

  if (/^\/?_\/backend$/i.test(normalized)) {
    return "/backend";
  }

  return normalized || fallback;
};

const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL, isLocalHost);
const TRACK_ENDPOINT = `${API_URL}/api/track`;
const TRACKING_SESSION_KEY = "fiesta_tracking_session_v2";
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const TRACKING_ATTRIBUTION_KEY = "fiesta_tracking_attribution_v1";

const EVENT_NAME_ALIASES: Record<string, string> = {
  nav_mobile_click: "nav_click",
  video_gallery_click: "video_click",
  package_click: "pricing_package_click",
  voucher_click: "gift_voucher_click",
};

let trackingInitialized = false;
let cachedSessionId: string | null = null;
let sessionLastSeen = 0;
let sessionStarted = false;

export interface TrackingEventContext {
  location?: string;
  packageId?: string;
}

type AttributionSnapshot = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
};

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
  const now = Date.now();
  try {
    const raw = window.sessionStorage.getItem(TRACKING_SESSION_KEY);
    const existing = raw ? JSON.parse(raw) as { id?: string; lastSeen?: number } : null;
    if (existing?.id?.startsWith("v2_") && typeof existing.lastSeen === "number" && now - existing.lastSeen < SESSION_IDLE_TIMEOUT_MS) {
      cachedSessionId = existing.id;
    } else {
      cachedSessionId = `v2_${generateSessionId()}`;
      sessionStarted = true;
      window.sessionStorage.removeItem(TRACKING_ATTRIBUTION_KEY);
    }
    sessionLastSeen = now;
    window.sessionStorage.setItem(TRACKING_SESSION_KEY, JSON.stringify({ id: cachedSessionId, lastSeen: now }));
    return cachedSessionId;
  } catch {
    if (!cachedSessionId || now - sessionLastSeen >= SESSION_IDLE_TIMEOUT_MS) {
      cachedSessionId = `v2_${generateSessionId()}`;
      sessionStarted = true;
    }
    sessionLastSeen = now;
    return cachedSessionId;
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

const sanitizeAttributionValue = (value: string | null | undefined, maxLength = 200): string | null => {
  if (!value || typeof value !== "string") return null;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
};

const getSourceFromReferrer = (referrer: string): { source: string; medium: string } => {
  if (!referrer) return { source: "direct", medium: "none" };

  try {
    const refUrl = new URL(referrer);
    const hostname = refUrl.hostname.toLowerCase().replace(/^www\./, "");
    const currentHost = window.location.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === currentHost || hostname.includes("fiestahousematernity.com") || hostname.includes("fiestahouseattire.com")) {
      return { source: "internal", medium: "internal" };
    }

    if (/google\.|bing\.|yahoo\.|duckduckgo\.|yandex\./.test(hostname)) {
      const source = hostname.includes("google")
        ? "google"
        : hostname.includes("bing")
          ? "bing"
          : hostname.includes("yahoo")
            ? "yahoo"
            : hostname.includes("duckduckgo")
              ? "duckduckgo"
              : "yandex";
      return { source, medium: "organic" };
    }

    if (/instagram\.|facebook\.|fb\.|twitter\.|t\.co$|tiktok\.|linkedin\.|youtube\.|youtu\.be|pinterest\.|whatsapp\./.test(hostname)) {
      const source = hostname.includes("instagram")
        ? "instagram"
        : (hostname.includes("facebook") || hostname.includes("fb."))
          ? "facebook"
          : (hostname.includes("twitter") || hostname.endsWith("t.co"))
            ? "twitter"
            : hostname.includes("tiktok")
              ? "tiktok"
              : hostname.includes("linkedin")
                ? "linkedin"
                : (hostname.includes("youtube") || hostname.includes("youtu.be"))
                  ? "youtube"
                  : hostname.includes("pinterest")
                    ? "pinterest"
                    : "whatsapp";
      return { source, medium: "social" };
    }

    return { source: hostname || "referral", medium: "referral" };
  } catch {
    return { source: "direct", medium: "none" };
  }
};

const readStoredAttribution = (): AttributionSnapshot | null => {
  try {
    const raw = window.sessionStorage.getItem(TRACKING_ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttributionSnapshot;
    return {
      source: sanitizeAttributionValue(parsed?.source, 100),
      medium: sanitizeAttributionValue(parsed?.medium, 100),
      campaign: sanitizeAttributionValue(parsed?.campaign, 200),
      content: sanitizeAttributionValue(parsed?.content, 200),
      term: sanitizeAttributionValue(parsed?.term, 200),
    };
  } catch {
    return null;
  }
};

const writeStoredAttribution = (value: AttributionSnapshot): void => {
  try {
    window.sessionStorage.setItem(TRACKING_ATTRIBUTION_KEY, JSON.stringify(value));
  } catch {
    // Ignore sessionStorage quota/private mode errors.
  }
};

const buildSessionAttribution = (): AttributionSnapshot => {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  const utmSource = sanitizeAttributionValue(params.get("utm_source"), 100);
  const utmMedium = sanitizeAttributionValue(params.get("utm_medium"), 100);
  const utmCampaign = sanitizeAttributionValue(params.get("utm_campaign"), 200);
  const utmContent = sanitizeAttributionValue(params.get("utm_content"), 200);
  const utmTerm = sanitizeAttributionValue(params.get("utm_term"), 200);

  const existing = readStoredAttribution();
  if (existing) return existing;
  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || utmContent || utmTerm);

  if (hasUtm) {
    const fromReferrer = getSourceFromReferrer(document.referrer || "");
    const next: AttributionSnapshot = {
      source: utmSource || fromReferrer.source,
      medium: utmMedium || fromReferrer.medium,
      campaign: utmCampaign,
      content: utmContent,
      term: utmTerm,
    };
    writeStoredAttribution(next);
    return next;
  }

  const fromReferrer = getSourceFromReferrer(document.referrer || "");
  const fallback: AttributionSnapshot = {
    source: fromReferrer.source,
    medium: fromReferrer.medium,
    campaign: null,
    content: null,
    term: null,
  };
  writeStoredAttribution(fallback);
  return fallback;
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

export const trackEvent = (eventName: string, label?: string | null, context: TrackingEventContext = {}): void => {
  if (!isBrowser) return;
  if (!eventName || isAdminPath(window.location.pathname)) return;

  const normalized = normalizeTrackPayload(eventName, label);
  if (!normalized.eventName) return;

  const sessionId = getSessionId();
  const attribution = buildSessionAttribution();
  const payload = {
    page_url: `${window.location.pathname}${window.location.search}`,
    session_id: sessionId,
    location: context.location || normalizeKey(window.location.pathname) || "home",
    package_id: context.packageId || null,
    referrer: document.referrer || null,
    device_type: getDeviceType(),
    source: attribution.source,
    medium: attribution.medium,
    utm_source: attribution.source,
    utm_medium: attribution.medium,
    utm_campaign: attribution.campaign,
    utm_content: attribution.content,
    utm_term: attribution.term,
    timestamp: new Date().toISOString(),
  };
  if (sessionStarted) {
    sessionStarted = false;
    postEvent({ ...payload, event_name: "session_started", label: window.location.pathname, package_id: null });
  }
  postEvent({ ...payload, event_name: normalized.eventName, label: normalized.label });
};

export const getTrackingContext = () => {
  if (!isBrowser) return null;
  return { session_id: getSessionId(), ...buildSessionAttribution() };
};

export const trackPageView = (): void => {
  if (!isBrowser || isAdminPath(window.location.pathname)) return;
  trackEvent("page_view", window.location.pathname);
  if (window.location.pathname.replace(/\/$/, "") === "/session-packages") {
    trackEvent("packages_viewed", "session_packages", { location: "session_packages" });
  }
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

      trackEvent(parsed.eventName, parsed.label, {
        location: trackedElement.getAttribute("data-track-location") || undefined,
        packageId: trackedElement.getAttribute("data-track-package-id") || undefined,
      });
    },
    { capture: true }
  );
};
