import Layout from "@/components/site/Layout";

const Contact = () => {
  return (
    <Layout>
      <section className="section-padding" style={{ paddingTop: "12rem" }}>
        <div className="container">
          <div className="grid grid-2" style={{ gap: "8rem" }}>
            {/* Contact Form */}
            <div>
              <h1 className="display" style={{ fontSize: "4rem", marginBottom: "1rem" }}>Book Your Session</h1>
              <p style={{ marginBottom: "3rem", opacity: 0.7 }}>Please fill in the details below and we will get back to you to confirm availability.</p>
              
              <form style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Full Name</label>
                  <input type="text" style={{ padding: "1rem", border: "1px solid rgba(28, 28, 28, 0.1)", background: "transparent" }} required />
                </div>
                
                <div className="grid grid-2" style={{ gap: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Phone Number</label>
                    <input type="tel" style={{ padding: "1rem", border: "1px solid rgba(28, 28, 28, 0.1)", background: "transparent" }} required />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email Address</label>
                    <input type="email" style={{ padding: "1rem", border: "1px solid rgba(28, 28, 28, 0.1)", background: "transparent" }} required />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Preferred Date</label>
                    <input type="date" style={{ padding: "1rem", border: "1px solid rgba(28, 28, 28, 0.1)", background: "transparent" }} required />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Package of Interest</label>
                    <select style={{ padding: "1rem", border: "1px solid rgba(28, 28, 28, 0.1)", background: "transparent" }}>
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
                  <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Message (Optional)</label>
                  <textarea rows={4} style={{ padding: "1rem", border: "1px solid rgba(28, 28, 28, 0.1)", background: "transparent" }}></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }}>Send Enquiry</button>
              </form>
            </div>

            {/* Contact Details & Map */}
            <div>
              <div style={{ marginBottom: "4rem" }}>
                <h2 className="display" style={{ fontSize: "2rem", marginBottom: "2rem" }}>Quick Connect</h2>
                <a href="https://wa.me/254720111928" className="btn btn-whatsapp" style={{ width: "100%", marginBottom: "2rem" }}>
                  Chat on WhatsApp
                </a>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontSize: "1rem" }}>
                  <p><strong>Studio:</strong> Diamond Plaza, 4th Avenue Parklands, Nairobi County, Kenya</p>
                  <p><strong>Email:</strong> info@fiestahouseattire.com</p>
                  <p><strong>Phone:</strong> 0720 111928</p>
                  <p><strong>Instagram:</strong> @fiestahouseattire</p>
                </div>
              </div>

              {/* Simple Google Map Embed */}
              <div style={{ height: "400px", width: "100%", backgroundColor: "#eee" }}>
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.857647970726!2d36.8188165749666!3d-1.2572978987307963!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f173b88975a5d%3A0xc3b83344605e55e!2sDiamond%20Plaza%20II!5e0!3m2!1sen!2ske!4v1709400000000!5m2!1sen!2ske" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Studio Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
