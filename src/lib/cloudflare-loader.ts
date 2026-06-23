// Custom image loader — returns the original URL.
// This bypasses Next.js /_next/image proxy which fails on Vercel
// for external domains, while still using <Image> for layout props.
export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return src;
}
