"use client";

import { useState } from "react";

const PLANS = [
  { value: "memory", label: "云端记忆（memory）" },
  { value: "pro", label: "Pro（pro）" },
  { value: "free", label: "降级为 free" },
];

export function AdminGrant() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("memory");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok?: boolean }>({ text: "" });

  async function submit() {
    setBusy(true);
    setMsg({ text: "" });
    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plan }),
      });
      const data = (await res.json()) as { ok?: boolean; email?: string; plan?: string; hint?: string; error?: string };
      if (!res.ok || !data.ok) {
        setMsg({ text: `失败：${data.hint ?? data.error ?? res.status}`, ok: false });
        return;
      }
      setMsg({ text: `已开通：${data.email} → ${data.plan}`, ok: true });
      setEmail("");
    } catch {
      setMsg({ text: "网络错误", ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-5">
      <h2 className="text-sm font-semibold text-[#0f172a]">手动开通（微信/PayPal 收款后）</h2>
      <p className="mt-1 text-xs text-[#64748b]">输入客户登录官网的邮箱，直接设置 plan；客户需先用 GitHub 登录过一次。</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="customer@example.com"
          className="flex-1 rounded-md border border-[#cbd5e1] px-3 py-2 text-sm outline-none focus:border-[#0284c7]"
        />
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          className="rounded-md border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a]"
        >
          {PLANS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button
          onClick={submit}
          disabled={busy || !email.includes("@")}
          className="rounded-md bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e293b] disabled:opacity-50"
        >
          {busy ? "开通中…" : "开通"}
        </button>
      </div>
      {msg.text && <p className={`mt-2 text-xs ${msg.ok ? "text-[#047857]" : "text-[#b91c1c]"}`}>{msg.text}</p>}
    </section>
  );
}
