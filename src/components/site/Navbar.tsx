import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled || !isHome ? "scrolled" : ""}`}>
      <div className="container nav-container">
        <Link to="/" className="display" style={{ fontSize: "1.5rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Fiesta House Attire
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/portfolio" className="nav-link">Portfolio</Link>
          <Link to="/experience" className="nav-link">Experience</Link>
          <Link to="/pricing" className="nav-link">Pricing</Link>
          <Link to="/contact" className="nav-link book">Book</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
