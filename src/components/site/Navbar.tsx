import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/maternity-gowns", label: "Gowns" },
  { to: "/experience", label: "Experience" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
  { to: "/shop", label: "Shop" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { cartCount } = useCart();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const solid = scrolled || !isHome;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
        backgroundColor: solid ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: solid ? "blur(16px)" : "none",
        borderBottom: solid ? "2px solid var(--sky-blue)" : "none",
        boxShadow: solid ? "0 4px 24px rgba(110,193,228,0.12)" : "none",
        padding: scrolled ? "0.3rem 0" : "0.7rem 0",
      }}
    >
      <div className="container nav-container">
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
          }}
        >
          <img 
            src="/favicon.ico" 
            alt="Fiesta House" 
            style={{ 
              width: "36px", 
              height: "36px",
              borderRadius: "4px", // Slight rounding instead of full circle
              boxShadow: solid ? "0 4px 12px rgba(0,0,0,0.08)" : "0 4px 12px rgba(255,255,255,0.15)"
            }} 
          />
          <span
            style={{
              fontFamily: "'Bodoni Moda', serif",
              fontStyle: "italic",
              fontSize: "1.85rem",
              fontWeight: "700",
              letterSpacing: "0.02em",
              background: "linear-gradient(90deg, var(--sky-blue), var(--magenta))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              transition: "opacity 0.4s ease",
              textShadow: "none"
            }}
          >
            Fiesta House
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links" style={{ alignItems: "center", gap: "2.5rem" }}>
          {navLinks.map((link) => {
            const isActive =
              link.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className="nav-link"
                style={{
                  color: solid
                    ? isActive
                      ? "var(--sky-blue)"
                      : "var(--dark)"
                    : isActive
                    ? "var(--sky-blue)"
                    : "rgba(255,255,255,0.9)",
                  borderBottom: isActive ? "2px solid var(--sky-blue)" : "2px solid transparent",
                  paddingBottom: "3px",
                  fontWeight: isActive ? "500" : "400",
                  transition: "all 0.3s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}
          
          <Link to="/cart" style={{ 
            position: "relative", 
            color: solid ? "var(--dark)" : "white",
            display: "flex",
            alignItems: "center"
          }}>
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span style={{ 
                position: "absolute", 
                top: "-8px", 
                right: "-8px", 
                backgroundColor: "var(--magenta)", 
                color: "white", 
                fontSize: "10px", 
                fontWeight: "700",
                width: "18px", 
                height: "18px", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: solid ? "var(--dark)" : "white",
            padding: "0.5rem",
          }}
          className="nav-hamburger"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div
          style={{
            backgroundColor: "white",
            borderTop: "3px solid var(--sky-blue)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              link.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: isActive ? "var(--sky-blue)" : "var(--dark)",
                  fontWeight: isActive ? "600" : "400",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/cart"
            style={{
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "var(--dark)",
              fontWeight: "400",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.8rem"
            }}
          >
            <ShoppingCart size={18} /> Cart ({cartCount})
          </Link>
          <Link
            to="/contact"
            style={{
              background: "linear-gradient(135deg, var(--magenta), #8B3A78)",
              color: "white",
              padding: "0.9rem 2rem",
              borderRadius: "100px",
              textAlign: "center",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Book a Session
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
