import type { Metadata } from "next";
import { getCategories } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  const name = category?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const title = "Buy Fresh " + name + " Online in Siliguri | Home Delivery in 30 Min";
  const description = "Order farm-fresh " + name.toLowerCase() + " online in Siliguri. Premium quality, free delivery above Rs.299, cut to order. Fresh from local market to your doorstep in 30 minutes.";

  return {
    title,
    description,
    keywords: [
      name.toLowerCase() + " delivery Siliguri",
      "buy " + name.toLowerCase() + " online",
      "fresh food Siliguri",
      "online grocery",
    ],
    openGraph: { title, description },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
