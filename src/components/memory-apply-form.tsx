"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/client-track";

type Lang = "en" | "zh";

const T = {
  zh: {
    formTitle: "申请云端记忆",
    formSub:
      "¥99 / 月。提交后人工审批；通过后在本页用同一个 GitHub 账号领取记忆密钥（cm_ 开头，只显示一次）。",
    name: "称呼 / 团队",
    contact: "联系方式",
    contactHint: "邮箱或微信——审批结果需要据此通知你",
    purpose: "用途 / 备注",
    purposeHint: "例如：给 Alpha Desk 或自建 agent 接云端记忆",
    submit: "提交申请",
    submitting: "提交中…",
    needName: "请填写称呼或团队名",
    needContact: "请留联系方式，否则无法通知你审批结果",
    doneTitle: "申请已提交",
    doneSub: "请记下申请单号，查询状态和领取记忆密钥都用它：",
    copyId: "复制单号",
    copied: "已复制",
    copyFail: "复制失败，请手动选中",
    check: "查询状态",
    lookupTitle: "查询状态 / 领取记忆密钥",
    lookupHint: "审批通过后，用申请时的 GitHub 账号领取。密钥只显示一次。",
    lookupId: "申请单号",
    statusBtn: "查询状态",
    claimBtn: "领取记忆密钥",
    claiming: "领取中…",
    tokenTitle: "你的云端记忆密钥",
    once: "仅显示这一次",
    copyToken: "复制密钥",
    saveWarn:
      "请立即保存到插件设置页（DSH → 设置 → 云端记忆 / Memory Token）。刷新或关闭本页后无法再次查看。",
    endpoint: "记忆端点",
    tenant: "账号租户",
    expires: "到期",
    statusPending: "审批中",
    statusApproved: "已通过审批",
    statusRejected: "已拒绝",
    statusRevoked: "已停用",
    submittedAt: "提交时间",
    rejectedReason: "拒绝理由",
    redeemState: "领取状态",
    notRedeemed: "未领取",
    redeemed: "已领取",
    needId: "请输入申请单号",
    notMemory: "这个单号不是云端记忆申请，请切换上方对应的产品 tab。",
    wrongProduct: "单号与当前产品不匹配",
    network: "网络错误，请重试",
    reset: "再提交一张",
    signedInAs: "当前登录",
    manualHint: "审批通过后，输入申请单号即可领取；提交成功后会自动带出。",
  },
  en: {
    formTitle: "Apply for cloud memory",
    formSub:
      "¥99 / month. Human-reviewed; once approved, claim your memory key (prefixed cm_, shown only once) on this page with the same GitHub account.",
    name: "Name / team",
    contact: "Contact",
    contactHint: "Email or WeChat — we need it to reach you",
    purpose: "Use case / notes",
    purposeHint: "e.g. cloud memory for Alpha Desk or your own agent",
    submit: "Submit application",
    submitting: "Submitting…",
    needName: "Please fill in a name / team",
    needContact: "Please leave a contact — otherwise we cannot reach you",
    doneTitle: "Application submitted",
    doneSub: "Save this request ID. Use it to check the status and claim your memory key:",
    copyId: "Copy ID",
    copied: "Copied",
    copyFail: "Copy failed — select manually",
    check: "Check status",
    lookupTitle: "Check status / claim memory key",
    lookupHint: "Once approved, claim with the GitHub account used to apply. The key is shown only once.",
    lookupId: "Request ID",
    statusBtn: "Check status",
    claimBtn: "Claim memory key",
    claiming: "Claiming…",
    tokenTitle: "Your cloud memory key",
    once: "shown only once",
    copyToken: "Copy key",
    saveWarn:
      "Save it now in the plugin settings (DSH → Settings → Cloud memory / Memory Token). It cannot be shown again after refresh.",
    endpoint: "Memory endpoint",
    tenant: "Account tenant",
    expires: "expires",
    statusPending: "Pending review",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusRevoked: "Revoked",
    submittedAt: "Submitted",
    rejectedReason: "Reason",
    redeemState: "Redemption",
    notRedeemed: "not redeemed yet",
    redeemed: "redeemed",
    needId: "Enter your request ID",
    notMemory: "This request is not a cloud-memory application. Switch to the matching product tab.",
    wrongProduct: "request does not match this product",
    network: "Network error, please retry",
    reset: "Submit another",
    signedInAs: "Signed in as",
    manualHint: "After approval, enter the request ID to claim; it is prefilled after submission.",
  },
} as const;

const cls = {
  input:
    "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#0284c7] focus:outline-none",
  label: "block text-sm font-medium text-[#334155] mb-1.5",
  btn: "rounded-lg bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1] disabled:opacity-50",
  btnGhost:
    "rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:border-[#0284c7]",
  card: "rounded-xl border border-[#e2e8f0] bg-white p-6",
};

type MemoryStatus = {
  req_no?: string;
  status?: string;
  product?: string;
  name?: string;
  created_at?: number;
  picked_at?: number | null;
  claimable?: boolean;
  binding?: string;
  hint?: string;
  reject_reason?: string;
};

type Claimed = {
  memoryToken: string;
  memory_url?: string;
  tenant?: string;
  expiresAt?: string;
};

function statusMeta(lang: Lang, status: string) {
  const t = T[lang];
  const map: Record<string, [string, string]> = {
    pending: [t.statusPending, "bg-[#fef3c7] text-[#92400e]"],
    approved: [t.statusApproved, "bg-[#dcfce7] text-[#166534]"],
    rejected: [t.statusRejected, "bg-[#fee2e2] text-[#991b1b]"],
    revoked: [t.statusRevoked, "bg-[#fee2e2] text-[#991b1b]"],
  };
  return map[status] ?? [status, "bg-[#f1f5f9] text-[#475569]"];
}

function fmt(ts?: number | null) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString(undefined, { hour12: false });
}

export function MemoryApplyForm({
  lang,
  initialReq = "",
  userLabel = "",
}: {
  lang: Lang;
  initialReq?: string;
  userLabel?: string;
}) {
  const t = T[lang];
  const [form, setForm] = useState({ name: "", contact: "", purpose: "" });
  const [msg, setMsg] = useState<{ text: string; err?: boolean }>({ text: "" });
  const [busy, setBusy] = useState<"" | "apply" | "status" | "claim">("");
  const [reqNo, setReqNo] = useState("");
  const [queryNo, setQueryNo] = useState(initialReq);
  const [status, setStatus] = useState<MemoryStatus | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; err?: boolean }>({ text: "" });
  const [claimed, setClaimed] = useState<Claimed | null>(null);
  const [copied, setCopied] = useState("");

  async function copy(text: string, tag: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("fail:" + tag);
    }
  }

  async function runStatus(noArg?: string) {
    const no = (noArg ?? queryNo).trim().toUpperCase();
    if (!no) return setStatusMsg({ text: t.needId, err: true });
    setBusy("status");
    setStatusMsg({ text: "…" });
    setClaimed(null);
    try {
      const response = await fetch(`/api/key-request/${encodeURIComponent(no)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as MemoryStatus & { error?: string; hint?: string };
      if (!response.ok) {
        setStatus(null);
        setStatusMsg({ text: data.hint || data.error || `HTTP ${response.status}`, err: true });
      } else if (data.product !== "memory") {
        setStatus(null);
        setStatusMsg({ text: t.notMemory, err: true });
      } else {
        setStatus(data);
        setStatusMsg({ text: "" });
      }
    } catch {
      setStatusMsg({ text: t.network, err: true });
    } finally {
      setBusy("");
    }
  }

  // ?req=REQ-XXXX（页面由其他入口带过来）自动查一次状态。
  useEffect(() => {
    if (!initialReq) return;
    const id = setTimeout(() => {
      setQueryNo(initialReq);
      void runStatus(initialReq);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReq]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return setMsg({ text: t.needName, err: true });
    if (!form.contact.trim()) return setMsg({ text: t.needContact, err: true });
    setBusy("apply");
    setMsg({ text: t.submitting });
    try {
      const response = await fetch("/api/key-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          contact: form.contact.trim(),
          purpose: form.purpose.trim(),
          product: "memory",
        }),
      });
      const data = (await response.json()) as {
        req_no?: string;
        hint?: string;
        error?: string;
      };
      if (!response.ok || !data.req_no) {
        setMsg({ text: data.hint || data.error || `HTTP ${response.status}`, err: true });
        return;
      }
      setReqNo(data.req_no);
        trackEvent("apply_submit_memory");
      setQueryNo(data.req_no);
      setMsg({ text: "" });
      void runStatus(data.req_no);
    } catch {
      setMsg({ text: t.network, err: true });
    } finally {
      setBusy("");
    }
  }

  async function claim() {
    const no = (queryNo || reqNo).trim().toUpperCase();
    if (!no) return setStatusMsg({ text: t.needId, err: true });
    setBusy("claim");
    setStatusMsg({ text: t.claiming });
    setClaimed(null);
    try {
      const response = await fetch("/api/memory/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reqNo: no }),
      });
      const data = (await response.json()) as Claimed & {
        ok?: boolean;
        hint?: string;
        error?: string;
        signInUrl?: string;
      };
      if (!response.ok || !data.ok || !data.memoryToken) {
        setStatusMsg({ text: data.hint || data.error || `HTTP ${response.status}`, err: true });
        return;
      }
      trackEvent("claim_memory");
      setClaimed({
        memoryToken: data.memoryToken,
        memory_url: data.memory_url,
        tenant: data.tenant,
        expiresAt: data.expiresAt,
      });
      setStatusMsg({ text: "" });
      setStatus((prev) =>
        prev
          ? { ...prev, picked_at: Math.floor(Date.now() / 1000), claimable: false }
          : prev,
      );
    } catch {
      setStatusMsg({ text: t.network, err: true });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {userLabel ? (
        <p className="text-xs text-[#64748b]">
          {t.signedInAs}: <span className="font-medium text-[#0f172a]">{userLabel}</span>
        </p>
      ) : null}

      {!reqNo ? (
        <form onSubmit={submit} className={cls.card}>
          <h3 className="text-lg font-semibold text-[#0f172a]">{t.formTitle}</h3>
          <p className="mt-1 mb-5 text-sm text-[#64748b]">{t.formSub}</p>

          <label className={cls.label} htmlFor="memory-name">
            {t.name} <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="memory-name"
            className={cls.input}
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className={`${cls.label} mt-4`} htmlFor="memory-contact">
            {t.contact} <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="memory-contact"
            className={cls.input}
            maxLength={120}
            placeholder={t.contactHint}
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />

          <label className={`${cls.label} mt-4`} htmlFor="memory-purpose">
            {t.purpose}
          </label>
          <textarea
            id="memory-purpose"
            className={`${cls.input} min-h-[84px]`}
            maxLength={500}
            placeholder={t.purposeHint}
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="submit" className={cls.btn} disabled={busy !== ""}>
              {busy === "apply" ? t.submitting : t.submit}
            </button>
            {msg.text && (
              <span className={`text-sm ${msg.err ? "text-[#dc2626]" : "text-[#166534]"}`}>{msg.text}</span>
            )}
          </div>
        </form>
      ) : (
        <div className={cls.card}>
          <h3 className="text-lg font-semibold text-[#0f172a]">{t.doneTitle} ✅</h3>
          <p className="mt-1 mb-3 text-sm text-[#64748b]">{t.doneSub}</p>
          <p className="font-mono text-2xl font-bold tracking-wider text-[#0284c7]">{reqNo}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className={cls.btnGhost} onClick={() => copy(reqNo, "reqno")}>
              {copied === "reqno" ? t.copied : t.copyId}
            </button>
            <button type="button" className={cls.btnGhost} onClick={() => void runStatus(reqNo)}>
              {t.check}
            </button>
            <button
              type="button"
              className="text-sm text-[#0284c7] underline"
              onClick={() => {
                setReqNo("");
                setStatus(null);
                setClaimed(null);
                setStatusMsg({ text: "" });
                setMsg({ text: "" });
              }}
            >
              {t.reset}
            </button>
          </div>
        </div>
      )}

      <div className={cls.card} id="memory-lookup">
        <h3 className="text-lg font-semibold text-[#0f172a]">{t.lookupTitle}</h3>
        <p className="mt-1 text-sm text-[#64748b]">{t.lookupHint}</p>
        <label className={`${cls.label} mt-4`} htmlFor="memory-reqno">
          {t.lookupId}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="memory-reqno"
            className={`${cls.input} max-w-[240px] font-mono`}
            placeholder="REQ-XXXXXXXX"
            value={queryNo}
            onChange={(e) => setQueryNo(e.target.value.toUpperCase())}
          />
          <button
            type="button"
            className={cls.btnGhost}
            disabled={busy !== ""}
            onClick={() => void runStatus()}
          >
            {busy === "status" ? "…" : t.statusBtn}
          </button>
          <button
            type="button"
            className={cls.btn}
            disabled={busy !== "" || !queryNo.trim()}
            onClick={() => void claim()}
          >
            {busy === "claim" ? t.claiming : t.claimBtn}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#94a3b8]">{t.manualHint}</p>
        {statusMsg.text && (
          <p className={`mt-3 text-sm ${statusMsg.err ? "text-[#dc2626]" : "text-[#475569]"}`}>
            {statusMsg.text}
          </p>
        )}

        {status && (
          <div className="mt-5 border-t border-[#e2e8f0] pt-4 text-sm">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusMeta(lang, String(status.status))[1]}`}
            >
              {statusMeta(lang, String(status.status))[0]}
            </span>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-[#64748b]">{t.lookupId}</dt>
              <dd className="font-mono text-[#0f172a]">{String(status.req_no ?? queryNo)}</dd>
              <dt className="text-[#64748b]">{t.name}</dt>
              <dd className="text-[#0f172a]">{String(status.name ?? "—")}</dd>
              <dt className="text-[#64748b]">{t.submittedAt}</dt>
              <dd className="text-[#0f172a]">{fmt(status.created_at)}</dd>
              {status.status === "approved" || status.picked_at ? (
                <>
                  <dt className="text-[#64748b]">{t.redeemState}</dt>
                  <dd className="text-[#0f172a]">
                    {status.picked_at ? `${t.redeemed} · ${fmt(status.picked_at)}` : t.notRedeemed}
                  </dd>
                </>
              ) : null}
            </dl>
            {status.reject_reason && (
              <p className="mt-3 border-l-2 border-[#dc2626] pl-3 text-[#991b1b]">
                {t.rejectedReason}：{status.reject_reason}
              </p>
            )}
            {status.hint && (
              <p className="mt-3 border-l-2 border-[#f59e0b] pl-3 text-[#92400e]">{status.hint}</p>
            )}
          </div>
        )}

        {claimed && (
          <div className="mt-5 border-t border-[#e2e8f0] pt-4">
            <h4 className="text-base font-semibold text-[#0f172a]">
              {t.tokenTitle}{" "}
              <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#166534]">
                {t.once}
              </span>
            </h4>
            <p className="mt-2 break-all rounded-lg border border-[#86efac] bg-[#f0fdf4] p-3 font-mono text-sm text-[#0f172a]">
              {claimed.memoryToken}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={cls.btn}
                onClick={() => copy(claimed.memoryToken, "token")}
              >
                {copied === "token" ? t.copied : t.copyToken}
              </button>
              {copied === "fail:token" && (
                <span className="text-sm text-[#dc2626]">{t.copyFail}</span>
              )}
            </div>
            <p className="mt-3 border-l-2 border-[#dc2626] pl-3 text-sm text-[#991b1b]">{t.saveWarn}</p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {claimed.memory_url && (
                <>
                  <dt className="text-[#64748b]">{t.endpoint}</dt>
                  <dd className="break-all font-mono text-[#0f172a]">{claimed.memory_url}</dd>
                </>
              )}
              {claimed.tenant && (
                <>
                  <dt className="text-[#64748b]">{t.tenant}</dt>
                  <dd className="font-mono text-[#0f172a]">{claimed.tenant}</dd>
                </>
              )}
              {claimed.expiresAt && (
                <>
                  <dt className="text-[#64748b]">{t.expires}</dt>
                  <dd className="text-[#0f172a]">{claimed.expiresAt}</dd>
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
