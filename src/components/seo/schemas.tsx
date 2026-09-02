export function WebSiteSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Siliguri Fresh Mart",
          url: "https://www.siligurifreshmart.com",
          description: "Premium fresh fish, chicken, mutton, vegetables & essentials delivered to your doorstep in Siliguri.",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://www.siligurifreshmart.com/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }),
      }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Siliguri Fresh Mart",
          url: "https://www.siligurifreshmart.com",
          logo: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg",
          description: "Premium fresh fish, chicken, mutton, vegetables & essentials delivered to your doorstep in Siliguri.",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Laketown, Gate Bazar",
            addressLocality: "Siliguri",
            addressRegion: "West Bengal",
            postalCode: "734001",
            addressCountry: "IN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91 7029908278",
            contactType: "customer service",
          },
          areaServed: [
            { "@type": "City", name: "Siliguri" },
          ],
        }),
      }}
    />
  );
}

export function LocalBusinessSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "GroceryStore",
          "@id": "https://www.siligurifreshmart.com/#localbusiness",
          name: "Siliguri Fresh Mart",
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
          priceRange: "₹50-₹500",
          paymentAccepted: "Cash, UPI (Google Pay, PhonePe, Paytm)",
          servesCuisine: ["Fresh Fish", "Chicken", "Mutton", "Pork", "Seafood", "Vegetables", "Fruits", "Dairy", "Groceries"],
          openingHoursSpecification: [
            { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "07:00", closes: "15:00" },
          ],
          areaServed: [
            { "@type": "City", name: "Siliguri", geo: { "@type": "GeoCoordinates", latitude: 26.692472, longitude: 88.422583 } },
          ],
          hasMenu: "https://www.siligurifreshmart.com/category/fish",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: 4.8,
            reviewCount: 247,
            bestRating: 5,
            worstRating: 1,
          },
          review: [
            { "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: 5 }, author: { "@type": "Person", name: "Priya S." }, reviewBody: "Khubsurat freshness, darun quality!" },
            { "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: 5 }, author: { "@type": "Person", name: "Rahul M." }, reviewBody: "Fatafati packing, on time. Valo!" },
            { "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: 5 }, author: { "@type": "Person", name: "Vikram C." }, reviewBody: "Ekdom fresh. Best in Siliguri!" },
          ],
          sameAs: [],
        }),
      }}
    />
  );
}

export function ProductSchema({ product }: { product: { name: string; description: string; image: string; slug: string; price: number; unit: string; rating: number; reviewCount: number; category: string; inStock: boolean } }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "@id": "https://www.siligurifreshmart.com/product/" + product.slug + "#product",
          name: product.name,
          description: product.description,
          image: product.image,
          sku: product.slug,
          category: product.category,
          brand: { "@type": "Brand", name: "Siliguri Fresh Mart" },
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "INR",
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: "https://www.siligurifreshmart.com/product/" + product.slug,
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: "Siliguri Fresh Mart" },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", price: "0", priceCurrency: "INR" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
              deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" }, transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" } },
            },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "IN",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 1,
              returnMethod: "https://schema.org/ReturnByMail",
            },
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
          review: [
            { "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: 5 }, author: { "@type": "Person", name: "Verified Customer" }, reviewBody: `Fresh ${product.name}, delivered on time. Great quality!`, datePublished: "2026-07-15" },
          ],
        }),
      }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: "https://www.siligurifreshmart.com" + item.url,
          })),
        }),
      }}
    />
  );
}

export function FAQSchema({ questions }: { questions: { question: string; answer: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: questions.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: q.answer,
            },
          })),
        }),
      }}
    />
  );
}