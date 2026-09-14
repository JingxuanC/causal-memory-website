"use client";

import { useEffect, useState } from "react";

type Lang = "en" | "zh";
type Group = { name: string; label: string };
type Access = {
  per_group?: { group: string; url: string }[];
  header?: string;
  note?: string;
  example_claude_desktop?: Record<string, unknown>;
};

const T = {
  en: {
    formTitle: "Apply for an API key",
    formSub:
      "Access to the quant MCP service (market data, factor mining, causal analysis, memory). Submissions are reviewed by a human — once approved, you redeem the key yourself with your request ID.",
    name: "Name / team",
    contact: "Contact",
    contactHint: "Email or WeChat — we need it to reach you about the result",
    purpose: "What will you use it for?",
    volume: "Expected volume",
    groups: "Which groups",
    submit: "Submit application",
    submitting: "Submitting…",
    doneTitle: "Application submitted",
    doneSub: "Save this request ID. You will use it to check the status and redeem your key:",
    copyId: "Copy ID",
    checkStatus: "Check status",
    lookupTitle: "Check status / redeem key",
    lookupId: "Request ID",
    statusBtn: "Check status",
    redeemBtn: "Redeem key",
    keyTitle: "Your key",
    once: "shown only once",
    copyKey: "Copy key",
    copied: "Copied",
    copyFail: "Copy failed — select manually",
    keyName: "Key name",
    granted: "Granted groups",
    header: "Request header",
    how: "How to connect",
    saveWarn:
      "The key has been erased from the server — refreshing or closing this page loses it. Save it now.",
    example: "Client config example (Claude Desktop, Cursor, …):",
    statusPending: "Pending review — a human has not processed it yet",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusRevoked: "Revoked",
    submittedAt: "Submitted",
    redeemedAt: "Redeemed",
    rejectedReason: "Reason",
    redeemState: "Redemption",
    notRedeemed: "not redeemed yet",
    redeemed: "redeemed",
    needGroups: "Pick at least one group",
    needId: "Enter your request ID",
    needName: "Please fill in a name / team",
    needContact: "Please leave a contact — otherwise we cannot reach you",
    requestId: "Request ID",
  },
  zh: {
    formTitle: "申请 API Key",
    formSub:
      "申请量化 MCP 服务的访问权限（行情数据、因子挖掘、因果分析、记忆）。提交后由人工审批，通过后凭申请单号自助领取密钥。",
    name: "称呼 / 团队",
    contact: "联系方式",
    contactHint: "邮箱或微信——审批结果需要据此通知你",
    purpose: "用途说明",
    volume: "预计调用量",
    groups: "需要哪些分组",
    submit: "提交申请",
    submitting: "提交中…",
    doneTitle: "申请已提交",
    doneSub: "请记下申请单号，查询状态与领取密钥都用它：",
    copyId: "复制单号",
    checkStatus: "查询审批状态",
    lookupTitle: "查询 / 领取密钥",
    lookupId: "申请单号",
    statusBtn: "查询状态",
    redeemBtn: "领取密钥",
    keyTitle: "你的密钥",
    once: "仅显示这一次",
    copyKey: "复制密钥",
    copied: "已复制",
    copyFail: "复制失败，请手动选中",
    keyName: "密钥名",
    granted: "已授权分组",
    header: "请求头",
    how: "接入方式",
    saveWarn: "密钥已从服务器抹除——刷新或关闭本页就无法再看到，请立即保存。",
    example: "客户端配置示例（Claude Desktop、Cursor 等）：",
    statusPending: "审批中——管理员尚未处理",
    statusApproved: "已通过审批",
    statusRejected: "已拒绝",
    statusRevoked: "已停用",
    submittedAt: "提交时间",
    redeemedAt: "领取时间",
    rejectedReason: "拒绝理由",
    redeemState: "领取状态",
    notRedeemed: "未领取",
    redeemed: "已领取",
    needGroups: "请至少选择一个分组",
    needId: "请输入申请单号",
    needName: "请填写称呼或团队名",
    needContact: "请留联系方式，否则无法通知你审批结果",
    requestId: "申请单号",
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

export function ApplyForm({ lang, initialReq = "" }: { lang: Lang; initialReq?: string }) {
  const t = T[lang];
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [metaError, setMetaError] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", contact: "", purpose: "", volume: "" });
  const [msg, setMsg] = useState<{ text: string; err?: boolean }>({ text: "" });
  const [busy, setBusy] = useState(false);
  const [reqNo, setReqNo] = useState("");
  const [reqId, setReqId] = useState<string | null>(null);

  const [queryNo, setQueryNo] = useState(initialReq);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; err?: boolean }>({ text: "" });
  const [claimed, setClaimed] = useState<{ token: string; key_name?: string; groups?: string[]; access?: Access } | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/key-request/meta", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.groups?.length) setGroups(d.groups as Group[]);
        else setMetaError(lang === "zh" ? "暂时无法申请（服务端未配置分组）" : "Applications are closed right now.");
      })
      .catch(() => setMetaError(lang === "zh" ? "加载失败，请刷新重试" : "Failed to load — please refresh."));
  }, [lang]);

  // 链接带 ?req=REQ-XXXX 时自动查一次状态（便于把链接直接发给申请人）。
  // 延到宏任务里执行：effect 体内同步 setState 会多一次同步渲染并被 lint 拦下。
  useEffect(() => {
    if (!initialReq) return;
    const id = setTimeout(() => void runStatus(initialReq), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReq]);

  function toggleGroup(name: string) {
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));
  }

  async function copy(text: string, tag: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("fail:" + tag);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setMsg({ text: t.needName, err: true });
    if (!form.contact.trim()) return setMsg({ text: t.needContact, err: true });
    if (!picked.length) return setMsg({ text: t.needGroups, err: true });
    setBusy(true);
    setMsg({ text: t.submitting });
    try {
      const r = await fetch("/api/key-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, groups: picked }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg({ text: d.hint || d.error || `HTTP ${r.status}`, err: true });
      } else {
        setReqNo(d.req_no);
        setReqId(String(d.id ?? ""));
        setMsg({ text: "" });
      }
    } catch {
      setMsg({ text: lang === "zh" ? "网络错误，请重试" : "Network error, please retry", err: true });
    } finally {
      setBusy(false);
    }
  }

  async function runStatus(noArg?: string) {
    const no = (noArg ?? queryNo).trim().toUpperCase();
    if (!no) return setStatusMsg({ text: t.needId, err: true });
    setStatusMsg({ text: "…" });
    setClaimed(null);
    try {
      const r = await fetch(`/api/key-request/${encodeURIComponent(no)}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) {
        setStatus(null);
        setStatusMsg({ text: d.hint || d.error || `HTTP ${r.status}`, err: true });
      } else {
        setStatus(d);
        setStatusMsg({ text: "" });
      }
    } catch {
      setStatusMsg({ text: lang === "zh" ? "网络错误" : "Network error", err: true });
    }
  }

  async function redeem() {
    const no = (queryNo || reqNo).trim().toUpperCase();
    if (!no) return setStatusMsg({ text: t.needId, err: true });
    setStatusMsg({ text: "…" });
    try {
      const r = await fetch(`/api/key-request/${encodeURIComponent(no)}/pickup`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) setStatusMsg({ text: d.hint || d.error || `HTTP ${r.status}`, err: true });
      else {
        setClaimed(d);
        setStatusMsg({ text: "" });
      }
    } catch {
      setStatusMsg({ text: lang === "zh" ? "网络错误" : "Network error", err: true });
    }
  }

  const canRedeem = Boolean(status && status.status === "approved" && status.claimable);

  return (
    <div className="flex flex-col gap-6">
      {/* ── 申请表单 ── */}
      {!reqNo && (
        <form onSubmit={submit} className={cls.card}>
          <h2 className="text-lg font-semibold text-[#0f172a]">{t.formTitle}</h2>
          <p className="mt-1 mb-5 text-sm text-[#64748b]">{t.formSub}</p>

          <label className={cls.label} htmlFor="name">
            {t.name} <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="name"
            className={cls.input}
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className={`${cls.label} mt-4`} htmlFor="contact">
            {t.contact} <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="contact"
            className={cls.input}
            maxLength={120}
            placeholder={t.contactHint}
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />

          <label className={`${cls.label} mt-4`} htmlFor="purpose">
            {t.purpose}
          </label>
          <textarea
            id="purpose"
            className={`${cls.input} min-h-[84px]`}
            maxLength={500}
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />

          <label className={`${cls.label} mt-4`}>{t.groups}</label>
          {metaError ? (
            <p className="text-sm text-[#dc2626]">{metaError}</p>
          ) : !groups ? (
            <p className="text-sm text-[#94a3b8]">…</p>
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <label
                  key={g.name}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e2e8f0] px-3 py-2.5 hover:border-[#cbd5e1]"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={picked.includes(g.name)}
                    onChange={() => toggleGroup(g.name)}
                  />
                  <span>
                    <span className="text-sm font-medium text-[#0f172a]">{g.name}</span>
                    <span className="ml-2 text-xs text-[#64748b]">{g.label}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <label className={`${cls.label} mt-4`} htmlFor="volume">
            {t.volume}
          </label>
          <input
            id="volume"
            className={cls.input}
            maxLength={60}
            value={form.volume}
            onChange={(e) => setForm({ ...form, volume: e.target.value })}
          />

          <div className="mt-6 flex items-center gap-4">
            <button type="submit" className={cls.btn} disabled={busy || !!metaError}>
              {busy ? t.submitting : t.submit}
            </button>
            {msg.text && (
              <span className={`text-sm ${msg.err ? "text-[#dc2626]" : "text-[#166534]"}`}>{msg.text}</span>
            )}
          </div>
        </form>
      )}

      {/* ── 提交成功：单号 ── */}
      {reqNo && (
        <div className={cls.card}>
          <h2 className="text-lg font-semibold text-[#0f172a]">{t.doneTitle} ✅</h2>
          <p className="mt-1 mb-3 text-sm text-[#64748b]">{t.doneSub}</p>
          <p className="font-mono text-2xl font-bold tracking-wider text-[#0284c7]">{reqNo}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className={cls.btnGhost} onClick={() => copy(reqNo, "reqno")}>
              {copied === "reqno" ? t.copied : t.copyId}
            </button>
            <button
              type="button"
              className={cls.btnGhost}
              onClick={() => {
                setQueryNo(reqNo);
                void runStatus(reqNo);
                document.getElementById("lookup")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t.checkStatus}
            </button>
            {reqId && <span className="text-xs text-[#94a3b8]">#{reqId}</span>}
          </div>
        </div>
      )}

      {/* ── 查询 / 领取 ── */}
      <div className={cls.card} id="lookup">
        <h2 className="text-lg font-semibold text-[#0f172a]">{t.lookupTitle}</h2>
        <label className={`${cls.label} mt-4`} htmlFor="reqno">
          {t.lookupId}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="reqno"
            className={`${cls.input} max-w-[240px] font-mono`}
            placeholder="REQ-XXXXXXXX"
            value={queryNo}
            onChange={(e) => setQueryNo(e.target.value.toUpperCase())}
          />
          <button type="button" className={cls.btnGhost} onClick={() => runStatus()}>
            {t.statusBtn}
          </button>
          <button type="button" className={cls.btn} onClick={redeem} disabled={!canRedeem && !claimed}>
            {t.redeemBtn}
          </button>
        </div>
        {statusMsg.text && <p className="mt-3 text-sm text-[#dc2626]">{statusMsg.text}</p>}

        {status && (
          <div className="mt-5 border-t border-[#e2e8f0] pt-4 text-sm">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusMeta(lang, String(status.status))[1]}`}>
              {statusMeta(lang, String(status.status))[0]}
            </span>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-[#64748b]">{t.requestId}</dt>
              <dd className="font-mono text-[#0f172a]">{String(status.req_no)}</dd>
              <dt className="text-[#64748b]">{t.name}</dt>
              <dd className="text-[#0f172a]">{String(status.name)}</dd>
              <dt className="text-[#64748b]">{t.submittedAt}</dt>
              <dd className="text-[#0f172a]">{fmt(status.created_at as number)}</dd>
              {Array.isArray(status.granted_groups) && (status.granted_groups as string[]).length > 0 && (
                <>
                  <dt className="text-[#64748b]">{t.granted}</dt>
                  <dd className="text-[#0f172a]">{(status.granted_groups as string[]).join(", ")}</dd>
                </>
              )}
              {status.status === "approved" && (
                <>
                  <dt className="text-[#64748b]">{t.redeemState}</dt>
                  <dd className="text-[#0f172a]">
                    {status.picked_at ? `${t.redeemed} · ${fmt(status.picked_at as number)}` : t.notRedeemed}
                  </dd>
                </>
              )}
            </dl>
            {typeof status.reject_reason === "string" && status.reject_reason && (
              <p className="mt-3 border-l-2 border-[#dc2626] pl-3 text-[#991b1b]">
                {t.rejectedReason}：{status.reject_reason}
              </p>
            )}
            {typeof status.hint === "string" && status.hint && (
              <p className="mt-3 border-l-2 border-[#f59e0b] pl-3 text-[#92400e]">{status.hint}</p>
            )}
          </div>
        )}

        {claimed && (
          <div className="mt-5 border-t border-[#e2e8f0] pt-4">
            <h3 className="text-base font-semibold text-[#0f172a]">
              {t.keyTitle}{" "}
              <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#166534]">
                {t.once}
              </span>
            </h3>
            <p className="mt-2 break-all rounded-lg border border-[#86efac] bg-[#f0fdf4] p-3 font-mono text-sm text-[#0f172a]">
              {claimed.token}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" className={cls.btn} onClick={() => copy(claimed.token, "key")}>
                {copied === "key" ? t.copied : t.copyKey}
              </button>
              {copied === "fail:key" && <span className="text-sm text-[#dc2626]">{t.copyFail}</span>}
            </div>
            <p className="mt-3 border-l-2 border-[#dc2626] pl-3 text-sm text-[#991b1b]">{t.saveWarn}</p>

            <h3 className="mt-6 text-base font-semibold text-[#0f172a]">{t.how}</h3>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-[#64748b]">{t.keyName}</dt>
              <dd className="font-mono text-[#0f172a]">{claimed.key_name}</dd>
              <dt className="text-[#64748b]">{t.granted}</dt>
              <dd className="text-[#0f172a]">{(claimed.groups ?? []).join(", ")}</dd>
              <dt className="text-[#64748b]">{t.header}</dt>
              <dd className="font-mono text-[#0f172a]">{claimed.access?.header ?? "Authorization: Bearer <key>"}</dd>
            </dl>
            <div className="mt-2 flex flex-col gap-1 font-mono text-xs text-[#334155]">
              {(claimed.access?.per_group ?? []).map((g) => (
                <span key={g.group}>
                  {g.group} → {g.url}
                </span>
              ))}
            </div>
            {claimed.access?.note && (
              <p className="mt-3 border-l-2 border-[#dc2626] pl-3 text-sm text-[#991b1b]">{claimed.access.note}</p>
            )}
            <p className="mt-4 text-xs text-[#64748b]">{t.example}</p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs text-[#334155]">
              {JSON.stringify(claimed.access?.example_claude_desktop ?? {}, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
