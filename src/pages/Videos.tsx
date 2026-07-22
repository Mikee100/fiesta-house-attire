import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";

const fallbackVideos = [
  {
    id: "fallback-01",
    video_url: "1165729659",
    title: "Elegance in Motion",
    desc: "A full cinematic session - flowing gowns, soft light, and the quiet confidence of a mother-to-be.",
    is_featured: true,
  },
  {
    id: "fallback-02",
    video_url: "1165726953",
    title: "The Golden Hour",
    desc: "Warm tones and soft movement - a session that feels as beautiful as it looks.",
    is_featured: true,
  },
  {
    id: "fallback-03",
    video_url: "1165725190",
    title: "Soft and Luminous",
    desc: "Delicate styling, intentional light - every frame a portrait of motherhood.",
    is_featured: true,
  },
  {
    id: "fallback-04",
    video_url: "1165724123",
    title: "A Story of Two",
    desc: "Quiet anticipation and deep joy - a couple awaiting their greatest chapter.",
    is_featured: false,
  },
  {
    id: "fallback-05",
    video_url: "1165723473",
    title: "Pure Radiance",
    desc: "Bold colour, fearless confidence - a session as unique as her story.",
    is_featured: false,
  },
];

type DisplayVideo = {
  id: string;
  video_url: string;
  title: string;
  desc: string;
  is_featured?: boolean;
  num?: string;
};

type ModalState = { video_url: string; title: string; desc: string } | null;

const HERO_BACKGROUND_VIDEO_URL = "https://www.youtube.com/watch?v=V7CwmmVwn94";
const HERO_BACKGROUND_VIDEO_TITLE = "17 March 2022";

// ---------------------------------------------------------------------------
// URL Helpers
// ---------------------------------------------------------------------------

const getYouTubeId = (value: string) => {
  const raw = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  const normalized = raw
    .replace(/\s+/g, "")
    .replace(/youtube\.comshorts\//i, "youtube.com/shorts/")
    .replace(/youtube\.com\/short\//i, "youtube.com/shorts/")
    .replace(/youtube\.comshort\//i, "youtube.com/shorts/");

  const match = normalized.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts?\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );
  if (match) return match[1];

  const tailToken = normalized.match(/([a-zA-Z0-9_-]{11})(?:\?|&|\/|$)/);
  return tailToken ? tailToken[1] : null;
};

const getVimeoId = (value: string) => {
  const url = value.trim();
  if (/^\d+$/.test(url)) return url;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

const isDirectVideoFile = (value: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(value);

// ---------------------------------------------------------------------------
// Vimeo oEmbed thumbnail (official API, in-memory cache)
// ---------------------------------------------------------------------------

const vimeoThumbCache = new Map<string, string | null>();
const vimeoThumbInflight = new Map<string, Promise<string | null>>();

const fetchVimeoThumbnail = (vimeoId: string): Promise<string | null> => {
  if (vimeoThumbCache.has(vimeoId)) {
    return Promise.resolve(vimeoThumbCache.get(vimeoId)!);
  }
  if (vimeoThumbInflight.has(vimeoId)) {
    return vimeoThumbInflight.get(vimeoId)!;
  }

  const promise = fetch(
    `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}&width=640`,
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { thumbnail_url?: string } | null) => {
      const url = data?.thumbnail_url ?? null;
      vimeoThumbCache.set(vimeoId, url);
      vimeoThumbInflight.delete(vimeoId);
      return url;
    })
    .catch(() => {
      vimeoThumbCache.set(vimeoId, null);
      vimeoThumbInflight.delete(vimeoId);
      return null;
    });

  vimeoThumbInflight.set(vimeoId, promise);
  return promise;
};

// ---------------------------------------------------------------------------
// YouTube thumbnail placeholder (no ytimg requests, avoids 404 console noise)
// ---------------------------------------------------------------------------
function YouTubeThumbnail({ title }: { title: string }) {
  return (
    <div
      role="img"
      aria-label={`${title} preview`}
      style={{
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 30% 30%, rgba(196,92,130,.22) 0%, rgba(44,44,42,.7) 45%, #191918 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: ".55rem", color: "rgba(255,255,255,.7)" }}>
        <svg width="18" height="18" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true">
          <path d="M0 0l14 8L0 16z" />
        </svg>
        <span style={{ fontSize: ".62rem", letterSpacing: ".2em", textTransform: "uppercase" }}>YouTube</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VimeoThumbnail — shows shimmer then real thumbnail
// ---------------------------------------------------------------------------
function VimeoThumbnail({ vimeoId, title, eager }: { vimeoId: string; title: string; eager?: boolean }) {
  const [thumb, setThumb] = useState<string | null>(
    vimeoThumbCache.has(vimeoId) ? vimeoThumbCache.get(vimeoId)! : null,
  );
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    vimeoThumbCache.has(vimeoId) ? "loaded" : "loading",
  );

  useEffect(() => {
    if (status !== "loading") return;
    let cancelled = false;
    fetchVimeoThumbnail(vimeoId).then((url) => {
      if (cancelled) return;
      setThumb(url);
      setStatus(url ? "loaded" : "error");
    });
    return () => { cancelled = true; };
  }, [vimeoId, status]);

  if (status === "loading") {
    return (
      <div className="vp-shimmer" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />
    );
  }

  if (status === "loaded" && thumb) {
    return (
      <img
        src={thumb}
        alt={`${title} preview`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }

  // Polished fallback
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#1a1a1a 0%,#2c2c2a 60%,#1a1a1a 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity={0.25}>
        <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="1" />
        <path d="M13 10l12 6-12 6V10z" fill="white" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thumbnail builder
// ---------------------------------------------------------------------------
function ThumbnailLayer({ videoUrl, title, eager }: { videoUrl: string; title: string; eager?: boolean }) {
  const ytId = getYouTubeId(videoUrl);
  if (ytId) return <YouTubeThumbnail title={title} />;

  const vimeoId = getVimeoId(videoUrl);
  if (vimeoId) return <VimeoThumbnail vimeoId={vimeoId} title={title} eager={eager} />;

  if (isDirectVideoFile(videoUrl)) {
    return (
      <video src={videoUrl} muted playsInline preload="none" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.5)", fontSize: ".75rem" }}>
      No preview
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video hover preview src builder
// ---------------------------------------------------------------------------
const getHoverPreviewSrc = (videoUrl: string): string | null => {
  const ytId = getYouTubeId(videoUrl);
  if (ytId) {
    // enablejsapi=0 keeps it lightweight; mute=1 is required for autoplay
    return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&playsinline=1&rel=0&enablejsapi=0`;
  }
  const vimeoId = getVimeoId(videoUrl);
  if (vimeoId) {
    // background=1 = silent, no controls, auto-crops to fill container
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&background=1&loop=1&quality=540p`;
  }
  return null;
};

// ---------------------------------------------------------------------------
// VideoCard — thumbnail + hover (desktop) + scroll-into-view autoplay (mobile)
// ---------------------------------------------------------------------------
type VideoCardProps = {
  video: DisplayVideo;
  eager?: boolean;
  onOpen: (url: string, title: string, desc: string) => void;
  isPreviewActive: boolean;
  onPreviewActivate: (videoId: string) => void;
  onPreviewDeactivate: (videoId: string) => void;
  overlayStyle: CSSProperties;
  playBtnStyle: CSSProperties;
  playIconSize?: number;
  showBadge?: boolean;
};

function VideoCard({ video, eager, onOpen, isPreviewActive, onPreviewActivate, onPreviewDeactivate, overlayStyle, playBtnStyle, playIconSize = 14, showBadge = false }: VideoCardProps) {
  const [previewVisible, setPreviewVisible] = useState(false); // iframe faded in
  const hoverTimer   = useRef<number | null>(null);
  const previewTimer = useRef<number | null>(null);
  const cardRef      = useRef<HTMLDivElement>(null);

  const previewSrc = getHoverPreviewSrc(video.video_url);
  const isYouTube  = Boolean(getYouTubeId(video.video_url));

  // Preview visibility follows shared active state; only one card can be active.
  useEffect(() => {
    if (!isPreviewActive || !previewSrc) {
      if (previewTimer.current) {
        clearTimeout(previewTimer.current);
        previewTimer.current = null;
      }
      setPreviewVisible(false);
      return;
    }

    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => setPreviewVisible(true), 900);

    return () => {
      if (previewTimer.current) {
        clearTimeout(previewTimer.current);
        previewTimer.current = null;
      }
    };
  }, [isPreviewActive, previewSrc]);

  // ── Desktop: mouse hover ────────────────────────────────────────────────────
  const handleMouseEnter = () => {
    if (!previewSrc) return;
    hoverTimer.current = window.setTimeout(() => onPreviewActivate(video.id), 200); // 200 ms debounce
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    onPreviewDeactivate(video.id);
  };

  // ── Mobile / touch: auto-play when card scrolls ≥50% into view ─────────────
  // Uses IntersectionObserver — no hover needed, works exactly like TikTok/Reels.
  // Only activates on genuine touch devices (phones & tablets).
  useEffect(() => {
    const isTouchOnly = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isTouchOnly || !cardRef.current || !previewSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onPreviewActivate(video.id);
          else onPreviewDeactivate(video.id);
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
      onPreviewDeactivate(video.id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSrc, onPreviewActivate, onPreviewDeactivate, video.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer.current)   clearTimeout(hoverTimer.current);
      if (previewTimer.current) {
        clearTimeout(previewTimer.current);
        previewTimer.current = null;
      }
    };
  }, []);

  // YouTube is 16:9 landscape — scale to fill portrait (9:16) card.
  // Vimeo background=1 already crops/fills the container natively.
  const iframeStyle: CSSProperties = isYouTube
    ? {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "320%",
        height: "100%",
        transform: "translate(-50%, -50%)",
        border: "none",
        opacity: previewVisible ? 1 : 0,
        transition: "opacity 0.6s ease",
        zIndex: 2,
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        opacity: previewVisible ? 1 : 0,
        transition: "opacity 0.6s ease",
        zIndex: 2,
        pointerEvents: "none",
      };

  return (
    <div
      ref={cardRef}
      className="vp-card"
      onClick={() => onOpen(video.video_url, video.title, video.desc)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", cursor: "pointer", overflow: "hidden", background: "#000" }}
    >
      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "9/16" }}>

        {/* Static thumbnail — fades out once preview video is buffered */}
        <div style={{
          position: "absolute", inset: 0,
          opacity: previewVisible ? 0 : 1,
          transition: "opacity 0.6s ease",
          zIndex: 1,
        }}>
          <ThumbnailLayer videoUrl={video.video_url} title={video.title} eager={eager} />
        </div>

        {/* Preview iframe — mounts on hover (desktop) or scroll-into-view (mobile) */}
        {isPreviewActive && previewSrc && (
          <iframe
            src={previewSrc}
            allow="autoplay; fullscreen; picture-in-picture"
            style={iframeStyle}
          />
        )}

        {/* Overlay — always on top of everything */}
        <div className="vp-overlay" style={{ ...overlayStyle, zIndex: 3 }}>
          <div className="vp-play" style={playBtnStyle}>
            <svg width={playIconSize} height={playIconSize * 1.14} viewBox="0 0 14 16" fill="white">
              <path d="M0 0l14 8L0 16z" />
            </svg>
          </div>
          {showBadge && (
            <div style={{ fontSize: ".6rem", letterSpacing: ".25em", textTransform: "uppercase", color: "#C9A96E", marginBottom: ".5rem" }}>
              Film No. {video.num}
            </div>
          )}
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: playIconSize > 12 ? "1.5rem" : "1rem", fontWeight: 300, color: "#fff", lineHeight: 1.2 }}>
            {video.title}
          </div>
        </div>

        {/* Live badge — visible on both desktop (hover) and mobile (scroll) */}
        {previewVisible && (
          <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 4, display: "flex", alignItems: "center", gap: ".4rem", background: "rgba(0,0,0,.55)", backdropFilter: "blur(8px)", borderRadius: "999px", padding: ".25rem .7rem" }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#C45C82", animation: "vp-pulse 1.2s ease infinite" }} />
            <span style={{ fontSize: ".55rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>Live Preview</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton shimmer card
// ---------------------------------------------------------------------------
function SkeletonCard({ aspectRatio = "9/16" }: { aspectRatio?: string }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", aspectRatio, background: "#1a1a1a" }}>
      <div className="vp-shimmer" style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", bottom: "1.25rem", left: "1.25rem", right: "1.25rem" }}>
        <div className="vp-shimmer-bar" style={{ height: "10px", width: "40%", marginBottom: "8px", borderRadius: "4px" }} />
        <div className="vp-shimmer-bar" style={{ height: "18px", width: "70%", borderRadius: "4px" }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal media builder
// ---------------------------------------------------------------------------
const buildModalMedia = (videoUrl: string, title: string) => {
  const ytId = getYouTubeId(videoUrl);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&loop=1&playlist=${ytId}&controls=1&playsinline=1&rel=0`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
      />
    );
  }

  const vimeoId = getVimeoId(videoUrl);
  if (vimeoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=C45C82`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
      />
    );
  }

  if (isDirectVideoFile(videoUrl)) {
    return (
      <video src={videoUrl} controls autoPlay playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    );
  }

  return <div style={{ color: "white", textAlign: "center", paddingTop: "2rem" }}>Invalid video URL</div>;
};

// ---------------------------------------------------------------------------
// Hero builders
// ---------------------------------------------------------------------------
const buildHeroMedia = (videoUrl: string, title: string) => {
  const ytId = getYouTubeId(videoUrl);
  if (ytId) {
    return (
      <iframe
        className="vp-hero-video"
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1`}
        title={`${title} hero background`}
        allow="autoplay; fullscreen; picture-in-picture"
        loading="eager"
      />
    );
  }
  const vimeoId = getVimeoId(videoUrl);
  if (vimeoId) {
    return (
      <iframe
        className="vp-hero-video"
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&title=0&byline=0&portrait=0`}
        title={`${title} hero background`}
        allow="autoplay; fullscreen; picture-in-picture"
        loading="eager"
      />
    );
  }
  if (isDirectVideoFile(videoUrl)) {
    return <video className="vp-hero-video" src={videoUrl} autoPlay muted loop playsInline />;
  }
  return null;
};

const buildHeroPoster = (videoUrl: string, title: string) => {
  const ytId = getYouTubeId(videoUrl);
  if (!ytId) return null;
  return (
    <div
      className="vp-hero-poster"
      role="img"
      aria-label={`${title} hero`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 40% 35%, rgba(196,92,130,.25) 0%, rgba(44,44,42,.55) 45%, #1f1f1e 100%)",
      }}
    >
      <span
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: "clamp(1.6rem,3.8vw,3rem)",
          letterSpacing: ".08em",
          color: "rgba(255,255,255,.6)",
          textTransform: "uppercase",
        }}
      >
        Fiesta House Films
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Videos() {
  const [modal, setModal] = useState<ModalState>(null);
  const [dbVideos, setDbVideos] = useState<api.VideoItem[]>([]);
  const [heroReady, setHeroReady] = useState(false);
  const [videosLoading, setVideosLoading] = useState(true);
  const [activePreviewVideoId, setActivePreviewVideoId] = useState<string | null>(null);
  const fadeRefs = useRef<Element[]>([]);

  // DNS preconnect for faster asset loads
  useEffect(() => {
    const origins = [
      "https://i.ytimg.com",
      "https://vimeo.com",
      "https://i.vimeocdn.com",
      "https://player.vimeo.com",
      "https://www.youtube.com",
    ];
    const added: HTMLLinkElement[] = [];
    origins.forEach((href) => {
      if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = href;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
        added.push(link);
      }
    });
    return () => added.forEach((l) => l.remove());
  }, []);

  // Scroll-in animations
  useEffect(() => {
    window.scrollTo(0, 0);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("vp-in");
      }),
      { threshold: 0.1 },
    );
    fadeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Modal scroll lock
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  // Hero iframe deferred until idle
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    const activate = () => { if (!cancelled) setHeroReady(true); };
    const win = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (win.requestIdleCallback) win.requestIdleCallback(activate, { timeout: 1500 });
    else timeoutId = window.setTimeout(activate, 900);
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); };
  }, []);

  // Fetch real videos
  useEffect(() => {
    let cancelled = false;

    // Prefetch Vimeo thumbs for fallbacks while API loads
    fallbackVideos.forEach((v) => {
      const vid = getVimeoId(v.video_url);
      if (vid && !vimeoThumbCache.has(vid)) fetchVimeoThumbnail(vid);
    });

    const loadVideos = async () => {
      try {
        const data = await api.fetchVideos();
        if (cancelled) return;
        if (Array.isArray(data)) {
          setDbVideos(data);
          // Prefetch Vimeo thumbs for real videos
          data.forEach((v) => {
            const vid = getVimeoId(v.video_url);
            if (vid && !vimeoThumbCache.has(vid)) fetchVimeoThumbnail(vid);
          });
        }
      } catch (_err) {
        if (!cancelled) setDbVideos([]);
      } finally {
        if (!cancelled) setVideosLoading(false);
      }
    };
    loadVideos();
    return () => { cancelled = true; };
  }, []);

  const addRef = (el: Element | null) => {
    if (el && !fadeRefs.current.includes(el)) fadeRefs.current.push(el);
  };

  const activatePreview = (videoId: string) => {
    setActivePreviewVideoId(videoId);
  };

  const deactivatePreview = (videoId: string) => {
    setActivePreviewVideoId((current) => (current === videoId ? null : current));
  };

  const open = (video_url: string, title: string, desc: string) => {
    setActivePreviewVideoId(null);
    setModal({ video_url, title, desc });
  };

  const galleryVideos: DisplayVideo[] = dbVideos.length > 0
    ? dbVideos.map((v) => ({ id: v.id, video_url: v.video_url, title: v.title, desc: v.description || "", is_featured: v.is_featured }))
    : fallbackVideos;

  const featured = galleryVideos.slice(0, 3).map((v, idx) => ({ ...v, num: `0${idx + 1}` }));
  const more = galleryVideos.slice(3);

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top,rgba(0,0,0,.75) 0%,rgba(0,0,0,.1) 50%,transparent 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "1.5rem",
  };

  const playBtnStyle: CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    border: "1.5px solid rgba(255,255,255,.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all .3s",
  };

  return (
    <Layout
      title="Maternity Films Nairobi | Fiesta House Videos"
      description="Watch cinematic maternity films by Fiesta House Attire. Luxury sessions in motion with elegant styling and intentional storytelling."
      keywords="maternity videos nairobi, maternity films kenya, fiesta house videos"
    >
      <style>{`
        .vp-fade { opacity:0; transform:translateY(24px); transition:opacity .8s ease,transform .8s ease; }
        .vp-in   { opacity:1 !important; transform:translateY(0) !important; }
        .vp-card:hover .vp-play { background:var(--magenta,#660032)!important; border-color:var(--magenta,#660032)!important; transform:translate(-50%,-50%) scale(1.1)!important; }
        .vp-card:hover .vp-overlay { background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.3) 50%,rgba(0,0,0,.1) 100%)!important; }
        .vp-featured-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; align-items:start; }
        .vp-more-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
        .vp-modal-player { position:relative; width:min(92vw,430px); aspect-ratio:9/16; margin:0 auto; }
        .vp-modal-player iframe { position:absolute; inset:0; width:100%; height:100%; border:none; }
        .vp-hero-video {
          position: absolute; top: 50%; left: 50%;
          width: 100vw; height: 56.25vw;
          min-width: 177.78vh; min-height: 100vh;
          transform: translate(-50%, -50%) scale(1.08);
          border: 0; pointer-events: none;
        }
        .vp-hero-poster {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          filter: saturate(.9) brightness(.8);
        }
        @keyframes vp-shimmer-move {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .vp-shimmer {
          background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 37%, #1e1e1e 63%);
          background-size: 1200px 100%;
          animation: vp-shimmer-move 1.6s ease infinite;
        }
        .vp-shimmer-bar {
          background: linear-gradient(90deg, #2a2a2a 25%, #363636 37%, #2a2a2a 63%);
          background-size: 1200px 100%;
          animation: vp-shimmer-move 1.6s ease infinite;
          opacity: 0.5;
        }
        @keyframes vp-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(0.7); }
        }
        @media (max-width: 980px) {
          .vp-featured-grid { grid-template-columns:1fr; }
          .vp-more-grid { grid-template-columns:1fr 1fr; }
        }
        @media (max-width: 640px) {
          .vp-more-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{ height: "100vh", minHeight: "560px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden", background: "#2C2C2A" }}>
        {heroReady
          ? buildHeroMedia(HERO_BACKGROUND_VIDEO_URL, HERO_BACKGROUND_VIDEO_TITLE)
          : buildHeroPoster(HERO_BACKGROUND_VIDEO_URL, HERO_BACKGROUND_VIDEO_TITLE)}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 35%, rgba(196,92,130,.14) 0%, rgba(44,44,42,.40) 62%, rgba(29,29,28,.28) 100%)" }} aria-hidden="true" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.22) 0%, rgba(0,0,0,.12) 45%, rgba(0,0,0,.28) 100%)", pointerEvents: "none" }} />
        <span aria-hidden="true" style={{ position: "absolute", bottom: "-2rem", left: "50%", transform: "translateX(-50%)", fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(7rem,18vw,18rem)", fontWeight: 300, color: "rgba(255,255,255,.03)", whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none", lineHeight: 1 }}>FILMS</span>

        <div style={{ position: "relative", zIndex: 1, padding: "0 2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: ".75rem", fontSize: ".65rem", letterSpacing: ".35em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "2rem" }}>
            <span style={{ display: "block", width: "2rem", height: ".5px", background: "#C9A96E" }} />
            Cinematic Maternity Films
            <span style={{ display: "block", width: "2rem", height: ".5px", background: "#C9A96E" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(3.5rem,8vw,8rem)", fontWeight: 300, lineHeight: 1, color: "#fff", marginBottom: "1.5rem" }}>
            See the<br />
            <em style={{ fontStyle: "italic", color: "var(--magenta,#660032)" }}>glow</em> move.
          </h1>
          <p style={{ fontSize: ".85rem", lineHeight: 1.8, color: "rgba(255,255,255,.45)", fontWeight: 300, maxWidth: "42ch", margin: "0 auto" }}>
            Still images capture a moment. Film captures how it <em style={{ fontStyle: "italic", color: "rgba(255,255,255,.7)" }}>felt</em>. Watch our luxury maternity sessions come to life.
          </p>
        </div>

        <div style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem", color: "rgba(255,255,255,.3)", fontSize: ".62rem", letterSpacing: ".2em", textTransform: "uppercase" }}>
          <span>Watch</span>
          <div style={{ width: ".5px", height: "3rem", background: "linear-gradient(to bottom,rgba(255,255,255,.3),transparent)" }} />
        </div>
      </section>

      {/* ── Featured Films ── */}
      <section className="vp-fade" ref={addRef} style={{ padding: "6rem clamp(1.5rem,5vw,3rem)", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontSize: ".65rem", letterSpacing: ".35em", textTransform: "uppercase", color: "var(--magenta,#660032)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ display: "block", width: "2rem", height: ".5px", background: "var(--magenta,#660032)" }} />
          Featured Films
          <span style={{ fontSize: ".55rem", color: "rgba(0,0,0,.35)", letterSpacing: ".1em", marginLeft: ".5rem" }}>Hover to preview</span>
        </div>

        {videosLoading ? (
          <div className="vp-featured-grid">
            <SkeletonCard aspectRatio="9/16" />
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <SkeletonCard aspectRatio="9/16" />
              <SkeletonCard aspectRatio="9/16" />
            </div>
          </div>
        ) : (
          <div className="vp-featured-grid">
            {/* First (large) featured card */}
            <div style={{ gridRow: "span 2" }}>
              <VideoCard
                video={featured[0]}
                eager
                onOpen={open}
                isPreviewActive={activePreviewVideoId === featured[0].id}
                onPreviewActivate={activatePreview}
                onPreviewDeactivate={deactivatePreview}
                overlayStyle={overlayStyle}
                playBtnStyle={playBtnStyle}
                playIconSize={14}
                showBadge
              />
            </div>

            {/* Smaller featured cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {featured.slice(1).map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  eager
                  onOpen={open}
                  isPreviewActive={activePreviewVideoId === v.id}
                  onPreviewActivate={activatePreview}
                  onPreviewDeactivate={deactivatePreview}
                  overlayStyle={overlayStyle}
                  playBtnStyle={{ ...playBtnStyle, width: "44px", height: "44px" }}
                  playIconSize={12}
                  showBadge
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── More Films ── */}
      <section style={{ background: "#F5F0E8", padding: "6rem clamp(1.5rem,5vw,3rem)" }}>
        <div className="vp-fade" ref={addRef} style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "3rem", borderBottom: ".5px solid rgba(44,44,42,.1)", paddingBottom: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 300 }}>More Films</h2>
            <span style={{ fontSize: ".65rem", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A7873" }}>
              {String(galleryVideos.length).padStart(2, "0")} Sessions
            </span>
          </div>

          {videosLoading ? (
            <div className="vp-more-grid">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} aspectRatio="9/16" />)}
            </div>
          ) : (
            <div className="vp-more-grid">
              {more.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  onOpen={open}
                  isPreviewActive={activePreviewVideoId === v.id}
                  onPreviewActivate={activatePreview}
                  onPreviewDeactivate={deactivatePreview}
                  overlayStyle={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 50%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "1rem" }}
                  playBtnStyle={{ ...playBtnStyle, width: "40px", height: "40px" }}
                  playIconSize={11}
                />
              ))}

              {/* CTA card */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "2rem", background: "#2C2C2A", aspectRatio: "9/16" }}>
                <div style={{ fontSize: ".6rem", letterSpacing: ".3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "1.5rem" }}>Your film awaits</div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.4rem", fontWeight: 300, fontStyle: "italic", color: "#fff", lineHeight: 1.3, marginBottom: "2rem" }}>
                  Want a film<br />of your own?
                </p>
                <Link to="/contact" style={{ display: "inline-block", padding: ".7rem 1.6rem", border: ".5px solid rgba(255,255,255,.3)", color: "rgba(255,255,255,.8)", textDecoration: "none", fontSize: ".62rem", letterSpacing: ".25em", textTransform: "uppercase" }}>
                  Book a Session
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="vp-fade" ref={addRef} style={{ padding: "7rem clamp(1.5rem,5vw,3rem)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "40rem", height: "40rem", borderRadius: "50%", background: "radial-gradient(circle,rgba(196,92,130,.06) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: ".65rem", letterSpacing: ".35em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "1.5rem" }}>Begin your story</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(2.5rem,5vw,5rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, marginBottom: "2.5rem" }}>
            Your pregnancy deserves<br />
            to be <em style={{ fontStyle: "normal", color: "var(--magenta,#660032)" }}>felt</em>, not just seen.
          </h2>
          <Link to="/contact" style={{ display: "inline-block", padding: ".9rem 2.8rem", background: "var(--magenta,#660032)", color: "#fff", textDecoration: "none", fontSize: ".68rem", letterSpacing: ".25em", textTransform: "uppercase" }}>
            Book Your Film Session
          </Link>
        </div>
      </section>

      {/* ── Modal ── */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "520px" }}>
            <button
              onClick={() => setModal(null)}
              style={{ position: "absolute", top: "-3rem", right: 0, background: "none", border: "none", cursor: "pointer", fontSize: ".65rem", letterSpacing: ".25em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: ".75rem" }}
            >
              Close X
            </button>
            <div className="vp-modal-player">
              {buildModalMedia(modal.video_url, modal.title)}
            </div>
            <div style={{ paddingTop: "1.25rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.4rem", fontWeight: 300, fontStyle: "italic", color: "#fff", marginBottom: ".4rem" }}>{modal.title}</p>
              <p style={{ fontSize: ".78rem", lineHeight: 1.7, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>{modal.desc}</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
