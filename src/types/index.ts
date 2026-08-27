export type Category =
  | "fish"
  | "chicken"
  | "mutton"
  | "pork"
  | "seafood"
  | "vegetables"
  | "fruits"
  | "eggs"
  | "dairy"
  | "grocery"
  | "essentials";

export const FISH_SUBCATEGORIES = [
  { value: "unassigned", label: "Unassigned" },
  { value: "river", label: "River Fish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412357/images_30_ptxsmz.jpg" },
  { value: "sea", label: "Sea Fish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782547794/624897963_18299845189302273_3065151457949707008_n_fhsj2h.jpg" },
  { value: "hilsa", label: "Hilsa / Ilish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782379196/Hilsa_fish_ilish_fish_bangladesh_nubluu.jpg" },
  { value: "prawns", label: "Prawns", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782299706/Picsart_26-06-24_11-07-31-212_ch3bu4.jpg" },
  { value: "small", label: "Small Fish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412359/Boroli-Fish-North-Bengal_izgder.jpg" },
  { value: "exotic", label: "Exotic", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782299698/images_5_bmhxij.jpg" },
  { value: "other", label: "Other", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782558152/IMG-20260627-WA0133_pgiyga.jpg" },
] as const;

export type FishSubcategory = typeof FISH_SUBCATEGORIES[number]["value"];

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  unit: string;
  weight?: string[];
  weightPrices?: { weight: string; price: number }[];
  cuts?: string[];
  freshnessScore: number;
  deliveryEta: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock?: number;
  isFlashDeal?: boolean;
  isTrending?: boolean;
  tags?: string[];
  nutrition?: Record<string, string>;
  source?: string;
  origin?: string;
  catchDate?: string;
  river?: string;
  species?: string;
  cleaningOptions?: string[];
  discount?: number;
  subcategory?: string[];
  buyingPrices?: { weight: string; price: number }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight?: string;
  selectedCut?: string;
  selectedCleaning?: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  street?: string;
  area?: string;
  landmark?: string;
  building?: string;
  flat?: string;
  floor?: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  deliveryInstructions?: string;
}

export type OrderStatus = "received" | "out_for_delivery" | "delivered" | "cancelled";

export type DeliveryStatus = "pending" | "assigned" | "accepted" | "picked_up" | "delivered";

export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  address: Address;
  eta: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  userId?: string;
  paymentMethod: string;
  paymentStatus: "paid" | "unpaid" | "refunded";
  upiReference?: string;
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  deliveryStatus?: DeliveryStatus;
  returnRequested?: boolean;
  returnApproved?: boolean;
  deliveryCode?: string;
  deliveredAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  avatar?: string;
}

export interface Coupon {
  code: string;
  discount: number;
  type: "percentage" | "flat";
  minOrder: number;
}

export interface CategoryInfo {
  slug: Category;
  name: string;
  description: string;
  icon: string;
  color: string;
  image: string;
}

export interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
  email?: string;
  code: string;
  isActive: boolean;
  area: string;
  maxActiveOrders?: number;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryBoyId: string;
  customerName: string;
  customerPhone: string;
  paymentStatus?: "paid" | "unpaid" | "refunded";
  address: Address;
  items: { product: { id: string; name: string; image?: string; price: number }; quantity: number; selectedWeight?: string; selectedCut?: string; selectedCleaning?: string }[];
  total: number;
  status: "assigned" | "accepted" | "picked_up" | "delivered";
  assignedAt: string;
  deliveredAt?: string;
  deliveryCode?: string;
}
