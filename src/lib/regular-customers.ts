const REGULAR_KEY = "sfm-regular-customers";
const CONFIRMED_KEY = "sfm-confirmed-orders";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function normalizePhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

export function telHref(phone: string): string {
  const p = (phone ?? "").trim();
  if (/^\d{10}$/.test(p)) return `tel:+91${p}`;
  if (/^\d{12}$/.test(p)) return `tel:+${p}`;
  return `tel:${p}`;
}

export function loadRegularPhones(): Set<string> {
  return readSet(REGULAR_KEY);
}

export function persistRegularPhones(set: Set<string>): void {
  writeSet(REGULAR_KEY, set);
}

export function loadConfirmedOrders(): Set<string> {
  return readSet(CONFIRMED_KEY);
}

export function persistConfirmedOrders(set: Set<string>): void {
  writeSet(CONFIRMED_KEY, set);
}

const PACKED_KEY = "sfm-packed-orders";

export function loadPackedOrders(): Set<string> {
  return readSet(PACKED_KEY);
}

export function persistPackedOrders(set: Set<string>): void {
  writeSet(PACKED_KEY, set);
}