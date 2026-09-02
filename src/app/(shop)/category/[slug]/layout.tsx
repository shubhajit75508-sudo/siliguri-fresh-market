import type { Metadata } from "next";
import { getCategories } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  const name = category?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  const title = "Buy Fresh " + name + " Online in Siliguri | Fresh Home Delivery";
  const description = "Order farm-fresh " + name.toLowerCase() + " online in Siliguri. Premium quality, cut to order. Fresh from local market to your doorstep.";

  return {
    title,
    description,
    keywords: [
      name.toLowerCase() + " delivery Siliguri",
      "buy " + name.toLowerCase() + " online",
      "fresh food Siliguri",
      "online grocery",
    ],
    alternates: {
      canonical: "https://www.siligurifreshmart.com/category/" + slug,
    },
    openGraph: { title, description, url: "https://www.siligurifreshmart.com/category/" + slug },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}