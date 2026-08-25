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
          {/* Brand column */}
          <div>
            <div
              className="display"
              style={{ marginBottom: "1rem" }}
            >
              <img
                src={logoDark}
                alt="Fiesta House Maternity"
                loading="lazy"
                decoding="async"
                style={{
                  height: "55px", 
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  marginBottom: "1rem"
                }} 
              />
            </div>
            <p style={{ fontSize: "0.95rem", opacity: 0.8, lineHeight: "1.6", maxWidth: "320px", marginBottom: "1rem", color: "#FFFFFF" }}>
              Nairobi's premier luxury maternity studio. We transform pregnancy into art at our Diamond Plaza sanctuary.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <a href="https://instagram.com/fiestahousematernity" target="_blank" rel="noreferrer" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.92rem", fontWeight: "600", transition: "color 0.3s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--sky-blue)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)"}>Instagram</a>
              <a href="https://wa.me/254720111928" target="_blank" rel="noreferrer" data-track="whatsapp_click:footer_link" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.92rem", fontWeight: "600", transition: "color 0.3s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--sky-blue)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)"}>WhatsApp</a>
            </div>
          </div>

          {/* Navigation column */}
          <div>
            <p
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#FFFFFF",
                fontWeight: "700",
                marginBottom: "1.2rem",
                opacity: 0.5
              }}
            >
              Navigate
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
               {[
                 { to: "/", label: "Home" },
                 { to: "/portfolio", label: "Portfolio" },
                 { to: "/about", label: "About" },
                 { to: "/pricing", label: "Pricing" },
                 { to: "/contact", label: "Book" },
                 { to: "/privacy-policy", label: "Privacy Policy" },
               ].map((link) => (
                 <Link
                   key={link.to}
                   to={link.to}
                   style={{
                     fontSize: "0.92rem",
                     color: "rgba(255, 255, 255, 0.8)",
                     textDecoration: "none",
                     transition: "all 0.3s ease",
                   }}
                   onMouseEnter={(e) => {
                     (e.currentTarget as HTMLElement).style.color = "var(--sky-blue)"; // gold hover
                   }}
                   onMouseLeave={(e) => {
                     (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.8)";
                   }}
                 >
                   {link.label}
                 </Link>
               ))}
            </div>
          </div>

          {/* Copyright column */}
          <div>
            <p
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#FFFFFF",
                fontWeight: "700",
                marginBottom: "1.2rem",
                opacity: 0.4
              }}
            >
              Photography Copyright
            </p>
            <p style={{ 
              fontSize: "0.92rem", 
              lineHeight: "1.6", 
              opacity: 0.6,
              marginBottom: "1rem"
            }}>
              Fiesta House Maternity owns the copyrights to all the images and has exclusive right to use, edit, print, reproduce, and distribute their images without permission.
            </p>
            <p style={{ fontSize: "0.86rem", opacity: 0.5 }}>
              info@fiestahouseattire.com · Diamond Plaza II, Nairobi
            </p>
            <div className="footer-mini-gallery" aria-label="Footer image gallery" ref={miniGalleryRef}>
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

        {/* Bottom divider */}
        <div
          className="container"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: 0.4,
            fontSize: "0.78rem",
            letterSpacing: "0.05em"
          }}
        >
          <span>© 2026 FIESTA HOUSE MATERNITY. ALL RIGHTS RESERVED.</span>
          <span>LUXURY MATERNITY STUDIO</span>
        </div>
      </div>

      <style>{`
        .footer-grid {
          grid-template-columns: 1.2fr 0.8fr 1.5fr;
        }
        .footer-mini-gallery {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.65rem;
          margin-top: 1rem;
          max-width: 420px;
        }
        .footer-mini-gallery img {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: 2px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .footer-mini-gallery-ph {
          width: 100%;
          aspect-ratio: 4 / 5;
          border-radius: 2px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          background: linear-gradient(145deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.06));
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (max-width: 768px) {
          .footer-grid { 
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .footer-mini-gallery {
            max-width: 100%;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.55rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
