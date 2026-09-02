import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CommentForm } from "./comment-form";
import { getLang, t } from "@/lib/i18n";

export async function Comments({ slug }: { slug: string }) {
  const lang = await getLang();
  const d = t(lang);
  const [session, comments] = await Promise.all([
    auth(),
    prisma.comment.findMany({
      where: { postSlug: slug },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
      take: 100,
    }),
  ]);

  return (
    <section className="mt-14 border-t border-[#e2e8f0] pt-8">
      <h2 className="text-xl font-semibold text-[#0f172a]">{d.comments} ({comments.length})</h2>
      <div className="mt-6">
        {session?.user ? (
          <CommentForm
            slug={slug}
            labels={{ placeholder: d.commentPlaceholder, post: d.postComment, posting: d.posting }}
          />
        ) : (
          <p className="text-sm text-[#64748b]">
            <a href="/api/auth/signin" className="text-[#0284c7] hover:underline">
              {d.signinGithub}
            </a>
            {d.signinToComment}
          </p>
        )}
      </div>
      <ul className="mt-8 flex flex-col gap-5">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            {c.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.user.image} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#e2e8f0]" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-[#0f172a]">
                <span className="font-medium">{c.user.name ?? "GitHub user"}</span>{" "}
                <span className="text-xs text-[#94a3b8]">{c.createdAt.toISOString().slice(0, 10)}</span>
              </p>
              <p className="mt-1 text-sm text-[#334155] whitespace-pre-wrap break-words">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
