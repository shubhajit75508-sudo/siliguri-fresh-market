export interface FishSubcatSEO {
  value: string;
  title: string;
  description: string;
  keywords: string[];
  heroHeading: string;
  heroSub: string;
  contentHeading: string;
  content: string;
  deliveryInfo: string;
  relatedFish: string[];
}

export const FISH_SUBCAT_SEO: Record<string, FishSubcatSEO> = {
  river: {
    value: "river",
    title: "Buy Fresh River Fish Online in Siliguri | Rohu, Katla, Mrigel | Home Delivery",
    description:
      "Order fresh river fish online in Siliguri. Rohu, Katla, Mrigel, Bhetki from Teesta & Mahananda rivers. Cut & cleaned to order. Free delivery in 30 minutes. Siliguri Fresh Mart.",
    keywords: [
      "fresh river fish Siliguri",
      "rohu fish delivery Siliguri",
      "katla fish online Siliguri",
      "mrigel fish home delivery",
      "bhetki fish Siliguri",
      "river fish near me Siliguri",
      "buy fish online Siliguri",
      "Teesta river fish",
      "Mahananda river fish",
      "freshwater fish delivery",
    ],
    heroHeading: "Fresh River Fish — Straight from Teesta & Mahananda",
    heroSub: "Rohu, Katla, Mrigel, Bhetki and more — sourced daily from Siliguri's local rivers, cleaned and delivered to your door.",
    contentHeading: "Why Order River Fish from Siliguri Fresh Mart?",
    content:
      "Siliguri sits at the confluence of the Teesta and Mahananda rivers — two of North Bengal's most productive freshwater fisheries. Every morning, our team picks up the day's catch directly from riverbank markets in Jalpaiguri and Siliguri. No middlemen, no cold storage, no freezing. The fish you receive was swimming just hours ago. We clean, gut, and cut each fish exactly the way you want — into steaks, fillets, or curry pieces.",
    deliveryInfo: "Same-day delivery across Siliguri. Fish arrives within 30 minutes of your order. Cut & cleaning instructions noted at checkout.",
    relatedFish: ["Bhetki (Barramundi)", "Pabda (Butterfish)", "Aair (Catfish)", "Chingri (Prawns)"],
  },
  sea: {
    value: "sea",
    title: "Buy Fresh Sea Fish Online in Siliguri | Pomfret, Bombay Duck, Sole | Delivery",
    description:
      "Order fresh sea fish online in Siliguri. Pomfret, Bombay Duck, Sole, Surmai & more. Sourced from Digha & Mandarbani markets. Free delivery in 30 min.",
    keywords: [
      "sea fish delivery Siliguri",
      "pomfret fish online Siliguri",
      "bombay duck fish Siliguri",
      "sole fish home delivery",
      "surmai fish Siliguri",
      "sea fish near me",
      "buy sea fish Siliguri",
      "Digha fish delivery",
      "saltwater fish online",
    ],
    heroHeading: "Fresh Sea Fish — Coastal Catch, Delivered Fresh",
    heroSub: "Pomfret, Bombay Duck, Sole, Surmai and more — sourced from Bengal's coast and delivered to your Siliguri home.",
    contentHeading: "Ocean-Fresh Sea Fish in Siliguri",
    content:
      "Though Siliguri is inland, we bring the coast to you. Our sea fish arrives daily from Digha, Mandarbani, and Haldia fish markets via refrigerated transport. We source only the freshest batches — Pomfret with firm flesh, Bombay Duck still moist, and Sole with clean white fillets. Each piece is inspected before dispatch. You get genuine coastal quality without travelling to the coast.",
    deliveryInfo: "Sea fish delivered same-day across Siliguri. Place your order before 1 PM for guaranteed availability.",
    relatedFish: ["Pomfret (Rupchanda)", "Bombay Duck (Bombil)", "Sole (Sole Fish)", "Surmai (Kingfish)"],
  },
  hilsa: {
    value: "hilsa",
    title: "Buy Fresh Hilsa Fish Online in Siliguri | Ilish | Home Delivery",
    description:
      "Order fresh Hilsa (Ilish) fish online in Siliguri. Authentic Bangladeshi & Bengali Hilsa. Cleaned & delivered in 30 min. Limited stock daily.",
    keywords: [
      "hilsa fish Siliguri",
      "ilish fish delivery",
      "buy hilsa online Siliguri",
      "fresh hilsa near me",
      "Bangladeshi hilsa Siliguri",
      "ilish fish home delivery",
      "hilsa price Siliguri",
      "jhil hilsa online",
      "pabda hilsa Siliguri",
    ],
    heroHeading: "Authentic Hilsa (Ilish) — The King of Fish",
    heroSub: "Fresh Hilsa sourced from Bangladesh & Bengal. Limited daily stock — order early. Cleaned, gutted, and delivered to your door.",
    contentHeading: "Hilsa — Bengali Pride, Delivered Fresh",
    content:
      "Hilsa (Ilish) is more than a fish in Bengal — it's a cultural icon. We source authentic Hilsa from riverine fisheries in Bangladesh and West Bengal, delivered to Siliguri while the flesh is still firm and the fat content is high. Each Hilsa is inspected for quality — bright eyes, silver scales, and that distinctive sweet aroma. We clean and cut it exactly as you prefer: steaks, longitudinal slices, or whole. Hilsa is best enjoyed fresh, and that's how we deliver it.",
    deliveryInfo: "Hilsa is a limited-stock item. Order before 10 AM for same-day delivery. Available while stock lasts.",
    relatedFish: ["Pabda (Butterfish)", "Chingri (Prawns)", "Bhetki (Barramundi)", "Rohu"],
  },
  prawns: {
    value: "prawns",
    title: "Buy Fresh Prawns Online in Siliguri | Tiger Prawns, Golda, Chingri | Delivery",
    description:
      "Order fresh prawns online in Siliguri. Tiger prawns, Golda chingri, small prawns & more. Deveined & cleaned. Free delivery in 30 min.",
    keywords: [
      "prawns delivery Siliguri",
      "tiger prawns online Siliguri",
      "golda chingri Siliguri",
      "fresh prawns near me",
      "buy prawns online Siliguri",
      "chingri mach online",
      "sea prawns home delivery",
      "jhinga fish Siliguri",
    ],
    heroHeading: "Fresh Prawns — Tiger, Golda & More",
    heroSub: "Large tiger prawns, sweet golda chingri, and everyday prawns — deveined, cleaned, and delivered fresh across Siliguri.",
    contentHeading: "Premium Prawns Delivered to Your Kitchen",
    content:
      "Prawns are a Siliguri favourite, and we take them seriously. Our Tiger Prawns are large, firm, and sweet — perfect for garlic butter or tandoori. Golda Chingri (giant freshwater prawns) arrive with heads on for that authentic Bengali malai curry. Smaller prawns are cleaned and deveined, ready for your stir-fry or curry. We source from both coastal and riverine fisheries, ensuring variety and freshness year-round.",
    deliveryInfo: "Prawns delivered same-day. Tiger Prawns are subject to daily availability — order early for guaranteed stock.",
    relatedFish: ["Hilsa (Ilish)", "Rohu", "Bhetki (Barramundi)", "Crab"],
  },
  small: {
    value: "small",
    title: "Buy Fresh Small Fish Online in Siliguri | Boroli, Puthi, Kachki | Delivery",
    description:
      "Order fresh small fish online in Siliguri. Boroli, Puthi, Kachki, Tangra & more. Whole or cleaned. Free delivery in 30 min.",
    keywords: [
      "small fish delivery Siliguri",
      "boroli fish online",
      "puthi fish Siliguri",
      "kachki fish home delivery",
      "tangra fish online Siliguri",
      "small fish near me",
      "freshwater small fish",
      "bengali small fish online",
    ],
    heroHeading: "Fresh Small Fish — Boroli, Puthi, Kachki & More",
    heroSub: "North Bengal's beloved small fish — boroli, puthi, kachki, tangra — sourced fresh and delivered whole or cleaned to your door.",
    contentHeading: "Small Fish, Big Flavour — From North Bengal's Rivers",
    content:
      "Small fish are a North Bengal specialty. Boroli (an endangered species of river fish found only in Himalayan foothills) is prized for its delicate flavour. Puthi, Kachki, and Tangra are staples in Bengali households — often fried whole with a dusting of turmeric and salt. We source these from Teesta and Mahananda river markets, where fishermen bring their catch fresh each morning. Each batch is sorted by size and quality before dispatch.",
    deliveryInfo: "Small fish are often limited batches. Order before 10 AM for same-day availability.",
    relatedFish: ["Boroli", "Puthi", "Kachki", "Tangra"],
  },
  exotic: {
    value: "exotic",
    title: "Buy Exotic Fish Online in Siliguri | Salmon, Trout, Basa | Home Delivery",
    description:
      "Order exotic and premium fish online in Siliguri. Salmon, Trout, Basa, Swordfish & more. Delivered fresh in 30 min.",
    keywords: [
      "exotic fish Siliguri",
      "salmon fish online Siliguri",
      "trout fish delivery",
      "basa fish online",
      "premium fish delivery Siliguri",
      "buy salmon online Siliguri",
      "exotic seafood near me",
      "swordfish Siliguri",
    ],
    heroHeading: "Exotic & Premium Fish — Salmon, Trout, Basa",
    heroSub: "Premium imported and farmed fish — Salmon, Trout, Basa, and more — delivered fresh to your Siliguri home.",
    contentHeading: "Premium Exotic Fish in Siliguri",
    content:
      "Not all fish is created equal. Our exotic range includes Norwegian Salmon, Rainbow Trout, Basa, and Swordfish — sourced from certified farms and flown in fresh. Whether you're planning a sashimi night, a grilled fish dinner, or just want to try something new, our exotic selection brings world-class fish to Siliguri. Each piece is vacuum-packed for freshness and delivered in temperature-controlled packaging.",
    deliveryInfo: "Exotic fish is restocked weekly. Pre-order for guaranteed availability. Delivered in insulated packaging.",
    relatedFish: ["Salmon", "Trout", "Basa", "Swordfish"],
  },
  other: {
    value: "other",
    title: "Buy Fresh Fish Online in Siliguri | Mixed Variety | Home Delivery",
    description:
      "Order fresh mixed variety fish online in Siliguri. Seasonal catches, local specials & more. Cleaned & delivered in 30 min.",
    keywords: [
      "fish delivery Siliguri",
      "fresh fish online",
      "seasonal fish Siliguri",
      "mixed fish online",
      "buy fish near me",
      "local fish Siliguri",
      "fresh fish home delivery",
    ],
    heroHeading: "Fresh Catch of the Day — Seasonal & Local",
    heroSub: "Seasonal specials, local favourites, and today's best catch — discover what's fresh right now at Siliguri Fresh Mart.",
    contentHeading: "Today's Fresh Catch — Always Something New",
    content:
      "Our 'Other' category is where you'll find seasonal specials, local favourites, and today's best catch. From Chitala (featherback) to Boal (wallago), from seasonal river crabs to local shellfish — this category keeps things exciting. We source whatever is freshest and most abundant from Siliguri's morning markets. Check back daily — the selection changes with the seasons and the river.",
    deliveryInfo: "Selection changes daily based on what's freshest. Check back or call us for today's availability.",
    relatedFish: ["Chitala", "Boal", "Crab", "Seasonal Catch"],
  },
};
