import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";

const GOWNS_FOLDER_ID = "b8b100e9-81ce-4778-bf57-0adee0b46fc0";

const getYouTubeThumbnail = (value: string): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  const match = normalized.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts?\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (!match) return null;
  return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
};

const getVimeoThumbnail = (value: string): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (/^\d+$/.test(normalized)) return `https://vumbnail.com/${normalized}.jpg`;
  const match = normalized.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (!match) return null;
  return `https://vumbnail.com/${match[1]}.jpg`;
};

const getVideoPreviewImage = (value: string): string | null => {
  return getYouTubeThumbnail(value) || getVimeoThumbnail(value);
};

const getYouTubeEmbedUrl = (value: string): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  const match = normalized.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts?\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (!match) return null;
  const videoId = match[1];
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0&playsinline=1&loop=1&playlist=${videoId}`;
};

const getVimeoEmbedUrl = (value: string): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (/^\d+$/.test(normalized)) {
    return `https://player.vimeo.com/video/${normalized}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0`;
  }
  const match = normalized.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (!match) return null;
  return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0`;
};

const getVideoEmbedUrl = (value: string): string | null => {
  return getYouTubeEmbedUrl(value) || getVimeoEmbedUrl(value);
};

type VibeKey = "soft-romantic" | "bold-editorial" | "family-led" | "minimal";

const VIBE_CONFIG: Array<{
  key: VibeKey;
  label: string;
  slug: string;
  accent: string;
  description: string;
}> = [
  {
    key: "soft-romantic",
    label: "Soft / Romantic",
    slug: "suspending-concept",
    accent: "var(--magenta)",
    description: "Airy drapes, delicate posing, glowing tones.",
  },
  {
    key: "bold-editorial",
    label: "Bold / Editorial",
    slug: "studio-shoots",
    accent: "var(--sky-blue)",
    description: "High-impact styling, confident fashion-forward frames.",
  },
  {
    key: "family-led",
    label: "Family-Led",
    slug: "family",
    accent: "#B09345",
    description: "Warm, connected storytelling with partner and siblings.",
  },
  {
    key: "minimal",
    label: "Minimal",
    slug: "best-rated",
    accent: "#4B5563",
    description: "Clean lines, timeless portraits, elegant simplicity.",
  },
];

const INCLUDED_ITEMS = [
  "Signature maternity gowns from our in-house collection",
  "Professional makeup artistry tailored to your styling direction",
  "Wardrobe and posing support throughout the session",
  "Guided posing for solo, partner, and sibling moments",
  "Curated retouching and polished final image delivery",
  "Private studio comfort with an all-women support team",
];

const Experience = () => {
  const [gownImages, setGownImages] = useState<string[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<string | null>(null);
  const [activeVibe, setActiveVibe] = useState<VibeKey>("soft-romantic");
  const [vibeImages, setVibeImages] = useState<Record<VibeKey, string[]>>({
    "soft-romantic": [],
    "bold-editorial": [],
    "family-led": [],
    minimal: [],
  });

  useEffect(() => {
    let cancelled = false;

    const loadLiveMedia = async () => {
      try {
        const [gownsData, videosData] = await Promise.all([
          api.fetchPublicAssets(GOWNS_FOLDER_ID, 1, 12),
          api.fetchVideos(),
        ]);

        if (!cancelled) {
          const gownUrls = Array.isArray(gownsData?.assets)
            ? gownsData.assets
                .map((asset) => asset?.url)
                .filter((url): url is string => typeof url === "string" && url.length > 0)
            : [];
          setGownImages(gownUrls);

          const featuredVideos = Array.isArray(videosData)
            ? videosData.filter((video) => video?.is_active)
            : [];
          const previewSource = featuredVideos.find((video) => video?.is_featured) || featuredVideos[0] || null;
          const thumbnail = previewSource?.video_url ? getVideoPreviewImage(previewSource.video_url) : null;
          const embedUrl = previewSource?.video_url ? getVideoEmbedUrl(previewSource.video_url) : null;
          setVideoPreviewUrl(thumbnail || gownUrls[0] || null);
          setVideoEmbedUrl(embedUrl);

          const vibeResponses = await Promise.all(
            VIBE_CONFIG.map(async (vibe) => {
              const data = await api.fetchPublicGalleryAssetsBySlug(vibe.slug, 1, 12);
              const urls = Array.isArray(data?.assets)
                ? data.assets
                    .map((asset) => asset?.url)
                    .filter((url): url is string => typeof url === "string" && url.length > 0)
                : [];
              return { key: vibe.key, urls };
            }),
          );

          const nextVibeImages: Record<VibeKey, string[]> = {
            "soft-romantic": [],
            "bold-editorial": [],
            "family-led": [],
            minimal: [],
          };

          for (const item of vibeResponses) {
            nextVibeImages[item.key] = item.urls.length > 0 ? item.urls : gownUrls;
          }

          setVibeImages(nextVibeImages);
        }
      } catch {
        if (!cancelled) {
          setGownImages([]);
          setVideoPreviewUrl(null);
          setVideoEmbedUrl(null);
          setVibeImages({
            "soft-romantic": [],
            "bold-editorial": [],
            "family-led": [],
            minimal: [],
          });
        }
      }
    };

    loadLiveMedia();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeVibeConfig = useMemo(
    () => VIBE_CONFIG.find((vibe) => vibe.key === activeVibe) || VIBE_CONFIG[0],
    [activeVibe],
  );
  const activeVibeImages = useMemo(() => (vibeImages[activeVibe] || []).slice(0, 8), [vibeImages, activeVibe]);

  return (
    <Layout
      title="The Experience | Luxury Maternity Session Journey"
      description="Discover the Fiesta House maternity experience in Nairobi, from gown selection and professional makeup to guided posing and heirloom image delivery."
      keywords="maternity photoshoot experience nairobi, luxury maternity studio process, pregnancy session journey"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.fiestahousematernity.com/" },
            { "@type": "ListItem", "position": 2, "name": "The Experience", "item": "https://www.fiestahousematernity.com/experience" }
          ]
        })}
      </script>
      {/* Walkthrough Section */}
      <section className="section-padding" style={{ paddingTop: "clamp(6.5rem, 10vw, 8.5rem)", backgroundColor: "white" }}>
        <div className="container">
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div className="mobile-center" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "3rem", flexWrap: "wrap" }}>
               <h1 className="display h1-mobile" style={{ fontSize: "5rem", margin: 0 }}>The Experience</h1>
               <div style={{ flexGrow: 1, height: "2px", backgroundColor: "var(--sky-blue)" }} className="hidden md:block"></div>
            </div>
            
            <div className="grid grid-2" style={{ gap: "6rem", alignItems: "start" }}>
               <div style={{ fontSize: "1.2rem", lineHeight: "2", color: "rgba(28, 28, 28, 0.8)" }}>
                  <p>
                    <strong style={{ color: "var(--magenta)", fontSize: "1.4rem" }}>01. Arrival</strong><br />
                    From the moment you step into our Diamond Plaza studio, the world outside fades away. Your journey begins in our styling suite, a calm sanctuary designed for your ease.
                  </p>
                  <p>
                    <strong style={{ color: "var(--sky-blue)", fontSize: "1.4rem" }}>02. Gown Selection</strong><br />
                    Browse our exclusive collection of designer gowns. Our stylists help you choose the pieces that best celebrate your silhouette and personal style.
                  </p>
                  <p>
                    <strong style={{ color: "var(--magenta)", fontSize: "1.4rem" }}>03. Professional Makeup</strong><br />
                    Settle into the chair for professional artistry. We tailor your look to the gowns and the editorial direction of your session.
                  </p>
               </div>
               <div style={{ fontSize: "1.2rem", lineHeight: "2", color: "rgba(28, 28, 28, 0.8)" }}>
                  <p>
                    <strong style={{ color: "var(--sky-blue)", fontSize: "1.4rem" }}>04. The Session</strong><br />
                    The shoot is a guided, empowering experience. We handle every detail of lighting and posing, ensuring you feel celebrated at every stage.
                  </p>
                  <p>
                    <strong style={{ color: "var(--magenta)", fontSize: "1.4rem" }}>05. Image Delivery</strong><br />
                    Within weeks, you'll receive a curated gallery of retouched images—crafted as heirlooms to last a lifetime.
                  </p>
               </div>
            </div>

            <div style={{ marginTop: "4rem", borderTop: "1px solid rgba(176,147,69,.25)", paddingTop: "2.5rem" }}>
              <div className="grid grid-2 mobile-gap-8" style={{ gap: "2rem", alignItems: "start" }}>
                <div>
                  <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.18em", fontSize: "0.78rem", fontWeight: 700 }}>
                    What&apos;s Included
                  </span>
                  <h3 className="display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: "0.8rem" }}>
                    Everything needed for a complete luxury session
                  </h3>
                </div>
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  {INCLUDED_ITEMS.map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", fontSize: "1rem", lineHeight: 1.6, color: "rgba(28, 28, 28, 0.9)" }}>
                      <span style={{ width: "10px", height: "10px", marginTop: "0.45rem", borderRadius: "999px", background: "var(--sky-blue)", flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Gown Collection */}
      <section className="section-padding" style={{ backgroundColor: "var(--sky-blue-tint)" }}>
        <div className="container">
          <div className="grid grid-2" style={{ marginBottom: "5rem", alignItems: "center" }}>
            <div>
               <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>The Collection</span>
               <h2 className="display" style={{ fontSize: "4rem", marginTop: "1rem" }}>In-House Artistry</h2>
            </div>
            <p style={{ fontSize: "1.2rem", opacity: 0.8, borderLeft: "4px solid var(--magenta)", paddingLeft: "2rem" }}>
              Every gown in our closet is an original piece designed specifically for the expectant silhouette. We don't just rent gowns; we design them.
            </p>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", marginBottom: "1rem" }}>
              {VIBE_CONFIG.map((vibe) => {
                const isActive = vibe.key === activeVibe;
                return (
                  <button
                    key={vibe.key}
                    type="button"
                    onClick={() => setActiveVibe(vibe.key)}
                    style={{
                      border: `1px solid ${isActive ? vibe.accent : "rgba(28,28,28,.16)"}`,
                      background: isActive ? vibe.accent : "rgba(255,255,255,.9)",
                      color: isActive ? "white" : "#1c1c1c",
                      borderRadius: "999px",
                      padding: "0.55rem 1rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {vibe.label}
                  </button>
                );
              })}
            </div>
            <p style={{ margin: 0, fontSize: "1rem", opacity: 0.78 }}>
              {activeVibeConfig.description}
            </p>
          </div>

          <div 
            className="grid grid-2 md:grid-cols-4"
            style={{ 
              gap: "1rem" 
            }}
          >
            {activeVibeImages.length > 0 ? activeVibeImages.map((img, i) => (
              <div key={i} style={{ aspectRatio: "3/4", overflow: "hidden", border: "10px solid white" }}>
                <img 
                  src={img} 
                  alt={`${activeVibeConfig.label} maternity styling reference ${i + 1}`} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  loading="lazy"
                />
              </div>
            )) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", opacity: 0.65 }}>
                Live gallery images for this vibe are loading from your media library.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Videography Section */}
      <section className="section-padding" style={{ backgroundColor: "var(--magenta-tint)" }}>
        <div className="container">
          <div className="grid grid-2 mobile-gap-12" style={{ alignItems: "center", gap: "8rem" }}>
            <div style={{ aspectRatio: "16/9", backgroundColor: "white", position: "relative", overflow: "hidden", boxShadow: "clamp(10px, 4vw, 30px) clamp(10px, 4vw, 30px) 0 var(--sky-blue)" }}>
               {videoEmbedUrl ? (
                 <iframe
                   src={videoEmbedUrl}
                   title="Maternity Film"
                   allow="autoplay; fullscreen; picture-in-picture"
                   allowFullScreen
                   referrerPolicy="strict-origin-when-cross-origin"
                   style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                 />
               ) : videoPreviewUrl ? (
                 <img src={videoPreviewUrl} alt="Videography Preview" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
               ) : (
                 <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.8)", background: "linear-gradient(135deg, rgba(0,0,0,.45), rgba(0,0,0,.15))" }}>
                   Video preview will appear when live media is available
                 </div>
               )}
            </div>
            <div className="mobile-center">
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Motion Portraiture</span>
              <h2 className="display h2-mobile" style={{ fontSize: "3.5rem", margin: "1rem 0" }}>Maternity Films</h2>
              <p style={{ fontSize: "1.2rem", lineHeight: "1.8", opacity: 0.8, marginBottom: "2rem" }}>
                Capture the rhythm of life with our cinematic maternity films. We combine artful cinematography with professional sound design to create a short film that tells the story of your pregnancy in motion.
              </p>
              <Link to="/videos" className="btn btn-outline" style={{ borderColor: "var(--magenta)", color: "var(--magenta)" }}>View Maternity Films</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-padding mobile-center" style={{ textAlign: "center", backgroundColor: "white" }}>
        <div className="container">
          <h2 className="display h2-mobile" style={{ fontSize: "4rem", marginBottom: "3rem" }}>Ready to begin?</h2>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
             <a href="https://wa.me/254720111928" className="btn btn-whatsapp" style={{ padding: "1.2rem 2rem", fontSize: "0.85rem" }}>WhatsApp Us</a>
             <Link to="/contact" className="btn btn-primary" style={{ backgroundColor: "var(--sky-blue)", padding: "1.2rem 2rem", fontSize: "0.85rem" }}>Book Online</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Experience;
