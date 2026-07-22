import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import gownImg from "@/assets/gowns.jpg";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import p4 from "@/assets/portfolio-4.jpg";

const Experience = () => {
  return (
    <Layout
      title="The Experience | Luxury Maternity Session Journey"
      description="Discover the Fiesta House maternity experience in Nairobi, from gown selection and professional makeup to guided posing and heirloom image delivery."
      keywords="maternity photoshoot experience nairobi, luxury maternity studio process, pregnancy session journey"
    >
      {/* Walkthrough Section */}
      <section className="section-padding" style={{ paddingTop: "clamp(6.5rem, 10vw, 8.5rem)", backgroundColor: "white" }}>
        <div className="container">
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div className="mobile-center" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "3rem", flexWrap: "wrap" }}>
               <h1 className="display h1-mobile" style={{ fontSize: "5rem", margin: 0 }}>The Experience</h1>
               <div style={{ flexGrow: 1, height: "2px", backgroundColor: "var(--sky-blue)" }} className="hidden md:block"></div>
            </div>
            
            <div className="grid grid-2" style={{ gap: "6rem", alignItems: "start" }}>
               <div style={{ fontSize: "1.2rem", lineHeight: "2", color: "rgba(28, 28, 28, 0.8)" }}>
                  <p>
                    <strong style={{ color: "var(--magenta)", fontSize: "1.4rem" }}>01. Arrival</strong><br />
                    From the moment you step into our Diamond Plaza studio, the world outside fades away. Your journey begins in our styling suite, a calm sanctuary designed for your ease.
                  </p>
                  <p>
                    <strong style={{ color: "var(--sky-blue)", fontSize: "1.4rem" }}>02. Gown Selection</strong><br />
                    Browse our exclusive collection of designer gowns. Our stylists help you choose the pieces that best celebrate your silhouette and personal style.
                  </p>
                  <p>
                    <strong style={{ color: "var(--magenta)", fontSize: "1.4rem" }}>03. Professional Makeup</strong><br />
                    Settle into the chair for professional artistry. We tailor your look to the gowns and the editorial direction of your session.
                  </p>
               </div>
               <div style={{ fontSize: "1.2rem", lineHeight: "2", color: "rgba(28, 28, 28, 0.8)" }}>
                  <p>
                    <strong style={{ color: "var(--sky-blue)", fontSize: "1.4rem" }}>04. The Session</strong><br />
                    The shoot is a guided, empowering experience. We handle every detail of lighting and posing, ensuring you feel celebrated at every stage.
                  </p>
                  <p>
                    <strong style={{ color: "var(--magenta)", fontSize: "1.4rem" }}>05. Image Delivery</strong><br />
                    Within weeks, you'll receive a curated gallery of retouched images—crafted as heirlooms to last a lifetime.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Gown Collection */}
      <section className="section-padding" style={{ backgroundColor: "var(--sky-blue-tint)" }}>
        <div className="container">
          <div className="grid grid-2" style={{ marginBottom: "5rem", alignItems: "center" }}>
            <div>
               <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>The Collection</span>
               <h2 className="display" style={{ fontSize: "4rem", marginTop: "1rem" }}>In-House Artistry</h2>
            </div>
            <p style={{ fontSize: "1.2rem", opacity: 0.8, borderLeft: "4px solid var(--magenta)", paddingLeft: "2rem" }}>
              Every gown in our closet is an original piece designed specifically for the expectant silhouette. We don't just rent gowns; we design them.
            </p>
          </div>
          <div 
            className="grid grid-2 md:grid-cols-4"
            style={{ 
              gap: "1rem" 
            }}
          >
            {[gownImg, p1, p2, p3, p4, p1, p2, p3].map((img, i) => (
              <div key={i} style={{ aspectRatio: "3/4", overflow: "hidden", border: "10px solid white" }}>
                <img 
                  src={img} 
                  alt="Designer Gown" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Videography Section */}
      <section className="section-padding" style={{ backgroundColor: "var(--magenta-tint)" }}>
        <div className="container">
          <div className="grid grid-2 mobile-gap-12" style={{ alignItems: "center", gap: "8rem" }}>
            <div style={{ aspectRatio: "16/9", backgroundColor: "white", position: "relative", overflow: "hidden", boxShadow: "clamp(10px, 4vw, 30px) clamp(10px, 4vw, 30px) 0 var(--sky-blue)" }}>
               <div style={{ 
                 position: "absolute", 
                 inset: 0, 
                 display: "flex", 
                 alignItems: "center", 
                 justifyContent: "center",
                 backgroundColor: "rgba(0,0,0,0.1)",
                 zIndex: 2
               }}>
                 <div style={{ 
                   width: "80px", 
                   height: "80px", 
                   border: "2px solid white", 
                   borderRadius: "50%",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   color: "white",
                   fontSize: "1.5rem",
                   cursor: "pointer",
                   transition: "transform 0.3s ease"
                 }}
                 onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                 onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                 >
                   ▶
                 </div>
               </div>
               <img src={p4} alt="Videography Preview" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
            </div>
            <div className="mobile-center">
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Motion Portraiture</span>
              <h2 className="display h2-mobile" style={{ fontSize: "3.5rem", margin: "1rem 0" }}>Maternity Films</h2>
              <p style={{ fontSize: "1.2rem", lineHeight: "1.8", opacity: 0.8, marginBottom: "2rem" }}>
                Capture the rhythm of life with our cinematic maternity films. We combine artful cinematography with professional sound design to create a short film that tells the story of your pregnancy in motion.
              </p>
              <Link to="/pricing" className="btn btn-outline" style={{ borderColor: "var(--magenta)", color: "var(--magenta)" }}>View Videography Rates</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-padding mobile-center" style={{ textAlign: "center", backgroundColor: "white" }}>
        <div className="container">
          <h2 className="display h2-mobile" style={{ fontSize: "4rem", marginBottom: "3rem" }}>Ready to begin?</h2>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
             <a href="https://wa.me/254720111928" className="btn btn-whatsapp" style={{ padding: "1.2rem 2rem", fontSize: "0.85rem" }}>WhatsApp Us</a>
             <Link to="/contact" className="btn btn-primary" style={{ backgroundColor: "var(--sky-blue)", padding: "1.2rem 2rem", fontSize: "0.85rem" }}>Book Online</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Experience;
