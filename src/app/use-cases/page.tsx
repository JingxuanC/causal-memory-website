import type { Metadata } from "next";
import Link from "next/link";
import { useCases } from "@/data/seo/use-cases";
import { SEO_LINKS } from "@/data/seo";
import { EVIDENCE_DATE, EVIDENCE_SOURCE } from "@/data/seo/evidence";
import { SeoShell, Section, Prose, Bullets } from "@/components/seo/seo-shell";
import { collectionJsonLd, itemListJsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo";

const UPDATED_AT = "2026-10-21";
const PATH = "/use-cases";

export const metadata: Metadata = buildSeoMetadata({
  path: PATH,
  title: "Causal memory use cases",
  description:
    "Three places causal memory changes an agent's behaviour: coding agents, on-call agents and trading research agents. What is recorded, what is recalled, and what to measure.",
  updatedAt: UPDATED_AT,
  type: "website",
});

const LOOP: { field: string; coding: string; onCall: string; trading: string }[] = [
  {
    field: "decision",
    coding: "Replaced the unbounded retry loop with a bounded queue",
    onCall: "Rolled back the checkout service during the latency spike",
    trading: "Cut gross exposure before the scheduled macro release",
  },
  {
    field: "context",
    coding: "Go 1.22, four workers, replaying the ingest backlog",
    onCall: "Peak traffic, primary at its connection ceiling",
    trading: "Event week, elevated implied vol, thin liquidity",
  },
  {
    field: "outcome",
    coding: "Replay stopped dropping events; retries no longer amplified load",
    onCall: "Error budget stopped draining; the database stayed below its ceiling",
    trading: "Realised volatility stayed below the level the position was sized for",
  },
  {
    field: "relation",
    coding: "caused",
    onCall: "prevented",
    trading: "caused",
  },
];

export default function UseCasesHub() {
  const items = useCases.map((useCase) => ({ name: useCase.name, path: `/use-cases/${useCase.slug}` }));

  return (
    <SeoShell
      kicker="USE CASES"
      title="Where causal memory earns its place"
      subtitle="Any agent that makes decisions and later learns what happened has something worth recording. These three have the shortest path from a recorded edge to a different next action."
      crumbs={[
        { name: "Home", href: "/" },
        { name: "Use cases", href: PATH },
      ]}
      updatedAt={UPDATED_AT}
      related={["/compare", "/benchmarks/causaleval"]}
      cta={{
        title: "Pick the decision you make most often",
        body: "Record it once, add the outcome when you know it, and ask for it back before the next one. The use case pages are the same loop with different nouns.",
      }}
      jsonLd={[
        collectionJsonLd({
          path: PATH,
          title: "Causal memory use cases",
          description: "Coding agents, on-call agents and trading research agents using causal memory.",
          updatedAt: UPDATED_AT,
        }),
        itemListJsonLd({ path: PATH, name: "Use cases", items }),
      ]}
    >
      <Section title="One loop, three domains">
        <Prose>
          <p>
            The interface does not change between domains. A decision, the context it was made in, the outcome that
            followed, and the relation between them. What changes is which outcome is valuable: a coding agent needs
            the rejected alternative, an on-call agent needs the mitigation that prevented a worse outage, and a
            research agent needs the counterfactual it can compare against later.
          </p>
          <p>
            That is why the pages below are not templates with the nouns swapped. Each one names a different failure
            mode of text-only memory, and a different metric that should move if the causal record is working.
          </p>
        </Prose>
      </Section>

      <Section title="The three use cases">
        <ul className="grid gap-4 md:grid-cols-3">
          {useCases.map((useCase) => {
            const link = SEO_LINKS[`/use-cases/${useCase.slug}`];
            return (
              <li key={useCase.slug}>
                <Link
                  href={`/use-cases/${useCase.slug}`}
                  className="block h-full rounded-2xl border border-[#e2e8f0] bg-white p-6 transition-colors hover:border-[#0284c7]"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0284c7]">
                    {useCase.name}
                  </span>
                  <span className="mt-2 block text-lg font-semibold text-[#0f172a]">{link.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-[#64748b]">{useCase.tagline}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        title="The same three fields, filled in differently"
        lead="These are illustrative payloads, not customer results. The point is the shape: a decision that can be compared later only exists if the context and the relation are recorded with it."
      >
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Example decision, context and outcome by use case</caption>
            <thead className="bg-[#f1f5f9] text-[#0f172a]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Field</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Coding agent</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">On-call agent</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Trading agent</th>
              </tr>
            </thead>
            <tbody>
              {LOOP.map((row) => (
                <tr key={row.field} className="border-t border-[#e2e8f0]">
                  <th scope="row" className="px-4 py-3 text-left font-mono text-xs font-semibold text-[#0284c7]">
                    {row.field}
                  </th>
                  <td className="px-4 py-3 text-[#475569]">{row.coding}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.onCall}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.trading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="How to choose your first use case">
        <Prose>
          <p>
            Start where a wrong decision is expensive and the lesson is currently lost. That is usually incident
            response or a migration, not a greenfield feature: the decision is explicit, the outcome is observable
            within hours, and the failure repeats if nobody writes it down.
          </p>
          <p>
            Avoid starting with a domain where the outcome takes months to observe. An edge with no outcome is not a
            causal memory yet; it is a note. The trading workflow works because the review horizon is explicit, not
            because the domain is easier.
          </p>
        </Prose>
        <div className="mt-4">
          <Bullets
            items={[
              "Start with one task_tag and record every decision in it for two weeks before judging recall quality.",
              "Record the rejected alternative at decision time; inventing it during review is hindsight bias.",
              "Pick a metric that can move in a quarter — repeat incidents, reverted retries, re-argued architecture — not a revenue number.",
              "Read the comparison pages if you are deciding whether to add causal memory at all, and the CausalEval page before trusting any number.",
            ]}
          />
        </div>
      </Section>

      <Section title="What the benchmark supports">
        <Prose>
          <p>
            The capabilities these use cases depend on are exactly the ones CausalEval measures: intervention
            prediction (75% vs 40%), inhibition (80% vs 50%), counterfactual choice (95% vs 80%) and belief revision
            (100% vs 80%). Fact recall is not on that list, because none of these workflows becomes better at
            remembering a preference. Source: {EVIDENCE_SOURCE}, read {EVIDENCE_DATE}.
          </p>
        </Prose>
        <p className="mt-4 text-sm">
          <Link href="/benchmarks/causaleval" className="font-medium text-[#0284c7] hover:underline">
            See the protocol, the per-capability table and the C6 limitation →
          </Link>
        </p>
      </Section>
    </SeoShell>
  );
}
