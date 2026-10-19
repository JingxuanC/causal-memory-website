import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { AlphaDeskClient } from "@/components/alpha-desk-client";

export const metadata: Metadata = {
  title: "Alpha Desk — 金融 Bots 研究团队",
  description:
    "Alpha Desk is a prebuilt DeepSeek Harness profile for A-share research: 4 finance Bots, 35 skills, market panel, and 6 report types. Download Free, apply for Pro.",
};

const FEATURES = {
  zh: [
    ["4 个金融 Bot", "数据官 / 事件官 / 复盘官 / 研究官，各司其职，可以互相派活。"],
    ["35 个技能", "从个股速览、财报点评到行业对比、深度研究，都是可复用的工作流。"],
    ["行情中心 + 仪表盘", "K 线、指标、龙虎榜、资金流、自选组合，和对话放在同一个工作台。"],
    ["6 种报告", "技术对比、事件点评、个股速览、财报点评、行业对比、深度个股；每份都带独立复核。"],
    ["数据适配器", "默认 astock/global；也可以接自己的 iFinD / Wind / Tushare MCP。"],
    ["本地优先", "license 离线验签，研究数据默认不离开本机；云端服务按需开通。"],
  ],
  en: [
    ["4 finance Bots", "Data, events, review and research — each with a job, able to delegate to each other."],
    ["35 skills", "Reusable workflows from a quick stock snapshot to earnings, industry and deep research."],
    ["Market panel + dashboard", "Candles, indicators, dragon-tiger, fund flow and watchlists beside the conversation."],
    ["6 report types", "Technical compare, event study, snapshot, earnings, industry and deep stock — each independently verified."],
    ["Data adapter", "Bundled astock/global; connect your own iFinD / Wind / Tushare MCP when you have one."],
    ["Local-first", "Offline license verification; research data stays on your machine unless you opt into cloud."],
  ],
} as const;

export default async function AlphaDeskPage() {
  const lang = await getLang();
  const zh = lang === "zh";
  const features = FEATURES[zh ? "zh" : "en"];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#0284c7] px-3 py-0.5 text-xs font-semibold text-[#0284c7]">
            Alpha Desk
          </span>
          <span className="text-xs text-[#94a3b8]">0.1.13-dev · developer preview</span>
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-[#0f172a]">
          {zh ? "把 A 股研究，交给一个金融 Bot 团队" : "A-share research, run by a team of finance Bots"}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[#475569]">
          {zh
            ? "Alpha Desk 是预配置好的 DeepSeek Harness：装上就有 4 个金融 Bot、35 个技能、行情中心和 6 种研究报告。免费版可以直接用，Pro 再加云端因子、Kronos 和记忆。"
            : "Alpha Desk is a preconfigured DeepSeek Harness: four finance Bots, 35 skills, a market panel and six research reports. Start free; Pro adds cloud factors, Kronos and memory."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/alpha-desk#download" className="rounded-lg bg-[#0284c7] px-4 py-2 font-semibold text-white hover:bg-[#0369a1]">
            {zh ? "免费下载" : "Download free"}
          </Link>
          <Link href="/alpha-desk#apply" className="rounded-lg border border-[#cbd5e1] px-4 py-2 font-medium text-[#0f172a] hover:bg-[#f1f5f9]">
            {zh ? "申请 Pro" : "Apply for Pro"}
          </Link>
          <a href="/pricing" className="rounded-lg px-4 py-2 text-[#0284c7] hover:underline">
            {zh ? "看定价" : "Pricing"}
          </a>
        </div>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([title, body]) => (
          <div key={title} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
            <p className="mt-1.5 text-sm text-[#64748b]">{body}</p>
          </div>
        ))}
      </section>

      <section id="download" className="scroll-mt-20">
        <AlphaDeskClient lang={lang} />
      </section>

      <section id="compliance" className="mt-10 scroll-mt-20 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 text-sm text-[#475569]">
        <h2 className="text-base font-semibold text-[#0f172a]">
          {zh ? "合规与边界" : "Compliance and scope"}
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          {(zh
            ? [
                "Alpha Desk 是研究工具，不构成投资建议，不提供买卖点、目标价或收益承诺。",
                "Pro 云端服务按 license 开通；Kronos、因子挖掘等功能仅面向符合条件的用户。",
                "默认数据来自公开行情源；接入 iFinD / Wind / Tushare 需要你自己拥有相应授权。",
                "license 离线验签，无法远程吊销；请像密码一样保管。",
              ]
            : [
                "Alpha Desk is a research tool, not investment advice. It does not provide buy/sell calls, targets or return promises.",
                "Pro cloud services are enabled by license; Kronos and factor mining are limited to eligible users.",
                "Default data comes from public sources. Connecting iFinD / Wind / Tushare requires your own entitlement.",
                "Licenses are verified offline and cannot be revoked remotely — treat one like a password.",
              ]
          ).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
