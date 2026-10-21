import type { MetadataRoute } from "next";
import { BENCHMARK_PATH, SITE_URL, comparisonPages, integrationPages, useCasePages } from "@/data/seo";

/**
 * Static sitemap. The pSEO pages use their own `updatedAt` for lastModified;
 * existing pages keep the site's last content change so a template refresh does
 * not falsely claim every URL changed.
 */
const SITE_UPDATED = new Date("2026-10-20T00:00:00.000Z");

function entry(path: string, lastModified: Date, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly" = "monthly"): MetadataRoute.Sitemap[number] {
  return {
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const hubs = [
    entry("/", SITE_UPDATED, 1, "weekly"),
    entry("/compare", new Date("2026-10-21T00:00:00.000Z"), 0.8, "monthly"),
    entry("/use-cases", new Date("2026-10-21T00:00:00.000Z"), 0.8, "monthly"),
    entry("/benchmarks", SITE_UPDATED, 0.7, "monthly"),
  ];

  const benchmark = [entry(BENCHMARK_PATH, new Date("2026-10-21T00:00:00.000Z"), 0.8, "monthly")];

  const comparisons = comparisonPages.map((page) =>
    entry(`/vs/${page.slug}`, new Date(`${page.updatedAt}T00:00:00.000Z`), 0.7, "monthly"),
  );
  const useCases = useCasePages.map((page) =>
    entry(`/use-cases/${page.slug}`, new Date(`${page.updatedAt}T00:00:00.000Z`), 0.7, "monthly"),
  );
  const integrations = integrationPages.map((page) =>
    entry(`/integrations/${page.slug}`, new Date(`${page.updatedAt}T00:00:00.000Z`), 0.7, "monthly"),
  );

  const existing = [
    // /docs redirects to /docs/getting-started, so only the final URL is listed.
    entry("/docs/getting-started", SITE_UPDATED, 0.7, "weekly"),
    entry("/playground", SITE_UPDATED, 0.6, "monthly"),
    entry("/pricing", SITE_UPDATED, 0.7, "monthly"),
    entry("/products", SITE_UPDATED, 0.7, "monthly"),
    entry("/alpha-desk", SITE_UPDATED, 0.7, "monthly"),
    entry("/blog", SITE_UPDATED, 0.6, "weekly"),
    entry("/book", SITE_UPDATED, 0.5, "monthly"),
  ];

  // /apply, /dashboard, /admin and /activate-memory are intentionally absent:
  // they are noindex and have no business being submitted for crawling.
  return [...hubs, ...benchmark, ...comparisons, ...useCases, ...integrations, ...existing];
}
