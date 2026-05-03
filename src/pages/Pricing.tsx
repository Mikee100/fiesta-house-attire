import Layout from "@/components/site/Layout";

const packages = [
  { name: "Standard", price: "10,000", duration: "1 hr 30 min", included: ["6 edited soft copy images", "Professional makeup", "2 gowns & styling"] },
  { name: "Economy", price: "15,000", duration: "2 hrs", included: ["12 edited soft copy images", "Professional makeup", "3 gowns & styling"] },
  { name: "Executive", price: "20,000", duration: "2 hrs 30 min", included: ["15 edited soft copy images", "Professional makeup", "4 gowns & styling", "1 A3 mount"] },
  { name: "Gold", price: "30,000", duration: "2 hrs 30 min", included: ["20 edited soft copy images", "Professional makeup", "4 gowns & styling", "8×8\" hardpage photobook"], popular: true },
  { name: "Platinum", price: "35,000", duration: "2 hrs 30 min", included: ["25 edited soft copy images", "Professional makeup", "4 gowns & styling", "1 A3 mount", "Customised backdrop"], popular: true },
  { name: "VIP", price: "45,000", duration: "3 hrs 30 min", included: ["25 edited soft copy images", "Professional makeup", "4 gowns & styling", "Customised backdrop", "8×8\" hardpage photobook"] },
  { name: "VVIP", price: "50,000", duration: "3 hrs 30 min", included: ["30 edited soft copy images", "Professional makeup", "5 gowns & styling", "Styled wig", "1 A3 mount", "Customised backdrop", "8×8\" hardpage photobook"] },
];

const Pricing = () => {
  return (
    <Layout>
      <section className="section-padding" style={{ paddingTop: "12rem" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "6rem" }}>
            <h1 className="display" style={{ fontSize: "4rem", marginBottom: "1rem" }}>Investment</h1>
            <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.9rem", opacity: 0.6 }}>All sessions include makeup & gown access</p>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "3rem" 
          }}>
            {packages.map((pkg, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: "3rem 2rem", 
                  backgroundColor: "white", 
                  border: pkg.popular ? "1px solid var(--sky-blue)" : "1px solid rgba(28, 28, 28, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s ease"
                }}
              >
                <div style={{ marginBottom: "2rem" }}>
                  <h3 className="display" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{pkg.name}</h3>
                  <div style={{ fontSize: "1.5rem", fontWeight: "400", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", verticalAlign: "top", marginRight: "2px" }}>Ksh</span>
                    {pkg.price}
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {pkg.duration} session
                  </div>
                </div>
                
                <div style={{ flexGrow: 1, marginBottom: "3rem" }}>
                  {pkg.included.map((item, j) => (
                    <div key={j} style={{ 
                      padding: "0.75rem 0", 
                      borderBottom: "1px solid rgba(28, 28, 28, 0.05)",
                      fontSize: "0.9rem",
                      opacity: 0.8
                    }}>
                      • {item}
                    </div>
                  ))}
                </div>

                <a 
                  href={`https://wa.me/254720111928?text=Hi%20Fiesta%20House%20Attire,%20I'd%20like%20to%20book%20the%20${pkg.name}%20package.`} 
                  className="btn btn-outline" 
                  style={{ width: "100%" }}
                >
                  Inquire Now
                </a>
              </div>
            ))}
          </div>

          {/* Gift Voucher Section */}
          <div style={{ 
            marginTop: "10rem", 
            padding: "6rem 4rem", 
            backgroundColor: "var(--dark)", 
            color: "white",
            textAlign: "center"
          }}>
            <h2 className="display" style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>Gift Vouchers</h2>
            <p style={{ maxWidth: "600px", margin: "0 auto 3rem", fontSize: "1.1rem", opacity: 0.8 }}>
              The perfect baby shower gift. Our vouchers are valid for all packages and offer the recipient a complete luxury maternity experience.
            </p>
            <a href="https://wa.me/254720111928?text=Hi%20Fiesta%20House%20Attire,%20I'd%20like%20to%20enquire%20about%20a%20gift%20voucher." className="btn btn-primary">Purchase a Voucher</a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
