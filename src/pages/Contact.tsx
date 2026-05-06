import Layout from "@/components/site/Layout";

const Contact = () => {
  return (
    <Layout>
      {/* Brand color hero bar */}
      <div
        style={{
          paddingTop: "7rem",
          background: "linear-gradient(135deg, var(--sky-blue-tint) 0%, var(--magenta-tint) 100%)",
          padding: "9rem 0 4rem",
          borderBottom: "3px solid var(--sky-blue)",
        }}
      >
        <div className="container">
          <span
            style={{
              color: "var(--magenta)",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: "0.85rem",
              fontWeight: "700",
              display: "block",
              marginBottom: "1rem",
            }}
          >
            Reservations
          </span>
          <h1
            className="display"
            style={{ fontSize: "clamp(3rem, 7vw, 5rem)", color: "var(--dark)", marginBottom: "0.5rem" }}
          >
            Book Your Session
          </h1>
          <div style={{ width: "80px", height: "4px", background: "linear-gradient(90deg, var(--sky-blue), var(--magenta))", borderRadius: "2px", marginTop: "1.5rem" }} />
        </div>
      </div>

      <section className="section-padding">
        <div className="container">
          <div className="grid grid-2" style={{ gap: "8rem" }}>
            {/* Contact Form */}
            <div>
              <p style={{ marginBottom: "3rem", opacity: 0.7, fontSize: "1.1rem" }}>
                Fill in the details below and we will get back to you to confirm availability.
              </p>

              <form style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontWeight: "700",
                      color: "var(--sky-blue)",
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "1rem 1.2rem",
                      border: "2px solid rgba(110,193,228,0.3)",
                      background: "transparent",
                      borderRadius: "8px",
                      fontSize: "1rem",
                    }}
                    required
                  />
                </div>

                <div className="grid grid-2" style={{ gap: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: "700",
                        color: "var(--sky-blue)",
                      }}
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      style={{
                        padding: "1rem 1.2rem",
                        border: "2px solid rgba(110,193,228,0.3)",
                        background: "transparent",
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: "700",
                        color: "var(--sky-blue)",
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      style={{
                        padding: "1rem 1.2rem",
                        border: "2px solid rgba(110,193,228,0.3)",
                        background: "transparent",
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: "700",
                        color: "var(--sky-blue)",
                      }}
                    >
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      style={{
                        padding: "1rem 1.2rem",
                        border: "2px solid rgba(110,193,228,0.3)",
                        background: "transparent",
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: "700",
                        color: "var(--sky-blue)",
                      }}
                    >
                      Package of Interest
                    </label>
                    <select
                      style={{
                        padding: "1rem 1.2rem",
                        border: "2px solid rgba(110,193,228,0.3)",
                        background: "transparent",
                        borderRadius: "8px",
                        fontSize: "1rem",
                      }}
                    >
                      <option>Standard (10k)</option>
                      <option>Economy (15k)</option>
                      <option>Executive (20k)</option>
                      <option>Gold (30k)</option>
                      <option>Platinum (35k)</option>
                      <option>VIP (45k)</option>
                      <option>VVIP (50k)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontWeight: "700",
                      color: "var(--sky-blue)",
                    }}
                  >
                    Message (Optional)
                  </label>
                  <textarea
                    rows={4}
                    style={{
                      padding: "1rem 1.2rem",
                      border: "2px solid rgba(110,193,228,0.3)",
                      background: "transparent",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      resize: "vertical",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{
                    width: "fit-content",
                    background: "linear-gradient(135deg, var(--magenta), #8B3A78)",
                    color: "white",
                    borderRadius: "8px",
                    padding: "1.2rem 3rem",
                    fontWeight: "600",
                    boxShadow: "0 6px 20px rgba(184,79,160,0.35)",
                  }}
                >
                  Send Enquiry
                </button>
              </form>
            </div>

            {/* Contact Details & Map */}
            <div>
              <div style={{ marginBottom: "4rem" }}>
                <h2
                  className="display"
                  style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                >
                  Quick Connect
                </h2>
                <div
                  style={{
                    width: "60px",
                    height: "3px",
                    background: "linear-gradient(90deg, var(--sky-blue), var(--magenta))",
                    borderRadius: "2px",
                    marginBottom: "2rem",
                  }}
                />
                <a
                  href="https://wa.me/254720111928"
                  className="btn"
                  style={{
                    width: "100%",
                    marginBottom: "2rem",
                    background: "#25D366",
                    color: "white",
                    borderRadius: "100px",
                    padding: "1.2rem",
                    fontWeight: "600",
                  }}
                >
                  Chat on WhatsApp
                </a>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    fontSize: "1rem",
                  }}
                >
                  <p>
                    <strong style={{ color: "var(--sky-blue)" }}>Studio:</strong>{" "}
                    Diamond Plaza, 4th Avenue Parklands, Nairobi County, Kenya
                  </p>
                  <p>
                    <strong style={{ color: "var(--magenta)" }}>Email:</strong>{" "}
                    info@fiestahouseattire.com
                  </p>
                  <p>
                    <strong style={{ color: "var(--sky-blue)" }}>Phone:</strong> 0720 111928
                  </p>
                  <p>
                    <strong style={{ color: "var(--magenta)" }}>Instagram:</strong>{" "}
                    @fiestahousematernity
                  </p>
                </div>
              </div>

              {/* Simple Google Map Embed */}
              <div
                style={{
                  height: "400px",
                  width: "100%",
                  border: "3px solid var(--sky-blue)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.857647970726!2d36.8188165749666!3d-1.2572978987307963!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f173b88975a5d%3A0xc3b83344605e55e!2sDiamond%20Plaza%20II!5e0!3m2!1sen!2ske!4v1709400000000!5m2!1sen!2ske"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Studio Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
