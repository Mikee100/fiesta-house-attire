import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import heroImg from "@/assets/hero_new.png";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import p4 from "@/assets/portfolio-4.jpg";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero" style={{ 
        height: "100vh", 
        position: "relative", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden"
      }}>
        <img 
          src={heroImg} 
          alt="Luxury Maternity Photography" 
          style={{ 
            position: "absolute", 
            inset: 0, 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            zIndex: -1 
          }} 
        />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.15)", zIndex: -1 }}></div>
        <div className="container fade-in" style={{ color: "white" }}>
          <h1 className="display" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", marginBottom: "1rem" }}>
            Fiesta House Attire
          </h1>
          <p style={{ 
            fontSize: "clamp(1rem, 2vw, 1.25rem)", 
            textTransform: "uppercase", 
            letterSpacing: "0.3em", 
            marginBottom: "3rem",
            fontWeight: "400"
          }}>
            Nairobi's luxury maternity studio
          </p>
          <Link to="/contact" className="btn btn-primary">Book a Session</Link>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="section-padding" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <p className="display" style={{ fontSize: "2.5rem", lineHeight: "1.2", color: "var(--dark)" }}>
            We create heirloom maternity portraits in our Nairobi studio. Every session includes exclusive designer gowns, professional makeup, and images crafted to last a lifetime.
          </p>
        </div>
      </section>

      {/* Editorial Image Strip */}
      <section style={{ padding: "2rem 0" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "1rem", 
          padding: "0 1rem" 
        }}>
          {[p1, p2, p3, p4].map((img, i) => (
            <div key={i} style={{ aspectRatio: "4/5", overflow: "hidden" }}>
              <img 
                src={img} 
                alt={`Maternity Portrait ${i + 1}`} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding" style={{ backgroundColor: "rgba(110, 193, 228, 0.05)" }}>
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: "center", gap: "4rem" }}>
            <div>
              <h2 className="display" style={{ fontSize: "3rem", marginBottom: "2rem" }}>The Experience</h2>
              <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>
                We believe maternity photography should be effortless. We've brought everything together under one roof so you can focus on the moment.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {[
                "Exclusive designer gowns crafted in-house",
                "Professional on-site makeup artist",
                "Fully equipped private luxury studio",
                "Hand-edited high-resolution digital images"
              ].map((item, i) => (
                <div key={i} style={{ 
                  paddingBottom: "1.5rem", 
                  borderBottom: "1px solid rgba(28, 28, 28, 0.1)",
                  fontSize: "1.2rem",
                  letterSpacing: "0.02em"
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="container">
          <div className="grid grid-2" style={{ gap: "6rem" }}>
            {[
              {
                text: "I have never felt more beautiful in my life. The gowns, the makeup, the way they made me feel — it was the most special day of my pregnancy.",
                author: "Wanjiru K."
              },
              {
                text: "Worth every shilling. The team handled everything. I just walked in, and three hours later I had photos I'll treasure forever.",
                author: "Amina O."
              }
            ].map((t, i) => (
              <div key={i} style={{ fontStyle: "italic" }}>
                <p style={{ fontSize: "1.8rem", lineHeight: "1.4", marginBottom: "1.5rem", fontFamily: "var(--font-display)" }}>
                  "{t.text}"
                </p>
                <cite style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.6 }}>
                  — {t.author}
                </cite>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
