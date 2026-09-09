import app from "../../backend/server.js";

export default function handler(req, res) {
  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : typeof req.query.path === "string"
      ? req.query.path.split("/").filter(Boolean)
      : [];
  const pathname = `/${pathParts.map(encodeURIComponent).join("/")}`;
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  const search = searchParams.toString();
  req.url = search ? `${pathname}?${search}` : pathname;

  return app(req, res);
}