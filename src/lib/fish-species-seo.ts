import type { FAQ } from "./fish-subcat-seo";

export interface FishSpeciesSEO {
  value: string;
  name: string;
  scientificName: string;
  subcategory: string;
  title: string;
  description: string;
  keywords: string[];
  heroHeading: string;
  heroSub: string;
  content: string;
  nutrition: { label: string; value: string }[];
  bestFor: string[];
  faq: FAQ[];
}

export const FISH_SPECIES_SEO: Record<string, FishSpeciesSEO> = {
  rohu: {
    value: "rohu",
    name: "Rohu",
    scientificName: "Labeo rohita",
    subcategory: "river",
    title: "Buy Fresh Rohu Fish Online in Siliguri | Price & Home Delivery",
    description:
      "Order fresh Rohu fish online in Siliguri. Farm-fresh from Teesta & Mahananda rivers. Cut & cleaned to order. Free delivery in 30 min. Rs.320/kg.",
    keywords: [
      "rohu fish Siliguri",
      "buy rohu fish online",
      "rohu fish price Siliguri",
      "rohu fish delivery",
      "fresh rohu near me",
      "rohu fish order online",
      "katala rohu Siliguri",
      "river rohu fresh",
    ],
    heroHeading: "Fresh Rohu Fish — Teesta & Mahananda River Catch",
    heroSub: "Firm, mild-flavoured river rohu — cleaned, cut into steaks or fillets, and delivered to your Siliguri home in 30 minutes.",
    content:
      "Rohu (Labeo rohita) is the most popular freshwater fish in Bengal, known for its firm, white flesh and mild sweet flavour. Our Rohu is sourced daily from the Teesta and Mahananda rivers near Siliguri — it was swimming just hours before delivery. Perfect for Bengali-style jhol (light curry), fried steaks, or macher jhal. Each fish is inspected for freshness: clear eyes, bright red gills, and firm flesh. We clean, gut, and cut it exactly as you prefer.",
    nutrition: [
      { label: "Protein", value: "17g per 100g" },
      { label: "Omega-3", value: "High" },
      { label: "Fat", value: "Low" },
      { label: "Calories", value: "97 kcal" },
    ],
    bestFor: ["Fish curry (jhol)", "Deep-fried steaks", "Mustard fish (shorshe)", "Grilled"],
    faq: [
      { question: "What is the price of rohu fish in Siliguri?", answer: "Fresh Rohu at Siliguri Fresh Mart starts from Rs.320 per kg. Prices may vary based on daily market rates. We offer 500g, 1kg, and 2kg weight options with steaks, fillets, or curry cut." },
      { question: "Is rohu fish good for health?", answer: "Yes, Rohu is an excellent source of lean protein and omega-3 fatty acids. It's low in fat and high in nutrients, making it ideal for heart health and muscle building. Bengali households consider it one of the healthiest river fish." },
      { question: "How to order rohu fish online in Siliguri?", answer: "Visit siligurifreshmart.com, search for 'Rohu', select your preferred weight and cut, and place your order. We accept COD and UPI. Delivery is free on orders above Rs.299." },
    ],
  },
  katla: {
    value: "katla",
    name: "Katla",
    scientificName: "Catla catla",
    subcategory: "river",
    title: "Buy Fresh Katla Fish Online in Siliguri | Premium River Fish Delivery",
    description:
      "Order fresh Katla fish online in Siliguri. Premium river fish from Mahananda river. Cut to order. Free delivery in 30 min. Rs.450/kg.",
    keywords: [
      "katla fish Siliguri",
      "buy katla fish online",
      "katla fish price Siliguri",
      "katla fish delivery",
      "fresh katla near me",
      "katla fish order",
      "premium katla Siliguri",
    ],
    heroHeading: "Fresh Katla Fish — Premium River Catch",
    heroSub: "Large, oil-rich katla from the Mahananda river — the king of Bengali fish curries, delivered fresh to your door.",
    content:
      "Katla (Catla catla) is the larger, richer cousin of Rohu — known for its broad head, oily flesh, and bold flavour. Katla is the preferred fish for special occasions in Bengali households, especially for doi katla (yogurt curry) and kalia (rich gravy). Our Katla is sourced from the Mahananda river, one of the best Katla fisheries in North Bengal. The fish we deliver has firm, pinkish flesh with a distinctive sweet aroma of fresh river water.",
    nutrition: [
      { label: "Protein", value: "16g per 100g" },
      { label: "Omega-3", value: "Very High" },
      { label: "Fat", value: "Medium" },
      { label: "Calories", value: "116 kcal" },
    ],
    bestFor: ["Doi Katla (yogurt curry)", "Macher Kalia", "Steaks in gravy", "Special occasions"],
    faq: [
      { question: "What is the price of katla fish in Siliguri?", answer: "Katla fish at Siliguri Fresh Mart starts from Rs.450 per kg. Being a larger, premium river fish, it costs more than Rohu. Available in 500g, 1kg, and 1.5kg options." },
      { question: "Is katla better than rohu?", answer: "Katla has a richer, oilier flesh compared to Rohu's mild, lean profile. Katla is preferred for rich curries (kalia, doi katla) while Rohu is better for light daily curries (jhol). Both are excellent — it depends on your recipe." },
      { question: "Can I get katla fish steaks in Siliguri?", answer: "Yes, we cut Katla into steaks, Bengali cut, or whole as per your preference. Select your cut preference at checkout when ordering from siligurifreshmart.com." },
    ],
  },
  hilsa: {
    value: "hilsa",
    name: "Hilsa (Ilish)",
    scientificName: "Tenualosa ilisha",
    subcategory: "hilsa",
    title: "Buy Fresh Hilsa (Ilish) Fish Online in Siliguri | Authentic Bengali Hilsa",
    description:
      "Order fresh Hilsa (Ilish) fish online in Siliguri. Authentic Bangladeshi & Bengali Hilsa. Limited stock. Cleaned & delivered in 30 min. Rs.1,200/kg.",
    keywords: [
      "hilsa fish Siliguri",
      "ilish fish online",
      "buy hilsa Siliguri",
      "hilsa price Siliguri",
      "ilish delivery",
      "Bangladeshi hilsa online",
      "fresh hilsa near me",
      "jhil hilsa Siliguri",
    ],
    heroHeading: "Authentic Hilsa (Ilish) — The King of Fish in Bengal",
    heroSub: "Fat, silver-scaled Hilsa from Bangladesh & Bengal rivers — the most prized fish in Bengali cuisine, delivered fresh.",
    content:
      "Hilsa (Ilish) is not just a fish in Bengal — it's an emotion. The Tenualosa ilisha migrates from the Bay of Bengal into the Padma, Meghna, and Teesta rivers, arriving fat and flavourful during monsoon season. We source the best Hilsa from Bangladesh and West Bengal, delivered to Siliguri while the flesh is still firm and the belly fat is at its peak. Each Hilsa is inspected for quality: bright silver scales, clear eyes, and that unmistakable sweet aroma. Cleaned and cut as you prefer — steaks, longitudinal slices, or whole.",
    nutrition: [
      { label: "Protein", value: "21g per 100g" },
      { label: "Omega-3", value: "Very High" },
      { label: "Fat", value: "High (healthy)" },
      { label: "Calories", value: "155 kcal" },
    ],
    bestFor: ["Bhapa Ilish (steamed)", "Ilish macher jhal", "Shorshe Ilish (mustard)", "Paturi (banana leaf)"],
    faq: [
      { question: "What is hilsa fish price in Siliguri?", answer: "Hilsa at Siliguri Fresh Mart starts from Rs.1,200 per kg. Prices fluctuate daily based on catch and season. Monsoon Hilsa (June-September) is the fattest and most flavourful." },
      { question: "Is Bangladeshi hilsa better than Indian?", answer: "Both are excellent, but Bangladeshi Hilsa from the Padma river is considered the gold standard due to its higher fat content and sweeter flavour. We source both — clearly labelled on our website." },
      { question: "When is the best time to buy hilsa?", answer: "The monsoon season (June-September) brings the fattest Hilsa. During Puja season (October-November), demand peaks. We try to keep Hilsa available year-round, but quality and price vary by season." },
    ],
  },
  bhetki: {
    value: "bhetki",
    name: "Bhetki (Barramundi)",
    scientificName: "Lates calcarifer",
    subcategory: "river",
    title: "Buy Fresh Bhetki (Barramundi) Fish Online in Siliguri | Home Delivery",
    description:
      "Order fresh Bhetki (Barramundi) fish online in Siliguri. Firm white-fleshed fish, perfect for frying. Free delivery in 30 min.",
    keywords: [
      "bhetki fish Siliguri",
      "barramundi fish online",
      "buy bhetki Siliguri",
      "bhetki fish price",
      "bhetki delivery",
      "fresh bhetki near me",
      "bhetki fry Siliguri",
    ],
    heroHeading: "Fresh Bhetki (Barramundi) — Firm, White & Versatile",
    heroSub: "Clean, boneless-friendly bhetki fillets — the perfect fish for Bengali frying, grilling, and fish fingers.",
    content:
      "Bhetki (Barramundi / Lates calcarifer) is one of the most versatile fish in Bengali cuisine. Its firm, white flesh holds together beautifully when fried, making it the number one choice for Bengali fish fry and fish fingers. Bhetki has a mild, clean flavour that appeals even to people who don't usually eat fish. Our Bhetki is sourced fresh from North Bengal's rivers and coastal fisheries. We fillet it boneless or cut it into steaks — perfect for your kitchen.",
    nutrition: [
      { label: "Protein", value: "20g per 100g" },
      { label: "Omega-3", value: "Moderate" },
      { label: "Fat", value: "Low" },
      { label: "Calories", value: "105 kcal" },
    ],
    bestFor: ["Bengali Fish Fry", "Fish Fingers", "Grilled Fillets", "Light Curry"],
    faq: [
      { question: "What is bhetki fish and where to buy in Siliguri?", answer: "Bhetki is Barramundi — a firm, white-fleshed fish popular in Bengali cuisine. You can order fresh Bhetki at Siliguri Fresh Mart. We deliver cleaned, filleted, or whole bhetki across Siliguri within 30 minutes." },
      { question: "Is bhetki good for fish fry?", answer: "Bhetki is THE best fish for Bengali-style fish fry. Its firm, boneless fillets hold their shape during frying and develop a beautiful golden crust. Marinate in ginger-garlic paste, coat in breadcrumbs, and deep fry for the classic taste." },
    ],
  },
  pomfret: {
    value: "pomfret",
    name: "Silver Pomfret",
    scientificName: "Pampus argenteus",
    subcategory: "sea",
    title: "Buy Fresh Silver Pomfret Online in Siliguri | Premium Sea Fish Delivery",
    description:
      "Order fresh Silver Pomfret (Rupchanda) online in Siliguri. Premium sea fish from Digha. Whole or filleted. Free delivery. Rs.680/kg.",
    keywords: [
      "pomfret fish Siliguri",
      "rupchanda fish online",
      "buy pomfret Siliguri",
      "pomfret price Siliguri",
      "silver pomfret delivery",
      "fresh pomfret near me",
      "sea fish Siliguri",
    ],
    heroHeading: "Fresh Silver Pomfret — Coastal Catch, Delivered",
    heroSub: "Firm, white-fleshed silver pomfret from Bengal's coast — perfect for whole fish grilling, frying, or curries.",
    content:
      "Silver Pomfret (Pampus argenteus), known locally as Rupchanda, is one of the most prized sea fish in Bengali cuisine. Its flat, diamond-shaped body contains firm, white flesh with a delicate, slightly sweet flavour. Our Pomfret arrives fresh from Digha and Mandarbani coastal markets. It's perfect for whole fish preparation — stuff it with mustard paste and steam it in banana leaves, or simply fry with turmeric and salt for a crispy treat.",
    nutrition: [
      { label: "Protein", value: "19g per 100g" },
      { label: "Omega-3", value: "High" },
      { label: "Fat", value: "Low" },
      { label: "Calories", value: "90 kcal" },
    ],
    bestFor: ["Whole Grilled", "Mustard Pomfret", "Fried", "Fish Curry"],
    faq: [
      { question: "What is the price of pomfret fish in Siliguri?", answer: "Silver Pomfret at Siliguri Fresh Mart starts from Rs.680 per kg. Available in 250g, 500g, and 1kg options. Prices may vary based on coastal market rates." },
      { question: "Is pomfret a sea fish or river fish?", answer: "Pomfret (Rupchanda) is a sea fish found in coastal waters of the Bay of Bengal. We source it from Digha and Mandarbani fish markets and transport it to Siliguri within the same day." },
    ],
  },
  prawns: {
    value: "prawns",
    name: "Tiger Prawns",
    scientificName: "Penaeus monodon",
    subcategory: "prawns",
    title: "Buy Fresh Tiger Prawns Online in Siliguri | Premium Prawns Delivery",
    description:
      "Order fresh Tiger Prawns online in Siliguri. Large, sweet, and clean. Deveined to order. Free delivery in 30 min. Rs.450/kg.",
    keywords: [
      "tiger prawns Siliguri",
      "prawns online order",
      "buy prawns Siliguri",
      "tiger prawns price",
      "fresh prawns delivery",
      "golda chingri Siliguri",
      "chingri mach online",
    ],
    heroHeading: "Fresh Tiger Prawns — Large, Sweet & Clean",
    heroSub: "Jumbo tiger prawns, deveined and ready to cook — perfect for garlic butter, tandoori, or Bengali malai curry.",
    content:
      "Tiger Prawns (Penaeus monodon) are the largest commercially farmed prawns in the world, known for their bold, sweet flavour and firm, meaty texture. Our Tiger Prawns are sourced from coastal fisheries in West Bengal and North East India. Each prawn is individually inspected — we look for firm shells, translucent flesh, and that fresh ocean smell. We devein and clean them as per your preference, ready for your favourite recipe.",
    nutrition: [
      { label: "Protein", value: "24g per 100g" },
      { label: "Omega-3", value: "High" },
      { label: "Fat", value: "Low" },
      { label: "Calories", value: "99 kcal" },
    ],
    bestFor: ["Garlic Butter Prawns", "Tandoori Prawns", "Malai Curry", "Prawn Biryani"],
    faq: [
      { question: "What is the price of tiger prawns in Siliguri?", answer: "Tiger Prawns at Siliguri Fresh Mart start from Rs.450 per kg. Golda Chingri (giant freshwater prawns) are priced higher. Check our website for today's exact prices." },
      { question: "Are tiger prawns deveined before delivery?", answer: "Yes, we devein and clean prawns as per your preference at checkout. Options include: shell-on deveined, shell-off deveined, or fully cleaned." },
    ],
  },
  salmon: {
    value: "salmon",
    name: "Norwegian Salmon",
    scientificName: "Salmo salar",
    subcategory: "exotic",
    title: "Buy Fresh Norwegian Salmon Online in Siliguri | Premium Exotic Fish",
    description:
      "Order fresh Norwegian Salmon online in Siliguri. Sashimi-grade, vacuum-packed. Premium exotic fish delivery. Pre-order for availability.",
    keywords: [
      "salmon fish Siliguri",
      "buy salmon online Siliguri",
      "Norwegian salmon delivery",
      "salmon price Siliguri",
      "fresh salmon near me",
      "exotic fish Siliguri",
      "salmon sashimi Siliguri",
    ],
    heroHeading: "Norwegian Salmon — Premium Imported Fish",
    heroSub: "Sashimi-grade Norwegian Salmon, vacuum-packed and temperature-controlled — delivered fresh to your Siliguri home.",
    content:
      "Norwegian Salmon (Salmo salar) is the gold standard of farmed salmon, known for its rich orange-pink flesh, buttery texture, and high omega-3 content. Sourced from sustainable aquaculture farms in Norway's cold, clear fjords, each fillet is vacuum-packed at source and temperature-controlled during transport. Our salmon arrives in Siliguri weekly — pre-order to guarantee availability. Perfect for sashimi, grilled fillets, salmon steaks, or poke bowls.",
    nutrition: [
      { label: "Protein", value: "20g per 100g" },
      { label: "Omega-3", value: "Very High" },
      { label: "Fat", value: "Healthy fats" },
      { label: "Calories", value: "182 kcal" },
    ],
    bestFor: ["Sashimi & Sushi", "Grilled Fillets", "Salmon Steaks", "Poke Bowls"],
    faq: [
      { question: "Is salmon available in Siliguri?", answer: "Yes, Norwegian Salmon is available at Siliguri Fresh Mart on a weekly restock basis. Pre-order online or call us at 7029908278 to reserve your fillet." },
      { question: "Is the salmon sashimi-grade?", answer: "Our salmon is sourced from certified farms and handled with food-grade safety standards. Ask our team for the latest sashimi-grade availability — it depends on the batch." },
    ],
  },
  pabda: {
    value: "pabda",
    name: "Pabda (Butterfish)",
    scientificName: "Ompok pabda",
    subcategory: "river",
    title: "Buy Fresh Pabda (Butterfish) Online in Siliguri | Delicate River Fish",
    description:
      "Order fresh Pabda (Butterfish) online in Siliguri. Delicate, boneless-friendly river fish. Limited stock. Free delivery in 30 min.",
    keywords: [
      "pabda fish Siliguri",
      "butterfish online",
      "buy pabda Siliguri",
      "pabda fish price",
      "pabda delivery",
      "fresh pabda near me",
      "pabda mach Siliguri",
    ],
    heroHeading: "Fresh Pabda (Butterfish) — Delicate & Flavourful",
    heroSub: "Small, buttery pabda from North Bengal rivers — the most elegant fish in Bengali cuisine, delivered fresh.",
    content:
      "Pabda (Ompok pabda), also known as Butterfish, is one of the most refined fish in Bengali cuisine. Its small, elongated body contains soft, buttery flesh with very few bones — making it a favourite for those who prefer delicate flavours. Pabda is traditionally cooked in a light mustard sauce (pabda shorshe) or simply steamed with minimal spices to let the natural sweetness shine. Our Pabda is sourced fresh from Teesta and Mahananda rivers. Limited daily availability — order early.",
    nutrition: [
      { label: "Protein", value: "18g per 100g" },
      { label: "Omega-3", value: "Moderate" },
      { label: "Fat", value: "Low" },
      { label: "Calories", value: "82 kcal" },
    ],
    bestFor: ["Shorshe Pabda (mustard)", "Steamed", "Light Curry", "Paturi"],
    faq: [
      { question: "What is pabda fish and why is it expensive?", answer: "Pabda is a small, catfish-like river fish prized for its buttery, boneless flesh. It's expensive because it's wild-caught (not farmed), delicate to handle, and available in limited quantities. At Siliguri Fresh Mart, Pabda is priced based on daily market rates." },
      { question: "How to cook pabda fish?", answer: "The most popular preparation is Pabda Shorshe — cooked in a mustard paste sauce with green chillies and nigella seeds. Lightly fry the fish, then simmer in the mustard sauce for 2-3 minutes. Don't overcook — Pabda is delicate and cooks quickly." },
    ],
  },
};
