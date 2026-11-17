"use client";

/**
 * Custom next/image loader.
 *
 * Vercel bills every image that passes through `/_next/image` (source-image
 * transformations + bandwidth). Cloudinary already does resizing, format
 * negotiation and compression on its own CDN, so we hand the transform
 * straight to Cloudinary and skip Vercel's optimizer entirely.
 *
 * Local images (`/logo.png`) and other remote hosts are returned untouched.
 */
type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

const CLOUDINARY_PATH = "/image/upload/";

export default function imageLoader({ src, width }: ImageLoaderProps): string {
  if (!src || !src.includes("res.cloudinary.com") || !src.includes(CLOUDINARY_PATH)) {
    return src;
  }

  // Leave vector assets alone — raster transforms can break them.
  if (/\.svg(?:$|\?)/i.test(src)) return src;

  const [base, rest] = src.split(CLOUDINARY_PATH);
  if (!base || !rest) return src;

  // `c_limit` never upscales past the original, `f_auto`/`q_auto` let
  // Cloudinary pick the smallest format (AVIF/WebP) and quality per device.
  const transform = `f_auto,q_auto,w_${width},c_limit`;
  return `${base}${CLOUDINARY_PATH}${transform}/${rest}`;
}
