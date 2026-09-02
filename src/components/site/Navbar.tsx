import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import logoLight from "@/assets/logo-dark.jpg";

const mainNavLinks = [
  { to: "/", label: "Home", exact: true },
  { to: "/maternity-gowns", label: "Gowns" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/blog", label: "Blogs" },
  { to: "/pricing", label: "Packages" },
];

const mobileMenuSections = [
  {
    title: "Main",
    links: mainNavLinks,
  },
  {
    title: "Plan Your Shoot",
    links: [
      { to: "/maternity-photoshoot", label: "Experience" },
      { to: "/planning-guide", label: "Planning Guide" },
      { to: "/when-to-do-maternity-photos", label: "When to Shoot" },
      { to: "/what-to-wear-maternity-photoshoot", label: "What to Wear" },
      { to: "/maternity-photoshoot-ideas", label: "Ideas & Styles" },
      { to: "/family-maternity-photoshoot", label: "Family Sessions" },
      { to: "/faq", label: "FAQ" },
    ],
  },
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

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const isLinkActive = (link: { to: string; exact?: boolean }) => {
    return link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);
  };

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
      <div className="container nav-container" style={{ position: "relative" }}>
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
              fontSize: "1.3rem",
              fontWeight: 500,
              letterSpacing: "0.01em",
              lineHeight: 1,
              color: currentNavColor,
            }}
          >
            Fiesta House
          </span>
        </Link>

        {/* Streamlined Desktop Links */}
        <div
          className="nav-links"
          style={{
            alignItems: "center",
            gap: "1.45rem",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {mainNavLinks.map((link) => {
            const isActive = isLinkActive(link);
            return (
              <Link
                key={link.to}
                to={link.to}
                data-track={`nav_click:${link.label.toLowerCase()}`}
                className="nav-link"
                onMouseEnter={handleLinkMouseEnter}
                onMouseLeave={handleLinkMouseLeave}
                style={{
                  color: currentNavColor,
                  borderBottom: isActive ? "2px solid var(--sky-blue)" : "2px solid transparent",
                  paddingBottom: "3px",
                  fontWeight: isActive ? "700" : "600",
                  transition: "all 0.3s ease",
                  fontSize: "0.9rem",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "auto" }}>
          {/* Cart Icon */}
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
            <ShoppingCart size={19} />
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

          {/* Book Now Button */}
          <Link
            to="/contact"
            data-track="booking_click:navbar_book_now"
            style={{
              background: "var(--sky-blue)",
              color: "white",
              padding: "0.48rem 1.2rem",
              borderRadius: "100px",
              textAlign: "center",
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(176,147,69,0.25)",
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

        <Link
          to="/cart"
          aria-label="Open cart"
          data-track="cart_click:mobile_navbar"
          className="mobile-cart-link"
          style={{
            position: "relative",
            color: currentNavColor,
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            marginLeft: "auto",
            textDecoration: "none",
          }}
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "4px",
                right: "3px",
                backgroundColor: "var(--sky-blue)",
                color: "white",
                fontSize: "10px",
                fontWeight: "700",
                width: "17px",
                height: "17px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            display: "none",
            background: showSolidNavbar ? "rgba(102,0,50,0.08)" : "rgba(255,255,255,0.18)",
            border: showSolidNavbar ? "1px solid rgba(102,0,50,0.12)" : "1px solid rgba(255,255,255,0.22)",
            borderRadius: "999px",
            cursor: "pointer",
            color: currentNavColor,
            width: "42px",
            height: "42px",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "0.35rem",
          }}
          className="nav-hamburger"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-panel" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-header">
              <div>
                <span className="mobile-menu-kicker">Fiesta House</span>
                <p className="mobile-menu-title">Navigate</p>
              </div>
              <button className="mobile-menu-close" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="mobile-menu-content">
              {mobileMenuSections.map((section) => (
                <div key={section.title} className="mobile-menu-section">
                  <p className="mobile-menu-section-title">{section.title}</p>
                  <div className="mobile-menu-links">
                    {section.links.map((link, linkIndex) => {
                      const isActive = isLinkActive(link);
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`mobile-menu-link ${isActive ? "active" : ""}`}
                          style={{ animationDelay: `${section.title === "Main" ? linkIndex * 45 : 180 + linkIndex * 35}ms` }}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mobile-menu-actions">
              <Link to="/cart" className="mobile-menu-cart">
                <ShoppingCart size={18} />
                Cart ({cartCount})
              </Link>
              <Link to="/contact" className="mobile-menu-book">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
