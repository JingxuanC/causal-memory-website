import type { Metadata } from "next";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Benchmarks",
  description: "CausalEval and fact-recall benchmark results for causal-memory",
};

const causalEval: [string, string, string, string, string][] = [
  ["C7 Update", "100%", "80%", "Supersede old belief after falsification (soft superseded_by annotation)", "证伪后替代旧认知（软 superseded_by 标注）"],
  ["C3 Counterfactual", "95%", "80%", "Choosing between alternatives with known outcomes", "在已知后果的选项间做选择"],
  ["C2 Intervention", "75%", "40%", 'Forward prediction: "if X again, what happens?"', "前向预测：「再做一次 X 会怎样」"],
  ["C4 Inhibition", "80%", "50%", "Root-cause fix vs blast-radius limiter (prevented edges)", "区分根因修复与影响面限制（prevented 边）"],
  ["C1 Attribution", "85%", "90%", "Backward causal chain → root cause", "反向因果链归因到根因"],
  ["C5 Temporal-causal", "90%", "90%", "Ordering on a causal chain", "因果链上的时序排序"],
  ["C6 Lesson transfer", "20%", "30%", "Cross-task analogy via meta edges (open limitation)", "经 meta 边跨任务类比（已知短板）"],
  ["Overall", "78%", "65%", "CausalEval v13 · 140 questions, 20 graphs, same LLM, same judge", "CausalEval v13 · 140 题、20 张图，同模型同评审"],
];

const factRecall: [string, string, string, string, string][] = [
  ["LoCoMo (strict judge)", "79.1%", "91.6%", "mem0's home turf", "mem0 的主场"],
  ["LongMemEval-S", "76.4% @ 11.5K tok/q", "94.4% (official)", "single-model stack vs platform stack", "单模型栈 vs 平台级栈"],
  ["Memora MPA", "67.4%", "71.8%", "−4.4pp", "−4.4pp"],
  ["Compaction survival", "100%", "45%", "External table = immune to compaction", "外部表 = 对压缩免疫"],
  ["Agent repeat-mistake", "33%", "67%", "−34pp on trap-world", "trap-world 上 −34pp"],
];

const capabilities: [string, string, string][] = [
  ["Prevented-edge warning", "prevented edge spreads −0.3 activation (GABA analogue)", "prevented 边扩散 −0.3 激活（GABA 类似物）"],
  ["Trace-cause attribution", "Backward CSR traversal finds root cause", "反向 CSR 遍历定位根因"],
  ["Multi-hop causal chain", "Forward K-hop spreading reaches 2–3 hop outcomes", "前向 K 跳扩散可达 2–3 跳结果"],
  ["Inhibitory filtering", "Prevented outcomes appear as negative, not false positives", "被阻止的结果呈负向，而非假阳性"],
  ["Intervention comparison", 'Same outcome: +0.9 for "skip tests", −0.3 for "add tests"', "同一结果：「跳过测试」+0.9 vs 「补充测试」−0.3"],
  ["SWR consolidation", "LTP strengthens replayed edges, LTD weakens unvisited, GC forgets dormant", "LTP 强化重放边，LTD 弱化未访问边，GC 遗忘休眠边"],
  ["Q-value dynamics", "Good decisions rank higher; Bellman propagates to parents", "好决策排名上升；Bellman 回传到父节点"],
  ["Novelty entropy", "Diverse experience triggers consolidation; uniform does not", "多样经验触发固化；单一经验不触发"],
  ["Meta-edge mining", "Cross-session pattern discovery (similar_to / repeated)", "跨会话模式发现（similar_to / repeated）"],
  ["Hebbian co-occurrence", "Repeated co-activation strengthens connection", "重复共激活强化连接"],
];

function Table({ head, rows, centers }: { head: string[]; rows: string[][]; centers?: number[] }) {
  const centerSet = new Set(centers ?? []);
  return (
    <div className="rounded-xl border border-[#1d3a5f] overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
        <thead className="bg-[#101f3a] text-[#e8f1ff]">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 ${centerSet.has(i) ? "text-center" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-[#1d3a5f]">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-4 py-2.5 ${
                    centerSet.has(i)
                      ? `text-center ${i === 1 ? "font-semibold text-[#34d399]" : ""}`
                      : i === 0
                        ? "font-medium"
                        : "text-[#93a7c4]"
                  }`}
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

export default async function Benchmarks() {
  const lang = await getLang();
  const d = t(lang);
  const zh = lang === "zh";
  const pick = (r: [string, string, string, string, string]) => [r[0], r[1], r[2], zh ? r[4] : r[3]];

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#e8f1ff]">{d.benchTitle}</h1>
      <p className="mt-2 text-[#93a7c4]">
        {d.benchSub1}{" "}
        <a href="https://github.com/JingxuanC/causal-memory/tree/main/benches" className="text-[#4cc2ff] hover:underline">
          benches/
        </a>{" "}
        {d.benchSub2}{" "}
        <a
          href="https://github.com/JingxuanC/causal-memory/tree/main/docs/benchmarks"
          className="text-[#4cc2ff] hover:underline"
        >
          docs/benchmarks
        </a>
        .
      </p>

      <h2 className="mt-12 text-2xl font-bold text-[#e8f1ff]">{d.benchCausalTitle}</h2>
      <p className="mt-2 text-sm text-[#93a7c4]">{d.benchCausalSub}</p>
      <div className="mt-4">
        <Table
          head={[d.capability, "causal-memory", "mem0", d.whatItTests]}
          rows={causalEval.map(pick)}
          centers={[1, 2]}
        />
      </div>

      <h2 className="mt-12 text-2xl font-bold text-[#e8f1ff]">{d.benchFactTitle}</h2>
      <p className="mt-2 text-sm text-[#93a7c4]">{d.benchFactSub}</p>
      <div className="mt-4">
        <Table
          head={[d.benchmark, "causal-memory", "mem0", d.note]}
          rows={factRecall.map(pick)}
          centers={[1, 2]}
        />
      </div>

      <h2 className="mt-12 text-2xl font-bold text-[#e8f1ff]">{d.benchCapTitle}</h2>
      <p className="mt-2 text-sm text-[#93a7c4]">{d.benchCapSub}</p>
      <div className="mt-4">
        <Table
          head={[d.capability, d.whatItProves]}
          rows={capabilities.map((r) => [r[0], zh ? r[2] : r[1]])}
        />
      </div>
    </div>
  );
}
