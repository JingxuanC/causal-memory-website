import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChapter, getChapters, renderMarkdown } from "@/lib/markdown";
import { Comments } from "@/components/comments";
import { ChapterChat } from "@/components/chapter-chat";
import { getLang, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Next 16 delivers dynamic params still percent-encoded (observed on
// Turbopack); decode so CJK chapter slugs match filenames. Falls back to
// the raw value if it is not valid percent-encoding.
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapter(decodeSlug(slug));
  return { title: chapter?.title };
}

export default async function BookChapter({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const chapter = getChapter(slug);
  if (!chapter) notFound();
  const lang = await getLang();
  const d = t(lang);
  const chapters = getChapters();
  const idx = chapters.findIndex((c) => c.slug === slug);
  const prev = idx > 0 ? chapters[idx - 1] : undefined;
  const next = idx < chapters.length - 1 ? chapters[idx + 1] : undefined;
  const html = await renderMarkdown(chapter.body);

  return (
    <div className="max-w-3xl mx-auto py-10">
      <p className="text-sm">
        <Link href="/book" className="text-[#0284c7] hover:underline">
          ← {d.bookTitle}
        </Link>
      </p>
      <article className="prose-cm mt-4" dangerouslySetInnerHTML={{ __html: html }} />
      <nav className="mt-12 flex items-center justify-between border-t border-[#e2e8f0] pt-6 text-sm">
        {prev ? (
          <Link href={`/book/${encodeURIComponent(prev.slug)}`} className="text-[#0284c7] hover:underline">
            {d.prevChapter} {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/book/${encodeURIComponent(next.slug)}`} className="text-[#0284c7] hover:underline">
            {next.title} {d.nextChapter}
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <ChapterChat
        slug={slug}
        labels={{
          title: d.chatTitle,
          sub: d.chatSub,
          placeholder: d.chatPlaceholder,
          send: d.chatSend,
          sending: d.chatSending,
          signin: d.chatSignin,
          signinGithub: d.signinGithub,
          noKey: d.chatNoKey,
          noKeyCta: d.chatNoKeyCta,
          error: d.chatError,
          clear: d.chatClear,
        }}
      />
      <Comments slug={`book:${slug}`} />
    </div>
  );
}
