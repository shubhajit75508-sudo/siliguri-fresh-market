export const STORE_OPEN_HOUR = 7;
export const STORE_CLOSE_HOUR = 15;

export type StoreStatus = {
  isOpen: boolean;
  headline: string;
  subtext: string;
};

export function getStoreStatus(now: Date = new Date()): StoreStatus {
  const h = now.getHours();
  if (h >= STORE_OPEN_HOUR && h < STORE_CLOSE_HOUR) {
    return {
      isOpen: true,
      headline: "We're open — order before 3 PM for same-day delivery",
      subtext: `Open daily ${STORE_OPEN_HOUR}:00 AM – ${STORE_CLOSE_HOUR}:00 PM`,
    };
  }
  if (h < STORE_OPEN_HOUR) {
    return {
      isOpen: false,
      headline: "We're closed — orders placed now will be delivered today from 7 AM",
      subtext: `Open daily ${STORE_OPEN_HOUR}:00 AM – ${STORE_CLOSE_HOUR}:00 PM`,
    };
  }
  return {
    isOpen: false,
    headline: "We're closed — orders placed now will be delivered tomorrow from 7 AM",
    subtext: `Open daily ${STORE_OPEN_HOUR}:00 AM – ${STORE_CLOSE_HOUR}:00 PM`,
  };
}
