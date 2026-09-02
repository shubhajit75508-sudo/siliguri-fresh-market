import type { Metadata } from "next";
import { MapPin, Phone, Clock, Truck, Star, Shield, Leaf, Users, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - Siliguri Fresh Mart | Our Story",
  description: "Meet the founder behind Siliguri Fresh Mart - a solo entrepreneur on a mission to deliver the freshest fish, meat, and vegetables to every doorstep in Siliguri.",
  alternates: { canonical: "https://www.siligurifreshmart.com/about" },
  openGraph: {
    title: "About Siliguri Fresh Mart - Fresh Fish & Meat Delivery",
    description: "A Siliguri-based hyperlocal startup delivering fresh fish, chicken, mutton & vegetables. Founded by a local entrepreneur who grew up at the fish market.",
    url: "https://www.siligurifreshmart.com/about",
    siteName: "Siliguri Fresh Mart",
    type: "website",
    locale: "en_IN",
    images: [{ url: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Siliguri Fresh Mart",
    description: "A Siliguri-based hyperlocal startup delivering fresh fish, meat & vegetables. Founded by a local entrepreneur.",
  },
};

export default function AboutPage() {
  return (
    <div className="py-8 sm:py-10 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Siliguri Fresh Mart",
            url: "https://www.siligurifreshmart.com/about",
            mainEntity: {
              "@type": "Organization",
              name: "Siliguri Fresh Mart",
              url: "https://www.siligurifreshmart.com",
              description: "A Siliguri-based hyperlocal startup delivering fresh fish, meat, and vegetables to every doorstep in Siliguri.",
              founder: [
                { "@type": "Person", name: "Shubhajit Saha", jobTitle: "Co-Founder, Online & Technology" },
                { "@type": "Person", name: "Rahul Barman", jobTitle: "Co-Founder, Operations & Sourcing" },
              ],
              foundingDate: "2025",
              numberOfEmployees: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5 },
              address: {
                "@type": "PostalAddress",
                streetAddress: "Laketown, Gate Bazar",
                addressLocality: "Siliguri",
                addressRegion: "West Bengal",
                postalCode: "734001",
                addressCountry: "IN",
              },
            },
          }),
        }}
      />

      {/* Hero */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7D3A]/10 px-3 py-1 text-xs font-semibold text-[#2D7D3A]">
          <Heart className="h-3 w-3 fill-current" />
          Our Story
        </span>
        <h1 className="mt-3 text-[28px] sm:text-[36px] font-extrabold text-foreground leading-tight">
          From the Fish Market<br />to Your Doorstep
        </h1>
        <p className="mt-4 text-[15px] text-muted leading-relaxed">
          Siliguri Fresh Mart is a direct-to-consumer fresh delivery service in Siliguri, West Bengal.
          Unlike marketplace listings or aggregator apps, we source fish, chicken and mutton ourselves from
          Siliguri&apos;s morning markets every day and deliver directly to your doorstep —
          no middlemen, no warehouses, no frozen storage.
        </p>
      </div>

      {/* Founders */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-3">The Founders</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2D7D3A]/10 text-lg font-bold text-[#2D7D3A]">S</div>
            <h3 className="mt-3 text-base font-bold text-foreground">Shubhajit Saha</h3>
            <p className="mt-0.5 text-xs font-semibold text-[#2D7D3A]">Co-Founder &bull; Online &amp; Technology</p>
            <p className="mt-2 text-[13px] text-muted leading-relaxed">
              Handles everything digital — the website, payments, customer experience, delivery tracking,
              and the technology that makes 30-minute delivery possible. Grew up visiting Siliguri&apos;s
              fish markets and wanted to bring that freshness to every doorstep through technology.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2D7D3A]/10 text-lg font-bold text-[#2D7D3A]">R</div>
            <h3 className="mt-3 text-base font-bold text-foreground">Rahul Barman</h3>
            <p className="mt-0.5 text-xs font-semibold text-[#2D7D3A]">Co-Founder &bull; Operations &amp; Sourcing</p>
            <p className="mt-2 text-[13px] text-muted leading-relaxed">
              The backbone of Siliguri Fresh Mart on the ground. Rahul manages inventory, sources the
              freshest fish, meat and vegetables from Siliguri&apos;s morning markets every day, oversees
              the packing team, and ensures every order meets our freshness guarantee before it leaves the store.
            </p>
          </div>
        </div>
        <p className="mt-4 text-[14px] text-muted leading-relaxed">
          Together, Shubhajit and Rahul built Siliguri Fresh Mart because we saw families struggling
          with inconsistent quality and the hassle of daily market runs. We wanted to build something
          different — a hyperlocal delivery service that sources directly from the same morning markets
          we grew up visiting, delivering fresh to your doorstep because this is home, and our neighbours deserve the best.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-3">Our Mission</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Leaf, title: "100% Fresh", desc: "Sourced every morning from Siliguri's local markets. Never frozen, never stored." },
            { icon: Truck, title: "30-Minute Delivery", desc: "Order before 3 PM and get it delivered the same day, fresh to your door." },
            { icon: Shield, title: "Freshness Guarantee", desc: "Not satisfied? Free replacement within 3 hours. No questions asked." },
            { icon: Users, title: "Community First", desc: "We hire locally, source locally, and deliver to our own neighbours." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D7D3A]/10">
                  <Icon className="h-5 w-5 text-[#2D7D3A]" />
                </div>
                <h3 className="mt-2 text-sm font-bold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Numbers */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-3">Siliguri Trusts Us</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: "5,000+", label: "Orders Delivered" },
            { value: "4.8", label: "Average Rating" },
            { value: "45 min", label: "Avg. Delivery (within 4 km)" },
            { value: "8+", label: "Areas Served" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-xl font-extrabold text-[#2D7D3A]">{stat.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business Info Block (Directory-Ready) */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-3">Business Information</h2>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Business Name</p>
                <p className="font-semibold text-foreground">Siliguri Fresh Mart</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Address</p>
                <p className="font-semibold text-foreground">Laketown, Gate Bazar, Siliguri, West Bengal 734001</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Phone</p>
                <p className="font-semibold text-foreground">+91 7029908278</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Email</p>
                <p className="font-semibold text-foreground">siligurifreshmart@gmail.com</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Business Hours</p>
                <p className="font-semibold text-foreground">Open daily 7:00 AM - 3:00 PM</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Categories</p>
                <p className="font-semibold text-foreground">Fresh Fish, Chicken, Mutton, Pork, Seafood, Vegetables, Fruits, Dairy, Groceries</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Delivery Areas</p>
                <p className="font-semibold text-foreground">Hakimpara, Pradhan Nagar, Matigara, Bagdogra, Shantipara, Bhaktinagar, Champasari, Sukna, Burdwan Road & nearby areas</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted mb-1">Payment Methods</p>
                <p className="font-semibold text-foreground">UPI (Google Pay, PhonePe, Paytm), Cards, Netbanking, Cash on Delivery</p>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-[11px] text-muted">
              <strong>Website:</strong> www.siligurifreshmart.com &nbsp;|&nbsp;
              <strong>Google Business Profile:</strong> Search &ldquo;Siliguri Fresh Mart&rdquo; on Google Maps
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="text-center">
        <div className="rounded-2xl bg-[#2D7D3A]/5 border border-[#2D7D3A]/10 p-6">
          <h2 className="text-lg font-bold text-foreground">Get in Touch</h2>
          <p className="mt-1 text-sm text-muted">Have questions, feedback, or want to partner? We&apos;d love to hear from you.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a href="tel:+917029908278" className="inline-flex items-center gap-2 rounded-xl bg-[#2D7D3A] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2D7D3A]/20 transition-all hover:bg-[#23682E] active:scale-[0.97]">
              <Phone className="h-4 w-4" />
              Call +91 7029908278
            </a>
            <a href="mailto:siligurifreshmart@gmail.com" className="inline-flex items-center gap-2 rounded-xl border-2 border-[#2D7D3A]/30 px-5 py-2.5 text-sm font-bold text-[#2D7D3A] transition-all hover:bg-[#2D7D3A]/5 active:scale-[0.97]">
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
