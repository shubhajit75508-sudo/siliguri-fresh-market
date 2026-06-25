import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/data";
import { ProductSchema } from "@/components/seo/schemas";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found | Siliguri Fresh Mart" };
  }

  const title = "Buy " + product.name + " Online in Siliguri | Free Home Delivery";
  const description = product.name + " — Rs." + product.price + "/" + product.unit + ". " + (product.discount ? product.discount + "% off. " : "") + "Fresh daily from local market. Free delivery above Rs.299. " + (product.cuts?.length ? "Cut to order. " : "") + (product.cleaningOptions?.length ? "Cleaning available. " : "") + "Order now on Siliguri Fresh Mart.";

  return {
    title,
    description,
    keywords: [
      product.name.toLowerCase(),
      product.name.toLowerCase() + " delivery Siliguri",
      product.category,
      "fresh food delivery",
      "online grocery Siliguri",
    ],
    openGraph: {
      title,
      description,
      images: [{ url: product.image, width: 800, height: 800 }],
      type: "website",
    },
  };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return (
    <>
      {product && <ProductSchema product={product} />}
      {children}
    </>
  );
}
