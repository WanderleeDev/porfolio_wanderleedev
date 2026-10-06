/**
 * Build an optimized Cloudinary delivery URL.
 *
 * Images are served directly from Cloudinary (f_auto, q_auto) instead of
 * going through Astro's `/_image` optimizer. That avoids downloading +
 * re-encoding every remote image on the server per request (measured ~8s
 * for a ~2MB file in dev) and lets the CDN do format/quality negotiation.
 */
export function cloudinary(
  src: string,
  opts: { w?: number; q?: number | "auto" } = {}
): string {
  const { w = 800, q = "auto" } = opts;
  if (!src.includes("res.cloudinary.com")) return src;
  // Insert the transformation segment right after /upload/, e.g.
  // .../image/upload/v1234/a.webp -> .../image/upload/f_auto,q_auto,w_800/v1234/a.webp
  // If a transformation segment already exists, leave the URL untouched.
  return src.replace(/\/upload\/(?!f_|w_|q_|c_)/, `/upload/f_auto,q_${q},w_${w}/`);
}
