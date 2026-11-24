export const STORE_OPEN_HOUR = 9;
export const STORE_CLOSE_HOUR = 15;

/** 9 → "9:00 AM", 15 → "3:00 PM" */
function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${suffix}`;
}

export type StoreStatus = {
  isOpen: boolean;
  headline: string;
  subtext: string;
};

export function getStoreStatus(now: Date = new Date(), far = false): StoreStatus {
  const h = now.getHours();
  const openUntil = `Open daily ${formatHour(STORE_OPEN_HOUR)} – ${formatHour(STORE_CLOSE_HOUR)}`;
  if (h >= STORE_OPEN_HOUR && h < STORE_CLOSE_HOUR) {
    return {
      isOpen: true,
      headline: far
        ? "We're open — order before 11 AM for the 11 AM – 1 PM slot"
        : "We're open — delivery within 1-2 hours",
      subtext: openUntil,
    };
  }
  if (h < STORE_OPEN_HOUR) {
    return {
      isOpen: false,
      headline: far
        ? `We're closed till ${STORE_OPEN_HOUR} AM — orders placed now will be delivered today from 11 AM`
        : `We're closed till ${STORE_OPEN_HOUR} AM — delivery within 1-2 hours once we open`,
      subtext: openUntil,
    };
  }
  return {
    isOpen: false,
    headline: far
      ? "We're closed — orders placed now will be delivered tomorrow from 11 AM"
      : "We're closed for today — next delivery within 1-2 hours when we reopen",
    subtext: openUntil,
  };
}
