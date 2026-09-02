import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logoDark from "@/assets/logo-dark.jpg";

const Footer = () => {
  const [loadMiniGallery, setLoadMiniGallery] = useState(false);
  const miniGalleryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!miniGalleryRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLoadMiniGallery(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 },
    );

    observer.observe(miniGalleryRef.current);
    return () => observer.disconnect();
  }, []);

  const miniGalleryImages = [
    "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg",
    "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg",
    "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887596251_IMG_0053-1365x2048.jpg",
  ];

  return (
    <footer
      style={{
        backgroundColor: "var(--plum)", // Espresso Plum background
        color: "#FFFFFF", // White body text
        paddingTop: 0,
        borderTop: "1px solid var(--sky-blue-tint)" // pale blush border
      }}
    >
      {/* Gradient Brand Strip */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, var(--sky-blue), var(--magenta), var(--sky-blue))",
          backgroundSize: "200% 100%",
          animation: "gradientShift 4s ease infinite",
        }}
      />

      <div style={{ padding: "3rem 0 2rem" }}>
        <div
          className="container footer-grid"
          style={{
            display: "grid",
            gap: "3rem",
            marginBottom: "3rem",
          }}
        >
          {/* Column 1: Brand & Studio Sanctuary */}
          <div style={{ maxWidth: "380px" }}>
            <div style={{ marginBottom: "1.2rem" }}>
              <img
                src={logoDark}
                alt="Fiesta House Maternity"
                loading="lazy"
                decoding="async"
                style={{
                  height: "50px", 
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  marginBottom: "1rem"
                }} 
              />
            </div>
            <p style={{ fontSize: "0.92rem", opacity: 0.82, lineHeight: "1.7", marginBottom: "1.4rem", color: "#FFFFFF" }}>
              Nairobi's premier luxury maternity photography sanctuary. Curated couture gowns, bespoke concept sets, and female-led posing at Diamond Plaza II, Parklands.
            </p>
            <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
              <a
                href="https://wa.me/254720111928"
                target="_blank"
                rel="noreferrer"
                data-track="whatsapp_click:footer_link"
                style={{
                  backgroundColor: "var(--sky-blue)",
                  color: "white",
                  padding: "0.45rem 1.1rem",
                  borderRadius: "100px",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  transition: "background 0.3s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--magenta)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--sky-blue)"}
              >
                WhatsApp Us
              </a>
              <a
                href="https://instagram.com/fiestahousematernity"
                target="_blank"
                rel="noreferrer"
                style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.85rem", fontWeight: "600", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--sky-blue)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)"}
              >
                Instagram ↗
              </a>
            </div>
          </div>

          {/* Column 2: The Photoshoot Experience */}
          <div>
            <p
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#FFFFFF",
                fontWeight: "700",
                marginBottom: "1.4rem",
                opacity: 0.5,
              }}
            >
              The Experience
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {[
                { to: "/maternity-photoshoot", label: "Nairobi Studio Experience" },
                { to: "/maternity-gowns", label: "Curated Atelier Gowns" },
                { to: "/portfolio", label: "Portfolio Galleries" },
                { to: "/pricing", label: "Packages & Rates" },
                { to: "/about", label: "About Fiesta House" },
                { to: "/contact", label: "Book Your Shoot" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontSize: "0.92rem",
                    color: "rgba(255, 255, 255, 0.82)",
                    textDecoration: "none",
                    transition: "color 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--sky-blue)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.82)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Planning Guides & FAQs */}
          <div>
            <p
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#FFFFFF",
                fontWeight: "700",
                marginBottom: "1.4rem",
                opacity: 0.5,
              }}
            >
              Planning & Advice
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {[
                { to: "/planning-guide", label: "Pre-Shoot Planning Checklist" },
                { to: "/when-to-do-maternity-photos", label: "When Is the Best Time (Weeks)?" },
                { to: "/what-to-wear-maternity-photoshoot", label: "What to Wear & Styling Guide" },
                { to: "/maternity-photoshoot-ideas", label: "Posing & Studio Concept Sets" },
                { to: "/family-maternity-photoshoot", label: "Partner & Family Sessions" },
                { to: "/faq", label: "Master Photoshoot FAQ Hub" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontSize: "0.92rem",
                    color: "rgba(255, 255, 255, 0.82)",
                    textDecoration: "none",
                    transition: "color 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--sky-blue)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.82)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div ref={miniGalleryRef} aria-label="Footer image gallery">
            <p
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#FFFFFF",
                fontWeight: "700",
                marginBottom: "1.4rem",
                opacity: 0.5,
              }}
            >
              Studio Moments
            </p>
            <div className="footer-mini-gallery">
              {loadMiniGallery
                ? miniGalleryImages.map((src, index) => (
                    <img
                      key={src}
                      src={src}
                      alt={`Fiesta House gallery ${index + 1}`}
                      width={400}
                      height={500}
                      loading="lazy"
                      decoding="async"
                    />
                  ))
                : miniGalleryImages.map((_, index) => (
                    <div key={`placeholder-${index}`} className="footer-mini-gallery-ph" aria-hidden="true" />
                  ))}
            </div>
          </div>
        </div>

        {/* Bottom divider bar */}
        <div
          className="container"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "1.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            opacity: 0.6,
            fontSize: "0.8rem",
            letterSpacing: "0.05em"
          }}
        >
          <span>© 2026 FIESTA HOUSE MATERNITY · DIAMOND PLAZA II, PARKLANDS, NAIROBI</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link to="/privacy-policy" style={{ color: "white", textDecoration: "none" }}>Privacy Policy</Link>
            <span>info@fiestahouseattire.com</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-grid {
          grid-template-columns: 1.25fr 0.85fr 1.15fr 1fr;
          gap: 3rem;
        }
        .footer-mini-gallery {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.65rem;
          max-width: 420px;
        }
        .footer-mini-gallery img {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
        }
        .footer-mini-gallery-ph {
          width: 100%;
          aspect-ratio: 4 / 5;
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
        }
        @media (max-width: 900px) {
          .footer-grid { 
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .footer-mini-gallery {
            max-width: 100%;
          }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
