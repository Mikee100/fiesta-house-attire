import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import { fetchPortfolios, fetchPublicAssets, fetchPublicFolders, fetchRecentBlogPosts, BlogPost } from "@/lib/api";
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
import BeforeAfterSlider from "@/components/site/BeforeAfterSlider";
import MasonryImage from "@/components/site/MasonryImage";
import InstagramFeed from "@/components/site/InstagramFeed";
import { Mail, MapPin, Clock, Phone, Instagram, Facebook } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import gownImg from "@/assets/gowns.jpg";
import FloatingScrollToTop from "@/components/FloatingScrollToTop";

interface PortfolioImage {
  id: string;
  url: string;
}

interface Portfolio {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  images: Array<PortfolioImage | string>;
  cover_image_url?: string | null;
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

const HOME_CAROUSEL_FOLDER_ID = "185cc818-f082-4e21-9122-c629de3c34dc";
const MAX_HERO_SLIDES = 10;
const MAX_HERO_RENDERED = 10;
const FALLBACK_HERO_IMAGES = [
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886589981_IMGL4288.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886936832_IMG_4849-scaled.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887595087_IMGL5485-scaled.jpg"
];
const HERO_DESKTOP_FOCAL_POINTS = ["center 18%", "center 22%", "center 16%", "center 20%"];

const getPortfolioCoverImage = (portfolio: Portfolio): string | null => {
  if (portfolio.cover_image_url) return portfolio.cover_image_url;

  const firstImage = portfolio.images?.[0];
  if (!firstImage) return null;

  return typeof firstImage === "string" ? firstImage : firstImage.url;
};

const Index = () => {
  const isMobile = useIsMobile();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>(FALLBACK_HERO_IMAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [portfoliosData, assetsData, foldersData, postsData, heroAssetsData] = await Promise.all([
          fetchPortfolios(),
          fetchPublicAssets(undefined, 1, 12),
          fetchPublicFolders(),
          fetchRecentBlogPosts(),
          fetchPublicAssets(HOME_CAROUSEL_FOLDER_ID, 1, MAX_HERO_SLIDES)
        ]);

        if (portfoliosData) setPortfolios(portfoliosData);
        if (assetsData && assetsData.assets) setAssets(assetsData.assets);
        if (foldersData) setFolders(foldersData);
        if (postsData) setRecentPosts(postsData.slice(0, 6));
        if (heroAssetsData?.assets?.length) {
          setHeroImages(heroAssetsData.assets.slice(0, MAX_HERO_SLIDES).map((asset: Asset) => asset.url));
        }
      } catch (err) {
        console.error("Failed to load home page data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Carousel autoplay effect (2 seconds)
  const [carouselApi, setCarouselApi] = useState(null);
  useEffect(() => {
    if (!carouselApi) return;
    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselApi]);

  return (
    <>
      <Layout
        title="Luxury Maternity Photography Nairobi | Fiesta House Maternity"
        description="Nairobi's premier luxury maternity studio. Designer gowns, professional makeup, and editorial photography at Diamond Plaza, Parklands."
        keywords="luxury maternity photography nairobi, best maternity photographer kenya, maternity gowns nairobi, pregnancy photoshoot nairobi, baby bump photoshoot nairobi"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PhotographyBusiness",
            "name": "Fiesta House Maternity",
            "alternateName": "Fiesta House Attire",
            "description": "Nairobi's premier luxury maternity photography studio offering exclusive designer gowns, professional makeup, and editorial portraits at Diamond Plaza II, Parklands.",
            "image": [
              "https://www.fiestahousematernity.com/og-image.jpg",
              "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886589981_IMGL4288.jpg",
              "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg"
            ],
            "logo": "https://www.fiestahousematernity.com/og-image.jpg",
            "@id": "https://www.fiestahousematernity.com",
            "url": "https://www.fiestahousematernity.com",
            "telephone": "+254720111928",
            "email": "info@fiestahouseattire.com",
            "priceRange": "KES 15,000 – KES 80,000",
            "currenciesAccepted": "KES",
            "paymentAccepted": "Cash, M-Pesa, Bank Transfer",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Diamond Plaza II, 4th Floor, Parklands",
              "addressLocality": "Nairobi",
              "addressRegion": "Nairobi County",
              "addressCountry": "KE"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": -1.2612,
              "longitude": 36.8228
            },
            "hasMap": "https://maps.google.com/?q=Diamond+Plaza+II+Parklands+Nairobi",
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
              ],
              "opens": "09:00",
              "closes": "18:00"
            },
            "sameAs": [
              "https://www.instagram.com/fiestahousematernity/",
              "https://www.facebook.com/fiestahousematernity",
              "https://www.youtube.com/@fiestahousematernity",
              "https://www.tiktok.com/@fiestahousematernity",
              "https://www.pinterest.com/fiestahousematernity"
            ],
            "areaServed": {
              "@type": "City",
              "name": "Nairobi",
              "sameAs": "https://en.wikipedia.org/wiki/Nairobi"
            },
            "knowsAbout": [
              "Maternity Photography",
              "Pregnancy Photoshoot",
              "Luxury Studio Photography",
              "Maternity Gowns",
              "Baby Bump Photography"
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Fiesta House Maternity",
            "url": "https://www.fiestahousematernity.com",
            "description": "Nairobi's premier luxury maternity photography studio.",
            "inLanguage": "en-KE",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://www.fiestahousematernity.com/blog?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })}
        </script>

        {/* Hero Section */}
        <section className="hero" style={{
          height: "100dvh",
          minHeight: "560px",
          position: "relative",
          overflow: "hidden"
        }}>
          <Carousel
            opts={{ loop: true }}
            setApi={setCarouselApi}
            className="w-full h-full"
          >
            <CarouselContent className="h-full m-0 p-0" style={{ height: "100dvh" }}>
              {heroImages.slice(0, MAX_HERO_RENDERED).map((url, i) => {
                const desktopFocalPoint = HERO_DESKTOP_FOCAL_POINTS[i] || "center 20%";

                return (
                <CarouselItem key={i} className="relative h-full w-full p-0">
                  <img
                    src={url}
                    alt={`Fiesta House maternity session ${i + 1}`}
                    width={1920}
                    height={1080}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                    sizes="100vw"
                    style={{
                      transitionDuration: "1000ms",
                      objectPosition: isMobile ? "center 20%" : desktopFocalPoint
                    }}
                  />
                  {/* Subtle, crystal-clear luxury vignette: vivid in the center, soft at top/bottom for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25" />
                </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          <div className="absolute inset-0 flex flex-col justify-end pb-14 sm:pb-16 md:justify-center md:pb-0 items-center text-center z-10 pointer-events-none px-4">
            <div className="fade-in" style={{ color: "white", pointerEvents: "auto", maxWidth: "860px" }}>
              <span style={{
                fontSize: "clamp(0.72rem, 1.8vw, 0.88rem)",
                textTransform: "uppercase",
                letterSpacing: "0.26em",
                fontWeight: "500",
                color: "rgba(255, 255, 255, 0.95)",
                marginBottom: "0.6rem",
                display: "block",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)"
              }}>
                Nairobi's Premier Sanctuary
              </span>

              <h1 className="display h1-mobile" style={{
                fontSize: "clamp(2.35rem, 5.8vw, 5rem)",
                fontWeight: 300,
                lineHeight: 1.06,
                marginBottom: "1rem",
                textShadow: "0 2px 14px rgba(0,0,0,0.7)"
              }}>
                We Create Maternity Photography Experiences
              </h1>

              <p className="hidden sm:block" style={{
                fontSize: "clamp(0.88rem, 1.2vw, 1rem)",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.9)",
                maxWidth: "520px",
                margin: "0 auto 1.5rem",
                textShadow: "0 1px 6px rgba(0,0,0,0.6)"
              }}>
                Curated couture gowns included, iconic permanent sets, and gentle posing guidance at Diamond Plaza II, Parklands.
              </p>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", alignItems: "center", marginTop: "0.6rem" }}>
                <Link
                  to="/contact"
                  className="btn btn-magenta"
                  data-track="booking_click:home_hero_primary"
                  style={{
                    padding: "0.65rem 1.8rem",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: "600",
                    borderRadius: "100px",
                    boxShadow: "0 6px 20px rgba(102,0,50,0.4)"
                  }}
                >
                  Book Your Shoot
                </Link>
                <Link
                  to="/portfolio"
                  className="btn btn-outline"
                  data-track="portfolio_click:home_hero_secondary"
                  style={{
                    borderColor: "rgba(255,255,255,0.75)",
                    color: "#FFFFFF",
                    padding: "0.65rem 1.6rem",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    borderRadius: "100px",
                    backdropFilter: "blur(4px)",
                    backgroundColor: "rgba(255,255,255,0.12)"
                  }}
                >
                  Portfolio
                </Link>
              </div>
            </div>
          </div>
        </section>

        
        {/* Maternity Photoshoot Description Section */}
        <section className="section-padding" style={{ background: "#FBF6F3" }}>
          <div className="container" style={{ maxWidth: 840, margin: "0 auto" }}>
            <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600", display: "block", textAlign: "center", marginBottom: "0.5rem" }}>
              Nairobi Maternity Studio
            </span>
            <h2 style={{ color: "var(--dark)", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", fontWeight: 400, marginBottom: 16, textAlign: "center", fontFamily: "'Cormorant Garamond', serif" }}>
              Where Motherhood Meets Fine Art
            </h2>
            <p style={{ fontSize: "1.05rem", color: "rgba(43, 35, 32, 0.8)", marginBottom: 16, textAlign: "center", lineHeight: "1.75" }}>
              Fiesta House is not a typical photoshoot studio. It is a private, fully curated maternity sanctuary designed exclusively for expectant mothers who refuse to be ordinary. We transform pregnancy into art through our iconic, one-of-a-kind studio sets—from the cinematic Boat Set to the regal Master Staircase, immersive Flower Gardens, elegant Swings, and grand Chandeliers.
            </p>
            <p style={{ fontSize: "1.05rem", color: "rgba(43, 35, 32, 0.8)", marginBottom: 0, textAlign: "center", lineHeight: "1.75" }}>
              Every detail is intentional. Over 80 designer gowns and trailing silks, professional makeup artistry, and calm all-women guided posing ensure you feel safe, supported, and celebrated at Diamond Plaza II, Parklands.
            </p>
          </div>
        </section>

        {/* Curated Collections Section */}
        <section className="section-padding" style={{ backgroundColor: "white" }}>
          <div className="container">
            <div className="mobile-center" style={{ marginBottom: "2.5rem" }}>
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>Curated Collections</span>
              <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", marginTop: "0.6rem" }}>Explore our signature aesthetics</h2>
            </div>

            <div className="grid grid-3" style={{ gap: "2rem" }}>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full" />
                ))
              ) : (
                portfolios.slice(0, 6).map((portfolio) => {
                  const coverImage = getPortfolioCoverImage(portfolio);

                  return (
                  <Link
                    key={portfolio.id}
                    to={`/portfolio/${portfolio.slug || portfolio.id}`}
                    data-track={`portfolio_click:home_collection_${portfolio.slug || portfolio.id}`}
                    className="group relative overflow-hidden aspect-[3/4]"
                  >
                    {coverImage && (
                      <img
                        src={coverImage}
                        alt={portfolio.title}
                        width={1200}
                        height={1600}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <h3 className="display" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{portfolio.title}</h3>
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem" }}>View Collection</span>
                    </div>
                  </Link>
                );
                })
              )}
            </div>
            {!loading && portfolios.length > 6 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
                <Link to="/portfolio" data-track="portfolio_click:home_find_more" className="btn btn-outline" style={{ borderColor: "var(--magenta)", color: "var(--magenta)", fontWeight: 600, padding: "0.75rem 2.5rem", fontSize: "1.1rem" }}>
                  Find More
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Signature Concepts / Specialties */}
        <section className="section-padding" style={{ backgroundColor: "white" }}>
          <div className="container">
            <div className="mobile-center" style={{ marginBottom: "4rem" }}>
              <span style={{ color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Our Signature Concepts</span>
              <h2 className="display h2-mobile" style={{ fontSize: "4.5rem", marginTop: "1rem" }}>Elevating the Maternity Narrative</h2>
            </div>

            <div className="grid grid-3" style={{ gap: "4rem" }}>
              {[
                {
                  id: "236d5ccb-e6d2-47c1-a98f-0ba95fd70385",
                  title: "Expertly Guided Studio Shoots",
                  subtitle: "Studio Shoots",
                  desc: "Step into our studio for an elegant maternity photography experience focused on poses and perfection.",
                  fallbackImg: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1778155044498_IMG_5453.jpg",
                  link: "/gallery/studio-shoots"
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
                  desc: "Elevate your maternity story with Fiesta House's suspending concept-where gravity meets grace.",
                  fallbackImg: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886956026_IMGL29262-scaled.jpg",
                  link: "/gallery/suspending-concept"
                }
              ].map((concept, i) => {
                const folder = folders.find(f => f.id === concept.id);
                const displayImg = folder?.cover_image_url || concept.fallbackImg;

                return (
                  <div key={i} className="group cursor-pointer">
                    <Link to={concept.link} data-track={`collection_click:home_signature_${concept.id}`}>
                      <div className="overflow-hidden aspect-[4/5] mb-8 relative">
                        <img
                          src={displayImg}
                          alt={concept.title}
                          width={1200}
                          height={1500}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                      </div>
                      <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.8rem", fontWeight: "600" }}>{concept.subtitle}</span>
                      <h3 className="display" style={{ fontSize: "2.4rem", margin: "0.5rem 0 1rem" }}>{concept.title}</h3>
                      <p style={{ opacity: 0.6, lineHeight: "1.6", marginBottom: "1.5rem" }}>{concept.desc}</p>
                      <span className="inline-block" style={{ borderBottom: "2px solid var(--sky-blue)", paddingBottom: "2px", fontSize: "0.9rem", fontWeight: "600", color: "var(--sky-blue)" }}>
                        Explore Collection
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
            <div className="mobile-center" style={{ marginBottom: "3rem" }}>
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>A Private Sanctuary</span>
              <h2 className="display h2-mobile" style={{ fontSize: "3.5rem", marginTop: "1rem", color: "var(--dark)" }}>Not just a studio. A maternity experience.</h2>
            </div>
            <div className="grid grid-2 mobile-gap-8" style={{ gap: "4rem", alignItems: "center" }}>
              <div style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "rgba(28, 28, 28, 0.8)" }}>
                <p>
                  Fiesta House is a private, fully curated maternity sanctuary designed exclusively for expectant mothers who refuse to be ordinary. We transform pregnancy into art through our iconic, one-of-a-kind studio sets.
                </p>
                <p>
                  Every detail is intentional. From rare designer maternity gowns and professional makeup artistry to guided posing and an all-women team trained specifically to care for expectant mothers, everything is executed at a world-class standard.
                </p>
                <Link to="/experience" data-track="experience_click:home_sanctuary_text" style={{ color: "var(--magenta)", borderBottom: "1px solid var(--magenta)", paddingBottom: "4px", fontSize: "1rem", fontWeight: "500" }}>Discover the Fiesta Way</Link>
              </div>
              <div style={{ position: "relative" }} className="mobile-center">
                <img src="https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886589981_IMGL4288.jpg" alt="Maternity Portrait" width={1200} height={1600} loading="lazy" decoding="async" style={{ width: "100%", height: "auto", borderRadius: "2px", boxShadow: "clamp(10px, 4vw, 20px) clamp(10px, 4vw, 20px) 0 var(--sky-blue-tint)" }} />
              </div>
            </div>
          </div>
        </section>
        {/* Immersive Studio Experience - Parallax Section */}
        <section
          className="relative min-h-screen flex items-center overflow-hidden py-16 md:py-24"
          style={{}}
        >
          <img
            src="https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886936832_IMG_4849-scaled.jpg"
            alt=""
            aria-hidden="true"
            width={1920}
            height={1080}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="container relative z-10 text-white">
            <div style={{ maxWidth: "700px" }}>
              <span style={{
                color: "var(--sky-blue)",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                fontSize: "0.85rem",
                fontWeight: "600",
                display: "block",
                marginBottom: "1.2rem",
                textShadow: "0 2px 4px rgba(0,0,0,0.4)"
              }}>The Sanctuary</span>
              <h2 className="display h2-mobile" style={{
                fontSize: "clamp(2rem, 4vw, 3.4rem)",
                lineHeight: "1.15",
                marginBottom: "1.5rem",
                textShadow: "0 4px 20px rgba(0,0,0,0.5)"
              }}>Where Gravity Meets Grace</h2>
              <p style={{
                fontSize: "1.05rem",
                lineHeight: "1.7",
                opacity: 0.95,
                marginBottom: "2.5rem",
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                maxWidth: "540px"
              }}>
                Our Nairobi studio is a private, fully curated sanctuary designed specifically for the expectant mother. We don't just take photos; we create environments where your maternity story is transformed into timeless art.
              </p>
              <Link to="/experience" data-track="experience_click:home_sanctuary_hero" className="btn btn-primary" style={{
                backgroundColor: "var(--sky-blue)",
                border: "none",
                padding: "0.85rem 2.2rem",
                fontSize: "0.9rem",
                letterSpacing: "0.08em",
                boxShadow: "0 8px 24px rgba(110, 193, 228, 0.3)"
              }}>Discover the Atelier</Link>
            </div>
          </div>
        </section>

        {/* Iconic Sets Section - Gallery Layout */}
        <section className="section-padding" style={{ backgroundColor: "white" }}>
          <div className="container">
            <div className="mobile-center" style={{ marginBottom: "3.5rem" }}>
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>The Environments</span>
              <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)", marginTop: "0.6rem" }}>Curated Studio Masterpieces</h2>
            </div>

            <div className="grid grid-3" style={{ gap: "3.5rem 2.5rem" }}>
              {[
                { name: "The Master Staircase", detail: "Regal architecture for sweeping silhouettes.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1785868048311_IMG_5587-scaled.jpg" },
                { name: "Flower Gardens", detail: "Immersive floral arrangements in full bloom.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1778154974695_IMG_4156-683x1024.jpg" },
                { name: "The Minimalist Loft", detail: "Shadow and light editorial storytelling.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg" },
                { name: "Elegant Swings", detail: "Capture the lightness of being.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1778154967097_34%20-%20Copy.jpg" },
                { name: "Cinematic Boat", detail: "Serene aquatic poetic reflection.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887595087_IMGL5485-scaled.jpg" },
                { name: "The Grand Chandelier", detail: "High-glamour lighting and reflections.", img: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1778151876880_IMG_6287-scaled.jpg" }
              ].map((set, i) => (
                <div key={i} className="group cursor-default">
                  <div className="overflow-hidden aspect-[4/5] mb-8 relative rounded-[2px] shadow-sm">
                    <img src={set.img} alt={set.name} width={1200} height={1500} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-700" />
                    <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                      <span className="text-[10px] uppercase tracking-widest font-bold">SET {i + 1}</span>
                    </div>
                  </div>
                  <h3 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{set.name}</h3>
                  <p style={{ fontSize: "0.95rem", opacity: 0.6, lineHeight: "1.6" }}>{set.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Interactive Transformation - Before & After */}
        <section className="section-padding" style={{ backgroundColor: "white" }}>
          <div className="container">
            <div className="grid grid-2" style={{ gap: "6rem", alignItems: "center" }}>
              <div style={{ order: 2 }}>
                <BeforeAfterSlider
                  beforeImage="https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg"
                  afterImage="https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg"
                />
              </div>
              <div style={{ order: 1 }} className="mobile-center">
                <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>The Art of the Edit</span>
                <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)", margin: "0.6rem 0 1rem" }}>Cinematic Storytelling</h2>
                <p style={{ fontSize: "1.05rem", lineHeight: "1.7", opacity: 0.8, marginBottom: "2rem" }}>
                  We don't just take photos; we craft heirlooms. Our signature "Cinematic Edit" transforms raw moments into breathtaking art, balancing light, shadow, and texture to celebrate your journey in its most beautiful light.
                </p>
                <div style={{ display: "flex", gap: "2rem" }}>
                  <div>
                    <h3 className="display" style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>Natural Skin</h3>
                    <p style={{ fontSize: "0.88rem", opacity: 0.6 }}>Preserving the authentic beauty of motherhood.</p>
                  </div>
                  <div>
                    <h3 className="display" style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>Eternal Glow</h3>
                    <p style={{ fontSize: "0.88rem", opacity: 0.6 }}>Soft, ethereal lighting tailored to your silhouette.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Gown Closet Teaser */}
        <section className="section-padding" style={{ backgroundColor: "white" }}>
          <div className="container">
            <div className="grid grid-2 mobile-gap-12" style={{ gap: "6rem", alignItems: "center" }}>
              <div className="mobile-center">
                <img src={gownImg} alt="Designer Gowns" width={1200} height={1600} loading="lazy" decoding="async" style={{ width: "100%", height: "auto", borderRadius: "2px", boxShadow: "clamp(-20px, -4vw, -10px) clamp(10px, 4vw, 20px) 0 var(--magenta-tint)" }} />
              </div>
              <div className="mobile-center">
                <span style={{ color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "500" }}>Couture Atelier</span>
                <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)", margin: "0.6rem 0 1rem" }}>Originality, Designed.</h2>
                <p style={{ fontSize: "1.05rem", lineHeight: "1.7", opacity: 0.8, marginBottom: "1.5rem" }}>
                  Every gown in our atelier is curated specifically for photography. Expectant mothers select the looks they want to be photographed in during their session. We do not sell retail fashion—we provide an exclusive couture wardrobe that transforms your photoshoot into magazine art.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2.5rem" }}>
                  {["Flying Silk Trains", "Sculpting Bodycon Lace", "Ethereal Tulle Robes", "Included in Sessions"].map(tag => (
                    <span key={tag} style={{ padding: "0.5rem 1rem", backgroundColor: "var(--magenta-tint)", color: "var(--magenta)", fontSize: "0.85rem", borderRadius: "100px", fontWeight: "600" }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <Link to="/maternity-gowns" data-track="gowns_click:home_gowns_section" className="btn btn-magenta" style={{ padding: "0.75rem 1.8rem", fontSize: "0.88rem" }}>Explore Gowns & Looks</Link>
                  <Link to="/what-to-wear-maternity-photoshoot" className="btn btn-outline" style={{ borderColor: "var(--magenta)", color: "var(--magenta)", padding: "0.75rem 1.8rem", fontSize: "0.88rem" }}>What to Wear Guide</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Fiesta Experience Walkthrough (How It Works) */}
        <section className="section-padding" style={{ backgroundColor: "#FBF6F3" }}>
          <div className="container">
            <div className="mobile-center" style={{ marginBottom: "3.5rem" }}>
              <span style={{ color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>How It Works</span>
              <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)", marginTop: "0.6rem" }}>Your maternity shoot journey</h2>
            </div>

            <div className="grid grid-4" style={{ gap: "3rem" }}>
              {[
                { step: "01", title: "Consult & Book", desc: "Choose your session package and secure your date with our Parklands studio concierge." },
                { step: "02", title: "Select Your Looks", desc: "Choose from over 80 designer gowns and trailing silks with personal styling guidance." },
                { step: "03", title: "Pamper & Pose", desc: "Enjoy professional makeup and calm, all-female guided posing on our iconic physical sets." },
                { step: "04", title: "Cherish Forever", desc: "Receive your curated digital gallery of high-end, cinematically retouched heirlooms." }
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

        {/* Planning Guidance Hub Section */}
        <section className="section-padding" style={{ backgroundColor: "white" }}>
          <div className="container">
            <div className="mobile-center" style={{ marginBottom: "3rem", textAlign: "center" }}>
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>
                Education & Preparation
              </span>
              <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", marginTop: "0.6rem", marginBottom: "0.8rem" }}>
                Planning your maternity photoshoot
              </h2>
              <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "1.05rem", opacity: 0.75, lineHeight: 1.6 }}>
                Clear answers to every question you have before stepping into our Nairobi studio.
              </p>
            </div>

            <div className="grid grid-4" style={{ gap: "1.5rem" }}>
              <Link
                to="/when-to-do-maternity-photos"
                className="group p-6 rounded-2xl border border-[#F1E4EC] bg-[#FBF6F3] hover:border-[#660032] transition-all block"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B09345] block mb-2">Stage & Timing</span>
                <h3 className="font-serif text-2xl text-[#2B2320] mb-2 group-hover:text-[#660032] transition-colors">When Is the Best Time?</h3>
                <p className="text-sm text-[#2B2320]/70 leading-relaxed mb-4">
                  Why weeks 28–34 are ideal, 7 vs 8 vs 9 months, and twin pregnancy timing.
                </p>
                <span className="text-xs font-bold text-[#660032] uppercase tracking-wider">Read Guide →</span>
              </Link>

              <Link
                to="/planning-guide"
                className="group p-6 rounded-2xl border border-[#F1E4EC] bg-[#FBF6F3] hover:border-[#660032] transition-all block"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B09345] block mb-2">Checklist</span>
                <h3 className="font-serif text-2xl text-[#2B2320] mb-2 group-hover:text-[#660032] transition-colors">Pre-Shoot Planning</h3>
                <p className="text-sm text-[#2B2320]/70 leading-relaxed mb-4">
                  What to pack in your studio bag, skin prep, hydration, and day-of roadmap.
                </p>
                <span className="text-xs font-bold text-[#660032] uppercase tracking-wider">Read Guide →</span>
              </Link>

              <Link
                to="/what-to-wear-maternity-photoshoot"
                className="group p-6 rounded-2xl border border-[#F1E4EC] bg-[#FBF6F3] hover:border-[#660032] transition-all block"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B09345] block mb-2">Wardrobe & Colors</span>
                <h3 className="font-serif text-2xl text-[#2B2320] mb-2 group-hover:text-[#660032] transition-colors">What to Wear</h3>
                <p className="text-sm text-[#2B2320]/70 leading-relaxed mb-4">
                  Gown silhouettes, undergarments, studio backdrop pairings, and atelier looks.
                </p>
                <span className="text-xs font-bold text-[#660032] uppercase tracking-wider">Read Guide →</span>
              </Link>

              <Link
                to="/family-maternity-photoshoot"
                className="group p-6 rounded-2xl border border-[#F1E4EC] bg-[#FBF6F3] hover:border-[#660032] transition-all block"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B09345] block mb-2">Partner & Siblings</span>
                <h3 className="font-serif text-2xl text-[#2B2320] mb-2 group-hover:text-[#660032] transition-colors">Family Shoots</h3>
                <p className="text-sm text-[#2B2320]/70 leading-relaxed mb-4">
                  Husband styling, toddler participation, and stress-free sequencing.
                </p>
                <span className="text-xs font-bold text-[#660032] uppercase tracking-wider">Read Guide →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Latest from the Studio - Masonry Gallery */}
        <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
          <div className="container">
            <div className="grid grid-2 mobile-gap-8" style={{ gap: "4rem", alignItems: "flex-end", marginBottom: "3.5rem" }}>
              <div className="mobile-center">
                <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>Live from the Sanctuary</span>
                <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", marginTop: "0.6rem" }}>Recent Masterpieces</h2>
              </div>
              <p style={{ fontSize: "1.05rem", opacity: 0.7, maxWidth: "400px" }}>
                Explore the latest captures from our Nairobi studio. Every frame is a testament to the beauty of life in bloom.
              </p>
            </div>

            <div className="masonry">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="masonry-item w-full h-64 mb-8" />
                ))
              ) : (
                assets.map((asset, i) => (
                  <div key={asset.id} className="masonry-item group relative overflow-hidden">
                    <MasonryImage
                      src={asset.url}
                      alt="Studio Masterpiece"
                      className="w-full h-auto object-cover"
                      priority={i < 3}
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
          <div className="container" style={{ maxWidth: "860px" }}>
            <div className="mobile-center" style={{ marginBottom: "2.5rem", textAlign: "center" }}>
              <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>
                Answers to Your Questions
              </span>
              <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", marginTop: "0.4rem" }}>Common Inquiries</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "Do I need to buy my own gown or are outfits provided?", a: "You do not need to buy gowns! Fiesta House provides complimentary access to our in-house atelier of over 80 couture maternity gowns, trailing silks, and lace robes. You select the looks you wish to wear for your session." },
                { q: "When is the best time for my maternity photoshoot?", a: "We typically recommend booking your session between 28 and 34 weeks of pregnancy, when your bump is beautifully defined but you still have comfortable energy." },
                { q: "Can my husband, partner, and children join?", a: "Absolutely. We encourage partner and family inclusion. All our core packages allow partners and siblings to be part of the session at no additional cost." },
                { q: "I have never posed before. Will you guide me?", a: "Yes! 95% of our expectant mothers have never posed in a studio. Our all-women photography team guides every single finger placement, chin angle, and posture with warmth and care." },
                { q: "How long does it take to receive my images?", a: "Soft copy retouched images are delivered via a private online gallery within 7 to 10 working days. Print heirlooms follow shortly after." }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "0.5rem 0" }}>
                  <AccordionTrigger className="display" style={{ fontSize: "1.25rem", fontWeight: "400", textAlign: "left" }}>
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent style={{ fontSize: "1rem", opacity: 0.8, lineHeight: "1.7", paddingTop: "0.6rem" }}>
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link to="/faq" className="btn btn-outline" style={{ borderColor: "var(--magenta)", color: "var(--magenta)", fontWeight: 600, padding: "0.7rem 1.8rem", fontSize: "0.88rem" }}>
                View All Frequently Asked Questions →
              </Link>
            </div>
          </div>
        </section>

        {/* Visit the Sanctuary - Location & Contact */}
        <section className="section-padding" style={{ backgroundColor: "var(--bg)" }}>
          <div className="container">
            <div className="grid grid-2 mobile-gap-12" style={{ gap: "6rem" }}>
              <div className="mobile-center">
                <span style={{ color: "var(--sky-blue)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>Visit the Sanctuary</span>
                <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", marginTop: "0.6rem", marginBottom: "2.5rem" }}>Where to find us</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div style={{ color: "var(--sky-blue)" }}><MapPin size={24} /></div>
                    <div>
                      <h3 className="display" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Diamond Plaza II</h3>
                      <p style={{ opacity: 0.7 }}>4th Floor, Parklands, Nairobi, Kenya</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div style={{ color: "var(--sky-blue)" }}><Clock size={24} /></div>
                    <div>
                      <h3 className="display" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Studio Hours</h3>
                      <p style={{ opacity: 0.7 }}>Tuesday - Sunday: 9:00 AM - 6:00 PM<br />Mondays: Closed for Studio Maintenance</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div style={{ color: "var(--sky-blue)" }}><Phone size={24} /></div>
                    <div>
                      <h3 className="display" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Direct Line</h3>
                      <p style={{ opacity: 0.7 }}>+254 720 111 928</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "4rem", display: "flex", gap: "1.5rem" }}>
                  <a href="https://www.instagram.com/fiestahousematernity/" target="_blank" rel="noreferrer" aria-label="Visit Fiesta House Instagram" data-track="social_click:home_instagram" style={{ color: "var(--sky-blue)" }}><Instagram /></a>
                  <a href="https://www.facebook.com/fiestahousematernity" target="_blank" rel="noreferrer" aria-label="Visit Fiesta House Facebook" data-track="social_click:home_facebook" style={{ color: "var(--sky-blue)" }}><Facebook /></a>
                </div>
              </div>

              <div style={{ height: "100%", minHeight: "400px", position: "relative", overflow: "hidden", borderRadius: "2px" }}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}>
                  <div style={{
                    backgroundColor: "white",
                    padding: "1.5rem 2rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    borderRadius: "2px",
                    textAlign: "center"
                  }}>
                    <div className="display" style={{ fontSize: "1.2rem", color: "var(--magenta)" }}>FIESTA HOUSE</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.5rem" }}>Diamond Plaza II, Nairobi</div>
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noreferrer"
                      data-track="location_click:home_get_directions"
                      style={{
                        display: "block",
                        marginTop: "1.5rem",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--sky-blue)",
                        borderBottom: "1px solid var(--sky-blue)"
                      }}
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Testimonials */}
        <section className="section-padding" style={{ backgroundColor: "#FBF6F3" }}>
          <div className="container">
            <div className="grid grid-2 mobile-gap-12" style={{ gap: "6rem" }}>
              {[
                {
                  text: "I have never felt more beautiful in my life. The gowns, the makeup, the way they made me feel - it was the most special day of my pregnancy.",
                  author: "Wanjiru K."
                },
                {
                  text: "Worth every shilling. The team handled everything. I just walked in, and three hours later I had photos I'll treasure forever.",
                  author: "Amina O."
                }
              ].map((t, i) => (
                <div key={i} style={{ fontStyle: "italic", position: "relative", padding: "2rem" }}>
                  <span style={{ position: "absolute", top: 0, left: 0, fontSize: "4rem", color: "rgba(102, 0, 50, 0.2)", zIndex: 0 }}>"</span>
                  <p style={{ fontSize: "1.8rem", lineHeight: "1.4", marginBottom: "1.5rem", fontFamily: "var(--font-display)", position: "relative", zIndex: 1, color: "var(--magenta)" }}>
                    {t.text}
                  </p>
                  <cite style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: "600", color: "var(--sky-blue)" }}>
                    - {t.author}
                  </cite>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gift of Timelessness - Gift Vouchers */}
        <section className="section-padding" style={{ backgroundColor: "var(--magenta-tint)" }}>
          <div className="container">
            <div className="grid grid-2 mobile-gap-12" style={{ gap: "4rem", alignItems: "center" }}>
              <div className="mobile-center">
                <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Baby Shower & Beyond</span>
                <h2 className="display h2-mobile" style={{ fontSize: "3.5rem", marginTop: "1rem" }}>The Gift of Timelessness</h2>
                <p style={{ fontSize: "1.2rem", opacity: 0.8, marginTop: "1.5rem" }}>
                  Give the expectant mother in your life an experience she will never forget. Our luxury gift vouchers are the perfect way to celebrate a new chapter with art that lasts a lifetime.
                </p>
                <div style={{ marginTop: "2.5rem" }}>
                  <Link to="/shop" className="btn btn-magenta" data-track="voucher_click:home_gift_section">Purchase a Voucher</Link>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{
                  aspectRatio: "16/10",
                  backgroundColor: "white",
                  borderRadius: "2px",
                  boxShadow: "0 20px 40px rgba(184,79,160,0.15)",
                  padding: "3rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  border: "1px solid var(--magenta-tint)"
                }}>
                  <div className="display" style={{ fontSize: "2rem", color: "var(--magenta)", marginBottom: "1rem" }}>FIESTA HOUSE</div>
                  <div style={{ width: "40px", height: "1px", backgroundColor: "var(--magenta)", marginBottom: "2rem" }}></div>
                  <div className="display" style={{ fontSize: "3rem", lineHeight: "1" }}>Luxury Maternity <br /> Experience</div>
                  <div style={{ marginTop: "auto", fontSize: "0.8rem", opacity: 0.5, letterSpacing: "0.1em" }}>VALID AT OUR NAIROBI SANCTUARY</div>
                </div>
                {/* Decorative elements */}
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", backgroundColor: "var(--magenta)", opacity: 0.1, borderRadius: "50%" }}></div>
              </div>
            </div>
          </div>
        </section>

                {/* Latest Stories Carousel */}
        {recentPosts.length > 0 && (
          <section className="section-padding" style={{ backgroundColor: "white" }}>
            <div className="container">
              <div className="mobile-center" style={{ marginBottom: "3rem" }}>
                <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.9rem", fontWeight: "600" }}>Fiesta Chronicles</span>
                <h2 className="display h2-mobile" style={{ fontSize: "3.5rem", marginTop: "1rem" }}>Stories from the Sanctuary</h2>
              </div>

              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {recentPosts.map((post) => (
                    <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3">
                      <Link to={`/blog/${post.slug}`} className="group block h-full">
                        <div style={{ border: "1px solid var(--sky-blue-tint)", background: "#FFFFFF", height: "100%" }}>
                          {post.cover_image_url ? (
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              width={1200}
                              height={900}
                              loading="lazy"
                              decoding="async"
                              style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "100%", aspectRatio: "16 / 10", background: "#FBF6F3" }} />
                          )}
                          <div style={{ padding: "1.2rem" }}>
                            <h3 className="display" style={{ fontSize: "1.6rem", marginBottom: "0.6rem", color: "var(--magenta)" }}>
                              {post.title}
                            </h3>
                            <p style={{ fontSize: "0.9rem", color: "rgba(43,35,32,0.8)", lineHeight: "1.6", marginBottom: "1rem" }}>
                              {post.excerpt || "Explore this story from the Fiesta House sanctuary."}
                            </p>
                            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--sky-blue)", fontWeight: 600 }}>
                              Read Story
                            </span>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </section>
        )}

        {/* Instagram Feed Section */}
        <InstagramFeed />

        {/* Final CTA */}
        <section className="home-final-cta" style={{
          backgroundColor: "white",
          color: "var(--dark)",
          padding: "5.5rem 0",
          position: "relative",
          overflow: "hidden",
          borderTop: "1px solid rgba(0,0,0,0.05)"
        }}>
          {/* Subtle background accent */}
          <div style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(184, 79, 160, 0.05) 0%, transparent 70%)",
            zIndex: 0
          }} />

          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "3px",
            background: "linear-gradient(90deg, var(--sky-blue), var(--magenta), var(--sky-blue))",
            backgroundSize: "200% 100%",
            animation: "gradientShift 6s linear infinite",
            opacity: 0.8
          }} />

          <div className="container" style={{ position: "relative", zIndex: 1 }}>
            <div className="grid grid-2 mobile-gap-8 home-final-cta-grid" style={{ alignItems: "center", gap: "2.5rem" }}>
              <div className="mobile-center home-final-cta-copy" style={{ textAlign: "left" }}>
                <span className="home-final-cta-kicker" style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.3em", fontSize: "0.8rem", fontWeight: "600", display: "block", marginBottom: "1rem" }}>Your Journey Starts Here</span>
                <h2 className="display h2-mobile home-final-cta-title" style={{ fontSize: "clamp(2rem, 5vw, 2.5rem)", marginBottom: "1rem" }}>Ready to own the frame?</h2>
                <p className="home-final-cta-text" style={{ fontSize: "1rem", opacity: 0.6, maxWidth: "500px", margin: 0 }}>
                  Experience the best maternity photoshoot in Kenya. Secure your session at our Diamond Plaza sanctuary today.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", flexWrap: "wrap" }} className="mobile-center justify-center home-final-cta-actions">
                <Link to="/contact" className="btn btn-magenta home-final-cta-btn" data-track="booking_click:home_final_cta" style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>Book your session</Link>
                <a href="https://wa.me/254720111928" className="btn btn-whatsapp home-final-cta-btn" data-track="whatsapp_click:home_final_cta" style={{ padding: "1rem 2rem", fontSize: "0.85rem" }}>WhatsApp Us</a>
              </div>
            </div>
          </div>


        </section>
        <FloatingScrollToTop />
      </Layout>
    </>
  );
};

export default Index;


