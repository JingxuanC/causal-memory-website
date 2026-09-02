import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, getPosts, renderMarkdown } from "@/lib/markdown";
import { Comments } from "@/components/comments";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post?.title, description: post?.description };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const html = await renderMarkdown(post.body);
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <p className="text-xs font-mono text-[#5a719c]">{post.date}</p>
      <article className="prose-cm mt-4" dangerouslySetInnerHTML={{ __html: html }} />
      <Comments slug={slug} />
    </div>
  );
}
