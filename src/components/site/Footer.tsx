const Footer = () => {
  return (
    <footer style={{ padding: "4rem 0", borderTop: "1px solid rgba(28, 28, 28, 0.05)" }}>
      <div className="container" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        <span className="display" style={{ fontSize: "1.2rem", letterSpacing: "0.05em" }}>Fiesta House Attire</span>
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <a href="https://instagram.com/fiestahouseattire" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://wa.me/254720111928" target="_blank" rel="noreferrer">WhatsApp: 0720 111928</a>
          <a href="mailto:info@fiestahouseattire.com">info@fiestahouseattire.com</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
