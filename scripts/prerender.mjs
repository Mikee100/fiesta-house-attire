/**
 * Prerender script — replaces Puppeteer with Vite SSR + react-dom/server.
 *
 * How it works:
 * 1. `vite build` (already run) produces the client bundle in dist/
 * 2. `vite build --ssr` (run here) compiles entry-server.tsx to dist/server/entry-server.js
 * 3. For each static route, we call render(url) from the server bundle
 * 4. We inject the returned HTML + head tags into the index.html shell
 * 5. We write the final HTML to dist/<route>/index.html
 *
 * This works on Vercel, Netlify, Railway, and any platform — no Chrome needed.
 */

import { build } from "vite";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const clientHtmlPath = path.join(distDir, "index.html");
const clientHtmlTemplatePath = path.join(distDir, ".index-template.html");
const siteUrl = (process.env.VITE_SITE_URL || "https://www.fiestahousematernity.com").replace(/\/$/, "");
const buildDate = new Date().toISOString().slice(0, 10);

// ─── Static routes to prerender ──────────────────────────────────────────────
const STATIC_ROUTES = [
  "/",
  "/about",
  "/portfolio",
  "/pricing",
  "/blog",
  "/contact",
  "/privacy-policy",
  "/experience",
  "/maternity-gowns",
  "/videos",
  "/shop",
  "/maternity-photoshoot",
  "/planning-guide",
  "/when-to-do-maternity-photos",
  "/what-to-wear-maternity-photoshoot",
  "/maternity-photoshoot-ideas",
  "/family-maternity-photoshoot",
  "/faq",
];

// ─── Utilities ────────────────────────────────────────────────────────────────
async function exists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toAbsoluteUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${siteUrl}${url}`;
  return null;
}

function getRoutePriority(route) {
  if (route === "/") return "1.0";
  const highPriority = ["/maternity-photoshoot", "/planning-guide", "/when-to-do-maternity-photos", "/what-to-wear-maternity-photoshoot", "/family-maternity-photoshoot", "/maternity-photoshoot-ideas", "/faq"];
  if (highPriority.includes(route)) return "0.9";
  if (["/portfolio", "/pricing", "/blog", "/maternity-gowns", "/videos"].includes(route)) return "0.8";
  if (["/about", "/contact", "/experience", "/shop"].includes(route)) return "0.7";
  if (route.startsWith("/portfolio/") || route.startsWith("/blog/")) return "0.8";
  return "0.6";
}

function removeStaticSeoFallbacks(html) {
  return html
    .replace(/\s*<title>[^<]*<\/title>/i, "")
    .replace(/\s*<meta\s+name=["'](?:description|keywords|robots|googlebot|theme-color|twitter:[^"']+)["'][^>]*>/gi, "")
    .replace(/\s*<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, "");
}

function collectPortfolioImageUrls(portfolio) {
  const urls = new Set();
  const cover = toAbsoluteUrl(portfolio?.cover_image_url);
  if (cover) urls.add(cover);
  if (Array.isArray(portfolio?.images)) {
    for (const item of portfolio.images) {
      const candidate = toAbsoluteUrl(typeof item === "string" ? item : item?.url);
      if (candidate) urls.add(candidate);
    }
  }
  return [...urls];
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function getClientHtmlShell() {
  if (await exists(clientHtmlTemplatePath)) {
    return fs.readFile(clientHtmlTemplatePath, "utf-8");
  }

  const html = await fs.readFile(clientHtmlPath, "utf-8");
  if (!html.includes('<div id="root"></div>')) {
    throw new Error("dist/index.html has already been prerendered. Run `vite build` before rerunning prerender.");
  }

  await fs.writeFile(clientHtmlTemplatePath, html, "utf-8");
  return html;
}

// ─── Step 1: Build the SSR bundle ─────────────────────────────────────────────
async function buildSsrBundle() {
  console.log("[prerender] building SSR bundle...");
  await build({
    root: projectRoot,
    build: {
      ssr: true,
      rollupOptions: {
        input: path.join(projectRoot, "src/entry-server.tsx"),
        output: { format: "esm" },
      },
      outDir: path.join(distDir, "server"),
      emptyOutDir: true,
    },
    // Suppress Vite's default output during SSR build
    logLevel: "warn",
  });
  console.log("[prerender] SSR bundle built.");
}

// ─── Step 2: Discover dynamic routes (blog posts, portfolio slugs) ────────────
async function discoverDynamicRoutes() {
  const rawApiUrl = process.env.PRERENDER_API_URL || process.env.VITE_API_URL || "";
  if (!rawApiUrl) {
    console.warn("[prerender] VITE_API_URL not set, skipping dynamic route discovery");
    return { routes: [], imageEntries: [] };
  }

  const apiBase = rawApiUrl.replace(/\/$/, "");
  const discovered = new Set();
  const imageEntries = [];

  try {
    const portfolios = await fetchJson(`${apiBase}/portfolios`);
    if (Array.isArray(portfolios)) {
      for (const item of portfolios) {
        const slug = typeof item?.slug === "string" ? item.slug : null;
        if (!slug) continue;
        const route = `/portfolio/${encodeURIComponent(slug)}`;
        discovered.add(route);
        const images = collectPortfolioImageUrls(item);
        if (images.length) imageEntries.push({ route, title: item?.title || "Portfolio", images });
      }
    }
  } catch (err) {
    console.warn(`[prerender] portfolio discovery failed: ${err.message}`);
  }

  try {
    const firstPage = await fetchJson(`${apiBase}/blog-posts?page=1&limit=100`);
    const posts = Array.isArray(firstPage?.posts) ? firstPage.posts : [];
    for (const item of posts) {
      const slug = typeof item?.slug === "string" ? item.slug : null;
      if (!slug) continue;
      const route = `/blog/${encodeURIComponent(slug)}`;
      discovered.add(route);
      const coverImage = toAbsoluteUrl(item?.cover_image_url);
      if (coverImage) imageEntries.push({ route, title: item?.title || "Blog post", images: [coverImage] });
    }
  } catch (err) {
    console.warn(`[prerender] blog discovery failed: ${err.message}`);
  }

  return { routes: [...discovered], imageEntries };
}

// ─── Step 3: Prerender HTML for each route ────────────────────────────────────
async function prerenderRoutes(allRoutes) {
  const serverEntry = path.join(distDir, "server", "entry-server.js");
  if (!(await exists(serverEntry))) {
    throw new Error(`SSR bundle not found at ${serverEntry}. Did the SSR build succeed?`);
  }

  // Import the compiled server bundle
  const { render } = await import(`file:///${serverEntry.replace(/\\/g, "/")}`);

  // Read the client HTML shell (produced by `vite build`)
  const indexHtml = await getClientHtmlShell();

  console.log(`[prerender] rendering ${allRoutes.length} routes...`);
  let successCount = 0;

  for (const route of allRoutes) {
    try {
      const { html: appHtml, head } = await render(route);

      // Inject rendered HTML and head tags into the shell
      let pageHtml = indexHtml;
      if (head) {
        pageHtml = removeStaticSeoFallbacks(pageHtml);
        pageHtml = pageHtml.replace("</head>", `${head}\n</head>`);
      }
      pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

      // Write to dist/<route>/index.html
      const outputFile = route === "/"
        ? path.join(distDir, "index.html")
        : path.join(distDir, route.replace(/^\/+/, ""), "index.html");

      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      await fs.writeFile(outputFile, pageHtml, "utf-8");
      successCount++;
      console.log(`[prerender] ✓ ${route}`);
    } catch (err) {
      console.warn(`[prerender] ✗ ${route}: ${err.message}`);
    }
  }

  console.log(`[prerender] ${successCount}/${allRoutes.length} routes rendered.`);
}

// ─── Step 4: Write static sitemaps ────────────────────────────────────────────
async function generateSitemaps(allRoutes, imageEntries) {
  const orderedRoutes = [...new Set(allRoutes)].sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

  // sitemap.xml
  const sitemapUrls = orderedRoutes.map((route) => {
    const loc = `${siteUrl}${route === "/" ? "/" : route}`;
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${buildDate}</lastmod>`,
      `    <priority>${getRoutePriority(route)}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapUrls,
    "</urlset>",
    "",
  ].join("\n");

  await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemapXml, "utf-8");
  console.log(`[prerender] wrote sitemap.xml (${orderedRoutes.length} urls)`);

  // image-sitemap.xml
  const imageUrlBlocks = imageEntries
    .filter((e) => e.images?.length)
    .map((e) => {
      const pageUrl = `${siteUrl}${e.route}`;
      const imageTags = e.images.map((u) =>
        ["    <image:image>", `      <image:loc>${escapeXml(u)}</image:loc>`, `      <image:title>${escapeXml(e.title)}</image:title>`, "    </image:image>"].join("\n")
      ).join("\n");
      return ["  <url>", `    <loc>${escapeXml(pageUrl)}</loc>`, imageTags, "  </url>"].join("\n");
    }).join("\n");

  const imageSitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    imageUrlBlocks,
    "</urlset>",
    "",
  ].join("\n");

  await fs.writeFile(path.join(distDir, "image-sitemap.xml"), imageSitemapXml, "utf-8");
  console.log(`[prerender] wrote image-sitemap.xml (${imageEntries.length} pages)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!(await exists(clientHtmlPath))) {
    throw new Error("dist/index.html not found. Run `vite build` before prerendering.");
  }

  // Build the SSR bundle (no browser needed)
  await buildSsrBundle();

  // Discover blog + portfolio dynamic routes
  const { routes: dynamicRoutes, imageEntries } = await discoverDynamicRoutes();

  // Combine static + dynamic routes (deduped)
  const allRoutes = [...new Set([...STATIC_ROUTES, ...dynamicRoutes])];

  // Render each route to static HTML
  await prerenderRoutes(allRoutes);

  // Write sitemaps
  await generateSitemaps(allRoutes, imageEntries);

  // Clean up the temporary server bundle
  try {
    await fs.rm(path.join(distDir, "server"), { recursive: true, force: true });
  } catch {
    // Non-fatal if cleanup fails
  }

  console.log("[prerender] complete ✓");
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exitCode = 1;
});
