import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useCaseBySlug, useCases } from "@/data/seo/use-cases";
import { SeoShell, Section, Prose, Bullets } from "@/components/seo/seo-shell";
import { FaqSection } from "@/components/seo/faq-section";
import { CodeBlock } from "@/components/seo/code-block";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return useCases.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const useCase = useCaseBySlug.get(slug);
  if (!useCase) return {};
  return buildSeoMetadata({
    path: `/use-cases/${useCase.slug}`,
    title: useCase.seoTitle,
    description: useCase.description,
    updatedAt: useCase.updatedAt,
  });
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const useCase = useCaseBySlug.get(slug);
  if (!useCase) notFound();

  const path = `/use-cases/${useCase.slug}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Use cases", href: "/use-cases" },
    { name: useCase.name, href: path },
  ];

  return (
    <SeoShell
      kicker="USE CASE"
      title={useCase.title}
      subtitle={useCase.tagline}
      crumbs={crumbs}
      updatedAt={useCase.updatedAt}
      related={useCase.related}
      cta={{
        title: "Run it on one real decision",
        body: "Record a decision you already made, add the outcome when you know it, and ask for it back a week later. That single loop is the whole evaluation.",
      }}
      jsonLd={[
        articleJsonLd({
          path,
          title: useCase.seoTitle,
          description: useCase.description,
          updatedAt: useCase.updatedAt,
          section: "Use case",
          keywords: ["agent memory", useCase.name, "causal memory", "MCP", "decision journal"],
        }),
        faqJsonLd(useCase.faq, path),
        breadcrumbJsonLd(crumbs),
      ]}
    >
      <Section title="Who this is for">
        <Prose>
          <p>{useCase.persona}</p>
        </Prose>
      </Section>

      <Section title="The failure mode it fixes" lead="These are not hypothetical; each one is a direct consequence of storing text instead of causal structure.">
        <ul className="grid gap-4 sm:grid-cols-2">
          {useCase.painPoints.map((point) => (
            <li key={point.label} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#0f172a]">{point.label}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{point.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How causal memory is used" lead="The loop is always the same three fields — decision, context, outcome — plus one rule: record after the outcome, not before.">
        <div className="space-y-8">
          {useCase.approach.map((section) => (
            <div key={section.heading}>
              <h3 className="text-lg font-semibold text-[#0f172a]">{section.heading}</h3>
              <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#475569]">{section.body}</p>
              <div className="mt-3">
                <Bullets items={section.bullets} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What the calls look like" lead="The same JSON shape works over stdio MCP, the HTTP transport and the DSH plugin.">
        <div className="space-y-2">
          {useCase.code.map((sample) => (
            <CodeBlock key={sample.title} title={sample.title} language={sample.language} code={sample.code} />
          ))}
        </div>
      </Section>

      <Section
        title="What to watch over three months"
        lead="Track these on your own data. The published numbers are benchmark baselines, not a promise about your repository or your incidents."
      >
        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Metrics to watch after adopting causal memory</caption>
            <thead className="bg-[#f1f5f9] text-[#0f172a]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Metric
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  How to read it
                </th>
              </tr>
            </thead>
            <tbody>
              {useCase.metrics.map((metric) => (
                <tr key={metric.label} className="border-t border-[#e2e8f0]">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-[#0f172a]">
                    {metric.label}
                  </th>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap text-[#0284c7]">{metric.value}</td>
                  <td className="px-4 py-3 text-[#64748b]">{metric.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[#94a3b8]">
          Benchmark figures come from the causal-memory README and CausalEval v13; see the{" "}
          <Link href="/benchmarks/causaleval" className="text-[#0284c7] hover:underline">
            CausalEval page
          </Link>{" "}
          for protocol and limitations.
        </p>
      </Section>

      <FaqSection faq={useCase.faq} title={`${useCase.name} questions`} />
    </SeoShell>
  );
}
