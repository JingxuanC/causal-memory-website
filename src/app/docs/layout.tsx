import Link from "next/link";
import { getDocs } from "@/lib/markdown";
import { getLang, t } from "@/lib/i18n";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const d = t(lang);
  const docs = getDocs(lang);
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
      <aside className="hidden md:block w-56 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5a719c] mb-3">{d.docsLabel}</p>
        <nav className="flex flex-col gap-1.5 text-sm">
          {docs.map((d) => (
            <Link key={d.slug} href={`/docs/${d.slug}`} className="text-[#93a7c4] hover:text-[#e8f1ff] transition-colors">
              {d.title}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
