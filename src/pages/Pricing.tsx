import React from "react";
import Layout from "@/components/site/Layout";
import SEO from "@/components/site/SEO";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Check, Clock, Image, Shirt, Sparkles, Star, Camera, ShieldCheck } from "lucide-react";

const packages = [
  { 
    name: "Standard", 
    price: "10,000", 
    duration: "1 hr 30 min", 
    color: "var(--sky-blue)", 
    images: "6 edited soft copy images",
    outfits: "2 gowns & styling",
    features: ["Professional makeup", "Full gown access", "Studio session"],
    description: "Ideal for a quick, elegant session focused on capturing the essence of your journey."
  },
  { 
    name: "Economy", 
    price: "15,000", 
    duration: "2 hrs", 
    color: "var(--magenta)", 
    images: "12 edited soft copy images",
    outfits: "3 gowns & styling",
    features: ["Professional makeup", "Full gown access", "Studio session"],
    description: "Our most balanced package, offering more time and a wider variety of looks."
  },
  { 
    name: "Executive", 
    price: "20,000", 
    duration: "2 hrs 30 min", 
    color: "var(--sky-blue)", 
    images: "15 edited soft copy images",
    outfits: "4 gowns & styling",
    features: ["Professional makeup", "Full gown access", "1 A3 Mount included", "Studio session"],
    description: "Level up with more outfits and a stunning A3 mount for your wall."
  },
  { 
    name: "Gold", 
    price: "30,000", 
    duration: "2 hrs 30 min", 
    color: "var(--magenta)", 
    images: "20 edited soft copy images",
    outfits: "4 gowns & styling",
    popular: true,
    features: ["Professional makeup", "8×8\" hardpage photobook", "Full gown access", "Studio session"],
    description: "Capture your story in a high-quality photobook that will last generations."
  },
  { 
    name: "Platinum", 
    price: "35,000", 
    duration: "2 hrs 30 min", 
    color: "var(--sky-blue)", 
    images: "25 edited soft copy images",
    outfits: "4 gowns & styling",
    popular: true,
    features: ["Professional makeup", "Customized Balloon Backdrop", "1 A3 mount included", "Full gown access"],
    description: "Luxury meets artistry with a customized backdrop tailored to your style."
  },
  { 
    name: "VIP", 
    price: "45,000", 
    duration: "3 hrs 30 min", 
    color: "var(--magenta)", 
    images: "25 edited soft copy images",
    outfits: "4 gowns & styling",
    features: ["Professional makeup", "Customized Balloon Backdrop", "8×8\" hardpage photobook", "Extended session"],
    description: "The ultimate luxury experience with every detail curated for perfection."
  },
  { 
    name: "VVIP", 
    price: "50,000", 
    duration: "3 hrs 30 min", 
    color: "var(--sky-blue)", 
    images: "30 edited soft copy images",
    outfits: "5 gowns & styling",
    features: ["Professional makeup", "Styled Wig included", "Customized Balloon Backdrop", "8×8\" photobook + A3 mount"],
    description: "Our most exclusive offering. Absolute luxury, more outfits, and premium styling."
  },
];

const faqs = [
  {
    question: "When is the best time for a maternity photoshoot?",
    answer: "We recommend scheduling your session between 28 and 34 weeks of pregnancy. This is when your bump is beautifully prominent, but you're still comfortable enough for various poses."
  },
  {
    question: "Do I need to bring my own gowns?",
    answer: "Not at all! We provide exclusive access to our collection of designer maternity gowns. However, if you have a personal outfit you'd like to include, you're welcome to bring it."
  },
  {
    question: "How do I book a session?",
    answer: "Booking is simple! Select your preferred package and click the 'Book via WhatsApp' button to chat with us. A deposit is required to secure your date."
  },
  {
    question: "How long does it take to receive the images?",
    answer: "Soft copy images are typically delivered within 7-10 working days after your session. Physical products like photobooks and mounts take an additional 5-7 days."
  },
  {
    question: "Can I bring my partner or children?",
    answer: "Yes, family inclusion is welcomed and encouraged! We believe capturing your family's excitement is a key part of the experience."
  }
];

const Pricing = () => {
  return (
    <Layout>
      <SEO 
        title="Pricing Plan - 7 Luxury Maternity Photoshoot Packages"
        description="Explore luxury maternity photoshoot pricing in Nairobi. 7 exclusive packages including designer gowns, professional makeup, and stunning studio photography at Fiesta House Attire."
        keywords="maternity photoshoot nairobi, pregnancy photography pricing, luxury maternity shoot, baby bump photoshoot nairobi, fiesta house attire pricing"
      />

      {/* Hero Section */}
      <section className="section-padding" style={{ paddingTop: "12rem", backgroundColor: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "8rem" }} className="fade-in">
            <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Your Investment</span>
            <h1 className="display" style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)", marginTop: "1.2rem", marginBottom: "1.5rem" }}>Packages & Rates</h1>
            <div style={{ width: "120px", height: "4px", backgroundColor: "var(--sky-blue)", margin: "0 auto 2rem" }}></div>
            <p style={{ maxWidth: "700px", margin: "0 auto", fontSize: "1.1rem", color: "var(--muted-foreground)" }}>
              Choose a package that resonates with your vision. Every session is a luxury experience tailored to celebrate your motherhood.
            </p>
          </div>

          {/* Pricing Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", 
            gap: "3rem" 
          }}>
            {packages.map((pkg, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: "4rem 2.5rem", 
                  backgroundColor: pkg.popular ? "white" : "var(--bg)", 
                  borderRadius: "24px",
                  border: pkg.popular ? `2px solid ${pkg.color}` : "1px solid rgba(0,0,0,0.05)",
                  boxShadow: pkg.popular ? "0 30px 60px rgba(0,0,0,0.1)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
                  position: "relative",
                  overflow: "hidden"
                }}
                className="pricing-card"
              >
                {pkg.popular && (
                  <div style={{ 
                    position: "absolute", 
                    top: "24px", 
                    right: "24px", 
                    backgroundColor: pkg.color, 
                    color: "white", 
                    padding: "0.4rem 1.2rem", 
                    fontSize: "0.7rem", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.1em",
                    fontWeight: "700",
                    borderRadius: "100px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <Star size={12} fill="white" /> Popular
                  </div>
                )}
                
                <div style={{ marginBottom: "2.5rem" }}>
                  <h3 className="display" style={{ fontSize: "2.8rem", marginBottom: "1rem", color: "var(--dark)" }}>{pkg.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: "600", color: pkg.color }}>Ksh</span>
                    <span style={{ fontSize: "3rem", fontWeight: "300", color: "var(--dark)" }}>{pkg.price}</span>
                  </div>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)", lineHeight: "1.6" }}>{pkg.description}</p>
                </div>

                <div style={{ flexGrow: 1, marginBottom: "3rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.95rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${pkg.color}15`, display: "flex", alignItems: "center", justifyCenter: "center", color: pkg.color }}>
                        <Clock size={16} />
                      </div>
                      <span>{pkg.duration} session</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.95rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${pkg.color}15`, display: "flex", alignItems: "center", justifyCenter: "center", color: pkg.color }}>
                        <Image size={16} />
                      </div>
                      <span>{pkg.images}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.95rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${pkg.color}15`, display: "flex", alignItems: "center", justifyCenter: "center", color: pkg.color }}>
                        <Shirt size={16} />
                      </div>
                      <span>{pkg.outfits}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", marginBottom: "1rem", color: "var(--muted-foreground)" }}>Includes:</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      {pkg.features.map((feature, j) => (
                        <li key={j} style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                          <Check size={14} style={{ color: pkg.color }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/254720111928?text=Hi%20Fiesta%20House%20Attire,%20I'd%20like%20to%20book%20the%20${pkg.name}%20package.`} 
                  className="btn" 
                  style={{ 
                    width: "100%", 
                    backgroundColor: pkg.popular ? pkg.color : "var(--dark)", 
                    color: "white",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    fontWeight: "600",
                    display: "flex",
                    gap: "0.8rem"
                  }}
                >
                  Book via WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us / Details Section */}
      <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem" }}>
            <div className="fade-in">
              <h2 className="display" style={{ fontSize: "3.5rem", marginBottom: "2rem" }}>The Luxury Experience</h2>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "var(--muted-foreground)" }}>
                At Fiesta House Attire, we believe maternity photography is more than just taking pictures. It's about celebrating the strength, beauty, and grace of expectant mothers.
              </p>
              <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div style={{ flexShrink: 0, width: "48px", height: "48px", backgroundColor: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--magenta)" }}>
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.5rem" }}>Designer Gowns</h4>
                    <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>Exclusive access to our curated collection of luxury maternity gowns, from ethereal silks to dramatic trains.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div style={{ flexShrink: 0, width: "48px", height: "48px", backgroundColor: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sky-blue)" }}>
                    <Camera size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.5rem" }}>Professional Styling</h4>
                    <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>Our expert team handles your makeup and gown styling to ensure you look radiant and feel confident.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="fade-in" style={{ display: "flex", alignItems: "center" }}>
              <div style={{ 
                backgroundColor: "white", 
                padding: "3rem", 
                borderRadius: "32px", 
                boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
                width: "100%"
              }}>
                <h3 className="display" style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>Booking Policy</h3>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <li style={{ display: "flex", gap: "1rem", fontSize: "1rem" }}>
                    <ShieldCheck className="text-magenta" size={20} />
                    <span>A non-refundable deposit is required to confirm your session date.</span>
                  </li>
                  <li style={{ display: "flex", gap: "1rem", fontSize: "1rem" }}>
                    <ShieldCheck className="text-magenta" size={20} />
                    <span>Rescheduling must be done at least 48 hours in advance.</span>
                  </li>
                  <li style={{ display: "flex", gap: "1rem", fontSize: "1rem" }}>
                    <ShieldCheck className="text-magenta" size={20} />
                    <span>Fiesta House Attire owns the copyrights to all images produced.</span>
                  </li>
                  <li style={{ display: "flex", gap: "1rem", fontSize: "1rem" }}>
                    <ShieldCheck className="text-magenta" size={20} />
                    <span>Selected images are delivered digitally in high resolution.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "5rem" }}>
              <h2 className="display" style={{ fontSize: "3.5rem" }}>Frequently Asked Questions</h2>
              <div style={{ width: "60px", height: "4px", backgroundColor: "var(--magenta)", margin: "1.5rem auto" }}></div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "1rem 0" }}>
                  <AccordionTrigger style={{ fontSize: "1.1rem", fontWeight: "500", textAlign: "left" }}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent style={{ color: "var(--muted-foreground)", fontSize: "1.05rem", lineHeight: "1.7", paddingTop: "1rem" }}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Gift Voucher Section */}
      <section className="section-padding">
        <div className="container">
          <div style={{ 
            padding: "8rem 4rem", 
            backgroundColor: "var(--dark)", 
            borderRadius: "40px",
            color: "white",
            textAlign: "center",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "250px", height: "250px", backgroundColor: "var(--sky-blue)", borderRadius: "50%", opacity: 0.1 }}></div>
            <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "350px", height: "350px", backgroundColor: "var(--magenta)", borderRadius: "50%", opacity: 0.1 }}></div>
            
            <div style={{ position: "relative", zIndex: 2 }}>
               <h2 className="display" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", marginBottom: "2rem" }}>Share the Experience</h2>
               <p style={{ maxWidth: "700px", margin: "0 auto 4rem", fontSize: "1.2rem", lineHeight: "1.8", opacity: 0.8 }}>
                 Surprise an expectant mother with a gift that lasts a lifetime. Our luxury photoshoot vouchers are the most cherished gifts at baby showers across Nairobi.
               </p>
               <a 
                 href="https://wa.me/254720111928?text=Hi%20Fiesta%20House%20Attire,%20I'd%20like%20to%20enquire%20about%20a%20gift%20voucher." 
                 className="btn" 
                 style={{ backgroundColor: "white", color: "var(--dark)", padding: "1.5rem 4rem", fontWeight: "700", borderRadius: "100px" }}
               >
                 Purchase a Gift Voucher
               </a>
            </div>
          </div>
        </div>
      </section>

      {/* Copyright Footer Info */}
      <section style={{ padding: "4rem 0", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="container">
          <div style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
            <p style={{ marginBottom: "0.5rem" }}>© 2026 Fiesta House Attire. All photography rights reserved.</p>
            <p>Fiesta House Attire owns the copyrights to all images and has exclusive right to use, edit, print, and distribute images produced during sessions.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;

