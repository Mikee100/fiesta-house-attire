import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "var(--magenta-tint)",
        color: "var(--dark)",
        paddingTop: 0,
        borderTop: "1px solid rgba(184,79,160,0.1)"
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
              style={{ fontSize: "1.5rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem" }}
            >
              <span style={{ color: "var(--dark)" }}>Fiesta House</span>{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, var(--sky-blue), var(--magenta))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Attire
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, lineHeight: "1.6", maxWidth: "260px", marginBottom: "1rem" }}>
              Nairobi's premier luxury maternity studio. We transform pregnancy into art at our Diamond Plaza sanctuary.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
               <a href="https://instagram.com/fiestahousematernity" target="_blank" rel="noreferrer" style={{ color: "var(--magenta)", fontSize: "0.8rem", fontWeight: "600" }}>Instagram</a>
               <a href="https://wa.me/254720111928" target="_blank" rel="noreferrer" style={{ color: "var(--sky-blue)", fontSize: "0.8rem", fontWeight: "600" }}>WhatsApp</a>
            </div>
          </div>

          {/* Navigation column */}
          <div>
            <p
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--dark)",
                fontWeight: "700",
                marginBottom: "1.2rem",
                opacity: 0.4
              }}
            >
              Navigate
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                { to: "/", label: "Home" },
                { to: "/portfolio", label: "Portfolio" },
                { to: "/experience", label: "Experience" },
                { to: "/pricing", label: "Pricing" },
                { to: "/contact", label: "Book" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--dark)",
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--magenta)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--dark)";
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
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--dark)",
                fontWeight: "700",
                marginBottom: "1.2rem",
                opacity: 0.4
              }}
            >
              Photography Copyright
            </p>
            <p style={{ 
              fontSize: "0.8rem", 
              lineHeight: "1.6", 
              opacity: 0.6,
              marginBottom: "1rem"
            }}>
              Fiesta House Attire owns the copyrights to all the images and has exclusive right to use, edit, print, reproduce, and distribute their images without permission.
            </p>
            <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>
              info@fiestahouseattire.com · Diamond Plaza II, Nairobi
            </p>
          </div>
        </div>

        {/* Bottom divider */}
        <div
          className="container"
          style={{
            borderTop: "1px solid rgba(0,0,0,0.05)",
            paddingTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: 0.4,
            fontSize: "0.7rem",
            letterSpacing: "0.05em"
          }}
        >
          <span>© 2026 FIESTA HOUSE ATTIRE. ALL RIGHTS RESERVED.</span>
          <span>LUXURY MATERNITY STUDIO</span>
        </div>
      </div>

      <style>{`
        .footer-grid {
          grid-template-columns: 1.2fr 0.8fr 1.5fr;
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
        }
      `}</style>
    </footer>
  );
};

export default Footer;
