import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import p4 from "@/assets/portfolio-4.jpg";
import p5 from "@/assets/portfolio-5.jpg";
import p6 from "@/assets/portfolio-6.jpg";
import p_new from "@/assets/portfolio_new_1.png";

export const MOCK_PORTFOLIOS = [
  {
    id: "1",
    title: "Family Baby Bump",
    slug: "family-baby-bump",
    images: [p_new, p1, p2, p3]
  },
  {
    id: "2",
    title: "Studio Couture",
    slug: "studio-couture",
    images: [p4, p5, p6, p1]
  },
  {
    id: "3",
    title: "Minimalist Portraits",
    slug: "minimalist-portraits",
    images: [p2, p3, p4, p5]
  },
  {
    id: "4",
    title: "Outdoor Serenity",
    slug: "outdoor-serenity",
    images: [p6, p1, p2, p3]
  }
];
