import React from "react";
import * as api from "@/lib/api";

const FALLBACK_IG_TILES = [
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886589981_IMGL4288.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886699797_IMGL4262.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886729905_IMGL4258.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886776876_IMGL4215.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886824638_IMGL4204.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886904058_IMGL4168.jpg",
];

const InstagramFeed = () => {
  const [tiles, setTiles] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const loadTiles = async () => {
      try {
        const result = await api.fetchPublicAssets(undefined, 1, 8);
        const urls = Array.isArray(result?.assets)
          ? result.assets
              .map((item) => item?.url)
              .filter((url): url is string => typeof url === "string" && url.length > 0)
              .slice(0, 8)
          : [];

        if (!cancelled) {
          setTiles(urls.length > 0 ? urls : FALLBACK_IG_TILES);
        }
      } catch {
        if (!cancelled) {
          setTiles(FALLBACK_IG_TILES);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTiles();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="overflow-hidden" style={{ backgroundColor: "var(--bg)", paddingTop: "8rem", paddingBottom: "8rem" }}>
      <div className="container">
        <div className="mobile-center" style={{ marginBottom: "3rem" }}>
          <span style={{ 
            color: "var(--magenta)", 
            textTransform: "uppercase", 
            letterSpacing: "0.2em", 
            fontSize: "0.9rem", 
            fontWeight: 600,
            display: "block",
            marginBottom: "1rem"
          }}>
            Get to know us better
          </span>
          <h2 className="display h2-mobile" style={{ fontSize: "3.5rem" }}>
            Let's connect on <span style={{ color: "var(--magenta)" }}>Instagram</span>
          </h2>
          <a 
            href="https://www.instagram.com/fiestahousematernity/" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-[var(--sky-blue)] hover:text-[var(--magenta)] transition-colors font-medium tracking-wide"
            style={{ fontSize: "1.1rem" }}
          >
            @fiestahousematernity
          </a>
        </div>
      </div>
      <div className="container" style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 980 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "0.9rem",
            }}
          >
            {(loading ? FALLBACK_IG_TILES : tiles).map((url, i) => (
              <a
                key={`${url}-${i}`}
                href="https://www.instagram.com/fiestahousematernity/"
                target="_blank"
                rel="noreferrer"
                aria-label="Open Fiesta House Instagram"
                style={{
                  display: "block",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "6px",
                  aspectRatio: "1 / 1",
                  background: "#f3f3f3",
                }}
              >
                <img
                  src={url}
                  alt="Fiesta House Instagram preview"
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
