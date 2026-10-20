import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-widest text-[#94a3b8]">404</p>
      <h1 className="mt-3 text-2xl font-bold text-[#0f172a]">页面不存在</h1>
      <p className="mt-2 text-sm text-[#64748b]">该页面不存在，或链接已失效。</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#1e293b]"
      >
        返回首页
      </Link>
    </main>
  );
}
