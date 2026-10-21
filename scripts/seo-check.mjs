#!/usr/bin/env node
/**
 * pSEO static + live checks for the causal-memory website.
 *
 *   node scripts/seo-check.mjs                     # static, plus live if a server answers
 *   SEO_BASE_URL=http://127.0.0.1:3111 node scripts/seo-check.mjs
 *   node scripts/seo-check.mjs --require-live      # fail if no server is reachable
 *
 * Static checks always run and need no build: page files, generateStaticParams,
 * generateMetadata, noindex metadata, sitemap wiring.
 *
 * Live checks run against a running `next dev` / `next start`: HTTP 200, unique
 * title/description, self canonical, parseable JSON-LD with the expected types,
 * >= 600 rendered English words, 4-8 contextual links on child pages, sitemap
 * coverage, robots noindex on private routes, and no dead internal links.
 *
 * No dependencies. Exits 1 when any check fails.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SEO_BASE_URL || "http://127.0.0.1:3111";
const REQUIRE_LIVE = process.argv.includes("--require-live");
const SITE = "https://causal-memory.com";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`  ${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

function file(rel) {
  return resolve(ROOT, rel);
}

function mustRead(rel) {
  const path = file(rel);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

// ─── Expected surface ─────────────────────────────────────────────────────

const PAGE_FILES = [
  { url: "/compare", file: "src/app/compare/page.tsx", type: "hub" },
  { url: "/use-cases", file: "src/app/use-cases/page.tsx", type: "hub" },
  { url: "/benchmarks/causaleval", file: "src/app/benchmarks/causaleval/page.tsx", type: "benchmark", jsonLd: ["TechArticle", "Dataset", "FAQPage", "BreadcrumbList"] },
  { url: "/vs/mem0", file: "src/app/vs/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/vs/zep", file: "src/app/vs/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/vs/letta", file: "src/app/vs/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/use-cases/coding-agent", file: "src/app/use-cases/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/use-cases/on-call-agent", file: "src/app/use-cases/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/use-cases/trading-agent", file: "src/app/use-cases/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/integrations/claude-code", file: "src/app/integrations/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/integrations/cursor", file: "src/app/integrations/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
  { url: "/integrations/dsh", file: "src/app/integrations/[slug]/page.tsx", type: "child", jsonLd: ["Article", "FAQPage", "BreadcrumbList"] },
];

const HUB_JSONLD = ["CollectionPage", "ItemList"];
const NOINDEX_ROUTES = [
  { url: "/admin", file: "src/app/admin/page.tsx" },
  { url: "/dashboard", file: "src/app/dashboard/page.tsx" },
  { url: "/apply", file: "src/app/apply/page.tsx" },
  { url: "/activate-memory", file: "src/app/activate-memory/page.tsx" },
];

function expectedJsonLd(page) {
  return page.type === "hub" ? HUB_JSONLD : page.jsonLd;
}

function canonicalFor(url) {
  return `${SITE}${url}`;
}

// ─── HTML helpers ─────────────────────────────────────────────────────────

function stripTags(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const text = stripTags(main ? main[1] : html);
  return (text.match(/[A-Za-z][A-Za-z0-9'’-]*/g) || []).length;
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : "";
}

function metaTags(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
}

function linkTags(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1],
  );
}

function collectTypes(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, out);
  } else if (value && typeof value === "object") {
    if (typeof value["@type"] === "string") out.push(value["@type"]);
    else if (Array.isArray(value["@type"])) out.push(...value["@type"]);
    for (const key of ["@graph", "mainEntity", "itemListElement"]) {
      if (key in value) collectTypes(value[key], out);
    }
  }
  return out;
}

function internalLinks(html) {
  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  return [...new Set(hrefs)].filter(
    (href) =>
      href.startsWith("/") &&
      !href.startsWith("/_next") &&
      !href.startsWith("/api/") &&
      !href.startsWith("//") &&
      !/\.(png|jpg|jpeg|svg|gif|webp|ico|xml|txt|pdf|mp4)$/i.test(href) &&
      !href.includes("#"),
  );
}

// ─── Static checks ────────────────────────────────────────────────────────

console.log("\nStatic checks");
console.log("─".repeat(60));

let staticOk = true;
for (const page of PAGE_FILES) {
  const src = mustRead(page.file);
  const ok = check(`page file exists: ${page.file}`, src.length > 0);
  staticOk = staticOk && ok;
}

for (const dynamicFile of [
  "src/app/vs/[slug]/page.tsx",
  "src/app/use-cases/[slug]/page.tsx",
  "src/app/integrations/[slug]/page.tsx",
]) {
  const src = mustRead(dynamicFile);
  staticOk = check(`generateStaticParams in ${dynamicFile}`, /export\s+function\s+generateStaticParams/.test(src)) && staticOk;
  staticOk = check(`generateMetadata in ${dynamicFile}`, /export\s+async\s+function\s+generateMetadata/.test(src)) && staticOk;
}

for (const route of NOINDEX_ROUTES) {
  const src = mustRead(route.file);
  const ok = /robots\s*:\s*\{[^}]*index\s*:\s*false/.test(src);
  staticOk = check(`noindex metadata on ${route.url}`, ok) && staticOk;
}

const sitemapSrc = mustRead("src/app/sitemap.ts");
staticOk =
  check(
    "sitemap wires every pSEO collection",
    ["comparisonPages", "useCasePages", "integrationPages", "BENCHMARK_PATH", '"/compare"', '"/use-cases"'].every(
      (token) => sitemapSrc.includes(token),
    ),
  ) && staticOk;

const robotsSrc = mustRead("src/app/robots.ts");
staticOk = check("robots.ts declares the sitemap", robotsSrc.includes("/sitemap.xml")) && staticOk;

// Data slugs (source-level: the .ts files are not importable without a loader)
const dataExpectations = [
  ["src/data/seo/comparisons.ts", ["mem0", "zep", "letta"]],
  ["src/data/seo/use-cases.ts", ["coding-agent", "on-call-agent", "trading-agent"]],
  ["src/data/seo/integrations.ts", ["claude-code", "cursor", "dsh"]],
];
for (const [rel, slugs] of dataExpectations) {
  const src = mustRead(rel);
  for (const slug of slugs) {
    staticOk = check(`data slug ${slug} in ${rel}`, src.includes(`slug: "${slug}"`)) && staticOk;
  }
}

// Related links must resolve to a known route prefix and stay within 4-8.
for (const [rel, kind] of [
  ["src/data/seo/comparisons.ts", "comparison"],
  ["src/data/seo/use-cases.ts", "use case"],
  ["src/data/seo/integrations.ts", "integration"],
]) {
  const src = mustRead(rel);
  const isKnownPrefix = (href) =>
    /^\/(vs|use-cases|integrations)\//.test(href) ||
    ["/compare", "/use-cases", "/benchmarks/causaleval"].includes(href);
  const blocked = (src.match(/related:\s*\[([\s\S]*?)\]/g) || []).filter((block) => {
    const links = (block.match(/"(?:[^"\\]|\\.)*"/g) || []).map((s) => s.slice(1, -1));
    return links.length < 4 || links.length > 8 || links.some((href) => !isKnownPrefix(href));
  });
  staticOk = check(`${kind} pages have 4-8 valid related links`, blocked.length === 0, `${blocked.length} bad blocks`) && staticOk;
}

// ─── Live checks ──────────────────────────────────────────────────────────

async function fetchText(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    return { status: response.status, text: await response.text(), finalUrl: response.url };
  } catch (error) {
    return { status: 0, text: "", finalUrl: url, error: String(error) };
  }
}

async function serverReachable() {
  const probe = await fetchText(`${BASE}/robots.txt`);
  return probe.status === 200;
}

const reachable = await serverReachable();
if (!reachable) {
  console.log(`\nLive checks: SKIPPED — no server at ${BASE}`);
  if (REQUIRE_LIVE) {
    check("live server reachable", false, `no server at ${BASE}`);
  }
} else {
  console.log(`\nLive checks against ${BASE}`);
  console.log("─".repeat(60));

  const titles = new Map();
  const descriptions = new Map();
  const allInternal = new Set();

  for (const page of PAGE_FILES) {
    const url = `${BASE}${page.url}`;
    const { status, text } = await fetchText(url);
    if (!check(`HTTP 200 ${page.url}`, status === 200, `status ${status}`)) continue;

    const title = (text.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
    const desc = attr(metaTags(text).find((tag) => attr(tag, "name") === "description") || "", "content");

    check(`title present ${page.url}`, title.length > 10, title);
    check(`description present ${page.url}`, desc.length > 50, `${desc.length} chars`);

    if (titles.has(title)) check(`unique title ${page.url}`, false, `duplicate of ${titles.get(title)}`);
    else titles.set(title, page.url);

    if (descriptions.has(desc)) check(`unique description ${page.url}`, false, `duplicate of ${descriptions.get(desc)}`);
    else descriptions.set(desc, page.url);

    const canonical = attr(linkTags(text).find((tag) => attr(tag, "rel") === "canonical") || "", "href");
    check(`self canonical ${page.url}`, canonical === canonicalFor(page.url), canonical || "missing");

    const ogTitle = attr(metaTags(text).find((tag) => attr(tag, "property") === "og:title") || "", "content");
    const ogUrl = attr(metaTags(text).find((tag) => attr(tag, "property") === "og:url") || "", "content");
    check(`og:title ${page.url}`, ogTitle.length > 0);
    check(`og:url ${page.url}`, ogUrl === canonicalFor(page.url), ogUrl || "missing");

    const h1s = [...text.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    check(`exactly one h1 ${page.url}`, h1s.length === 1, `${h1s.length} found`);

    const blocks = jsonLdBlocks(text);
    const types = [];
    let parsedOk = blocks.length > 0;
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block);
        collectTypes(parsed, types);
      } catch (error) {
        parsedOk = false;
        check(`JSON-LD parses ${page.url}`, false, String(error).slice(0, 80));
      }
    }
    check(`JSON-LD parses ${page.url}`, parsedOk, `${blocks.length} block(s)`);
    const wanted = expectedJsonLd(page);
    check(
      `JSON-LD types ${page.url}`,
      wanted.every((type) => types.includes(type)),
      `wanted ${wanted.join("+")}; got ${[...new Set(types)].join(",")}`,
    );

    const words = countWords(text);
    check(`>= 600 words ${page.url}`, words >= 600, `${words} words`);

    if (page.type === "child") {
      const links = internalLinks(text).filter((href) => /^\/(vs|use-cases|integrations)\//.test(href));
      check(`4-8 contextual links ${page.url}`, links.length >= 4 && links.length <= 8, `${links.length}`);
    }

    for (const href of internalLinks(text)) allInternal.add(href);
  }

  // Hub coverage: every child page is linked from at least one hub.
  const compareHtml = (await fetchText(`${BASE}/compare`)).text;
  const useCaseHtml = (await fetchText(`${BASE}/use-cases`)).text;
  for (const href of ["/vs/mem0", "/vs/zep", "/vs/letta"]) {
    check(`hub /compare lists ${href}`, compareHtml.includes(`href="${href}"`));
  }
  for (const href of ["/use-cases/coding-agent", "/use-cases/on-call-agent", "/use-cases/trading-agent"]) {
    check(`hub /use-cases lists ${href}`, useCaseHtml.includes(`href="${href}"`));
  }

  // Sitemap coverage
  const sitemap = await fetchText(`${BASE}/sitemap.xml`);
  check("sitemap.xml is reachable", sitemap.status === 200, `status ${sitemap.status}`);
  const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const page of PAGE_FILES) {
    check(`sitemap includes ${page.url}`, locs.includes(canonicalFor(page.url)));
  }
  for (const route of NOINDEX_ROUTES) {
    check(`sitemap excludes noindex ${route.url}`, !locs.includes(canonicalFor(route.url)));
  }
  check("sitemap lastmod present", (sitemap.text.match(/<lastmod>/g) || []).length >= PAGE_FILES.length);

  // robots.txt
  const robots = await fetchText(`${BASE}/robots.txt`);
  check("robots.txt advertises sitemap", robots.text.includes(`${SITE}/sitemap.xml`), robots.text.split("\n")[0]);

  // noindex routes
  for (const route of NOINDEX_ROUTES) {
    const { status, text } = await fetchText(`${BASE}${route.url}`);
    const robotsMeta = metaTags(text).find((tag) => attr(tag, "name") === "robots") || "";
    check(`${route.url} returns 200`, status === 200, `status ${status}`);
    check(`${route.url} is noindex`, /noindex/.test(robotsMeta), robotsMeta || "missing");
  }

  // Dead internal links. /hub/ is the pre-existing MCP hub link in the root
  // header (target=_blank), served by a separate deployment — not part of the
  // pSEO surface and intentionally not touched by this change.
  const SKIP_LINKS = new Set(["/hub/"]);
  allInternal.delete("/hub/");
  allInternal.add("/compare");
  allInternal.add("/use-cases");
  const checked = new Map();
  for (const href of [...allInternal].sort()) {
    if (checked.has(href)) continue;
    const response = await fetchText(`${BASE}${href}`);
    checked.set(href, response.status);
  }
  const dead = [...checked.entries()].filter(([, status]) => status >= 400 || status === 0);
  check("no dead internal links", dead.length === 0, dead.map(([href, status]) => `${href} (${status})`).join(", ") || `${checked.size} links`);
}

// ─── Summary ──────────────────────────────────────────────────────────────

const failed = results.filter((r) => !r.ok);
console.log("\n" + "─".repeat(60));
console.log(`${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) {
  console.log("\nFailures:");
  for (const item of failed) console.log(`  - ${item.name}${item.detail ? ` (${item.detail})` : ""}`);
  process.exit(1);
}
if (!reachable && REQUIRE_LIVE) process.exit(1);
process.exit(staticOk ? 0 : 1);
