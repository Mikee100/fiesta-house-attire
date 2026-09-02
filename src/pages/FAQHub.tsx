import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import {
  Search,
  HelpCircle,
  Sparkles,
  Clock,
  Shirt,
  Users,
  Camera,
  CreditCard,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface FAQItem {
  q: string;
  a: string;
  category: "discovery" | "timing" | "styling" | "family" | "posing" | "commercial";
}

const ALL_FAQS: FAQItem[] = [
  // Discovery
  {
    category: "discovery",
    q: "Where can I do a luxury maternity photoshoot in Nairobi?",
    a: "Fiesta House is Nairobi's premier luxury maternity studio, conveniently located at Diamond Plaza II, 4th Floor, in Parklands. Our private sanctuary features permanent physical sets (including the Cinematic Boat set, Master Staircase, and Flower Garden), a curated couture gown atelier, and an all-women team.",
  },
  {
    category: "discovery",
    q: "What makes Fiesta House different from other Nairobi photography studios?",
    a: "Unlike studios that use flat paper backdrops and expect you to supply your own clothing, Fiesta House is an all-inclusive maternity sanctuary. We provide immersive physical sets, complimentary access to over 80 designer maternity gowns, professional makeup artistry, and expert female posing guidance tailored for maternal comfort.",
  },
  {
    category: "discovery",
    q: "Is a professional maternity photoshoot worth it?",
    a: "Yes. Pregnancy is a fleeting, transformative chapter in a woman's life. Professional maternity portraits preserve this sacred milestone with artistic reverence, creating heirloom artwork you and your child will treasure for generations.",
  },
  {
    category: "discovery",
    q: "Is Fiesta House a clothing boutique or a photography studio?",
    a: "Fiesta House is a specialized maternity photography and styling studio. The term 'gowns' refers to our curated in-house couture wardrobe available exclusively for clients to wear during their photoshoot. We do not sell retail dresses.",
  },

  // Timing
  {
    category: "timing",
    q: "When is the best time to do a maternity photoshoot?",
    a: "We recommend scheduling between 28 and 34 weeks of pregnancy (late 7th to mid 8th month). During this window, your baby bump is round and elevated, while you still retain comfortable energy and mobility.",
  },
  {
    category: "timing",
    q: "Is 7 months too early for a maternity photoshoot?",
    a: "Not at all. At 28 weeks (beginning of 7 months), many expectant mothers have a prominent, beautiful bump and excellent energy. It is an optimal time to shoot.",
  },
  {
    category: "timing",
    q: "Can I do a maternity photoshoot at 9 months (36+ weeks)?",
    a: "Yes. We frequently photograph glowing mothers in their 9th month. We adapt the session with supported, restful poses on our daybeds, swings, and staircases with plenty of breaks.",
  },
  {
    category: "timing",
    q: "When should I do photos if I am expecting twins or multiples?",
    a: "For twins or multiples, we recommend scheduling between weeks 24 and 28. Multiples show earlier and often arrive ahead of full term, so earlier planning ensures your comfort.",
  },
  {
    category: "timing",
    q: "How far in advance should I book my session?",
    a: "We recommend reserving your session during your second trimester—ideally around weeks 20 to 24—to guarantee your preferred weekend studio date.",
  },

  // Styling & Gowns
  {
    category: "styling",
    q: "What should I wear for my maternity photoshoot?",
    a: "At Fiesta House, you don't have to purchase a gown! Your session includes access to our atelier of over 80 designer gowns, including flying silks, fitted mermaid dresses, ethereal sheer tulles, and romantic lace robes. You can select your favorite looks during your session.",
  },
  {
    category: "styling",
    q: "Can I choose my own gowns for the photoshoot?",
    a: "Yes! You select the exact gowns and looks you wish to wear from our atelier, with personalized guidance from our in-house stylist to match your skin tone and bump shape.",
  },
  {
    category: "styling",
    q: "How many outfit changes are included in a session?",
    a: "Depending on your selected package, sessions typically include between 2 and 4 distinct look changes, allowing you to showcase varied styles (e.g. one regal silk, one sleek modern dress, and one couple look).",
  },
  {
    category: "styling",
    q: "What colors look best for maternity photography?",
    a: "Rich jewel tones (Emerald, Wine Burgundy, Royal Sapphire Blue, Warm Champagne) photograph exquisitely on darker studio backdrops and rich melanin skin. Soft blush, ivory, and earth tones work wonderfully on our botanical and bright sets.",
  },
  {
    category: "styling",
    q: "What undergarments should I bring?",
    a: "We recommend seamless nude/tan undergarments: a seamless nude thong or brief, and a strapless nude bra or silicone nipple covers to ensure smooth silhouettes under any gown.",
  },

  // Family & Partner
  {
    category: "family",
    q: "Can my husband or partner be included in the photoshoot?",
    a: "Yes, warmly welcomed and encouraged! All our core packages allow partner inclusion at no extra cost. We capture both intimate couple connection and individual portraits.",
  },
  {
    category: "family",
    q: "Can my children or older siblings join the shoot?",
    a: "Absolutely. We love including big brothers and big sisters. We structure the session to capture joyful family interactions first before little ones get tired.",
  },
  {
    category: "family",
    q: "What should my husband and children wear?",
    a: "We suggest classic neutrals: a crisp white, navy, or charcoal button-down or fitted crewneck shirt with chinos or dark denim for partner. Neutral linen or cotton outfits for children in cream, soft sage, or beige.",
  },

  // Posing & Visual Ideas
  {
    category: "posing",
    q: "I don't know how to pose. Will someone direct me?",
    a: "Yes! 95% of our clients have never posed professionally. Our experienced all-women photography team directs every single nuance—from where to place your hands, how to angle your chin, to when to soften your shoulders. You will feel completely relaxed and look stunning.",
  },
  {
    category: "posing",
    q: "What are the most popular studio sets at Fiesta House?",
    a: "Our signature sets include the Cinematic Boat Set with reflective floral accents, the Regal Master Staircase for trailing gowns, the Living Flower Sanctuary, the Celestial Botanical Swing, and Minimalist Chandelier sets.",
  },
  {
    category: "posing",
    q: "Can I bring inspiration photos or a Pinterest mood board?",
    a: "Yes! We love seeing your dream concepts. You can share your visual board before your session so we can tailor lighting and backdrops.",
  },

  // Commercial / Booking
  {
    category: "commercial",
    q: "How much does a maternity photoshoot cost at Fiesta House?",
    a: "We offer tailored luxury packages designed to suit different desires. Packages range from intimate introductory sessions to full-day couture luxury experiences with photobooks and wall art. Check our Packages page or chat with us on WhatsApp for current rates.",
  },
  {
    category: "commercial",
    q: "What is included in a Fiesta House package?",
    a: "Our signature packages include full studio session time, complimentary access to our couture gown collection, professional hair & makeup artistry, guided posing, high-resolution retouched digital images, and optional heirloom print products.",
  },
  {
    category: "commercial",
    q: "How long does it take to receive my edited photographs?",
    a: "Soft copy retouched images are delivered via a private digital gallery within 7 to 10 working days. Printed heirloom photobooks and wall mounts follow within 5 to 7 additional days.",
  },
  {
    category: "commercial",
    q: "How do I book a maternity photoshoot session?",
    a: "Booking is effortless! Contact us via WhatsApp at +254 720 111 928 or submit an enquiry on our website. Our team will verify date availability, help you select a package, and secure your slot with a deposit.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "discovery", label: "Discovery & Studio" },
  { id: "timing", label: "Timing & Weeks" },
  { id: "styling", label: "Gowns & Styling" },
  { id: "family", label: "Partner & Family" },
  { id: "posing", label: "Posing & Sets" },
  { id: "commercial", label: "Packages & Booking" },
];

export default function FAQHub() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    return ALL_FAQS.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !searchQuery ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <Layout
      title="Maternity Photoshoot FAQ | Questions & Answers | Fiesta House Nairobi"
      description="Got questions about booking a maternity photoshoot in Nairobi? Read answers on timing, gowns, hair & makeup, husband inclusion, pricing, and studio sets at Fiesta House."
      keywords="maternity photoshoot faq, pregnancy photography questions, maternity gowns nairobi faq, maternity shoot nairobi pricing"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": ALL_FAQS.map((item) => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.a
            }
          }))
        })}
      </script>

      {/* Header */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-24 bg-[#FBF6F3] border-b border-[#F1E4EC]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#660032] mb-3 inline-block">
            Fast Answers & Clear Information
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#2B2320] leading-tight mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-[#2B2320]/80 leading-relaxed font-light max-w-2xl mx-auto mb-8">
            Everything you need to know about preparing for, styling, and experiencing your luxury maternity photoshoot in Nairobi.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic (e.g. gowns, timing, husband, pricing)..."
              className="w-full pl-12 pr-4 py-4 rounded-full border border-[#F1E4EC] bg-white text-[#2B2320] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#660032] text-sm"
            />
          </div>
        </div>
      </header>

      {/* Category Filter Pills */}
      <section className="py-8 bg-white border-b border-[#F1E4EC] sticky top-[68px] z-20 backdrop-blur-md bg-white/90">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#660032] text-white shadow-sm"
                    : "bg-[#FBF6F3] text-[#2B2320]/75 hover:bg-[#F1E4EC]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion Questions List */}
      <section className="py-16 bg-[#FBF6F3]">
        <div className="container max-w-4xl mx-auto px-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl p-8 border border-[#F1E4EC]">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-serif text-2xl text-[#2B2320] mb-2">No matching questions found</h3>
              <p className="text-sm text-slate-600 mb-6">
                Have a specific question we haven't answered here? Chat directly with our concierge team.
              </p>
              <Button asChild className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full">
                <Link to="/contact">Chat With Our Concierge</Link>
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border border-[#F1E4EC] rounded-2xl px-6 py-2 bg-white shadow-xs"
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
          )}
        </div>
      </section>

      {/* Quick Links to In-Depth Guides */}
      <section className="py-16 bg-white border-t border-[#F1E4EC]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h3 className="font-serif text-2xl md:text-3xl text-[#2B2320] mb-2">
              Looking for In-Depth Guides?
            </h3>
            <p className="text-sm text-slate-600">
              Explore our dedicated resources designed to walk you through every step.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/planning-guide"
              className="p-6 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC] hover:border-[#660032] transition-colors"
            >
              <Clock className="w-5 h-5 text-[#660032] mb-2" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">Planning Guide</h4>
              <p className="text-xs text-[#2B2320]/70">Step-by-step checklist from booking to shoot day.</p>
            </Link>

            <Link
              to="/when-to-do-maternity-photos"
              className="p-6 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC] hover:border-[#660032] transition-colors"
            >
              <Sparkles className="w-5 h-5 text-[#660032] mb-2" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">Timing & Weeks</h4>
              <p className="text-xs text-[#2B2320]/70">Why weeks 28–34 are ideal for photography.</p>
            </Link>

            <Link
              to="/what-to-wear-maternity-photoshoot"
              className="p-6 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC] hover:border-[#660032] transition-colors"
            >
              <Shirt className="w-5 h-5 text-[#660032] mb-2" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">What to Wear</h4>
              <p className="text-xs text-[#2B2320]/70">Explore silhouettes, colors, and the Fiesta Atelier.</p>
            </Link>

            <Link
              to="/family-maternity-photoshoot"
              className="p-6 rounded-2xl bg-[#FBF6F3] border border-[#F1E4EC] hover:border-[#660032] transition-colors"
            >
              <Users className="w-5 h-5 text-[#660032] mb-2" />
              <h4 className="font-serif text-lg text-[#2B2320] mb-1">Family & Partner</h4>
              <p className="text-xs text-[#2B2320]/70">Involving your husband, children, and toddlers.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Direct Contact CTA */}
      <section className="py-16 bg-[#2B0E1E] text-white text-center">
        <div className="container max-w-3xl mx-auto px-4">
          <MessageCircle className="w-10 h-10 text-[#B09345] mx-auto mb-4" />
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
            Still Have a Question?
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-lg mx-auto">
            Our friendly concierge team is always here to help you plan your maternity experience. Chat with us on WhatsApp or book a consultation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-[#660032] hover:bg-[#80003f] text-white rounded-full px-8 py-6">
              <a href="https://wa.me/254720111928" target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp (+254 720 111 928)
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6">
              <Link to="/contact">Send an Enquiry</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
