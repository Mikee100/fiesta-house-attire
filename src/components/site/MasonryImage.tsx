import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { cld } from "@/lib/cloudinary";

interface MasonryImageProps {
  src: string;
  alt: string;
  className?: string;
  defaultAspectRatio?: string;
  priority?: boolean;
  width?: number;
  height?: number;
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
  width = 1200,
  height = 1600,
  onMouseOver,
  onMouseOut,
  style,
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedSrc = cld(src, width);

  useEffect(() => {
    setLoaded(false);

    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [optimizedSrc]);

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
      {!loaded && <div className="brand-skeleton-overlay" />}

      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
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
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={handleLoad}
        onError={() => setLoaded(true)}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      />
    </div>
  );
};

export default MasonryImage;

