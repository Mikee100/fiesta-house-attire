
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";
import { MOCK_PORTFOLIOS } from "@/lib/mockData";
import { MasonrySkeleton } from "@/components/ui/SkeletonCards";
import MasonryImage from "@/components/site/MasonryImage";
import { trackEvent } from "@/lib/tracking";

const PortfolioCategory = () => {
  const { id } = useParams<{ id: string }>();
  const [portfolio, setPortfolio] = useState<api.PortfolioRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isLandscapePreview, setIsLandscapePreview] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      let found: api.PortfolioRecord | null = null;

      if (id) {
        found = await api.fetchPortfolio(id);
      }

      if (!found) {
        // Try mock data
        found = (MOCK_PORTFOLIOS as api.PortfolioRecord[]).find((p) => p.id === id || p.slug === id) || null;
      }

      if (found) {
        // Handle images mapping if they are objects from backend
        const images = Array.isArray(found.images) 
          ? found.images.map((img) => typeof img === 'string' ? img : img.url)
          : [];
        setPortfolio({ ...found, images });
      }
      
      setLoading(false);
    };

    fetchPortfolio();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <section className="section-padding" style={{ paddingTop: "clamp(6.5rem, 10vw, 8.5rem)", backgroundColor: "white" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "6rem" }}>
               <div style={{ marginBottom: "2rem" }}>
                 <div style={{ width: "150px", height: "20px", backgroundColor: "var(--magenta-tint)", margin: "0 auto", borderRadius: "100px" }}></div>
               </div>
               <div style={{ width: "300px", height: "60px", backgroundColor: "var(--magenta-tint)", margin: "0 auto", borderRadius: "2px" }}></div>
            </div>
            <MasonrySkeleton count={9} />
          </div>
        </section>
      </Layout>
    );
  }

  if (!portfolio) {
    return (
      <Layout>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2 className="display" style={{ fontSize: "3rem" }}>Portfolio Not Found</h2>
          <Link to="/portfolio" className="btn btn-outline" style={{ marginTop: "2rem" }}>Back to Collections</Link>
        </div>
      </Layout>
    );
  }
    // Lightbox navigation handlers
  const gotoPrev = () => {
    if (lightboxIdx !== null && portfolio.images.length > 1) {
      const prevIdx = (lightboxIdx - 1 + portfolio.images.length) % portfolio.images.length;
      setLightboxIdx(prevIdx);
      setLightboxSrc(portfolio.images[prevIdx] || null);
    }
  };
  const gotoNext = () => {
    if (lightboxIdx !== null && portfolio.images.length > 1) {
      const nextIdx = (lightboxIdx + 1) % portfolio.images.length;
      setLightboxIdx(nextIdx);
      setLightboxSrc(portfolio.images[nextIdx] || null);
    }
  };

  const openLightbox = (index: number, imageUrl: string) => {
    if (!imageUrl) return;
    setLightboxIdx(index);
    setLightboxSrc(imageUrl);
    setLightboxOpen(true);
    trackEvent("gallery_image_open", portfolio.title || "portfolio_gallery");
  };

  return (
    <Layout 
      title={portfolio.title}
      description={`View the ${portfolio.title} collection at Fiesta House Maternity. Luxury maternity photography in Nairobi featuring our signature aesthetics.`}
      ogImage={portfolio.images[0]}
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.fiestahousematernity.com/" },
            { "@type": "ListItem", "position": 2, "name": "Portfolio", "item": "https://www.fiestahousematernity.com/portfolio" },
            { "@type": "ListItem", "position": 3, "name": portfolio.title, "item": `https://www.fiestahousematernity.com/portfolio/${portfolio.slug || id}` }
          ]
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          "name": `${portfolio.title} - Fiesta House Maternity`,
          "description": `Luxury maternity photography collection: ${portfolio.title}`,
          "url": `https://www.fiestahousematernity.com/portfolio/${portfolio.slug || id}`,
          "image": portfolio.images
        })}
      </script>
      <section className="section-padding" style={{ paddingTop: "clamp(6.5rem, 10vw, 8.5rem)", backgroundColor: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "6rem" }}>
             <Link to="/portfolio" style={{ 
               color: "var(--magenta)", 
               textTransform: "uppercase", 
               letterSpacing: "0.2em", 
               fontSize: "0.8rem", 
               fontWeight: "600",
               display: "inline-flex",
               alignItems: "center",
               gap: "0.5rem",
               marginBottom: "2rem"
             }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M19 12H5M12 19l-7-7 7-7" />
               </svg>
               Back to Collections
             </Link>
             <h1 className="display" style={{ fontSize: "5rem", marginTop: "1rem" }}>{portfolio.title}</h1>
          </div>

          <div className="masonry">
            {portfolio.images.map((img: string, i: number) => (
              <div
                key={i}
                className="masonry-item fade-in group"
                style={{ animationDelay: `${i * 0.05}s`, cursor: "zoom-in" }}
                data-track={`gallery_image_open:${portfolio.title}`}
                onClick={() => {
                  if (img) openLightbox(i, img);
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if ((e.key === "Enter" || e.key === " ") && img) {
                    openLightbox(i, img);
                  }
                }}
                aria-label={`View image ${i + 1} enlarged`}
                role="button"
              >
                <div style={{
                  overflow: "hidden",
                  borderRadius: "2px",
                  position: "relative",
                }}>
                  <MasonryImage
                    src={img}
                    alt={`${portfolio.title} maternity photoshoot image ${i + 1} in Nairobi`}
                    className="group-hover:scale-105"
                    priority={i < 3}
                  />
                </div>
              </div>
            ))}
            {/* Lightbox Dialog */}
            <Dialog
              open={lightboxOpen}
              onOpenChange={(open) => {
                setLightboxOpen(open);
                if (!open) {
                  setLightboxIdx(null);
                  setLightboxSrc(null);
                  setIsLandscapePreview(null);
                }
              }}
            >
              <DialogContent
                className="flex flex-col items-center justify-center border-none bg-transparent p-0 shadow-none max-w-[95vw] w-auto max-h-[95vh]"
                aria-describedby="lightbox-description"
              >
                <DialogTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                  Image preview
                </DialogTitle>
                <DialogDescription
                  id="lightbox-description"
                  style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
                >
                  Enlarged view of {portfolio.title} image {lightboxIdx !== null ? lightboxIdx + 1 : ""}
                </DialogDescription>

                {lightboxSrc ? (
                  <>
                    <img
                      src={lightboxSrc}
                      alt={`Enlarged ${portfolio.title} maternity photoshoot image ${lightboxIdx !== null ? lightboxIdx + 1 : ""}`}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setIsLandscapePreview(img.naturalWidth >= img.naturalHeight);
                      }}
                      style={{
                        maxWidth: isLandscapePreview ? "94vw" : "80vw",
                        maxHeight: isLandscapePreview ? "80vh" : "88vh",
                        marginTop: "2rem",
                        borderRadius: "4px",
                        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
                        transition: "transform 0.25s ease-out, opacity 0.2s ease-out",
                        objectFit: "contain",
                        background: "rgba(0,0,0,0.92)",
                      }}
                    />
                    {/* Prev/Next Buttons */}
                    {portfolio.images.length > 1 && (
                      <>
                        <button
                          onClick={gotoPrev}
                          aria-label="Previous image"
                          className="absolute left-4 top-1/2 -translate-y-1/2 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/70"
                          style={{ borderWidth: 1, outline: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }}
                        >
                          <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 700 }}>&lsaquo;</span>
                        </button>
                        <button
                          onClick={gotoNext}
                          aria-label="Next image"
                          className="absolute right-4 top-1/2 -translate-y-1/2 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/70"
                          style={{ borderWidth: 1, outline: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }}
                        >
                          <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 700 }}>&rsaquo;</span>
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 rounded px-2 py-1 select-none" style={{letterSpacing:1}}>
                          {lightboxIdx + 1} / {portfolio.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex min-h-[40vh] items-center justify-center text-white text-lg">Image not available</div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* ...call-to-action section removed for minimalism... */}
        </div>
      </section>
    </Layout>
  );
};

export default PortfolioCategory;
