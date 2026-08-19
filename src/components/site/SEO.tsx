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

const SITE_NAME = 'Fiesta House Attire';
const DEFAULT_OG_IMAGE = 'https://www.fiestahousematernity.com/og-image.jpg';
const DEFAULT_OG_URL = 'https://www.fiestahousematernity.com';
const BRAND_THEME_COLOR = '#330b25'; // --plum

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  ogImage = DEFAULT_OG_IMAGE,
  ogUrl = DEFAULT_OG_URL,
  ogType = 'website',
  canonical,
  noindex = false,
  nofollow = false
}) => {
  // Avoid double-appending brand name if the title already contains it
  const hasBrand = title ? title.includes(SITE_NAME) || title.includes('Fiesta House') : false;
  const fullTitle = title
    ? hasBrand
      ? title
      : `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Luxury Maternity Photography Nairobi`;

  const defaultDescription = "Fiesta House Attire is Nairobi's premier luxury maternity studio. Exclusive designer gowns, professional makeup, and editorial photography in a private studio.";
  const metaDescription = description || defaultDescription;
  const defaultKeywords = "maternity photoshoot nairobi, luxury maternity photography, pregnancy photoshoot, nairobi maternity studio, designer maternity gowns, baby bump photoshoot kenya";
  const metaKeywords = keywords ? `${defaultKeywords}, ${keywords}` : defaultKeywords;
  const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
  const resolvedOgUrl = canonical || ogUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="theme-color" content={BRAND_THEME_COLOR} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedOgUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Fiesta House Attire – Luxury Maternity Photography Nairobi" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={resolvedOgUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="Fiesta House Attire – Luxury Maternity Photography Nairobi" />
      <meta name="twitter:domain" content="fiestahousematernity.com" />
    </Helmet>
  );
};

export default SEO;
