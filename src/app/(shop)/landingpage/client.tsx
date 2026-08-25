"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import {
  Truck,
  ShieldCheck,
  Clock,
  Fish,
  Beef,
  Leaf,
  Apple,
  Egg,
  Star,
  ArrowRight,
  Zap,
  Heart,
  MapPin,
  Phone,
  ChevronRight,
  Sparkles,
  Check,
  Package,
  RotateCcw,
  MessageCircle,
  ShoppingBag,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";

const LOGO = "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg";

const categories = [
  { name: "Fresh Fish", icon: Fish, href: "/fish", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_1_m5fhyp.jpg", color: "#0EA5E9", count: "50+ varieties" },
  { name: "Chicken", icon: Beef, href: "/category/chicken", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_dgzy7a.jpg", color: "#F97316", count: "Country & broiler" },
  { name: "Mutton", icon: Beef, href: "/category/mutton", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.54_PM_2_g2jpax.jpg", color: "#DC2626", count: "Curry cut & premium" },
  { name: "Vegetables", icon: Leaf, href: "/category/vegetables", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_1_nd29bh.jpg", color: "#16A34A", count: "Farm fresh daily" },
  { name: "Fruits", icon: Apple, href: "/category/fruits", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_2_rva3oy.jpg", color: "#E11D48", count: "Seasonal & exotic" },
  { name: "Dairy & Eggs", icon: Egg, href: "/category/dairy", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.56_PM_d2fdtk.jpg", color: "#CA8A04", count: "Farm fresh eggs" },
];

const features = [
  { icon: Clock, title: "10–30 Min Delivery", desc: "From market to your door — blazing fast across all 8 zones of Siliguri.", gradient: "from-blue-500 to-cyan-400" },
  { icon: ShieldCheck, title: "Quality Guaranteed", desc: "Every item checked before dispatch. Not satisfied? We replace it — no questions.", gradient: "from-green-500 to-emerald-400" },
  { icon: Truck, title: "Free Over ₹299", desc: "Free delivery on orders above ₹299. No hidden charges, no surge pricing.", gradient: "from-purple-500 to-pink-400" },
  { icon: Fish, title: "Same-Day Fresh", desc: "Nothing stored overnight. What you get was sourced that very morning.", gradient: "from-orange-500 to-red-400" },
];

const steps = [
  { num: "01", title: "Browse & Pick", desc: "Choose from 200+ fresh items — fish, chicken, mutton, vegetables, fruits & more.", icon: Package },
  { num: "02", title: "We Source & Check", desc: "We personally source, clean, and quality-check every item before packing.", icon: ShieldCheck },
  { num: "03", title: "Delivered Fresh", desc: "Your order arrives at your doorstep in 10-30 minutes, fresh and ready.", icon: Truck },
];

const testimonials = [
  { name: "Priya S.", area: "Pradhan Nagar", text: "Best fish delivery in Siliguri! The Hilsa was incredibly fresh. I've stopped going to the market altogether.", rating: 5 },
  { name: "Rahul M.", area: "Bhaktinagar", text: "Mutton quality is unmatched. Curry cut was perfect. They even replaced the tomatoes when one was slightly bruised.", rating: 5 },
  { name: "Anjali D.", area: "Hakimpara", text: "Ordered at 8am, received by 8:20am. Fish was still fresh from the morning catch. Amazing speed!", rating: 5 },
  { name: "Vikram C.", area: "Shantipara", text: "The country chicken was exactly what I wanted. Fresh, clean, and delivered in proper packaging.", rating: 5 },
  { name: "Suman G.", area: "Matigara", text: "I order fish every week now. Consistent quality. The delivery boy always handles items carefully.", rating: 5 },
  { name: "Rina B.", area: "Champasari", text: "Tried their tiger prawns — absolute perfection. Restaurant quality at home. Worth every rupee.", rating: 5 },
];

const zones = ["Shantipara", "Bhaktinagar", "Pradhan Nagar", "Hakimpara", "Matigara", "Bagdogra", "Champasari", "Sukna"];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView) {
      const controls = count.on("change", (v) => setDisplay(Math.round(v).toLocaleString()));
      count.set(target);
      return controls;
    }
  }, [isInView, target, count]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(Math.round(v).toLocaleString()));
    return unsubscribe;
  }, [rounded]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, -10, 0],
        scale: [1, 1.05, 0.95, 1],
      }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2D7D3A]/20 to-emerald-400/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default function LandingClient() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      delete (window as any).deferredInstallPrompt;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a0d] via-[#0d2614] to-[#071210]" />
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#2D7D3A]/8 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/6 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" style={{ animationDelay: "2s" }} />
          <FloatingOrb className="absolute top-20 right-[15%] w-3 h-3 bg-[#2D7D3A]/40 rounded-full blur-sm" delay={0} />
          <FloatingOrb className="absolute top-40 left-[20%] w-2 h-2 bg-emerald-400/30 rounded-full blur-sm" delay={1} />
          <FloatingOrb className="absolute bottom-32 right-[25%] w-4 h-4 bg-green-300/20 rounded-full blur-sm" delay={2} />
          <FloatingOrb className="absolute top-[60%] left-[10%] w-2.5 h-2.5 bg-[#2D7D3A]/25 rounded-full blur-sm" delay={3} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-8"
          >
            <div className="mx-auto w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-[#2D7D3A]/30 shadow-2xl shadow-[#2D7D3A]/20">
              <img src={LOGO} alt="Siliguri Fresh Mart" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D7D3A]/10 border border-[#2D7D3A]/20 backdrop-blur-sm mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#2D7D3A]" />
            <span className="text-xs font-semibold text-[#2D7D3A] tracking-wide">SILIGURI&apos;S #1 FRESH DELIVERY</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight mb-6"
          >
            Fresh Fish,
            <br />
            <span className="bg-gradient-to-r from-[#2D7D3A] via-emerald-400 to-green-300 bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-lg sm:text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Premium fish, chicken, mutton & groceries — sourced fresh every morning and delivered to your doorstep in{" "}
            <span className="text-white/80 font-semibold">10-30 minutes</span>.
          </motion.p>

          {/* Download App Buttons — Big & Prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(45,125,58,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (typeof window !== "undefined" && (window as any).deferredInstallPrompt) {
                  const p = (window as any).deferredInstallPrompt;
                  await p.prompt();
                }
                window.location.href = "/fish";
              }}
              className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#2D7D3A] to-emerald-500 text-white font-extrabold rounded-2xl text-xl shadow-xl shadow-[#2D7D3A]/30 overflow-hidden flex items-center justify-center gap-3"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-[#2D7D3A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Download className="relative h-7 w-7 group-hover:translate-y-[-2px] transition-transform" />
              <span className="relative">Download the App</span>
            </motion.button>

            <div className="relative w-full sm:w-auto px-8 py-4 bg-black/40 border-2 border-white/10 rounded-2xl flex items-center gap-4 shadow-lg opacity-50 cursor-not-allowed overflow-hidden">
              <svg className="relative h-10 w-10 flex-shrink-0 opacity-50 grayscale" viewBox="0 0 512 512">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#4285F4"/>
                <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" fill="#34A853"/>
                <path d="M47 512c13 6.8 21.7 19.2 21.7 35.3V430.3L306.8 274.4 47 512z" fill="#EA4335"/>
                <path d="M377.3 271.6L306.8 201.1 357.2 150.7l70.1 69.5c19.7 11.3 19.7 29.7 0 41l-50 10.4z" fill="#FBBC05"/>
                <path d="M47 0l282.6 161.2-60.1 60.1L47 35.3V0z" fill="#34A853"/>
                <path d="M47 512l222.5-186L412.6 430.3 47 512z" fill="#EA4335"/>
                <path d="M377.3 271.6L306.8 201.1l-60.1 60.1L47 0h0l260.8 151.4 69.5 120.2z" fill="#4285F4"/>
                <path d="M377.3 240.4L306.8 170l-60.1 60.1-199.4 282h0l260.8-151.4 70.1 120.2z" fill="#EA4335"/>
              </svg>
              <div className="relative flex flex-col items-start">
                <span className="text-[10px] font-medium text-white/40 leading-tight">GET IT ON</span>
                <span className="text-xl font-bold text-white/50 leading-tight">Google Play</span>
              </div>
              <span className="relative text-[9px] font-bold uppercase tracking-wider bg-amber-500/70 px-2 py-0.5 rounded-full text-white/80 shadow-sm ml-2">Soon</span>
            </div>
          </motion.div>

          {/* Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/fish">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-[#2D7D3A]/80 text-white font-bold rounded-2xl text-base border border-[#2D7D3A]/50 backdrop-blur-sm overflow-hidden flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Order Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
            <Link href="/bulk">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border border-white/15 text-white/60 font-bold rounded-2xl text-base backdrop-blur-sm hover:bg-white/5 hover:text-white/80 transition-all"
              >
                Bulk Orders
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: 5000, suffix: "+", label: "Orders" },
              { value: 200, suffix: "+", label: "Products" },
              { value: 4.8, suffix: "", label: "Rating ★" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-white/40 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
          >
            <div className="w-1 h-2.5 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== DOWNLOAD APP SECTION ===== */}
      <section className="relative py-20 sm:py-28 bg-gradient-to-b from-[#0a1a0d] via-[#0d2614] to-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-[#2D7D3A]/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D7D3A] mb-4 block">Download the App</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                Fresh Fish,
                <br />
                <span className="bg-gradient-to-r from-[#2D7D3A] to-emerald-400 bg-clip-text text-transparent">One Tap Away</span>
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed max-w-md">
                Order from 200+ fresh items. Track live delivery. Pay on delivery or UPI. Available on Android now — iOS coming soon.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-3 mb-10">
                {["Live Tracking", "UPI & COD", "10 Min Delivery", "Quality Checked"].map((f) => (
                  <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
                    <Check className="h-3.5 w-3.5 text-[#2D7D3A]" /> {f}
                  </span>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <motion.button
                  whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(45,125,58,0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    if (typeof window !== "undefined" && (window as any).deferredInstallPrompt) {
                      const p = (window as any).deferredInstallPrompt;
                      await p.prompt();
                    }
                    window.location.href = "/fish";
                  }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-[#2D7D3A] to-emerald-500 text-white font-extrabold rounded-2xl text-lg shadow-xl shadow-[#2D7D3A]/30 overflow-hidden flex items-center gap-3"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-[#2D7D3A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Download className="relative h-6 w-6 group-hover:translate-y-[-2px] transition-transform" />
                  <span className="relative">Download the App</span>
                </motion.button>

                <div className="relative px-8 py-4 bg-black/40 border-2 border-white/10 rounded-2xl flex items-center gap-4 shadow-lg opacity-50 cursor-not-allowed overflow-hidden">
                  <svg className="relative h-10 w-10 flex-shrink-0 opacity-50 grayscale" viewBox="0 0 512 512">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#4285F4"/>
                    <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" fill="#34A853"/>
                    <path d="M47 512c13 6.8 21.7 19.2 21.7 35.3V430.3L306.8 274.4 47 512z" fill="#EA4335"/>
                    <path d="M377.3 271.6L306.8 201.1 357.2 150.7l70.1 69.5c19.7 11.3 19.7 29.7 0 41l-50 10.4z" fill="#FBBC05"/>
                    <path d="M47 0l282.6 161.2-60.1 60.1L47 35.3V0z" fill="#34A853"/>
                    <path d="M47 512l222.5-186L412.6 430.3 47 512z" fill="#EA4335"/>
                    <path d="M377.3 271.6L306.8 201.1l-60.1 60.1L47 0h0l260.8 151.4 69.5 120.2z" fill="#4285F4"/>
                    <path d="M377.3 240.4L306.8 170l-60.1 60.1-199.4 282h0l260.8-151.4 70.1 120.2z" fill="#EA4335"/>
                  </svg>
                  <div className="relative flex flex-col items-start">
                    <span className="text-[10px] font-medium text-white/40 leading-tight">GET IT ON</span>
                    <span className="text-xl font-bold text-white/50 leading-tight">Google Play</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/70 px-2 py-0.5 rounded-full text-white/80 shadow-sm">Soon</span>
                </div>
              </div>
            </motion.div>

            {/* Right — phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative">
                {/* Glow behind phone */}
                <div className="absolute inset-0 bg-[#2D7D3A]/20 rounded-[60px] blur-[60px] scale-110" />
                {/* Phone frame */}
                <div className="relative w-[280px] h-[560px] sm:w-[300px] sm:h-[600px] bg-gray-900 rounded-[48px] border-4 border-gray-700 shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20" />
                  {/* Screen */}
                  <div className="absolute inset-[4px] rounded-[44px] overflow-hidden bg-gradient-to-b from-[#0d2614] to-[#0a1a0d]">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-10 pb-2">
                      <span className="text-[10px] text-white/60 font-medium">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2 rounded-sm bg-white/40" />
                        <div className="w-1 h-2 rounded-sm bg-white/40" />
                      </div>
                    </div>
                    {/* App content mockup */}
                    <div className="px-5 pt-4">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#2D7D3A] flex items-center justify-center">
                          <Fish className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Siliguri Fresh Mart</p>
                          <p className="text-[9px] text-white/40">Delivering fresh since 2024</p>
                        </div>
                      </div>
                      {/* Search bar */}
                      <div className="bg-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4">
                        <svg className="h-3.5 w-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <span className="text-[11px] text-white/30">Search fresh fish...</span>
                      </div>
                      {/* Category cards */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { name: "Fish", color: "#0EA5E9" },
                          { name: "Chicken", color: "#F97316" },
                          { name: "Mutton", color: "#DC2626" },
                          { name: "Veg", color: "#16A34A" },
                          { name: "Fruits", color: "#E11D48" },
                          { name: "Eggs", color: "#CA8A04" },
                        ].map((cat) => (
                          <div key={cat.name} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                            <div className="w-8 h-8 mx-auto rounded-lg mb-1.5 flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                            </div>
                            <span className="text-[9px] text-white/70 font-medium">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                      {/* Product cards */}
                      <div className="space-y-2.5">
                        {[
                          { name: "Rohu Fish", price: "₹280/kg", tag: "Fresh" },
                          { name: "Country Chicken", price: "₹350/kg", tag: "Popular" },
                        ].map((item) => (
                          <div key={item.name} className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                            <div className="w-12 h-12 rounded-lg bg-[#2D7D3A]/20 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-white truncate">{item.name}</p>
                              <p className="text-[10px] text-[#2D7D3A] font-bold">{item.price}</p>
                            </div>
                            <span className="text-[8px] font-bold uppercase bg-[#2D7D3A]/20 text-[#2D7D3A] px-1.5 py-0.5 rounded-full">{item.tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-4 top-24 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-[#2D7D3A]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">On the way!</p>
                    <p className="text-[9px] text-gray-500">Arriving in 8 min</p>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-4 bottom-32 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">4.8 ★ Rating</p>
                    <p className="text-[9px] text-gray-500">5000+ orders</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f0faf2]/30 to-white" />
        <div className="relative max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D7D3A]">Simple & Fast</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mt-3 tracking-tight">
              How It Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-px bg-gradient-to-r from-[#2D7D3A]/20 via-[#2D7D3A]/40 to-[#2D7D3A]/20" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="relative text-center group"
              >
                <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2D7D3A] to-emerald-600 flex items-center justify-center shadow-lg shadow-[#2D7D3A]/20 mb-6 group-hover:shadow-xl group-hover:shadow-[#2D7D3A]/30 transition-shadow">
                  <step.icon className="h-9 w-9 text-white" />
                </div>
                <div className="text-xs font-bold text-[#2D7D3A]/60 mb-2">{step.num}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white to-[#f7fdf8]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D7D3A]">Our Range</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mt-3 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-muted mt-4 max-w-md mx-auto">From river fish to organic vegetables — everything sourced fresh daily.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Link href={cat.href}>
                  <GlowCard>
                    <div className="relative rounded-3xl overflow-hidden bg-white border border-border shadow-sm h-64 sm:h-72 group cursor-pointer">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center gap-2 mb-1">
                          <cat.icon className="h-4 w-4 text-white/70" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{cat.count}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                      </div>
                      <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D7D3A]">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mt-3 tracking-tight">
              The Fresh Mart Difference
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <GlowCard>
                  <div className="p-7 rounded-3xl bg-white border border-border shadow-sm h-full">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shadow-lg mb-5`}>
                      <feat.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{feat.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{feat.desc}</p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BIG CTA BANNER ===== */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a0d] via-[#0d2614] to-[#071210]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#2D7D3A]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[120px]" />
        <FloatingOrb className="absolute top-10 left-[10%] w-3 h-3 bg-[#2D7D3A]/40 rounded-full" />
        <FloatingOrb className="absolute bottom-10 right-[15%] w-2 h-2 bg-emerald-400/30 rounded-full" delay={1.5} />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D7D3A]/10 border border-[#2D7D3A]/20 mb-8">
              <Zap className="h-3.5 w-3.5 text-[#2D7D3A]" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">SI&apos;GURI&apos;S TRUSTED CHOICE</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Stop Going to the
              <br />
              <span className="bg-gradient-to-r from-[#2D7D3A] to-emerald-400 bg-clip-text text-transparent">Bazaar Every Morning</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              We go to the market so you don&apos;t have to. Same-day fresh produce, cleaned, packed, and delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/fish">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-5 bg-[#2D7D3A] text-white font-extrabold rounded-2xl text-xl shadow-lg shadow-[#2D7D3A]/30 flex items-center gap-2">
                  Start Shopping <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              <a href="https://wa.me/917029908278" target="_blank" rel="noopener noreferrer">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-5 border border-white/15 text-white/80 font-extrabold rounded-2xl text-xl backdrop-blur-sm hover:bg-white/5 transition-colors flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" /> WhatsApp Us
                </motion.button>
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(45,125,58,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (typeof window !== "undefined" && (window as any).deferredInstallPrompt) {
                    const p = (window as any).deferredInstallPrompt;
                    await p.prompt();
                  }
                  window.location.href = "/fish";
                }}
                className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#2D7D3A] to-emerald-500 text-white font-extrabold rounded-2xl text-xl shadow-xl shadow-[#2D7D3A]/30 overflow-hidden flex items-center justify-center gap-3"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-[#2D7D3A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Download className="relative h-7 w-7 group-hover:translate-y-[-2px] transition-transform" />
                <span className="relative">Download the App</span>
              </motion.button>
                <div className="relative w-full sm:w-auto px-8 py-4 bg-black/40 border-2 border-white/10 rounded-2xl flex items-center gap-4 shadow-lg opacity-50 cursor-not-allowed overflow-hidden">
                  <svg className="relative h-10 w-10 flex-shrink-0 opacity-50 grayscale" viewBox="0 0 512 512">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#4285F4"/>
                    <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" fill="#34A853"/>
                    <path d="M47 512c13 6.8 21.7 19.2 21.7 35.3V430.3L306.8 274.4 47 512z" fill="#EA4335"/>
                    <path d="M377.3 271.6L306.8 201.1 357.2 150.7l70.1 69.5c19.7 11.3 19.7 29.7 0 41l-50 10.4z" fill="#FBBC05"/>
                    <path d="M47 0l282.6 161.2-60.1 60.1L47 35.3V0z" fill="#34A853"/>
                    <path d="M47 512l222.5-186L412.6 430.3 47 512z" fill="#EA4335"/>
                    <path d="M377.3 271.6L306.8 201.1l-60.1 60.1L47 0h0l260.8 151.4 69.5 120.2z" fill="#4285F4"/>
                    <path d="M377.3 240.4L306.8 170l-60.1 60.1-199.4 282h0l260.8-151.4 70.1 120.2z" fill="#EA4335"/>
                  </svg>
                  <div className="relative flex flex-col items-start">
                    <span className="text-[10px] font-medium text-white/40 leading-tight">GET IT ON</span>
                    <span className="text-xl font-bold text-white/50 leading-tight">Google Play</span>
                  </div>
                  <span className="relative text-[9px] font-bold uppercase tracking-wider bg-amber-500/70 px-2 py-0.5 rounded-full text-white/80 shadow-sm ml-2">Soon</span>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white to-[#f7fdf8]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D7D3A]">Love from Siliguri</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mt-3 tracking-tight">
              What Our Customers Say
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="p-6 rounded-3xl bg-white border border-border shadow-sm h-full hover:shadow-md transition-shadow">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D7D3A] to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.area}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DELIVERY ZONES ===== */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D7D3A]">Coverage</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mt-3 tracking-tight">
              We Deliver Across Siliguri
            </h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {zones.map((zone, i) => (
              <motion.div
                key={zone}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/siliguri/${zone.toLowerCase().replace(/\s+/g, "-")}`}>
                  <motion.div
                    whileHover={{ scale: 1.08, y: -2 }}
                    className="px-5 py-3 rounded-2xl bg-white border border-border shadow-sm hover:border-[#2D7D3A]/30 hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#2D7D3A]" />
                    <span className="text-sm font-semibold text-foreground">{zone}</span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GUARANTEES BAR ===== */}
      <section className="py-16 border-y border-border bg-[#fafcfa]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, label: "Quality Checked", sub: "Every single order" },
              { icon: RotateCcw, label: "Replacement Policy", sub: "Within 2:59 hours" },
              { icon: Truck, label: "Free Delivery", sub: "On orders over ₹299" },
              { icon: Clock, label: "10-30 Min", sub: "Doorstep delivery" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-xl bg-[#2D7D3A]/10 flex items-center justify-center mb-3">
                  <item.icon className="h-6 w-6 text-[#2D7D3A]" />
                </div>
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="text-xs text-muted mt-0.5">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Heart className="h-10 w-10 text-[#2D7D3A] mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight mb-6">
              Ready for Freshest
              <br />
              <span className="bg-gradient-to-r from-[#2D7D3A] to-emerald-400 bg-clip-text text-transparent">Deliveries?</span>
            </h2>
            <p className="text-muted text-lg mb-10 max-w-md mx-auto">
              Join thousands of happy families in Siliguri who get fresh fish, chicken & groceries delivered daily.
            </p>
            <Link href="/fish">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-6 bg-[#2D7D3A] text-white font-black rounded-2xl text-2xl shadow-xl shadow-[#2D7D3A]/30 flex items-center gap-3 mx-auto"
              >
                <ShoppingBag className="h-7 w-7" /> Shop Now
              </motion.button>
            </Link>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#2D7D3A]" /> No minimum order</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#2D7D3A]" /> Pay on delivery</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#2D7D3A]" /> Fresh guaranteed</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER BAR ===== */}
      <div className="border-t border-border py-8 bg-[#fafcfa]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="SFM" className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-bold">Siliguri Fresh Mart</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <a href="tel:+917029908278" className="flex items-center gap-1 hover:text-[#2D7D3A] transition-colors">
              <Phone className="h-3 w-3" /> +91 7029908278
            </a>
            <span>•</span>
            <span>© 2026 All rights reserved</span>
          </div>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <motion.a
        href="https://wa.me/917029908278?text=Hi!%20I%27d%20like%20to%20place%20an%20order."
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_20px_rgba(37,211,102,0.5)] hover:shadow-[0_6px_30px_rgba(37,211,102,0.6)] transition-shadow"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="white" className="h-8 w-8">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.054 9.374L1.054 31.25l6.098-1.97A15.906 15.906 0 0016.004 32C24.83 32 32 24.822 32 16S24.83 0 16.004 0zm9.308 22.602c-.39 1.1-1.932 2.014-3.168 2.28-.84.18-1.938.324-5.636-1.21-4.736-1.966-7.78-6.81-8.016-7.126-.226-.316-1.896-2.524-1.896-4.814s1.2-3.41 1.63-3.878c.39-.424.936-.572 1.248-.572.152 0 .29.008.416.014.434.018.65.044.936.716.35.84 1.198 2.924 1.302 3.138.104.214.214.52.064.834-.138.326-.258.526-.472.814-.214.288-.42.512-.634.822-.194.276-.41.572-.17.996.238.424 1.06 1.75 2.274 2.836 1.562 1.396 2.838 1.83 3.288 2.036.336.154.734.092.994-.276.332-.468.74-1.236 1.15-1.982.294-.534.666-.6 1.132-.404.378.158 2.398 1.132 2.81 1.338.414.206.69.31.794.484.104.174.104 1.006-.286 2.106z" />
        </svg>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
      </motion.a>
    </div>
  );
}
