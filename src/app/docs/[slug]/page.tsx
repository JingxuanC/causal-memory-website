import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDoc, getDocs, renderMarkdown } from "@/lib/markdown";

export function generateStaticParams() {
  return getDocs().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  return { title: doc?.title, description: doc?.description };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  const html = await renderMarkdown(doc.body);
  return <article className="prose-cm max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />;
}
