import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/providers/app-provider";
import { RootSplash } from "@/components/ui/root-splash";
import { ServiceWorker } from "@/components/ui/service-worker";
import { OrganizationSchema, LocalBusinessSchema, WebSiteSchema } from "@/components/seo/schemas";
import { DynamicMeta } from "@/components/seo/dynamic-meta";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteTitle = "Siliguri Fresh Mart \u2014 Fresh Market Delivered in Minutes";
const siteDesc = "Premium fresh fish, chicken, mutton, vegetables & essentials delivered to your doorstep in Siliguri. Free delivery on all orders.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.siligurifreshmart.com"),
  title: {
    default: siteTitle,
    template: "%s | Siliguri Fresh Mart",
  },
  description: siteDesc,
  keywords: [
    "Siliguri",
    "fresh fish delivery Siliguri",
    "chicken delivery Siliguri",
    "fish home delivery",
    "chicken home delivery",
    "online grocery Siliguri",
    "fresh meat delivery",
    "mutton delivery Siliguri",
    "vegetables home delivery",
    "quick commerce Siliguri",
    "fresh mart",
    "buy fish online",
    "buy chicken online",
  ],
  verification: {
    google: "yypj9B4kzQiGI6eX0_VAJdFfZbUQGfcwY7LNmfOlobI",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Siliguri Freshmart",
  },
  openGraph: {
    title: "Siliguri Fresh Mart",
    description: siteDesc,
    url: "https://www.siligurifreshmart.com",
    siteName: "Siliguri Fresh Mart",
    images: [{ url: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782373060/og-image_uhkk9p.png", width: 1200, height: 630 }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Siliguri Fresh Mart \u2014 Fresh Market Delivered in Minutes",
    description: siteDesc,
    images: ["https://res.cloudinary.com/dc5fh5afb/image/upload/v1782373060/og-image_uhkk9p.png"],
  },
  alternates: {
    canonical: "https://www.siligurifreshmart.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2D7D3A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={"" + inter.variable + " h-full"}>
      <body className="min-h-full flex flex-col antialiased">
        <OrganizationSchema />
        <LocalBusinessSchema />
        <WebSiteSchema />
        <DynamicMeta />
        <MetaPixel />
        <RootSplash />
        <ServiceWorker />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
