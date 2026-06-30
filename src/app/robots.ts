import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/delivery/", "/auth/", "/api/", "/checkout", "/account/", "/track/"],
      },
    ],
    sitemap: "https://www.siligurifreshmart.com/sitemap.xml",
  };
}
