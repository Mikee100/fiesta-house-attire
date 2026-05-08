import React from "react";

const InstagramFeed = () => {
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
        <div style={{ width: "100%", maxWidth: 900 }}>
          <iframe
            src="//lightwidget.com/widgets/0b97304586765d7cbebbf9922f81af47.html"
            title="Instagram Feed"
            style={{ width: "100%", border: 0, overflow: "hidden" }}
            scrolling="no"
            allowTransparency={true}
            className="lightwidget-widget"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
