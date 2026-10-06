import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Expand, Pause, Play, X } from "lucide-react";
import { studioFallbackImages } from "@/lib/home-gallery";

type StoryMedia = {
  kind: "image" | "video";
  src: string;
  label: string;
  crop?: "portrait" | "detail";
  poster?: string;
};

export type StudioSet = {
  name: string;
  detail: string;
  img: string;
  media?: StoryMedia[];
};

const studioSets: StudioSet[] = [
  { name: "The Master Staircase", detail: "Regal architecture for sweeping silhouettes.", img: studioFallbackImages[0] },
  { name: "Flower Gardens", detail: "Immersive floral arrangements in full bloom.", img: studioFallbackImages[1] },
  { name: "The Minimalist Loft", detail: "Shadow and light editorial storytelling.", img: studioFallbackImages[2] },
  { name: "Elegant Swings", detail: "Capture the lightness of being.", img: studioFallbackImages[3] },
  { name: "Cinematic Boat", detail: "Serene aquatic poetic reflection.", img: studioFallbackImages[4] },
  { name: "The Grand Chandelier", detail: "High-glamour lighting and reflections.", img: studioFallbackImages[5] },
];

const getMedia = (set: StudioSet): StoryMedia[] => set.media?.length ? set.media : [
  { kind: "image", src: set.img, label: "Full composition" },
  { kind: "image", src: set.img, label: "Portrait crop", crop: "portrait" },
  { kind: "image", src: set.img, label: "Detail crop", crop: "detail" },
];

const cropStyle = (crop?: StoryMedia["crop"]) => ({
  transform: crop === "detail" ? "scale(1.85)" : crop === "portrait" ? "scale(1.25)" : undefined,
  transformOrigin: "center 35%",
});

export default function StudioSetGallery({ sets = studioSets, images }: { sets?: StudioSet[]; images?: string[] }) {
  const [activeSet, setActiveSet] = useState<StudioSet | null>(null);
  const [slide, setSlide] = useState(0);
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failedMedia, setFailedMedia] = useState<string[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const visible = useRef(false);
  const openedFrom = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const showcase = images !== undefined;
  const collection = [...new Set(images?.length ? images : sets.map(item => item.img))];
  const displayedSets: StudioSet[] = showcase ? collection.slice(0, 6).map((_, index) => {
    const selectedIndex = (offset + index) % collection.length;
    const orderedImages = [...collection.slice(selectedIndex), ...collection.slice(0, selectedIndex)];
    return {
      name: `Studio portrait ${selectedIndex + 1}`,
      detail: "Fiesta House Maternity",
      img: collection[selectedIndex],
      media: orderedImages.map((src, mediaIndex) => ({ kind: "image", src, label: `Portrait ${(selectedIndex + mediaIndex) % collection.length + 1}` })),
    };
  }) : sets;
  const set = activeSet;
  const media = set ? getMedia(set) : [];
  const current = media[slide];
  const navigate = (direction: number) => setSlide(previous => (previous + direction + media.length) % media.length);
  const iconButton = "flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/25 text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  useEffect(() => {
    if (!showcase) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => { preference.removeEventListener("change", updatePreference); observer.disconnect(); };
  }, [showcase]);

  useEffect(() => {
    if (!showcase || paused || reducedMotion || activeSet || collection.length < 2) return;
    const timer = window.setInterval(() => {
      if (visible.current && document.visibilityState === "visible") setOffset(previous => (previous + 1) % collection.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [showcase, paused, reducedMotion, activeSet, collection.length]);

  return (
    <section ref={sectionRef} className="section-padding" style={{ backgroundColor: "white" }}>
      <div className="container">
        <div className="mobile-center relative pr-14" style={{ marginBottom: "3.5rem" }}>
          <span style={{ color: "var(--magenta)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.85rem", fontWeight: "600" }}>The Environments</span>
          <h2 className="display h2-mobile" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)", marginTop: "0.6rem" }}>Curated Studio Masterpieces</h2>
          {showcase && !reducedMotion && collection.length > 1 && (
            <button type="button" aria-label={paused ? "Resume photo rotation" : "Pause photo rotation"} title={paused ? "Resume photo rotation" : "Pause photo rotation"} onClick={() => setPaused(previous => !previous)} className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-sm border border-black/20 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--magenta)]">
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          )}
        </div>
        <Dialog.Root open={activeSet !== null} onOpenChange={open => { if (!open) setActiveSet(null); }}>
          <div className="grid grid-3" style={{ gap: "3.5rem 2.5rem" }}>
            {displayedSets.map((item, index) => (
              <div key={index} className="group">
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    aria-label={`Explore ${item.name}`}
                    onClick={event => { openedFrom.current = event.currentTarget; setActiveSet(item); setSlide(0); }}
                    className={`relative block aspect-[4/5] w-full overflow-hidden rounded-[2px] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--magenta)] ${showcase ? "" : "mb-8"}`}
                  >
                    <img key={item.img} src={item.img} alt={item.name} width={1200} height={1500} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 motion-safe:animate-in motion-safe:fade-in motion-safe:group-hover:scale-105" onError={event => { const fallback = sets[index % sets.length]?.img; if (fallback && event.currentTarget.getAttribute("src") !== fallback) event.currentTarget.src = fallback; }} />
                    <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-sm bg-black/60 text-white"><Expand size={18} aria-hidden="true" /></span>
                  </button>
                </Dialog.Trigger>
                {!showcase && <>
                  <h3 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{item.name}</h3>
                  <p style={{ fontSize: "0.95rem", opacity: 0.6, lineHeight: "1.6" }}>{item.detail}</p>
                </>}
              </div>
            ))}
          </div>
          {set && current && (
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black" />
              <Dialog.Content
                className="fixed inset-0 z-[10001] flex h-[100dvh] min-h-0 flex-col bg-[#141414] text-white focus:outline-none"
                onCloseAutoFocus={event => { event.preventDefault(); openedFrom.current?.focus(); }}
                onKeyDown={event => {
                  if ((event.target as HTMLElement).closest("video")) return;
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    navigate(event.key === "ArrowRight" ? 1 : -1);
                  }
                }}
              >
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/15 px-4 py-3 sm:px-8">
                  <div className="min-w-0">
                    <Dialog.Title className="display break-words text-xl tracking-normal sm:text-2xl">{set.name}</Dialog.Title>
                    <Dialog.Description className="mt-1 text-xs text-white/65 sm:text-sm">{set.detail}</Dialog.Description>
                  </div>
                  <Dialog.Close className={iconButton} aria-label="Close gallery" title="Close gallery"><X size={20} /></Dialog.Close>
                </header>
                <div
                  className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-3 sm:px-20"
                  onTouchStart={event => {
                    if ((event.target as HTMLElement).closest("video")) return;
                    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
                  }}
                  onTouchEnd={event => {
                    const start = touchStart.current;
                    touchStart.current = null;
                    if (!start) return;
                    const deltaX = event.changedTouches[0].clientX - start.x;
                    const deltaY = event.changedTouches[0].clientY - start.y;
                    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) navigate(deltaX < 0 ? 1 : -1);
                  }}
                  onTouchCancel={() => { touchStart.current = null; }}
                >
                  {failedMedia.includes(current.src) ? (
                    <p role="status" className="text-center text-sm text-white/70">This media is unavailable.</p>
                  ) : current.kind === "video" ? (
                    <video key={current.src} src={current.src} poster={current.poster} controls playsInline preload="metadata" aria-label={current.label} className="h-full w-full object-contain" onError={() => setFailedMedia(previous => [...previous, current.src])} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center overflow-hidden">
                      <img key={`${slide}-${current.src}`} src={current.src} alt={`${set.name} - ${current.label}`} decoding="async" className="h-full w-full object-contain" style={cropStyle(current.crop)} onError={() => setFailedMedia(previous => [...previous, current.src])} />
                    </div>
                  )}
                  {media.length > 1 && <>
                    <button type="button" aria-label="Previous image" title="Previous image" onClick={() => navigate(-1)} className={`${iconButton} absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 sm:left-6`}><ArrowLeft size={20} /></button>
                    <button type="button" aria-label="Next image" title="Next image" onClick={() => navigate(1)} className={`${iconButton} absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 sm:right-6`}><ArrowRight size={20} /></button>
                  </>}
                </div>
                <footer className="shrink-0 border-t border-white/15 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs text-white/75" aria-live="polite" aria-atomic="true">
                    <span>{current.label}</span><span>{slide + 1} / {media.length}</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto py-1">
                    {media.map((item, index) => (
                      <button key={`${item.src}-${index}`} type="button" aria-label={`View ${item.label}`} aria-pressed={slide === index} title={item.label} onClick={() => setSlide(index)} className={`relative h-14 w-12 shrink-0 overflow-hidden rounded-sm border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-16 sm:w-14 ${slide === index ? "border-white" : "border-transparent opacity-50 hover:opacity-100"}`}>
                        <img src={item.kind === "video" ? item.poster || set.img : item.src} alt="" className="h-full w-full object-cover" style={cropStyle(item.crop)} />
                        {item.kind === "video" && <span className="absolute inset-0 flex items-center justify-center bg-black/30"><Play size={18} aria-hidden="true" /></span>}
                      </button>
                    ))}
                  </div>
                </footer>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </Dialog.Root>
      </div>
    </section>
  );
}