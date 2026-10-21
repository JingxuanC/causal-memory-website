import type { Metadata } from "next";
import Link from "next/link";
import { comparisons } from "@/data/seo/comparisons";
import { SEO_LINKS } from "@/data/seo";
import { CAUSALEVAL_HEADLINE, EVIDENCE_DATE, EVIDENCE_SOURCE, MEM0_FACT_RECALL_GAP } from "@/data/seo/evidence";
import { SeoShell, Section, Prose, Bullets } from "@/components/seo/seo-shell";
import { collectionJsonLd, itemListJsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo";

const UPDATED_AT = "2026-10-21";
const PATH = "/compare";

export const metadata: Metadata = buildSeoMetadata({
  path: PATH,
  title: "Compare causal-memory alternatives",
  description:
    "How causal-memory compares with mem0, Zep and Letta — and with built-in context — including the benchmarks where it loses. Numbers sourced and dated.",
  updatedAt: UPDATED_AT,
  type: "website",
});

const OVERVIEW: { name: string; href?: string; bestAt: string; weakestAt: string }[] = [
  {
    name: "mem0",
    href: "/vs/mem0",
    bestAt: "Fact recall — 91.6% on LoCoMo with a strict judge, the best of anything compared here",
    weakestAt: "No causal or inhibitory edge, so it cannot warn about a repeated mistake",
  },
  {
    name: "Zep",
    href: "/vs/zep",
    bestAt: "Temporal knowledge graphs and bi-temporal fact validity",
    weakestAt: "Graph service plus a graph database to operate; no causal semantics",
  },
  {
    name: "Letta",
    href: "/vs/letta",
    bestAt: "A complete stateful agent runtime with editable memory blocks and a desktop environment",
    weakestAt: "Memory lives inside the runtime; prose blocks have no ranking semantics",
  },
  {
    name: "causal-memory",
    bestAt: "Typed decision → outcome edges, inhibition, pre-action warnings — 78% vs 65% overall on CausalEval.",
    weakestAt: "Fact recall (79.1% on LoCoMo) and lesson transfer (C6, 20%) trail the field",
  },
  {
    name: "Built-in context",
    bestAt: "Zero setup: the conversation window already contains the recent past",
    weakestAt: "Compaction erases the reasoning first — 45% textual recall at 5x compaction in our harness",
  },
];

export default function CompareHub() {
  const items = comparisons.map((comparison) => ({
    name: `causal-memory vs ${comparison.name}`,
    path: `/vs/${comparison.slug}`,
  }));

  return (
    <SeoShell
      kicker="COMPARE"
      title="Agent memory, compared honestly"
      subtitle="Four ways to give an agent memory — and one of them is doing nothing. Each comparison names where causal-memory loses before it names where it wins."
      crumbs={[
        { name: "Home", href: "/" },
        { name: "Compare", href: PATH },
      ]}
      updatedAt={UPDATED_AT}
      related={["/use-cases", "/benchmarks/causaleval"]}
      cta={{
        title: "The comparison that matters is your own",
        body: "Install the server, record one decision, and ask for it back a week later. Every page here is evidence you can check, not a verdict you have to accept.",
      }}
      jsonLd={[
        collectionJsonLd({
          path: PATH,
          title: "Agent memory comparisons",
          description:
            "Comparisons of causal-memory with mem0, Zep and Letta, with benchmarks where causal-memory loses.",
          updatedAt: UPDATED_AT,
        }),
        itemListJsonLd({ path: PATH, name: "Comparisons", items }),
      ]}
    >
      <Section title="Why this page exists">
        <Prose>
          <p>
            &quot;Agent memory&quot; covers at least three different products: a fact store, a temporal knowledge
            graph, and an agent runtime with memory bolted in. Comparing them feature-by-feature produces a table
            where everything looks equivalent and nothing is. The useful question is narrower: what object does the
            system store, and what question can it answer that the others cannot?
          </p>
          <p>
            causal-memory stores decision → outcome edges with a type — caused, enabled, prevented, no_effect. That
            is why it can answer &quot;what happens if I do this again?&quot; and why it is worse than mem0 at
            &quot;what is the user&apos;s preferred timezone?&quot;. Both facts belong on the page, in that order.
          </p>
        </Prose>
      </Section>

      <Section title="At a glance" lead="The fourth column is the one most comparison pages omit: what the option is worst at.">
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Agent memory options compared by strength and weakness</caption>
            <thead className="bg-[#f1f5f9] text-[#0f172a]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Option</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Best at</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Weakest at</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {OVERVIEW.map((row) => (
                <tr key={row.name} className={row.name === "causal-memory" ? "border-t border-[#e2e8f0] bg-[#f0f9ff]" : "border-t border-[#e2e8f0]"}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-[#0f172a]">{row.name}</th>
                  <td className="px-4 py-3 text-[#475569]">{row.bestAt}</td>
                  <td className="px-4 py-3 text-[#64748b]">{row.weakestAt}</td>
                  <td className="px-4 py-3">
                    {row.href ? (
                      <Link href={row.href} className="font-medium text-[#0284c7] hover:underline">
                        Compare
                      </Link>
                    ) : (
                      <span className="text-[#94a3b8]">this page</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="The three comparisons">
        <ul className="grid gap-4 md:grid-cols-3">
          {comparisons.map((comparison) => {
            const link = SEO_LINKS[`/vs/${comparison.slug}`];
            return (
              <li key={comparison.slug}>
                <Link
                  href={`/vs/${comparison.slug}`}
                  className="block h-full rounded-2xl border border-[#e2e8f0] bg-white p-6 transition-colors hover:border-[#0284c7]"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0284c7]">
                    vs {comparison.name}
                  </span>
                  <span className="mt-2 block text-lg font-semibold text-[#0f172a]">{link.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-[#64748b]">{comparison.tagline}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="How these pages are written">
        <Prose>
          <p>
            Every number is taken from the causal-memory README (v0.10.0) or the CausalEval v13 report, read on{" "}
            {EVIDENCE_DATE}. Where a competitor was not measured, the page says &quot;not measured&quot; instead of
            implying a result. {CAUSALEVAL_HEADLINE}
          </p>
        </Prose>
        <div className="mt-4">
          <Bullets
            items={[
              "Comparison pages lead with the honest gap, not with the feature where causal-memory wins.",
              MEM0_FACT_RECALL_GAP,
              "Competitor descriptions are limited to public product facts and the README differentiation table; no invented competitor benchmarks.",
              `Source: ${EVIDENCE_SOURCE}.`,
            ]}
          />
        </div>
      </Section>

      <Section title="Read the benchmark before the marketing">
        <Prose>
          <p>
            CausalEval is the only benchmark here designed around causal structure: the graph is the answer key, so
            there is no hand annotation to argue with. It also has a known weak spot — C6 lesson transfer stays at
            20% against mem0&apos;s 30% — and the benchmark page reports it without rounding it away.
          </p>
        </Prose>
        <p className="mt-4 text-sm">
          <Link href="/benchmarks/causaleval" className="font-medium text-[#0284c7] hover:underline">
            Read the CausalEval protocol, results and limitations →
          </Link>
        </p>
      </Section>
    </SeoShell>
  );
}
