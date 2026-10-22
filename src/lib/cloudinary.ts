export const cld = (url: string | null | undefined, w = 600): string => {
  if (!url) return "";

  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);

  if (!url.includes("res.cloudinary.com") || uploadIndex === -1) {
    return url;
  }

  const prefixEnd = uploadIndex + uploadMarker.length;
  const remainder = url.slice(prefixEnd);
  const segments = remainder.split("/");

  // Collect consecutive transformation segments, including slash-separated ones.
  const transformationParts: string[] = [];
  let consumedSegments = 0;

  const isTransformation = (part: string): boolean =>
    /^(?:f_[\w.-]+|q_[\w.-]+|w_\d+|h_\d+|c_[\w.-]+|g_[\w.-]+|ar_[\w:.-]+|dpr_[\w.-]+|e_[\w.-]+|r_[\w.-]+|b_[\w.-]+|bo_[\w.,-]+|fl_[\w.-]+|t_[\w.-]+|x_[\w.-]+|y_[\w.-]+|z_[\w.-]+)$/.test(part);

  for (const segment of segments) {
    const parts = segment.split(",");

    if (!segment || !parts.every(isTransformation)) {
      break;
    }

    transformationParts.push(...parts);
    consumedSegments++;
  }

  // Keep crop/effect settings, but replace format, quality and width consistently.
  const preserved = transformationParts.filter(
    (part) => !/^(?:f_|q_|w_)/.test(part)
  );

  const transformations = [
    ...preserved,
    "f_auto",
    "q_auto",
    `w_${Math.max(1, Math.round(w))}`,
  ].join(",");

  const remainingPath = segments.slice(consumedSegments).join("/");

  return (
    url.slice(0, prefixEnd) +
    transformations +
    (remainingPath ? "/" + remainingPath : "")
  );
};
