import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { fetchQuotaMonitor, formatTime } from "@/lib/quota-monitor";
import { AdminTabs } from "@/components/admin-tabs";

export const metadata: Metadata = {
  title: "调用监控",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function pct(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function ms(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)}ms`;
}

function shortDate(date: string): string {
  const parts = date.split("-");
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : date;
}

export default async function AdminMonitorPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-24 text-center">
        <span className="rounded-full border border-[#0284c7] px-3 py-0.5 text-xs font-semibold text-[#0284c7]">
          ADMIN
        </span>
        <h1 className="mt-4 text-2xl font-bold text-[#0f172a]">调用监控</h1>
        <p className="mt-3 text-sm text-[#64748b]">请用管理员账号登录</p>
        <a
          href="/api/auth/signin?callbackUrl=/admin/monitor"
          className="mt-8 inline-flex rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#1e293b]"
        >
          使用 GitHub 登录
        </a>
        <p className="mt-4 text-xs leading-5 text-[#94a3b8]">仅 ADMIN_EMAILS 中列出的邮箱可以访问此页面。</p>
      </main>
    );
  }
  if (!isAdmin(session)) {
    notFound();
  }

  const result = await fetchQuotaMonitor();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#0284c7] px-3 py-0.5 text-xs font-semibold text-[#0284c7]">
              ADMIN
            </span>
            <span className="text-xs text-[#94a3b8]">仅管理员可见</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0f172a]">调用监控</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#475569]">
            quota-platform 的实时调用、拦截、延迟与分组用量。数据直接来自 127.0.0.1:3300，不经过浏览器。
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-xs text-[#94a3b8]">当前管理员</p>
          <p className="mt-1 max-w-[18rem] break-words font-medium text-[#0f172a]">
            {session.user.email ?? session.user.name ?? "管理员"}
          </p>
          <Link href="/dashboard" className="mt-2 inline-block text-sm text-[#0284c7] hover:text-[#0369a1]">
            ← 返回控制台
          </Link>
        </div>
      </header>

      <AdminTabs active="monitor" />

      {result.ok ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "今日调用", value: result.state.today_calls.toLocaleString("zh-CN"), hint: `本月 ${result.state.month_calls.toLocaleString("zh-CN")}` },
              { label: "24h 拦截", value: result.state.blocks_24h.toLocaleString("zh-CN"), hint: "超出配额被拒绝的调用" },
              { label: "今日成功率", value: pct(result.state.today_success_rate), hint: `活跃 key ${result.state.today_keys} 个` },
              { label: "P50 延迟", value: ms(result.state.today_latency.p50), hint: "今日中位延迟" },
              { label: "P95 延迟", value: ms(result.state.today_latency.p95), hint: "今日尾部延迟" },
              { label: "库存 key", value: String(result.state.inventory.length), hint: `待审批 ${result.state.pending_requests} · 待领取 ${result.state.claimable_tokens}` },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
                <p className="text-xs font-medium text-[#94a3b8]">{card.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">{card.value}</p>
                <p className="mt-1 text-xs text-[#64748b]">{card.hint}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 rounded-xl border border-[#e2e8f0] bg-white p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#0f172a]">最近 7 天调用</h2>
              <p className="text-xs text-[#94a3b8]">柱高=总调用，红色=拦截</p>
            </div>
            <div className="mt-6 flex h-48 items-end gap-4">
              {(() => {
                const points = result.state.series_7d;
                const max = Math.max(1, ...points.map((p) => p.total));
                return points.map((point) => (
                  <div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-medium text-[#475569]">{point.total}</span>
                    <div className="relative flex w-full max-w-14 flex-1 items-end justify-center">
                      <div
                        className="w-full rounded-t-md bg-[#7dd3fc]"
                        style={{ height: `${Math.max(2, Math.round((point.total / max) * 100))}%` }}
                        title={`${point.date}: ${point.total} 次`}
                      />
                      {point.blocked > 0 && (
                        <div
                          className="absolute bottom-0 left-1/2 w-full max-w-14 -translate-x-1/2 rounded-t-md bg-[#f87171]"
                          style={{ height: `${Math.max(2, Math.round((point.blocked / max) * 100))}%` }}
                          title={`拦截 ${point.blocked} 次`}
                        />
                      )}
                    </div>
                    <span className="text-xs text-[#94a3b8]">{shortDate(point.date)}</span>
                  </div>
                ));
              })()}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#0f172a]">今日分组用量</h2>
              <div className="mt-4 space-y-3">
                {result.state.group_usage.length === 0 && <p className="text-sm text-[#94a3b8]">今天还没有调用。</p>}
                {result.state.group_usage.map((group) => {
                  const max = Math.max(1, ...result.state.group_usage.map((g) => g.calls));
                  return (
                    <div key={group.group_name}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-mono text-[#0f172a]">{group.group_name}</span>
                        <span className="text-[#64748b]">{group.calls.toLocaleString("zh-CN")}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div className="h-full rounded-full bg-[#0284c7]" style={{ width: `${Math.max(2, Math.round((group.calls / max) * 100))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#0f172a]">最近拦截</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {result.state.recent_blocks.length === 0 && <li className="text-[#94a3b8]">最近 24h 没有拦截。</li>}
                {result.state.recent_blocks.slice(0, 8).map((block, index) => (
                  <li key={`${block.ts}-${index}`} className="flex items-baseline justify-between gap-3 border-b border-[#f8fafc] pb-2 last:border-0">
                    <span className="truncate font-mono text-xs text-[#0f172a]">{block.key_name || "—"}</span>
                    <span className="shrink-0 text-xs text-[#64748b]">{block.group_name} · {block.reason}</span>
                    <span className="shrink-0 text-xs text-[#94a3b8]">{formatTime(block.ts)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#0f172a]">最近调用</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-xs text-[#94a3b8]">
                    <th className="py-2 pr-3 font-medium">时间</th>
                    <th className="px-3 py-2 font-medium">Key</th>
                    <th className="px-3 py-2 font-medium">分组</th>
                    <th className="px-3 py-2 font-medium">工具</th>
                    <th className="px-3 py-2 font-medium">状态</th>
                    <th className="px-3 py-2 text-right font-medium">延迟</th>
                  </tr>
                </thead>
                <tbody>
                  {result.calls.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-[#94a3b8]">没有调用记录。</td></tr>
                  )}
                  {result.calls.map((call) => (
                    <tr key={call.id} className="border-b border-[#f8fafc] last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-[#64748b]">{formatTime(call.ts)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[#0f172a]">{call.key_name || "—"}</td>
                      <td className="px-3 py-2 text-xs text-[#475569]">{call.group_name || "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[#475569]">{call.tool || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={call.status === "ok" ? "rounded-full bg-[#ecfdf5] px-2 py-0.5 text-xs text-[#047857]" : "rounded-full bg-[#fef2f2] px-2 py-0.5 text-xs text-[#b91c1c]"}>
                          {call.status}{call.reason ? ` · ${call.reason}` : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-[#64748b]">{Math.round(call.latency_ms)}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="mt-8 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6">
          <h2 className="text-lg font-semibold text-[#991b1b]">无法加载监控数据</h2>
          <p className="mt-2 text-sm text-[#7f1d1d]">{result.hint}</p>
          <p className="mt-2 font-mono text-xs text-[#b91c1c]">{result.error} · HTTP {result.status}</p>
          <Link href="/admin/monitor" className="mt-4 inline-flex rounded-md border border-[#fecaca] bg-white px-4 py-2 text-sm font-semibold text-[#991b1b] hover:bg-[#fff1f2]">
            重试
          </Link>
        </section>
      )}
    </main>
  );
}
