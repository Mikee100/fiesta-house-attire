import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Shirt,
  CheckCircle2,
  Heart,
  Eye,
  ArrowRight,
  Palette,
  ShieldCheck,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const GOWN_SILHOUETTES = [
  {
    title: "Flowing Trailing Silks & Flying Trains",
    bestFor: "Grand, cinematic drama & motion",
    description:
      "Lightweight, glossy silk fabrics with long cascading trains that catch the studio wind machine. Perfect for our iconic Master Staircase and Boat sets, creating breathtaking sweeps of color and movement.",
  },
  {
    title: "Fitted Mermaid & Bodycon Stretch Gowns",
    bestFor: "Sculpting the silhouette & bump definition",
    description:
      "Crafted from premium stretch modal, jersey, and corded lace that hug maternal curves precisely. These gowns accentuate the waistline curve above the bump and show the true shape of pregnancy.",
  },
  {
    title: "Sheer Organza & Sculptural Tulle",
    bestFor: "Ethereal, high-fashion editorial magic",
    description:
      "Ruffled tiers, cloud-like volume, and delicate transparency. When backlit in our studio, sheer tulle glows around the maternal contour while maintaining tasteful modesty with nude underlays.",
  },
  {
    title: "Botanical Lace & Boho Romantic Robes",
    bestFor: "Intimate, warm, and natural connections",
    description:
      "Intricate floral laces, bell sleeves, and open-front robes. Excellent for couple photos with your partner and whimsical frames on the Celestial Swing.",
  },
];

const COLOR_GUIDELINES = [
  {
    backdrop: "Black / Dark Editorial Backgrounds",
    recommendations:
      "Rich jewel tones (Deep Burgundy, Emerald Green, Royal Sapphire Blue, Champagne Gold) or stark contrasting Pure Ivory. Avoid dull mid-tone grays that blend into shadows.",
  },
  {
    backdrop: "White / Ivory / Bright Sets",
    recommendations:
      "Soft pastels, Blush Pink, Warm Caramel, Dusty Rose, Champagne, or a bold monochromatic Black gown for striking graphic contrast.",
  },
  {
    backdrop: "Floral Sanctuary & Living Sets",
    recommendations:
      "Earth tones, Forest Green, Tuscan Olive, Sage, Soft Coral, and Ivory lace that organically complement real floral textures.",
  },
];

const FAQS = [
  {
    q: "Do I need to buy my own maternity dress for the photoshoot?",
    a: "No! You do not need to buy or rent a gown separately. Fiesta House maintains an exclusive in-house couture atelier of over 80 designer maternity gowns, trailing silks, and robes. Access to these looks is complimentary with your session package.",
  },
  {
    q: "How many outfits can I wear during my session?",
    a: "Depending on your package, most sessions include between 2 and 4 distinct look changes. This lets you capture different aesthetic styles-such as one dramatic trailing silk look, one sleek bodycon portrait, and one romantic lace look with your partner.",
  },
  {
    q: "What should I wear underneath the maternity gowns?",
    a: "We recommend seamless nude/tan undergarments. A seamless nude thong or high-cut brief and a strapless nude bra or stick-on silicone covers work best across all dress cuts.",
  },
  {
    q: "Can I bring a personal outfit of my own?",
    a: "Yes! While clients adore our atelier gowns, you are always welcome to bring a sentimental personal piece, such as a traditional African Ankara wrap, custom silk robe, or your partner's oversized white linen shirt for relaxed couple shots.",
  },
  {
    q: "What sizes do Fiesta House maternity gowns fit?",
    a: "Our gowns are custom-designed with stretch fabrics, corset tie-backs, and adjustable bodices specifically created to fit sizes XS through 3XL comfortably and flatteringly.",
  },
];

export default function WhatToWearGuide() {
  return (
    <Layout
      title="What to Wear for a Maternity Photoshoot | Fiesta House Nairobi"
      description="The definitive styling guide for maternity photoshoot outfits. Discover dress silhouettes, best colors, undergarment tips, and explore Fiesta House's in-house couture atelier."
      keywords="what to wear maternity photoshoot, maternity photoshoot dresses, best colors for pregnancy photos, maternity gowns nairobi, pregnancy photoshoot styling"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "What to Wear for a Maternity Photoshoot: The Complete Styling Guide",
          "description": "Comprehensive guidance on maternity gown silhouettes, color psychology, and styling for professional studio portraits.",
          "author": {
            "@type": "Organization",
            "name": "Fiesta House Attire"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Fiesta House Maternity",
            "url": "https://www.fiestahousematernity.com"
          }
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

      {/* Header */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-24 bg-[#FBF6F3] border-b border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#660032] mb-3 inline-block">
            Maternity Styling & Wardrobe Guide
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#2B2320] leading-tight mb-6">
            What to Wear for Your Maternity Photoshoot
          </h1>
          <p className="text-base sm:text-lg text-[#2B2320]/80 leading-relaxed font-light max-w-2xl mx-auto">
            Your wardrobe transforms pregnancy portraits from ordinary snapshots into timeless editorial art. Discover how to choose flattering silhouettes, colors, and textures.
          </p>
        </div>
      </header>

      {/* Important Business Understanding Callout */}
      <section className="py-12 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-[#2B0E1E] text-white p-8 md:p-10 rounded-3xl shadow-md">
            <div className="flex items-center gap-3 text-[#B09345] mb-3">
              <span className="text-xs uppercase tracking-widest font-bold">The Fiesta House Advantage</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-white mb-3">
              Complimentary Access to Over 80 Designer Gowns
            </h2>
            <p className="text-white/85 text-sm md:text-base leading-relaxed mb-6 font-light">
              Unlike generic photographers who ask you to bring your own clothes, <strong>Fiesta House maintains a private atelier of bespoke maternity gowns</strong> right inside our Nairobi studio. When you book a maternity session with us, gown selection is included. You select the looks you want to be photographed in, tailored to your exact shape by our in-house stylist.
            </p>
            <Button asChild className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full px-6">
              <Link to="/maternity-gowns">
                Browse Available Gown Looks <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Silhouettes Breakdown */}
      <section className="py-16 bg-[#FBF6F3]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Silhouettes & Cuts
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              The 4 Best Dress Styles for Photography
            </h2>
            <p className="text-sm text-slate-600">
              Each silhouette tells a different visual story and highlights your pregnancy curves uniquely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {GOWN_SILHOUETTES.map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-[#F1E4EC] shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#B09345] uppercase tracking-wider block mb-2">
                    {item.bestFor}
                  </span>
                  <h3 className="font-serif text-2xl text-[#2B2320] mb-3">{item.title}</h3>
                  <p className="text-sm text-[#2B2320]/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Color Guide & Studio Backdrops */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Color Harmonies
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              Choosing Colors for Studio Lighting
            </h2>
            <p className="text-sm text-slate-600">
              How gown colors interact with our dark, light, and botanical studio sets.
            </p>
          </div>

          <div className="space-y-6">
            {COLOR_GUIDELINES.map((item, idx) => (
              <div key={idx} className="p-6 md:p-8 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC]">
                <div className="flex items-center gap-3 mb-2 text-[#660032]">
                  <Palette className="w-5 h-5" />
                  <h3 className="font-serif text-xl font-medium">{item.backdrop}</h3>
                </div>
                <p className="text-sm text-[#2B2320]/80 leading-relaxed pl-8">
                  {item.recommendations}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Undergarments Checklist */}
      <section className="py-16 bg-[#FBF6F3] border-t border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#F1E4EC] shadow-sm">
            <h2 className="font-serif text-2xl md:text-3xl text-[#2B2320] mb-4">
              What to Wear Underneath Your Gowns
            </h2>
            <p className="text-sm md:text-base text-[#2B2320]/80 leading-relaxed mb-6">
              The secret to seamless, magazine-quality pregnancy portraits is what happens under the dress. Invisible foundations prevent harsh lines across your bump:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#660032] shrink-0 mt-0.5" />
                <span className="text-sm text-[#2B2320]/85"><strong>Nude Seamless Thong or Briefs:</strong> Matches your natural skin tone to avoid showing through lighter sheer fabrics.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#660032] shrink-0 mt-0.5" />
                <span className="text-sm text-[#2B2320]/85"><strong>Strapless Nude Bra / Pasties:</strong> Gives support without shoulder strap marks on off-shoulder gowns.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#660032] shrink-0 mt-0.5" />
                <span className="text-sm text-[#2B2320]/85"><strong>Loose Morning Attire:</strong> Avoid tight socks, bras, or waistbands 2 hours prior to arrival.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#660032] shrink-0 mt-0.5" />
                <span className="text-sm text-[#2B2320]/85"><strong>Comfort Slip-Ons:</strong> Flat slippers to comfortably walk between set changes.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mb-2">
              Wardrobe & Styling FAQs
            </h2>
            <p className="text-sm text-slate-600">
              Quick answers about dresses, sizes, and gown selections.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {FAQS.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="border border-[#F1E4EC] rounded-2xl px-6 py-2 bg-[#FBF6F3]"
              >
                <AccordionTrigger className="text-left font-serif text-lg text-[#2B2320] hover:text-[#660032]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#2B2320]/80 leading-relaxed pt-2 pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#2B0E1E] text-white text-center">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
            Discover Your Favorite Maternity Looks
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-lg mx-auto">
            Explore our curated gown gallery or book your session to begin collaborating with our personal stylist.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full px-8 py-6">
              <Link to="/maternity-gowns">Explore The Atelier Gowns</Link>
            </Button>
            <Link
              to="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "48px",
                padding: "0.85rem 2rem",
                borderRadius: "999px",
                backgroundColor: "#FFFFFF",
                color: "#2B0E1E",
                border: "1px solid rgba(255,255,255,0.9)",
                fontSize: "0.92rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
              }}
            >
              Book Your Session
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}