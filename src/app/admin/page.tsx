import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { AdminRequests } from "@/components/admin-requests";
import { fetchQuotaRequests, parseAdminStatus, toAdminRows } from "@/lib/quota-admin";

export const metadata: Metadata = {
  title: "申请审批管理后台",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-24 text-center">
        <span className="rounded-full border border-[#0284c7] px-3 py-0.5 text-xs font-semibold text-[#0284c7]">
          ADMIN
        </span>
        <h1 className="mt-4 text-2xl font-bold text-[#0f172a]">申请审批管理后台</h1>
        <p className="mt-3 text-sm text-[#64748b]">请用管理员账号登录</p>
        {/* Full-page navigation on purpose: /api/auth/signin is a route handler
            that redirects to the provider, which <Link> cannot follow. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/auth/signin?callbackUrl=/admin"
          className="mt-8 inline-flex rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#1e293b]"
        >
          使用 GitHub 登录
        </a>
        <p className="mt-4 text-xs leading-5 text-[#94a3b8]">
          仅 ADMIN_EMAILS 中列出的邮箱可以访问此页面。
        </p>
      </main>
    );
  }

  // Do not reveal that the console exists to signed-in non-admins, and do not
  // touch quota-platform before the admin check passes.
  if (!isAdmin(session)) {
    notFound();
  }

  const { status } = await searchParams;
  const initialStatus = parseAdminStatus(status);
  // Fetch every recent request once; the client tabs filter in memory so
  // switching tabs is instant and does not hit quota-platform again.
  const result = await fetchQuotaRequests("all");
  const adminEmail = session.user.email ?? session.user.name ?? "管理员";

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
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0f172a]">
            申请审批管理后台
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#475569]">
            审批 API Key / Alpha Desk 申请，查看绑定账号与密钥领取状态，并处理改发与账号绑定。
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-xs text-[#94a3b8]">当前管理员</p>
          <p className="mt-1 max-w-[18rem] break-words font-medium text-[#0f172a]">{adminEmail}</p>
          <Link
            href="/dashboard"
            className="mt-2 inline-block text-sm text-[#0284c7] transition-colors hover:text-[#0369a1]"
          >
            ← 返回控制台
          </Link>
        </div>
      </header>

      {result.ok ? (
        <AdminRequests
          requests={toAdminRows(result.data.requests)}
          initialStatus={initialStatus}
          pendingCount={result.data.pending_count}
          claimableCount={result.data.claimable_count}
        />
      ) : (
        <section className="mt-8 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-6">
          <h2 className="text-lg font-semibold text-[#991b1b]">无法加载申请列表</h2>
          <p className="mt-2 text-sm text-[#7f1d1d]">{result.hint}</p>
          <p className="mt-2 font-mono text-xs text-[#b91c1c]">
            {result.error} · HTTP {result.status}
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-flex rounded-md border border-[#fecaca] bg-white px-4 py-2 text-sm font-semibold text-[#991b1b] transition-colors hover:bg-[#fff1f2]"
          >
            重试
          </Link>
        </section>
      )}
    </main>
  );
}
