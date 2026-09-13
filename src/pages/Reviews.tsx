import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, ShieldCheck, Heart, Sparkles, MapPin, Users, Star } from "lucide-react";
import { REAL_REVIEWS, type RealReview } from "@/lib/reviews";

const REVIEWS_FAQS = [
  {
    q: "Where do these reviews come from?",
    a: "Every review on this page is a genuine, verified submission from our Google Business Profile where Fiesta House Maternity holds a 4.9★ rating across 1,169+ client reviews. You can search 'Fiesta House Maternity' on Google Maps to read all customer submissions directly."
  },
  {
    q: "Why do so many reviews mention specific staff members?",
    a: "Unlike studios that hire random freelancers, Fiesta House operates with a dedicated, permanent in-house all-women team: Faith (reception and client care), Indiana & Wanjiku (professional makeup artistry), Beverly (couture gown styling), and Amazing (maternity posing and photography). Clients consistently praise our team by name for their gentle, respectful care."
  },
  {
    q: "Can my partner, husband, and toddlers join the session?",
    a: "Yes! Many of our Google reviews (like Alvin Gachie, Brigitte Moraa, and Njeri Agalla) highlight our patience with husbands and energetic toddlers. Family and couple maternity portraits are included in our signature packages."
  },
  {
    q: "Do I really not need to bring my own gowns or hire a makeup artist?",
    a: "Yes! As clients like Mercy Masila and Hellen Okochil noted, our Diamond Plaza II sanctuary includes everything under one roof: access to our private atelier of 300+ designer gowns, professional makeup, and guided posing so you can just arrive and be pampered."
  },
  {
    q: "How far in advance should I book my photoshoot?",
    a: "We recommend reserving your session date between weeks 18 and 24 to shoot comfortably between weeks 28 and 34, when your baby bump is beautifully rounded."
  }
];

export default function Reviews() {
  const [filter, setFilter] = useState<RealReview["category"]>("all");

  const filteredReviews =
    filter === "all"
      ? REAL_REVIEWS
      : REAL_REVIEWS.filter((item) => item.category === filter);

  return (
    <Layout
      title="Fiesta House Maternity Reviews | 4.9★ from 1,169+ Clients"
      description="Read genuine Google reviews and testimonials from 1,169+ expectant mothers. Discover why Fiesta House Maternity is Nairobi's highest-rated maternity photography sanctuary."
      keywords="fiesta house maternity reviews, fiesta house reviews, maternity photoshoot nairobi reviews, best maternity photographer kenya reviews, fiesta house google reviews"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "PhotographyBusiness",
          "name": "Fiesta House Maternity",
          "alternateName": ["Fiesta House", "Fiesta House Attire", "Fiesta House Maternity Studio"],
          "url": "https://www.fiestahousematernity.com/reviews",
          "telephone": "+254720111928",
          "priceRange": "KES 15,000 – KES 120,000",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Diamond Plaza II, 4th Parklands Avenue, Parklands",
            "addressLocality": "Nairobi",
            "addressRegion": "Nairobi County",
            "addressCountry": "KE"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1169",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": REAL_REVIEWS.slice(0, 10).map((t) => ({
            "@type": "Review",
            "itemReviewed": {
              "@type": "PhotographyBusiness",
              "name": "Fiesta House Maternity",
              "url": "https://www.fiestahousematernity.com/"
            },
            "author": {
              "@type": "Person",
              "name": t.author
            },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": t.rating,
              "bestRating": "5",
              "worstRating": "1"
            },
            "reviewBody": t.quote,
            "datePublished": "2026-01-15"
          }))
        })}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": REVIEWS_FAQS.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        })}
      </script>

      {/* Hero Header */}
      <section
        className="section-padding"
        style={{
          paddingTop: "clamp(7rem, 12vw, 9.5rem)",
          paddingBottom: "4.5rem",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid rgba(43, 35, 32, 0.12)"
        }}
      >
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
              marginBottom: "3.5rem",
              color: "var(--plum)"
            }}
          >
            <span style={{ color: "#F59E0B", fontSize: "1rem", letterSpacing: "2px" }}>★★★★★ <span style={{ color: "var(--plum)", letterSpacing: 0, marginLeft: "0.5rem", fontWeight: 700 }}>4.9 / 5</span></span>
            <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(43, 35, 32, 0.6)" }}>Verified Google reviews</span>
          </div>

          <span
            style={{
              color: "var(--magenta)",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "block",
              marginBottom: "1rem"
            }}
          >
            Client stories
          </span>

          <h1
            className="display"
            style={{
              fontSize: "clamp(2.3rem, 4.5vw, 4rem)",
              color: "var(--dark)",
              lineHeight: 1.12,
              marginBottom: "1.1rem",
              maxWidth: "760px"
            }}
          >
            What it feels like to be cared for
          </h1>

          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: "1.75",
              color: "rgba(43, 35, 32, 0.82)",
              maxWidth: "650px",
              margin: "0 0 2.5rem",
              fontSize: "1.05rem"
            }}
          >
            A selection of words from mothers and families who have spent time in the house. Their experiences speak most clearly to the care, patience, and artistry behind each session.
          </p>

          {/* Key Trust Stats Pill Grid */}
          <div
            style={{
              display: "flex",
              gap: "1.2rem",
              justifyContent: "flex-start",
              flexWrap: "wrap",
              fontSize: "0.84rem",
              color: "var(--plum)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <CheckCircle2 size={17} color="var(--magenta)" />
              <span><strong>4.9 / 5.0</strong> on Google Maps</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Users size={17} color="var(--magenta)" />
              <span><strong>1,169+</strong> Client Reviews</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ShieldCheck size={17} color="var(--magenta)" />
              <span>100% Female Posing & Styling Crew</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <MapPin size={17} color="var(--magenta)" />
              <span>Diamond Plaza II, 4th Floor, Parklands</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs & Testimonials Grid */}
      <section className="section-padding" style={{ backgroundColor: "#FBF6F3" }}>
        <div className="container">
          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: "0.6rem",
              flexWrap: "wrap",
              marginBottom: "2.5rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid rgba(43, 35, 32, 0.12)"
            }}
          >
            {[
              { key: "all", label: "All Reviews (1,169+)" },
              { key: "stylist", label: "Gowns & Styling (Beverly)" },
              { key: "makeup", label: "Makeup & Beauty (Indiana)" },
              { key: "photographer", label: "Posing & Photos (Amazing)" },
              { key: "family", label: "Husbands & Toddlers" },
              { key: "first-time", label: "First-Time Moms" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key as RealReview["category"])}
                style={{
                  padding: "0.55rem 1.3rem",
                  borderRadius: "100px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  backgroundColor: filter === tab.key ? "var(--plum)" : "transparent",
                  color: filter === tab.key ? "#FFFFFF" : "var(--plum)",
                  border: filter === tab.key ? "1px solid var(--plum)" : "1px solid rgba(102, 0, 50, 0.28)"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Real Testimonial Cards */}
          <div className="grid grid-2 mobile-gap-8" style={{ gap: "2.5rem" }}>
            {filteredReviews.map((item) => (
              <article
                key={item.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "0",
                  padding: "2rem 1.8rem",
                  border: "1px solid rgba(43, 35, 32, 0.13)",
                  boxShadow: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#F59E0B", fontSize: "1.05rem" }}>
                      {"★".repeat(item.rating)}
                      <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--plum)", marginLeft: "0.4rem" }}>
                        Google Verified
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(43, 35, 32, 0.55)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em"
                      }}
                    >
                      {item.date}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "1.05rem",
                      lineHeight: "1.8",
                      color: "rgba(43, 35, 32, 0.9)",
                      fontStyle: "normal",
                      marginBottom: "1.8rem"
                    }}
                  >
                    "{item.quote}"
                  </p>
                </div>

                <div
                  style={{
                    borderTop: "1px solid rgba(102, 0, 50, 0.08)",
                    paddingTop: "1.2rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    gap: "0.8rem"
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        color: "var(--dark)",
                        margin: 0
                      }}
                    >
                      {item.author}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "rgba(43, 35, 32, 0.62)",
                        margin: "0.2rem 0 0"
                      }}
                    >
                      {item.authorSubtitle}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--magenta)",
                      padding: "0.25rem 0",
                      borderTop: "1px solid rgba(102, 0, 50, 0.16)"
                    }}
                  >
                    {item.highlightTag}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Spotlight — The Women Behind The 1,169 Reviews */}
      <section className="section-padding" style={{ backgroundColor: "#FBF6F3" }}>
        <div className="container" style={{ maxWidth: "1050px" }}>
          <div className="text-center" style={{ marginBottom: "3rem" }}>
            <span
              style={{
                color: "var(--magenta)",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontSize: "0.85rem",
                fontWeight: "600",
                display: "block",
                marginBottom: "0.5rem"
              }}
            >
              Mentioned by Name in Over 400+ Reviews
            </span>
            <h2 className="display" style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", color: "var(--dark)" }}>
              The Team Expectant Mothers Cherish
            </h2>
            <p style={{ maxWidth: "620px", margin: "0.8rem auto 0", fontSize: "1.05rem", color: "rgba(43, 35, 32, 0.75)", lineHeight: "1.7" }}>
              Our clients consistently praise our all-female sanctuary team for treating them with gentleness, patience, and warmth throughout their shoot.
            </p>
          </div>

          <div className="grid grid-4 mobile-gap-8" style={{ gap: "1.5rem" }}>
            <div style={{ backgroundColor: "#FFFFFF", padding: "2rem 1.5rem", borderRadius: "4px", border: "1px solid rgba(102, 0, 50, 0.08)", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--magenta-tint)", color: "var(--magenta)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontWeight: "700", fontSize: "1.1rem" }}>
                F
              </div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--plum)", marginBottom: "0.3rem" }}>Faith</h3>
              <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sky-blue)", fontWeight: "600", marginBottom: "0.8rem" }}>
                Front Desk & Warm Welcome
              </p>
              <p style={{ fontSize: "0.88rem", lineHeight: "1.6", color: "rgba(43, 35, 32, 0.75)" }}>
                "The moment you enter, Faith is there waiting to serve you like a baby... she keeps you comfortable from step one."
              </p>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", padding: "2rem 1.5rem", borderRadius: "4px", border: "1px solid rgba(102, 0, 50, 0.08)", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--magenta-tint)", color: "var(--magenta)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontWeight: "700", fontSize: "1.1rem" }}>
                B
              </div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--plum)", marginBottom: "0.3rem" }}>Beverly</h3>
              <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sky-blue)", fontWeight: "600", marginBottom: "0.8rem" }}>
                Couture Gown Stylist
              </p>
              <p style={{ fontSize: "0.88rem", lineHeight: "1.6", color: "rgba(43, 35, 32, 0.75)" }}>
                "Beverly has such a keen eye for fashion and design prowess. She fits each gown to your bump shape with precision."
              </p>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", padding: "2rem 1.5rem", borderRadius: "4px", border: "1px solid rgba(102, 0, 50, 0.08)", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--magenta-tint)", color: "var(--magenta)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontWeight: "700", fontSize: "1.1rem" }}>
                I
              </div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--plum)", marginBottom: "0.3rem" }}>Indiana & Wanjiku</h3>
              <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sky-blue)", fontWeight: "600", marginBottom: "0.8rem" }}>
                In-House Makeup Artistry
              </p>
              <p style={{ fontSize: "0.88rem", lineHeight: "1.6", color: "rgba(43, 35, 32, 0.75)" }}>
                "Indiana the makeup artist was exceptional! Flawless, camera-ready finish that lasts all day and enhances maternal glow."
              </p>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", padding: "2rem 1.5rem", borderRadius: "4px", border: "1px solid rgba(102, 0, 50, 0.08)", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--magenta-tint)", color: "var(--magenta)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontWeight: "700", fontSize: "1.1rem" }}>
                A
              </div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--plum)", marginBottom: "0.3rem" }}>Amazing</h3>
              <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sky-blue)", fontWeight: "600", marginBottom: "0.8rem" }}>
                Lead Maternity Photographer
              </p>
              <p style={{ fontSize: "0.88rem", lineHeight: "1.6", color: "rgba(43, 35, 32, 0.75)" }}>
                "Words cannot describe Amazing the photographer... she was just as her name describes. Patient, guiding, and visionary."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Booking FAQs */}
      <section className="section-padding" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="text-center" style={{ marginBottom: "3rem" }}>
            <span
              style={{
                color: "var(--magenta)",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontSize: "0.85rem",
                fontWeight: "600",
                display: "block",
                marginBottom: "0.5rem"
              }}
            >
              Verified Customer Insights
            </span>
            <h2 className="display" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", color: "var(--dark)" }}>
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {REVIEWS_FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-[#F1E4EC] rounded-lg px-6 py-1 bg-[#FBF6F3]"
              >
                <AccordionTrigger className="text-left font-serif text-lg text-[#2B2320] hover:text-[#660032] py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[#2B2320]/80 leading-relaxed text-base pt-2 pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="section-padding"
        style={{
          backgroundColor: "var(--plum)",
          color: "#FFFFFF",
          textAlign: "center"
        }}
      >
        <div className="container" style={{ maxWidth: "720px" }}>
          <span
            style={{
              color: "var(--sky-blue)",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "block",
              marginBottom: "1rem"
            }}
          >
            Join Over 1,169 Celebrated Mothers
          </span>
          <h2
            className="display"
            style={{
              fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
              lineHeight: 1.15,
              marginBottom: "1.2rem",
              color: "#FFFFFF"
            }}
          >
            Ready for Your Own Maternity Experience?
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.75",
              color: "rgba(255, 255, 255, 0.85)",
              marginBottom: "2.2rem"
            }}
          >
            Experience the baby-girl treatment at our Diamond Plaza II sanctuary. Reserve early to guarantee your preferred date between 28 and 34 weeks.
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap"
            }}
          >
            <Link
              to="/contact"
              className="btn btn-magenta"
              style={{
                padding: "0.8rem 2.2rem",
                borderRadius: "100px",
                fontWeight: "600",
                fontSize: "0.95rem"
              }}
            >
              Book Your Photoshoot
            </Link>
            <Link
              to="/pricing-plans"
              className="btn btn-outline"
              style={{
                borderColor: "rgba(255, 255, 255, 0.75)",
                color: "#FFFFFF",
                padding: "0.8rem 2rem",
                borderRadius: "100px",
                fontWeight: "600",
                fontSize: "0.95rem"
              }}
            >
              View Packages & Rates
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
