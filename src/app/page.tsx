import Link from "next/link";

const compaction = [
  { k: 1, text: "100%", causal: "100%" },
  { k: 2, text: "85%", causal: "100%" },
  { k: 3, text: "55%", causal: "100%" },
  { k: 5, text: "45%", causal: "100%" },
];

const matrix: [string, boolean, boolean, boolean, boolean][] = [
  ["Typed causal semantics (caused/enabled/prevented)", true, false, false, false],
  ["prevented negative spread (inhibitory)", true, false, false, false],
  ["Forward simulation (intervention_query)", true, false, false, false],
  ["SWR offline consolidation (LTP/LTD/GC)", true, false, false, false],
  ["Q-value dynamic utility", true, false, false, false],
  ["Immutable consolidation (delta + clone)", true, false, false, false],
  ["Meta-edge cross-session pattern mining", true, false, false, false],
  ["Compaction survival evidence", true, false, false, false],
  ["One graph unifying all memory types", true, false, true, false],
  ["Local ONNX embedding (offline)", true, true, false, false],
];

const evalRows: [string, string, string, string][] = [
  ["C7 Update", "100%", "80%", "Supersede old belief after falsification"],
  ["C3 Counterfactual", "95%", "80%", "Choosing between alternatives with known outcomes"],
  ["C2 Intervention", "75%", "40%", 'Forward prediction: "if X again, what happens?"'],
  ["C4 Inhibition", "80%", "50%", "Root-cause fix vs blast-radius limiter"],
  ["C1 Attribution", "85%", "90%", "Backward causal chain → root cause"],
  ["C5 Temporal-causal", "90%", "90%", "Ordering on a causal chain"],
  ["Overall", "78%", "65%", "CausalEval v13 · 140 questions, 20 graphs"],
];

const Check = () => <span className="text-[#34d399]">✅</span>;
const Cross = () => <span className="text-[#f87171]">❌</span>;

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-sm font-mono text-[#4cc2ff] mb-4">Apache-2.0 · Rust + SQLite · MCP</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#e8f1ff] leading-tight">
          Agent memory with a causal core.
          <br />
          <span className="text-[#4cc2ff]">The only one that models inhibition.</span>
        </h1>
        <p className="mt-6 text-lg text-[#93a7c4] max-w-2xl mx-auto">
          Facts, temporal state, and <code className="text-[#a5e3ff]">decision → outcome</code> causal edges on one
          SQLite store. Agents recall <em>what</em> happened, <em>when</em> it was true, <em>why</em> it worked — and{" "}
          <em>what would happen if</em> they acted differently.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/docs/getting-started"
            className="rounded-md bg-[#4cc2ff] px-5 py-2.5 font-semibold text-[#0b1220] hover:bg-[#6fd0ff] transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-[#2b4f7c] px-5 py-2.5 font-semibold text-[#e8f1ff] hover:bg-[#101f3a] transition-colors"
          >
            Try the cloud
          </Link>
        </div>
        <div className="mt-12 mx-auto max-w-3xl rounded-xl border border-[#1d3a5f] overflow-hidden bg-[#0e1930]">
          <video
            src="/demo/causal-memory-danger-30s.mp4"
            poster="/demo/demo30_danger.png"
            autoPlay
            muted
            loop
            playsInline
            className="w-full"
          />
          <p className="text-xs text-[#5a719c] py-2">
            30s demo — the agent is about to `git push --no-verify`; intervention_query fires a DANGER chain
          </p>
        </div>
      </section>

      {/* Compaction survival */}
      <section className="border-t border-[#1d3a5f] bg-[#0e1930]/50">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#e8f1ff]">Memory that compaction cannot touch</h2>
            <p className="mt-4 text-[#93a7c4]">
              Causal information is the most fragile type under text compaction. In a real-LLM benchmark with a
              production compaction prompt, textual recall collapses — while the causal table, living{" "}
              <strong className="text-[#e8f1ff]">outside the context window</strong>, never degrades.
            </p>
          </div>
          <div className="rounded-xl border border-[#1d3a5f] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#101f3a] text-[#e8f1ff]">
                <tr>
                  <th className="px-4 py-3 text-left">Compactions (k)</th>
                  <th className="px-4 py-3 text-left">Textual recall</th>
                  <th className="px-4 py-3 text-left">Causal-table recall</th>
                </tr>
              </thead>
              <tbody>
                {compaction.map((r) => (
                  <tr key={r.k} className="border-t border-[#1d3a5f]">
                    <td className="px-4 py-2.5">{r.k}</td>
                    <td className={`px-4 py-2.5 ${r.k >= 3 ? "text-[#f87171] font-semibold" : ""}`}>{r.text}</td>
                    <td className="px-4 py-2.5 text-[#34d399] font-semibold">{r.causal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Capability matrix */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#e8f1ff] text-center">What makes it different</h2>
        <p className="mt-3 text-center text-[#93a7c4]">
          Capabilities no fact store can offer — verified by 322 workspace tests.
        </p>
        <div className="mt-8 rounded-xl border border-[#1d3a5f] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[#101f3a] text-[#e8f1ff]">
              <tr>
                <th className="px-4 py-3 text-left">Capability</th>
                <th className="px-4 py-3 text-center text-[#4cc2ff]">causal-memory</th>
                <th className="px-4 py-3 text-center">mem0</th>
                <th className="px-4 py-3 text-center">Zep</th>
                <th className="px-4 py-3 text-center">Letta</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map(([cap, cm, m0, zep, letta]) => (
                <tr key={cap} className="border-t border-[#1d3a5f]">
                  <td className="px-4 py-2.5">{cap}</td>
                  <td className="px-4 py-2.5 text-center">{cm ? <Check /> : <Cross />}</td>
                  <td className="px-4 py-2.5 text-center">{m0 ? <Check /> : <Cross />}</td>
                  <td className="px-4 py-2.5 text-center">{zep ? <Check /> : <Cross />}</td>
                  <td className="px-4 py-2.5 text-center">{letta ? <Check /> : <Cross />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CausalEval */}
      <section className="border-t border-[#1d3a5f] bg-[#0e1930]/50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-[#e8f1ff] text-center">Measured on what matters</h2>
          <p className="mt-3 text-center text-[#93a7c4]">
            CausalEval — the graph-grounded causal memory benchmark. The causal graph is the answer key.
          </p>
          <div className="mt-8 rounded-xl border border-[#1d3a5f] overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[#101f3a] text-[#e8f1ff]">
                <tr>
                  <th className="px-4 py-3 text-left">Capability</th>
                  <th className="px-4 py-3 text-center text-[#4cc2ff]">causal-memory</th>
                  <th className="px-4 py-3 text-center">mem0</th>
                  <th className="px-4 py-3 text-left">What it tests</th>
                </tr>
              </thead>
              <tbody>
                {evalRows.map(([cap, cm, m0, what]) => (
                  <tr key={cap} className="border-t border-[#1d3a5f]">
                    <td className="px-4 py-2.5 font-medium">{cap}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-[#34d399]">{cm}</td>
                    <td className="px-4 py-2.5 text-center">{m0}</td>
                    <td className="px-4 py-2.5 text-[#93a7c4]">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center">
            <Link href="/benchmarks" className="text-[#4cc2ff] hover:underline">
              Full benchmark report →
            </Link>
          </p>
        </div>
      </section>

      {/* Quickstart */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#e8f1ff] text-center">Three steps to memory that survives</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              n: "1",
              title: "Install",
              code: "pip install causal-memory",
              note: "or cargo build --release from source",
            },
            {
              n: "2",
              title: "Wire MCP",
              code: '{ "mcpServers": { "causal-memory":\n  { "command": "causal-memory" } } }',
              note: "Claude Code, Cursor, Kimi Code CLI, …",
            },
            {
              n: "3",
              title: "Add the skill",
              code: "npx skills add JingxuanC/causal-memory@causal-memory",
              note: "teaches the agent when to remember",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-[#1d3a5f] bg-[#0e1930] p-6">
              <p className="text-[#4cc2ff] font-mono text-sm">step {s.n}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#e8f1ff]">{s.title}</h3>
              <pre className="mt-3 text-xs bg-[#0b1220] border border-[#1d3a5f] rounded-md p-3 overflow-x-auto text-[#a5e3ff]">
                {s.code}
              </pre>
              <p className="mt-2 text-xs text-[#5a719c]">{s.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/docs/getting-started" className="text-[#4cc2ff] hover:underline">
            Read the full guide →
          </Link>
        </p>
      </section>
    </div>
  );
}
