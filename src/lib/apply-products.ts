/**
 * Product tabs shared by the /apply page and its client switcher.
 * `api` is the default so legacy /apply links keep working unchanged.
 */
export const APPLY_PRODUCTS = ["api", "alpha-desk", "memory"] as const;

export type ApplyProduct = (typeof APPLY_PRODUCTS)[number];

export function parseApplyProduct(value: string | string[] | undefined): ApplyProduct {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "alpha-desk" || raw === "memory" ? raw : "api";
}
