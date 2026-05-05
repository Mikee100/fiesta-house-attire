import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const GalleryPage = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const [images, setImages] = useState<any[]>([]);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [foldersData, assetsData] = await Promise.all([
          api.fetchFolders(),
          api.fetchAssets(folderId, 1, 100) // Fetch up to 100 images
        ]);

        if (foldersData) {
          const folder = foldersData.find((f: any) => f.id === folderId);
          if (folder) setFolderName(folder.name);
        }

        if (assetsData && assetsData.assets) {
          setImages(assetsData.assets);
        }
      } catch (err) {
        console.error("Failed to load gallery:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderId]);

  return (
    <Layout>
      <section className="section-padding" style={{ paddingTop: "12rem", backgroundColor: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "6rem" }}>
             <Link to="/" style={{ 
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
               Back to Home
             </Link>
             <h1 className="display" style={{ fontSize: "5rem", marginTop: "1rem" }}>{folderName || "Gallery"}</h1>
             <div style={{ width: "80px", height: "1px", backgroundColor: "var(--magenta)", margin: "2rem auto" }}></div>
          </div>

          <div className="masonry">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="masonry-item w-full h-64 mb-8" />
              ))
            ) : images.length > 0 ? (
              images.map((img, i) => (
                <div 
                  key={img.id} 
                  className="masonry-item fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div style={{ overflow: "hidden", borderRadius: "2px" }}>
                    <img 
                      src={img.url} 
                      alt={`Gallery item ${i + 1}`} 
                      style={{ 
                        width: "100%", 
                        height: "auto", 
                        display: "block",
                        transition: "transform 1.2s cubic-bezier(0.165, 0.84, 0.44, 1)" 
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "10rem 0", gridColumn: "1/-1" }}>
                <p style={{ opacity: 0.5 }}>No images found in this collection.</p>
              </div>
            )}
          </div>
          
          <div style={{ 
            marginTop: "10rem", 
            textAlign: "center",
            padding: "8rem 2rem",
            backgroundColor: "var(--bg)",
            borderRadius: "2px"
          }}>
            <h2 className="display" style={{ fontSize: "4rem", marginBottom: "2.5rem" }}>Inspired by this collection?</h2>
            <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
               <Link to="/contact" className="btn btn-primary" style={{ backgroundColor: "var(--magenta)" }}>Book your session</Link>
               <Link to="/experience" className="btn btn-outline">The Experience</Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GalleryPage;
