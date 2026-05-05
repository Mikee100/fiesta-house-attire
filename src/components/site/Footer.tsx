import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "var(--dark)",
        color: "white",
        paddingTop: 0,
      }}
    >
      {/* Gradient Brand Strip */}
      <div
        style={{
          height: "5px",
          background: "linear-gradient(90deg, var(--sky-blue), var(--magenta), var(--sky-blue))",
          backgroundSize: "200% 100%",
          animation: "gradientShift 4s ease infinite",
        }}
      />

      <div style={{ padding: "5rem 0 3rem" }}>
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "4rem",
            marginBottom: "4rem",
          }}
        >
          {/* Brand column */}
          <div>
            <div
              className="display"
              style={{ fontSize: "1.5rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}
            >
              <span style={{ color: "white" }}>Fiesta House</span>{" "}
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
            <p style={{ fontSize: "0.9rem", opacity: 0.6, lineHeight: "1.7", maxWidth: "240px" }}>
              Nairobi's premier luxury maternity studio. Diamond Plaza, Parklands.
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--sky-blue)",
                fontWeight: "700",
                marginBottom: "1.5rem",
              }}
            >
              Navigate
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {[
                { to: "/", label: "Home" },
                { to: "/portfolio", label: "Portfolio" },
                { to: "/experience", label: "Experience" },
                { to: "/pricing", label: "Pricing" },
                { to: "/contact", label: "Book a Session" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.7,
                    textDecoration: "none",
                    color: "white",
                    transition: "all 0.3s ease",
                    letterSpacing: "0.05em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = "1";
                    (e.currentTarget as HTMLElement).style.color = "var(--sky-blue)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = "0.7";
                    (e.currentTarget as HTMLElement).style.color = "white";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact column */}
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--magenta)",
                fontWeight: "700",
                marginBottom: "1.5rem",
              }}
            >
              Connect
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <a
                href="https://instagram.com/fiestahouseattire"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--sky-blue)",
                  textDecoration: "none",
                  fontWeight: "500",
                  transition: "opacity 0.3s",
                  letterSpacing: "0.05em",
                }}
              >
                @fiestahouseattire
              </a>
              <a
                href="https://wa.me/254720111928"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--magenta)",
                  textDecoration: "none",
                  fontWeight: "500",
                  transition: "opacity 0.3s",
                  letterSpacing: "0.05em",
                }}
              >
                WhatsApp: 0720 111928
              </a>
              <a
                href="mailto:info@fiestahouseattire.com"
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.7,
                  color: "white",
                  textDecoration: "none",
                  letterSpacing: "0.05em",
                }}
              >
                info@fiestahouseattire.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div
          className="container"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span style={{ fontSize: "0.8rem", opacity: 0.4 }}>
            © 2026 Fiesta House Attire. All rights reserved.
          </span>
          <span style={{ fontSize: "0.8rem", opacity: 0.4 }}>
            Diamond Plaza · Parklands · Nairobi, Kenya
          </span>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
