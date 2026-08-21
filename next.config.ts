import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },

      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
    unoptimized: true,
  },

  // Security headers
  async headers() {
    return [
      // Block search engines from private routes
      {
        source: "/(admin|delivery|auth|api|checkout|account)(/.*)?",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://connect.facebook.net",
              "object-src 'none'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.tile.openstreetmap.org https://raw.githubusercontent.com https://res.cloudinary.com https://picsum.photos https://fastly.picsum.photos https://www.facebook.com https://connect.facebook.net",
              "font-src 'self' data:",
              "media-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://nominatim.openstreetmap.org https://connect.facebook.net https://www.facebook.com",
              "frame-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

