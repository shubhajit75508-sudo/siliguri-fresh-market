export type Category =
  | "fish"
  | "chicken"
  | "mutton"
  | "seafood"
  | "vegetables"
  | "fruits"
  | "eggs"
  | "dairy"
  | "grocery"
  | "essentials";

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
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryBoyId: string;
  customerName: string;
  customerPhone: string;
  paymentStatus?: "paid" | "unpaid" | "refunded";
  address: Address;
  items: { name: string; quantity: number }[];
  total: number;
  status: "assigned" | "accepted" | "picked_up" | "delivered";
  assignedAt: string;
  deliveredAt?: string;
  deliveryCode?: string;
}
