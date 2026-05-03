import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import gownImg from "@/assets/gowns.jpg";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import p4 from "@/assets/portfolio-4.jpg";

const Experience = () => {
  return (
    <Layout>
      {/* Walkthrough Section */}
      <section className="section-padding" style={{ paddingTop: "12rem" }}>
        <div className="container">
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="display" style={{ fontSize: "4rem", marginBottom: "3rem" }}>The Experience</h1>
            <div style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "rgba(28, 28, 28, 0.8)" }}>
              <p>
                From the moment you step into our Diamond Plaza studio, the world outside fades away. Your journey begins in our styling suite, where you'll browse our exclusive collection of designer gowns—each one created in-house to celebrate the unique beauty of motherhood.
              </p>
              <p>
                As you settle into the makeup chair, our professional artists work to enhance your natural glow, tailoring your look to the gowns you've chosen and the editorial direction of your session.
              </p>
              <p>
                The shoot itself is a calm, guided experience. We handle every detail—from lighting and backdrops to gentle posing—ensuring you feel celebrated and at ease. Within weeks, you'll receive a curated gallery of high-resolution, retouched images that capture this extraordinary chapter of your life forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Gown Collection */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div className="grid grid-2" style={{ marginBottom: "4rem", alignItems: "flex-end" }}>
            <h2 className="display" style={{ fontSize: "3rem" }}>The Gown Collection</h2>
            <p style={{ opacity: 0.7, maxWidth: "400px", margin: 0 }}>
              Original pieces designed and crafted in-house. Our fabrics are chosen for comfort, movement, and how they interact with light.
            </p>
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "1.5rem" 
          }}>
            {[gownImg, p1, p2, p3, p4, p1, p2, p3].map((img, i) => (
              <div key={i} style={{ aspectRatio: "3/4", overflow: "hidden" }}>
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
      <section className="section-padding">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: "center", gap: "6rem" }}>
            <div style={{ aspectRatio: "16/9", backgroundColor: "#ddd", position: "relative", overflow: "hidden" }}>
               {/* Mock Video Thumbnail */}
               <div style={{ 
                 position: "absolute", 
                 inset: 0, 
                 display: "flex", 
                 alignItems: "center", 
                 justifyContent: "center",
                 backgroundColor: "rgba(0,0,0,0.1)"
               }}>
                 <div style={{ 
                   width: "60px", 
                   height: "60px", 
                   border: "2px solid white", 
                   borderRadius: "50%",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   color: "white"
                 }}>
                   ▶
                 </div>
               </div>
               <img src={p4} alt="Videography Preview" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
            </div>
            <div>
              <h2 className="display" style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>Maternity Films</h2>
              <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>
                Capture the movement and emotion of your pregnancy with a short cinematic baby bump film. A beautiful companion to your still photographs, these films are crafted with the same editorial care as our sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-padding" style={{ textAlign: "center" }}>
        <div className="container">
          <h2 className="display" style={{ fontSize: "3rem", marginBottom: "2rem" }}>Ready to begin?</h2>
          <a href="https://wa.me/254720111928" className="btn btn-whatsapp">Book your session on WhatsApp</a>
        </div>
      </section>
    </Layout>
  );
};

export default Experience;
