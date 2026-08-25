export type Lang = "en" | "bn" | "hi";

export interface LandingTranslations {
  lang: Lang;
  hero: {
    badge: string;
    heading1: string;
    heading2: string;
    subtitle: string;
    downloadBtn: string;
    orderNow: string;
    bulkOrders: string;
    statOrders: string;
    statProducts: string;
    statRating: string;
  };
  download: {
    eyebrow: string;
    heading1: string;
    heading2: string;
    desc: string;
    pills: string[];
    btn: string;
    phoneAppName: string;
    phoneTagline: string;
    phoneSearch: string;
    phoneCats: string[];
    phoneProducts: { name: string; price: string; tag: string }[];
    floatingDelivery: string;
    floatingEta: string;
    floatingRating: string;
    floatingOrders: string;
  };
  howItWorks: {
    eyebrow: string;
    heading: string;
    steps: { title: string; desc: string }[];
  };
  categories: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    items: { name: string; count: string }[];
  };
  features: {
    eyebrow: string;
    heading: string;
    items: { title: string; desc: string }[];
  };
  whyCostMore: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    items: { title: string; desc: string }[];
    bottomLine: string;
  };
  freshness: {
    eyebrow: string;
    heading: string;
    market: { label: string; points: string[] };
    us: { label: string; points: string[] };
  };
  cta: {
    badge: string;
    heading1: string;
    heading2: string;
    desc: string;
    startShopping: string;
    whatsappUs: string;
  };
  testimonials: {
    eyebrow: string;
    heading: string;
    items: { text: string; name: string; area: string }[];
  };
  deliveryTime: {
    hubLabel: string;
    title: string;
    subtitle: string;
    headerDistance: string;
    headerEta: string;
    headerMinOrder: string;
    headerFee: string;
    row1Dist: string; row1Eta: string; row1Min: string; row1Fee: string;
    row2Dist: string; row2Eta: string; row2Min: string; row2Fee: string;
    row3Dist: string; row3Eta: string; row3Min: string; row3FeeFree: string; row3FeeSmall: string;
    row4Dist: string; row4Eta: string; row4Min: string; row4Fee: string; row4FeeFree: string;
    row5Dist: string; row5Eta: string; row5Min: string; row5Fee: string; row5FeeFree: string;
    note: string;
    whatsapp: string;
  };
  guarantees: { label: string; sub: string }[];
  footer: {
    phone: string;
    copyright: string;
  };
  langPicker: {
    title: string;
    subtitle: string;
    options: { code: Lang; label: string; native: string }[];
  };
}
const en: LandingTranslations = {
  lang: "en",
  hero: {
    badge: "SILIGURI'S #1 FRESH DELIVERY",
    heading1: "Tired of Stale Fish?",
    heading2: "Get Today's Catch at Your Door",
    subtitle: "Premium fish, chicken, mutton & groceries — sourced fresh every morning and delivered in 10-30 minutes. No cold storage. No middlemen. Just today's catch.",
    downloadBtn: "Download the App",
    orderNow: "Order Now",
    bulkOrders: "Bulk Orders",
    statOrders: "Orders",
    statProducts: "Products",
    statRating: "Rating ★",
  },
  download: {
    eyebrow: "Download the App",
    heading1: "Fresh Fish,",
    heading2: "One Tap Away",
    desc: "Order from 200+ fresh items. Track live delivery. Pay on delivery or UPI. Available on Android now — iOS coming soon.",
    pills: ["Live Tracking", "UPI & COD", "10 Min Delivery", "Quality Checked"],
    btn: "Download the App",
    phoneAppName: "Siliguri Fresh Mart",
    phoneTagline: "Delivering fresh since 2024",
    phoneSearch: "Search fresh fish...",
    phoneCats: ["Fish", "Chicken", "Mutton", "Veg", "Fruits", "Eggs"],
    phoneProducts: [
      { name: "Rohu Fish", price: "₹280/kg", tag: "Fresh" },
      { name: "Country Chicken", price: "₹350/kg", tag: "Popular" },
    ],
    floatingDelivery: "On the way!",
    floatingEta: "Arriving in 8 min",
    floatingRating: "4.8 ★ Rating",
    floatingOrders: "5000+ orders",
  },
  howItWorks: {
    eyebrow: "Simple & Fast",
    heading: "How It Works",
    steps: [
      { title: "Browse & Pick", desc: "Choose from 200+ fresh items — fish, chicken, mutton, vegetables, fruits & more." },
      { title: "We Source & Check", desc: "We personally source, clean, and quality-check every item before packing." },
      { title: "Delivered Fresh", desc: "Your order arrives at your doorstep in 10-30 minutes, fresh and ready." },
    ],
  },
  categories: {
    eyebrow: "Our Range",
    heading: "Shop by Category",
    subtitle: "From river fish to organic vegetables — everything sourced fresh daily.",
    items: [
      { name: "Fresh Fish", count: "50+ varieties" },
      { name: "Chicken", count: "Country & broiler" },
      { name: "Mutton", count: "Curry cut & premium" },
      { name: "Vegetables", count: "Farm fresh daily" },
      { name: "Fruits", count: "Seasonal & exotic" },
      { name: "Dairy & Eggs", count: "Farm fresh eggs" },
    ],
  },
  features: {
    eyebrow: "Why Choose Us",
    heading: "The Fresh Mart Difference",
    items: [
      { title: "10-30 Min Delivery", desc: "From market to your door — blazing fast within 4 km. We deliver up to 20 km from our NJP Gate Bazar hub." },
      { title: "Quality Guaranteed", desc: "Every item checked before dispatch. Not satisfied? We replace it — no questions asked." },
      { title: "Distance-Based Pricing", desc: "Within 8 km: free delivery. 8-20 km: small fee with minimum order. No hidden charges, no surge pricing." },
      { title: "Same-Day Fresh", desc: "Nothing stored overnight. What you get was sourced that very morning." },
    ],
  },
  whyCostMore: {
    eyebrow: "Transparent Pricing",
    heading: "Why We Cost a Little More",
    subtitle: "We're not the cheapest. We're the freshest. Here's why.",
    items: [
      { title: "Same-Morning Catch", desc: "We buy from the market at 5 AM. Fish that was swimming this morning — not sitting in cold storage for 3 days. That freshness costs a little extra, but you taste the difference." },
      { title: "Hand-Inspected Before Packing", desc: "Every fish, every chicken piece — we check it ourselves. Gills, texture, smell — if it's not perfect, it doesn't ship. Supermarkets can't promise this." },
      { title: "Replacement Guarantee", desc: "Don't like what you got? We replace it. No questions, no drama, no awkward calls. Your satisfaction is literally our guarantee." },
      { title: "Your Time Is Worth It", desc: "Market trips cost you 1-2 hours of your day — the travel, the bargaining, the waiting. We deliver to your door in 10 minutes. ₹40 delivery fee saves you hours." },
    ],
    bottomLine: "You pay ₹10-20 more per kg. In return: guaranteed freshness, zero market hassle, clean packaging, and a delivery boy who knows your name.",
  },
  freshness: {
    eyebrow: "Freshness Promise",
    heading: "Market vs Fresh Mart",
    market: {
      label: "❌ Typical Market",
      points: ["Fish caught yesterday or day before", "Stored in ice for hours", "Touched by dozens of people", "You carry it home in plastic bags", "No replacement if quality is bad"],
    },
    us: {
      label: "✅ Siliguri Fresh Mart",
      points: ["Caught and sourced same morning", "Packed within 1 hour of sourcing", "Quality-checked by our team", "Delivered to your door in 10 min", "Full replacement if you're not happy"],
    },
  },
  cta: {
    badge: "SILIGURI'S TRUSTED CHOICE",
    heading1: "Stop Going to the",
    heading2: "Bazaar Every Morning",
    desc: "We go to the market so you don't have to. Same-day fresh produce, cleaned, packed, and delivered to your door. Order now — delivered in 10 minutes.",
    startShopping: "Start Shopping",
    whatsappUs: "WhatsApp Us",
  },
  testimonials: {
    eyebrow: "Love from Siliguri",
    heading: "What Our Customers Say",
    items: [
      { text: "Best fish delivery in Siliguri! The Hilsa was incredibly fresh. I've stopped going to the market altogether.", name: "Priya S.", area: "Pradhan Nagar" },
      { text: "Mutton quality is unmatched. Curry cut was perfect. They even replaced the tomatoes when one was slightly bruised.", name: "Rahul M.", area: "Bhaktinagar" },
      { text: "Ordered at 8am, received by 8:20am. Fish was still fresh from the morning catch. Amazing speed!", name: "Anjali D.", area: "Hakimpara" },
      { text: "The country chicken was exactly what I wanted. Fresh, clean, and delivered in proper packaging.", name: "Vikram C.", area: "Shantipara" },
      { text: "I order fish every week now. Consistent quality. The delivery boy always handles items carefully.", name: "Suman G.", area: "Matigara" },
      { text: "Tried their tiger prawns — absolute perfection. Restaurant quality at home. Worth every rupee.", name: "Rina B.", area: "Champasari" },
    ],
  },
  deliveryTime: {
    hubLabel: "Our Hub: NJP Gate Bazar, Siliguri",
    title: "Delivery Time & Charges",
    subtitle: "All orders are dispatched from our hub at NJP Gate Bazar, Siliguri. Delivery time and fees depend on your distance from the hub — GPS location is calculated automatically at checkout.",
    headerDistance: "Distance from Hub",
    headerEta: "Est. Time",
    headerMinOrder: "Min Order",
    headerFee: "Delivery Fee",
    row1Dist: "Within 1 km", row1Eta: "10-20 min", row1Min: "No minimum", row1Fee: "Free",
    row2Dist: "1 - 4 km", row2Eta: "20-30 min", row2Min: "No minimum", row2Fee: "Free",
    row3Dist: "4 - 8 km", row3Eta: "45-60 min", row3Min: "No minimum", row3FeeFree: "Free", row3FeeSmall: "₹59 if < ₹99, ₹40 if < ₹299",
    row4Dist: "8 - 15 km", row4Eta: "1.5 - 2 hrs", row4Min: "₹800", row4Fee: "₹79", row4FeeFree: "Free if ₹800+",
    row5Dist: "15 - 20 km", row5Eta: "2 - 3 hrs", row5Min: "₹1,499", row5Fee: "₹99", row5FeeFree: "Free if ₹1,499+",
    note: "GPS location is mandatory at checkout — your order cannot proceed without it. This allows us to calculate the exact distance, time, and fees for your address. If your phone cannot detect GPS, order via WhatsApp or call us and we will help you place your order.",
    whatsapp: "Order via WhatsApp",
  },
  guarantees: [
    { label: "Quality Checked", sub: "Every single order" },
    { label: "Replacement Policy", sub: "Within 2:59 hours" },
    { label: "Free Delivery", sub: "On orders over ₹299" },
    { label: "10-30 Min", sub: "Doorstep delivery" },
  ],
  footer: { phone: "+91 7029908278", copyright: "© 2026 All rights reserved" },
  langPicker: {
    title: "Choose Your Language",
    subtitle: "Select your preferred language to continue",
    options: [
      { code: "en", label: "English", native: "English" },
      { code: "bn", label: "Bengali", native: "বাংলা" },
      { code: "hi", label: "Hindi", native: "हिन्दी" },
    ],
  },
};
const bn: LandingTranslations = {
  lang: "bn",
  hero: {
    badge: "শিলিগুড়ির #১ ফ্রেশ ডেলিভারি",
    heading1: "পুরনো মাছ খাওয়া বন্ধ করুন",
    heading2: "আজকের তাজা মাছ আপনার দোরগোড়ায়",
    subtitle: "প্রিমিয়াম মাছ, মুরগি, খসুর মাংস ও মুদি — প্রতিদিন সকালে তাজা সংগ্রহ করে ১০-৩০ মিনিটে আপনার দোরগোড়ায়। কোনো ঠান্ডা ভান্ডার নেই, কোনো মধ্যস্বত্বভোগী নেই।",
    downloadBtn: "অ্যাপ ডাউনলোড করুন",
    orderNow: "এখনই অর্ডার করুন",
    bulkOrders: "বাল্ক অর্ডার",
    statOrders: "অর্ডার",
    statProducts: "প্রোডাক্ট",
    statRating: "রেটিং ★",
  },
  download: {
    eyebrow: "অ্যাপ ডাউনলোড করুন",
    heading1: "তাজা মাছ,",
    heading2: "একটি ক্লিকে",
    desc: "২০০+ তাজা পণ্য থেকে অর্ডার করুন। লাইভ ডেলিভারি ট্র্যাক করুন। ডেলিভারিতে বা UPI-তে পেমেন্ট করুন।",
    pills: ["লাইভ ট্র্যাকিং", "UPI ও COD", "১০ মিনিটে ডেলিভারি", "কোয়ালিটি চেকড"],
    btn: "অ্যাপ ডাউনলোড করুন",
    phoneAppName: "শিলিগুড়ি ফ্রেশ মার্ট",
    phoneTagline: "২০২৪ থেকে তাজা ডেলিভারি",
    phoneSearch: "তাজা মাছ খুঁজুন...",
    phoneCats: ["মাছ", "মুরগি", "মাংস", "সবজি", "ফল", "ডিম"],
    phoneProducts: [
      { name: "রুই মাছ", price: "₹২৮০/কেজি", tag: "তাজা" },
      { name: "দেশি মুরগি", price: "₹৩৫০/কেজি", tag: "জনপ্রিয়" },
    ],
    floatingDelivery: "পথে আছে!",
    floatingEta: "৮ মিনিটে পৌঁছাবে",
    floatingRating: "৪.৮ ★ রেটিং",
    floatingOrders: "৫০০০+ অর্ডার",
  },
  howItWorks: {
    eyebrow: "সহজ ও দ্রুত",
    heading: "কীভাবে কাজ করে",
    steps: [
      { title: "ব্রাউজ ও বাছাই", desc: "২০০+ তাজা পণ্য থেকে বেছে নিন — মাছ, মুরগি, খসুর মাংস, সবজি, ফল ও আরও।" },
      { title: "আমরা সংগ্রহ ও চেক করি", desc: "প্যাকিংয়ের আগে আমরা নিজেরা প্রতিটি পণ্য সংগ্রহ, পরিষ্কার ও মান পরীক্ষা করি।" },
      { title: "তাজা ডেলিভারি", desc: "আপনার অর্ডার ১০-৩০ মিনিটে দোরগোড়ায় পৌঁছায়, তাজা ও প্রস্তুত।" },
    ],
  },
  categories: {
    eyebrow: "আমাদের রেঞ্জ",
    heading: "ক্যাটাগরি অনুযায়ী কিনুন",
    subtitle: "নদীর মাছ থেকে অর্গানিক সবজি — সবকিছু প্রতিদিন তাজা সংগ্রহ।",
    items: [
      { name: "তাজা মাছ", count: "৫০+ প্রজাতি" },
      { name: "মুরগি", count: "দেশি ও ব্রয়লার" },
      { name: "খসুর মাংস", count: "কারি কাট ও প্রিমিয়াম" },
      { name: "সবজি", count: "প্রতিদিন তাজা" },
      { name: "ফল", count: "মৌসুমি ও এক্সোটিক" },
      { name: "দুধ ও ডিম", count: "তাজা খামারের ডিম" },
    ],
  },
  features: {
    eyebrow: "কেন আমাদের বেছে নেবেন",
    heading: "ফ্রেশ মার্টের পার্থক্য",
    items: [
      { title: "১০-৩০ মিনিটে ডেলিভারি", desc: "বাজার থেকে আপনার দোরগোড়ায় — ৪ কিমির মধ্যে দ্রুত ডেলিভারি। আমরা NJP গেট বাজার হাব থেকে ২০ কিমি পর্যন্ত ডেলিভারি করি।" },
      { title: "মান নিশ্চিত", desc: "প্রতিটি পণ্য পাঠানোর আগে চেক করা হয়। সন্তুষ্ট নন? আমরা বদলে দেবি।" },
      { title: "দূরত্ব নির্ভর মূল্য", desc: "৮ কিমির মধ্যে ফ্রি ডেলিভারি। ৮-২০ কিমিতে সর্বনিম্ন অর্ডারসহ সামান্য ফি। কোনো লুকানো খরচ নেই।" },
      { title: "একই দিনের তাজা", desc: "রাতভর সংরক্ষিত কিছু নেই। আপনি যা পাবেন তা সকালেই সংগ্রহ করা হয়েছে।" },
    ],
  },
  whyCostMore: {
    eyebrow: "স্বচ্ছ মূল্য",
    heading: "কেন আমরা একটু বেশি দাম নিই",
    subtitle: "আমরা সবচেয়ে সস্তা নই। আমরা সবচেয়ে তাজা। কারণ দেখুন।",
    items: [
      { title: "একই সকালের মাছ", desc: "আমরা সকাল ৫টায় বাজার থেকে কিনি। যে মাছ আজ সকালে পানিতে ছিল — ঠান্ডা ভান্ডারে ৩ দিন রাখা নয়। এই তাজাত্বের দাম একটু বেশি, কিন্তু পার্থক্য আপনি স্বাদে পাবেন।" },
      { title: "প্যাকিংয়ের আগে হাতে চেক", desc: "প্রতিটি মাছ, প্রতিটি মুরগির টুকরো — আমরা নিজেরাই চেক করি। গিলস, টেক্সচার, গন্ধ — পারফেক্ট না হলে পাঠাই না। সুপারমার্কেট এটা গ্যারান্টি দিতে পারে না।" },
      { title: "রিপ্লেসমেন্ট গ্যারান্টি", desc: "পাঠানো পণ্য পছন্দ হলো না? আমরা বদলে দেবি। কোনো প্রশ্ন নেই, কোনো ঝামেলা নেই। আপনার সন্তুষ্টি আমাদের গ্যারান্টি।" },
      { title: "আপনার সময়ের দাম", desc: "বাজারে যেতে ১-২ ঘণ্টা লাগে — যাতায়াত, দর কাটা, অপেক্ষা। আমরা ১০ মিনিটে দোরগোড়ায় দিই। ₹৪০ ডেলিভারি ফি আপনার ঘণ্টের সময় বাঁচায়।" },
    ],
    bottomLine: "আপনি প্রতি কেজিতে ₹১০-২০ বেশি দেন। বিনিময়ে: নিশ্চিত তাজাত্ব, শূন্য ঝামেলা, পরিষ্কার প্যাকেজিং, এবং একজন ডেলিভারি বয় যিনি আপনার নাম জানেন।",
  },
  freshness: {
    eyebrow: "তাজাত্বের প্রতিশ্রুতি",
    heading: "বাজার বনাম ফ্রেশ মার্ট",
    market: {
      label: "❌ সাধারণ বাজার",
      points: ["গতকাল বা তার আগে ধরা মাছ", "ঘণ্টার পর ঘণ্টা বরফে রাখা", "দর্জন মানুষের স্পর্শ", "প্লাস্টিক ব্যাগে বাজার থেকে বয়ে আনুন", "মান খারাপ হলে কোনো বদল নেই"],
    },
    us: {
      label: "✅ শিলিগুড়ি ফ্রেশ মার্ট",
      points: ["একই সকালে ধরা ও সংগ্রহ", "সংগ্রহের ১ ঘণ্টার মধ্যে প্যাক", "আমাদের টিম দ্বারা মান পরীক্ষা", "১০ মিনিটে দোরগোড়ায় ডেলিভারি", "পছন্দ না হলে সম্পূর্ণ বদল"],
    },
  },
  cta: {
    badge: "শিলিগুড়ির বিশ্বস্ত পছন্দ",
    heading1: "আর প্রতিদিন সকালে",
    heading2: "বাজারে যাওয়া বন্ধ করুন",
    desc: "আমরা বাজারে যাই যাতে আপনাকে না যেতে হয়। একই দিনের তাজা পণ্য, পরিষ্কার, প্যাক, আপনার দোরগোড়ায়।",
    startShopping: "এখনই কিনুন",
    whatsappUs: "WhatsApp-এ কথা বলুন",
  },
  testimonials: {
    eyebrow: "শিলিগুড়ির ভালোবাসা",
    heading: "আমাদের গ্রাহকরা কী বলছেন",
    items: [
      { text: "শিলিগুড়ির সেরা মাছ ডেলিভারি! ইলিশ অসাধারণ তাজা ছিল। আমি আর বাজারে যাই না।", name: "প্রিয়া এস.", area: "প্রধাননগর" },
      { text: "খসুর মাংসের মান অমীয়। কারি কাট পারফেক্ট ছিল। এমনকি একটু চাপা টমেটোও বদলে দিয়েছে।", name: "রাহুল এম.", area: "ভক্তিনগর" },
      { text: "সকাল ৮টায় অর্ডার করেছি, ৮:২০-তে পেয়েছি। মাছ এখনো সকালের তাজা। অসাধারণ গতি!", name: "অঞ্জলি ডি.", area: "হাকিমপাড়া" },
      { text: "দেশি মুরগি ঠিক যা চেয়েছিলাম। তাজা, পরিষ্কার, সঠিক প্যাকেজিংয়ে ডেলিভারি।", name: "বিক্রম সি.", area: "শান্তিপাড়া" },
      { text: "আমি এখন প্রতি সপ্তাহে মাছ অর্ডার করি। নিরবচ্ছিন্ন মান। ডেলিভারি বয় সবসময় যত্নে নিয়ে আসে।", name: "সুমন জি.", area: "মাটিগাড়া" },
      { text: "তাদের টাইগার প্রawn ট্রাই করেছি — একদম পারফেক্ট। রেস্তোরাঁর মান ঘরে।", name: "রিনা বি.", area: "চম্পাসারি" },
    ],
  },
  deliveryTime: {
    hubLabel: "আমাদের হাব: এনজেপি গেট বাজার, শিলিগুড়ি",
    title: "ডেলিভারি সময় ও চার্জ",
    subtitle: "সমস্ত অর্ডার আমাদের শিলিগুড়ির এনজেপি গেট বাজার হাব থেকে পাঠানো হয়। ডেলিভারি সময় ও ফি আপনার হাব থেকে দূরত্বের উপর নির্ভর করে — চেকআউটে জিপিএস লোকেশন স্বয়ংক্রিয়ভাবে গণনা করা হয়।",
    headerDistance: "হাব থেকে দূরত্ব",
    headerEta: "আনুমানিক সময়",
    headerMinOrder: "সর্বনিম্ন অর্ডার",
    headerFee: "ডেলিভারি ফি",
    row1Dist: "১ কিমির মধ্যে", row1Eta: "১০-২০ মিনিট", row1Min: "কোনো ন্যূনতম নেই", row1Fee: "বিনামূল্যে",
    row2Dist: "১ - ৪ কিমি", row2Eta: "২০-৩০ মিনিট", row2Min: "কোনো ন্যূনতম নেই", row2Fee: "বিনামূল্যে",
    row3Dist: "৪ - ৮ কিমি", row3Eta: "৪৫-৬০ মিনিট", row3Min: "কোনো ন্যূনতম নেই", row3FeeFree: "বিনামূল্যে", row3FeeSmall: "₹৯৯-এর কম হলে ₹৫৯, ₹২৯৯-এর কম হলে ₹৪০",
    row4Dist: "৮ - ১৫ কিমি", row4Eta: "১.৫ - ২ ঘণ্টা", row4Min: "₹৮০০", row4Fee: "₹৭৯", row4FeeFree: "₹৮০০+ হলে বিনামূল্যে",
    row5Dist: "১৫ - ২০ কিমি", row5Eta: "২ - ৩ ঘণ্টা", row5Min: "₹১,৪৯৯", row5Fee: "₹৯৯", row5FeeFree: "₹১,৪৯৯+ হলে বিনামূল্যে",
    note: "চেকআউটে জিপিএস লোকেশন বাধ্যতামূলক — এটি ছাড়া আপনার অর্ডার এগিয়ে যাওয়ার অনুমতি নেই। এটি আপনার ঠিকানার সঠিক দূরত্ব, সময় এবং ফি গণনা করতে সাহায্য করে। আপনার ফোন জিপিএস সনাক্ত করতে না পারলে, হোয়াটসঅ্যাপে অর্ডার করুন বা আমাদের কল করুন।",
    whatsapp: "হোয়াটসঅ্যাপে অর্ডার করুন",
  },
  guarantees: [
    { label: "কোয়ালিটি চেকড", sub: "প্রতিটি অর্ডার" },
    { label: "বদলের নীতি", sub: "২:৫৯ ঘণ্টার মধ্যে" },
    { label: "ফ্রি ডেলিভারি", sub: "₹২৯৯+ অর্ডারে" },
    { label: "১০-৩০ মিনিট", sub: "দোরগোড়ায় ডেলিভারি" },
  ],
  footer: { phone: "+৯১ ৭০২৯৯০৮২৭৮", copyright: "© ২০২৬ সর্বস্বত্ব সংরক্ষিত" },
  langPicker: {
    title: "আপনার ভাষা বেছে নিন",
    subtitle: "চালিয়ে যেতে আপনার পছন্দের ভাষা নির্বাচন করুন",
    options: [
      { code: "en", label: "English", native: "English" },
      { code: "bn", label: "Bengali", native: "বাংলা" },
      { code: "hi", label: "Hindi", native: "हिन्दी" },
    ],
  },
};
const hi: LandingTranslations = {
  lang: "hi",
  hero: {
    badge: "शिलिगुड़ी की #1 फ्रेश डिलीवरी",
    heading1: "बासी मछली से परेशान?",
    heading2: "आज की ताज़ी मछली घर पर मंगवाएं",
    subtitle: "प्रीमियम मछली, मुर्गी, मटन और किराना — हर सुबह ताज़ा सोर्स करके 10-30 मिनट में डिलीवर। ना कोई कोल्ड स्टोरेज, ना कोई बिचौलिया।",
    downloadBtn: "ऐप डाउनलोड करें",
    orderNow: "अभी ऑर्डर करें",
    bulkOrders: "बल्क ऑर्डर",
    statOrders: "ऑर्डर",
    statProducts: "प्रोडक्ट",
    statRating: "रेटिंग ★",
  },
  download: {
    eyebrow: "ऐप डाउनलोड करें",
    heading1: "ताज़ी मछली,",
    heading2: "एक टैप में",
    desc: "200+ ताज़े प्रोडक्ट्स में से ऑर्डर करें। लाइव डिलीवरी ट्रैक करें। डिलीवरी पर या UPI से पेमेंट करें।",
    pills: ["लाइव ट्रैकिंग", "UPI और COD", "10 मिनट में डिलीवरी", "क्वालिटी चेक्ड"],
    btn: "ऐप डाउनलोड करें",
    phoneAppName: "शिलिगुड़ी फ्रेश मार्ट",
    phoneTagline: "2024 से ताज़ा डिलीवरी",
    phoneSearch: "ताज़ी मछली खोजें...",
    phoneCats: ["मछली", "मुर्गी", "मटन", "सब्ज़ी", "फल", "अंडे"],
    phoneProducts: [
      { name: "रोहू मछली", price: "₹280/किलो", tag: "ताज़ा" },
      { name: "देसी मुर्गी", price: "₹350/किलो", tag: "लोकप्रिय" },
    ],
    floatingDelivery: "रास्ते में है!",
    floatingEta: "8 मिनट में पहुँचेगा",
    floatingRating: "4.8 ★ रेटिंग",
    floatingOrders: "5000+ ऑर्डर",
  },
  howItWorks: {
    eyebrow: "आसान और तेज़",
    heading: "कैसे काम करता है",
    steps: [
      { title: "ब्राउज़ करें", desc: "200+ ताज़े प्रोडक्ट्स में से चुनें — मछली, मुर्गी, मटन, सब्ज़ियाँ, फल और बहुत कुछ।" },
      { title: "हम सोर्स और चेक करते हैं", desc: "पैक करने से पहले हम खुद हर चीज़ सोर्स, साफ़ और क्वालिटी चेक करते हैं।" },
      { title: "ताज़ा डिलीवरी", desc: "आपका ऑर्डर 10-30 मिनट में दरवाज़े पर पहुँच जाता है, ताज़ा और रेडी।" },
    ],
  },
  categories: {
    eyebrow: "हमारी रेंज",
    heading: "कैटेगरी से खरीदें",
    subtitle: "नदी की मछली से लेकर ऑर्गेनिक सब्ज़ियाँ — सब कुछ रोज़ाना ताज़ा सोर्स।",
    items: [
      { name: "ताज़ी मछली", count: "50+ वैarieties" },
      { name: "मुर्गी", count: "देसी और ब्रॉयलर" },
      { name: "मटन", count: "करी कट और प्रीमियम" },
      { name: "सब्ज़ियाँ", count: "रोज़ाना ताज़ी" },
      { name: "फल", count: "सीज़नल और एक्सोटिक" },
      { name: "दूध और अंडे", count: "फार्म फ्रेश अंडे" },
    ],
  },
  features: {
    eyebrow: "क्यों चुनें हमें",
    heading: "फ्रेश मार्ट का फ़र्क",
    items: [
      { title: "10-30 मिनट में डिलीवरी", desc: "बाज़ार से आपके दरवाज़े तक — 4 किमी के अंदर तेज़ डिलीवरी। हम NJP गेट बाज़ार हब से 20 किमी तक डिलीवरी करते हैं।" },
      { title: "क्वालिटी गारंटीड", desc: "हर चीज़ भेजने से पहले चेक। संतुष्ट नहीं? बदल देंगे — कोई सवाल नहीं।" },
      { title: "दूरी आधारित प्राइसिंग", desc: "8 किमी तक फ्री डिलीवरी। 8-20 किमी में न्यूनतम ऑर्डर के साथ छोटा शुल्क। कोई छुपी हुई फीस नहीं।" },
      { title: "आज का ताज़ा", desc: "रात भर स्टोर कुछ नहीं। जो मिलेगा वो सुबह का सोर्स किया हुआ।" },
    ],
  },
  whyCostMore: {
    eyebrow: "पारदर्शी कीमत",
    heading: "थोड़ा महंगा क्यों हैं",
    subtitle: "हम सबसे सस्ते नहीं, सबसे ताज़ा हैं। ये रही वजह।",
    items: [
      { title: "आज सुबह की मछली", desc: "हम सुबह 5 बजे बाज़ार से खरीदते हैं। जो मछली आज सुबह पानी में थी — 3 दिन फ्रीज़र में नहीं। इस ताज़गी की कीमत थोड़ी ज़्यादा है, लेकिन फ़र्क आपको स्वाद में दिखेगा।" },
      { title: "पैकिंग से पहले हाथ से चेक", desc: "हर मछली, हर मुर्गी का टुकड़ा — हम खुद चेक करते हैं। गिल्स, टेक्सचर, गंध — परफेक्ट नहीं तो नहीं भेजते। सुपरमार्केट ये गारंटी नहीं दे सकता।" },
      { title: "बदलने की गारंटी", desc: "पसंद नहीं आया? बदल देंगे। कोई सवाल नहीं, कोई झंझट नहीं। आपकी संतुष्टि ही हमारी गारंटी है।" },
      { title: "आपके वक़्त की कीमत", desc: "बाज़ार जाने में 1-2 घंटे लगते हैं — आना-जाना, भाव-ताव, इंतज़ार। हम 10 मिनट में दरवाज़े पर दे देते हैं। ₹40 की डिलीवरी फ़ीस आपके घंटे बचाती है।" },
    ],
    bottomLine: "आप प्रति किलो ₹10-20 ज़्यादा देते हैं। बदले में: ताज़गी की गारंटी, ज़ीरो बाज़ार का झंझट, साफ़ पैकेजिंग, और एक डिलीवरी बॉय जो आपका नाम जानता है।",
  },
  freshness: {
    eyebrow: "ताज़गी का वादा",
    heading: "बाज़ार बनाम फ्रेश मार्ट",
    market: {
      label: "❌ आम बाज़ार",
      points: ["कल या उससे पहले पकड़ी मछली", "घंटों बरफ में रखी", "दर्जनों लोगों ने छुई", "प्लास्टिक बैग में घर ले जाएं", "ख़राब निकले तो कोई बदल नहीं"],
    },
    us: {
      label: "✅ शिलिगुड़ी फ्रेश मार्ट",
      points: ["आज सुबह पकड़ी और सोर्स की", "सोर्सिंग के 1 घंटे में पैक", "हमारी टीम ने क्वालिटी चेक की", "10 मिनट में दरवाज़े पर", "पसंद नहीं तो पूरा बदल देंगे"],
    },
  },
  cta: {
    badge: "शिलिगुड़ी की भरोसेमंद पसंद",
    heading1: "अब हर सुबह",
    heading2: "बाज़ार जाना बंद करें",
    desc: "हम बाज़ार जाते हैं ताकि आपको न जाना पड़े। आज का ताज़ा माल, साफ़, पैक, और आपके दरवाज़े पर।",
    startShopping: "अभी खरीदें",
    whatsappUs: "WhatsApp पर बात करें",
  },
  testimonials: {
    eyebrow: "शिलिगुड़ी का प्यार",
    heading: "हमारे ग्राहक क्या कहते हैं",
    items: [
      { text: "शिलिगुड़ी की बेस्ट मछली डिलीवरी! इलिश बेहद ताज़ी थी। मैं अब बाज़ार ही नहीं जाती।", name: "प्रिया एस.", area: "प्रधाननगर" },
      { text: "मटन की क्वालिटी अनमैच्ड। करी कट परफेक्ट था। एक टमाटर थोड़ा दबा था, उसे भी बदल दिया।", name: "राहुल एम.", area: "भक्तिनगर" },
      { text: "सुबह 8 बजे ऑर्डर किया, 8:20 पर मिल गया। मछली अभी भी सुबह की ताज़ी थी। शानदार स्पीड!", name: "अंजलि डी.", area: "हाकिमपाड़ा" },
      { text: "देसी मुर्गी बिल्कुल वही थी जो चाहिए था। ताज़ी, साफ़, और सही पैकिंग में डिलीवरी।", name: "विक्रम सी.", area: "शांतिपाड़ा" },
      { text: "अब हर हफ़्ते मछली ऑर्डर करता हूँ। क्वालिटी कंसिस्टेंट। डिलीवरी बॉय हमेशा केयर से लाता है।", name: "सुमन जी.", area: "माटीगाड़ा" },
      { text: "इनके टाइगर प्रॉन्स ट्राई किए — एकदम परफेक्ट। घर पर रेस्टोरेंट जैसा। हर पैसा वर्थ।", name: "रिना बी.", area: "चंपासारी" },
    ],
  },
  deliveryTime: {
    hubLabel: "हमारा हब: NJP गेट बाज़ार, शिलिगुड़ी",
    title: "डिलीवरी समय और चार्ज",
    subtitle: "सभी ऑर्डर हमारे शिलिगुड़ी के NJP गेट बाज़ार हब से भेजे जाते हैं। डिलीवरी का समय और शुल्क आपकी हब से दूरी पर निर्भर करता है — चेकआउट पर GPS लोकेशन अपने आप कैलकुलेट होता है।",
    headerDistance: "हब से दूरी",
    headerEta: "अनुमानित समय",
    headerMinOrder: "न्यूनतम ऑर्डर",
    headerFee: "डिलीवरी शुल्क",
    row1Dist: "1 किमी के अंदर", row1Eta: "10-20 मिनट", row1Min: "कोई न्यूनतम नहीं", row1Fee: "मुफ्त",
    row2Dist: "1 - 4 किमी", row2Eta: "20-30 मिनट", row2Min: "कोई न्यूनतम नहीं", row2Fee: "मुफ्त",
    row3Dist: "4 - 8 किमी", row3Eta: "45-60 मिनट", row3Min: "कोई न्यूनतम नहीं", row3FeeFree: "मुफ्त", row3FeeSmall: "₹99 से कम पर ₹59, ₹299 से कम पर ₹40",
    row4Dist: "8 - 15 किमी", row4Eta: "1.5 - 2 घंटे", row4Min: "₹800", row4Fee: "₹79", row4FeeFree: "₹800+ पर मुफ्त",
    row5Dist: "15 - 20 किमी", row5Eta: "2 - 3 घंटे", row5Min: "₹1,499", row5Fee: "₹99", row5FeeFree: "₹1,499+ पर मुफ्त",
    note: "चेकआउट पर GPS लोकेशन अनिवार्य है — इसके बिना ऑर्डर आगे नहीं बढ़ सकता। यह आपके पते की सही दूरी, समय और शुल्क कैलकुलेट करने में मदद करता है। अगर आपका फोन GPS डिटेक्ट नहीं कर पा रहा, तो WhatsApp पर ऑर्डर करें या हमें कॉल करें।",
    whatsapp: "WhatsApp पर ऑर्डर करें",
  },
  guarantees: [
    { label: "क्वालिटी चेक्ड", sub: "हर ऑर्डर" },
    { label: "बदलने की पॉलिसी", sub: "2:59 घंटे में" },
    { label: "फ्री डिलीवरी", sub: "₹299+ ऑर्डर पर" },
    { label: "10-30 मिनट", sub: "दरवाज़े पर डिलीवरी" },
  ],
  footer: { phone: "+91 7029908278", copyright: "© 2026 सर्वाधिकार सुरक्षित" },
  langPicker: {
    title: "अपनी भाषा चुनें",
    subtitle: "जारी रखने के लिए अपनी पसंदीदा भाषा चुनें",
    options: [
      { code: "en", label: "English", native: "English" },
      { code: "bn", label: "Bengali", native: "বাংলা" },
      { code: "hi", label: "Hindi", native: "हिन्दी" },
    ],
  },
};

export const translations: Record<Lang, LandingTranslations> = { en, bn, hi };

export function getTranslation(lang: Lang): LandingTranslations {
  return translations[lang] || en;
}
