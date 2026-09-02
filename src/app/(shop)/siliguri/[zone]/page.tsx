import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DELIVERY_ZONES, getZoneBySlug } from "@/lib/zones";
import { BreadcrumbSchema } from "@/components/seo/schemas";
import { ZonePageClient } from "./client";

interface Props {
  params: Promise<{ zone: string }>;
}

export async function generateStaticParams() {
  return DELIVERY_ZONES.map((z) => ({ zone: z.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zone: slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) return {};

  return {
    title: zone.metaTitle,
    description: zone.metaDescription,
    alternates: { canonical: `https://www.siligurifreshmart.com/siliguri/${zone.slug}` },
    openGraph: {
      title: zone.metaTitle,
      description: zone.metaDescription,
      url: `https://www.siligurifreshmart.com/siliguri/${zone.slug}`,
      siteName: "Siliguri Fresh Mart",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title: zone.metaTitle, description: zone.metaDescription },
  };
}

export default async function ZonePage({ params }: Props) {
  const { zone: slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) notFound();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Siliguri", url: "/siliguri" },
          { name: zone.name, url: `/siliguri/${zone.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "GroceryStore",
            "@id": `https://www.siligurifreshmart.com/siliguri/${zone.slug}#localbusiness`,
            name: "Siliguri Fresh Mart",
            description: zone.description,
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
              latitude: zone.lat,
              longitude: zone.lng,
            },
            url: "https://www.siligurifreshmart.com",
            areaServed: [
              {
                "@type": "Place",
                name: zone.label,
                geo: { "@type": "GeoCoordinates", latitude: zone.lat, longitude: zone.lng },
              },
            ],
            priceRange: "₹50-₹500",
            paymentAccepted: "Cash, UPI (Google Pay, PhonePe, Paytm)",
            servesCuisine: ["Fresh Fish", "Chicken", "Mutton", "Pork", "Seafood", "Vegetables", "Fruits", "Dairy"],
            openingHoursSpecification: [
              { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "07:00", closes: "15:00" },
            ],
          }),
        }}
      />
      <ZonePageClient zone={zone} />
    </>
  );
}
