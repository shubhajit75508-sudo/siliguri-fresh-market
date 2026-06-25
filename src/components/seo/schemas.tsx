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
          description: "Premium fresh fish, chicken, mutton, vegetables & essentials delivered to your doorstep in Siliguri in 10-30 minutes.",
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
          logo: "https://www.siligurifreshmart.com/logo.png",
          description: "Premium fresh fish, chicken, mutton, vegetables & essentials delivered to your doorstep in Siliguri.",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Siliguri",
            addressRegion: "West Bengal",
            postalCode: "734001",
            addressCountry: "IN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-9876543210",
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
          "@type": "LocalBusiness",
          name: "Siliguri Fresh Mart",
          image: "https://www.siligurifreshmart.com/logo.png",
          telephone: "+91-9876543210",
          email: "hello@siligurifreshmart.com",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Siliguri",
            addressRegion: "West Bengal",
            postalCode: "734001",
            addressCountry: "IN",
          },
          url: "https://www.siligurifreshmart.com",
          openingHoursSpecification: [
            { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "06:00", closes: "22:00" },
          ],
          areaServed: ["Hakimpara","Pradhan Nagar","Matigara","Bagdogra","Siliguri Town","Champasari","Sukna","Burdwan Road"],
          priceRange: "",
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
          name: product.name,
          description: product.description,
          image: product.image,
          sku: product.slug,
          category: product.category,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "INR",
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: "https://www.siligurifreshmart.com/product/" + product.slug,
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
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
