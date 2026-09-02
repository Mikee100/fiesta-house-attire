import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Heart,
  Users,
  Sparkles,
  CheckCircle2,
  Smile,
  ArrowRight,
  Shirt,
  ShieldCheck,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const WARDROBE_COORDINATION = [
  {
    role: "For Your Husband / Partner",
    advice:
      "A tailored neutral button-down shirt (White, Ivory, Navy, or Charcoal) or a clean, fitted crewneck tee. Pair with chinos or tailored dark denim. Avoid large logos, busy checks, or sports jerseys so the visual focus remains on your connection.",
  },
  {
    role: "For Older Siblings & Toddlers",
    advice:
      "Soft neutral tones (Cream, Oatmeal, Soft Sage, Blush, or Khaki). Simple cotton or linen dresses for daughters; clean shirts or polos for sons. Simple, unbranded shoes or bare feet look wonderful and organic on our studio carpets.",
  },
  {
    role: "Coordination Philosophy (Color Harmony, Not Uniforms)",
    advice:
      "Avoid everyone wearing the exact same color (e.g. matching all-white polos). Instead, choose a 3-color palette: for example, Mom in an emerald green silk gown, Partner in a crisp crisp white linen shirt with khaki chinos, and Sibling in soft beige.",
  },
];

const SESSION_FLOW = [
  {
    step: "1. Mom's Glam & Solo Portraits",
    details:
      "We begin with Mom's hair and makeup. You step into your most dramatic solo couture gown first. While Mom enjoys quiet pampering, Partner and children can arrive slightly later or relax in our comfortable private client lounge.",
  },
  {
    step: "2. Tender Couple Portraits",
    details:
      "Your partner joins the set. We guide intimate, connected frames: holding hands over the baby bump, gentle forehead kisses, and shared quiet anticipation.",
  },
  {
    step: "3. Children & Sibling Inclusion",
    details:
      "We bring in toddlers or older children while their energy is high. We keep this segment playful and light—asking siblings to whisper secrets to the baby, kiss the bump, or hug mom and dad.",
  },
  {
    step: "4. Sibling Wind-Down & Mom's Final Look",
    details:
      "Once family frames are captured, children can relax with snacks and toys in the lounge while mom completes her final solo look in relaxed comfort.",
  },
];

const FAQS = [
  {
    q: "Is there an extra charge to include my husband or partner?",
    a: "No! Partner and immediate family inclusion is welcomed across all our signature maternity packages at Fiesta House. We believe capturing this milestone together is essential.",
  },
  {
    q: "My partner is shy and dislikes taking photos. How do you handle this?",
    a: "Almost every partner tells us the same thing! Our team specializes in effortless, natural posing. We do not force stiff, awkward smiles. We keep interactions candid, relaxed, and quick, so partners actually enjoy the session.",
  },
  {
    q: "What if my toddler gets cranky or uncooperative during the shoot?",
    a: "We have photographed hundreds of families with energetic toddlers! We never rush children. Our team uses playful games, patience, and quick shutter timing to capture authentic joy. We capture family moments first so little ones are free to play.",
  },
  {
    q: "Can extended family (grandparents) join as well?",
    a: "Yes. If you wish to include grandparents or extended family members, let us know when booking so we can recommend the appropriate package with adequate time and set capacity.",
  },
];

export default function FamilyMaternityGuide() {
  return (
    <Layout
      title="Maternity Photoshoots With Partner & Family | Fiesta House Nairobi"
      description="Plan the perfect couples and family maternity photoshoot in Nairobi. Styling advice for husbands and siblings, stress-free session flow, and intimate posing tips."
      keywords="family maternity photoshoot nairobi, couples maternity photoshoot kenya, maternity shoot with husband, maternity photos with siblings, pregnancy shoot with family"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Maternity Photoshoots With Your Partner & Family: The Complete Guide",
          "description": "How to coordinate family outfits, manage toddlers, and create stress-free maternity portraits with your spouse and children.",
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
            Couples & Family Maternity Photography
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#2B2320] leading-tight mb-6">
            Maternity Photoshoots With Your Partner & Family
          </h1>
          <p className="text-base sm:text-lg text-[#2B2320]/80 leading-relaxed font-light max-w-2xl mx-auto">
            Welcoming a baby is a shared family journey. Discover how we create heartwarming, unforced portraits with your husband, partner, and children at our Nairobi studio.
          </p>
        </div>
      </header>

      {/* Direct Answer Callout */}
      <section className="py-12 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-[#FBF6F3] border border-[#F1E4EC] rounded-3xl p-8 md:p-10 shadow-sm">
            <h2 className="font-serif text-2xl md:text-3xl text-[#660032] mb-3">
              Can My Husband & Children Join My Session?
            </h2>
            <p className="text-base text-[#2B2320]/85 leading-relaxed mb-4">
              <strong>Yes, absolutely!</strong> At Fiesta House, we warmly encourage partners and older siblings to be part of the session. We do not believe a mother should have to choose between stunning solo goddess portraits and heartfelt family memories.
            </p>
            <p className="text-base text-[#2B2320]/85 leading-relaxed">
              We carefully structure the session sequence so Mom gets dedicated time for solo editorial shots, followed by relaxed, loving couple and family portraits without overwhelming little ones.
            </p>
          </div>
        </div>
      </section>

      {/* Session Flow */}
      <section className="py-16 bg-[#FBF6F3]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Stress-Free Sequencing
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              How We Sequence a Family Maternity Shoot
            </h2>
            <p className="text-sm text-slate-600">
              Designed to preserve Mom's energy and keep children happy and engaged.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SESSION_FLOW.map((step, idx) => (
              <div key={idx} className="bg-white p-6 md:p-8 rounded-2xl border border-[#F1E4EC] shadow-xs">
                <h3 className="font-serif text-xl text-[#660032] mb-2">{step.step}</h3>
                <p className="text-sm text-[#2B2320]/80 leading-relaxed">
                  {step.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wardrobe Coordination */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Wardrobe Harmony
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              What Should Partners & Children Wear?
            </h2>
            <p className="text-sm text-slate-600">
              Tips to ensure the whole family looks cohesive and camera-ready.
            </p>
          </div>

          <div className="space-y-6">
            {WARDROBE_COORDINATION.map((item, idx) => (
              <div key={idx} className="p-6 md:p-8 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC]">
                <h3 className="font-serif text-xl text-[#2B2320] mb-2">{item.role}</h3>
                <p className="text-sm text-[#2B2320]/80 leading-relaxed">
                  {item.advice}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#FBF6F3]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-[#2B2320] mb-2">
              Family Shoot FAQs
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
      <section className="py-16 bg-[#2B0E1E] text-white text-center">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
            Capture Your Family's Greatest Milestone
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-lg mx-auto">
            Book your family maternity session at Fiesta House. We make the entire process effortless, loving, and memorable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full px-8 py-6">
              <Link to="/contact">Reserve a Family Session</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6">
              <Link to="/pricing">View Package Rates</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
