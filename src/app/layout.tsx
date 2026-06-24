import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/providers/app-provider";
import { RootSplash } from "@/components/ui/root-splash";
import { ServiceWorker } from "@/components/ui/service-worker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Siliguri Fresh Mart — Fresh Market Delivered in Minutes",
    template: "%s | Siliguri Fresh Mart",
  },
  description:
    "Premium fresh fish, chicken, mutton, vegetables & essentials delivered to your doorstep in Siliguri in 10-30 minutes.",
  keywords: [
    "Siliguri",
    "fresh fish delivery",
    "chicken delivery",
    "grocery delivery",
    "quick commerce",
    "fresh mart",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_192,h_192,c_fill/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg",
    apple: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_192,h_192,c_fill/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fresh Mart",
  },
  openGraph: {
    title: "Siliguri Fresh Mart",
    description: "Fresh Market Delivered To Your Doorstep",
    images: ["/logo.png"],
    locale: "en_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a1f1c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <RootSplash />
        <ServiceWorker />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
