import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";
import { MasonrySkeleton } from "@/components/ui/SkeletonCards";
import MasonryImage from "@/components/site/MasonryImage";

const MaternityGowns = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const gownsFolderId = "b8b100e9-81ce-4778-bf57-0adee0b46fc0";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const initialPageSize = 24;
        const firstPage = await api.fetchAssets(gownsFolderId, 1, initialPageSize);
        const firstAssets = firstPage?.assets || [];

        if (firstAssets.length > 0) {
          setImages(firstAssets);
        }

        // Render quickly with initial images, then progressively hydrate the rest.
        setLoading(false);

        const totalPages = firstPage?.totalPages || 1;
        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page++) {
            const nextPage = await api.fetchAssets(gownsFolderId, page, initialPageSize);
            const nextAssets = nextPage?.assets || [];
            if (nextAssets.length > 0) {
              setImages((prev) => {
                const existingIds = new Set(prev.map((asset: any) => asset.id));
                const uniqueNext = nextAssets.filter((asset: any) => !existingIds.has(asset.id));
                return uniqueNext.length ? [...prev, ...uniqueNext] : prev;
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load gowns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Warm up the first set for faster perceived display.
    const topImages = images.slice(0, 6);
    for (const img of topImages) {
      if (!img?.url) continue;
      const prefetch = new Image();
      prefetch.decoding = "async";
      prefetch.src = img.url;
    }
  }, [images]);

  return (
    <Layout
      title="Designer Maternity Gowns Nairobi | The Fiesta Atelier"
      description="Explore our exclusive collection of luxury designer maternity gowns in Nairobi. From silk trains to delicate lace, find the perfect gown for your photoshoot at Fiesta House Attire."
      keywords="maternity gowns nairobi, designer pregnancy dresses kenya, luxury maternity shoot outfits, maternity photoshoot clothing, fiesta house gowns"
    >
      {/* Hero Section */}
      <section className="section-padding" style={{ paddingTop: "clamp(6.5rem, 11vw, 9rem)", backgroundColor: "white" }}>
        <div className="container">
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", marginBottom: "8rem" }}>
             <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>The Fiesta Atelier</span>
             <h1 className="display" style={{ fontSize: "clamp(3.5rem, 8vw, 6rem)", marginTop: "1.5rem", lineHeight: "1.1" }}>Our Maternity Gowns</h1>
             <p style={{ fontSize: "1.3rem", opacity: 0.7, lineHeight: "1.8", marginTop: "2.5rem" }}>
                Elevate your maternity story with our exclusive collection of high-end designer gowns. From flowing silks to intricate laces, our atelier is curated to make every expectant mother feel like a masterpiece.
             </p>
             <div style={{ width: "80px", height: "1px", backgroundColor: "var(--magenta)", margin: "3rem auto" }}></div>
          </div>

          <div className="masonry">
            {loading ? (
              <MasonrySkeleton count={8} />
            ) : images.length > 0 ? (
              images.map((img, i) => (
                <div 
                  key={img.id} 
                  className="masonry-item fade-in group relative"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div style={{ overflow: "hidden", borderRadius: "2px" }}>
                    <MasonryImage 
                      src={img.url} 
                      alt={`Maternity Gown ${i + 1}`} 
                      className="group-hover:scale-105"
                      priority={i < 6}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "10rem 0", gridColumn: "1/-1" }}>
                <p style={{ opacity: 0.5 }}>Our gown collection is currently being curated online. Contact us to see the full catalog.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
        <div className="container">
          <div className="grid grid-2" style={{ gap: "6rem", alignItems: "center" }}>
             <div>
                <h2 className="display" style={{ fontSize: "3.5rem", marginBottom: "2rem" }}>Crafted for the Journey</h2>
                <div className="space-y-8" style={{ fontSize: "1.1rem", lineHeight: "1.8", opacity: 0.8 }}>
                   <p>
                      Every gown in our studio is hand-selected for its ability to photograph beautifully. We focus on fabrics that move with the wind, catch the light, and accentuate the beauty of the pregnancy silhouette.
                   </p>
                   <p>
                      Our collection includes a wide range of sizes and styles, from minimalist editorial slips to grand, multi-layered chiffon masterpieces that command the entire frame.
                   </p>
                   <div style={{ paddingTop: "2rem" }}>
                      <Link to="/contact" className="btn btn-primary" style={{ backgroundColor: "var(--magenta)" }}>Book a session with a gown</Link>
                   </div>
                </div>
             </div>
             <div className="grid grid-2 gap-4">
                <div className="space-y-4">
                   <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "2px" }}>
                      <h4 className="font-bold mb-2">Designer Fabrics</h4>
                      <p className="text-sm opacity-60">Silk, chiffon, and premium lace from world-class suppliers.</p>
                   </div>
                   <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "2px" }}>
                      <h4 className="font-bold mb-2">Guided Selection</h4>
                      <p className="text-sm opacity-60">Our team helps you choose the gown that best suits your vision.</p>
                   </div>
                </div>
                <div className="space-y-4 mt-8">
                   <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "2px" }}>
                      <h4 className="font-bold mb-2">Perfect Fit</h4>
                      <p className="text-sm opacity-60">Gowns designed specifically to fit and flatter every stage of pregnancy.</p>
                   </div>
                   <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "2px" }}>
                      <h4 className="font-bold mb-2">Professional Care</h4>
                      <p className="text-sm opacity-60">Every gown is professionally cleaned and pressed before your shoot.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ...call-to-action section removed for minimalism... */}
    </Layout>
  );
};

export default MaternityGowns;
