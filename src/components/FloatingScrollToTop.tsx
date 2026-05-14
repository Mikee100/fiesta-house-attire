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
      className={`fixed bottom-6 right-6 z-[9999] rounded-full p-2 shadow-lg transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-primary/70 bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ minWidth: 40, minHeight: 40 }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15V5M10 5L5 10M10 5L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
