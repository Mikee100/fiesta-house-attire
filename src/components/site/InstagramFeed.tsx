import React from "react";

const InstagramFeed = () => {
  React.useEffect(() => {
    const existing = document.querySelector('script[src="https://cdn.lightwidget.com/widgets/lightwidget.js"]');
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://cdn.lightwidget.com/widgets/lightwidget.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

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
            src="//lightwidget.com/widgets/6dd6d900fdcc50efb7a09d9e4b4cfd20.html"
            title="Instagram Feed"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
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
