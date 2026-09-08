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

export interface RealReview {
  id: string;
  author: string;
  authorSubtitle: string;
  date: string;
  category: "all" | "stylist" | "makeup" | "photographer" | "family" | "first-time";
  rating: number;
  highlightTag: string;
  staffMentioned?: string;
  quote: string;
}

const REAL_REVIEWS: RealReview[] = [
  {
    id: "1",
    author: "Lydia Opiyo",
    authorSubtitle: "Verified Google Review",
    date: "2 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Baby Girl Treatment",
    staffMentioned: "Faith, Indiana, Beverly & Amazing",
    quote:
      "I received baby girl treatment, felt like I was outside Kenya for a minute, in those countries where Expectant mothers are valued and cherished. Staff are amazing, from Faith, to Indiana to Beverly to Amazing the talented photographer. I'm a happy Client! I will definitely recommend any day. ❤️❤️❤️"
  },
  {
    id: "2",
    author: "Hellen Okochil",
    authorSubtitle: "Verified Google Review",
    date: "2 months ago",
    category: "makeup",
    rating: 5,
    highlightTag: "Exceptional Artistry",
    staffMentioned: "Indiana (MUA), Beverly (Stylist) & Amazing",
    quote:
      "Very helpful staff. Indiana the make up artist was exceptional! Beverly my stylist was incredible! And words cannot describe Amazing the photographer… she was just as her name describes. Am blessed!"
  },
  {
    id: "3",
    author: "Agarther Gichaga",
    authorSubtitle: "First-Time Mom • Google Review",
    date: "3 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Women-Only Led Enterprise",
    quote:
      "As a first time mom to be, I quite enjoyed my experience with Fiesta House Maternity. And the fact that it is a women-only-led enterprise elevated the experience. For mom's looking for a shoot service, I 100% recommend Fiesta - they won't fail you ⭐️"
  },
  {
    id: "4",
    author: "Rose Muthoni",
    authorSubtitle: "Return Client (4th Shoot) • 6 Photos",
    date: "6 months ago",
    category: "photographer",
    rating: 5,
    highlightTag: "4th Photoshoot with Fiesta",
    quote:
      "Its my fourth photoshoot with them and they always deliver. The attentiveness, keeness to detail and vibes are next to none. The photos always shock me because they are sooooo beautiful. I would recommend them over and over again."
  },
  {
    id: "5",
    author: "Alvin Gachie",
    authorSubtitle: "Local Guide • 22 Reviews",
    date: "10 months ago",
    category: "family",
    rating: 5,
    highlightTag: "Couple Maternity Shoot",
    quote:
      "It was a great experience having our maternity shoot done by Fiesta House Maternity. The team is well organized, from front office to makeup artists, stylists, photographer and team. A special pause and reflection moment to celebrate the journey, and marking a moment before welcoming a newborn. Definitely recommended!"
  },
  {
    id: "6",
    author: "Josephine Njoki",
    authorSubtitle: "Traveled from Mombasa to Nairobi",
    date: "1 month ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Traveled from Mombasa",
    quote:
      "Coming all the way from Mombasa to Nairobi for a photoshoot sounds crazy, right 😄 but having my shoot here in fiesta house maternity is a dream come true... as soon as I entered the front desk was very welcoming and loving, the makeup and photos were beyond perfection."
  },
  {
    id: "7",
    author: "Fridah Nzelu",
    authorSubtitle: "Verified Google Review",
    date: "2 months ago",
    category: "photographer",
    rating: 5,
    highlightTag: "Comfort & Posing Guidance",
    quote:
      "Had such an amazing photoshoot experience. From the warm welcome to the guidance during the session, make up artist top notch everything was perfect. The photographer made me feel beautiful, confident, and comfortable throughout."
  },
  {
    id: "8",
    author: "Njuka Njenga",
    authorSubtitle: "Verified Google Review",
    date: "3 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "10/10 Care & Passion",
    quote:
      "Enjoyed every bit of the photoshoot. From the reception, to the makeup artist, the stylist. All were so professional and treated me with such care. The passion for what they do was evident. The photos did not disappoint either 10/10. Give them all your money!"
  },
  {
    id: "9",
    author: "Brigitte Moraa",
    authorSubtitle: "Family & Toddler Session",
    date: "1 month ago",
    category: "family",
    rating: 5,
    highlightTag: "Patient with Toddlers",
    quote:
      "I absolutely loved the experience and the staff and how supportive and attentive they were during the entire process especially being patient with a toddler. P.S The photos also turned out amazing <3"
  },
  {
    id: "10",
    author: "Rose Oyugi",
    authorSubtitle: "Local Guide • 21 Reviews",
    date: "3 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "Empowering Reluctant Moms",
    quote:
      "This was nothing like what I expected, it was exceptional. I was such a last minute dot com person, was feeling vulnerable and didn't want to make a maternity shoot. After much convincing from friends, I agreed to do it and I have to say it was the best experience for me. 100% recommend."
  },
  {
    id: "11",
    author: "Carol Mwai",
    authorSubtitle: "Local Guide • 6 Reviews",
    date: "5 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "Styling & Design Prowess",
    staffMentioned: "Faith, Beverly, Wanjiku & Amazing",
    quote:
      "We loved the kind welcome by Faith, the professionalism and design prowess by Beverly, the wonderful job by Wanjiku and the photography skills showcased by Amazing. We are definitely coming back for another shoot."
  },
  {
    id: "12",
    author: "Carren Bellion",
    authorSubtitle: "Returning Client • 2nd Shoot",
    date: "2 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "Stunning Attires & Backdrops",
    quote:
      "My second time being here, and the experience is still the best! Amazing customer service, beautiful photo backgrounds, and stunning attires. Fiesta truly knows how to make every moment special. I would highly recommend them any day. ❤️"
  },
  {
    id: "13",
    author: "Njeri Agalla",
    authorSubtitle: "Family Session • Verified Review",
    date: "6 months ago",
    category: "family",
    rating: 5,
    highlightTag: "Husband & Son Included",
    quote:
      "The Customer service was so good from the reception to the makeup artist to the stylists to the photographer... everybody was so kind and patient with us (me, my husband and our son) who was all over the place... he was even fed! The care and patience made the day stress-free."
  },
  {
    id: "14",
    author: "Phyllis Gichuki",
    authorSubtitle: "Verified Google Review",
    date: "7 months ago",
    category: "first-time",
    rating: 5,
    highlightTag: "All-Women Staff Coordination",
    quote:
      "Excellent service... amazing that it's all women staff who understand and coordinate so well with expectant women. I love it. Highly recommend."
  },
  {
    id: "15",
    author: "Mercy Masila",
    authorSubtitle: "Verified Google Review",
    date: "4 months ago",
    category: "makeup",
    rating: 5,
    highlightTag: "All Outfits & Makeup Included",
    quote:
      "Had such a great experience during the shoot. I got all the outfits and makeup and this gave me total peace of mind. The photographer was amazing as well."
  },
  {
    id: "16",
    author: "Faith Migwi",
    authorSubtitle: "Verified Google Review",
    date: "10 months ago",
    category: "stylist",
    rating: 5,
    highlightTag: "Premium Costume Wardrobe",
    quote:
      "Very warm and well coordinated staff that help you in changing into the costumes and also posing. Customer service is premium and they have a variety of backgrounds and outfits to pick from. Their images are of high quality and very affordable. Will definitely be back and bring a friend!!"
  }
];

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
    a: "Yes! As clients like Mercy Masila and Hellen Okochil noted, our Diamond Plaza II sanctuary includes everything under one roof: access to our private atelier of 80+ designer gowns, professional makeup, and guided posing so you can just arrive and be pampered."
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
          "priceRange": "KES 15,000 – KES 80,000",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Diamond Plaza II, 4th Floor, Parklands",
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
          paddingBottom: "3.5rem",
          backgroundColor: "#FBF6F3",
          borderBottom: "1px solid var(--sky-blue-tint)"
        }}
      >
        <div className="container" style={{ maxWidth: "920px", textAlign: "center" }}>
          {/* Authentic Google Rating Banner */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              backgroundColor: "rgba(102, 0, 50, 0.06)",
              padding: "0.5rem 1.3rem",
              borderRadius: "100px",
              marginBottom: "1.4rem",
              border: "1px solid rgba(102, 0, 50, 0.14)"
            }}
          >
            <span style={{ color: "#F59E0B", fontSize: "1.2rem", letterSpacing: "2px" }}>★★★★★</span>
            <span
              style={{
                color: "var(--plum)",
                fontSize: "0.92rem",
                fontWeight: "700",
                letterSpacing: "0.02em"
              }}
            >
              4.9 Rating • 1,169+ Verified Google Reviews
            </span>
          </div>

          <span
            style={{
              color: "var(--magenta)",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "block",
              marginBottom: "0.8rem"
            }}
          >
            Nairobi's Most-Reviewed Maternity Studio
          </span>

          <h1
            className="display"
            style={{
              fontSize: "clamp(2.3rem, 4.5vw, 4rem)",
              color: "var(--dark)",
              lineHeight: 1.12,
              marginBottom: "1.3rem"
            }}
          >
            Fiesta House Maternity Reviews
          </h1>

          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: "1.75",
              color: "rgba(43, 35, 32, 0.82)",
              maxWidth: "720px",
              margin: "0 auto 2.2rem"
            }}
          >
            Over 1,169 expectant mothers and families have shared their experiences at our
            Diamond Plaza II sanctuary. Here is what real clients say about our gowns,
            all-female crew, and luxury photoshoot journey.
          </p>

          {/* Key Trust Stats Pill Grid */}
          <div
            style={{
              display: "flex",
              gap: "1.2rem",
              justifyContent: "center",
              flexWrap: "wrap",
              fontSize: "0.88rem",
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
      <section className="section-padding" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="container">
          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.6rem",
              flexWrap: "wrap",
              marginBottom: "3.5rem"
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
                  backgroundColor: filter === tab.key ? "var(--plum)" : "#FBF6F3",
                  color: filter === tab.key ? "#FFFFFF" : "var(--plum)",
                  border: filter === tab.key ? "1px solid var(--plum)" : "1px solid rgba(102, 0, 50, 0.12)"
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
                  backgroundColor: "#FBF6F3",
                  borderRadius: "6px",
                  padding: "2.5rem 2.2rem",
                  border: "1px solid rgba(102, 0, 50, 0.08)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.02)",
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
                      color: "rgba(43, 35, 32, 0.88)",
                      fontStyle: "italic",
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
                        color: "var(--plum)",
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
                      backgroundColor: "rgba(102, 0, 50, 0.06)",
                      padding: "0.35rem 0.85rem",
                      borderRadius: "100px"
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
              to="/pricing"
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
