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
  { value: "river", label: "River Fish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1782299704/Picsart_26-06-24_11-09-55-236_cmcwt5.jpg" },
  { value: "sea", label: "Sea Fish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803563/1000020357_lq3qjy.jpg" },
  { value: "hilsa", label: "Hilsa / Ilish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803634/1000020362_bxnhvf.jpg" },
  { value: "prawns", label: "Prawns", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803710/1000020363_f8wkjv.jpg" },
  { value: "small", label: "Small Fish", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803776/1000020364_kx9z2p.jpg" },
  { value: "exotic", label: "Exotic", image: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803844/1000020365_r3t8qn.jpg" },
  { value: "other", label: "Other", image: "" },
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
