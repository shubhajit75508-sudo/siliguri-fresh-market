export const STORE_OPEN_HOUR = 9;
export const STORE_CLOSE_HOUR = 16;

export type StoreStatus = {
  isOpen: boolean;
  headline: string;
  subtext: string;
};

export function getStoreStatus(now: Date = new Date(), far = false): StoreStatus {
  const h = now.getHours();
  const openUntil = `Open daily ${STORE_OPEN_HOUR}:00 AM – ${STORE_CLOSE_HOUR}:00 PM`;
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
