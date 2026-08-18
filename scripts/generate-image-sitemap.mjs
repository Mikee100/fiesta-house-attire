import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const SITE_URL = (
  process.env.PRERENDER_SITE_URL ||
  process.env.VITE_SITE_URL ||
  "https://www.fiestahousematernity.com"
).replace(/\/$/, "");

const API_URL =
  process.env.PRERENDER_API_URL ||
  process.env.VITE_API_URL ||
  "http://localhost:5000";
const MATERNITY_GOWNS_FOLDER_ID = "b8b100e9-81ce-4778-bf57-0adee0b46fc0";

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function ensureEntry(map, pagePath) {
  if (!map.has(pagePath)) {
    map.set(pagePath, new Set());
  }
  return map.get(pagePath);
}

function addImage(map, pagePath, imageUrl) {
  const normalized = normalizeUrl(imageUrl);
  if (!normalized) return;
  ensureEntry(map, pagePath).add(normalized);
}

async function addPortfolioImages(map) {
  try {
    const portfolios = await fetchJson(`${API_URL}/portfolios`);
    if (!Array.isArray(portfolios)) return;

    for (const portfolio of portfolios) {
      const slug = typeof portfolio?.slug === "string" ? portfolio.slug.trim() : "";
      if (!slug) continue;

      const pagePath = `/portfolio/${encodeURIComponent(slug)}`;
      addImage(map, pagePath, portfolio?.cover_image_url);

      const images = Array.isArray(portfolio?.images) ? portfolio.images : [];
      for (const image of images) {
        const imageUrl = typeof image === "string" ? image : image?.url;
        addImage(map, pagePath, imageUrl);
      }
    }
  } catch (error) {
    console.warn(`[image-sitemap] portfolio image discovery skipped: ${error.message}`);
  }
}

async function addBlogImages(map) {
  try {
    const firstPage = await fetchJson(`${API_URL}/blog-posts?page=1&limit=100`);
    const firstPosts = Array.isArray(firstPage?.posts) ? firstPage.posts : [];
    const totalPages = Number(firstPage?.totalPages || 1);

    for (const post of firstPosts) {
      const slug = typeof post?.slug === "string" ? post.slug.trim() : "";
      if (!slug) continue;

      const pagePath = `/blog/${encodeURIComponent(slug)}`;
      addImage(map, pagePath, post?.cover_image_url);
    }

    for (let page = 2; page <= totalPages; page += 1) {
      const data = await fetchJson(`${API_URL}/blog-posts?page=${page}&limit=100`);
      const posts = Array.isArray(data?.posts) ? data.posts : [];
      for (const post of posts) {
        const slug = typeof post?.slug === "string" ? post.slug.trim() : "";
        if (!slug) continue;

        const pagePath = `/blog/${encodeURIComponent(slug)}`;
        addImage(map, pagePath, post?.cover_image_url);
      }
    }
  } catch (error) {
    console.warn(`[image-sitemap] blog image discovery skipped: ${error.message}`);
  }
}

async function addMaternityGownImages(map) {
  try {
    const pagePath = "/maternity-gowns";
    const firstPage = await fetchJson(`${API_URL}/assets?page=1&limit=100&folder_id=${encodeURIComponent(MATERNITY_GOWNS_FOLDER_ID)}`);
    const totalPages = Number(firstPage?.totalPages || 1);
    const firstAssets = Array.isArray(firstPage?.assets) ? firstPage.assets : [];

    for (const asset of firstAssets) {
      addImage(map, pagePath, asset?.url);
    }

    for (let page = 2; page <= totalPages; page += 1) {
      const data = await fetchJson(`${API_URL}/assets?page=${page}&limit=100&folder_id=${encodeURIComponent(MATERNITY_GOWNS_FOLDER_ID)}`);
      const assets = Array.isArray(data?.assets) ? data.assets : [];
      for (const asset of assets) {
        addImage(map, pagePath, asset?.url);
      }
    }
  } catch (error) {
    console.warn(`[image-sitemap] maternity gown image discovery skipped: ${error.message}`);
  }
}

function buildImageSitemapXml(pageToImages) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  const sortedPaths = [...pageToImages.keys()].sort((a, b) => a.localeCompare(b));
  for (const pagePath of sortedPaths) {
    const images = [...(pageToImages.get(pagePath) || [])].sort((a, b) => a.localeCompare(b));
    if (images.length === 0) continue;

    lines.push("  <url>");
    lines.push(`    <loc>${xmlEscape(`${SITE_URL}${pagePath}`)}</loc>`);
    for (const imageUrl of images) {
      lines.push("    <image:image>");
      lines.push(`      <image:loc>${xmlEscape(imageUrl)}</image:loc>`);
      lines.push("    </image:image>");
    }
    lines.push("  </url>");
  }

  lines.push("</urlset>");
  return `${lines.join("\n")}\n`;
}

async function main() {
  await fs.mkdir(distDir, { recursive: true });

  const pageToImages = new Map();
  await addPortfolioImages(pageToImages);
  await addBlogImages(pageToImages);
  await addMaternityGownImages(pageToImages);

  const xml = buildImageSitemapXml(pageToImages);
  const outputPath = path.join(distDir, "image-sitemap.xml");
  await fs.writeFile(outputPath, xml, "utf8");

  const urlCount = [...pageToImages.keys()].length;
  console.log(`[image-sitemap] wrote ${outputPath} with ${urlCount} page entries`);
}

main().catch((error) => {
  console.error("[image-sitemap] failed", error);
  process.exitCode = 1;
});
