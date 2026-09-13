import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Star, X, ChevronLeft, ChevronRight } from "lucide-react";
import { WIDGET_REVIEWS } from "./reviews-data";
import ReviewCard from "./ReviewCard";

const AUTOPLAY_MS = 6000;
const SHOW_DELAY_MS = 3200;
const SWIPE_THRESHOLD_PX = 40;
const DISMISS_KEY = "fh_reviews_widget_dismissed";
const HIDDEN_PATH_PREFIXES = ["/admin", "/reviews", "/cart", "/checkout"];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useIsMobileWidth() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function ReviewsWidget() {
  const { pathname } = useLocation();
  const isMobile = useIsMobileWidth();
  const reducedMotion = usePrefersReducedMotion();

  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // localStorage unavailable — widget will just show
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const advance = useCallback((delta: number) => {
    setIndex((i) => (i + delta + WIDGET_REVIEWS.length) % WIDGET_REVIEWS.length);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    timerRef.current = setInterval(() => advance(1), AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, reducedMotion, advance]);

  const hiddenForRoute = HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleReopen = () => {
    setDismissed(false);
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      // ignore
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
        advance(deltaX < 0 ? 1 : -1);
      }
    }
    touchStartX.current = null;
    setPaused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") advance(-1);
    if (e.key === "ArrowRight") advance(1);
  };

  if (hiddenForRoute) return null;
  if (isMobile) return null;

  const review = WIDGET_REVIEWS[index];
  const cardWidthPx = isMobile ? undefined : 370;

  return (
    <>
      <style>{`
        .fh-reviews-widget {
          position: fixed;
          z-index: 900;
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .fh-reviews-widget.is-ready {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        @media (prefers-reduced-motion: reduce) {
          .fh-reviews-widget { transition: opacity 0.2s linear; }
        }
        .fh-reviews-card {
          background: #FFFFFF;
          border-radius: 22px;
          box-shadow: 0 18px 48px rgba(43, 35, 32, 0.16), 0 2px 8px rgba(43, 35, 32, 0.06);
          border: 1px solid rgba(102, 0, 50, 0.08);
          position: relative;
          overflow: hidden;
        }
        .fh-reviews-fade {
          animation: fhReviewsFadeIn 0.4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .fh-reviews-fade { animation: none; }
        }
        @keyframes fhReviewsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fh-reviews-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(102, 0, 50, 0.15);
          color: var(--magenta);
          background: white;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .fh-reviews-nav-btn:hover {
          background: var(--sky-blue-tint);
        }
        .fh-reviews-nav-btn:focus-visible,
        .fh-reviews-close:focus-visible,
        .fh-reviews-reopen:focus-visible {
          outline: 2px solid var(--sky-blue);
          outline-offset: 2px;
        }
        .fh-reviews-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(102, 0, 50, 0.18);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .fh-reviews-dot.is-active {
          background: var(--sky-blue);
          transform: scale(1.3);
        }
      `}</style>

      {dismissed ? (
        <button
          type="button"
          onClick={handleReopen}
          aria-label="Show client reviews"
          className={`fh-reviews-reopen fh-reviews-widget ${ready ? "is-ready" : ""}`}
          data-track="reviews_click:reopen_widget"
          style={{
            left: isMobile ? "50%" : "2rem",
            transform: isMobile ? "translateX(-50%)" : undefined,
            bottom: isMobile ? "1rem" : "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.55rem 1rem",
            borderRadius: "100px",
            background: "var(--magenta)",
            color: "white",
            boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
            fontSize: "0.75rem",
            fontWeight: 700
          }}
        >
          <Star size={14} fill="var(--sky-blue)" style={{ color: "var(--sky-blue)" }} />
          Reviews
        </button>
      ) : (
        <div
          className={`fh-reviews-widget ${ready ? "is-ready" : ""}`}
          role="region"
          aria-label="Client reviews carousel"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={
            isMobile
              ? { bottom: "12.5rem", left: "12px", right: "12px", width: "auto", maxWidth: "420px", margin: "0 auto" }
              : { bottom: "2rem", left: "2rem", width: `${cardWidthPx}px`, maxWidth: "calc(100vw - 2rem)" }
          }
        >
          <div className="fh-reviews-card" style={{ padding: isMobile ? "0.9rem 1rem 0.8rem" : "1.3rem 1.4rem 1.1rem" }}>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss reviews widget"
              className="fh-reviews-close"
              style={{
                position: "absolute",
                top: "0.6rem",
                right: "0.6rem",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                color: "var(--muted-foreground)",
                background: "transparent"
              }}
            >
              <X size={14} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: isMobile ? "0.55rem" : "0.75rem", paddingRight: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1px" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={isMobile ? 12 : 13} fill="var(--sky-blue)" style={{ color: "var(--sky-blue)" }} />
                ))}
              </div>
              <span
                style={{
                  fontSize: isMobile ? "0.65rem" : "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  color: "var(--magenta)"
                }}
              >
                Client Reviews
              </span>
            </div>

            <div key={review.id} className="fh-reviews-fade">
              <ReviewCard review={review} variant={isMobile ? "mobile" : "desktop"} quoteLength={isMobile ? 130 : 160} />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: isMobile ? "0.75rem" : "1rem",
                paddingTop: isMobile ? "0.6rem" : "0.8rem",
                borderTop: "1px solid rgba(43,35,32,0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => advance(-1)}
                  aria-label="Previous review"
                  className="fh-reviews-nav-btn"
                  style={{ width: isMobile ? "24px" : "26px", height: isMobile ? "24px" : "26px" }}
                >
                  <ChevronLeft size={13} />
                </button>
                <div style={{ display: "flex", gap: "5px" }} aria-hidden="true">
                  {WIDGET_REVIEWS.map((r, i) => (
                    <span key={r.id} className={`fh-reviews-dot ${i === index ? "is-active" : ""}`} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => advance(1)}
                  aria-label="Next review"
                  className="fh-reviews-nav-btn"
                  style={{ width: isMobile ? "24px" : "26px", height: isMobile ? "24px" : "26px" }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
              <Link
                to="/reviews"
                data-track="reviews_click:floating_widget"
                style={{ fontSize: isMobile ? "0.7rem" : "0.75rem", fontWeight: 700, color: "var(--magenta)", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                See all reviews →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
