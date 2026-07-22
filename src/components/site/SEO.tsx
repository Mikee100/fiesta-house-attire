import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  ogImage = 'https://app.fiestahouseattire.com/og-image.jpg',
  ogUrl = 'https://app.fiestahouseattire.com',
  ogType = 'website',
  canonical,
  noindex = false,
  nofollow = false
}) => {
  const fullTitle = title ? `${title} | Fiesta House Attire` : "Fiesta House Attire | Luxury Maternity Photography Nairobi";
  const defaultDescription = "Fiesta House Attire is Nairobi's premier luxury maternity studio. Exclusive designer gowns, professional makeup, and editorial photography in a private studio.";
  const metaDescription = description || defaultDescription;
  const defaultKeywords = "maternity photoshoot nairobi, luxury maternity photography, pregnancy photoshoot, nairobi maternity studio, designer maternity gowns, baby bump photoshoot kenya";
  const metaKeywords = keywords ? `${defaultKeywords}, ${keywords}` : defaultKeywords;
  const robotsContent = `${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical || ogUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
