import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MasonryImageProps {
  src: string;
  alt: string;
  className?: string;
  defaultAspectRatio?: string; // e.g. "3/4" or "4/5" or "16/9"
  priority?: boolean; // Set to true for above-the-fold images to preload
  onMouseOver?: React.MouseEventHandler<HTMLImageElement>;
  onMouseOut?: React.MouseEventHandler<HTMLImageElement>;
  style?: React.CSSProperties;
}

const MasonryImage: React.FC<MasonryImageProps> = ({
  src,
  alt,
  className,
  defaultAspectRatio = "3/4",
  priority = false,
  onMouseOver,
  onMouseOut,
  style,
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached/loaded upon mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <div
      className="masonry-image-container"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: "2px",
        backgroundColor: "var(--cream)",
        aspectRatio: loaded ? "auto" : defaultAspectRatio,
        transition: "aspect-ratio 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
    >
      {/* Luxury Brand Gradient Pulse Skeleton Overlay */}
      {!loaded && (
        <>
          <style>{`
            @keyframes brandSkeletonPulse {
              0% { opacity: 0.6; background-position: 0% 50%; }
              50% { opacity: 0.95; background-position: 100% 50%; }
              100% { opacity: 0.6; background-position: 0% 50%; }
            }
            .brand-skeleton-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 2;
              background: linear-gradient(135deg, var(--cream) 0%, var(--magenta-tint) 50%, var(--sky-blue-tint) 100%);
              background-size: 200% 200%;
              animation: brandSkeletonPulse 2.5s ease-in-out infinite;
              pointer-events: none;
              transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }
          `}</style>
          <div className="brand-skeleton-overlay" />
        </>
      )}

      {/* The Image Element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn("w-full h-auto block select-none", className)}
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? "scale(1)" : "scale(1.02)",
          transition: priority
            ? "opacity 0.25s ease-out, transform 0.25s ease-out, filter 0.2s ease"
            : "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease",
          willChange: "opacity, transform",
        }}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleLoad}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      />
    </div>
  );
};

export default MasonryImage;
