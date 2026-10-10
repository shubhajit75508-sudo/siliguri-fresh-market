export interface FAQ {
  question: string;
  answer: string;
}

export interface DurgaPujaSEO {
  title: string;
  description: string;
  keywords: string[];
  heroHeading: string;
  heroSub: string;
  contentHeading: string;
  content: string;
  deliveryInfo: string;
  startDate: string;
  endDate: string;
  faq: FAQ[];
}

export const DURGA_PUJA_SEO: DurgaPujaSEO = {
  title:
    "Durga Puja 2026 – Fresh Fruits, Puja Essentials & Daily Essentials in Siliguri | Siliguri Freshmart",
  description:
    "Order fresh fruits for anjali & prasad, vegetables for bhog khichuri, dairy and daily essentials for Durga Puja in Siliguri, 17–21 Oct. Same-day doorstep delivery across all of Siliguri. Free delivery above ₹299. Order before 11 AM for the Morning Slot.",
  keywords: [
    "anjali fruits Siliguri",
    "puja fruit delivery Siliguri",
    "bhog khichuri vegetables Siliguri",
    "durga puja grocery delivery Siliguri",
    "durga puja 2026 Siliguri",
    "pujo bhog order Siliguri",
    "puja prasad fruit online",
    "fresh fruit home delivery Siliguri",
    "pandal delivery Siliguri",
    "durga puja home delivery Siliguri",
    "দুর্গাপুজো সিলিগুড়ি",
    "আঞ্জলির ফল সিলিগুড়ি",
    "পুজোর ফল সিলিগুড়ি",
    "ভোগের সবজি সিলিগুড়ি",
    "পুজোর কেনাকাটা সিলিগুড়ি",
    "মা দুর্গা",
    "অষ্টমী ভোগ",
    "সিঁদুর খেলা",
  ],
  heroHeading: "Durga Puja 2026 — Puja essentials & fresh home needs for your pujo",
  heroSub:
    "Order fresh fruits for anjali & prasad, vegetables for bhog, and your daily essentials — delivered same-day across Siliguri from Bodhon to Dashami (17–21 October). We respect every family's tradition, so we also keep fish, chicken & mutton available separately for households that cook at home during the puja.",
  contentHeading: "Serving every pujo need, with respect for every tradition",
  content:
    "Durga Puja is Siliguri's biggest festival — over 800 pandals and lakhs of families host bhog, anjali and get-togethers. Fresh fruits are offered at anjali and prasad, vegetables go into the bhog khichuri and bhaja, and dairy completes the festive kitchen. From Maha Shashthi (17 Oct) to Vijaya Dashami (21 Oct) we keep these puja essentials fully stocked every day, sourced fresh each morning from Siliguri's local markets and delivered to your doorstep the same day.\n\nWe understand that food traditions differ from family to family — many households keep their pujo sattvik and avoid non-veg during the days of worship. That is entirely your call. So we present fish, chicken and mutton separately for families whose home cooking follows its own custom during the puja, nothing more, nothing less. Whatever your pujo table needs, order before 11 AM for the Morning Slot (11 AM – 1 PM) and your kitchen is ready before the puja beckons.",
  deliveryInfo:
    "Same-day puja delivery across Siliguri. Within 8 km arrives in 1–2 hours; 8–16 km in the 11 AM – 1 PM Morning Slot (order before 11 AM); 16–20 km in the 2 PM – 3 PM Afternoon Slot (order before 2 PM).",
  startDate: "2026-10-17",
  endDate: "2026-10-21",
  faq: [
    {
      question: "Can I order fresh fruits for anjali and prasad during Durga Puja?",
      answer:
        "Yes. We deliver fresh seasonal fruits every day throughout Durga Puja for your anjali and prasad — the kinds traditionally offered at the puja. Order online or WhatsApp us, and they arrive the same day at your address anywhere in Siliguri.",
    },
    {
      question: "Can I order vegetables and kitchen essentials for bhog in Siliguri?",
      answer:
        "Absolutely. From bhog khichuri vegetables to ghee, milk and daily kitchen staples, we keep everything stocked for the puja kitchen (17–21 October). Order before 11 AM and your essentials arrive before the bhog begins.",
    },
    {
      question: "Do you deliver during Durga Puja in Siliguri?",
      answer:
        "Yes, we deliver every day from 9 AM – 4 PM through the puja. Within 8 km of our hub at MCQF+GFQ your order arrives in 1–2 hours. Beyond 8 km, orders placed before 11 AM are delivered in the 11 AM – 1 PM Morning Slot, and before 2 PM in the 2 PM – 3 PM Afternoon Slot.",
    },
    {
      question: "Do you deliver to pandal areas and puja committees in Siliguri?",
      answer:
        "Yes. We deliver across all of Siliguri including Shantipara, Pradhan Nagar, Hakimpara, Matigara, Bagdogra, Bhaktinagar, Champasari and Sukna. For bulk or committee orders (bhog or bhog-prasad for a large gathering), call us at 7029908278 or +91 96354 80453 for special arrangements.",
    },
    {
      question: "Is it okay to order fish and meat during Durga Puja?",
      answer:
        "We completely understand that food customs differ from family to family, and many households keep the pujo days sattvik — that is why our puja essentials (fruits, vegetables, dairy) are always highlighted first. For families that cook at home during the puja, we also keep fresh fish, chicken and mutton available as a separate option, delivered exactly the same way. The choice is always and entirely yours, and we respect it.",
    },
    {
      question: "What do you offer beyond fruits and bhog essentials for Pujo?",
      answer:
        "Alongside puja essentials, we deliver your regular daily needs — rice, dal, oil, spices, eggs, milk, curd and more — so you don't have to step out of the puja rush. Same-day delivery, free above ₹299, and priority WhatsApp ordering throughout 17–21 October.",
    },
  ],
} as const;