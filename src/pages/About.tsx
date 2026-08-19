import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";

const heroImg = "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886589981_IMGL4288.jpg";
const storyImg = "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg";
const expImg1 = "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg";
const expImg2 = "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg";

const stats = [
  { num: "500", suffix: "+", label: "Sessions Photographed" },
  { num: "5",   suffix: "â˜…", label: "Client Satisfaction" },
  { num: "6",   suffix: "+", label: "Years in Nairobi" },
];

const values = [
  {
    num: "01",
    name: "Intentional Luxury",
    desc: "Every detail - from the fabrics on your body to the quality of light in the frame - is considered. We don't cut corners, because your portraits will outlive us all.",
  },
  {
    num: "02",
    name: "Feminine Reverence",
    desc: "We approach every session with deep respect for the woman in front of our lens. Pregnancy is sacred. We photograph it that way - with softness, power, and grace.",
  },
  {
    num: "03",
    name: "Effortless Experience",
    desc: "You should leave your session feeling pampered, not stressed. We guide you through every pose, every outfit change, every moment - so all you have to do is glow.",
  },
];

const steps = [
  {
    num: "01",
    title: "Book & Consult",
    desc: "We connect before your session to understand your vision, week of pregnancy, and style preferences.",
    tag: "Planning",
    time: "20-30 min consult",
    loc: "Online or WhatsApp",
    get: "Clear plan + session date",
  },
  {
    num: "02",
    title: "Wardrobe & Styling",
    desc: "Choose from our curated wardrobe of gowns and wraps. Hair and makeup guidance included.",
    tag: "Styling",
    time: "45-60 min prep",
    loc: "Fiesta House Studio",
    get: "Looks tailored to your body",
  },
  {
    num: "03",
    title: "Your Session",
    desc: "A relaxed, guided 2-hour session in our Nairobi studio. We handle the posing - you handle the feeling.",
    tag: "Shoot Day",
    time: "Approx. 2 hours",
    loc: "Diamond Plaza, Nairobi",
    get: "Guided posing + signature sets",
  },
  {
    num: "04",
    title: "Your Gallery",
    desc: "Receive your hand-edited gallery within 2 weeks. Heirloom prints and albums available.",
    tag: "Delivery",
    time: "Within 14 days",
    loc: "Private online gallery",
    get: "Edited images + print options",
  },
];

export default function About() {
  const fadeRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("about-visible"); }),
      { threshold: 0.15 }
    );
    fadeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const ref = (el: HTMLElement | null) => {
    if (el && !fadeRefs.current.includes(el)) fadeRefs.current.push(el);
  };
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Layout
      title="About Fiesta House | Luxury Maternity Photography Nairobi"
      description="Learn about Fiesta House Attire, Nairobi's maternity studio where motherhood meets intentional artistry."
      keywords="about fiesta house, maternity photography nairobi, pregnancy photoshoot studio kenya"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.fiestahousematernity.com/" },
            { "@type": "ListItem", "position": 2, "name": "About", "item": "https://www.fiestahousematernity.com/about" }
          ]
        })}
      </script>
      <style>{`
        .about-fade {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .about-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        @keyframes expPulse {
          0% { box-shadow: 0 0 0 0 rgba(196,92,130,0.45); }
          70% { box-shadow: 0 0 0 10px rgba(196,92,130,0); }
          100% { box-shadow: 0 0 0 0 rgba(196,92,130,0); }
        }
        @keyframes expReveal {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes expFill {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .exp-wrap {
          display: grid;
          grid-template-columns: minmax(280px, 0.95fr) minmax(300px, 1.05fr);
          gap: clamp(1.25rem, 3vw, 2.5rem);
          align-items: start;
        }
        .exp-panel {
          border: 1px solid rgba(44,44,42,0.14);
          background: #fff;
          padding: clamp(1rem, 2vw, 1.4rem);
        }
        .exp-chip-row {
          margin-top: 0.8rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .exp-chip {
          font-size: 0.64rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid rgba(44,44,42,0.2);
          padding: 0.32rem 0.55rem;
          color: #575651;
          background: #faf8f4;
        }
        .exp-steps {
          position: relative;
          display: grid;
          gap: 0.8rem;
        }
        .exp-step {
          display: grid;
          grid-template-columns: 2.2rem 1fr;
          gap: 0.85rem;
          padding: 0.7rem 0.7rem 0.7rem 0;
          border-bottom: 1px solid rgba(44,44,42,0.1);
        }
        .exp-dot {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          border: 1px solid rgba(44,44,42,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          color: #6d6a63;
          background: #fff;
        }
        .exp-dot-active {
          animation: expPulse 1.4s ease-out infinite;
        }
        .exp-detail-card {
          animation: expReveal 0.45s ease both;
        }
        .exp-progress {
          width: 100%;
          height: 2px;
          background: rgba(44,44,42,0.12);
          overflow: hidden;
        }
        .exp-progress-fill {
          height: 100%;
          width: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, var(--magenta, #660032), #d99bb7);
          animation: expFill 3.2s linear forwards;
        }
        .exp-step:first-child .exp-dot {
          background: var(--magenta, #660032);
          border-color: var(--magenta, #660032);
          color: #fff;
        }
        @media (max-width: 900px) {
          .exp-wrap {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* â”€â”€ HERO â”€â”€ */}
      <section
        style={{
          paddingTop: "120px",
          minHeight: "60vh",
          display: "flex",
          alignItems: "flex-end",
          position: "relative",
          overflow: "hidden",
          background: "var(--cream, #FAF7F2)",
        }}
      >
        <img
          src={heroImg}
          alt="Fiesta House maternity portrait"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.12,
          }}
        />
        {/* watermark */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "80px",
            right: "-2rem",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(8rem, 18vw, 16rem)",
            fontWeight: 300,
            color: "rgba(44,44,42,0.04)",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          ABOUT
        </span>

        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 clamp(1.5rem, 5vw, 3rem) 5rem",
          }}
        >
          <div className="about-fade" ref={ref}>
            <div
              style={{
                fontSize: "0.68rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--magenta, #660032)",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ display: "block", width: "2rem", height: "1px", background: "var(--magenta, #660032)" }} />
              Our Story
            </div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.8rem, 5.5vw, 5.5rem)",
                fontWeight: 300,
                lineHeight: 1.08,
                marginBottom: "1.5rem",
              }}
            >
              Where{" "}
              <em style={{ fontStyle: "italic", color: "var(--magenta, #660032)" }}>
                motherhood
              </em>
              <br />
              meets artistry
            </h1>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "var(--muted, #7A7873)", maxWidth: "38ch", fontWeight: 300 }}>
              Nairobi's premier luxury maternity studio - crafting timeless portraits that celebrate the beauty, power, and grace of pregnancy.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#330B25",
          padding: "2.5rem clamp(1.5rem, 5vw, 3rem)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {stats.map((s, i) => (
            <div key={i} className="about-fade" ref={ref} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
                  fontWeight: 300,
                  lineHeight: 1,
                  color: "#FFFFFF",
                }}
              >
                {s.num}
                <span style={{ fontSize: "1.5rem", color: "#B09345" }}>{s.suffix}</span>
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#B09345",
                  marginTop: "0.5rem",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ PHILOSOPHY â”€â”€ */}
      <section
        style={{
          background: "#2C2C2A",
          color: "white",
          padding: "8rem clamp(1.5rem, 5vw, 3rem)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="about-fade"
          ref={ref}
          style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}
        >
          <p style={{ fontSize: "0.68rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "2.5rem" }}>
            Our Philosophy
          </p>
          <blockquote
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.45,
              marginBottom: "2rem",
              border: "none",
              padding: 0,
            }}
          >
            "Pregnancy is not just a moment in time - it is a transformation. We are here to make sure you never forget how breathtaking it looked."
          </blockquote>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
            - Fiesta House Attire
          </p>
        </div>
      </section>

      {/* â”€â”€ STORY â”€â”€ */}
      <section style={{ padding: "8rem clamp(1.5rem, 5vw, 3rem)", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "clamp(2rem, 6vw, 6rem)",
            alignItems: "start",
          }}
        >
          <div>
            <p
              className="about-fade"
              ref={ref}
              style={{ fontSize: "0.68rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--muted, #7A7873)", marginBottom: "1.5rem" }}
            >
              Who We Are
            </p>
            <h2
              className="about-fade"
              ref={ref}
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 300, lineHeight: 1.2 }}
            >
              A studio built on intention
            </h2>
            <div className="about-fade" ref={ref} style={{ marginTop: "2rem", border: "1px solid rgba(44,44,42,0.12)", padding: "0.6rem" }}>
              <img
                src={storyImg}
                alt="Expectant mother portrait in studio"
                loading="lazy"
                decoding="async"
                style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover" }}
              />
            </div>
          </div>
          <div className="about-fade" ref={ref} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              <>Fiesta House Attire was born from a simple belief: <strong>every expecting mother deserves to feel like the most beautiful woman in the world.</strong> We are a Nairobi-based luxury maternity photography studio dedicated to creating portraits that are as timeless as the love you carry.</>,
              <>Our studio is a sanctuary - a calm, elegantly styled space where you can arrive, exhale, and be celebrated. We handle everything: the wardrobe, the lighting, the posing, the atmosphere. Your only job is to show up and feel.</>,
              <>We work with a <strong>curated wardrobe of flowing gowns, silks, and wraps</strong> sourced specifically for maternity photography. Every piece is chosen to flatter the beauty of a pregnant body, not conceal it.</>,
              <>Whether you are 28 weeks or 36 weeks, a first-time mother or adding to your family - <strong>this session is yours.</strong> We photograph women of every background, body type, and story with equal care and reverence.</>,
            ].map((text, i) => (
              <p key={i} style={{ fontSize: "0.95rem", lineHeight: 1.9, color: "var(--muted, #7A7873)", fontWeight: 300 }}>
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ VALUES â”€â”€ */}
      <section style={{ background: "#F5F0E8", padding: "8rem clamp(1.5rem, 5vw, 3rem)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            className="about-fade"
            ref={ref}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "2rem",
              marginBottom: "5rem",
              borderBottom: "1px solid rgba(44,44,42,0.12)",
              paddingBottom: "2rem",
            }}
          >
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 300 }}>
              What we stand for
            </h2>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted, #7A7873)" }}>
              03 Principles
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {values.map((v, i) => (
              <div
                key={i}
                className="about-fade"
                ref={ref}
                style={{
                  padding: "3rem clamp(1rem, 2.5vw, 2.5rem)",
                  borderRight: i < values.length - 1 ? "1px solid rgba(44,44,42,0.12)" : "none",
                  transitionDelay: `${i * 0.15}s`,
                }}
              >
                <span style={{ display: "block", fontFamily: "'Cormorant Garamond', serif", fontSize: "0.85rem", color: "var(--magenta, #660032)", marginBottom: "1.5rem", letterSpacing: "0.1em" }}>
                  {v.num}
                </span>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 400, marginBottom: "1rem", lineHeight: 1.2 }}>
                  {v.name}
                </h3>
                <p style={{ fontSize: "0.83rem", lineHeight: 1.75, color: "var(--muted, #7A7873)", fontWeight: 300 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ EXPERIENCE â”€â”€ */}
     {/* â”€â”€ EXPERIENCE â”€â”€ */}
<section style={{ padding: "6rem clamp(1.5rem, 5vw, 3rem)", maxWidth: "1200px", margin: "0 auto" }}>
  <div style={{
    display: "flex", alignItems: "baseline", justifyContent: "space-between",
    marginBottom: "4rem", borderBottom: "0.5px solid rgba(44,44,42,0.12)", paddingBottom: "1.5rem"
  }}>
    <span style={{ fontSize: "0.68rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--magenta)", display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ display: "block", width: "24px", height: "1px", background: "var(--magenta)" }} />
      The Experience
    </span>
    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 300, lineHeight: 1 }}>
      Four steps to forever.
    </h2>
  </div>

  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem" }}>
    <div className="exp-progress" aria-hidden="true">
      <div key={activeStep} className="exp-progress-fill" />
    </div>
    <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)" }}>
      Autoplay
    </span>
  </div>

  {/* Steps row */}
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", position: "relative", gap: 0 }}>
    {/* connector line */}
    <div style={{ position: "absolute", top: "13px", left: "calc(12.5% + 14px)", right: "calc(12.5% + 14px)", height: "1px", background: "rgba(44,44,42,0.12)", zIndex: 0 }} />

    {steps.map((s, i) => (
      <div
        key={i}
        onClick={() => setActiveStep(i)}
        style={{ padding: "0 1.5rem 0 0", position: "relative", zIndex: 1, cursor: "pointer" }}
      >
        <div
          className={activeStep === i ? "exp-dot exp-dot-active" : "exp-dot"}
          style={{
          width: "28px", height: "28px", borderRadius: "50%",
          border: activeStep === i ? "none" : "0.5px solid rgba(44,44,42,0.2)",
          background: activeStep === i ? "var(--magenta)" : "var(--cream)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Cormorant Garamond', serif", fontSize: "12px",
          color: activeStep === i ? "white" : "var(--muted)",
          transform: activeStep === i ? "scale(1.2)" : "scale(1)",
          transition: "all 0.35s ease",
          marginBottom: "2rem",
        }}>
          0{i + 1}
        </div>
        <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: activeStep === i ? "var(--magenta)" : "var(--muted)", marginBottom: "0.6rem", transition: "color 0.3s" }}>
          Step 0{i + 1}
        </p>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", fontWeight: 400, marginBottom: activeStep === i ? "0.75rem" : 0, lineHeight: 1.2 }}>
          {s.title}
        </h3>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.75, color: "var(--muted)", fontWeight: 300, maxWidth: "160px", overflow: "hidden", opacity: activeStep === i ? 1 : 0, height: activeStep === i ? "auto" : 0, transition: "opacity 0.4s ease", marginBottom: activeStep === i ? "0.75rem" : 0 }}>
          {s.desc}
        </p>
        {activeStep === i && (
          <span style={{ display: "inline-block", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", padding: "4px 10px", border: "0.5px solid var(--magenta)", color: "var(--magenta)", borderRadius: "20px" }}>
            {s.tag}
          </span>
        )}
      </div>
    ))}
  </div>

  {/* Detail panel */}
  <div key={activeStep} className="exp-detail-card" style={{ marginTop: "3rem", padding: "2rem 2.5rem", border: "0.5px solid rgba(44,44,42,0.12)", borderRadius: "12px", background: "var(--warm-white)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem" }}>
    {[
      { label: "Timeline", val: steps[activeStep].time },
      { label: "Location",  val: steps[activeStep].loc },
      { label: "What you get", val: steps[activeStep].get },
    ].map((d, i) => (
      <div key={i}>
        <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.4rem" }}>{d.label}</p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontStyle: "italic", fontWeight: 300 }}>{d.val}</p>
      </div>
    ))}
  </div>

  {/* Nav arrows */}
  <div style={{ display: "flex", gap: "8px", marginTop: "2rem", justifyContent: "flex-end" }}>
    {["â†", "â†’"].map((arrow, i) => (
      <button key={i} onClick={() => setActiveStep(i === 0 ? (activeStep + 3) % 4 : (activeStep + 1) % 4)}
        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "0.5px solid rgba(44,44,42,0.2)", background: "transparent", cursor: "pointer", fontSize: "16px", color: "var(--muted)", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--magenta)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--magenta)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "rgba(44,44,42,0.2)"; }}
      >{arrow}</button>
    ))}
  </div>
</section>

      {/* â”€â”€ CTA â”€â”€ */}
      <section
        style={{
          background: "#2C2C2A",
          padding: "7rem clamp(1.5rem, 5vw, 3rem)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="about-fade" ref={ref} style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "1.5rem" }}>
            Ready to begin?
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "white",
              marginBottom: "3rem",
              lineHeight: 1.15,
            }}
          >
            Your portraits are<br />waiting to be made.
          </h2>
          <Link
            to="/contact"
            style={{
              display: "inline-block",
              padding: "1rem 3rem",
              background: "var(--magenta, #660032)",
              color: "white",
              textDecoration: "none",
              fontSize: "0.72rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Book Your Session
          </Link>
        </div>
      </section>
    </Layout>
  );
}


