/**
 * Shapes for the programmatic SEO pages under /compare, /vs, /use-cases,
 * /integrations and /benchmarks/causaleval.
 *
 * Every entity carries its own `updatedAt`; the sitemap uses it for `lastmod`
 * and the rendered pages show it as a visible "last updated" line, so a stale
 * page is obvious in the HTML instead of only in the sitemap.
 */

export type FaqItem = {
  q: string;
  a: string;
};

/** One row of the head-to-head capability table: us vs the competitor. */
export type FeatureRow = {
  label: string;
  us: string;
  them: string;
};

/**
 * A gap is a table row where the "us" column is the uncomfortable answer.
 * Structured (not a bare string) so it can be rendered as a real row of the
 * comparison table rather than a footnote nobody reads.
 */
export type GapRow = {
  label: string;
  us: string;
  them: string;
};

export type Comparison = {
  slug: string;
  name: string;
  /** On-page H1. */
  title: string;
  /** <title>; the root layout appends " · causal-memory". */
  seoTitle: string;
  /** Meta description — also used as the lead paragraph under the H1. */
  description: string;
  tagline: string;
  intro: string[];
  features: FeatureRow[];
  honestGaps: GapRow[];
  chooseThem: string[];
  chooseUs: string[];
  verdict: string;
  faq: FaqItem[];
  /** Absolute site paths; resolved to cards by RelatedLinks. 4-8 per page. */
  related: string[];
  updatedAt: string;
};

export type Metric = {
  label: string;
  value: string;
  note: string;
};

export type CodeSample = {
  title: string;
  language: string;
  code: string;
};

export type ApproachSection = {
  heading: string;
  body: string;
  bullets: string[];
};

export type UseCase = {
  slug: string;
  name: string;
  title: string;
  seoTitle: string;
  description: string;
  tagline: string;
  /** Who this page is for, in one sentence. */
  persona: string;
  painPoints: { label: string; body: string }[];
  approach: ApproachSection[];
  metrics: Metric[];
  code: CodeSample[];
  faq: FaqItem[];
  related: string[];
  updatedAt: string;
};

export type IntegrationStep = {
  title: string;
  body: string;
  code?: string;
};

export type Integration = {
  slug: string;
  name: string;
  title: string;
  seoTitle: string;
  description: string;
  tagline: string;
  prerequisite: string;
  steps: IntegrationStep[];
  config: CodeSample;
  /** The five tools worth learning first, out of the 17 exposed. */
  tools: { name: string; what: string }[];
  notes: string[];
  faq: FaqItem[];
  related: string[];
  updatedAt: string;
};

export type EvidenceRow = {
  capability: string;
  ours: string;
  baseline: string;
  tests: string;
};
