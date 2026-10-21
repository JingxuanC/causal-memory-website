/** Site-wide constants. Kept separate so app/layout.tsx can import the origin
 * without pulling the whole pSEO content registry into the layout module. */
export const SITE_URL = "https://causal-memory.com";

/** Canonical absolute URL for a site path. All pSEO canonicals are self-referential. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
