// Single source of truth for which admin sections the manager role can access.
// Used by both the client layout (sidebar + redirect) and the edge proxy (route guard).
// Keeps the two in sync so a manager is never bounced between pages or logged out.

export const MANAGER_PAGES: string[] = [
  "/admin/orders",
  "/admin/delivery",
  "/admin/routes",
  "/admin/delivery-boys",
  "/admin/products",
  "/admin/inventory",
];

export const MANAGER_ACCESS = new Set(MANAGER_PAGES);
