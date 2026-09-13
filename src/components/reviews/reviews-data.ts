import { REAL_REVIEWS } from "@/lib/reviews";

export interface Review {
  id: string;
  name: string;
  location?: string;
  rating: number;
  review: string;
  image?: string;
}

// Curated subset of REAL_REVIEWS (src/lib/reviews.ts) for the floating widget —
// keeps pagination dots manageable while pulling from the single source of truth.
const WIDGET_REVIEW_IDS = ["6", "1", "4", "5", "9", "15", "11", "14"];

export const WIDGET_REVIEWS: Review[] = WIDGET_REVIEW_IDS
  .map((id) => REAL_REVIEWS.find((r) => r.id === id))
  .filter((r): r is NonNullable<typeof r> => Boolean(r))
  .map((r) => ({
    id: r.id,
    name: r.author,
    location: r.authorSubtitle,
    rating: r.rating,
    review: r.quote,
  }));
