import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground",
  description: "Interactive visualizations of the causal-memory engine",
};

const demos = [
  {
    src: "/playground/algorithm-explorer.html",
    title: "Algorithm Explorer",
    desc: "图结构 / 查询传播 / Q值更新 — a guided walkthrough of the spreading-activation engine.",
  },
  {
    src: "/playground/architecture.html",
    title: "Architecture",
    desc: "The full system diagram: MCP tools → gatekeeping → RRF fusion → hippocampus engine → SQLite.",
  },
  {
    src: "/playground/dataflow-visualization.html",
    title: "Core Dataflow",
    desc: "核心数据流可视化 — how a write becomes a typed edge and how a query traverses the graph.",
  },
];

export default function Playground() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#e8f1ff]">Playground</h1>
      <p className="mt-2 text-[#93a7c4]">
        Interactive explorations of the engine — no install required.
      </p>
      <div className="mt-10 flex flex-col gap-12">
        {demos.map((d) => (
          <section key={d.src}>
            <h2 className="text-xl font-semibold text-[#e8f1ff]">{d.title}</h2>
            <p className="mt-1 text-sm text-[#93a7c4]">{d.desc}</p>
            <div className="mt-4 rounded-xl border border-[#1d3a5f] overflow-hidden bg-[#0e1930]">
              <iframe src={d.src} title={d.title} className="w-full h-[720px] border-0" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
