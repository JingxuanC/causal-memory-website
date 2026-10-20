"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminRequestRow, AdminStatusFilter } from "@/lib/quota-types";

type Props = {
  requests: AdminRequestRow[];
  initialStatus: AdminStatusFilter;
  pendingCount: number;
  claimableCount: number;
};

type PanelKind = "approve" | "reject" | "reissue" | "bind";
type Panel = { rowId: number; kind: PanelKind } | null;
type Busy = { rowId: number; action: PanelKind } | null;
type Notice = { kind: "ok" | "error"; text: string };

type ActionPayload = {
  ok?: boolean;
  error?: string;
  hint?: string;
  warning?: string | null;
  old_key_note?: string;
  tenant?: string;
  binding?: string;
  groups?: string[];
};

const TABS: { key: AdminStatusFilter; label: string }[] = [
  { key: "pending", label: "待审批" },
  { key: "approved", label: "已通过" },
  { key: "rejected", label: "已拒绝" },
  { key: "all", label: "全部" },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "待审批", className: "bg-[#fef3c7] text-[#92400e]" },
  approved: { label: "已通过", className: "bg-[#dcfce7] text-[#166534]" },
  rejected: { label: "已拒绝", className: "bg-[#fee2e2] text-[#991b1b]" },
  revoked: { label: "已停用", className: "bg-[#f1f5f9] text-[#475569]" },
};

const BTN = {
  primary:
    "rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0369a1] disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "rounded-lg border border-[#fecaca] bg-white px-3 py-1.5 text-xs font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] transition-colors hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-50",
  subtle:
    "rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] text-[#64748b] transition-colors hover:border-[#0284c7] hover:text-[#0284c7]",
};

const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatTs(ts: number | null): string {
  if (!ts) return "—";
  const parts = TIME_FORMATTER.formatToParts(new Date(ts * 1000));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}`;
}

function statusMeta(status: string): { label: string; className: string } {
  return (
    STATUS_META[status] ?? {
      label: status || "未知",
      className: "bg-[#f1f5f9] text-[#475569]",
    }
  );
}

function productLabel(product: string): string {
  return product === "alpha-desk" ? "Alpha Desk" : "API Key";
}

function productClass(product: string): string {
  return product === "alpha-desk"
    ? "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]"
    : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]";
}

export function AdminRequests({ requests, initialStatus, pendingCount, claimableCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<AdminStatusFilter>(initialStatus);
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [reason, setReason] = useState("");
  const [bindUserId, setBindUserId] = useState("");

  const counts = useMemo<Record<AdminStatusFilter, number>>(() => {
    const next: Record<AdminStatusFilter, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      all: requests.length,
    };
    for (const row of requests) {
      if (row.status === "pending" || row.status === "approved" || row.status === "rejected") {
        next[row.status] += 1;
      }
    }
    return next;
  }, [requests]);

  const visible = useMemo(
    () => (activeTab === "all" ? requests : requests.filter((row) => row.status === activeTab)),
    [activeTab, requests],
  );

  const actionsDisabled = Boolean(busy) || isPending;
  const activeRow = panel ? requests.find((row) => row.id === panel.rowId) : undefined;

  function refresh() {
    startTransition(() => router.refresh());
  }

  function selectTab(tab: AdminStatusFilter) {
    setActiveTab(tab);
    setPanel(null);
    setNotice(null);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (tab === "pending") url.searchParams.delete("status");
    else url.searchParams.set("status", tab);
    window.history.replaceState(null, "", url);
  }

  function closePanel() {
    setPanel(null);
    setReason("");
    setBindUserId("");
  }

  function openPanel(rowId: number, kind: PanelKind) {
    setNotice(null);
    setReason("");
    setBindUserId("");
    setPanel((current) =>
      current?.rowId === rowId && current.kind === kind ? null : { rowId, kind },
    );
  }

  async function runAction(
    row: AdminRequestRow,
    action: PanelKind,
    payload: Record<string, unknown>,
    successPrefix: string,
  ): Promise<void> {
    if (busy) return;
    setBusy({ rowId: row.id, action });
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/requests/${row.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as ActionPayload;
      if (!response.ok) {
        setNotice({
          kind: "error",
          text: data.hint || data.error || `操作失败（HTTP ${response.status}）`,
        });
        return;
      }

      const parts = [successPrefix];
      if (data.hint) parts.push(data.hint);
      if (data.old_key_note) parts.push(data.old_key_note);
      if (data.warning) parts.push(`注意：${data.warning}`);
      setNotice({ kind: "ok", text: parts.join(" ") });
      closePanel();
      startTransition(() => router.refresh());
    } catch {
      setNotice({ kind: "error", text: "网络错误，请稍后重试。" });
    } finally {
      setBusy(null);
    }
  }

  function approve(row: AdminRequestRow) {
    void runAction(row, "approve", {}, `已批准 ${row.reqNo}。`);
  }

  function reject(row: AdminRequestRow) {
    const text = reason.trim();
    if (!text) {
      setNotice({ kind: "error", text: "请填写拒绝理由。" });
      return;
    }
    void runAction(row, "reject", { reason: text }, `已拒绝 ${row.reqNo}。`);
  }

  function reissue(row: AdminRequestRow) {
    void runAction(row, "reissue", {}, `已改发 ${row.reqNo}。`);
  }

  function bind(row: AdminRequestRow) {
    const userId = bindUserId.trim();
    if (userId.startsWith("u_")) {
      setNotice({ kind: "error", text: "请填写不带 u_ 前缀的网站 user id。" });
      return;
    }
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(userId)) {
      setNotice({
        kind: "error",
        text: "user id 只能包含字母、数字、下划线和连字符，长度 1–64。",
      });
      return;
    }
    void runAction(
      row,
      "bind",
      { user_id: userId, tenant: `u_${userId}` },
      `已绑定 ${row.reqNo} → u_${userId}。`,
    );
  }

  function panelBody(row: AdminRequestRow, kind: PanelKind) {
    const rowBusy = busy?.rowId === row.id;
    if (kind === "approve") {
      return (
        <div className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff] p-4">
          <p className="text-sm text-[#0c4a6e]">
            批准后会为申请人创建密钥，申请人可凭申请单号领取。确认批准{" "}
            <span className="font-mono font-semibold">{row.reqNo}</span>？
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN.primary}
              disabled={actionsDisabled}
              onClick={() => approve(row)}
            >
              {rowBusy && busy?.action === "approve" ? "批准中…" : "确认批准"}
            </button>
            <button type="button" className={BTN.ghost} disabled={actionsDisabled} onClick={closePanel}>
              取消
            </button>
          </div>
        </div>
      );
    }

    if (kind === "reject") {
      return (
        <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={`reject-reason-${row.id}`} className="text-xs font-medium text-[#7f1d1d]">
              拒绝理由（会展示给申请人）
            </label>
            <span className="text-[11px] text-[#b91c1c]">{reason.length}/300</span>
          </div>
          <textarea
            id={`reject-reason-${row.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            rows={3}
            placeholder="例如：用途不明确，请补充具体使用场景"
            className="mt-2 w-full resize-y rounded-lg border border-[#fecaca] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#dc2626] focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "用途不明确，请补充具体使用场景",
              "联系方式无法验证",
              "当前暂不开放该分组",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={BTN.subtle}
                onClick={() => setReason(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN.danger}
              disabled={actionsDisabled || !reason.trim()}
              onClick={() => reject(row)}
            >
              {rowBusy && busy?.action === "reject" ? "拒绝中…" : "确认拒绝"}
            </button>
            <button type="button" className={BTN.ghost} disabled={actionsDisabled} onClick={closePanel}>
              取消
            </button>
          </div>
        </div>
      );
    }

    if (kind === "reissue") {
      return (
        <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4">
          <p className="text-sm text-[#78350f]">
            改发会新建一把密钥并停用当前密钥，分组沿用已批准的分组。确认改发{" "}
            <span className="font-mono font-semibold">{row.reqNo}</span>？
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN.primary}
              disabled={actionsDisabled}
              onClick={() => reissue(row)}
            >
              {rowBusy && busy?.action === "reissue" ? "改发中…" : "确认改发"}
            </button>
            <button type="button" className={BTN.ghost} disabled={actionsDisabled} onClick={closePanel}>
              取消
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff] p-4">
        <label htmlFor={`bind-user-${row.id}`} className="text-xs font-medium text-[#0c4a6e]">
          网站 user id（不要带 u_ 前缀）
        </label>
        <input
          id={`bind-user-${row.id}`}
          value={bindUserId}
          onChange={(event) => setBindUserId(event.target.value)}
          maxLength={64}
          placeholder="例如 clx1a2b3c4d5e6f7g8h9i0jkl"
          className="mt-2 w-full max-w-md rounded-lg border border-[#bae6fd] bg-white px-3 py-2 font-mono text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#0284c7] focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-[#0369a1]">
          绑定后 tenant 记为 <span className="font-mono">u_&lt;id&gt;</span>。Alpha Desk 申请只有绑定后才能领取。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={BTN.primary}
            disabled={actionsDisabled || !bindUserId.trim()}
            onClick={() => bind(row)}
          >
            {rowBusy && busy?.action === "bind" ? "绑定中…" : "确认绑定"}
          </button>
          <button type="button" className={BTN.ghost} disabled={actionsDisabled} onClick={closePanel}>
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4">
          <p className="text-xs font-medium text-[#94a3b8]">待审批</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">{pendingCount}</p>
          <p className="mt-0.5 text-xs text-[#64748b]">全库待处理</p>
        </div>
        <div className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4">
          <p className="text-xs font-medium text-[#94a3b8]">待领取密钥</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">{claimableCount}</p>
          <p className="mt-0.5 text-xs text-[#64748b]">审批通过、尚未领取</p>
        </div>
        <div className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4">
          <p className="text-xs font-medium text-[#94a3b8]">最近加载</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">{requests.length}</p>
          <p className="mt-0.5 text-xs text-[#64748b]">最多 300 条</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">申请列表</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            批准会创建密钥；拒绝理由会展示给申请人。所有操作都经服务端代理。
          </p>
        </div>
        <button
          type="button"
          className={BTN.ghost}
          disabled={actionsDisabled}
          onClick={refresh}
        >
          {isPending ? "刷新中…" : "刷新列表"}
        </button>
      </div>

      <div
        role="tablist"
        aria-label="申请状态筛选"
        className="mt-5 inline-flex flex-wrap gap-1 rounded-xl border border-[#e2e8f0] bg-white p-1"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#0f172a] text-white"
                  : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] ${
                  active ? "bg-white/15 text-white" : "bg-[#f1f5f9] text-[#64748b]"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
            notice.kind === "error"
              ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
              : "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
          }`}
        >
          <p className="min-w-0 break-words">{notice.text}</p>
          <button
            type="button"
            aria-label="关闭提示"
            className="shrink-0 rounded p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
            onClick={() => setNotice(null)}
          >
            &times;
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-6 py-16 text-center">
          <p className="text-sm font-medium text-[#0f172a]">
            {requests.length === 0
              ? "还没有申请"
              : `暂无${TABS.find((tab) => tab.key === activeTab)?.label ?? ""}申请`}
          </p>
          <p className="mt-1 text-sm text-[#64748b]">
            {requests.length === 0
              ? "申请人提交后，这里会出现新的记录。"
              : "切换上方标签查看其他状态的申请。"}
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                  <th className="px-4 py-3 font-semibold">申请单号</th>
                  <th className="px-4 py-3 font-semibold">申请内容</th>
                  <th className="px-4 py-3 font-semibold">状态</th>
                  <th className="px-4 py-3 font-semibold">绑定账号 / 租户</th>
                  <th className="px-4 py-3 font-semibold">时间</th>
                  <th className="px-4 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const meta = statusMeta(row.status);
                  const groups = row.grantedGroups.length ? row.grantedGroups : row.requestedGroups;
                  const bound = Boolean(row.boundUserId);
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-b border-[#f1f5f9] align-top transition-colors last:border-0 hover:bg-[#fcfdff]">
                        <td className="px-4 py-4">
                          <div className="font-mono text-xs font-semibold text-[#0f172a]">
                            {row.reqNo || `#${row.id}`}
                          </div>
                          <span
                            className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${productClass(row.product)}`}
                          >
                            {productLabel(row.product)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-[#0f172a]">{row.name || "未填写称呼"}</span>
                            {row.volume ? (
                              <span className="text-[11px] text-[#94a3b8]">预计量：{row.volume}</span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-[#64748b]">
                            {row.contact || "未留联系方式"}
                          </div>
                          <p
                            className="mt-1.5 line-clamp-3 max-w-[24rem] whitespace-pre-wrap break-words text-xs leading-5 text-[#475569]"
                            title={row.purpose || undefined}
                          >
                            {row.purpose || "未填用途"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {groups.length ? (
                              groups.map((group) => (
                                <span
                                  key={group}
                                  className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] text-[#475569]"
                                >
                                  {group}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-[#94a3b8]">未选分组</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                          {row.status === "rejected" && row.rejectReason ? (
                            <p className="mt-2 max-w-[14rem] break-words text-xs text-[#991b1b]">
                              理由：{row.rejectReason}
                            </p>
                          ) : null}
                          {row.status === "approved" ? (
                            <p className="mt-2 text-xs text-[#64748b]">
                              {row.tokenPending
                                ? "待领取"
                                : row.pickedAt
                                  ? `已领取 ${formatTs(row.pickedAt)}`
                                  : "密钥不可领取"}
                            </p>
                          ) : null}
                          {row.mcKeyName ? (
                            <p className="mt-1 break-all font-mono text-[11px] text-[#94a3b8]">
                              {row.mcKeyName}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-4">
                          {bound ? (
                            <div>
                              <div className="font-mono text-xs font-medium text-[#0f172a]">
                                {row.tenant || `u_${row.boundUserId}`}
                              </div>
                              <div className="mt-0.5 break-all font-mono text-[11px] text-[#94a3b8]">
                                {row.boundUserId}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-[#94a3b8]">未绑定</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-[#64748b]">
                          <div>提交 {formatTs(row.createdAt)}</div>
                          {row.decidedAt ? (
                            <div className="mt-1 text-[#94a3b8]">审批 {formatTs(row.decidedAt)}</div>
                          ) : null}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {row.status === "pending" ? (
                              <>
                                <button
                                  type="button"
                                  className={BTN.primary}
                                  disabled={actionsDisabled}
                                  onClick={() => openPanel(row.id, "approve")}
                                  aria-expanded={panel?.rowId === row.id && panel.kind === "approve"}
                                >
                                  批准
                                </button>
                                <button
                                  type="button"
                                  className={BTN.danger}
                                  disabled={actionsDisabled}
                                  onClick={() => openPanel(row.id, "reject")}
                                  aria-expanded={panel?.rowId === row.id && panel.kind === "reject"}
                                >
                                  拒绝
                                </button>
                              </>
                            ) : null}
                            {row.status === "approved" ? (
                              <button
                                type="button"
                                className={BTN.ghost}
                                disabled={actionsDisabled}
                                onClick={() => openPanel(row.id, "reissue")}
                                aria-expanded={panel?.rowId === row.id && panel.kind === "reissue"}
                              >
                                改发
                              </button>
                            ) : null}
                            {!bound ? (
                              <button
                                type="button"
                                className={BTN.ghost}
                                disabled={actionsDisabled}
                                onClick={() => openPanel(row.id, "bind")}
                                aria-expanded={panel?.rowId === row.id && panel.kind === "bind"}
                              >
                                绑定
                              </button>
                            ) : null}
                            {row.status !== "pending" && row.status !== "approved" && bound ? (
                              <span className="text-xs text-[#94a3b8]">无操作</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {panel?.rowId === row.id && activeRow ? (
                        <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] last:border-0">
                          <td colSpan={6} className="px-4 py-4">
                            {panelBody(activeRow, panel.kind)}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-[#94a3b8]">
        申请数据来自 quota-platform；管理令牌仅保存在服务端，浏览器不会接触。
      </p>
    </section>
  );
}
