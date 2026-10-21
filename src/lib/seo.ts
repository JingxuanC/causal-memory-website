import type { Metadata } from "next";
import { SITE_URL } from "@/data/seo";

export const DEFAULT_OG_IMAGE = {
  url: "/demo/demo_card.png",
  width: 1280,
  height: 800,
  alt: "causal-memory — agent memory with a causal core",
} as const;

type SeoMetadataInput = {
  /** Absolute site path, e.g. "/vs/mem0". Used for the self-referential canonical. */
  path: string;
  title: string;
  description: string;
  updatedAt: string;
  /** Article for comparisons/use cases/integrations; website for hubs. */
  type?: "article" | "website";
};

/**
 * Metadata for a pSEO page: unique title/description, self canonical, OG and
 * Twitter cards. `metadataBase` lives in app/layout.tsx, so the relative
 * canonical resolves to https://causal-memory.com<path>.
 */
export function buildSeoMetadata({
  path,
  title,
  description,
  updatedAt,
  type = "article",
}: SeoMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: "causal-memory",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
      ...(type === "article" ? { publishedTime: "2026-10-21", modifiedTime: updatedAt } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export function canonicalUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
