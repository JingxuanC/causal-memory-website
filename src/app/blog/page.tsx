import Link from "next/link";
import type { Metadata } from "next";
import { getPosts } from "@/lib/markdown";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogIndex() {
  const lang = await getLang();
  const d = t(lang);
  const posts = getPosts();
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0f172a]">{d.blogTitle}</h1>
      <p className="mt-2 text-[#64748b]">{d.blogSub}</p>
      <div className="mt-10 flex flex-col gap-8">
        {posts.map((p) => (
          <article key={p.slug} className="border-b border-[#e2e8f0] pb-8">
            <p className="text-xs font-mono text-[#94a3b8]">{p.date}</p>
            <Link href={`/blog/${p.slug}`}>
              <h2 className="mt-1 text-xl font-semibold text-[#0f172a] hover:text-[#0284c7] transition-colors">
                {p.title}
              </h2>
            </Link>
            <p className="mt-2 text-sm text-[#64748b]">{p.description}</p>
            <Link href={`/blog/${p.slug}`} className="mt-2 inline-block text-sm text-[#0284c7] hover:underline">
              {d.readMore}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
