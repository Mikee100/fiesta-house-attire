import { Star } from "lucide-react";
import type { Review } from "./reviews-data";

interface ReviewCardProps {
  review: Review;
  variant: "mobile" | "desktop";
  quoteLength: number;
}

/** Presentational testimonial content — rating, truncated quote, and client attribution. */
export default function ReviewCard({ review, variant, quoteLength }: ReviewCardProps) {
  const truncated =
    review.review.length > quoteLength ? `${review.review.slice(0, quoteLength).trim()}…` : review.review;

  return (
    <div aria-live="polite">
      <p
        style={{
          fontSize: variant === "desktop" ? "0.92rem" : "0.85rem",
          lineHeight: 1.6,
          color: "var(--magenta)",
          fontStyle: "italic",
          margin: 0,
          fontFamily: "'Cormorant Garamond', serif"
        }}
      >
        "{truncated}"
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: variant === "desktop" ? "0.9rem" : "0.65rem"
        }}
      >
        <div>
          <p style={{ fontSize: variant === "desktop" ? "0.9rem" : "0.82rem", fontWeight: 700, color: "var(--dark)", margin: 0 }}>
            {review.name}
          </p>
          {review.location && (
            <p style={{ fontSize: variant === "desktop" ? "0.78rem" : "0.72rem", color: "var(--muted-foreground)", margin: 0 }}>
              {review.location}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "1px", flexShrink: 0 }} aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star key={i} size={variant === "desktop" ? 13 : 12} fill="var(--sky-blue)" style={{ color: "var(--sky-blue)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
