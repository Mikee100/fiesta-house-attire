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
      <style>{`
        @keyframes slideInSocial {
          from {
            transform: translateY(-50%) translateX(50px);
            opacity: 0;
          }
          to {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
        }
        
        .social-fixed-bar {
          position: fixed;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding: 0.8rem 0.5rem;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px 0 0 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-right: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          align-items: center;
          animation: slideInSocial 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        
        .social-btn {
          display: flex !important;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #ffffff !important;
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          text-decoration: none;
        }
        
        .social-btn:hover {
          transform: scale(1.18) translateX(-4px);
        }
        
        .social-instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
        }
        .social-instagram:hover {
          box-shadow: 0 8px 24px rgba(220, 39, 67, 0.5) !important;
        }
        
        .social-facebook {
          background: #1877F2 !important;
        }
        .social-facebook:hover {
          box-shadow: 0 8px 24px rgba(24, 119, 242, 0.5) !important;
        }
        
        .social-youtube {
          background: #FF0000 !important;
        }
        .social-youtube:hover {
          box-shadow: 0 8px 24px rgba(255, 0, 0, 0.5) !important;
        }
        
        .social-pinterest {
          background: #E60023 !important;
        }
        .social-pinterest:hover {
          box-shadow: 0 8px 24px rgba(230, 0, 37, 0.5) !important;
        }
        
        .social-tiktok {
          background: #000000 !important;
        }
        .social-tiktok:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55) !important;
        }
      `}</style>
      <div className="social-fixed-bar" aria-label="Social Media Links">
        {/* Instagram */}
        <a 
          href="https://instagram.com/fiestahousematernity" 
          target="_blank" 
          rel="noreferrer" 
          aria-label="Instagram" 
          className="social-btn social-instagram"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </a>
        {/* Facebook */}
        <a 
          href="https://facebook.com/fiestahousematernity" 
          target="_blank" 
          rel="noreferrer" 
          aria-label="Facebook" 
          className="social-btn social-facebook"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
          </svg>
        </a>
        {/* YouTube */}
        <a 
          href="https://youtube.com/@fiestahousematernity" 
          target="_blank" 
          rel="noreferrer" 
          aria-label="YouTube" 
          className="social-btn social-youtube"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
        {/* Pinterest */}
        <a 
          href="https://pinterest.com/fiestahousematernity" 
          target="_blank" 
          rel="noreferrer" 
          aria-label="Pinterest" 
          className="social-btn social-pinterest"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.27 2.68 7.91 6.47 9.39-.09-.8-.17-2.03.03-2.91l1.14-4.83s-.29-.58-.29-1.44c0-1.35.78-2.36 1.76-2.36.83 0 1.23.62 1.23 1.37 0 .83-.53 2.08-.8 3.23-.23.97.49 1.76 1.44 1.76 1.73 0 3.06-1.83 3.06-4.47 0-2.33-1.68-3.97-4.07-3.97-2.78 0-4.41 2.08-4.41 4.24 0 .84.32 1.74.73 2.24.08.1.09.19.07.29l-.27 1.11c-.04.18-.15.22-.34.14-1.28-.6-1.99-2.48-1.99-3.99 0-3.25 2.36-6.23 6.8-6.23 3.57 0 6.34 2.54 6.34 5.94 0 3.55-2.23 6.4-5.32 6.4-1.04 0-2.02-.54-2.35-1.18l-.64 2.44c-.23.88-.86 1.99-1.28 2.68C10.02 21.79 11.01 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
        </a>
        {/* TikTok */}
        <a 
          href="https://www.tiktok.com/@fiestahousematernity" 
          target="_blank" 
          rel="noreferrer" 
          aria-label="TikTok" 
          className="social-btn social-tiktok"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
