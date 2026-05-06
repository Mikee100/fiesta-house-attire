import { Instagram } from "lucide-react";
import { motion } from "framer-motion";

const InstagramFeed = () => {
  const instagramPosts = [
    {
      id: 1,
      url: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887599212_IMG_9057-768x1152.jpg",
      link: "https://www.instagram.com/fiestahousematernity/"
    },
    {
      id: 2,
      url: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg",
      link: "https://www.instagram.com/fiestahousematernity/"
    },
    {
      id: 3,
      url: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg",
      link: "https://www.instagram.com/fiestahousematernity/"
    },
    {
      id: 4,
      url: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887596251_IMG_0053-1365x2048.jpg",
      link: "https://www.instagram.com/fiestahousematernity/"
    },
    {
      id: 5,
      url: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887595087_IMGL5485-scaled.jpg",
      link: "https://www.instagram.com/fiestahousematernity/"
    },
    {
      id: 6,
      url: "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598071_IMGL1316-460x460.jpg",
      link: "https://www.instagram.com/fiestahousematernity/"
    }
  ];

  return (
    <section className="overflow-hidden" style={{ backgroundColor: "var(--bg)", paddingTop: "8rem", paddingBottom: "8rem" }}>
      <div className="container">
        <div className="mobile-center" style={{ marginBottom: "3rem" }}>
          <span style={{ 
            color: "var(--magenta)", 
            textTransform: "uppercase", 
            letterSpacing: "0.2em", 
            fontSize: "0.9rem", 
            fontWeight: "600",
            display: "block",
            marginBottom: "1rem"
          }}>
            Get to know us better
          </span>
          <h2 className="display h2-mobile" style={{ fontSize: "3.5rem" }}>
            Let's connect on <span style={{ color: "var(--magenta)" }}>Instagram</span>
          </h2>
          <a 
            href="https://www.instagram.com/fiestahousematernity/" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-[var(--sky-blue)] hover:text-[var(--magenta)] transition-colors font-medium tracking-wide"
            style={{ fontSize: "1.1rem" }}
          >
            @fiestahousematernity <Instagram size={18} />
          </a>
        </div>
      </div>

      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {instagramPosts.map((post) => (
          <motion.a
            key={post.id}
            href={post.link}
            target="_blank"
            rel="noreferrer"
            className="relative aspect-square overflow-hidden group block"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: post.id * 0.1 }}
            viewport={{ once: true }}
          >
            <img 
              src={post.url} 
              alt="Instagram post" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <Instagram size={32} />
                <span className="text-xs uppercase tracking-widest font-bold">View Post</span>
              </div>
            </div>
          </motion.a>
        ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
