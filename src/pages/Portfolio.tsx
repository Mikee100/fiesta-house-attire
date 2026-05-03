import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import p4 from "@/assets/portfolio-4.jpg";
import p5 from "@/assets/portfolio-5.jpg";
import p6 from "@/assets/portfolio-6.jpg";
import p_new from "@/assets/portfolio_new_1.png";

const Portfolio = () => {
  const images = [p_new, p1, p2, p3, p4, p5, p6, p1, p2]; // Using some repeats to fill the grid for demo

  return (
    <Layout>
      <section className="section-padding" style={{ paddingTop: "12rem" }}>
        <div className="container">
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gridAutoRows: "400px",
            gap: "2rem",
            gridAutoFlow: "dense"
          }}>
            {images.map((img, i) => (
              <div 
                key={i} 
                className="fade-in"
                style={{ 
                  overflow: "hidden",
                  gridRow: i % 3 === 0 ? "span 2" : "span 1",
                  gridColumn: i % 5 === 0 ? "span 2" : "span 1"
                }}
              >
                <img 
                  src={img} 
                  alt="Maternity Portrait" 
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 1s ease" }}
                  loading="lazy"
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: "8rem", 
            textAlign: "center",
            paddingBottom: "4rem"
          }}>
            <h2 className="display" style={{ fontSize: "3rem", marginBottom: "2rem" }}>Ready to create your own?</h2>
            <Link to="/contact" className="btn btn-primary">Book your session</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Portfolio;
