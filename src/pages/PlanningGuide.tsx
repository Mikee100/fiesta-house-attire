import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  Heart,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Coffee,
  Sun,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TIMELINE_STEPS = [
  {
    phase: "6–8 Weeks Before Shoot",
    title: "Reserve Your Date & Define Your Vision",
    description:
      "Because weekend slots in our Nairobi studio fill up quickly, reach out around weeks 22–26 of your pregnancy. We discuss your visual ideas, confirm your preferred gestational week (usually 28–34 weeks), and secure your studio date with a deposit.",
    icon: Calendar,
  },
  {
    phase: "2–3 Weeks Before Shoot",
    title: "Select Your Gowns & Concept Looks",
    description:
      "Review our in-house couture gown collection online or arrange a virtual styling consultation. Decide whether you prefer flowing silks, dramatic trains, floral sets, or clean black-background portraits. If partner or family are joining, coordinate their wardrobe palette.",
    icon: Shirt,
  },
  {
    phase: "1 Week Before Shoot",
    title: "Skin Care, Nails & Gentle Hydration",
    description:
      "Keep skin deeply hydrated with gentle, pregnancy-safe moisturizers. Schedule a neutral or soft French manicure and pedicure. Avoid trying harsh new skincare peels or facials right before the shoot to prevent sudden redness or sensitivity.",
    icon: Sparkles,
  },
  {
    phase: "24 Hours Before Shoot",
    title: "Rest & Prep Your Garments",
    description:
      "Get plenty of rest and hydrate well. On the morning of your shoot, wear loose-fitting clothing and remove tight bras, wristbands, or tight socks at least 2 hours before arrival to prevent indentations and strap marks on your skin.",
    icon: Sun,
  },
  {
    phase: "Shoot Day at Fiesta House",
    title: "Relax, Pamper & Create Magic",
    description:
      "Arrive at Diamond Plaza II in Parklands. Our all-women styling crew welcomes you with refreshments. Sit back for professional makeup and hair touches, step into your selected couture gowns, and enjoy guided posing in our private, temperature-controlled studio.",
    icon: Heart,
  },
];

const PACKING_CHECKLIST = [
  {
    category: "Essential Undergarments",
    items: [
      "Seamless nude/tan underwear (thong or high-waist depending on look)",
      "Strapless nude bra or silicone nipple covers",
      "Nude or black seamless maternity shapewear shorts (optional)",
    ],
  },
  {
    category: "Personal Comfort & Refreshment",
    items: [
      "Comfortable slip-on slippers or flip-flops for moving between sets",
      "Light, healthy snacks (nuts, fruits, crackers) and your preferred water bottle",
      "Your personal lip balm and any doctor-prescribed maternity supplements",
    ],
  },
  {
    category: "Sentimental Keepsakes (Optional)",
    items: [
      "Baby ultrasound scan pictures",
      "First baby shoes or a knit heirloom booties set",
      "Special heirloom jewelry, wrap, or cultural fabric you cherish",
    ],
  },
  {
    category: "Partner & Children Items",
    items: [
      "Ironed neutral collared shirt or tailored fitted t-shirt for partner",
      "Chinos or dark denim matching the shoot palette",
      "Clean shoes and favorite small toy/snack for toddlers to keep them happy",
    ],
  },
];

export default function PlanningGuide() {
  return (
    <Layout
      title="Complete Guide to Planning a Maternity Photoshoot | Fiesta House Nairobi"
      description="The ultimate step-by-step checklist for planning your maternity photoshoot in Nairobi. When to book, what to pack, skin prep, and what to expect on shoot day."
      keywords="maternity photoshoot planning guide, pregnancy photoshoot checklist, what to pack for maternity shoot, maternity photoshoot preparation nairobi"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Plan a Luxury Maternity Photoshoot",
          "description": "Comprehensive planning roadmap and checklist for expectant mothers preparing for a maternity photography session.",
          "step": TIMELINE_STEPS.map((s, idx) => ({
            "@type": "HowToStep",
            "position": idx + 1,
            "name": s.title,
            "text": s.description
          }))
        })}
      </script>

      {/* Header */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-24 bg-[#FBF6F3] border-b border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#660032] mb-3 inline-block">
            Pre-Shoot Education & Preparation
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#2B2320] leading-tight mb-6">
            The Complete Guide to Planning Your Maternity Photoshoot
          </h1>
          <p className="text-base sm:text-lg text-[#2B2320]/80 leading-relaxed font-light max-w-2xl mx-auto">
            Everything an expectant mother needs to know before stepping into the studio. Follow this stress-free roadmap to ensure you feel confident, rested, and radiant.
          </p>
        </div>
      </header>

      {/* Direct Answer Summary Box */}
      <section className="py-12 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="p-6 md:p-8 rounded-2xl bg-[#F1E4EC]/30 border border-[#F1E4EC] text-[#2B2320]">
            <h2 className="font-serif text-2xl text-[#660032] mb-3">
              Summary: The 3 Rules for an Effortless Shoot
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-[#2B2320]/85 mb-4">
              <strong>1. Timing matters:</strong> Aim for between <strong>28 and 34 weeks</strong> of pregnancy, when your belly is round and defined but you still have good energy.
            </p>
            <p className="text-sm md:text-base leading-relaxed text-[#2B2320]/85 mb-4">
              <strong>2. Wardrobe is handled:</strong> At Fiesta House, you do not need to buy expensive gowns. Our studio provides a curated couture atelier of over 80 maternity looks included in your session.
            </p>
            <p className="text-sm md:text-base leading-relaxed text-[#2B2320]/85">
              <strong>3. Posing is guided:</strong> You do not need professional modeling experience. Our all-female team directs your posture, hands, and gown flow with constant encouragement.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Timeline */}
      <section className="py-16 bg-[#FBF6F3]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Chronological Roadmap
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1">
              Your Maternity Planning Timeline
            </h2>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-6 md:before:left-8 before:w-0.5 before:bg-[#F1E4EC] before:h-full">
            {TIMELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative flex items-start gap-6 group">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white border-2 border-[#660032] text-[#660032] flex items-center justify-center shrink-0 z-10 shadow-sm">
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#F1E4EC] shadow-sm flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B09345]">
                      {step.phase}
                    </span>
                    <h3 className="font-serif text-xl md:text-2xl text-[#2B2320] mt-1 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base text-[#2B2320]/80 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Packing Checklist */}
      <section className="py-20 bg-white">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Studio Bag Essentials
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              What to Bring to Your Shoot
            </h2>
            <p className="text-sm md:text-base text-slate-600">
              Print or screenshot this checklist so you don't forget anything on your special day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PACKING_CHECKLIST.map((block, idx) => (
              <div key={idx} className="bg-[#FBF6F3] rounded-2xl p-6 md:p-8 border border-[#F1E4EC]">
                <h3 className="font-serif text-xl text-[#660032] mb-4 pb-2 border-b border-[#F1E4EC]">
                  {block.category}
                </h3>
                <ul className="space-y-3">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#2B2320]/80 leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-[#660032] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health & Comfort Disclaimer */}
      <section className="py-12 bg-[#FBF6F3] border-t border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-amber-200 text-[#2B2320]/80">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-[#2B2320] text-base mb-1">
                A Note on Pregnancy Health & Comfort
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed">
                While we provide photography planning guidance, this information does not substitute professional medical advice. Always follow the counsel of your OB-GYN or midwife regarding mobility, standing duration, and timing. Our studio paces sessions with frequent seated rests and hydration breaks to prioritize your comfort at all times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources Navigation */}
      <section className="py-16 bg-white border-t border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h3 className="font-serif text-2xl md:text-3xl text-[#2B2320] mb-8">
            Continue Your Preparation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              to="/when-to-do-maternity-photos"
              className="p-6 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC] hover:border-[#660032] transition-colors"
            >
              <h4 className="font-serif text-lg text-[#2B2320] mb-2">When Is the Best Time?</h4>
              <p className="text-xs text-[#2B2320]/70">Explore gestation weeks and timing considerations.</p>
            </Link>
            <Link
              to="/what-to-wear-maternity-photoshoot"
              className="p-6 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC] hover:border-[#660032] transition-colors"
            >
              <h4 className="font-serif text-lg text-[#2B2320] mb-2">What to Wear</h4>
              <p className="text-xs text-[#2B2320]/70">Gown styles, colors, and atelier look selections.</p>
            </Link>
            <Link
              to="/pricing"
              className="p-6 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC] hover:border-[#660032] transition-colors"
            >
              <h4 className="font-serif text-lg text-[#2B2320] mb-2">Packages & Rates</h4>
              <p className="text-xs text-[#2B2320]/70">Compare inclusions, looks, and reserve your date.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#2B0E1E] text-white text-center">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
            Ready to Plan Your Session With Our Stylists?
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">
            Let us answer your specific questions, verify current studio dates, and tailor your dream maternity experience.
          </p>
          <Button asChild size="lg" className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full px-8 py-6">
            <Link to="/contact">Book Your Session Today</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
