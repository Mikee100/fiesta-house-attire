import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Sparkles,
  Camera,
  Heart,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FEATURED_IMAGES = {
  hero: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886589981_IMGL4288.jpg",
  sets: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg",
  wardrobe: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887595087_IMGL5485-scaled.jpg",
  family: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg",
};

const STUDIO_SETS = [
  {
    name: "The Cinematic Boat Set",
    description: "An ethereal aquatic-inspired set with floral accents and soft reflective lighting, creating dreamlike editorial portraits found nowhere else in East Africa.",
    tag: "Signature Set",
  },
  {
    name: "The Regal Master Staircase",
    description: "A sweeping architectural set that provides grand trailing gown drama, cascading silks, and regal royalty-level maternity portraits.",
    tag: "High Drama",
  },
  {
    name: "The Living Flower Sanctuary",
    description: "An immersive botanical wonderland with lush floral installations, soft natural glow, and romantic feminine texture.",
    tag: "Romantic Elegance",
  },
  {
    name: "The Celestial Swing",
    description: "A suspended botanical swing that produces whimsical, weightless frames accentuating the beauty of your pregnancy curves.",
    tag: "Whimsical",
  },
  {
    name: "Minimalist Editorial Chandeliers",
    description: "Clean black or ivory backgrounds framed by crystal chandeliers and focused studio spotlighting for Vogue-style contrast and bump sculpting.",
    tag: "Clean Editorial",
  },
];

const FAQS = [
  {
    q: "Where is Fiesta House located in Nairobi?",
    a: "Our private maternity studio is located at Diamond Plaza II, 4th Floor, in Parklands, Nairobi. The studio is safe, climate-controlled, features private dressing suites, and has ample secure parking with elevator access.",
  },
  {
    q: "Is Fiesta House a gown retail shop or a photoshoot studio?",
    a: "Fiesta House is a dedicated luxury maternity photography and styling studio. The term 'gowns' refers to our curated in-house couture wardrobe of over 80 designer gowns and trailing silks. Expectant mothers select their favorite looks to wear during their photoshoot session. We do not sell off-the-rack clothing.",
  },
  {
    q: "Do I need modeling experience to take beautiful maternity photos?",
    a: "Not at all. Over 90% of our clients have never posed professionally. Our all-women photography and styling team gently directs every single angle, hand placement, chin tilt, and gown flutter so you feel completely at ease and look breathtaking.",
  },
  {
    q: "Are professional hair and makeup included in the experience?",
    a: "Yes! All signature Fiesta House maternity packages include professional in-studio makeup artistry tailored specifically for high-definition photography lighting, ensuring a radiant, flawless glow.",
  },
  {
    q: "Can my husband, partner, or older children join the shoot?",
    a: "Absolutely. We warmly welcome and encourage partners and siblings. We sequence the session so you get your showstopping solo goddess portraits as well as heartwarming, connected family portraits without fatigue.",
  },
];

export default function MaternityPhotoshootNairobi() {
  return (
    <Layout
      title="Maternity Photoshoot Nairobi | Luxury Pregnancy Photography | Fiesta House"
      description="Experience Nairobi's premier luxury maternity photoshoot at Fiesta House. Iconic studio sets, designer gowns included, professional makeup, and an all-women team in Parklands."
      keywords="maternity photoshoot nairobi, pregnancy photography kenya, best maternity studio nairobi, maternity photoshoot diamond plaza, luxury maternity photographer nairobi"
    >
      {/* Schema.org Rich Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Maternity Photography Experience",
          "name": "Luxury Maternity Photoshoot in Nairobi",
          "provider": {
            "@type": "PhotographyBusiness",
            "name": "Fiesta House Attire",
            "alternateName": "Fiesta House Maternity",
            "image": FEATURED_IMAGES.hero,
            "telephone": "+254720111928",
            "priceRange": "KES 15,000 – KES 80,000",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Diamond Plaza II, 4th Floor, Parklands",
              "addressLocality": "Nairobi",
              "addressCountry": "KE"
            }
          },
          "areaServed": {
            "@type": "City",
            "name": "Nairobi"
          },
          "description": "Nairobi's premier maternity photography sanctuary featuring custom studio sets, complimentary designer gowns for your session, professional makeup, and artistic posing guidance."
        })}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map((faq) => ({
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
      <header className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#2B0E1E] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25 mix-blend-overlay">
          <img
            src={FEATURED_IMAGES.hero}
            alt="Luxury maternity photoshoot in Nairobi studio"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="container relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#B09345] text-xs uppercase tracking-widest font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Nairobi's Premier Maternity Photography Experience
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-tight mb-6">
            Where Motherhood Becomes <span className="italic font-normal text-[#F1E4EC]">Timeless Art</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            A private studio sanctuary designed exclusively for expectant mothers in Nairobi. Step into bespoke physical sets, select from our curated couture gown atelier, and let our all-women team craft an unforgettable celebration of your pregnancy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#660032] hover:bg-[#80003f] text-white px-8 py-6 rounded-full text-base font-medium shadow-xl hover:shadow-2xl transition-all"
            >
              <Link to="/contact">
                Book Your Maternity Shoot
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 px-8 py-6 rounded-full text-base"
            >
              <Link to="/portfolio">Explore Our Portfolio</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Direct Answer Framework Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="bg-[#FBF6F3] border border-[#F1E4EC] rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="max-w-3xl">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
                Direct Answer for Expectant Mothers
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-2 mb-6">
                Looking for the Best Maternity Photoshoot in Nairobi?
              </h2>
              <p className="text-base md:text-lg text-[#2B2320]/80 leading-relaxed mb-6">
                Planning a maternity photoshoot can feel overwhelming when deciding where to go, what to wear, and how to pose. The best maternity photography experience in Nairobi combines three essential elements: <strong>a private, temperature-controlled studio environment</strong>, <strong>complimentary access to luxury maternity couture gowns</strong>, and <strong>empathetic, female-led posing guidance</strong>.
              </p>
              <p className="text-base md:text-lg text-[#2B2320]/80 leading-relaxed mb-8">
                At <strong>Fiesta House Attire</strong>, located at Diamond Plaza II in Parklands, we eliminate the stress of pregnancy photography. You do not need to hunt for dress rentals or hire outside stylists. We provide an all-inclusive sanctuary where your wardrobe, makeup, sets, and posing are seamlessly handled under one roof.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#F1E4EC]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#660032]/10 text-[#660032] flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-[#2B2320] text-sm">Couture Wardrobe</h4>
                    <p className="text-xs text-[#2B2320]/60">80+ designer gowns</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#660032]/10 text-[#660032] flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-[#2B2320] text-sm">Private Studio</h4>
                    <p className="text-xs text-[#2B2320]/60">Diamond Plaza II, Parklands</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#660032]/10 text-[#660032] flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-[#2B2320] text-sm">All-Women Team</h4>
                    <p className="text-xs text-[#2B2320]/60">Complete comfort & privacy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 5 Iconic Studio Sets */}
      <section className="py-20 bg-[#FBF6F3]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#660032] uppercase tracking-widest text-xs font-semibold">
              Exclusive Environments
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-[#2B2320] mt-2 mb-4">
              Iconic Sets Crafted for Pregnancy Portraits
            </h2>
            <p className="text-slate-600 text-base md:text-lg">
              Unlike ordinary studios with flat colored paper backdrops, Fiesta House features permanent, hand-crafted immersive sets built specifically to complement maternal silhouettes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STUDIO_SETS.map((set, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 border border-[#F1E4EC] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#F1E4EC] text-[#660032] mb-4">
                    {set.tag}
                  </span>
                  <h3 className="font-serif text-2xl text-[#2B2320] mb-3">{set.name}</h3>
                  <p className="text-[#2B2320]/75 text-sm leading-relaxed mb-6">
                    {set.description}
                  </p>
                </div>
                <Link
                  to="/portfolio"
                  className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-[#660032] hover:text-[#B09345] transition-colors"
                >
                  View photographs on this set <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            ))}

            {/* Custom Concept Callout Card */}
            <div className="bg-[#2B0E1E] text-white rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-[#B09345] mb-4">
                  Bespoke Lighting
                </span>
                <h3 className="font-serif text-2xl text-white mb-3">Custom Lighting & Posing</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Every mother's journey and style is unique. We tailor lighting from soft glowing Rembrandt flares to deep editorial shadow contrasts that sculpt and celebrate your pregnancy.
                </p>
              </div>
              <Link
                to="/maternity-photoshoot-ideas"
                className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-[#B09345] hover:text-white transition-colors"
              >
                Explore photoshoot styles <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Explaining the Role of Gowns */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={FEATURED_IMAGES.wardrobe}
                alt="Curated couture maternity gown collection at Fiesta House"
                className="w-full h-full object-cover max-h-[550px]"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/40">
                <p className="text-xs uppercase tracking-wider text-[#660032] font-bold">The Fiesta Atelier</p>
                <p className="text-xs text-[#2B2320]/80">Gowns are provided exclusively as part of your photography experience.</p>
              </div>
            </div>

            <div>
              <span className="text-[#660032] uppercase tracking-widest text-xs font-semibold">
                Wardrobe Clarity & Styling
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-[#2B2320] mt-2 mb-6">
                You Don't Need to Buy a Dress. Choose from Our Atelier.
              </h2>
              <p className="text-base text-[#2B2320]/80 leading-relaxed mb-4">
                One of the biggest concerns for expectant mothers is finding a gown that fits comfortably, flatters the baby bump, and flows beautifully on camera. Buying a bespoke maternity gown for a single day is expensive and unnecessary.
              </p>
              <p className="text-base text-[#2B2320]/80 leading-relaxed mb-6">
                At Fiesta House, our maternity photography packages include full access to our curated wardrobe of couture maternity gowns, trailing silks, sculptural tulles, and hand-embroidered laces. During your session, you select the looks you want to be photographed in, guided by our in-house stylist.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#660032] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#2B2320]/80">Sizes tailored with flexible corset backs and adjustable stretch silks.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#660032] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#2B2320]/80">Colors curated specifically for rich melanin tones and studio lighting.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#660032] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#2B2320]/80">Multiple outfit changes included depending on your chosen session package.</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild className="bg-[#660032] text-white hover:bg-[#80003f] rounded-full">
                  <Link to="/maternity-gowns">Explore Available Looks</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#660032] text-[#660032] hover:bg-[#660032]/5 rounded-full">
                  <Link to="/what-to-wear-maternity-photoshoot">Read What to Wear Guide</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking Journey Cards */}
      <section className="py-16 bg-[#FBF6F3] border-y border-[#F1E4EC]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="font-serif text-2xl md:text-3xl text-[#2B2320]">
              Explore the Maternal Planning Journey
            </h3>
            <p className="text-sm text-[#2B2320]/70 mt-1">
              Authoritative guides to help you plan every detail before stepping into the studio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/when-to-do-maternity-photos"
              className="p-6 bg-white rounded-2xl border border-[#F1E4EC] hover:border-[#660032] transition-colors group"
            >
              <Clock className="w-6 h-6 text-[#660032] mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">When to Book</h4>
              <p className="text-xs text-[#2B2320]/70">Ideal weeks of pregnancy (28–34 weeks) and booking timelines.</p>
            </Link>

            <Link
              to="/planning-guide"
              className="p-6 bg-white rounded-2xl border border-[#F1E4EC] hover:border-[#660032] transition-colors group"
            >
              <CheckCircle2 className="w-6 h-6 text-[#660032] mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">Planning Guide</h4>
              <p className="text-xs text-[#2B2320]/70">What to pack, skin prep, hydration, and day-of checklist.</p>
            </Link>

            <Link
              to="/family-maternity-photoshoot"
              className="p-6 bg-white rounded-2xl border border-[#F1E4EC] hover:border-[#660032] transition-colors group"
            >
              <Heart className="w-6 h-6 text-[#660032] mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">Family & Partner</h4>
              <p className="text-xs text-[#2B2320]/70">Partner styling, sibling inclusion, and couple poses.</p>
            </Link>

            <Link
              to="/pricing"
              className="p-6 bg-white rounded-2xl border border-[#F1E4EC] hover:border-[#660032] transition-colors group"
            >
              <Sparkles className="w-6 h-6 text-[#660032] mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">Studio Packages</h4>
              <p className="text-xs text-[#2B2320]/70">Transparent pricing, look allowances, and digital deliveries.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#660032] uppercase tracking-widest text-xs font-semibold">
              Frequently Asked Questions
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-2 mb-3">
              Answers for Expectant Mothers
            </h2>
            <p className="text-sm text-slate-600">
              Clear answers to the most common questions asked before booking a maternity photoshoot in Nairobi.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQS.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border border-[#F1E4EC] rounded-2xl px-6 py-2 bg-[#FBF6F3]"
              >
                <AccordionTrigger className="text-left font-serif text-lg text-[#2B2320] hover:text-[#660032]">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#2B2320]/80 leading-relaxed pt-2 pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <Link
              to="/faq"
              className="inline-flex items-center text-sm font-semibold text-[#660032] hover:text-[#B09345]"
            >
              View the Complete Maternity Photoshoot FAQ Hub <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final Conversion CTA */}
      <section className="py-20 bg-[#2B0E1E] text-white text-center">
        <div className="container max-w-4xl mx-auto px-4">
          <span className="text-[#B09345] uppercase tracking-widest text-xs font-semibold">
            Limited Studio Availability
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light mt-3 mb-6">
            Reserve Your Maternity Session in Nairobi
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg mb-8 font-light leading-relaxed">
            We book a limited number of expectant mothers each week to maintain the personalized privacy and luxury care every mother deserves. Connect with our team to check available dates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#660032] hover:bg-[#80003f] text-white px-8 py-6 rounded-full text-base font-medium shadow-xl"
            >
              <Link to="/contact">Book via WhatsApp or Online</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 rounded-full text-base"
            >
              <Link to="/pricing">View Session Rates & Packages</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
