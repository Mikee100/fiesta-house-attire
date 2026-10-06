import type { AssetRecord } from "@/lib/api";

export const RECENT_MASTERPIECES_COUNT = 15;

export const studioFallbackImages = [
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1785868048311_IMG_5587-scaled.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1778154974695_IMG_4156-683x1024.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1778154967097_34%20-%20Copy.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887595087_IMGL5485-scaled.jpg",
  "https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1778151876880_IMG_6287-scaled.jpg",
];

export const homeImageKey = (src: string): string => {
  const url = new URL(src, "https://local.invalid");
  const path = decodeURIComponent(url.pathname)
    .replace("/storage/v1/render/image/public/", "/storage/v1/object/public/")
    .replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  return `${url.origin}${path}`;
};

const studioFallbackKeys = new Set(studioFallbackImages.map(homeImageKey));

export const splitHomeGallery = (assets: AssetRecord[]) => {
  const studioImages: string[] = [];
  const recentAssets: AssetRecord[] = [];
  const seen = new Set<string>();

  for (const asset of assets) {
    const key = homeImageKey(asset.url);
    if (seen.has(key)) continue;
    seen.add(key);
    let hash = 2166136261;
    for (const character of key) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    if (studioFallbackKeys.has(key) || (hash >>> 0) < 0x80000000) studioImages.push(asset.url);
    else if (recentAssets.length < RECENT_MASTERPIECES_COUNT) recentAssets.push(asset);
  }

  for (const image of studioFallbackImages) {
    if (studioImages.length >= 6) break;
    if (!seen.has(homeImageKey(image))) studioImages.push(image);
  }

  return { studioImages, recentAssets };
};