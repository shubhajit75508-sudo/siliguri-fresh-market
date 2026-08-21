export interface FAQ {
  question: string;
  answer: string;
}

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
  faq: FAQ[];
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
    faq: [
      { question: "What is the price of rohu fish in Siliguri?", answer: "Rohu fish at Siliguri Fresh Mart starts from Rs.320 per kg. Prices may vary based on daily market rates and freshness. We source directly from Teesta and Mahananda river markets, so you get the freshest catch at wholesale prices." },
      { question: "Is river fish fresh or frozen at Siliguri Fresh Mart?", answer: "All our river fish is 100% fresh — never frozen. We pick up the day's catch every morning from local riverbank markets and deliver within 30 minutes of your order. The fish was swimming just hours before it reaches your kitchen." },
      { question: "How to order katla fish online in Siliguri?", answer: "Simply visit siligurifreshmart.com, go to the Fish section, select Katla, choose your preferred weight (500g, 1kg, or 1.5kg), select cut and cleaning preferences, and place your order. We accept COD and UPI payments." },
      { question: "Which river fish is best for curry in Siliguri?", answer: "Rohu and Katla are the most popular river fish for Bengali-style curries in Siliguri. Rohu has a mild, sweet flavour that absorbs curry spices well. Katla has a richer, oilier flesh that holds up beautifully in slow-cooked jhol. Both are available fresh daily at Siliguri Fresh Mart." },
      { question: "Do you deliver river fish to Bagdogra and Matigara?", answer: "Yes, we deliver fresh river fish across all of Siliguri including Bagdogra, Matigara, Hakimpara, Pradhan Nagar, Shantipara, Bhaktinagar, Champasari, and Sukna. Delivery is free on orders above Rs.299." },
    ],
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
    faq: [
      { question: "Is pomfret fish available in Siliguri?", answer: "Yes, Silver Pomfret (Rupchanda) is available fresh at Siliguri Fresh Mart. We source it from Digha and Mandarbani coastal markets. Prices start from Rs.680 per kg. Order before 1 PM for same-day delivery." },
      { question: "How do you keep sea fish fresh in Siliguri?", answer: "Our sea fish is transported in refrigerated vehicles from coastal markets (Digha, Haldia) directly to our Siliguri store. It never enters cold storage or gets frozen. The entire journey from coast to your door takes under 6 hours." },
      { question: "What sea fish do you deliver in Siliguri?", answer: "We deliver Pomfret (Rupchanda), Bombay Duck (Bombil), Sole, Surmai (Kingfish), and seasonal catches. Availability varies by day — check our fish section or call us at 7029908278 for today's stock." },
      { question: "Can I get bombay duck fish in Siliguri?", answer: "Yes, Bombay Duck (Bombil) is available at Siliguri Fresh Mart. It arrives fresh from Bengal's coast. Bombay Duck is perfect for frying — coat with turmeric and salt, shallow fry until crispy. Order online at siligurifreshmart.com." },
    ],
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
    faq: [
      { question: "What is hilsa fish price in Siliguri today?", answer: "Hilsa prices at Siliguri Fresh Mart start from Rs.1,200 per kg, depending on size and origin. Hilsa prices fluctuate daily based on the catch from Bangladesh and West Bengal rivers. Check our website or call 7029908278 for today's price." },
      { question: "Is Bangladeshi hilsa available in Siliguri?", answer: "Yes, we source authentic Bangladeshi Hilsa from cross-border riverine fisheries. Bangladeshi Hilsa is known for its higher fat content and richer flavour. Stock is limited — order before 10 AM for guaranteed availability." },
      { question: "When is hilsa season in Bengal?", answer: "Hilsa season peaks during monsoon (June to September) and again during the festive season (October-November). However, we try to keep Hilsa available year-round from various sources. The best quality Hilsa comes during Ilish season when the fish is at its fattest." },
      { question: "How to clean and cut hilsa fish at home?", answer: "When you order from Siliguri Fresh Mart, we clean and cut the Hilsa exactly as you prefer — whole, steaks, or longitudinal slices. If you prefer to clean it yourself, scale the fish, make a slit along the belly, remove the guts, and wash thoroughly. Hilsa steaks are the most popular cut for traditional Bengali preparations." },
    ],
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
    faq: [
      { question: "What is the price of tiger prawns in Siliguri?", answer: "Tiger Prawns at Siliguri Fresh Mart start from Rs.450 per kg. Golda Chingri (giant prawns) are priced higher due to their size and rarity. Prices vary based on daily market rates — check our website for today's prices." },
      { question: "Are your prawns fresh or frozen?", answer: "We offer both fresh and frozen prawns depending on availability. Our Golda Chingri and small prawns are typically fresh. Tiger Prawns may be fresh or IQF (Individually Quick Frozen) — always clearly labelled on the product page." },
      { question: "What is golda chingri?", answer: "Golda Chingri is a giant freshwater prawn found in Bengal's rivers. It's larger than tiger prawns, with a sweet, lobster-like flavour. Golda Chingri is traditionally cooked with coconut milk (Malai Chingri) or mustard paste. Available fresh at Siliguri Fresh Mart." },
      { question: "Do you devein prawns before delivery?", answer: "Yes, we devein and clean prawns as per your preference at checkout. You can choose: shell-on deveined, shell-off deveined, or completely cleaned. Small prawns come pre-cleaned. Just select your preference when ordering online." },
    ],
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
    faq: [
      { question: "What is boroli fish and is it available in Siliguri?", answer: "Boroli is a small, delicate freshwater fish found in the Himalayan foothills of North Bengal. It's prized for its sweet, tender flesh and is considered a delicacy. Siliguri Fresh Mart sources Boroli from Teesta river markets when available — stock is seasonal and limited." },
      { question: "How to cook small fish like puthi and kachki?", answer: "The most popular way to cook small fish in Bengal is deep-frying. Marinate in turmeric and salt, then shallow fry until crispy. They're also delicious in light curries with potatoes, or steamed in banana leaves (paturi style). Order from Siliguri Fresh Mart and we'll clean them for you." },
      { question: "Are small fish cleaned before delivery?", answer: "Yes, we clean and gut small fish as per your preference. You can choose whole (uncleaned), gutted, or fully cleaned at checkout. Small fish are typically delivered whole — they're best cooked whole for maximum flavour." },
    ],
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
    faq: [
      { question: "Is salmon fish available in Siliguri?", answer: "Yes, Norwegian Salmon is available at Siliguri Fresh Mart. We source it from certified farms and it arrives vacuum-packed for freshness. Salmon is available on a weekly restock basis — pre-order to guarantee availability. Price varies by batch." },
      { question: "Can I get basa fish delivered in Siliguri?", answer: "Yes, Basa fish is available for delivery in Siliguri. Basa is a mild, white-fleshed fish that's perfect for grilling, frying, or curries. Order online at siligurifreshmart.com or call us at 7029908278." },
      { question: "Is exotic fish safe to eat raw for sushi?", answer: "Our exotic fish is sourced from certified farms and handled with food-grade safety standards. However, we recommend cooking all fish thoroughly unless explicitly labelled as 'sashimi-grade'. Ask our team for the latest sashimi-grade availability." },
    ],
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
    faq: [
      { question: "What fish is available today in Siliguri?", answer: "Our stock changes daily based on what's freshest in Siliguri's morning markets. Visit siligurifreshmart.com to see today's full selection, or call us at 7029908278 for a real-time stock update." },
      { question: "Do you sell seasonal fish in Siliguri?", answer: "Yes! We specialise in seasonal and local fish that you won't find at regular stores. This includes Chitala (featherback), Boal (wallago), river crabs, and various small fish depending on the season. Check back daily for new arrivals." },
      { question: "Can I request a specific fish that's not on the menu?", answer: "Absolutely! Call us at 7029908278 and we'll try to source it from Siliguri's morning markets. Our team has strong relationships with local fishermen and can often find specific fish on request with 24-hour notice." },
    ],
  },
};
