import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/data";
import { DELIVERY_ZONES } from "@/lib/zones";
import { FISH_SUBCAT_SEO } from "@/lib/fish-subcat-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.siligurifreshmart.com";

  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/fish`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/policies/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/shipping`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/returns`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/cancellation`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/reviews`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const fishSubcatPages: MetadataRoute.Sitemap = Object.keys(FISH_SUBCAT_SEO).map((slug) => ({
    url: `${baseUrl}/fish/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const zonePages: MetadataRoute.Sitemap = DELIVERY_ZONES.map((z) => ({
    url: `${baseUrl}/siliguri/${z.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...fishSubcatPages, ...zonePages, ...productPages, ...categoryPages];
}
