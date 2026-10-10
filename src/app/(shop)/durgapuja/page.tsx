import type { Metadata } from "next";
import { DURGA_PUJA_SEO } from "@/lib/durgapuja-seo";
import { BreadcrumbSchema } from "@/components/seo/schemas";
import { DurgaPujaClient } from "./durgapuja-client";

export const metadata: Metadata = {
  title: DURGA_PUJA_SEO.title,
  description: DURGA_PUJA_SEO.description,
  keywords: DURGA_PUJA_SEO.keywords,
  alternates: {
    canonical: "https://www.siligurifreshmart.com/durgapuja",
  },
  openGraph: {
    title: DURGA_PUJA_SEO.title,
    description: DURGA_PUJA_SEO.description,
    url: "https://www.siligurifreshmart.com/durgapuja",
    siteName: "Siliguri Freshmart",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://www.siligurifreshmart.com/og-durgapuja.jpg",
        width: 1200,
        height: 630,
        alt: `${DURGA_PUJA_SEO.heroHeading} - Siliguri Freshmart`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DURGA_PUJA_SEO.title,
    description: DURGA_PUJA_SEO.description,
    images: ["https://www.siligurifreshmart.com/og-durgapuja.jpg"],
  },
};

export default function DurgaPujaPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Durga Puja 2026 Special", url: "/durgapuja" },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: "Durga Puja 2026 in Siliguri - Fresh Fish & Meat Delivery by Siliguri Freshmart",
            description: DURGA_PUJA_SEO.description,
            url: "https://www.siligurifreshmart.com/durgapuja",
            image: "https://www.siligurifreshmart.com/og-durgapuja.jpg",
            startDate: DURGA_PUJA_SEO.startDate,
            endDate: DURGA_PUJA_SEO.endDate,
            eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: {
              "@type": "Place",
              name: "Siliguri, West Bengal",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Siliguri",
                addressRegion: "West Bengal",
                postalCode: "734001",
                addressCountry: "IN",
              },
            },
            organizer: {
              "@type": "Organization",
              name: "Siliguri Freshmart",
              url: "https://www.siligurifreshmart.com",
              telephone: "+91 7029908278",
            },
            offers: {
              "@type": "Offer",
              url: "https://www.siligurifreshmart.com/durgapuja",
              price: "100",
              priceCurrency: "INR",
              priceValidUntil: "2026-10-21",
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },
            performer: {
              "@type": "Organization",
              name: "Siliguri Freshmart",
              url: "https://www.siligurifreshmart.com",
            },
            about: {
              "@type": "Thing",
              name: "Same-day fresh fish and meat delivery for Durga Puja in Siliguri",
            },
          }),
        }}
      />

      <DurgaPujaClient />
    </>
  );
}