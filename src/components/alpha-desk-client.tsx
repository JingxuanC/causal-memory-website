"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/client-track";

type Lang = "en" | "zh";

const T = {
  zh: {
    freeBadge: "免费",
    freeTitle: "下载 Alpha Desk",
    freeBody:
      "预构建的 DeepSeek Harness profile：9 个金融 Bot、35 个技能、行情中心/仪表盘、6 种研究报告。支持 macOS 与 Windows。",
    download: "下载安装包（Bundle）",
    downloadSkill: "下载安装 Skill",
    downloadSkillHint: "把 zip 解压到 DSH 的 skills 目录，然后对 DSH 说“安装 Alpha Desk”。",
    downloadBundle: "旧版 zip（macOS）",
    downloadBundleHint: "单包约 0.7MB（npm 包 deepseek-alpha-desk），macOS / Windows 通用，依赖自动从私有 registry 解析。旧版 zip 仅 macOS 应急使用。",
    installSteps: "桌面 App 安装：设置 → 插件 → 添加插件 → 输入 deepseek-alpha-desk → 安装源填 https://causal-memory.com/npm/ → 安装后重启。",
    version: "0.1.15-dev · macOS / Windows · 需要 DSH 0.2 + Python 3.9+",
    proBadge: "PRO",
    proTitle: "申请 Pro license",
    proBody:
      "Pro 解锁 4 种进阶报告，以及云端因子挖掘、Kronos 与 causal-memory。提交后人工审批，通过后凭申请单号自助领取 license。",
    proPrice: "¥499 / 月",
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
    claimHint: "输入申请单号（REQ-XXXXXXXX）。license 与记忆 token 只显示一次。",
    loginRequired: "Pro 申请和领取需要先用 GitHub 登录，申请单会绑定到你的账号。",
    signIn: "使用 GitHub 登录",
    memoryTokenTitle: "云端记忆 token",
    once: "仅显示这一次",
    memoryTokenHint:
      "已自动生成并注册到云端记忆，只显示这一次。新版 Alpha Desk 会直接使用 memory_token + /memory/mcp；旧版继续用 license 里的 cloud_key。",
    memoryEndpoint: "记忆端点",
    accountTenant: "账号租户",
    claim: "领取 Pro license",
    claiming: "领取中…",
    licenseTitle: "你的 Alpha Desk license",
    licenseHint:
      "这是一串离线签名 key，包含 Pro 权益、旧版 cloud_key 和记忆 token。不要公开分享。刷新后无法再次查看。",
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
      "A prebuilt DeepSeek Harness profile: 9 finance Bots, 35 skills, market panel/dashboard, and 6 report types. Runs on macOS and Windows.",
    download: "Download package",
    downloadSkill: "Download install skill",
    downloadSkillHint: "Unzip into your DSH skills folder, then tell DSH: “install Alpha Desk”.",
    downloadBundle: "Legacy zip (macOS)",
    downloadBundleHint: "Single ~0.7MB tarball (npm package deepseek-alpha-desk) for macOS and Windows; dependencies resolve from our private registry. The legacy zip is macOS rescue only.",
    installSteps: "Desktop app: Settings → Plugins → Add plugin → enter deepseek-alpha-desk → source https://causal-memory.com/npm/ → install, then restart.",
    version: "0.1.15-dev · macOS / Windows · DSH 0.2 + Python 3.9+",
    proBadge: "PRO",
    proTitle: "Apply for a Pro license",
    proBody:
      "Pro unlocks four advanced reports plus cloud factor mining, Kronos and causal-memory. Human-reviewed; redeem your license with the request ID once approved.",
    proPrice: "¥499 / month",
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
    claimHint: "Enter the request ID (REQ-XXXXXXXX). The license and memory token are shown only once.",
    loginRequired: "Pro applications and claims require GitHub sign-in so the request is bound to your account.",
    signIn: "Sign in with GitHub",
    memoryTokenTitle: "Cloud memory token",
    once: "shown only once",
    memoryTokenHint:
      "Generated and registered with cloud memory automatically; shown only once. New Alpha Desk builds use memory_token + /memory/mcp. Older builds keep using cloud_key from the license.",
    memoryEndpoint: "Memory endpoint",
    accountTenant: "Account tenant",
    claim: "Claim Pro license",
    claiming: "Claiming…",
    licenseTitle: "Your Alpha Desk license",
    licenseHint:
      "An offline signed key carrying Pro entitlements, the legacy cloud key and the memory token. Keep it private. It cannot be shown again after refresh.",
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

export function AlphaDeskClient({
  lang,
  signedIn,
  signInUrl = "/api/auth/signin?callbackUrl=/alpha-desk",
}: {
  lang: Lang;
  signedIn: boolean;
  signInUrl?: string;
}) {
  const t = T[lang];
  const [form, setForm] = useState({ name: "", contact: "", purpose: "", volume: "" });
  const [reqNo, setReqNo] = useState("");
  const [claimNo, setClaimNo] = useState("");
  const [busy, setBusy] = useState<"" | "apply" | "claim">("");
  const [message, setMessage] = useState<{ text: string; err?: boolean; link?: string }>({ text: "" });
  const [claimMessage, setClaimMessage] = useState<{ text: string; err?: boolean; link?: string }>({ text: "" });
  const [license, setLicense] = useState<{
    license: string;
    plan: string;
    expiresAt: string;
    groups: string[];
    memoryToken?: string | null;
    memoryUrl?: string | null;
    tenant?: string | null;
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
      const data = (await response.json()) as {
        req_no?: string;
        id?: string;
        hint?: string;
        error?: string;
        signInUrl?: string;
      };
      if (!response.ok || !data.req_no) {
        setMessage({ text: data.hint ?? data.error ?? `HTTP ${response.status}`, err: true, link: data.signInUrl });
        return;
      }
      setReqNo(data.req_no);
      trackEvent("apply_submit_alpha");
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
        signInUrl?: string;
        memoryToken?: string | null;
        memoryUrl?: string | null;
        tenant?: string | null;
      };
      if (!response.ok || !data.ok || !data.license) {
        setClaimMessage({ text: data.hint ?? data.error ?? `HTTP ${response.status}`, err: true, link: data.signInUrl });
        return;
      }
      trackEvent("claim_alpha");
      setLicense({
        license: data.license,
        plan: data.plan ?? "pro",
        expiresAt: data.expiresAt ?? "",
        groups: data.groups ?? [],
        memoryToken: data.memoryToken ?? null,
        memoryUrl: data.memoryUrl ?? null,
        tenant: data.tenant ?? null,
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
      {!signedIn ? (
        <div className="rounded-xl border border-[#f59e0b]/40 bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
          <p>{t.loginRequired}</p>
          <a href={signInUrl} className="mt-2 inline-block font-semibold text-[#0284c7] underline">
            {t.signIn}
          </a>
        </div>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        <section className={cls.card}>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#059669] px-2 py-0.5 text-xs font-semibold text-[#059669]">
              {t.freeBadge}
            </span>
            <h2 className="text-lg font-semibold text-[#0f172a]">{t.freeTitle}</h2>
          </div>
          <p className="mt-2 text-sm text-[#475569]">{t.freeBody}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="/api/alpha-desk/bundle" className={cls.btn}>
              {t.download}
            </a>
            <a href="/api/alpha-desk/skill" className={cls.btnGhost}>
              {t.downloadSkill}
            </a>
            <a href="/api/alpha-desk/download" className={cls.btnGhost}>
              {t.downloadBundle}
            </a>
          </div>
          <p className="mt-2 text-xs text-[#64748b]">{t.downloadSkillHint}</p>
          <p className="mt-1 text-xs text-[#64748b]">{t.downloadBundleHint}</p>
          <p className="mt-1 text-xs text-[#0284c7]">{t.installSteps}</p>
          <p className="mt-1 text-xs text-[#94a3b8]">{t.version}</p>
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
                  {message.text}{" "}
                  {message.link ? (
                    <a href={message.link} className="font-semibold underline">
                      {t.signIn}
                    </a>
                  ) : null}
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
            {claimMessage.text}{" "}
            {claimMessage.link ? (
              <a href={claimMessage.link} className="font-semibold underline">
                {t.signIn}
              </a>
            ) : null}
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

            {license.memoryToken ? (
              <div className="mt-4 rounded-lg border border-[#0284c7]/30 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-[#0f172a]">{t.memoryTokenTitle}</h4>
                  <span className="rounded-full bg-[#0284c7] px-2 py-0.5 text-xs font-semibold text-white">
                    {t.once}
                  </span>
                </div>
                <code className="mt-2 block break-all rounded border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-xs text-[#0369a1]">
                  {license.memoryToken}
                </code>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <CopyButton text={license.memoryToken} label={t.copy} copied={t.copied} />
                  {license.memoryUrl ? (
                    <span className="text-xs text-[#64748b]">
                      {t.memoryEndpoint}: <code className="text-[#0369a1]">{license.memoryUrl}</code>
                    </span>
                  ) : null}
                  {license.tenant ? (
                    <span className="text-xs text-[#64748b]">
                      {t.accountTenant}: <code className="text-[#0369a1]">{license.tenant}</code>
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-[#475569]">{t.memoryTokenHint}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <p className="text-center text-xs text-[#94a3b8]">{t.lost}</p>
    </div>
  );
}
