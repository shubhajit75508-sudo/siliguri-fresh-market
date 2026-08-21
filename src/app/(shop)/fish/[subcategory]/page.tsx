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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "GroceryStore",
            "@id": "https://www.siligurifreshmart.com#localbusiness",
            name: "Siliguri Fresh Mart",
            description: `Order ${seo.heroHeading.split("—")[0].trim()} online in Siliguri. Fresh, cleaned, and delivered in 30 minutes.`,
            image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg",
            telephone: "+91 7029908278",
            email: "siligurifreshmart@gmail.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Laketown, Gate Bazar",
              addressLocality: "Siliguri",
              addressRegion: "West Bengal",
              postalCode: "734001",
              addressCountry: "IN",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: 26.692472,
              longitude: 88.422583,
            },
            url: "https://www.siligurifreshmart.com",
            areaServed: [
              {
                "@type": "City",
                name: "Siliguri",
                containedInPlace: {
                  "@type": "State",
                  name: "West Bengal",
                },
              },
            ],
            priceRange: "₹50-₹500",
            paymentAccepted: "Cash, UPI (Google Pay, PhonePe, Paytm)",
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "07:00",
                closes: "15:00",
              },
            ],
          }),
        }}
      />

      <FishSubcatClient slug={slug} />
    </>
  );
}
