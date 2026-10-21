import Link from "next/link";
import { resolveLinks, type SeoLinkGroup } from "@/data/seo";

const GROUP_ORDER: SeoLinkGroup[] = ["Comparison", "Use case", "Integration", "Overview", "Benchmark"];

/**
 * Contextual links for a pSEO page. Pages pass 4-8 paths; the registry supplies
 * the title and description so every card is real copy rather than a slug.
 */
export function RelatedLinks({
  hrefs,
  title = "Related",
  intro,
}: {
  hrefs: string[];
  title?: string;
  intro?: string;
}) {
  const resolved = resolveLinks(hrefs).map((entry) => entry.link);
  const groups = GROUP_ORDER.map((group) => ({
    group,
    links: resolved.filter((link) => link.group === group),
  })).filter((entry) => entry.links.length > 0);

  return (
    <section aria-labelledby="related" className="mt-14 scroll-mt-24">
      <h2 id="related" className="text-2xl font-bold tracking-tight text-[#0f172a]">
        {title}
      </h2>
      {intro ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">{intro}</p> : null}
      <div className="mt-5 space-y-6">
        {groups.map(({ group, links }) => (
          <div key={group}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">{group}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {links.map((link) => (
                <li key={`${group}-${link.href}`}>
                  <Link
                    href={link.href}
                    className="block h-full rounded-xl border border-[#e2e8f0] bg-white p-4 transition-colors hover:border-[#0284c7]"
                  >
                    <span className="block text-sm font-semibold text-[#0f172a]">{link.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#64748b]">{link.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
