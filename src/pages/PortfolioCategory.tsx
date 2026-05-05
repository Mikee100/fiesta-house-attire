import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";
import { MOCK_PORTFOLIOS } from "@/lib/mockData";

const PortfolioCategory = () => {
  const { id } = useParams<{ id: string }>();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      const data = await api.fetchPortfolios();
      
      let found: any = null;
      if (data && data.length > 0) {
        found = data.find((p: any) => p.id === id || p.slug === id);
      }

      if (!found) {
        // Try mock data
        found = MOCK_PORTFOLIOS.find((p: any) => p.id === id || p.slug === id);
      }

      if (found) {
        // Handle images mapping if they are objects from backend
        const images = Array.isArray(found.images) 
          ? found.images.map((img: any) => typeof img === 'string' ? img : img.url)
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
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="loader"></div>
        </div>
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

  return (
    <Layout>
      <section className="section-padding" style={{ paddingTop: "12rem", backgroundColor: "white" }}>
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
                className="masonry-item fade-in"
                style={{ 
                  animationDelay: `${i * 0.1}s`
                }}
              >
                <div style={{
                  overflow: "hidden",
                  borderRadius: "2px",
                  position: "relative",
                }}>
                  <img 
                    src={img} 
                    alt={`${portfolio.title} Image ${i + 1}`} 
                    style={{ 
                      width: "100%", 
                      height: "auto", 
                      display: "block",
                      transition: "transform 1.2s cubic-bezier(0.165, 0.84, 0.44, 1)" 
                    }}
                    loading="lazy"
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: "10rem", 
            textAlign: "center",
            padding: "8rem 2rem",
            backgroundColor: "var(--magenta-tint)",
            borderRadius: "2px"
          }}>
            <h2 className="display" style={{ fontSize: "4rem", marginBottom: "2.5rem", color: "var(--dark)" }}>Love these portraits?</h2>
            <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
               <Link to="/contact" className="btn btn-primary" style={{ backgroundColor: "var(--magenta)" }}>Book your session</Link>
               <Link to="/pricing" className="btn btn-outline" style={{ borderColor: "var(--dark)" }}>View Investment</Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PortfolioCategory;
