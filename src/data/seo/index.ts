import { comparisons } from "./comparisons";
import { useCases } from "./use-cases";
import { integrations } from "./integrations";
import type { Comparison, UseCase, Integration } from "./types";
import { SITE_URL, absoluteUrl } from "./site";

export { SITE_URL, absoluteUrl };

export type SeoLinkGroup = "Overview" | "Comparison" | "Use case" | "Integration" | "Benchmark";

export type SeoLink = {
  href: string;
  title: string;
  description: string;
  group: SeoLinkGroup;
};

export const BENCHMARK_PATH = "/benchmarks/causaleval";

export const BENCHMARK_LINK: SeoLink = {
  href: BENCHMARK_PATH,
  title: "CausalEval benchmark",
  description:
    "The graph-grounded causal memory benchmark: protocol, per-capability results, how to reproduce, and the limitations we have not fixed.",
  group: "Benchmark",
};

export const HUB_LINKS: SeoLink[] = [
  {
    href: "/compare",
    title: "Compare",
    description:
      "How causal-memory differs from mem0, Zep and Letta — including the benchmarks where it loses.",
    group: "Overview",
  },
  {
    href: "/use-cases",
    title: "Use cases",
    description:
      "Coding agents, on-call agents and trading research agents: what causal memory changes in each.",
    group: "Overview",
  },
];

const comparisonLinks: SeoLink[] = comparisons.map((c) => ({
  href: `/vs/${c.slug}`,
  title: `causal-memory vs ${c.name}`,
  description: c.tagline,
  group: "Comparison",
}));

const useCaseLinks: SeoLink[] = useCases.map((u) => ({
  href: `/use-cases/${u.slug}`,
  title: u.title,
  description: u.tagline,
  group: "Use case",
}));

const integrationLinks: SeoLink[] = integrations.map((i) => ({
  href: `/integrations/${i.slug}`,
  title: i.title,
  description: i.tagline,
  group: "Integration",
}));

/**
 * Every pSEO page, keyed by path. RelatedLinks resolves `related: string[]`
 * through this map, so a typo shows up as an empty card list in review rather
 * than as a silent 404 in production (scripts/seo-check.mjs also fails on it).
 */
export const SEO_LINKS: Record<string, SeoLink> = Object.fromEntries(
  [...HUB_LINKS, ...comparisonLinks, ...useCaseLinks, ...integrationLinks, BENCHMARK_LINK].map((link) => [
    link.href,
    link,
  ]),
);

export function resolveLinks(hrefs: string[]): { link: SeoLink; missing?: string }[] {
  return hrefs.map((href) => {
    const link = SEO_LINKS[href];
    if (link) return { link };
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[seo] related link not found in registry: ${href}`);
    }
    return { link: { href, title: href, description: "", group: "Overview" as const }, missing: href };
  });
}

export const comparisonPages = comparisons;
export const useCasePages = useCases;
export const integrationPages = integrations;

export type { Comparison, UseCase, Integration };
