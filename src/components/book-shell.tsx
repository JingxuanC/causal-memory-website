"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type ChapterRef = { slug: string; title: string };

function activeSlug(pathname: string): string | null {
  const m = pathname.match(/^\/book\/(.+)$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

function ChapterLink({ ch, active }: { ch: ChapterRef; active: boolean }) {
  return (
    <Link
      href={`/book/${encodeURIComponent(ch.slug)}`}
      className={`block rounded-md px-3 py-1.5 text-sm leading-snug transition-colors ${
        active
          ? "bg-[#e0f2fe] font-medium text-[#0369a1]"
          : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
      }`}
    >
      {ch.title}
    </Link>
  );
}

export function BookShell({
  chapters,
  children,
}: {
  chapters: ChapterRef[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = activeSlug(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-6xl items-start gap-8 px-6">
      {/* Desktop: sticky left TOC */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto py-10 pr-2 lg:block">
        <Link
          href="/book"
          className="mb-3 block px-3 text-xs font-semibold uppercase tracking-wide text-[#94a3b8] hover:text-[#64748b]"
        >
          高性价比人生指南
        </Link>
        <nav className="flex flex-col gap-0.5">
          {chapters.map((ch) => (
            <ChapterLink key={ch.slug} ch={ch} active={ch.slug === current} />
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile: collapsible TOC above content */}
        <div className="pt-6 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            className="flex w-full items-center justify-between rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a]"
          >
            <span>目录 · 高性价比人生指南</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className={mobileOpen ? "rotate-180 transition-transform" : "transition-transform"}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {mobileOpen && (
            <nav className="mt-1 flex max-h-80 flex-col gap-0.5 overflow-y-auto rounded-md border border-[#e2e8f0] bg-white p-2">
              {chapters.map((ch) => (
                <span key={ch.slug} onClick={() => setMobileOpen(false)}>
                  <ChapterLink ch={ch} active={ch.slug === current} />
                </span>
              ))}
            </nav>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
