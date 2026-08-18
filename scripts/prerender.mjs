import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const siteUrl = (process.env.VITE_SITE_URL || "https://www.fiestahousematernity.com").replace(/\/$/, "");

const prerenderRoutes = [
  "/",
  "/about",
  "/portfolio",
  "/pricing",
  "/blog",
  "/contact",
  "/experience",
  "/maternity-gowns",
  "/videos",
  "/shop",
];

const rawApiUrl = process.env.PRERENDER_API_URL || process.env.VITE_API_URL || "http://localhost:5000";
const buildDate = new Date().toISOString().slice(0, 10);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getSafePathname(url = "/") {
  const pathname = decodeURIComponent(url.split("?")[0]).replace(/\\+/g, "/");
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

async function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || "application/octet-stream";
  const data = await fs.readFile(filePath);
  res.writeHead(200, { "Content-Type": contentType });
  res.end(data);
}

function createStaticServer() {
  return http.createServer(async (req, res) => {
    const pathname = getSafePathname(req.url || "/");
    const normalized = path.normalize(path.join(distDir, pathname));

    if (!normalized.startsWith(distDir)) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    try {
      const directFile = normalized;
      const indexFile = path.join(normalized, "index.html");

      if (await exists(directFile)) {
        const stat = await fs.stat(directFile);
        if (stat.isFile()) {
          await serveFile(directFile, res);
          return;
        }
      }

      if (await exists(indexFile)) {
        await serveFile(indexFile, res);
        return;
      }

      await serveFile(path.join(distDir, "index.html"), res);
    } catch {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });
}

async function writeRouteHtml(route, html) {
  const outputFile = route === "/"
    ? path.join(distDir, "index.html")
    : path.join(distDir, route.replace(/^\/+/, ""), "index.html");

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, `${html}\n`, "utf8");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
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
  if (["/portfolio", "/pricing", "/blog", "/maternity-gowns", "/videos"].includes(route)) return "0.8";
  if (["/about", "/contact", "/experience", "/shop"].includes(route)) return "0.7";
  if (route.startsWith("/portfolio/") || route.startsWith("/blog/")) return "0.7";
  return "0.6";
}

function collectPortfolioImageUrls(portfolio) {
  const urls = new Set();
  const cover = toAbsoluteUrl(portfolio?.cover_image_url);
  if (cover) urls.add(cover);

  if (Array.isArray(portfolio?.images)) {
    for (const item of portfolio.images) {
      if (typeof item === "string") {
        const absolute = toAbsoluteUrl(item);
        if (absolute) urls.add(absolute);
        continue;
      }

      const candidate = toAbsoluteUrl(item?.url);
      if (candidate) urls.add(candidate);
    }
  }

  return [...urls];
}

function normalizeRoute(route) {
  if (!route || typeof route !== "string") return null;
  const trimmed = route.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed === "/") return "/";
  return trimmed.replace(/\/$/, "");
}

function resolveApiBaseUrl() {
  if (!rawApiUrl || typeof rawApiUrl !== "string") return null;
  const trimmed = rawApiUrl.trim().replace(/\/$/, "");
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${siteUrl}${trimmed}`;
  }

  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchPublishedBlogPosts(apiBaseUrl) {
  const firstPage = await fetchJson(`${apiBaseUrl}/blog-posts?page=1&limit=100`);
  const initialPosts = Array.isArray(firstPage?.posts) ? firstPage.posts : [];
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1;

  if (totalPages <= 1) return initialPosts;

  const pages = [];
  for (let page = 2; page <= totalPages; page += 1) {
    pages.push(fetchJson(`${apiBaseUrl}/blog-posts?page=${page}&limit=100`));
  }

  const results = await Promise.allSettled(pages);
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const posts = Array.isArray(result.value?.posts) ? result.value.posts : [];
    initialPosts.push(...posts);
  }

  return initialPosts;
}

async function discoverDynamicRoutes() {
  const discovered = new Set();
  const imageEntries = [];
  const apiBaseUrl = resolveApiBaseUrl();

  if (!apiBaseUrl) {
    console.warn(`[prerender] dynamic route discovery skipped: invalid API URL '${rawApiUrl}'`);
    return { routes: [], imageEntries: [] };
  }

  try {
    const portfolios = await fetchJson(`${apiBaseUrl}/portfolios`);
    if (Array.isArray(portfolios)) {
      for (const item of portfolios) {
        const slug = typeof item?.slug === "string" ? item.slug : null;
        if (!slug) continue;

        const route = `/portfolio/${encodeURIComponent(slug)}`;
        discovered.add(route);

        const imageUrls = collectPortfolioImageUrls(item);
        if (imageUrls.length > 0) {
          imageEntries.push({
            route,
            title: item?.title || "Portfolio gallery",
            images: imageUrls,
          });
        }
      }
    }
  } catch (error) {
    console.warn(`[prerender] portfolio discovery skipped: ${error.message}`);
  }

  try {
    const posts = await fetchPublishedBlogPosts(apiBaseUrl);
    if (Array.isArray(posts)) {
      for (const item of posts) {
        const slug = typeof item?.slug === "string" ? item.slug : null;
        if (!slug) continue;

        const route = `/blog/${encodeURIComponent(slug)}`;
        discovered.add(route);

        const coverImage = toAbsoluteUrl(item?.cover_image_url);
        if (coverImage) {
          imageEntries.push({
            route,
            title: item?.title || "Blog post",
            images: [coverImage],
          });
        }
      }
    }
  } catch (error) {
    console.warn(`[prerender] blog discovery skipped: ${error.message}`);
  }

  return {
    routes: [...discovered].map(normalizeRoute).filter(Boolean),
    imageEntries,
  };
}

async function generateSitemaps(routes, imageEntries) {
  const orderedRoutes = [...new Set(routes)].sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

  const sitemapUrls = orderedRoutes
    .map((route) => {
      const absolute = `${siteUrl}${route}`;
      return [
        "  <url>",
        `    <loc>${escapeXml(absolute)}</loc>`,
        `    <lastmod>${buildDate}</lastmod>`,
        `    <priority>${getRoutePriority(route)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const sitemapXml = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    sitemapUrls,
    "</urlset>",
    "",
  ].join("\n");

  const imageUrls = imageEntries
    .filter((entry) => entry.images?.length)
    .map((entry) => {
      const pageUrl = `${siteUrl}${entry.route}`;
      const imageNodes = entry.images
        .map((imageUrl) => {
          const lines = [
            "    <image:image>",
            `      <image:loc>${escapeXml(imageUrl)}</image:loc>`,
          ];
          if (entry.title) {
            lines.push(`      <image:title>${escapeXml(entry.title)}</image:title>`);
          }
          lines.push("    </image:image>");
          return lines.join("\n");
        })
        .join("\n");

      return [
        "  <url>",
        `    <loc>${escapeXml(pageUrl)}</loc>`,
        imageNodes,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const imageSitemapXml = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">",
    imageUrls,
    "</urlset>",
    "",
  ].join("\n");

  await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemapXml, "utf8");
  await fs.writeFile(path.join(distDir, "image-sitemap.xml"), imageSitemapXml, "utf8");
  console.log(`[prerender] wrote sitemap.xml (${orderedRoutes.length} urls)`);
  console.log(`[prerender] wrote image-sitemap.xml (${imageEntries.length} pages)`);
}

async function prerenderRoutesToHtml(baseUrl, routes) {
  if (process.env.PRERENDER_SKIP_BROWSER === "true") {
    console.warn("[prerender] browser prerender skipped via PRERENDER_SKIP_BROWSER=true");
    return false;
  }

  let browser;
  try {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ...(executablePath ? { executablePath } : {}),
    });
  } catch (error) {
    console.warn(`[prerender] browser launch failed, skipping HTML prerender: ${error.message}`);
    return false;
  }

  try {
    console.log(`[prerender] route count: ${routes.length}`);

    for (const route of routes) {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);

      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });

        // Give Helmet one additional frame to flush head tags.
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(true))));

        const html = await page.content();
        await writeRouteHtml(route, html);
        console.log(`[prerender] wrote ${route}`);
      } catch (error) {
        console.warn(`[prerender] skipped ${route}: ${error.message}`);
      } finally {
        await page.close();
      }
    }

    return true;
  } finally {
    await browser.close();
  }
}

async function main() {
  const distExists = await exists(path.join(distDir, "index.html"));
  if (!distExists) {
    throw new Error("dist/index.html not found. Run `vite build` before prerendering.");
  }

  const server = createStaticServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(true));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not determine prerender server address.");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const dynamicData = await discoverDynamicRoutes();
    const routeSet = new Set([...prerenderRoutes, ...dynamicData.routes].map(normalizeRoute).filter(Boolean));
    const allRoutes = [...routeSet];

    const prerendered = await prerenderRoutesToHtml(baseUrl, allRoutes);
    if (!prerendered) {
      console.warn("[prerender] continuing without HTML snapshots (sitemaps will still be generated)");
    }
    await generateSitemaps(allRoutes, dynamicData.imageEntries);
    console.log("[prerender] complete");
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error("[prerender] failed", error);
  process.exitCode = 1;
});
