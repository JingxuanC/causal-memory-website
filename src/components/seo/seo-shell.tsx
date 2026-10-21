import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd, type JsonLdObject } from "./json-ld";
import { RelatedLinks } from "./related-links";
import { CtaBlock } from "./cta-block";

export type Crumb = { name: string; href: string };

type SeoShellProps = {
  kicker: string;
  title: string;
  subtitle: string;
  crumbs: Crumb[];
  updatedAt?: string;
  related?: string[];
  cta?: { title?: string; body?: string };
  jsonLd?: JsonLdObject[];
  children: ReactNode;
};

/**
 * Shared frame for every pSEO page: breadcrumbs, H1, subtitle, the body, the
 * context links and the CTA. Pages only own their content sections.
 */
export function SeoShell({
  kicker,
  title,
  subtitle,
  crumbs,
  updatedAt,
  related,
  cta,
  jsonLd,
  children,
}: SeoShellProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      {jsonLd && jsonLd.length > 0 ? <JsonLd data={jsonLd} /> : null}

      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#94a3b8]">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-[#64748b]">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.href} className="transition-colors hover:text-[#0f172a]">
                    {crumb.name}
                  </Link>
                )}
                {!last ? <span aria-hidden="true">/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0284c7]">{kicker}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0f172a] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#475569]">{subtitle}</p>
        {updatedAt ? (
          <p className="mt-4 text-xs text-[#94a3b8]">
            Updated <time dateTime={updatedAt}>{updatedAt}</time> · English
          </p>
        ) : null}
      </header>

      {children}

      {related && related.length > 0 ? <RelatedLinks hrefs={related} /> : null}

      <CtaBlock title={cta?.title} body={cta?.body} />
    </div>
  );
}

/** A content section with a consistent H2 rhythm. */
export function Section({
  id,
  title,
  lead,
  children,
}: {
  id?: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">{title}</h2>
      {lead ? <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#475569]">{lead}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Long-form body copy. Keeps paragraph colour and measure in one place. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-[15px] leading-7 text-[#475569]">{children}</div>;
}

/** Bulleted list with the site's marker. */
export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-[15px] leading-7 text-[#475569]">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#0284c7]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Definition-style card used for "when to choose them / us". */
export function ChoiceColumns({
  them,
  us,
  themName,
}: {
  them: string[];
  us: string[];
  themName: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6">
        <h3 className="text-sm font-semibold text-[#0f172a]">Choose {themName} when</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#64748b]">
          {them.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-[#94a3b8]">–</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-6">
        <h3 className="text-sm font-semibold text-[#0f172a]">Choose causal-memory when</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#334155]">
          {us.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-[#0284c7]">+</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
