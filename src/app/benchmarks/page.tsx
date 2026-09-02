import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Benchmarks",
  description: "CausalEval and fact-recall benchmark results for causal-memory",
};

const causalEval: [string, string, string, string][] = [
  ["C7 Update", "100%", "80%", "Supersede old belief after falsification (soft superseded_by annotation)"],
  ["C3 Counterfactual", "95%", "80%", "Choosing between alternatives with known outcomes"],
  ["C2 Intervention", "75%", "40%", 'Forward prediction: "if X again, what happens?"'],
  ["C4 Inhibition", "80%", "50%", "Root-cause fix vs blast-radius limiter (prevented edges)"],
  ["C1 Attribution", "85%", "90%", "Backward causal chain → root cause"],
  ["C5 Temporal-causal", "90%", "90%", "Ordering on a causal chain"],
  ["C6 Lesson transfer", "20%", "30%", "Cross-task analogy via meta edges (open limitation)"],
  ["Overall", "78%", "65%", "CausalEval v13 · 140 questions, 20 graphs, same LLM, same judge"],
];

const factRecall: [string, string, string, string][] = [
  ["LoCoMo (strict judge)", "79.1%", "91.6%", "mem0's home turf"],
  ["LongMemEval-S", "76.4% @ 11.5K tok/q", "94.4% (official)", "single-model stack vs platform stack"],
  ["Memora MPA", "67.4%", "71.8%", "−4.4pp"],
  ["Compaction survival", "100%", "45%", "External table = immune to compaction"],
  ["Agent repeat-mistake", "33%", "67%", "−34pp on trap-world"],
];

const capabilities: [string, string][] = [
  ["Prevented-edge warning", "prevented edge spreads −0.3 activation (GABA analogue)"],
  ["Trace-cause attribution", "Backward CSR traversal finds root cause"],
  ["Multi-hop causal chain", "Forward K-hop spreading reaches 2–3 hop outcomes"],
  ["Inhibitory filtering", "Prevented outcomes appear as negative, not false positives"],
  ["Intervention comparison", 'Same outcome: +0.9 for "skip tests", −0.3 for "add tests"'],
  ["SWR consolidation", "LTP strengthens replayed edges, LTD weakens unvisited, GC forgets dormant"],
  ["Q-value dynamics", "Good decisions rank higher; Bellman propagates to parents"],
  ["Novelty entropy", "Diverse experience triggers consolidation; uniform does not"],
  ["Meta-edge mining", "Cross-session pattern discovery (similar_to / repeated)"],
  ["Hebbian co-occurrence", "Repeated co-activation strengthens connection"],
];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-[#1d3a5f] overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
        <thead className="bg-[#101f3a] text-[#e8f1ff]">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 ${i === 0 ? "text-left" : i >= 3 ? "text-left" : "text-center"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-[#1d3a5f]">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-4 py-2.5 ${i === 0 ? "font-medium" : i === 1 ? "text-center font-semibold text-[#34d399]" : i === 2 ? "text-center" : "text-[#93a7c4]"}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Benchmarks() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#e8f1ff]">Benchmarks</h1>
      <p className="mt-2 text-[#93a7c4]">
        All results reproducible from the{" "}
        <a href="https://github.com/JingxuanC/causal-memory/tree/main/benches" className="text-[#4cc2ff] hover:underline">
          benches/
        </a>{" "}
        directory. Protocol details in{" "}
        <a
          href="https://github.com/JingxuanC/causal-memory/tree/main/docs/benchmarks"
          className="text-[#4cc2ff] hover:underline"
        >
          docs/benchmarks
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl font-bold text-[#e8f1ff]">CausalEval — the causal memory benchmark</h2>
      <p className="mt-2 text-sm text-[#93a7c4]">
        Typed DAGs are generated deterministically; conversations are narrated from the graph; gold answers are derived
        from graph structure — zero hand annotation, zero ambiguity.
      </p>
      <div className="mt-4">
        <Table head={["Capability", "causal-memory", "mem0", "What it tests"]} rows={causalEval} />
      </div>

      <h2 className="mt-12 text-2xl font-bold text-[#e8f1ff]">Fact-recall benchmarks</h2>
      <p className="mt-2 text-sm text-[#93a7c4]">
        On traditional fact-recall suites causal-memory is competitive but does not beat mem0 — fact recall is mem0's
        specialty, not where causal-memory adds value.
      </p>
      <div className="mt-4">
        <Table head={["Benchmark", "causal-memory", "mem0", "Note"]} rows={factRecall} />
      </div>

      <h2 className="mt-12 text-2xl font-bold text-[#e8f1ff]">Capability tests</h2>
      <p className="mt-2 text-sm text-[#93a7c4]">
        322 workspace tests covering capabilities no fact store (mem0, Zep, Letta) offers.
      </p>
      <div className="mt-4">
        <Table head={["Capability", "What it proves"]} rows={capabilities} />
      </div>
    </div>
  );
}
