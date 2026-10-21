import type { Metadata } from "next";
import Link from "next/link";
import {
  CAUSALEVAL_HEADLINE,
  CAUSALEVAL_PROTOCOL,
  CAUSALEVAL_ROWS,
  EVIDENCE_DATE,
  EVIDENCE_SOURCE,
  FACT_RECALL_ROWS,
} from "@/data/seo/evidence";
import type { FaqItem } from "@/data/seo/types";
import { SeoShell, Section, Prose, Bullets } from "@/components/seo/seo-shell";
import { EvidenceTable } from "@/components/seo/feature-table";
import { FaqSection } from "@/components/seo/faq-section";
import { CodeBlock } from "@/components/seo/code-block";
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd, techArticleJsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo";

const UPDATED_AT = "2026-10-21";
const PATH = "/benchmarks/causaleval";

export const metadata: Metadata = buildSeoMetadata({
  path: PATH,
  title: "CausalEval: a causal memory benchmark",
  description:
    "CausalEval builds the answer key from a causal graph. Protocol, per-capability results (C7 100%, C6 20%), reproduction steps, and the limitations we have not fixed.",
  updatedAt: UPDATED_AT,
});

const CLASSES: { id: string; question: string; gold: string; tool: string }[] = [
  {
    id: "C1",
    question: "Why did this outcome happen?",
    gold: "The backward causal chain from the root decision to the outcome",
    tool: "trace_cause / trace_cause_chain",
  },
  {
    id: "C2",
    question: "If this decision is made again, what will happen?",
    gold: "The forward outcome implied by caused/enabled/prevented edges",
    tool: "intervention_query",
  },
  {
    id: "C3",
    question: "Should the agent do X or Y, given known outcomes?",
    gold: "The option whose recorded outcome is positive or safe",
    tool: "counterfactual_query",
  },
  {
    id: "C4",
    question: "What stopped this outcome from being worse?",
    gold: "The prevented edges targeting the outcome",
    tool: "prevented negative spread",
  },
  {
    id: "C5",
    question: "Which happened first, A or B?",
    gold: "The construction order of events on the causal chain",
    tool: "temporal-causal reasoning",
  },
  {
    id: "C6",
    question: "Facing a similar situation in another task, what should be avoided?",
    gold: "The failure lesson reachable through meta edges",
    tool: "meta-edge mining",
  },
  {
    id: "C7",
    question: "What does the agent now believe, after the old belief was falsified?",
    gold: "The corrected statement; the superseded edge stays retrievable",
    tool: "soft supersession",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "What is CausalEval?",
    a: "A benchmark for the memory capabilities that fact-recall suites cannot measure: typed causal reasoning, inhibition, intervention prediction, cross-task lesson transfer and belief revision. Its defining property is that the causal graph is the answer key: graphs are generated deterministically, conversations are narrated from the graph, and every gold answer is derived from graph structure rather than hand annotation.",
  },
  {
    q: "Why not just use LoCoMo or LongMemEval?",
    a: "Those suites measure fact recall, which is mem0's strength and not where causal memory adds value. On LoCoMo causal-memory scores 79.1% against mem0's 91.6% — a real loss, reported here rather than hidden. CausalEval exists because C2, C4, C6 and C7 are invisible on a fact-recall suite; it is a complement, not a replacement.",
  },
  {
    q: "Is the mem0 comparison on this page fair?",
    a: "It is a like-for-like comparison on the 70-question protocol that both systems ran, not on the 140-question v13 set. The v13 column is causal-memory only. We report it that way instead of presenting 140q numbers next to 70q numbers as if they were the same experiment.",
  },
  {
    q: "How do I reproduce the results?",
    a: "The harness is a binary in the repository: causal-memory-causal-eval with generate, narrate and run subcommands. Generation is deterministic and seeded; narration and judging need an LLM API key. The exact commands are on this page, and the protocol document ships in the repository under docs/benchmarks.",
  },
  {
    q: "What is the biggest limitation?",
    a: "C6 lesson transfer: 20% against mem0's 30%. Cross-task analogy through meta edges is the weakest capability in the suite and it is not fixed. The second limitation is scale — 140 questions over 20 graphs is enough to separate the systems on most classes, but it is not a large-scale evaluation.",
  },
];

export default function CausalEvalPage() {
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Benchmarks", href: "/benchmarks" },
    { name: "CausalEval", href: PATH },
  ];

  return (
    <SeoShell
      kicker="BENCHMARK"
      title="CausalEval: the causal graph is the answer key"
      subtitle="Fact-recall suites cannot see inhibition, intervention or belief revision. CausalEval generates a typed causal graph, narrates conversations from it, and derives every gold answer from the graph."
      crumbs={crumbs}
      updatedAt={UPDATED_AT}
      related={["/compare", "/use-cases/on-call-agent", "/vs/mem0", "/use-cases"]}
      cta={{
        title: "Check the number, then check the protocol",
        body: "The harness ships with the repository. Generate the graphs, run the baseline, and compare the per-capability table with the one on this page.",
      }}
      jsonLd={[
        techArticleJsonLd({
          path: PATH,
          title: "CausalEval: a causal memory benchmark",
          description:
            "Protocol, per-capability results and limitations of the graph-grounded causal memory benchmark.",
          updatedAt: UPDATED_AT,
          keywords: ["CausalEval", "agent memory benchmark", "causal reasoning", "LLM memory", "evaluation"],
        }),
        datasetJsonLd({
          path: PATH,
          name: "CausalEval v13",
          description:
            "Graph-grounded causal memory benchmark: 140 capability-classified questions over 20 deterministically generated typed causal graphs, with graph-derived gold answers.",
          updatedAt: UPDATED_AT,
          version: CAUSALEVAL_PROTOCOL.version,
          measurementTechnique:
            "Deterministic typed-DAG generation, LLM narrativization with a verification pass, deterministic question generation, strict LLM judge",
        }),
        faqJsonLd(FAQ, PATH),
        breadcrumbJsonLd(crumbs),
      ]}
    >
      <Section title="Why a new benchmark">
        <Prose>
          <p>
            LoCoMo, LongMemEval and Memora ask whether a system can recall a fact from a long conversation. They are
            good at that, and mem0 leads them. None of them can ask whether a system knows that one action prevented
            another, or that a belief was superseded last week, because those questions have no fact-shaped answer.
          </p>
          <p>
            CausalEval starts from the opposite direction. A typed directed acyclic graph is generated first —
            nodes are people, actions and events, edges are caused, enabled or prevented. Conversations are then
            written from the graph, so the graph itself is the ground truth. There is no annotator judgement to
            disagree with and no ambiguity about which answer is correct.
          </p>
        </Prose>
      </Section>

      <Section title="Protocol" lead={`${CAUSALEVAL_PROTOCOL.version} · ${CAUSALEVAL_PROTOCOL.questions} questions over ${CAUSALEVAL_PROTOCOL.graphs} graphs · ${CAUSALEVAL_PROTOCOL.judge}`}>
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">CausalEval protocol parameters</caption>
            <tbody>
              {[
                ["Version", CAUSALEVAL_PROTOCOL.version],
                ["Questions", String(CAUSALEVAL_PROTOCOL.questions)],
                ["Graphs", String(CAUSALEVAL_PROTOCOL.graphs)],
                ["Baseline", CAUSALEVAL_PROTOCOL.baseline],
                ["Judge", CAUSALEVAL_PROTOCOL.judge],
                ["Gold answers", "Derived from graph structure — zero hand annotation"],
              ].map(([label, value]) => (
                <tr key={label} className="border-t border-[#e2e8f0] first:border-t-0">
                  <th scope="row" className="w-40 px-4 py-3 text-left font-medium text-[#0f172a]">
                    {label}
                  </th>
                  <td className="px-4 py-3 text-[#64748b]">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Seven capability classes">
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">CausalEval question classes</caption>
            <thead className="bg-[#f1f5f9] text-[#0f172a]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Class</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Question shape</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Gold source</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Capability</th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((row) => (
                <tr key={row.id} className="border-t border-[#e2e8f0]">
                  <th scope="row" className="px-4 py-3 text-left font-mono text-xs font-semibold text-[#0284c7]">
                    {row.id}
                  </th>
                  <td className="px-4 py-3 text-[#475569]">{row.question}</td>
                  <td className="px-4 py-3 text-[#64748b]">{row.gold}</td>
                  <td className="px-4 py-3 text-[#64748b]">{row.tool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Results"
        lead={`Source: ${EVIDENCE_SOURCE}, read ${EVIDENCE_DATE}. The baseline column is the mem0 run on the same 70-question protocol.`}
      >
        <EvidenceTable
          rows={CAUSALEVAL_ROWS}
          baselineLabel="mem0 (70q baseline)"
          caption="CausalEval v13 per-capability results"
          highlight="C7 Update"
        />
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#64748b]">{CAUSALEVAL_HEADLINE}</p>
      </Section>

      <Section title="The limitation we are not hiding">
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
          <h3 className="text-lg font-semibold text-[#0f172a]">C6 lesson transfer: 20% vs 30%</h3>
          <Prose>
            <p>
              C6 asks the system to carry a lesson from one task to an isomorphic situation in a different task
              category. It requires meta edges that connect patterns across sessions, and it is the one class where
              causal-memory loses to the fact-store baseline: 20% against 30%. Cross-task analogy is the weakest
              capability in the suite and it is not fixed.
            </p>
            <p>
              There are three smaller caveats. C1, C4 and C5 dipped relative to the v12 run; those dips are within
              re-distillation variance and new-graph difficulty, and v12 and v13 do not share a distilled corpus, so
              they should not be read as regressions. The suite is 140 questions over 20 graphs — enough to separate
              the systems on most classes, not a large-scale evaluation. And narration and judging both use an LLM,
              which adds variance that a deterministic harness would not have.
            </p>
          </Prose>
        </div>
      </Section>

      <Section
        title="Fact recall: the part where causal-memory loses"
        lead="CausalEval is not the whole story. On the traditional suites below, mem0 leads and this page reports it."
      >
        <EvidenceTable
          rows={FACT_RECALL_ROWS}
          baselineLabel="mem0 / baseline"
          caption="Fact-recall benchmarks for comparison"
        />
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#64748b]">
          LoCoMo 79.1% vs 91.6% is the cleanest loss: same suite, strict judge, mem0&apos;s home turf. Compaction
          survival (100% vs 45%) is the cleanest win, and it is a direct consequence of the design: the causal table
          lives outside the context window, so compaction cannot rewrite it.
        </p>
      </Section>

      <Section title="Reproduce it" lead="Generation is deterministic and seeded. Narration and judging call an LLM, so those steps need an API key.">
        <CodeBlock
          title="From the causal-memory repository"
          language="bash"
          code={`# 1. deterministic graphs + graph-derived questions
cargo run --release --bin causal-memory-causal-eval -- \\
  generate --graphs 20 --out eval-data

# 2. narrate each graph into multi-session dialogue (LLM)
cargo run --release --bin causal-memory-causal-eval -- \\
  narrate --data eval-data

# 3. ingest, retrieve and judge per capability
cargo run --release --bin causal-memory-causal-eval -- \\
  run --data eval-data`}
        />
        <p className="mt-4 text-sm leading-6 text-[#64748b]">
          The protocol document and the per-class question templates live in the repository under{" "}
          <code className="rounded bg-[#f8fafc] px-1.5 py-0.5 font-mono text-xs text-[#0f172a]">
            docs/benchmarks/causal-eval-2026.md
          </code>
          . If you run the mem0 baseline, use the 70-question protocol so the comparison is like-for-like.
        </p>
      </Section>

      <Section title="How to read these numbers">
        <Prose>
          <p>
            A benchmark is an argument, not a verdict. CausalEval is built to make one specific argument checkable:
            that typed causal structure is a different capability from fact recall, and that a memory system can be
            good at one and mediocre at the other. The per-capability columns exist so that a reader can disagree
            with the aggregate.
          </p>
        </Prose>
        <div className="mt-4">
          <Bullets
            items={[
              "Compare per class, not only the overall score — the overall average hides C6 and the C1/C4/C5 variance.",
              "Do not compare the 140q v13 column to a 70q baseline as if it were the same experiment.",
              "Treat the fact-recall table as the counter-argument; it is on the page for that reason.",
              "Reproduce before quoting: the harness and the protocol both ship with the repository.",
            ]}
          />
        </div>
        <p className="mt-5 text-sm">
          <Link href="/vs/mem0" className="font-medium text-[#0284c7] hover:underline">
            Read the mem0 comparison, including the LoCoMo loss →
          </Link>
        </p>
      </Section>

      <FaqSection faq={FAQ} title="CausalEval questions" />
    </SeoShell>
  );
}
