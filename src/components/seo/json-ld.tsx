import type { FaqItem } from "@/data/seo/types";
import { SITE_URL } from "@/data/seo";

export type JsonLdObject = Record<string, unknown>;

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "causal-memory",
  url: SITE_URL,
  sameAs: ["https://github.com/JingxuanC/causal-memory"],
} as const;

/**
 * Renders a JSON-LD script. `JSON.stringify` already escapes quotes; the `<`
 * replacement additionally prevents a literal `</script>` inside any string
 * from closing the tag early (the classic injection/footgun case).
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}

export function breadcrumbJsonLd(crumbs: { name: string; href: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${new URL(crumbs[crumbs.length - 1].href, SITE_URL).toString()}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.href, SITE_URL).toString(),
    })),
  };
}

export function articleJsonLd({
  path,
  title,
  description,
  updatedAt,
  section,
  keywords,
}: {
  path: string;
  title: string;
  description: string;
  updatedAt: string;
  section: string;
  keywords: string[];
}): JsonLdObject {
  const url = new URL(path, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: "2026-10-21",
    dateModified: updatedAt,
    inLanguage: "en",
    articleSection: section,
    keywords: keywords.join(", "),
    author: ORGANIZATION,
    publisher: ORGANIZATION,
  };
}

export function faqJsonLd(faq: FaqItem[], path: string): JsonLdObject {
  const url = new URL(path, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function collectionJsonLd({
  path,
  title,
  description,
  updatedAt,
}: {
  path: string;
  title: string;
  description: string;
  updatedAt: string;
}): JsonLdObject {
  const url = new URL(path, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: title,
    description,
    url,
    dateModified: updatedAt,
    inLanguage: "en",
    publisher: ORGANIZATION,
  };
}

export function itemListJsonLd({
  path,
  name,
  items,
}: {
  path: string;
  name: string;
  items: { name: string; path: string }[];
}): JsonLdObject {
  const url = new URL(path, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#itemlist`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: new URL(item.path, SITE_URL).toString(),
    })),
  };
}

export function techArticleJsonLd({
  path,
  title,
  description,
  updatedAt,
  keywords,
}: {
  path: string;
  title: string;
  description: string;
  updatedAt: string;
  keywords: string[];
}): JsonLdObject {
  const url = new URL(path, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#techarticle`,
    headline: title,
    description,
    url,
    datePublished: "2026-10-21",
    dateModified: updatedAt,
    inLanguage: "en",
    proficiencyLevel: "Expert",
    keywords: keywords.join(", "),
    author: ORGANIZATION,
    publisher: ORGANIZATION,
  };
}

export function datasetJsonLd({
  path,
  name,
  description,
  updatedAt,
  version,
  measurementTechnique,
}: {
  path: string;
  name: string;
  description: string;
  updatedAt: string;
  version: string;
  measurementTechnique: string;
}): JsonLdObject {
  const url = new URL(path, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name,
    description,
    url,
    version,
    dateModified: updatedAt,
    license: "https://www.apache.org/licenses/LICENSE-2.0",
    isAccessibleForFree: true,
    inLanguage: "en",
    creator: ORGANIZATION,
    measurementTechnique,
    variableMeasured: [
      "C1 attribution accuracy",
      "C2 intervention accuracy",
      "C3 counterfactual accuracy",
      "C4 inhibition accuracy",
      "C5 temporal-causal accuracy",
      "C6 lesson-transfer accuracy",
      "C7 update accuracy",
    ],
  };
}
