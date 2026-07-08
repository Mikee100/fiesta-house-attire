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
};

type ModalState = { video_url: string; title: string; desc: string } | null;

const HERO_BACKGROUND_VIDEO_URL = "https://www.youtube.com/watch?v=V7CwmmVwn94";
const HERO_BACKGROUND_VIDEO_TITLE = "17 March 2022";

const getYouTubeId = (value: string) => {
  const url = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getVimeoId = (value: string) => {
  const url = value.trim();
  if (/^\d+$/.test(url)) return url;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

const isDirectVideoFile = (value: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(value);

const buildPreviewMedia = (videoUrl: string, title: string) => {
  const ytId = getYouTubeId(videoUrl);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1`}
        title={`${title} preview`}
        allow="autoplay; encrypted-media; picture-in-picture"
        loading="lazy"
        style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }}
      />
    );
  }

  const vimeoId = getVimeoId(videoUrl);
  if (vimeoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&title=0&byline=0&portrait=0`}
        title={`${title} preview`}
        allow="autoplay; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }}
      />
    );
  }

  if (isDirectVideoFile(videoUrl)) {
    return (
      <video
        src={videoUrl}
        muted
        playsInline
        preload="none"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
      />
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
      Invalid video URL
    </div>
  );
};

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
      <video
        src={videoUrl}
        controls
        autoPlay
        playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return <div style={{ color: "white", textAlign: "center", paddingTop: "2rem" }}>Invalid video URL</div>;
};

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

function PlayIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.14} viewBox="0 0 14 16" fill="white">
      <path d="M0 0l14 8L0 16z" />
    </svg>
  );
}

export default function Videos() {
  const [modal, setModal] = useState<ModalState>(null);
  const [dbVideos, setDbVideos] = useState<api.VideoItem[]>([]);
  const fadeRefs = useRef<Element[]>([]);

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

  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await api.fetchVideos();
        if (Array.isArray(data)) {
          setDbVideos(data);
        }
      } catch (err) {
        setDbVideos([]);
      }
    };
    loadVideos();
  }, []);

  const addRef = (el: Element | null) => {
    if (el && !fadeRefs.current.includes(el)) fadeRefs.current.push(el);
  };

  const open = (video_url: string, title: string, desc: string) => setModal({ video_url, title, desc });

  const galleryVideos: DisplayVideo[] = dbVideos.length > 0
    ? dbVideos.map((v) => ({
        id: v.id,
        video_url: v.video_url,
        title: v.title,
        desc: v.description || "",
        is_featured: v.is_featured,
      }))
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
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 56.25vw;
          min-width: 177.78vh;
          min-height: 100vh;
          transform: translate(-50%, -50%) scale(1.08);
          border: 0;
          pointer-events: none;
        }
        @media (max-width: 980px) {
          .vp-featured-grid { grid-template-columns:1fr; }
          .vp-more-grid { grid-template-columns:1fr 1fr; }
        }
        @media (max-width: 640px) {
          .vp-more-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <section
        style={{
          height: "100vh",
          minHeight: "560px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          background: "#2C2C2A",
        }}
      >
        {buildHeroMedia(HERO_BACKGROUND_VIDEO_URL, HERO_BACKGROUND_VIDEO_TITLE)}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 70% 60% at 50% 35%, rgba(196,92,130,.14) 0%, rgba(44,44,42,.40) 62%, rgba(29,29,28,.28) 100%)",
          }}
          aria-hidden="true"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,.22) 0%, rgba(0,0,0,.12) 45%, rgba(0,0,0,.28) 100%), radial-gradient(ellipse 60% 70% at 50% 40%, rgba(196,92,130,.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-2rem",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(7rem,18vw,18rem)",
            fontWeight: 300,
            color: "rgba(255,255,255,.03)",
            whiteSpace: "nowrap",
            userSelect: "none",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          FILMS
        </span>

        <div style={{ position: "relative", zIndex: 1, padding: "0 2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".75rem",
              fontSize: ".65rem",
              letterSpacing: ".35em",
              textTransform: "uppercase",
              color: "#C9A96E",
              marginBottom: "2rem",
            }}
          >
            <span style={{ display: "block", width: "2rem", height: ".5px", background: "#C9A96E" }} />
            Cinematic Maternity Films
            <span style={{ display: "block", width: "2rem", height: ".5px", background: "#C9A96E" }} />
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(3.5rem,8vw,8rem)",
              fontWeight: 300,
              lineHeight: 1,
              color: "#fff",
              marginBottom: "1.5rem",
            }}
          >
            See the
            <br />
            <em style={{ fontStyle: "italic", color: "var(--magenta,#660032)" }}>glow</em> move.
          </h1>
          <p style={{ fontSize: ".85rem", lineHeight: 1.8, color: "rgba(255,255,255,.45)", fontWeight: 300, maxWidth: "42ch", margin: "0 auto" }}>
            Still images capture a moment. Film captures how it <em style={{ fontStyle: "italic", color: "rgba(255,255,255,.7)" }}>felt</em>. Watch our luxury maternity sessions come to life - movement, light, and the quiet beauty of expecting.
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: ".5rem",
            color: "rgba(255,255,255,.3)",
            fontSize: ".62rem",
            letterSpacing: ".2em",
            textTransform: "uppercase",
          }}
        >
          <span>Watch</span>
          <div style={{ width: ".5px", height: "3rem", background: "linear-gradient(to bottom,rgba(255,255,255,.3),transparent)" }} />
        </div>
      </section>

      <section className="vp-fade" ref={addRef} style={{ padding: "6rem clamp(1.5rem,5vw,3rem)", maxWidth: "1200px", margin: "0 auto", contentVisibility: "auto", containIntrinsicSize: "1000px" }}>
        <div style={{ fontSize: ".65rem", letterSpacing: ".35em", textTransform: "uppercase", color: "var(--magenta,#660032)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ display: "block", width: "2rem", height: ".5px", background: "var(--magenta,#660032)" }} />
          Featured Films
        </div>

        <div className="vp-featured-grid">
          {(() => {
            const v = featured[0];
            return (
              <div key={v.id} className="vp-card" onClick={() => open(v.video_url, v.title, v.desc)} style={{ position: "relative", cursor: "pointer", overflow: "hidden", background: "#000", gridRow: "span 2" }}>
                <div style={{ position: "relative", overflow: "hidden", aspectRatio: "9/16" }}>
                  {buildPreviewMedia(v.video_url, v.title)}
                  <div className="vp-overlay" style={overlayStyle}>
                    <div className="vp-play" style={playBtnStyle}><PlayIcon size={14} /></div>
                    <div style={{ fontSize: ".6rem", letterSpacing: ".25em", textTransform: "uppercase", color: "#C9A96E", marginBottom: ".5rem" }}>Film No. {v.num}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 300, color: "#fff", lineHeight: 1.2 }}>{v.title}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {featured.slice(1).map((v) => (
              <div key={v.id} className="vp-card" onClick={() => open(v.video_url, v.title, v.desc)} style={{ position: "relative", cursor: "pointer", overflow: "hidden", background: "#000" }}>
                <div style={{ position: "relative", overflow: "hidden", aspectRatio: "9/16" }}>
                  {buildPreviewMedia(v.video_url, v.title)}
                  <div className="vp-overlay" style={overlayStyle}>
                    <div className="vp-play" style={playBtnStyle}><PlayIcon size={14} /></div>
                    <div style={{ fontSize: ".6rem", letterSpacing: ".25em", textTransform: "uppercase", color: "#C9A96E", marginBottom: ".5rem" }}>Film No. {v.num}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.2rem", fontWeight: 300, color: "#fff", lineHeight: 1.2 }}>{v.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#F5F0E8", padding: "6rem clamp(1.5rem,5vw,3rem)", contentVisibility: "auto", containIntrinsicSize: "1200px" }}>
        <div className="vp-fade" ref={addRef} style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "3rem", borderBottom: ".5px solid rgba(44,44,42,.1)", paddingBottom: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 300 }}>More Films</h2>
            <span style={{ fontSize: ".65rem", letterSpacing: ".2em", textTransform: "uppercase", color: "#7A7873" }}>
              {String(galleryVideos.length).padStart(2, "0")} Sessions
            </span>
          </div>

          <div className="vp-more-grid">
            {more.map((v) => (
              <div key={v.id} className="vp-card" onClick={() => open(v.video_url, v.title, v.desc)} style={{ position: "relative", cursor: "pointer", overflow: "hidden", background: "#000" }}>
                <div style={{ position: "relative", overflow: "hidden", aspectRatio: "9/16" }}>
                  {buildPreviewMedia(v.video_url, v.title)}
                  <div className="vp-overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 50%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "1rem" }}>
                    <div className="vp-play" style={{ ...playBtnStyle, width: "40px", height: "40px" }}><PlayIcon size={11} /></div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1rem", fontWeight: 300, color: "#fff", lineHeight: 1.2 }}>{v.title}</div>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "2rem", background: "#2C2C2A", aspectRatio: "9/16" }}>
              <div style={{ fontSize: ".6rem", letterSpacing: ".3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "1.5rem" }}>Your film awaits</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.4rem", fontWeight: 300, fontStyle: "italic", color: "#fff", lineHeight: 1.3, marginBottom: "2rem" }}>
                Want a film
                <br />
                of your own?
              </p>
              <Link to="/contact" style={{ display: "inline-block", padding: ".7rem 1.6rem", border: ".5px solid rgba(255,255,255,.3)", color: "rgba(255,255,255,.8)", textDecoration: "none", fontSize: ".62rem", letterSpacing: ".25em", textTransform: "uppercase" }}>
                Book a Session
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vp-fade" ref={addRef} style={{ padding: "7rem clamp(1.5rem,5vw,3rem)", textAlign: "center", position: "relative", overflow: "hidden", contentVisibility: "auto", containIntrinsicSize: "900px" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "40rem", height: "40rem", borderRadius: "50%", background: "radial-gradient(circle,rgba(196,92,130,.06) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: ".65rem", letterSpacing: ".35em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "1.5rem" }}>Begin your story</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(2.5rem,5vw,5rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, marginBottom: "2.5rem" }}>
            Your pregnancy deserves
            <br />
            to be <em style={{ fontStyle: "normal", color: "var(--magenta,#660032)" }}>felt</em>, not just seen.
          </h2>
          <Link to="/contact" style={{ display: "inline-block", padding: ".9rem 2.8rem", background: "var(--magenta,#660032)", color: "#fff", textDecoration: "none", fontSize: ".68rem", letterSpacing: ".25em", textTransform: "uppercase" }}>
            Book Your Film Session
          </Link>
        </div>
      </section>

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


