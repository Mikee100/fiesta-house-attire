export const cld = (url: string | null | undefined, w = 600): string => {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*(f_auto|q_auto|w_\d+)/.test(url)) return url; // already transformed
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${w}/`);
};