import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

const tiers = [
  {
    name: "Community",
    price: "Free",
    tagline: "The full engine, open source",
    features: [
      "Apache-2.0, all 17 MCP tools",
      "SQLite local store — your data never leaves your machine",
      "Local ONNX embeddings (fully offline)",
      "HTTP transport for your own infra",
      "Community support via GitHub",
    ],
    cta: { href: "/docs/getting-started", label: "Get started", primary: false },
  },
  {
    name: "Cloud",
    price: "Coming soon",
    tagline: "Hosted memory, zero setup",
    features: [
      "Managed causal-memory endpoint",
      "Personal API token from the dashboard",
      "Shared memory across your agents",
      "Recall audit & debug traces in the browser",
      "Usage-based pricing",
    ],
    cta: { href: "/dashboard", label: "Join the waitlist", primary: true },
  },
  {
    name: "Enterprise",
    price: "Contact us",
    tagline: "For teams with serious agents",
    features: [
      "Multi-agent shared memory with per-user isolation",
      "SSO, audit logs, compliance exports",
      "Private deployment support",
      "Custom consolidation & retention policies",
      "Priority support",
    ],
    cta: { href: "https://github.com/JingxuanC/causal-memory/issues", label: "Talk to us", primary: false },
  },
];

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#e8f1ff] text-center">Pricing</h1>
      <p className="mt-2 text-center text-[#93a7c4]">
        Open-core: the engine is free forever. Pay for hosting and collaboration.
      </p>
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-xl border p-6 flex flex-col ${
              t.cta.primary ? "border-[#4cc2ff] bg-[#0e1930]" : "border-[#1d3a5f] bg-[#0e1930]/50"
            }`}
          >
            <h2 className="text-lg font-semibold text-[#e8f1ff]">{t.name}</h2>
            <p className="mt-1 text-2xl font-bold text-[#4cc2ff]">{t.price}</p>
            <p className="mt-1 text-sm text-[#93a7c4]">{t.tagline}</p>
            <ul className="mt-5 flex-1 flex flex-col gap-2 text-sm text-[#c6d2e6]">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-[#34d399] shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={t.cta.href}
              className={`mt-6 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors ${
                t.cta.primary
                  ? "bg-[#4cc2ff] text-[#0b1220] hover:bg-[#6fd0ff]"
                  : "border border-[#2b4f7c] text-[#e8f1ff] hover:bg-[#101f3a]"
              }`}
            >
              {t.cta.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
