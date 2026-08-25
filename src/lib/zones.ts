export interface DeliveryZone {
  slug: string;
  name: string;
  label: string;
  eta: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  lat: number;
  lng: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    slug: "shantipara",
    name: "Shantipara",
    label: "Shantipara, Siliguri",
    eta: "20-30 min",
    description: "Fresh fish, chicken, mutton & vegetables delivered to your doorstep in Shantipara, Siliguri. Order before 3 PM for same-day delivery from our NJP Gate Bazar hub. Free delivery, no minimum order within 4 km.",
    metaTitle: "Fresh Fish & Meat Delivery in Shantipara, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Order fresh fish, chicken, mutton, prawns & vegetables online in Shantipara, Siliguri. Free delivery in 20-30 minutes. Daily fresh catch from Teesta and Mahananda.",
    lat: 26.7200,
    lng: 88.4000,
  },
  {
    slug: "bhaktinagar",
    name: "Bhaktinagar",
    label: "Bhaktinagar, Siliguri",
    eta: "20-30 min",
    description: "Get the freshest fish, meat and vegetables delivered to Bhaktinagar, Siliguri. Premium quality at market prices with doorstep delivery from our NJP Gate Bazar hub. Free delivery, no minimum order.",
    metaTitle: "Fresh Fish & Meat Delivery in Bhaktinagar, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Order fresh fish, chicken, mutton & vegetables online in Bhaktinagar, Siliguri. Fast delivery, 100% freshness guarantee. Free delivery.",
    lat: 26.7100,
    lng: 88.4100,
  },
  {
    slug: "pradhan-nagar",
    name: "Pradhan Nagar",
    label: "Pradhan Nagar, Siliguri",
    eta: "20-30 min",
    description: "Siliguri Fresh Mart delivers fresh fish, chicken, mutton and vegetables to Pradhan Nagar. River fish from Teesta, farm-fresh chicken, premium mutton cuts — all delivered from our NJP Gate Bazar hub. Free delivery, no minimum order.",
    metaTitle: "Fresh Fish & Meat Delivery in Pradhan Nagar, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Online fish, chicken & vegetable delivery in Pradhan Nagar, Siliguri. Fresh daily catch, fast delivery, free delivery. Order now!",
    lat: 26.7050,
    lng: 88.4150,
  },
  {
    slug: "hakimpara",
    name: "Hakimpara",
    label: "Hakimpara, Siliguri",
    eta: "20-30 min",
    description: "Fresh fish and meat delivery in Hakimpara, Siliguri. Order Rohu, Hilsa, Prawns, Chicken and Mutton from Siliguri Fresh Mart with guaranteed freshness. Free delivery from our NJP Gate Bazar hub.",
    metaTitle: "Fresh Fish & Meat Delivery in Hakimpara, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Order fresh fish, chicken, mutton & vegetables in Hakimpara, Siliguri. Same-day delivery, 100% freshness guarantee. Siliguri's trusted online fresh market.",
    lat: 26.6980,
    lng: 88.4050,
  },
  {
    slug: "matigara",
    name: "Matigara",
    label: "Matigara, Siliguri",
    eta: "20-30 min",
    description: "Get fresh fish, prawns, chicken and vegetables delivered to Matigara, Siliguri. Siliguri Fresh Mart — from the NJP Gate Bazar morning market to your kitchen in minutes. Free delivery, no minimum order.",
    metaTitle: "Fresh Fish & Meat Delivery in Matigara, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Online fresh fish, chicken & vegetable delivery in Matigara, Siliguri. Daily fresh catch, fast delivery, market-fresh prices. Order from Siliguri Fresh Mart.",
    lat: 26.7300,
    lng: 88.4200,
  },
  {
    slug: "bagdogra",
    name: "Bagdogra",
    label: "Bagdogra, Siliguri",
    eta: "45-60 min",
    description: "Fresh fish, meat and vegetables delivered to Bagdogra, Siliguri. Whether near the airport or the township, Siliguri Fresh Mart brings the NJP Gate Bazar market to your door. Free delivery on orders above ₹299.",
    metaTitle: "Fresh Fish & Meat Delivery in Bagdogra, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Order fresh fish, chicken, mutton & vegetables in Bagdogra, Siliguri. Reliable daily delivery, premium quality, market prices.",
    lat: 26.6800,
    lng: 88.3300,
  },
  {
    slug: "champasari",
    name: "Champasari",
    label: "Champasari, Siliguri",
    eta: "20-30 min",
    description: "Siliguri Fresh Mart delivers fresh fish, chicken, mutton and vegetables to Champasari. Premium quality seafood and meat with doorstep delivery from our NJP Gate Bazar hub. Free delivery, no minimum order.",
    metaTitle: "Fresh Fish & Meat Delivery in Champasari, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Online fresh fish, chicken, mutton & vegetable delivery in Champasari, Siliguri. Fast delivery, freshness guaranteed. Order from Siliguri Fresh Mart today.",
    lat: 26.7400,
    lng: 88.4000,
  },
  {
    slug: "sukna",
    name: "Sukna",
    label: "Sukna, Siliguri",
    eta: "45-60 min",
    description: "Fresh fish and meat delivered to Sukna, Siliguri. From river fish to prawns, farm chicken to goat mutton — all delivered fresh from our NJP Gate Bazar hub. Free delivery on orders above ₹299.",
    metaTitle: "Fresh Fish & Meat Delivery in Sukna, Siliguri | Siliguri Fresh Mart",
    metaDescription: "Order fresh fish, chicken, mutton & vegetables in Sukna, Siliguri. Daily fresh catch, fast doorstep delivery, 100% freshness guaranteed.",
    lat: 26.7500,
    lng: 88.3900,
  },
];

export function getZoneBySlug(slug: string): DeliveryZone | undefined {
  return DELIVERY_ZONES.find((z) => z.slug === slug);
}
