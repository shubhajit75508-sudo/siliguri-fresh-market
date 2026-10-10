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
    "Durga Puja 2026 Special – Fresh Fish, Chicken & Mutton Delivery in Siliguri | Siliguri Freshmart",
  description:
    "Order fresh fish (hilsa, rohu, prawns), chicken & mutton for Durga Puja in Siliguri, 17–21 Oct. Bhog-ready, cut to order, delivered to your doorstep across all of Siliguri. Free delivery above ₹299. Order before 11 AM for the Morning Slot.",
  keywords: [
    "durga puja fish delivery Siliguri",
    "pujo fish online Siliguri",
    "durga puja 2026 Siliguri",
    "pujo bhog order Siliguri",
    "ashtami bhog fish delivery",
    "fresh fish for durga puja",
    "chicken delivery durga puja Siliguri",
    "mutton for puja Siliguri",
    "pandal fish delivery Siliguri",
    "durga puja home delivery Siliguri",
    "দুর্গাপুজো সিলিগুড়ি",
    "পুজোর জন্য মাছ সিলিগুড়ি",
    "পুজোর কেনাকাটা সিলিগুড়ি",
    "মা দুর্গা",
    "অষ্টমী ভোগ",
    "সন্ধিপুজো",
    "সিঁদুর খেলা",
  ],
  heroHeading: "Durga Puja 2026 — Fresh fish & meat for your pujo",
  heroSub:
    "Order hilsa, rohu, prawns, chicken & mutton for Bodhon to Dashami (17–21 October). Sourced fresh from Siliguri's morning markets, cut to order, delivered to your doorstep before the anjali.",
  contentHeading: "Why Siliguri Freshmart for your pujo shopping?",
  content:
    "Durga Puja is Siliguri's biggest festival — over 800 pandals and lakhs of families host bhog, anjali and get-togethers that demand the freshest fish and meat. From Maha Shashthi (17 Oct) to Vijaya Dashami (21 Oct), we keep our full range stocked daily: Hilsa for the festive thali, Rohu and Katla for jhol, Prawns and Mutton for the family spread. Everything is sourced fresh every morning from Siliguri's local markets, cut and cleaned exactly how you need it, and delivered the same day. Order before 11 AM for the Morning Slot (11 AM – 1 PM) and your kitchen is ready before the puja beckons.",
  deliveryInfo:
    "Same-day puja delivery across Siliguri. Within 8 km arrives in 1–2 hours; 8–16 km in the 11 AM – 1 PM Morning Slot (order before 11 AM); 16–20 km in the 2 PM – 3 PM Afternoon Slot (order before 2 PM).",
  startDate: "2026-10-17",
  endDate: "2026-10-21",
  faq: [
    {
      question: "Can I order fresh fish for Durga Puja bhog in Siliguri?",
      answer:
        "Yes. Siliguri Freshmart stocks Hilsa, Rohu, Katla, Prawns, Chicken and Mutton throughout Durga Puja (17–21 October). You can order online, call 7029908278, or WhatsApp us. Fish is scaled, gutted and cut to your preference and delivered the same day to your address anywhere in Siliguri.",
    },
    {
      question: "Do you deliver during Durga Puja in Siliguri?",
      answer:
        "Yes, we deliver every day from 9 AM – 4 PM through the puja. Within 8 km of our hub at MCQF+GFQ your order arrives in 1–2 hours. Beyond 8 km, orders placed before 11 AM are delivered in the 11 AM – 1 PM Morning Slot, and before 2 PM in the 2 PM – 3 PM Afternoon Slot.",
    },
    {
      question: "How early should I order fish for Maha Ashtami or Navami?",
      answer:
        "For a guaranteed delivery on the day you need it, order the night before or before 11 AM that morning. The morning slots fill up first during puja, so ordering before 11 AM locks in the 11 AM – 1 PM delivery window.",
    },
    {
      question: "Do you deliver to pandal areas and puja committees in Siliguri?",
      answer:
        "Yes. We deliver across all of Siliguri including Shantipara, Pradhan Nagar, Hakimpara, Matigara, Bagdogra, Bhaktinagar, Champasari and Sukna. For bulk or committee orders (bhog for 50+ people), call us at 7029908278 or +91 96354 80453 for special pricing.",
    },
    {
      question: "Can I order family-size fish, chicken or mutton for puja get-togethers?",
      answer:
        "Absolutely. Order any quantity online with your preferred cut and cleaning (whole, steaks, curry cut, Bengali cut). For large family or committee orders above ₹1,499, delivery is free within our coverage area — call us to arrange a custom order.",
    },
    {
      question: "Is anything special happening for Pujo at Siliguri Freshmart?",
      answer:
        "Throughout Durga Puja (17–21 October) we keep Hilsa, Rohu, Katla, Prawns, Chicken and Mutton fully stocked with same-day delivery, free delivery above ₹299, and priority WhatsApp ordering. Use the WhatsApp button on our website to send your puja list directly to our team.",
    },
  ],
} as const;