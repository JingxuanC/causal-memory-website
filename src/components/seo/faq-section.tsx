import type { FaqItem } from "@/data/seo/types";

/**
 * FAQ content is rendered as static HTML: no accordion, no client state, no
 * "read more". The answer text is in the initial response so it is indexable
 * and so FAQPage structured data never describes content that is not on the page.
 */
export function FaqSection({ faq, title = "FAQ" }: { faq: FaqItem[]; title?: string }) {
  return (
    <section aria-labelledby="faq" className="mt-12 scroll-mt-24">
      <h2 id="faq" className="text-2xl font-bold tracking-tight text-[#0f172a]">
        {title}
      </h2>
      <dl className="mt-5 space-y-3">
        {faq.map((item) => (
          <div key={item.q} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <dt className="text-sm font-semibold text-[#0f172a]">{item.q}</dt>
            <dd className="mt-2 text-sm leading-6 text-[#64748b]">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
