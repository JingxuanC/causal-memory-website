import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminTabs } from "@/components/admin-tabs";

export const metadata: Metadata = {
  title: "访问统计",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight in Asia/Shanghai for `offsetDays` ago. */
function shanghaiDayStart(offsetDays = 0): Date {
  const now = new Date();
  const shifted = new Date(now.getTime() + TZ_OFFSET_MS);
  const start = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - TZ_OFFSET_MS;
  return new Date(start - offsetDays * DAY_MS);
}

function dayKey(date: Date): string {
  const shifted = new Date(date.getTime() + TZ_OFFSET_MS);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function hostOf(referrer: string): string {
  if (!referrer) return "直接访问";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "其他";
  }
}

async function loadStats() {
  const todayStart = shanghaiDayStart(0);
  const weekStart = shanghaiDayStart(6);
  const [pvToday, uvTodayRows, weekRows, topPaths, devices, countries, recent] = await Promise.all([
    prisma.pageview.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.pageview.findMany({ where: { createdAt: { gte: todayStart } }, select: { ipHash: true } }),
    prisma.pageview.findMany({ where: { createdAt: { gte: weekStart } }, select: { createdAt: true, ipHash: true, referrer: true } }),
    prisma.pageview.groupBy({ by: ["path"], where: { createdAt: { gte: weekStart } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
    prisma.pageview.groupBy({ by: ["device"], where: { createdAt: { gte: weekStart } }, _count: { _all: true } }),
    prisma.pageview.groupBy({ by: ["country"], where: { createdAt: { gte: weekStart } }, _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 8 }),
    prisma.pageview.findMany({ where: { createdAt: { gte: weekStart } }, select: { path: true, referrer: true }, take: 2000 }),
  ]);

  const days: { key: string; pv: number; uv: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    days.push({ key: dayKey(shanghaiDayStart(i)), pv: 0, uv: 0 });
  }
  const dayUv = new Map<string, Set<string>>();
  const referrers = new Map<string, number>();
  for (const row of weekRows) {
    const key = dayKey(row.createdAt);
    const bucket = days.find((d) => d.key === key);
    if (bucket) bucket.pv += 1;
    if (!dayUv.has(key)) dayUv.set(key, new Set());
    dayUv.get(key)?.add(row.ipHash);
    const host = hostOf(row.referrer);
    referrers.set(host, (referrers.get(host) ?? 0) + 1);
  }
  for (const day of days) day.uv = dayUv.get(day.key)?.size ?? 0;

  return {
    pvToday,
    uvToday: new Set(uvTodayRows.map((row) => row.ipHash)).size,
    pv7d: weekRows.length,
    uv7d: new Set(weekRows.map((row) => row.ipHash)).size,
    days,
    topPaths: topPaths.map((row) => ({ path: row.path, count: row._count._all })),
    devices: devices.map((row) => ({ device: row.device || "unknown", count: row._count._all })),
    countries: countries.map((row) => ({ country: row.country || "—", count: row._count._all })).filter((row) => row.count > 0),
    referrers: [...referrers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    recent: recent.length,
  };
}

export default async function AdminTrafficPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-24 text-center">
        <span className="rounded-full border border-[#0284c7] px-3 py-0.5 text-xs font-semibold text-[#0284c7]">ADMIN</span>
        <h1 className="mt-4 text-2xl font-bold text-[#0f172a]">访问统计</h1>
        <p className="mt-3 text-sm text-[#64748b]">请用管理员账号登录</p>
        <a href="/api/auth/signin?callbackUrl=/admin/traffic" className="mt-8 inline-flex rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#1e293b]">
          使用 GitHub 登录
        </a>
        <p className="mt-4 text-xs leading-5 text-[#94a3b8]">仅 ADMIN_EMAILS 中列出的邮箱可以访问此页面。</p>
      </main>
    );
  }
  if (!isAdmin(session)) notFound();

  let stats: Awaited<ReturnType<typeof loadStats>> | null = null;
  let error: string | null = null;
  try {
    stats = await loadStats();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#0284c7] px-3 py-0.5 text-xs font-semibold text-[#0284c7]">ADMIN</span>
            <span className="text-xs text-[#94a3b8]">仅管理员可见</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0f172a]">访问统计</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#475569]">
            官网第一方统计：不写 cookie，IP / UA 只存加盐哈希。爬虫与 /admin、/api 请求不计入。
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-xs text-[#94a3b8]">当前管理员</p>
          <p className="mt-1 max-w-[18rem] break-words font-medium text-[#0f172a]">{session.user.email ?? "管理员"}</p>
          <Link href="/dashboard" className="mt-2 inline-block text-sm text-[#0284c7] hover:text-[#0369a1]">← 返回控制台</Link>
        </div>
      </header>

      <AdminTabs active="traffic" />

      {error && (
        <section className="mt-8 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6">
          <h2 className="text-lg font-semibold text-[#991b1b]">无法加载访问数据</h2>
          <p className="mt-2 text-sm text-[#7f1d1d]">{error}</p>
          <p className="mt-2 text-xs text-[#b91c1c]">若提示表不存在，需要在服务器执行 npx prisma db push 建 Pageview 表。</p>
        </section>
      )}

      {stats && (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "今日 PV", value: stats.pvToday.toLocaleString("zh-CN"), hint: "页面浏览量" },
              { label: "今日 UV", value: stats.uvToday.toLocaleString("zh-CN"), hint: "按 IP 哈希去重" },
              { label: "7 日 PV", value: stats.pv7d.toLocaleString("zh-CN"), hint: "近 7 天合计" },
              { label: "7 日 UV", value: stats.uv7d.toLocaleString("zh-CN"), hint: "近 7 天去重" },
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
              <h2 className="text-lg font-semibold text-[#0f172a]">最近 7 天访问</h2>
              <p className="text-xs text-[#94a3b8]">柱高=PV · 折线=UV</p>
            </div>
            <div className="mt-6 flex h-48 items-end gap-4">
              {(() => {
                const max = Math.max(1, ...stats.days.map((d) => Math.max(d.pv, d.uv)));
                return stats.days.map((day) => (
                  <div key={day.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-medium text-[#475569]">{day.pv}</span>
                    <div className="relative flex w-full max-w-14 flex-1 items-end justify-center">
                      <div className="w-full rounded-t-md bg-[#7dd3fc]" style={{ height: `${Math.max(2, Math.round((day.pv / max) * 100))}%` }} title={`PV ${day.pv} / UV ${day.uv}`} />
                      <div className="absolute bottom-0 w-1.5 rounded-full bg-[#0284c7]" style={{ height: `${Math.max(2, Math.round((day.uv / max) * 100))}%` }} />
                    </div>
                    <span className="text-xs text-[#94a3b8]">{day.key}</span>
                  </div>
                ));
              })()}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#0f172a]">热门页面（7 天）</h2>
              <div className="mt-4 space-y-3">
                {stats.topPaths.length === 0 && <p className="text-sm text-[#94a3b8]">还没有访问数据。</p>}
                {stats.topPaths.map((row) => {
                  const max = Math.max(1, ...stats.topPaths.map((p) => p.count));
                  return (
                    <div key={row.path}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-mono text-[#0f172a]">{row.path}</span>
                        <span className="shrink-0 text-[#64748b]">{row.count}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div className="h-full rounded-full bg-[#0284c7]" style={{ width: `${Math.max(2, Math.round((row.count / max) * 100))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#0f172a]">来源（7 天）</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {stats.referrers.length === 0 && <li className="text-[#94a3b8]">还没有来源数据。</li>}
                {stats.referrers.map(([host, count]) => (
                  <li key={host} className="flex items-baseline justify-between gap-3 border-b border-[#f8fafc] pb-2 last:border-0">
                    <span className="truncate text-[#475569]">{host}</span>
                    <span className="shrink-0 text-[#64748b]">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#0f172a]">设备（7 天）</h2>
              <div className="mt-4 space-y-3">
                {stats.devices.length === 0 && <p className="text-sm text-[#94a3b8]">暂无数据。</p>}
                {stats.devices.map((row) => {
                  const total = Math.max(1, stats.devices.reduce((sum, item) => sum + item.count, 0));
                  return (
                    <div key={row.device}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-[#0f172a]">{row.device === "mobile" ? "手机" : row.device === "tablet" ? "平板" : row.device === "desktop" ? "桌面" : "未知"}</span>
                        <span className="text-[#64748b]">{row.count}（{Math.round((row.count / total) * 100)}%）</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div className="h-full rounded-full bg-[#0d9488]" style={{ width: `${Math.max(2, Math.round((row.count / total) * 100))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#0f172a]">地区（7 天）</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {stats.countries.length === 0 && <li className="text-[#94a3b8]">服务器未提供国家头（可在 nginx 配 GeoIP）。</li>}
                {stats.countries.map((row) => (
                  <li key={row.country} className="flex items-baseline justify-between gap-3 border-b border-[#f8fafc] pb-2 last:border-0">
                    <span className="text-[#475569]">{row.country}</span>
                    <span className="text-[#64748b]">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
