import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Sparkles,
  Camera,
  Heart,
  Eye,
  ArrowRight,
  Layers,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const STYLES = [
  {
    title: "Cinematic & High Drama",
    aesthetic: "Grand, editorial, magazine-cover storytelling",
    features: "Flowing silks with air-assisted trains, architectural lighting, deep shadows, and iconic physical sets like our Master Staircase and Cinematic Boat set.",
    mood: "Powerful, regal, goddess-like",
  },
  {
    title: "Soft Romantic & Ethereal Glow",
    aesthetic: "Gentle feminine warmth, delicate textures, floral blooms",
    features: "Immersive flower garden sets, suspended floral swings, sheer pastel tulles, and backlit rim lighting that creates a halo around maternal hair and belly.",
    mood: "Intimate, dreamy, tender",
  },
  {
    title: "Vogue-Inspired Minimalist Editorial",
    aesthetic: "Clean lines, stark contrast, bump-focused sculpting",
    features: "Pure solid black or seamless ivory backdrops, tailored bodycon stretch dresses, crisp crystal chandeliers, and precision shadow-sculpting.",
    mood: "Sophisticated, timeless, modern",
  },
  {
    title: "Warm Family & Couple Connection",
    aesthetic: "Unposed emotional connection with your partner & children",
    features: "Gentle embraces, whispered laughter, hands gently resting on the belly together, and candid joyful moments framed in soft studio light.",
    mood: "Loving, grounded, connected",
  },
];

const POSING_TIPS = [
  {
    title: "The 45-Degree Angle S-Curve",
    description: "Turning your hips 45 degrees toward the camera while resting weight on your back leg creates a graceful S-curve that defines your waistline above the baby bump.",
  },
  {
    title: "The Two-Handed Gentle Cradle",
    description: "Placing one hand lightly above the bump and the other hand cupping underneath creates a natural visual frame drawing the eye directly to your baby.",
  },
  {
    title: "The Chiaroscuro Side Profile",
    description: "Standing in pure silhouette against a soft light source casts dramatic shadows that delineate the roundness and miracle of the maternal form.",
  },
  {
    title: "Relaxed Hands & Soft Exhales",
    description: "Tension shows in clenched fingers. Our female photographers constantly cue you to drop your shoulders, soften your fingers, and gently breathe out for a natural, effortless glow.",
  },
];

const FAQS = [
  {
    q: "I feel unphotogenic and have never posed before. Will I look good?",
    a: "Over 90% of our expectant mothers tell us they feel nervous or unphotogenic when they arrive. Posing is not your job—it is our job. Our all-women photography team guides every single finger placement, chin angle, and hip tilt with warmth and encouragement. You will look and feel extraordinary.",
  },
  {
    q: "Can I do both dramatic solo portraits and warm couple photos in one session?",
    a: "Yes! All Fiesta House maternity packages are designed to accommodate multiple looks and moods. We can begin with your showstopping solo goddess portraits, transition into romantic portraits with your partner, and finish with a relaxed lifestyle look.",
  },
  {
    q: "Can I bring my own visual references or Pinterest board?",
    a: "Absolutely! We love seeing your dream concepts. Share your Pinterest board or saved Instagram reels with our team during booking so we can prep the studio lighting and sets to match your vision.",
  },
];

export default function IdeasAndStylesGuide() {
  return (
    <Layout
      title="Maternity Photoshoot Ideas & Styles | Posing Inspiration | Fiesta House Nairobi"
      description="Discover inspiring maternity photoshoot ideas, studio themes, and flattering posing techniques. Explore cinematic, romantic, minimalist, and family maternity concepts in Nairobi."
      keywords="maternity photoshoot ideas, pregnancy photoshoot poses, maternity photoshoot styles, maternity posing guide, studio maternity photoshoot themes nairobi"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Maternity Photoshoot Ideas & Flattering Posing Styles",
          "description": "Expert visual inspiration, studio set themes, and step-by-step posing tips for expectant mothers.",
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

      {/* Header */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-24 bg-[#FBF6F3] border-b border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#660032] mb-3 inline-block">
            Inspiration & Creative Concepts
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#2B2320] leading-tight mb-6">
            Maternity Photoshoot Ideas & Styles
          </h1>
          <p className="text-base sm:text-lg text-[#2B2320]/80 leading-relaxed font-light max-w-2xl mx-auto">
            From regal, cinematic portraits with flying silks to tender, unposed moments with your partner—explore the signature styles that make Fiesta House photography extraordinary.
          </p>
        </div>
      </header>

      {/* 4 Signature Creative Themes */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Curated Studio Moods
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              4 Signature Maternity Aesthetics
            </h2>
            <p className="text-sm text-slate-600">
              Select one dominant style or combine several across your session outfit changes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {STYLES.map((style, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-[#FBF6F3] border border-[#F1E4EC] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B09345] mb-2 block">
                    {style.mood}
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl text-[#2B2320] mb-2">{style.title}</h3>
                  <p className="text-xs font-medium text-[#660032] mb-4">{style.aesthetic}</p>
                  <p className="text-sm text-[#2B2320]/80 leading-relaxed mb-6">
                    {style.features}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#F1E4EC] flex items-center justify-between">
                  <span className="text-xs text-[#2B2320]/60">Captured in our private Nairobi studio</span>
                  <Link
                    to="/portfolio"
                    className="inline-flex items-center text-xs font-semibold text-[#660032] hover:text-[#B09345]"
                  >
                    View gallery <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Posing Techniques Section */}
      <section className="py-20 bg-[#FBF6F3]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Guided Posing Mastery
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              How to Pose for Flattering Pregnancy Portraits
            </h2>
            <p className="text-sm text-slate-600">
              No modeling background needed. Here are the core posing principles our photographers use to sculpt your bump and flatter your natural posture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {POSING_TIPS.map((tip, idx) => (
              <div key={idx} className="bg-white p-6 md:p-8 rounded-2xl border border-[#F1E4EC] shadow-xs">
                <div className="w-8 h-8 rounded-full bg-[#660032]/10 text-[#660032] flex items-center justify-center font-bold text-sm mb-4">
                  0{idx + 1}
                </div>
                <h3 className="font-serif text-xl text-[#2B2320] mb-2">{tip.title}</h3>
                <p className="text-sm text-[#2B2320]/80 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Physical Studio Sets Spotlight */}
      <section className="py-20 bg-white">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="bg-[#2B0E1E] text-white p-8 md:p-12 rounded-3xl">
            <span className="text-xs uppercase tracking-widest font-bold text-[#B09345] mb-2 block">
              Permanent Physical Sets
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Iconic Sets Built for Maternal Beauty
            </h2>
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 font-light max-w-2xl">
              Fiesta House is celebrated for our bespoke, full-scale studio installations: the <strong>Cinematic Boat Set</strong> with dreamy reflective accents, the <strong>Regal Master Staircase</strong> for grand trailing gown sweeps, the <strong>Living Flower Garden</strong>, and the <strong>Celestial Botanical Swing</strong>.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full">
                <Link to="/portfolio">Explore Set Photos in Portfolio</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
                <Link to="/maternity-photoshoot">Learn About Our Nairobi Studio</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#FBF6F3]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-[#2B2320] mb-2">
              Posing & Visual Concept FAQs
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {FAQS.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="border border-[#F1E4EC] rounded-2xl px-6 py-2 bg-white"
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
      <section className="py-16 bg-white text-center border-t border-[#F1E4EC]">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mb-4">
            Bring Your Vision to Life
          </h2>
          <p className="text-slate-600 text-sm md:text-base mb-8 max-w-lg mx-auto">
            Contact us today to discuss your concepts and select the perfect package for your pregnancy celebration.
          </p>
          <Button asChild size="lg" className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full px-8 py-6">
            <Link to="/contact">Reserve Your Session Date</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
