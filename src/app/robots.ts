import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/seo";

/**
 * Only the API is disallowed. /admin, /dashboard, /apply and /activate-memory
 * are noindex via metadata instead of robots.txt, because a disallowed URL
 * cannot be crawled and therefore its noindex directive is never seen — the URL
 * can still be indexed from external links.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL,
  };
}
