let appPromise;

const getApp = () => {
  appPromise ||= import("../backend/server.js").then((mod) => mod.default || mod);
  return appPromise;
};

export default async function handler(req, res) {
  const rawPath = req.query.path;
  const pathParts = Array.isArray(rawPath)
    ? rawPath.flatMap((item) => item.split("/").filter(Boolean))
    : typeof rawPath === "string"
      ? rawPath.split("/").filter(Boolean)
      : [];
  const pathname = `/${pathParts.map(encodeURIComponent).join("/")}`;

  if (pathname === "/_health") {
    return res.status(200).json({ ok: true, path: pathname });
  }

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

  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("Backend function failed", error);
    const message = error instanceof Error ? error.message : "Unknown backend error";
    const name = error instanceof Error ? error.name : "Error";
    return res.status(500).json({ error: "Backend function failed", name, message });
  }
}