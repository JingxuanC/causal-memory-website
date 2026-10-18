"use client";

import { useState } from "react";

type Lang = "en" | "zh";

const T = {
  zh: {
    freeBadge: "免费",
    freeTitle: "下载 Alpha Desk",
    freeBody:
      "预构建的 DeepSeek Harness profile：4 个金融 Bot、35 个技能、行情中心/仪表盘、6 种研究报告。安装不需要 pnpm。",
    download: "下载安装包",
    version: "0.1.2-dev · macOS / Linux · 需要 DSH 0.2 + Python 3.11",
    proBadge: "PRO",
    proTitle: "申请 Pro license",
    proBody:
      "Pro 解锁 4 种进阶报告，以及云端因子挖掘、Kronos 与 causal-memory。提交后人工审批，通过后凭申请单号自助领取 license。",
    proPrice: "¥399 / 月（早鸟）",
    step1: "下载并安装 Alpha Desk",
    step2: "提交 Pro 申请，记下申请单号",
    step3: "审批通过后，在下方领取 license",
    step4: "打开 设置 → Alpha Desk → 粘贴 license",
    applyTitle: "1. 提交 Pro 申请",
    name: "称呼 / 团队",
    contact: "联系方式",
    contactHint: "邮箱或微信，审批结果需要据此通知你",
    purpose: "用途说明",
    purposeHint: "例如：A 股研究、财报跟踪、事件复盘",
    volume: "预计使用强度",
    submit: "提交申请",
    submitting: "提交中…",
    submitted: "申请已提交，请保存申请单号：",
    claimTitle: "2. 审批通过后领取 license",
    claimHint: "输入申请单号（REQ-XXXXXXXX）。license 只显示一次。",
    claim: "领取 Pro license",
    claiming: "领取中…",
    licenseTitle: "你的 Alpha Desk license",
    licenseHint:
      "这是一串离线签名 key，包含 Pro 权益和云端 key。不要公开分享。刷新后无法再次查看。",
    copy: "复制 license",
    copied: "已复制",
    openSettings: "怎么激活？打开 DSH → 设置 → Alpha Desk，粘贴后重启。",
    downloadReady: "下载安装包",
    noKey: "还没有申请？先在上方提交。",
    lost: "丢失 license？凭申请单号联系管理员重新发放；已领取的云端 key 不会再次显示。",
  },
  en: {
    freeBadge: "Free",
    freeTitle: "Download Alpha Desk",
    freeBody:
      "A prebuilt DeepSeek Harness profile: 4 finance Bots, 35 skills, market panel/dashboard, and 6 report types. No pnpm install required.",
    download: "Download package",
    version: "0.1.2-dev · macOS / Linux · DSH 0.2 + Python 3.11",
    proBadge: "PRO",
    proTitle: "Apply for a Pro license",
    proBody:
      "Pro unlocks four advanced reports plus cloud factor mining, Kronos and causal-memory. Human-reviewed; redeem your license with the request ID once approved.",
    proPrice: "¥399 / month (early bird)",
    step1: "Download and install Alpha Desk",
    step2: "Submit a Pro request and save the request ID",
    step3: "Once approved, claim the license below",
    step4: "Open Settings → Alpha Desk → paste the license",
    applyTitle: "1. Submit a Pro request",
    name: "Name / team",
    contact: "Contact",
    contactHint: "Email or WeChat — we need it to reach you",
    purpose: "What will you use it for?",
    purposeHint: "e.g. A-share research, earnings tracking, event review",
    volume: "Expected usage",
    submit: "Submit request",
    submitting: "Submitting…",
    submitted: "Request submitted. Save this request ID:",
    claimTitle: "2. Claim your license after approval",
    claimHint: "Enter the request ID (REQ-XXXXXXXX). The license is shown only once.",
    claim: "Claim Pro license",
    claiming: "Claiming…",
    licenseTitle: "Your Alpha Desk license",
    licenseHint:
      "An offline signed key carrying Pro entitlements and the cloud key. Keep it private. It cannot be shown again after refresh.",
    copy: "Copy license",
    copied: "Copied",
    openSettings: "How to activate: DSH → Settings → Alpha Desk, paste, then restart.",
    downloadReady: "Download package",
    noKey: "No request yet? Submit one above.",
    lost: "Lost your license? Contact us with the request ID for a reissue; a claimed cloud key is never shown twice.",
  },
} as const;

const cls = {
  card: "rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_0_rgba(15,23,42,0.02)]",
  label: "block text-sm font-medium text-[#334155] mb-1.5",
  input:
    "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#0284c7] focus:outline-none",
  btn: "rounded-lg bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1] disabled:opacity-50",
  btnGhost:
    "rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:border-[#0284c7]",
  mono: "font-mono text-xs break-all",
};

function CopyButton({ text, label, copied }: { text: string; label: string; copied: string }) {
  const [state, setState] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState(copied);
      setTimeout(() => setState(""), 1600);
    } catch {
      setState("failed");
    }
  }
  return (
    <button type="button" onClick={() => void copy()} className={cls.btnGhost}>
      {state === copied ? copied : state === "failed" ? "复制失败，请手动选中" : label}
    </button>
  );
}

export function AlphaDeskClient({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [form, setForm] = useState({ name: "", contact: "", purpose: "", volume: "" });
  const [reqNo, setReqNo] = useState("");
  const [claimNo, setClaimNo] = useState("");
  const [busy, setBusy] = useState<"" | "apply" | "claim">("");
  const [message, setMessage] = useState<{ text: string; err?: boolean }>({ text: "" });
  const [claimMessage, setClaimMessage] = useState<{ text: string; err?: boolean }>({ text: "" });
  const [license, setLicense] = useState<{
    license: string;
    plan: string;
    expiresAt: string;
    groups: string[];
  } | null>(null);

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      setMessage({
        text: lang === "zh" ? "请填写称呼和联系方式" : "Name and contact are required",
        err: true,
      });
      return;
    }
    setBusy("apply");
    setMessage({ text: lang === "zh" ? "提交中…" : "Submitting…" });
    try {
      const response = await fetch("/api/key-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          contact: form.contact.trim(),
          purpose: `[Alpha Desk Pro] ${form.purpose.trim() || "Alpha Desk"}`,
          volume: form.volume.trim(),
          product: "alpha-desk",
          groups: ["alpha", "memory"],
        }),
      });
      const data = (await response.json()) as { req_no?: string; id?: string; hint?: string; error?: string };
      if (!response.ok || !data.req_no) {
        setMessage({ text: data.hint ?? data.error ?? `HTTP ${response.status}`, err: true });
        return;
      }
      setReqNo(data.req_no);
      setClaimNo(data.req_no);
      setMessage({ text: "" });
    } catch {
      setMessage({ text: lang === "zh" ? "网络错误，请重试" : "Network error, please retry", err: true });
    } finally {
      setBusy("");
    }
  }

  async function claim() {
    const no = claimNo.trim().toUpperCase();
    if (!no) {
      setClaimMessage({ text: lang === "zh" ? "请输入申请单号" : "Enter your request ID", err: true });
      return;
    }
    setBusy("claim");
    setClaimMessage({ text: lang === "zh" ? "领取中…" : "Claiming…" });
    setLicense(null);
    try {
      const response = await fetch("/api/alpha-desk/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reqNo: no }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        license?: string;
        plan?: string;
        expiresAt?: string;
        groups?: string[];
        hint?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.license) {
        setClaimMessage({ text: data.hint ?? data.error ?? `HTTP ${response.status}`, err: true });
        return;
      }
      setLicense({
        license: data.license,
        plan: data.plan ?? "pro",
        expiresAt: data.expiresAt ?? "",
        groups: data.groups ?? [],
      });
      setClaimMessage({ text: "" });
    } catch {
      setClaimMessage({
        text: lang === "zh" ? "网络错误，请稍后重试" : "Network error, please retry",
        err: true,
      });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <section className={cls.card}>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#059669] px-2 py-0.5 text-xs font-semibold text-[#059669]">
              {t.freeBadge}
            </span>
            <h2 className="text-lg font-semibold text-[#0f172a]">{t.freeTitle}</h2>
          </div>
          <p className="mt-2 text-sm text-[#475569]">{t.freeBody}</p>
          <a href="/api/alpha-desk/download" className={`${cls.btn} mt-5 inline-block`}>
            {t.download}
          </a>
          <p className="mt-3 text-xs text-[#94a3b8]">{t.version}</p>
        </section>

        <section className={`${cls.card} border-[#0284c7] bg-[#f8fafc]`}>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#0284c7] px-2 py-0.5 text-xs font-semibold text-white">
              {t.proBadge}
            </span>
            <h2 className="text-lg font-semibold text-[#0f172a]">{t.proTitle}</h2>
          </div>
          <p className="mt-2 text-sm text-[#475569]">{t.proBody}</p>
          <p className="mt-3 text-lg font-semibold text-[#0284c7]">{t.proPrice}</p>
          <ol className="mt-4 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-[#334155]">
            <li>{t.step1}</li>
            <li>{t.step2}</li>
            <li>{t.step3}</li>
            <li>{t.step4}</li>
          </ol>
        </section>
      </div>

      <section id="apply" className="scroll-mt-20 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
        <h2 className="text-lg font-semibold text-[#0f172a]">{t.applyTitle}</h2>
        {reqNo ? (
          <div className="mt-4 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-4">
            <p className="text-sm text-[#166534]">{t.submitted}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="rounded bg-white px-3 py-1.5 text-base font-semibold text-[#0f172a]">
                {reqNo}
              </code>
              <CopyButton text={reqNo} label={lang === "zh" ? "复制单号" : "Copy ID"} copied={lang === "zh" ? "已复制" : "Copied"} />
              <a href={`/apply?req=${encodeURIComponent(reqNo)}`} className="text-sm text-[#0284c7] underline">
                {lang === "zh" ? "在 API key 页面查看审批状态" : "Check approval status"}
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={apply} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={cls.label}>{t.name}</label>
              <input
                className={cls.input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={cls.label}>{t.contact}</label>
              <input
                className={cls.input}
                value={form.contact}
                placeholder={t.contactHint}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>
            <div>
              <label className={cls.label}>{t.purpose}</label>
              <input
                className={cls.input}
                value={form.purpose}
                placeholder={t.purposeHint}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
            <div>
              <label className={cls.label}>{t.volume}</label>
              <input
                className={cls.input}
                value={form.volume}
                placeholder={lang === "zh" ? "每天几次 / 每月多少" : "calls per day / month"}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className={cls.btn} disabled={busy !== ""}>
                {busy === "apply" ? t.submitting : t.submit}
              </button>
              {message.text ? (
                <p className={`mt-3 text-sm ${message.err ? "text-[#b91c1c]" : "text-[#475569]"}`}>
                  {message.text}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </section>

      <section className={cls.card}>
        <h2 className="text-lg font-semibold text-[#0f172a]">{t.claimTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{t.claimHint}</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            className={cls.input}
            value={claimNo}
            placeholder="REQ-XXXXXXXX"
            onChange={(e) => setClaimNo(e.target.value.toUpperCase())}
          />
          <button type="button" className={cls.btn} onClick={() => void claim()} disabled={busy !== ""}>
            {busy === "claim" ? t.claiming : t.claim}
          </button>
        </div>
        {claimMessage.text ? (
          <p className={`mt-3 text-sm ${claimMessage.err ? "text-[#b91c1c]" : "text-[#475569]"}`}>
            {claimMessage.text}
          </p>
        ) : null}

        {license ? (
          <div className="mt-5 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[#0f172a]">{t.licenseTitle}</h3>
              <span className="rounded-full bg-[#0284c7] px-2 py-0.5 text-xs font-semibold text-white">
                {license.plan.toUpperCase()}
              </span>
              {license.expiresAt ? (
                <span className="text-xs text-[#64748b]">
                  {lang === "zh" ? "到期" : "expires"} {license.expiresAt}
                </span>
              ) : null}
            </div>
            <textarea
              readOnly
              value={license.license}
              rows={5}
              className="mt-3 w-full rounded-lg border border-[#bae6fd] bg-white p-3 font-mono text-xs text-[#0f172a]"
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <CopyButton text={license.license} label={t.copy} copied={t.copied} />
              <a href="/api/alpha-desk/download" className="text-sm text-[#0284c7] underline">
                {t.downloadReady}
              </a>
            </div>
            <p className="mt-3 text-xs text-[#92400e]">{t.licenseHint}</p>
            <p className="mt-1 text-xs text-[#475569]">{t.openSettings}</p>
          </div>
        ) : null}
      </section>

      <p className="text-center text-xs text-[#94a3b8]">{t.lost}</p>
    </div>
  );
}
