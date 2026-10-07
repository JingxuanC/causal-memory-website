import Link from "next/link";
import type { Metadata } from "next";
import { getChapters } from "@/lib/markdown";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "高性价比人生指南",
  description: "528 条可核对的人生建议，每条写明成本、收益、证据等级和原始出处。",
};

export default async function BookIndex() {
  const lang = await getLang();
  const d = t(lang);
  const chapters = getChapters();
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0f172a]">{d.bookTitle}</h1>
      <p className="mt-3 text-[#64748b] leading-relaxed">{d.bookSub}</p>
      <p className="mt-3 text-sm text-[#94a3b8]">
        {d.bookSource}:{" "}
        <a
          href="https://github.com/eternity4719/HowToLiveBetter"
          target="_blank"
          rel="noopener"
          className="text-[#0284c7] hover:underline"
        >
          eternity4719/HowToLiveBetter
        </a>{" "}
        ·{" "}
        <a
          href="https://github.com/eternity4719/HowToLiveBetter/blob/main/LICENSE"
          target="_blank"
          rel="noopener"
          className="text-[#0284c7] hover:underline"
        >
          CC BY 4.0
        </a>
      </p>
      <ol className="mt-10 flex flex-col">
        {chapters.map((c) => (
          <li key={c.slug} className="border-b border-[#e2e8f0]">
            <Link
              href={`/book/${encodeURIComponent(c.slug)}`}
              className="block py-3 text-[#0f172a] hover:text-[#0284c7] transition-colors"
            >
              {c.title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
