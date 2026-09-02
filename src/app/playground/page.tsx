import type { Metadata } from "next";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Playground",
  description: "Interactive visualizations of the causal-memory engine",
};

const demos = [
  {
    src: "/playground/algorithm-explorer.html",
    title: "Algorithm Explorer",
    descEn: "图结构 / 查询传播 / Q值更新 — a guided walkthrough of the spreading-activation engine.",
    descZh: "图结构 / 查询传播 / Q值更新——扩散激活引擎的交互式漫游。",
  },
  {
    src: "/playground/architecture.html",
    title: "Architecture",
    descEn: "The full system diagram: MCP tools → gatekeeping → RRF fusion → hippocampus engine → SQLite.",
    descZh: "系统全景图：MCP 工具 → 写入门控 → RRF 融合 → 海马体引擎 → SQLite。",
  },
  {
    src: "/playground/dataflow-visualization.html",
    title: "Core Dataflow",
    descEn: "核心数据流可视化 — how a write becomes a typed edge and how a query traverses the graph.",
    descZh: "核心数据流可视化——一次写入如何成为类型化边、一次查询如何遍历全图。",
  },
];

export default async function Playground() {
  const lang = await getLang();
  const d = t(lang);
  const zh = lang === "zh";

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0f172a]">{d.playgroundTitle}</h1>
      <p className="mt-2 text-[#64748b]">{d.playgroundSub}</p>
      <div className="mt-10 flex flex-col gap-12">
        {demos.map((demo) => (
          <section key={demo.src}>
            <h2 className="text-xl font-semibold text-[#0f172a]">{demo.title}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{zh ? demo.descZh : demo.descEn}</p>
            <div className="mt-4 rounded-xl border border-[#e2e8f0] overflow-hidden bg-[#f8fafc]">
              <iframe src={demo.src} title={demo.title} className="w-full h-[720px] border-0" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
