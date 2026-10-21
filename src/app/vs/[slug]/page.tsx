import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { comparisonBySlug, comparisons } from "@/data/seo/comparisons";
import {
  CAUSALEVAL_ROWS,
  EVIDENCE_DATE,
  EVIDENCE_SOURCE,
  FACT_RECALL_ROWS,
  MEM0_FACT_RECALL_GAP,
} from "@/data/seo/evidence";
import { SeoShell, Section, Prose, ChoiceColumns, Bullets } from "@/components/seo/seo-shell";
import { FeatureTable, EvidenceTable } from "@/components/seo/feature-table";
import { FaqSection } from "@/components/seo/faq-section";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return comparisons.map((comparison) => ({ slug: comparison.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = comparisonBySlug.get(slug);
  if (!comparison) return {};
  return buildSeoMetadata({
    path: `/vs/${comparison.slug}`,
    title: comparison.seoTitle,
    description: comparison.description,
    updatedAt: comparison.updatedAt,
  });
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = comparisonBySlug.get(slug);
  if (!comparison) notFound();

  const path = `/vs/${comparison.slug}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Compare", href: "/compare" },
    { name: comparison.name, href: path },
  ];
  const isMem0 = comparison.slug === "mem0";

  return (
    <SeoShell
      kicker="COMPARISON"
      title={comparison.title}
      subtitle={comparison.tagline}
      crumbs={crumbs}
      updatedAt={comparison.updatedAt}
      related={comparison.related}
      cta={{
        title: `Try causal-memory next to ${comparison.name}`,
        body: "It installs as an MCP server, stores everything in one SQLite file, and does not require you to remove whatever you already use for facts.",
      }}
      jsonLd={[
        articleJsonLd({
          path,
          title: comparison.seoTitle,
          description: comparison.description,
          updatedAt: comparison.updatedAt,
          section: "Comparison",
          keywords: [
            "agent memory",
            comparison.name,
            "causal memory",
            "MCP",
            "mem0 alternative",
            "LLM memory",
          ],
        }),
        faqJsonLd(comparison.faq, path),
        breadcrumbJsonLd(crumbs),
      ]}
    >
      <Section title="The short version">
        <Prose>
          {comparison.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </Prose>
        {isMem0 ? (
          <p className="mt-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm leading-6 text-[#475569]">
            <strong className="text-[#0f172a]">The gap, up front:</strong> {MEM0_FACT_RECALL_GAP} If fact recall
            is the job you are hiring memory for, mem0 is the better tool and this page will not pretend otherwise.
          </p>
        ) : null}
      </Section>

      <Section
        title={`causal-memory vs ${comparison.name}, capability by capability`}
        lead="The last block of this table is deliberate: it lists the places where causal-memory is the weaker choice. A comparison page that only has winning rows is an advertisement."
      >
        <FeatureTable
          themName={comparison.name}
          features={comparison.features}
          gaps={comparison.honestGaps}
        />
      </Section>

      <Section title="When to choose each one">
        <ChoiceColumns them={comparison.chooseThem} us={comparison.chooseUs} themName={comparison.name} />
      </Section>

      <Section
        title="The numbers, with their provenance"
        lead={`Source: ${EVIDENCE_SOURCE}, read ${EVIDENCE_DATE}. The baseline column is the mem0 run on the same 70-question protocol; ${
          isMem0 ? "a like-for-like comparison" : "we did not run this system on CausalEval and do not publish a score for it"
        }.`}
      >
        <EvidenceTable
          rows={CAUSALEVAL_ROWS}
          baselineLabel="mem0 (70q baseline)"
          caption="CausalEval v13 results by capability, causal-memory versus the mem0 baseline"
          highlight="C7 Update"
        />
        {isMem0 ? (
          <>
            <h3 className="mt-8 text-lg font-semibold text-[#0f172a]">Fact recall, where mem0 wins</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
              These suites measure atomic fact extraction and recall. causal-memory is competitive but does not
              lead, and two of these numbers need context: LongMemEval-S compares a single-model stack against a
              platform stack, and the official 94.4% has an independent reproduction at 73.8%.
            </p>
            <div className="mt-4">
              <EvidenceTable
                rows={FACT_RECALL_ROWS}
                baselineLabel="mem0 / baseline"
                caption="Fact-recall benchmarks where mem0 leads"
              />
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#64748b]">
            The same table appears on every comparison page, with the same baseline, so the numbers cannot drift
            between pages. For the fact-recall suites where mem0 leads, see{" "}
            <Link href="/vs/mem0" className="font-medium text-[#0284c7] hover:underline">
              the mem0 comparison
            </Link>
            .
          </p>
        )}
      </Section>

      <Section title="What the difference looks like in practice">
        <Prose>
          <p>{comparison.verdict}</p>
        </Prose>
        <div className="mt-5">
          <Bullets
            items={[
              "Both systems can be mounted at once. Nothing in causal-memory requires you to remove an existing memory layer.",
              "The comparison is about the stored object, not about which project is better engineered.",
              "Every claim about the competitor on this page is either a public product fact or a row from the causal-memory README differentiation table.",
            ]}
          />
        </div>
      </Section>

      <FaqSection faq={comparison.faq} title={`${comparison.name} questions, answered plainly`} />
    </SeoShell>
  );
}
