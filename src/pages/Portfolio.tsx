import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import * as api from "@/lib/api";
import { MOCK_PORTFOLIOS } from "@/lib/mockData";
import { PortfolioCardSkeleton } from "@/components/ui/SkeletonCards";

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolios = async () => {
      setLoading(true);
      const data = await api.fetchPortfolios();

      if (data === null || data.length === 0) {
        console.warn("Backend empty or unreachable, using mock data");
        setPortfolios(MOCK_PORTFOLIOS);
      } else {
        // Map backend structure (images is an array of objects)
        const formattedData = data.map((p: any) => ({
          ...p,
          images: p.images.map((img: any) => img.url),
          cover_image_url: p.cover_image_url || null
        }));
        setPortfolios(formattedData);
      }
      setLoading(false);
    };

    fetchPortfolios();
  }, []);

  return (
    <Layout
      title="Portfolio | Luxury Maternity & Couture Photography"
      description="Explore our curated collection of luxury maternity photography in Nairobi. From signature studio sets to couture maternity portraits, see the art we create at Fiesta House Attire."
      keywords="maternity photography portfolio, luxury pregnancy photos, couture maternity portraits nairobi, best maternity photography galleries"
    >
      <section className="section-padding" style={{ paddingTop: "12rem", backgroundColor: "white" }}>
        <div className="container">
            {/* Minimalistic Tagline */}
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <span style={{
                display: "inline-block",
                fontSize: "1.3rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "var(--dark)",
                opacity: 0.85,
                marginBottom: "0.5rem"
              }}>
                Timeless. Elegant. Uniquely Yours.
              </span>
            </div>
          <div style={{ textAlign: "center", marginBottom: "8rem" }}>
             <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Portfolio</span>
             <h1 className="display" style={{ fontSize: "5rem", marginTop: "1rem" }}>The Collections</h1>
             <p style={{ maxWidth: "600px", margin: "2rem auto 0", opacity: 0.8, fontSize: "1.1rem" }}>
               Explore our curated galleries of luxury maternity, family, and couture photography. 
               Click on a collection to view the full lookbook.
             </p>
          </div>

          <div className="grid grid-3" style={{ gap: "2.5rem" }}>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <PortfolioCardSkeleton key={i} />
              ))
            ) : portfolios.map((portfolio, idx) => (
              <Link 
                key={portfolio.id} 
                to={`/portfolio/${portfolio.slug}`}
                className="fade-in"
                style={{ 
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <div style={{ 
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "2px",
                  aspectRatio: "4/5",
                  backgroundColor: "var(--cream)",
                  border: idx % 2 === 0 ? "1px solid var(--sky-blue-tint)" : "1px solid var(--magenta-tint)"
                }}>
                  <img 
                    src={portfolio.cover_image_url || (portfolio.images && portfolio.images[0])} 
                    alt={portfolio.title} 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover", 
                      transition: "transform 1.5s cubic-bezier(0.165, 0.84, 0.44, 1)" 
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                  <div style={{ 
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "3rem 2rem",
                    background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end"
                  }}>
                    <h3 className="display" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{portfolio.title}</h3>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "1rem",
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      opacity: 0.9
                    }}>
                      <span>View Collection</span>
                      <div style={{ height: "1px", width: "30px", backgroundColor: "white" }}></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* ...call-to-action section removed for minimalism... */}
        </div>
      </section>
    </Layout>
  );
};

export default Portfolio;
