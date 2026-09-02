import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Calendar,
  Clock,
  Heart,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const TIMING_BREAKDOWNS = [
  {
    range: "Weeks 28 – 32 (End of 7th Month / Early 8th)",
    status: "The Sweet Spot (Recommended)",
    color: "border-[#660032] bg-[#F1E4EC]/20",
    badge: "Most Popular",
    description:
      "Your baby bump has popped into a beautifully defined round shape, yet you still feel energetic, flexible, and comfortable moving between different poses. This is the ideal window for most mothers.",
  },
  {
    range: "Weeks 33 – 35 (Mid to Late 8th Month)",
    status: "Full, Dramatic Bump",
    color: "border-[#B09345] bg-[#FBF6F3]",
    badge: "High Drama",
    description:
      "The belly is prominent and gorgeous in form-fitting silhouettes and flowing sheer silks. Sessions are conducted at a slightly gentler pace with frequent seating breaks.",
  },
  {
    range: "Weeks 24 – 28 (Twins / Multiples)",
    status: "Special Multiples Window",
    color: "border-[#660032] bg-white",
    badge: "Twins / Multiples",
    description:
      "Expectant mothers carrying twins or triplets tend to show significantly earlier. Because multiples frequently arrive before 37 weeks, we recommend scheduling between weeks 24 and 28 for maximum comfort and safety.",
  },
  {
    range: "Weeks 36+ (9th Month)",
    status: "Late Stage Photography",
    color: "border-slate-300 bg-white",
    badge: "Paced Gently",
    description:
      "While entirely possible, late-stage shoots require shorter poses, abundant seating on velvet chaises and swings, and the understanding that baby may arrive early! We keep sets relaxing and restorative.",
  },
];

const FAQS = [
  {
    q: "Is 7 months too early for a maternity photoshoot?",
    a: "No! Around week 28 (which is the beginning of the 7th month), many expectant mothers have a clearly defined, high belly bump while retaining great mobility and stamina. It is a fantastic time for a shoot.",
  },
  {
    q: "Is 8 months a good time for maternity photos?",
    a: "Yes, 8 months (weeks 31–34) is the most popular time for maternity photoshoots at Fiesta House. The bump is prominently round and looks incredible in both draping gowns and form-fitting mermaid cuts.",
  },
  {
    q: "Can I do a maternity shoot at 9 months (36+ weeks)?",
    a: "Yes, you can. We frequently photograph glowing mothers in their 9th month. However, because maternal fatigue and sudden labor are possible, we tailor the session with supported sitting poses on our master staircase, floral swings, and plush daybeds.",
  },
  {
    q: "How early should I book my maternity photoshoot in Nairobi?",
    a: "We recommend reserving your session during your second trimester—ideally around weeks 20 to 24. This guarantees your preferred weekend date at our Diamond Plaza II studio before calendars fill up.",
  },
  {
    q: "What if I experience morning sickness or pregnancy fatigue on shoot day?",
    a: "Your comfort and your baby's wellbeing always come first. If you are unwell, our friendly studio policies allow for date rescheduling with advance notice.",
  },
];

export default function TimingGuide() {
  return (
    <Layout
      title="When Is the Best Time for a Maternity Photoshoot? | Fiesta House Nairobi"
      description="Learn the best week and month of pregnancy for your maternity photoshoot. Expert guidance on weeks 28–34, 7 vs 8 vs 9 months, twins timing, and booking advice."
      keywords="when to do maternity photos, best week for maternity photoshoot, 7 months pregnant photoshoot, 8 months pregnant photoshoot, pregnancy photoshoot timing nairobi"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "When Is the Best Time for a Maternity Photoshoot?",
          "description": "A comprehensive guide on gestational weeks, maternal comfort, and the ideal timing for professional pregnancy photography.",
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

      {/* Hero Header */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-24 bg-[#FBF6F3] border-b border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#660032] mb-3 inline-block">
            Pregnancy Stages & Timing Guide
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#2B2320] leading-tight mb-6">
            When Is the Best Time for Maternity Photos?
          </h1>
          <p className="text-base sm:text-lg text-[#2B2320]/80 leading-relaxed font-light max-w-2xl mx-auto">
            Timing is one of the most critical decisions of your maternity shoot. Learn the sweet spot between a beautifully rounded baby bump and optimal maternal energy.
          </p>
        </div>
      </header>

      {/* Direct Answer Callout */}
      <section className="py-12 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-[#660032] text-white rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="flex items-center gap-3 text-[#B09345] mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest font-bold">The Short Answer</span>
            </div>
            <h2 className="font-serif text-2xl md:text-4xl text-white mb-4">
              Between 28 and 34 Weeks (Late 7th to Mid 8th Month)
            </h2>
            <p className="text-white/85 text-base md:text-lg leading-relaxed mb-6 font-light">
              For most expectant mothers, the best time to schedule a maternity photoshoot is <strong>between the 28th and 34th week of pregnancy</strong> (roughly the 7th to 8th month). During this window, your belly has taken on a full, round shape that photographs magnificently in couture gowns, while you still have the energy and physical ease to enjoy the posing experience.
            </p>
            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[#B09345]" />
                <span>Defined, elevated belly bump</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[#B09345]" />
                <span>Healthy maternal mobility & energy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[#B09345]" />
                <span>Safe margin before labor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Trimester & Week Breakdown */}
      <section className="py-16 bg-[#FBF6F3]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
              Week-by-Week Analysis
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mt-1 mb-3">
              How Every Pregnancy Stage Photographs
            </h2>
            <p className="text-sm text-slate-600">
              Find the window that best matches your personal pregnancy journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TIMING_BREAKDOWNS.map((tier, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-3xl border ${tier.color} shadow-sm flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#660032] border border-[#F1E4EC] shadow-xs">
                      {tier.badge}
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#2B2320] mb-2">{tier.range}</h3>
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#B09345] mb-4">
                    {tier.status}
                  </p>
                  <p className="text-sm text-[#2B2320]/80 leading-relaxed">
                    {tier.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* First Time Moms vs Experienced Moms */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#660032]">
                First Baby vs Subsequent Pregnancies
              </span>
              <h2 className="font-serif text-3xl text-[#2B2320] mt-2 mb-4">
                Does Pregnancy Number Change Timing?
              </h2>
              <p className="text-sm text-[#2B2320]/80 leading-relaxed mb-4">
                <strong>First-time mothers</strong> often have tighter abdominal tone, meaning the bump can take slightly longer to become prominent. Weeks 30 to 33 are frequently the peak golden window for first-time pregnancies.
              </p>
              <p className="text-sm text-[#2B2320]/80 leading-relaxed mb-6">
                <strong>Mothers on their second or third pregnancy</strong> usually find their bump pops noticeably earlier. If this is your second or third baby, scheduling closer to weeks 28 to 31 is often ideal before late pregnancy fatigue sets in.
              </p>
              <Link
                to="/maternity-photoshoot"
                className="inline-flex items-center text-sm font-semibold text-[#660032] hover:text-[#B09345]"
              >
                Explore the Fiesta House Studio Experience <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>

            <div className="p-8 bg-[#FBF6F3] rounded-3xl border border-[#F1E4EC]">
              <h3 className="font-serif text-xl text-[#2B2320] mb-3">When Should You Reserve?</h3>
              <p className="text-sm text-[#2B2320]/75 leading-relaxed mb-4">
                We strongly advise reaching out during weeks <strong>20 to 24</strong> of your pregnancy. Weekend studio sessions at our Parklands sanctuary are limited to maintain our unhurried luxury standard.
              </p>
              <Button asChild className="w-full bg-[#660032] hover:bg-[#80003f] text-white rounded-full">
                <Link to="/contact">Check Studio Availability</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Maternal Care Disclaimer */}
      <section className="py-10 bg-[#FBF6F3] border-t border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-amber-200 text-[#2B2320]/80">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-[#2B2320] text-sm mb-1">
                Medical & Wellness Disclaimer
              </h4>
              <p className="text-xs leading-relaxed">
                This guide provides general photography recommendations. Every pregnancy is uniquely individual. If your doctor or midwife has advised bed rest, pelvic rest, or has concerns regarding blood pressure or mobility, always honor their instructions above all else. We gladly adapt poses and offer comfortable seated options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-[#2B2320] mb-2">
              Timing FAQs
            </h2>
            <p className="text-sm text-slate-600">
              Clear answers to the most common questions about pregnancy shoot timing.
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

      {/* Next Step CTA */}
      <section className="py-16 bg-[#2B0E1E] text-white text-center">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
            Know Your Estimated Due Date?
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-lg mx-auto">
            Send us your due date or current week of pregnancy, and our concierge team will recommend the optimal photoshoot window for you.
          </p>
          <Button asChild size="lg" className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full px-8 py-6">
            <Link to="/contact">Calculate Your Best Date With Us</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
