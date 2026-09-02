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
    name: "Cloud",
    price: ["Coming soon", "即将推出"],
    tagline: ["Hosted memory, zero setup", "托管记忆，零配置"],
    features: [
      ["Managed causal-memory endpoint", "托管 causal-memory 端点"],
      ["Personal API token from the dashboard", "控制台签发个人 API token"],
      ["Shared memory across your agents", "多个 agent 共享记忆"],
      ["Recall audit & debug traces in the browser", "浏览器内查看召回审计与调试追踪"],
      ["Usage-based pricing", "按量计费"],
    ],
    cta: { href: "/dashboard", label: ["Join the waitlist", "加入等候名单"], primary: true },
  },
  {
    name: "Enterprise",
    price: ["Contact us", "联系我们"],
    tagline: ["For teams with serious agents", "面向重度使用 agent 的团队"],
    features: [
      ["Multi-agent shared memory with per-user isolation", "多 agent 共享记忆 + 按用户隔离"],
      ["SSO, audit logs, compliance exports", "SSO、审计日志、合规导出"],
      ["Private deployment support", "私有化部署支持"],
      ["Custom consolidation & retention policies", "自定义固化与保留策略"],
      ["Priority support", "优先支持"],
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
      <h1 className="text-3xl font-bold text-[#e8f1ff] text-center">{d.pricingTitle}</h1>
      <p className="mt-2 text-center text-[#93a7c4]">{d.pricingSub}</p>
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl border p-6 flex flex-col ${
              tier.cta.primary ? "border-[#4cc2ff] bg-[#0e1930]" : "border-[#1d3a5f] bg-[#0e1930]/50"
            }`}
          >
            <h2 className="text-lg font-semibold text-[#e8f1ff]">{tier.name}</h2>
            <p className="mt-1 text-2xl font-bold text-[#4cc2ff]">{tier.price[li]}</p>
            <p className="mt-1 text-sm text-[#93a7c4]">{tier.tagline[li]}</p>
            <ul className="mt-5 flex-1 flex flex-col gap-2 text-sm text-[#c6d2e6]">
              {tier.features.map((f) => (
                <li key={f[0]} className="flex gap-2">
                  <span className="text-[#34d399] shrink-0">✓</span>
                  {f[li]}
                </li>
              ))}
            </ul>
            <Link
              href={tier.cta.href}
              className={`mt-6 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors ${
                tier.cta.primary
                  ? "bg-[#4cc2ff] text-[#0b1220] hover:bg-[#6fd0ff]"
                  : "border border-[#2b4f7c] text-[#e8f1ff] hover:bg-[#101f3a]"
              }`}
            >
              {tier.cta.label[li]}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
