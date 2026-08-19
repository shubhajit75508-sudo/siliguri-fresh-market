import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/delivery/", "/auth/", "/api/", "/checkout", "/account/", "/track/"],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot"],
        allow: "/",
      },
      {
        userAgent: ["ClaudeBot", "Claude-User"],
        allow: "/",
      },
      {
        userAgent: ["PerplexityBot", "Perplexity-User"],
        allow: "/",
      },
      {
        userAgent: ["Google-Extended"],
        allow: "/",
      },
      {
        userAgent: ["CCBot"],
        allow: "/",
      },
      {
        userAgent: ["Bingbot", "BingWebBot"],
        allow: "/",
      },
      {
        userAgent: ["Amazonbot"],
        allow: "/",
      },
    ],
    sitemap: "https://www.siligurifreshmart.com/sitemap.xml",
  };
}
