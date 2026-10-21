import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { integrationBySlug, integrations } from "@/data/seo/integrations";
import { SeoShell, Section, Prose, Bullets } from "@/components/seo/seo-shell";
import { FaqSection } from "@/components/seo/faq-section";
import { CodeBlock } from "@/components/seo/code-block";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return integrations.map((integration) => ({ slug: integration.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const integration = integrationBySlug.get(slug);
  if (!integration) return {};
  return buildSeoMetadata({
    path: `/integrations/${integration.slug}`,
    title: integration.seoTitle,
    description: integration.description,
    updatedAt: integration.updatedAt,
  });
}

export default async function IntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const integration = integrationBySlug.get(slug);
  if (!integration) notFound();

  const path = `/integrations/${integration.slug}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: integration.name, href: path },
  ];

  return (
    <SeoShell
      kicker="INTEGRATION"
      title={integration.title}
      subtitle={integration.tagline}
      crumbs={crumbs}
      updatedAt={integration.updatedAt}
      related={integration.related}
      cta={{
        title: `Wire it into ${integration.name} in about three minutes`,
        body: "No account, no API key and no service to operate for local use — one binary and one SQLite file.",
      }}
      jsonLd={[
        articleJsonLd({
          path,
          title: integration.seoTitle,
          description: integration.description,
          updatedAt: integration.updatedAt,
          section: "Integration",
          keywords: ["agent memory", integration.name, "MCP server", "causal memory", "setup"],
        }),
        faqJsonLd(integration.faq, path),
        breadcrumbJsonLd(crumbs),
      ]}
    >
      <Section title="Before you start">
        <Prose>
          <p>{integration.prerequisite}</p>
        </Prose>
      </Section>

      <Section title="Three steps" lead="Each step is idempotent; re-running it updates the registration instead of duplicating it.">
        <ol className="space-y-3">
          {integration.steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[44px_1fr] gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eff6ff] font-mono text-sm font-bold text-[#0284c7]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-base font-semibold text-[#0f172a]">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#64748b]">{step.body}</p>
                {step.code ? (
                  <code className="mt-2 inline-block max-w-full overflow-x-auto rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 font-mono text-xs text-[#0f172a]">
                    {step.code}
                  </code>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Configuration" lead="Copy the block, replace nothing if the binary is on PATH, and restart the client once.">
        <CodeBlock title={integration.config.title} language={integration.config.language} code={integration.config.code} />
      </Section>

      <Section
        title="The five tools to learn first"
        lead="Seventeen tools are mounted. These five cover the loop: recall, record, warn, attribute, compare."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {integration.tools.map((tool) => (
            <div key={tool.name} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
              <code className="font-mono text-sm font-semibold text-[#0284c7]">{tool.name}</code>
              <p className="mt-1.5 text-sm leading-6 text-[#64748b]">{tool.what}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Gotchas worth knowing">
        <Bullets items={integration.notes} />
      </Section>

      <FaqSection faq={integration.faq} title={`${integration.name} setup questions`} />
    </SeoShell>
  );
}
