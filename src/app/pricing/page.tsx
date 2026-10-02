import Link from "next/link";
import type { Metadata } from "next";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Pricing" };

type Tier = {
  name: string;
  price: [string, string];
  tagline: [string, string];
  features: [string, string][];
  cta: { href: string; label: [string, string]; primary: boolean };
  badge?: [string, string];
};

const tiers: Tier[] = [
  {
    name: "Community",
    price: ["Free", "免费"],
    tagline: ["The full engine, open source", "完整引擎，开源免费"],
    features: [
      ["Apache-2.0, all 17 MCP tools", "Apache-2.0，全部 17 个 MCP 工具"],
      ["SQLite local store — your data never leaves your machine", "SQLite 本地存储——数据不离开你的机器"],
      ["Local ONNX embeddings (fully offline)", "本地 ONNX embedding（完全离线）"],
      ["HTTP transport for your own infra", "HTTP transport，可自建基础设施"],
      ["Community support via GitHub", "GitHub 社区支持"],
    ],
    cta: { href: "/docs/getting-started", label: ["Get started", "快速上手"], primary: false },
  },
  {
    name: "Cloud Free",
    price: ["$0", "$0"],
    tagline: ["Bring your own LLM key — unlimited writes", "自带 LLM key（BYOK）——写事件不限量"],
    features: [
      ["Unlimited write events with your own LLM key (BYOK)", "自带 key 时写事件不限量"],
      ["5k query events / month", "5k 查事件/月"],
      ["100 MB storage, 1 project", "100MB 存储，1 个项目"],
      ["git-sync cloud backup", "git-sync 云备份"],
      ["Community support", "社区支持"],
    ],
    cta: { href: "/dashboard", label: ["Get started", "立即开始"], primary: false },
  },
  {
    name: "Cloud Pro",
    price: ["$19/mo", "$19/月"],
    tagline: ["Platform LLM included, for daily drivers", "平台出 LLM key，日常主力之选"],
    badge: ["Most popular", "最受欢迎"],
    features: [
      ["Platform-provided LLM key included", "平台提供 LLM key"],
      ["50k write + 50k query events / month", "50k 写 + 50k 查事件/月"],
      ["Overage $2 / $1 per 10k events", "超出部分 $2/$1 每 10k 事件"],
      ["10 projects, 2 GB storage", "10 个项目，2GB 存储"],
      ["session commit / restore", "session commit / restore"],
      ["Weekly drift report", "drift 漂移周报"],
    ],
    cta: { href: "/dashboard", label: ["Early access", "抢先体验"], primary: true },
  },
  {
    name: "Cloud Team",
    price: ["$79/mo", "$79/月"],
    tagline: ["Shared memory for your agent team (5 seats)", "团队共享记忆（5 席）"],
    features: [
      ["200k write + 250k query events / month", "200k 写 + 250k 查事件/月"],
      ["Unlimited projects, 10 GB storage", "不限项目，10GB 存储"],
      ["Team shared memory (managed export/import)", "团队共享记忆（托管 export/import）"],
      ["Daily drift report + alerts", "drift 日报 + 告警"],
      ["Priority support", "优先支持"],
    ],
    cta: { href: "/dashboard", label: ["Early access", "抢先体验"], primary: false },
  },
  {
    name: "Enterprise",
    price: ["Contact us", "联系我们"],
    tagline: ["For teams with serious agents", "面向重度使用 agent 的团队"],
    features: [
      ["SSO, audit logs, compliance exports", "SSO、审计日志、合规导出"],
      ["Air-gapped private deployment", "air-gapped 私有化部署"],
      ["SLA (L2)", "SLA（L2）"],
      ["Platform LLM, BYOK, or private models", "平台 key、BYOK 或私有模型"],
      ["Dedicated support", "专属支持"],
    ],
    cta: { href: "https://github.com/JingxuanC/causal-memory/issues", label: ["Talk to us", "联系我们"], primary: false },
  },
];

export default async function Pricing() {
  const lang = await getLang();
  const d = t(lang);
  const li = lang === "zh" ? 1 : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0f172a] text-center">{d.pricingTitle}</h1>
      <p className="mt-2 text-center text-[#64748b]">{d.pricingSub}</p>
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-xl border p-6 flex flex-col ${
              tier.cta.primary ? "border-[#0284c7] bg-[#f8fafc]" : "border-[#e2e8f0] bg-[#f8fafc]/50"
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-3 left-4 rounded-full bg-[#0284c7] px-3 py-0.5 text-xs font-semibold text-[#ffffff]">
                {tier.badge[li]}
              </span>
            )}
            <h2 className="text-lg font-semibold text-[#0f172a]">{tier.name}</h2>
            <p className="mt-1 text-2xl font-bold text-[#0284c7]">{tier.price[li]}</p>
            <p className="mt-1 text-sm text-[#64748b]">{tier.tagline[li]}</p>
            <ul className="mt-5 flex-1 flex flex-col gap-2 text-sm text-[#334155]">
              {tier.features.map((f) => (
                <li key={f[0]} className="flex gap-2">
                  <span className="text-[#059669] shrink-0">✓</span>
                  {f[li]}
                </li>
              ))}
            </ul>
            <Link
              href={tier.cta.href}
              className={`mt-6 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors ${
                tier.cta.primary
                  ? "bg-[#0284c7] text-[#ffffff] hover:bg-[#0369a1]"
                  : "border border-[#cbd5e1] text-[#0f172a] hover:bg-[#f1f5f9]"
              }`}
            >
              {tier.cta.label[li]}
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-[#94a3b8]">
        {li === 1
          ? "计费单元：写事件 = remember / record_decision / record_fact；查事件 = search / trace / intervention 等读路径；管理操作（invalidate、sleep、export）不计费。"
          : "Billing units: write events = remember / record_decision / record_fact; query events = search / trace / intervention and other read paths; admin operations (invalidate, sleep, export) are free."}
      </p>
    </div>
  );
}
