/**
 * Build an optimized Cloudinary delivery URL.
 *
 * Images are served directly from Cloudinary (f_auto, q_auto) instead of
 * going through Astro's `/_image` optimizer. That avoids downloading +
 * re-encoding every remote image on the server per request (measured ~8s
 * for a ~2MB file in dev) and lets the CDN do format/quality negotiation.
 *
 * Only the transformations you ask for are inserted — no width by default.
 * This matters because some assets reject `w_` / `c_fill` transforms with a
 * Cloudinary 400 (e.g. large already-encoded webp sources); callers that
 * want a width must pass it explicitly.
 */
export function cloudinary(
  src: string,
  opts: { w?: number; q?: number | "auto"; f?: string } = {},
): string {
  if (!src.includes("res.cloudinary.com")) return src;

  const parts: string[] = [];
  if (opts.f) parts.push(`f_${opts.f}`);
  if (opts.q !== undefined) parts.push(`q_${opts.q}`);
  if (opts.w) parts.push(`w_${opts.w}`);

  if (parts.length === 0) return src;

  // Insert the transformation segment right after /upload/, e.g.
  // .../image/upload/v1234/a.webp -> .../image/upload/f_webp,q_55/v1234/a.webp
  // If a transformation segment already exists, leave the URL untouched.
  return src.replace(/\/upload\/(?!f_|w_|q_|c_)/, `/upload/${parts.join(",")}/`);
}
