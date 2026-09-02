import Link from "next/link";
import { getLang, t } from "@/lib/i18n";

const compaction = [
  { k: 1, text: "100%", causal: "100%" },
  { k: 2, text: "85%", causal: "100%" },
  { k: 3, text: "55%", causal: "100%" },
  { k: 5, text: "45%", causal: "100%" },
];

const matrix: [string, string, boolean, boolean, boolean, boolean][] = [
  ["Typed causal semantics (caused/enabled/prevented)", "类型化因果语义（caused/enabled/prevented）", true, false, false, false],
  ["prevented negative spread (inhibitory)", "prevented 负向扩散（抑制性）", true, false, false, false],
  ["Forward simulation (intervention_query)", "前向模拟（intervention_query）", true, false, false, false],
  ["SWR offline consolidation (LTP/LTD/GC)", "SWR 离线固化（LTP/LTD/GC）", true, false, false, false],
  ["Q-value dynamic utility", "Q-value 动态效用", true, false, false, false],
  ["Immutable consolidation (delta + clone)", "不可变固化（delta + clone）", true, false, false, false],
  ["Meta-edge cross-session pattern mining", "跨会话 meta 边模式挖掘", true, false, false, false],
  ["Compaction survival evidence", "压缩存活证据", true, false, false, false],
  ["One graph unifying all memory types", "一张图统一所有记忆类型", true, false, true, false],
  ["Local ONNX embedding (offline)", "本地 ONNX embedding（离线）", true, true, false, false],
];

const evalRows: [string, string, string, string, string][] = [
  ["C7 Update", "100%", "80%", "Supersede old belief after falsification", "旧认知被证伪后的更新替代"],
  ["C3 Counterfactual", "95%", "80%", "Choosing between alternatives with known outcomes", "在已知后果的选项间做选择"],
  ["C2 Intervention", "75%", "40%", 'Forward prediction: "if X again, what happens?"', "前向预测：「再做一次 X 会怎样」"],
  ["C4 Inhibition", "80%", "50%", "Root-cause fix vs blast-radius limiter", "区分根因修复与影响面限制"],
  ["C1 Attribution", "85%", "90%", "Backward causal chain → root cause", "反向因果链归因到根因"],
  ["C5 Temporal-causal", "90%", "90%", "Ordering on a causal chain", "因果链上的时序排序"],
  ["Overall", "78%", "65%", "CausalEval v13 · 140 questions, 20 graphs", "CausalEval v13 · 140 题、20 张图"],
];

const Check = () => <span className="text-[#34d399]">✅</span>;
const Cross = () => <span className="text-[#f87171]">❌</span>;

export default async function Home() {
  const lang = await getLang();
  const d = t(lang);
  const zh = lang === "zh";

  const steps = [
    {
      n: "1",
      title: zh ? "安装" : "Install",
      code: "pip install causal-memory",
      note: zh ? "或从源码 cargo build --release" : "or cargo build --release from source",
    },
    {
      n: "2",
      title: zh ? "接入 MCP" : "Wire MCP",
      code: '{ "mcpServers": { "causal-memory":\n  { "command": "causal-memory" } } }',
      note: "Claude Code, Cursor, Kimi Code CLI, …",
    },
    {
      n: "3",
      title: zh ? "安装 skill" : "Add the skill",
      code: "npx skills add JingxuanC/causal-memory@causal-memory",
      note: zh ? "教会 agent 何时调用记忆" : "teaches the agent when to remember",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-sm font-mono text-[#4cc2ff] mb-4">{d.heroKicker}</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#e8f1ff] leading-tight">
          {d.heroTitleA}
          <br />
          <span className="text-[#4cc2ff]">{d.heroTitleB}</span>
        </h1>
        <p className="mt-6 text-lg text-[#93a7c4] max-w-2xl mx-auto">{d.heroSub}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/docs/getting-started"
            className="rounded-md bg-[#4cc2ff] px-5 py-2.5 font-semibold text-[#0b1220] hover:bg-[#6fd0ff] transition-colors"
          >
            {d.getStarted}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-[#2b4f7c] px-5 py-2.5 font-semibold text-[#e8f1ff] hover:bg-[#101f3a] transition-colors"
          >
            {d.tryCloud}
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
          <p className="text-xs text-[#5a719c] py-2">{d.demoCaption}</p>
        </div>
      </section>

      {/* Compaction survival */}
      <section className="border-t border-[#1d3a5f] bg-[#0e1930]/50">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#e8f1ff]">{d.compactionTitle}</h2>
            <p className="mt-4 text-[#93a7c4]">{d.compactionBody}</p>
          </div>
          <div className="rounded-xl border border-[#1d3a5f] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#101f3a] text-[#e8f1ff]">
                <tr>
                  <th className="px-4 py-3 text-left">{d.compactionK}</th>
                  <th className="px-4 py-3 text-left">{d.compactionText}</th>
                  <th className="px-4 py-3 text-left">{d.compactionCausal}</th>
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
        <h2 className="text-3xl font-bold text-[#e8f1ff] text-center">{d.matrixTitle}</h2>
        <p className="mt-3 text-center text-[#93a7c4]">{d.matrixSub}</p>
        <div className="mt-8 rounded-xl border border-[#1d3a5f] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[#101f3a] text-[#e8f1ff]">
              <tr>
                <th className="px-4 py-3 text-left">{d.capability}</th>
                <th className="px-4 py-3 text-center text-[#4cc2ff]">causal-memory</th>
                <th className="px-4 py-3 text-center">mem0</th>
                <th className="px-4 py-3 text-center">Zep</th>
                <th className="px-4 py-3 text-center">Letta</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map(([en, zhText, cm, m0, zep, letta]) => (
                <tr key={en} className="border-t border-[#1d3a5f]">
                  <td className="px-4 py-2.5">{zh ? zhText : en}</td>
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
          <h2 className="text-3xl font-bold text-[#e8f1ff] text-center">{d.evalTitle}</h2>
          <p className="mt-3 text-center text-[#93a7c4]">{d.evalSub}</p>
          <div className="mt-8 rounded-xl border border-[#1d3a5f] overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[#101f3a] text-[#e8f1ff]">
                <tr>
                  <th className="px-4 py-3 text-left">{d.capability}</th>
                  <th className="px-4 py-3 text-center text-[#4cc2ff]">causal-memory</th>
                  <th className="px-4 py-3 text-center">mem0</th>
                  <th className="px-4 py-3 text-left">{d.whatItTests}</th>
                </tr>
              </thead>
              <tbody>
                {evalRows.map(([cap, cm, m0, what, whatZh]) => (
                  <tr key={cap} className="border-t border-[#1d3a5f]">
                    <td className="px-4 py-2.5 font-medium">{cap}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-[#34d399]">{cm}</td>
                    <td className="px-4 py-2.5 text-center">{m0}</td>
                    <td className="px-4 py-2.5 text-[#93a7c4]">{zh ? whatZh : what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center">
            <Link href="/benchmarks" className="text-[#4cc2ff] hover:underline">
              {d.fullReport}
            </Link>
          </p>
        </div>
      </section>

      {/* Quickstart */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#e8f1ff] text-center">{d.quickTitle}</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-[#1d3a5f] bg-[#0e1930] p-6">
              <p className="text-[#4cc2ff] font-mono text-sm">{d.step} {s.n}{zh ? " 步" : ""}</p>
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
            {d.readGuide}
          </Link>
        </p>
      </section>
    </div>
  );
}
