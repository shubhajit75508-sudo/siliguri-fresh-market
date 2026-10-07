import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { HomeClient } from "./home-client";
import { homeFaqs } from "@/lib/home-faqs";
import * as data from "@/lib/data";

const url = "https://www.siligurifreshmart.com";

/** Sections render four cards each, so that is all we bake into the HTML. */
const HOME_SECTION_LIMIT = 4;

/**
 * Rebuild the static home page every minute so baked stock/prices stay close
 * to live, while clients still get an instant paint from the HTML.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fresh Fish, Chicken, Mutton & Vegetables Delivery in Siliguri | Siliguri Freshmart",
  description:
    "Order fresh fish (rohu, katla, hilsa, prawns), chicken, mutton, vegetables, fruits & daily essentials online in Siliguri. Direct from local market, cut to order, delivered to your doorstep. Free delivery above ₹299.",
  alternates: {
    canonical: url + "/",
  },
  openGraph: {
    title: "Fresh Fish, Chicken, Mutton & Vegetables Delivery in Siliguri | Siliguri Freshmart",
    description:
      "Order fresh fish (rohu, katla, hilsa, prawns), chicken, mutton, vegetables, fruits & daily essentials online in Siliguri. Direct from local market, cut to order, delivered to your doorstep.",
    url: url + "/",
    siteName: "Siliguri Freshmart",
    type: "website",
    locale: "en_IN",
  },
};

/**
 * Prefetch everything HomeClient reads so the prerendered HTML ships real
 * content instead of skeletons. Only the keys the home page actually uses are
 * fetched — deliberately not the full catalog, which would add ~80KB of
 * dehydrated JSON to every response.
 */
async function buildHomeCache() {
  const queryClient = new QueryClient();

  try {
    const categories = await queryClient.fetchQuery({
      queryKey: ["categories"],
      queryFn: data.getCategories,
    });

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["products", "flash-deals"],
        queryFn: data.getFlashDeals,
      }),
      ...categories.map((cat) =>
        queryClient.prefetchQuery({
          queryKey: ["products", "category", cat.slug, HOME_SECTION_LIMIT],
          queryFn: () => data.getProductsByCategory(cat.slug, HOME_SECTION_LIMIT),
        })
      ),
    ]);
  } catch {
    // A failed prefetch must never fail the build — the page still renders and
    // the client fetches whatever is missing after hydration.
  }

  const state = dehydrate(queryClient);

  // Bake data but stamp it as stale so React Query refreshes it in the
  // background on mount. The visitor paints instantly from static HTML and
  // still ends up with live stock/prices within a second or two.
  for (const query of Object.values(state.queries)) {
    if (query.state) query.state.dataUpdatedAt = 0;
  }

  return state;
}

export default async function HomePage() {
  const homeCache = await buildHomeCache();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HydrationBoundary state={homeCache}>
        <HomeClient />
      </HydrationBoundary>
    </>
  );
}
