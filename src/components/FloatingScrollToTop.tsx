import { useEffect, useState } from "react";

export default function FloatingScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-5 right-3 md:bottom-6 md:right-4 z-[9999] inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 shadow-lg transition-[opacity,background-color,color,transform] duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--signature)] hover:text-white hover:scale-105 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
        <path d="M10 15V5M10 5L5 10M10 5L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
