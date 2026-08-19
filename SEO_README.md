# 🚀 Fiesta House Maternity — Complete SEO Documentation & Guide

**Live Domain**: [https://www.fiestahousematernity.com](https://www.fiestahousematernity.com)  
**Primary Brand**: Fiesta House Maternity  
**Location**: Diamond Plaza II, 4th Floor, Parklands, Nairobi, Kenya  

---

## 📋 Table of Contents
1. [Overview & Strategy](#overview--strategy)
2. [Technical SEO Architecture](#technical-seo-architecture)
3. [Sitemaps & Google Search Console](#sitemaps--google-search-console)
4. [Structured Data & Rich Snippets (Schema.org)](#structured-data--rich-snippets-schemaorg)
5. [OpenGraph & Social Sharing Previews](#opengraph--social-sharing-previews)
6. [Target Keywords & Content Strategy](#target-keywords--content-strategy)
7. [Robots.txt & Crawl Budget](#robotstxt--crawl-budget)
8. [Maintenance & Best Practices for New Content](#maintenance--best-practices-for-new-content)

---

## 🎯 Overview & Strategy

The SEO strategy for **Fiesta House Maternity** focuses on dominating high-intent, luxury maternity searches in Nairobi and Kenya:
- **Core Intent**: Expectant mothers and families looking for high-end studio pregnancy photoshoots, luxury gown rentals, and makeup packages in Nairobi.
- **Visual-First Indexing**: Because photography is highly visual, image sitemaps and high-resolution schema image arrays are configured to capture traffic from **Google Images**.
- **Local Authority**: Rich `PhotographyBusiness` schema with exact GPS coordinates and Parklands address establishes strong local Google Maps and local pack visibility.

---

## 🏗 Technical SEO Architecture

### 1. Unified Domain Configuration
All endpoints, canonical links, sitemaps, and OpenGraph tags are anchored to:
```
https://www.fiestahousematernity.com
```

### 2. The Dynamic SEO Component (`src/components/site/SEO.tsx`)
Every page uses the centralized `<SEO />` component (via `<Layout />`), which handles:
- **Smart Title Formatting**: Automatically appends `| Fiesta House Maternity` while preventing accidental double-branding (keeping titles under the optimal 60-character SERP cutoff).
- **Meta Descriptions**: Dynamic per-page descriptions (140–160 chars) loaded into both standard `<meta>` and OpenGraph tags.
- **Canonical Tags**: Automatic full-URL canonical tags to eliminate duplicate content issues between trailing slashes and parameter URLs.
- **Theme Color**: `<meta name="theme-color" content="#330b25">` matches the luxury Espresso Plum brand aesthetic on mobile browsers.

### 3. Static Pre-Render Fallbacks (`index.html`)
Single Page Applications (SPAs) built with React can sometimes produce blank link previews if crawlers (e.g., WhatsApp, Telegram, iMessage, Twitter bot) don't execute client-side JavaScript.
- **Solution**: High-priority OpenGraph and Twitter card tags are baked directly into the static HTML header of `index.html`.

---

## 🗺 Sitemaps & Google Search Console

All sitemaps are dynamically generated live from the database in `backend/server.js` with 1-hour caching.

### 1. Main Page Sitemap: `/sitemap.xml`
- **URL**: `https://www.fiestahousematernity.com/sitemap.xml`
- **Contents**:
  - All core routes (`/`, `/portfolio`, `/maternity-gowns`, `/pricing`, `/blog`, `/videos`, `/experience`, `/about`, `/contact`, `/shop`)
  - All published blog posts (`/blog/:slug`)
  - All published portfolios (`/portfolio/:slug`)
- **Attributes**: Includes `<loc>`, `<lastmod>`, `<changefreq>`, and `<priority>`.

### 2. Visual Image Sitemap: `/image-sitemap.xml`
- **URL**: `https://www.fiestahousematernity.com/image-sitemap.xml`
- **Contents**: Maps every portfolio image, gown photo, and gallery asset to its corresponding webpage.
- **Search Console Fix**: Configured with deterministic seed images so Google Search Console will never encounter a 0-item error even during database reloads.

### 3. Google Search Console Checklist
To verify or re-index your sitemaps in Search Console:
1. Log into [Google Search Console](https://search.google.com/search-console).
2. Select property: `https://www.fiestahousematernity.com/` (or domain property).
3. In the left navigation, click **Sitemaps**.
4. Submit:
   - `sitemap.xml`
   - `image-sitemap.xml`
5. Status should display **Success** with discovered pages and images.

---

## 🏷 Structured Data & Rich Snippets (Schema.org)

JSON-LD schemas provide Google with direct knowledge-graph data about the business and pages:

| Page | Schema `@type` | Purpose / Rich Snippet |
|---|---|---|
| **Home (`/`)** | `PhotographyBusiness` | Local pack snippet, opening hours, pricing tier, phone, address, and social profiles (`sameAs`). |
| **Home (`/`)** | `WebSite` | Sitelinks Search Box eligibility on Google search results. |
| **Blog Articles (`/blog/:slug`)** | `BlogPosting` | Article carousel snippet, author credit, date published, and article image. |
| **Portfolios (`/portfolio/:slug`)** | `ImageGallery` | Visual rich results for photography galleries. |
| **Contact (`/contact`)** | `ContactPage` | Direct customer support contact metadata. |
| **All Main Pages** | `BreadcrumbList` | Displays clickable navigation hierarchy in Google SERPs (e.g. `Home > Pricing & Packages`). |

---

## 📱 OpenGraph & Social Sharing Previews

When a link to Fiesta House is shared on social media or messaging platforms, the following meta tags generate preview cards:

- `og:site_name`: **Fiesta House Maternity**
- `og:locale`: **en_KE**
- `og:image`: High-resolution 1200×630 branded image (`https://www.fiestahousematernity.com/og-image.jpg`)
- `twitter:card`: `summary_large_image`
- `twitter:domain`: `fiestahousematernity.com`

---

## 🔑 Target Keywords & Content Strategy

### Primary Keywords (High Volume & Intent)
- `luxury maternity photography nairobi`
- `maternity photoshoot nairobi`
- `best maternity photographer kenya`
- `designer maternity gowns nairobi`
- `pregnancy photoshoot pricing kenya`
- `baby bump photoshoot nairobi`

### Long-Tail & Niche Keywords
- `maternity studio diamond plaza parklands`
- `maternity gowns for hire in nairobi`
- `couples maternity photoshoot ideas kenya`
- `cinematic pregnancy film studio nairobi`
- `maternity photoshoot with makeup and hair nairobi`

---

## 🤖 Robots.txt & Crawl Budget

- **URL**: `https://www.fiestahousematernity.com/robots.txt`
- **Configuration**:
  ```text
  User-agent: *
  Allow: /
  Disallow: /admin
  Disallow: /cart
  Disallow: /checkout

  Sitemap: https://www.fiestahousematernity.com/sitemap.xml
  Sitemap: https://www.fiestahousematernity.com/image-sitemap.xml
  ```
- **Benefits**: Protects administrative endpoints and checkout sessions from being indexed, concentrating crawler budget purely on public, ranking-worthy pages.

---

## 🛠 Maintenance & Best Practices for New Content

### When publishing a new Blog Post:
1. Ensure the **Title** is descriptive and includes target keywords (e.g., *"What to Wear for Your Nairobi Maternity Photoshoot"*).
2. Write a captivating **Excerpt** (1–2 sentences) — this automatically becomes the Google meta description and social card preview.
3. Upload a **Featured Cover Image** in landscape orientation (at least 1200×630px).
4. The backend will automatically add the new post to `/sitemap.xml` and `/image-sitemap.xml` with zero extra configuration.

### When creating a new Portfolio Collection:
1. Provide a unique title (e.g., *"Silk & Radiance Maternity Collection"*).
2. Set high-resolution cover and gallery images.
3. The portfolio will immediately appear in the image sitemap.

---

*Last Updated: August 2026 | Maintained by Fiesta House Maternity Tech & Creative Team*
