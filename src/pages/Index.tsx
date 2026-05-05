import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Layout from "@/components/site/Layout";
import { fetchPortfolios, fetchAssets, fetchFolders } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

import heroImg from "@/assets/hero_new.png";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import gownImg from "@/assets/gowns.jpg";

interface PortfolioImage {
  id: string;
  url: string;
}

interface Portfolio {
  id: string;
  title: string;
  slug: string;
  description: string;
  images: PortfolioImage[];
}

interface Asset {
  id: string;
  url: string;
}

interface Folder {
  id: string;
  name: string;
  cover_image_url?: string;
}

const Index = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [portfoliosData, assetsData, foldersData] = await Promise.all([
          fetchPortfolios(),
          fetchAssets(undefined, 1, 12),
          fetchFolders()
        ]);
        
        if (portfoliosData) setPortfolios(portfoliosData);
        if (assetsData && assetsData.assets) setAssets(assetsData.assets);
        if (foldersData) setFolders(foldersData);
      } catch (err) {
        console.error("Failed to load home page data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get images for the hero slider
  const heroImages = portfolios.length > 0
    ? portfolios.flatMap(p => p.images.slice(0, 2)).map(img => img.url).slice(0, 5)
    : [heroImg];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero" style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden"
      }}>
        <Carousel
          opts={{ loop: true }}
          className="w-full h-full"
          autoPlay={true}
        >
          <CarouselContent className="h-screen m-0 p-0">
            {heroImages.map((url, i) => (
              <CarouselItem key={i} className="relative h-full w-full p-0">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-110"
                  style={{ backgroundImage: `url(${url})` }}
                />
                <div className="absolute inset-0 bg-black/30" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute inset-0 flex items-center justify-center text-center z-10 pointer-events-none">
          <div className="container fade-in" style={{ color: "white", pointerEvents: "auto" }}>
            <h1 className="display" style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)", marginBottom: "1rem", textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
              Fiesta House Attire
            </h1>
            <p style={{
              fontSize: "clamp(1rem, 2vw, 1.4rem)",
              textTransform: "uppercase",
              letterSpacing: "0.4em",
              marginBottom: "3rem",
              fontWeight: "400",
              color: "var(--sky-blue)"
            }}>
              Nairobi's premier luxury maternity studio
            </p>
            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
              <Link to="/contact" className="btn btn-primary" style={{ backgroundColor: "var(--magenta)", border: "none" }}>Book a Session</Link>
              <Link to="/portfolio" className="btn btn-outline" style={{ borderColor: "white", color: "white" }}>View Portfolio</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Collections Section */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Curated Collections</span>
            <h2 className="display" style={{ fontSize: "3.5rem", marginTop: "1rem" }}>Explore our signature aesthetics</h2>
          </div>
          <div className="grid grid-3" style={{ gap: "2rem" }}>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full" />
              ))
            ) : (
              portfolios.slice(0, 3).map((portfolio) => (
                <Link key={portfolio.id} to={`/portfolio/${portfolio.slug}`} className="group relative overflow-hidden aspect-[3/4]">
                  {portfolio.images[0] && (
                    <img
                      src={portfolio.images[0].url}
                      alt={portfolio.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <h3 className="display" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{portfolio.title}</h3>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem" }}>View Collection →</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Signature Concepts / Specialties */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "6rem" }}>
            <span style={{ color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Our Signature Concepts</span>
            <h2 className="display" style={{ fontSize: "4.5rem", marginTop: "1rem" }}>Elevating the Maternity Narrative</h2>
          </div>

          <div className="grid grid-3" style={{ gap: "4rem" }}>
            {[
              {
                id: "236d5ccb-e6d2-47c1-a98f-0ba95fd70385",
                title: "Expertly Guided Studio Shoots",
                subtitle: "Studio Shoots",
                desc: "Step into our studio for an elegant maternity photography experience focused on poses and perfection.",
                fallbackImg: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886824525_IMG_5360-371x347.jpg",
                link: "/gallery/236d5ccb-e6d2-47c1-a98f-0ba95fd70385"
              },
              {
                id: "b8b100e9-81ce-4778-bf57-0adee0b46fc0",
                title: "Our Maternity Gowns",
                subtitle: "Couture Atelier",
                desc: "Enhance your maternity photoshoot with our collection of luxurious, hand-crafted designer gowns.",
                fallbackImg: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886824525_IMG_5360-371x347.jpg",
                link: "/maternity-gowns"
              },
              {
                id: "1aea11b8-fd79-4602-9c44-af400754ebec",
                title: "Suspending Concept",
                subtitle: "Cinematic Art",
                desc: "Elevate your maternity story with Fiesta House’s suspending concept—where gravity meets grace.",
                fallbackImg: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886956026_IMGL29262-scaled.jpg",
                link: "/gallery/1aea11b8-fd79-4602-9c44-af400754ebec"
              }
            ].map((concept, i) => {
              const folder = folders.find(f => f.id === concept.id);
              const displayImg = folder?.cover_image_url || concept.fallbackImg;
              
              return (
                <div key={i} className="group cursor-pointer">
                  <Link to={concept.link}>
                    <div className="overflow-hidden aspect-[4/5] mb-8 relative">
                      <img
                        src={displayImg}
                        alt={concept.title}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                    </div>
                    <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.8rem", fontWeight: "600" }}>{concept.subtitle}</span>
                    <h3 className="display" style={{ fontSize: "2.4rem", margin: "0.5rem 0 1rem" }}>{concept.title}</h3>
                    <p style={{ opacity: 0.6, lineHeight: "1.6", marginBottom: "1.5rem" }}>{concept.desc}</p>
                    <span className="inline-block" style={{ borderBottom: "2px solid var(--sky-blue)", paddingBottom: "2px", fontSize: "0.9rem", fontWeight: "600", color: "var(--sky-blue)" }}>
                      Explore Collection →
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>A Private Sanctuary</span>
            <h2 className="display" style={{ fontSize: "3.5rem", marginTop: "1rem", color: "var(--dark)" }}>Not just a studio. A maternity experience.</h2>
          </div>
          <div className="grid grid-2" style={{ gap: "4rem", alignItems: "center" }}>
            <div style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "rgba(28, 28, 28, 0.8)" }}>
              <p>
                Fiesta House is a private, fully curated maternity sanctuary designed exclusively for expectant mothers who refuse to be ordinary. We transform pregnancy into art through our iconic, one-of-a-kind studio sets.
              </p>
              <p>
                Every detail is intentional. From rare designer maternity gowns and professional makeup artistry to guided posing and an all-women team trained specifically to care for expectant mothers, everything is executed at a world-class standard.
              </p>
              <Link to="/experience" style={{ color: "var(--magenta)", borderBottom: "1px solid var(--magenta)", paddingBottom: "4px", fontSize: "1rem", fontWeight: "500" }}>Discover the Fiesta Way →</Link>
            </div>
            <div style={{ position: "relative" }}>
              <img src={p1} alt="Maternity Portrait" style={{ width: "100%", borderRadius: "2px", boxShadow: "20px 20px 0 var(--sky-blue-tint)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Immersive Studio Experience - Parallax Section */}
      <section 
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ 
          backgroundAttachment: "fixed",
          backgroundImage: "url('https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886956026_IMGL29262-scaled.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="container relative z-10 text-white">
          <div style={{ maxWidth: "700px" }}>
            <span style={{ 
              color: "var(--sky-blue)", 
              textTransform: "uppercase", 
              letterSpacing: "0.4em", 
              fontSize: "1.1rem", 
              fontWeight: "600", 
              display: "block", 
              marginBottom: "2.5rem",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}>The Sanctuary</span>
            <h2 className="display" style={{ 
              fontSize: "clamp(4rem, 12vw, 7.5rem)", 
              lineHeight: "1", 
              marginBottom: "2.5rem",
              textShadow: "0 4px 20px rgba(0,0,0,0.4)"
            }}>Where Gravity Meets Grace</h2>
            <p style={{ 
              fontSize: "1.4rem", 
              lineHeight: "1.6", 
              opacity: 0.95, 
              marginBottom: "4rem",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              maxWidth: "600px"
            }}>
              Our Nairobi studio is a private, fully curated sanctuary designed specifically for the expectant mother. We don't just take photos; we create environments where your maternity story is transformed into timeless art.
            </p>
            <Link to="/experience" className="btn btn-primary" style={{ 
              backgroundColor: "var(--sky-blue)", 
              border: "none",
              padding: "1.2rem 3rem",
              fontSize: "1rem",
              letterSpacing: "0.1em",
              boxShadow: "0 10px 30px rgba(110, 193, 228, 0.3)"
            }}>Discover the Atelier →</Link>
          </div>
        </div>
      </section>

      {/* Iconic Sets Section - Gallery Layout */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "8rem" }}>
            <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>The Environments</span>
            <h2 className="display" style={{ fontSize: "4rem", marginTop: "1rem" }}>Curated Studio Masterpieces</h2>
          </div>

          <div className="grid grid-3" style={{ gap: "5rem 3rem" }}>
            {[
              { name: "The Master Staircase", detail: "Regal architecture for sweeping silhouettes.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887599212_IMG_9057-768x1152.jpg" },
              { name: "Flower Gardens", detail: "Immersive floral arrangements in full bloom.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg" },
              { name: "The Minimalist Loft", detail: "Shadow and light editorial storytelling.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg" },
              { name: "Elegant Swings", detail: "Capture the lightness of being.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887596251_IMG_0053-1365x2048.jpg" },
              { name: "Cinematic Boat", detail: "Serene aquatic poetic reflection.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887595087_IMGL5485-scaled.jpg" },
              { name: "The Grand Chandelier", detail: "High-glamour lighting and reflections.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598071_IMGL1316-460x460.jpg" }
            ].map((set, i) => (
              <div key={i} className="group cursor-default">
                <div className="overflow-hidden aspect-[4/5] mb-8 relative rounded-[2px] shadow-sm group-hover:shadow-xl transition-all duration-700">
                  <img src={set.img} alt={set.name} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-700" />
                  <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <span className="text-[10px] uppercase tracking-widest font-bold">SET {i+1}</span>
                  </div>
                </div>
                <h3 className="display" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{set.name}</h3>
                <p style={{ fontSize: "1rem", opacity: 0.6, lineHeight: "1.6" }}>{set.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All-Inclusive Luxury - Refactored Editorial List */}
      <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "8rem" }}>
            <h2 className="display" style={{ fontSize: "4.5rem", color: "var(--dark)" }}>All-Inclusive Luxury</h2>
            <div style={{ width: "120px", height: "1px", backgroundColor: "var(--magenta)", margin: "2rem auto" }}></div>
          </div>

          <div className="grid grid-2" style={{ gap: "8rem" }}>
            {[
              { title: "Designer Atelier", desc: "Access to our rare in-house collection of silk, lace, and chiffon gowns.", color: "var(--sky-blue)" },
              { title: "Professional Makeup", desc: "On-site artistry tailored for studio lighting and editorial finishes.", color: "var(--magenta)" },
              { title: "Private Sanctuary", desc: "A climate-controlled, calm space at Diamond Plaza designed for comfort.", color: "var(--sky-blue)" },
              { title: "All-Women Team", desc: "An expert team trained specifically to support and care for expectant mothers.", color: "var(--magenta)" },
              { title: "Guided Posing", desc: "Never feel lost. We provide expert direction for every frame and movement.", color: "var(--sky-blue)" },
              { title: "Cinematic Editing", desc: "High-end retouching and bespoke finishing for every single image.", color: "var(--magenta)" }
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
                <div className="display" style={{ fontSize: "3.5rem", color: item.color, opacity: 0.65, lineHeight: "0.8", minWidth: "2.5rem" }}>
                  {i + 1}
                </div>
                <div>
                  <h3 className="display" style={{ fontSize: "2rem", marginBottom: "1rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "1.1rem", opacity: 0.7, lineHeight: "1.6" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Gown Closet Teaser */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div className="grid grid-2" style={{ gap: "6rem", alignItems: "center" }}>
            <div>
              <img src={gownImg} alt="Designer Gowns" style={{ width: "100%", borderRadius: "2px", boxShadow: "-20px 20px 0 var(--magenta-tint)" }} />
            </div>
            <div>
              <span style={{ color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "500" }}>Couture Atelier</span>
              <h2 className="display" style={{ fontSize: "3.5rem", margin: "1rem 0" }}>Originality, Designed.</h2>
              <p style={{ fontSize: "1.2rem", lineHeight: "1.8", opacity: 0.8, marginBottom: "2rem" }}>
                Every piece in the Fiesta Closet is designed and crafted in-house. These are original garments that cannot be found anywhere else in Kenya. We transform fabrics into heirlooms.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
                {["Silk Trains", "Delicate Lace", "Soft Chiffon", "Statement Pieces"].map(tag => (
                  <span key={tag} style={{ padding: "0.5rem 1rem", backgroundColor: "var(--magenta-tint)", color: "var(--magenta)", fontSize: "0.85rem", borderRadius: "100px", fontWeight: "500" }}>
                    {tag}
                  </span>
                ))}
              </div>
              <Link to="/experience" className="btn btn-outline" style={{ borderColor: "var(--magenta)", color: "var(--magenta)" }}>The Collection</Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Fiesta Experience Walkthrough */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "6rem" }}>
            <span style={{ color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>The Process</span>
            <h2 className="display" style={{ fontSize: "4.5rem", marginTop: "1rem" }}>Your journey to the frame</h2>
          </div>

          <div className="grid grid-4" style={{ gap: "3rem" }}>
            {[
              { step: "01", title: "Consultation", desc: "We discuss your vision, preferred sets, and gown selections to curate your unique session." },
              { step: "02", title: "The Transformation", desc: "Professional makeup and styling in our private atelier to make you feel like the queen you are." },
              { step: "03", title: "The Session", desc: "Guided posing in our iconic sets with an all-women team focused on your comfort and beauty." },
              { step: "04", title: "The Reveal", desc: "Receive your curated gallery of high-end, cinematically retouched heirlooms." }
            ].map((s, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div className="display" style={{ fontSize: "5rem", color: i % 2 === 0 ? "var(--sky-blue)" : "var(--magenta)", opacity: 0.2, position: "absolute", top: "-2rem", left: "-1rem", zIndex: 0 }}>{s.step}</div>
                <div style={{ position: "relative", zIndex: 1, borderLeft: `3px solid ${i % 2 === 0 ? "var(--sky-blue)" : "var(--magenta)"}`, paddingLeft: "1.5rem" }}>
                  <h3 className="display" style={{ fontSize: "2rem", marginBottom: "1rem" }}>{s.title}</h3>
                  <p style={{ fontSize: "1rem", opacity: 0.7, lineHeight: "1.6" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest from the Studio - Masonry Gallery */}
      <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
        <div className="container">
          <div className="grid grid-2" style={{ gap: "4rem", alignItems: "flex-end", marginBottom: "5rem" }}>
            <div>
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Live from the Sanctuary</span>
              <h2 className="display" style={{ fontSize: "4.5rem", marginTop: "1rem" }}>Recent Masterpieces</h2>
            </div>
            <p style={{ fontSize: "1.2rem", opacity: 0.7, maxWidth: "400px" }}>
              Explore the latest captures from our Nairobi studio. Every frame is a testament to the beauty of life in bloom.
            </p>
          </div>

          <div className="masonry">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="masonry-item w-full h-64 mb-8" />
              ))
            ) : (
              assets.map((asset) => (
                <div key={asset.id} className="masonry-item group relative overflow-hidden">
                  <img
                    src={asset.url}
                    alt="Studio Masterpiece"
                    className="w-full h-auto object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-magenta/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions - Accordion */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <h2 className="display" style={{ fontSize: "3.5rem" }}>Common Inquiries</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "When is the best time for my session?", a: "We typically recommend booking your session between 28 and 34 weeks, when your bump is beautifully defined but you are still comfortable moving." },
              { q: "What do I need to bring?", a: "Bring nothing but yourself and a change of undergarments. We provide the gowns, the makeup, and all styling accessories." },
              { q: "Can my partner and children join?", a: "Absolutely. We encourage family participation. All our packages include options for partners and siblings to be part of the portraits." },
              { q: "How long does it take to receive my images?", a: "A curated preview is shared within 72 hours. Your final retouched gallery is delivered within 14 working days." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "0.5rem 0" }}>
                <AccordionTrigger className="display" style={{ fontSize: "1.5rem", fontWeight: "300", textAlign: "left" }}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent style={{ fontSize: "1.1rem", opacity: 0.7, lineHeight: "1.8", paddingTop: "1rem" }}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding" style={{ backgroundColor: "white" }}>
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
              <div key={i} style={{ fontStyle: "italic", position: "relative", padding: "2rem" }}>
                <span style={{ position: "absolute", top: 0, left: 0, fontSize: "4rem", color: "var(--sky-blue-tint)", zIndex: 0 }}>"</span>
                <p style={{ fontSize: "1.8rem", lineHeight: "1.4", marginBottom: "1.5rem", fontFamily: "var(--font-display)", position: "relative", zIndex: 1 }}>
                  {t.text}
                </p>
                <cite style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: "600", color: "var(--magenta)" }}>
                  — {t.author}
                </cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding" style={{ backgroundColor: "var(--dark)", color: "white", textAlign: "center", position: "relative" }}>
        {/* Gradient accent bar at top */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "5px",
          background: "linear-gradient(90deg, var(--sky-blue), var(--magenta), var(--sky-blue))",
          backgroundSize: "200% 100%",
          animation: "gradientShift 4s ease infinite",
        }} />
        <div style={{ position: "absolute", top: "2rem", left: "2rem", opacity: 0.1, fontSize: "0.8rem", letterSpacing: "0.1em" }}>
          © FIESTA HOUSE ATTIRE COPYRIGHTS RESERVED
        </div>
        <div className="container">
          <h2 className="display" style={{ fontSize: "4rem", marginBottom: "2rem" }}>Ready to own the frame?</h2>
          <p style={{ fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 3rem", opacity: 0.7 }}>
            Experience the best maternity photoshoot in Kenya. Secure your session at our Diamond Plaza sanctuary today.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
            <Link to="/contact" className="btn" style={{ background: "linear-gradient(135deg, var(--sky-blue), #4fa8cc)", color: "white", boxShadow: "0 6px 20px rgba(110,193,228,0.4)" }}>Book your session</Link>
            <a href="https://wa.me/254720111928" className="btn btn-whatsapp">Chat on WhatsApp</a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
