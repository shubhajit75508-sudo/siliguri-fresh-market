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
  { value: "river", label: "River Fish", image: "https://res.cloudinary.com/cgkwt25u/image/upload/v1791821363/11744906013.jpg" },
  { value: "sea", label: "Sea Fish", image: "https://res.cloudinary.com/cgkwt25u/image/upload/v1791821199/Bluefin-tuna-waters-Japan.webp" },
  { value: "hilsa", label: "Hilsa / Ilish", image: "https://res.cloudinary.com/cgkwt25u/image/upload/v1791821243/Hilsha-Fish.jpg" },
  { value: "prawns", label: "Prawns", image: "https://res.cloudinary.com/cgkwt25u/image/upload/v1791821288/Nisla-prawns-online.webp" },
  { value: "crabs", label: "Crabs", image: "https://res.cloudinary.com/len0ck43/image/upload/v1790013833/crabss.jpg" },
  { value: "small", label: "Small Fish", image: "https://res.cloudinary.com/cgkwt25u/image/upload/v1791821151/background-small-fish-caught-river-crucian-carp-57148744.webp" },
  { value: "exotic", label: "Exotic", image: "https://res.cloudinary.com/cgkwt25u/image/upload/v1791821432/frozenlobster1.webp" },
  { value: "other", label: "Other", image: "https://res.cloudinary.com/cgkwt25u/image/upload/v1791821499/Hilsha_fish_Head_pair_2_9985bd4c-bdae-4b79-b506-ec1ed1a06cab_533x.webp" },
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

export type DeliveryStatus = "pending" | "assigned" | "accepted" | "picked_up" | "delivered" | "cancelled";

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
  collectedAmount?: number;
  collectedMethod?: "cash" | "upi";
  subtotal?: number;
  deliveryFee?: number;
  extraCharges?: number;
  orderSource?: string;
  orderNotes?: string;
  deliverySlot?: string;
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
  items: { product: { id: string; name: string; image?: string; price: number; weightPrices?: { weight: string; price: number }[] }; quantity: number; selectedWeight?: string; selectedCut?: string; selectedCleaning?: string; unitPrice?: number }[];
  total: number;
  status: "assigned" | "accepted" | "picked_up" | "delivered" | "cancelled";
  assignedAt: string;
  deliveredAt?: string;
  deliveryCode?: string;
}
