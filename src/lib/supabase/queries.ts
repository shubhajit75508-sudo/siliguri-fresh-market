import { supabase } from "./client";
import type { Product, CategoryInfo, Order, Coupon, User, CartItem, Address, DeliveryStatus } from "@/types";
import type { NotificationItem } from "@/store/notification-store";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  image: string | null;
  images: string[] | null;
  unit: string;
  stock: number | null;
  weight?: string[] | null;
  cuts: string[] | null;
  cleaning_options: string[] | null;
  freshness_score: number;
  delivery_eta: number;
  rating: number;
  review_count: number;
  in_stock: boolean;
  is_flash_deal: boolean | null;
  is_trending: boolean | null;
  tags: string[] | null;
  nutrition: Record<string, string> | null;
  source: string | null;
  species: string | null;
  river: string | null;
  catch_date: string | null;
}

interface CategoryRow {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  image: string | null;
}

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  coupon_code: string | null;
  address_id: string | null;
  delivery_slot: string | null;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items?: unknown;
  address_snapshot?: Record<string, unknown>;
  delivery_status?: string;
  delivery_boy_id?: string;
  return_requested?: boolean;
  return_approved?: boolean;
}

interface OrderItemRow {
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  selected_weight?: string | null;
}

interface AddressRow {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
}

interface CouponRow {
  code: string;
  discount: number;
  type: string;
  min_order: number;
  is_active: boolean;
  created_at: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;
  avatar: string | null;
}

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
  sent_to?: number;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    category: row.category as Product["category"],
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    discount: row.discount ?? undefined,
    image: row.image ?? "",
    images: row.images ?? undefined,
    unit: row.unit,
    stock: row.stock ?? undefined,
    weight: row.weight ?? undefined,
    cuts: row.cuts ?? undefined,
    cleaningOptions: row.cleaning_options ?? undefined,
    freshnessScore: row.freshness_score,
    deliveryEta: row.delivery_eta,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    inStock: row.in_stock,
    isFlashDeal: row.is_flash_deal ?? undefined,
    isTrending: row.is_trending ?? undefined,
    tags: row.tags ?? undefined,
    nutrition: row.nutrition ?? undefined,
    source: row.source ?? undefined,
    species: row.species ?? undefined,
    river: row.river ?? undefined,
    catchDate: row.catch_date ?? undefined,
  };
}

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase!
    .from("products")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase!
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data ? mapProduct(data as ProductRow) : null;
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase!
    .from("products")
    .select("*")
    .eq("category", category)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function fetchFlashDeals(): Promise<Product[]> {
  const { data, error } = await supabase!
    .from("products")
    .select("*")
    .eq("is_flash_deal", true)
    .eq("in_stock", true);
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function fetchTrendingProducts(): Promise<Product[]> {
  const { data, error } = await supabase!
    .from("products")
    .select("*")
    .eq("is_trending", true)
    .eq("in_stock", true);
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function searchProductsByQuery(query: string): Promise<Product[]> {
  const escaped = query.toLowerCase().replace(/%/g, "\\%").replace(/_/g, "\\_");
  const q = `%${escaped}%`;
  const { data, error } = await supabase!
    .from("products")
    .select("*")
    .or(`name.ilike.${q},category.ilike.${q},species.ilike.${q}`)
    .eq("in_stock", true)
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const { data, error } = await supabase!
    .from("categories")
    .select("*")
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const cat = row as CategoryRow;
    return {
      slug: cat.slug as CategoryInfo["slug"],
      name: cat.name,
      description: cat.description ?? "",
      icon: cat.icon ?? "",
      color: cat.color ?? "",
      image: cat.image ?? "",
    };
  });
}

export async function fetchOrdersByUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase!
    .from("orders")
    .select("*, order_items(*), addresses(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const r = row as unknown as OrderRow;
    const joinedOrderItems = (row.order_items ?? []) as OrderItemRow[];
    const joinedAddress = row.addresses as AddressRow | null;

    const items = buildOrderItems(joinedOrderItems, r.items);
    const address = buildAddress(r, joinedAddress);

    return {
      id: r.id,
      items,
      status: r.status as Order["status"],
      total: r.total,
      createdAt: r.created_at,
      address,
      eta: 0,
      customerName: r.customer_name ?? "",
      customerPhone: r.customer_phone ?? "",
      customerEmail: r.customer_email ?? "",
      paymentMethod: r.payment_method ?? "cod",
      paymentStatus: (r.payment_status === "paid" ? "paid" : "unpaid") as "paid" | "unpaid",
      deliveryBoyId: r.delivery_boy_id ?? undefined,
      deliveryStatus: r.delivery_status as DeliveryStatus | undefined,
      returnRequested: r.return_requested ?? undefined,
      returnApproved: r.return_approved ?? undefined,
    };
  });
}

function buildOrderItems(joinedItems: OrderItemRow[], rawItems: unknown): CartItem[] {
  if (joinedItems.length > 0) {
    return joinedItems.map((i) => ({
      product: {
        id: i.product_id,
        slug: i.product_id,
        name: i.product_name,
        price: i.unit_price,
        image: i.product_image ?? "",
        description: "",
        category: "grocery" as const,
        unit: "kg",
        freshnessScore: 0,
        deliveryEta: 0,
        rating: 0,
        reviewCount: 0,
        inStock: true,
      } satisfies Product,
      quantity: i.quantity,
    }));
  }
  if (rawItems) {
    const parsed = rawItems as Array<{ product: Record<string, unknown>; quantity: number }>;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((i) => ({
        product: i.product as unknown as Product,
        quantity: i.quantity,
      }));
    }
  }
  return [];
}

function buildAddress(r: OrderRow, joined: AddressRow | null): Address {
  if (joined) {
    return {
      id: joined.id,
      label: joined.label ?? "",
      line1: joined.line1,
      line2: joined.line2 ?? undefined,
      city: joined.city,
      pincode: joined.pincode,
      lat: joined.lat ?? undefined,
      lng: joined.lng ?? undefined,
      isDefault: joined.is_default,
    };
  }
  if (r.address_snapshot) {
    return r.address_snapshot as unknown as Address;
  }
  return {
    id: r.address_id ?? "",
    label: "",
    line1: "",
    city: "",
    pincode: "",
    isDefault: false,
  };
}

export async function fetchNotificationsByUser(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase!
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as NotificationRow;
    return {
      id: r.id,
      title: r.title,
      body: r.body ?? "",
      type: r.type as NotificationItem["type"],
      sentAt: r.created_at,
      sentTo: r.sent_to ?? 1,
      read: r.read,
    };
  });
}

export async function syncOrderToSupabase(order: {
  id: string;
  user_id?: string;
  items: { product: { id: string; name: string; price: number; image?: string }; quantity: number }[];
  total: number;
  status: string;
  delivery_status?: string;
  payment_method: string;
  address_snapshot?: Record<string, unknown>;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_boy_id?: string;
  return_requested?: boolean;
  return_approved?: boolean;
}) {
  const { error } = await supabase!
    .from("orders")
    .upsert({
      id: order.id,
      user_id: order.user_id ?? null,
      items: order.items,
      total: order.total,
      status: order.status,
      delivery_status: order.delivery_status ?? "pending",
      payment_method: order.payment_method,
      address_snapshot: order.address_snapshot ?? {},
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      delivery_boy_id: order.delivery_boy_id ?? null,
      return_requested: order.return_requested ?? false,
      return_approved: order.return_approved ?? false,
    });
  if (error) throw error;
}

export async function createOrder(order: {
  id: string;
  user_id: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  discount?: number;
  coupon_code?: string;
  address_id?: string;
  payment_method?: string;
  address_lat?: number;
  address_lng?: number;
  items: {
    product_id: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    unit_price: number;
    selected_weight?: string;
  }[];
}) {
  const { data: orderData, error: orderError } = await supabase!
    .from("orders")
    .insert({
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      discount: order.discount ?? 0,
      coupon_code: order.coupon_code ?? null,
      address_id: order.address_id ?? null,
      payment_method: order.payment_method ?? null,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  const orderItems = order.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    selected_weight: item.selected_weight ?? null,
  }));

  const { error: itemsError } = await supabase!
    .from("order_items")
    .insert(orderItems);
  if (itemsError) throw itemsError;

  return orderData;
}

export async function insertProduct(product: Product): Promise<void> {
  const { error } = await supabase!
    .from("products")
    .insert({
      id: product.id,
      slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: product.name,
      description: product.description || null,
      category: product.category,
      price: product.price,
      original_price: product.originalPrice ?? null,
      image: product.image || null,
      images: product.images ?? null,
      unit: product.unit || "kg",
      freshness_score: product.freshnessScore ?? 100,
      delivery_eta: product.deliveryEta ?? 30,
      rating: product.rating ?? 0,
      review_count: product.reviewCount ?? 0,
      in_stock: product.inStock ?? true,
      stock: product.stock ?? null,
      is_flash_deal: product.isFlashDeal ?? false,
      is_trending: product.isTrending ?? false,
      tags: product.tags ?? null,
      discount: product.discount ?? 0,
    });
  if (error) throw error;
}

export async function updateProductBySlug(slug: string, updates: Partial<Product>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.originalPrice !== undefined) dbUpdates.original_price = updates.originalPrice;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
  if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock;

  const { error } = await supabase!
    .from("products")
    .update(dbUpdates)
    .eq("slug", slug);
  if (error) throw error;
}

export async function deleteProductBySlug(slug: string): Promise<void> {
  const { error } = await supabase!
    .from("products")
    .delete()
    .eq("slug", slug);
  if (error) throw error;
}

export async function fetchInventoryItems() {
  const { data, error } = await supabase!
    .from("products")
    .select("id, name, category, freshness_score, in_stock, stock")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function updateStockQuantity(productId: string, quantity: number) {
  const { error } = await supabase!
    .from("products")
    .update({ stock: quantity, in_stock: quantity > 0 })
    .eq("id", productId);
  if (error) throw error;
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase!
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as CouponRow;
    return {
      code: r.code,
      discount: r.discount,
      type: r.type as Coupon["type"],
      minOrder: r.min_order,
    };
  });
}

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase!
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  if (!data) return null;
  const r = data as UserRow;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    loyaltyPoints: r.loyalty_points,
    avatar: r.avatar ?? undefined,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<{ name: string; phone: string; avatar: string }>
) {
  const dbUpdates: Record<string, string> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

  const { error } = await supabase!
    .from("users")
    .update(dbUpdates)
    .eq("id", userId);
  if (error) throw error;
}
