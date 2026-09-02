import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FISH_SUBCAT_SEO } from "@/lib/fish-subcat-seo";
import { BreadcrumbSchema } from "@/components/seo/schemas";
import { FishSubcatClient } from "./client";

interface Props {
  params: Promise<{ subcategory: string }>;
}

export async function generateStaticParams() {
  return Object.keys(FISH_SUBCAT_SEO).map((subcategory) => ({ subcategory }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subcategory: slug } = await params;
  const seo = FISH_SUBCAT_SEO[slug];
  if (!seo) return {};

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: `https://www.siligurifreshmart.com/fish/${slug}`,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://www.siligurifreshmart.com/fish/${slug}`,
      siteName: "Siliguri Fresh Mart",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412357/images_30_ptxsmz.jpg",
          width: 1200,
          height: 630,
          alt: `${seo.heroHeading} - Siliguri Fresh Mart`,
        },
      ],
    },
  };
}

export default async function FishSubcategoryPage({ params }: Props) {
  const { subcategory: slug } = await params;
  const seo = FISH_SUBCAT_SEO[slug];
  if (!seo) notFound();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Fresh Fish", url: "/fish" },
          { name: seo.heroHeading.split("—")[0].trim(), url: `/fish/${slug}` },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: seo.title,
            description: seo.description,
            url: `https://www.siligurifreshmart.com/fish/${slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: "Siliguri Fresh Mart",
              url: "https://www.siligurifreshmart.com",
            },
            about: {
              "@type": "Thing",
              name: `${seo.heroHeading.split("—")[0].trim()} in Siliguri`,
            },
            mainEntity: {
              "@type": "ItemList",
              name: seo.heroHeading,
              description: seo.content,
            },
          }),
        }}
      />

      <FishSubcatClient slug={slug} />
    </>
  );
}
