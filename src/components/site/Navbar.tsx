import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import logoLight from "@/assets/logo-dark.jpg";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/maternity-gowns", label: "Gowns" },
  { to: "/videos", label: "Videos" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
  { to: "/shop", label: "Shop" },
];

const NAV_PRIMARY = "var(--magenta)";
const NAV_SECONDARY = "var(--sky-blue)";
const NAV_LIGHT = "#FFFFFF";
let didPrefetchVideos = false;

const prefetchVideosAssets = () => {
  if (didPrefetchVideos) return;
  didPrefetchVideos = true;

  void import("@/pages/Videos.tsx");
  void import("@/lib/api").then((mod) => {
    void mod.prefetchVideos();
  });
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { cartCount } = useCart();
  const isHomePage = location.pathname === "/";
  const showSolidNavbar = !isHomePage || scrolled || menuOpen;
  const currentNavColor = showSolidNavbar ? NAV_PRIMARY : NAV_LIGHT;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (didPrefetchVideos || location.pathname === "/videos") return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const start = () => prefetchVideosAssets();

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(start, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(start, 900);
    }

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
    };
  }, [location.pathname]);

  const handleLinkMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = NAV_SECONDARY;
  };

  const handleLinkMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = currentNavColor;
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
        backgroundColor: showSolidNavbar ? "var(--cream)" : "transparent",
        backdropFilter: showSolidNavbar ? "blur(16px)" : "none",
        borderBottom: showSolidNavbar ? "1px solid var(--sky-blue-tint)" : "1px solid transparent",
        boxShadow: showSolidNavbar ? "0 4px 20px rgba(51, 11, 37, 0.04)" : "none",
        padding: scrolled ? "0.3rem 0" : "0.7rem 0",
      }}
    >
      <div className="container nav-container">
        <Link
          to="/"
          data-track="nav_click:logo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            textDecoration: "none",
          }}
        >
          <img
            src={logoLight}
            alt="Fiesta House Maternity"
            style={{
              height: "44px",
              width: "auto",
              objectFit: "contain",
              display: "block",
              border: "none",
              borderRadius: 0,
            }}
          />
          <span
            className="display"
            style={{
              fontSize: "1.45rem",
              fontWeight: 500,
              letterSpacing: "0.01em",
              lineHeight: 1,
              color: currentNavColor,
            }}
          >
            Fiesta House
          </span>
        </Link>

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
                data-track={`nav_click:${link.label.toLowerCase()}`}
                className="nav-link"
                onMouseEnter={(e) => {
                  handleLinkMouseEnter(e);
                  if (link.to === "/videos") prefetchVideosAssets();
                }}
                onFocus={() => {
                  if (link.to === "/videos") prefetchVideosAssets();
                }}
                onTouchStart={() => {
                  if (link.to === "/videos") prefetchVideosAssets();
                }}
                onMouseLeave={handleLinkMouseLeave}
                style={{
                  color: currentNavColor,
                  borderBottom: isActive ? "2px solid var(--sky-blue)" : "2px solid transparent",
                  paddingBottom: "3px",
                  fontWeight: isActive ? "700" : "600",
                  transition: "all 0.3s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            to="/cart"
            aria-label="Open cart"
            data-track="cart_click:navbar"
            onMouseEnter={handleLinkMouseEnter}
            onMouseLeave={handleLinkMouseLeave}
            style={{
              position: "relative",
              color: currentNavColor,
              display: "flex",
              alignItems: "center",
            }}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "var(--sky-blue)",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "700",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/contact"
            data-track="booking_click:navbar_book_now"
            style={{
              background: "var(--sky-blue)",
              color: "white",
              padding: "0.55rem 1.35rem",
              borderRadius: "100px",
              textAlign: "center",
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(176,147,69,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--magenta)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--sky-blue)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Book Now
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: currentNavColor,
            padding: "0.5rem",
          }}
          className="nav-hamburger"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

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
                data-track={`nav_mobile_click:${link.label.toLowerCase()}`}
                onMouseEnter={handleLinkMouseEnter}
                onMouseLeave={handleLinkMouseLeave}
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: NAV_PRIMARY,
                  fontWeight: isActive ? "700" : "600",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/cart"
            onMouseEnter={handleLinkMouseEnter}
            onMouseLeave={handleLinkMouseLeave}
            style={{
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: NAV_PRIMARY,
              fontWeight: "600",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              transition: "color 0.3s ease",
            }}
          >
            <ShoppingCart size={18} /> Cart ({cartCount})
          </Link>
          <Link
            to="/contact"
            style={{
              background: "var(--sky-blue)",
              color: "white",
              padding: "0.7rem 1.5rem",
              borderRadius: "100px",
              textAlign: "center",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(176,147,69,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--magenta)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--sky-blue)";
            }}
          >
            Book Now
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
