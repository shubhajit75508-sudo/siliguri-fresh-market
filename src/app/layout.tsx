import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/providers/app-provider";
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
    icon: "https://res.cloudinary.com/dy9lll7y5/image/upload/w_192,h_192,c_fill/v1782149339/file_0000000087d8720badb85aa7c5d2a499_ynyyyu.png",
    apple: "https://res.cloudinary.com/dy9lll7y5/image/upload/w_192,h_192,c_fill/v1782149339/file_0000000087d8720badb85aa7c5d2a499_ynyyyu.png",
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
        <AppProvider>{children}</AppProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').then(() => {
                console.log('[SW] Registered');
              }).catch(() => {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
