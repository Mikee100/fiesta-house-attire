import Navbar from "./Navbar";
import Footer from "./Footer";
import SEO from "./SEO";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, description, keywords, ogImage }) => {
  return (
    <div className="layout-wrapper">
      <SEO 
        title={title} 
        description={description} 
        keywords={keywords} 
        ogImage={ogImage} 
      />
      <Navbar />
      <main>{children}</main>
      <Footer />

      {/* Fixed Social Media Bar */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "0.5rem 0.3rem",
          background: "rgba(255,255,255,0.85)",
          borderRadius: "12px 0 0 12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
          alignItems: "center"
        }}
        aria-label="Social Media Links"
      >
        {/* Instagram */}
        <a href="https://instagram.com/fiestahousematernity" target="_blank" rel="noreferrer" aria-label="Instagram" style={{ color: '#B84FA0', fontSize: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B84FA0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>
        </a>
        {/* Facebook */}
        <a href="https://facebook.com/fiestahousematernity" target="_blank" rel="noreferrer" aria-label="Facebook" style={{ color: '#4267B2', fontSize: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4267B2" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 8.5h-2a1 1 0 0 0-1 1v2h3l-.5 3h-2.5v7h-3v-7H7v-3h2v-2a4 4 0 0 1 4-4h3v3z"/></svg>
        </a>
        {/* YouTube */}
        <a href="https://youtube.com/@fiestahousematernity" target="_blank" rel="noreferrer" aria-label="YouTube" style={{ color: '#FF0000', fontSize: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><polygon points="10 15 15 12 10 9 10 15"/></svg>
        </a>
        {/* Pinterest */}
        <a href="https://pinterest.com/fiestahousematernity" target="_blank" rel="noreferrer" aria-label="Pinterest" style={{ color: '#E60023', fontSize: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#E60023"/>
            <path d="M12 6.5c-3.1 0-5.1 2.2-5.1 4.6 0 1.1.4 2.1 1.3 2.5.1.1.2 0 .2-.1 0-.1.1-.4.1-.5 0-.2 0-.3-.1-.5-.2-.6-.1-1.1.3-1.5.4-.4 1.1-.6 1.7-.6 1.3 0 2.1.7 2.1 1.8 0 1.1-.5 2-1.2 2-.4 0-.7-.3-.6-.7.1-.4.3-.8.3-1.2 0-.3-.2-.6-.6-.6-.5 0-.8.5-.8 1.1 0 .4.1.7.1.7s-.3 1.2-.3 1.5c-.1.4-.1.8 0 1.1.1.2.3.2.4.2.2 0 .3-.1.4-.3.1-.3.4-1.1.4-1.4.1-.3.2-.4.4-.4.2 0 .3.2.3.4 0 .3-.2.7-.2 1 0 .3.2.5.5.5.6 0 1.1-.7 1.1-1.7 0-1.4-1.1-2.3-2.7-2.3z" fill="#fff"/>
          </svg>
        </a>
        {/* TikTok */}
        <a href="https://www.tiktok.com/@fiestahousematernity" target="_blank" rel="noreferrer" aria-label="TikTok" style={{ color: '#000', fontSize: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#000"/>
            <path d="M16.5 10.5c-1.1 0-2-.9-2-2V7h-1.2v7.1c0 .7-.6 1.3-1.3 1.3s-1.3-.6-1.3-1.3.6-1.3 1.3-1.3c.1 0 .2 0 .3 0v-1.2c-.1 0-.2 0-.3 0-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5c1.4 0 2.5-1.1 2.5-2.5V12c.6.5 1.3.8 2 .8v-1.3z" fill="#fff"/>
            <path d="M16.5 7c0 1.1.9 2 2 2V8c-.6 0-1-.4-1-1h-1z" fill="#25F4EE"/>
            <path d="M17.5 8c0 1.1.9 2 2 2V9c-.6 0-1-.4-1-1h-1z" fill="#FE2C55"/>
          </svg>
        </a>
      </div>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/254720111928?text=Hi%20Fiesta%20House%20Attire,%20I'd%20like%20to%20enquire%20about%20a%20maternity%20photoshoot%20session." 
        target="_blank" 
        rel="noreferrer"
        className="btn-whatsapp"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 999,
          fontSize: "1.5rem"
        }}
        aria-label="Chat on WhatsApp"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>
    </div>
  );
};

export default Layout;
