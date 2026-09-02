import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CommentForm } from "./comment-form";

export async function Comments({ slug }: { slug: string }) {
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
    <section className="mt-14 border-t border-[#1d3a5f] pt-8">
      <h2 className="text-xl font-semibold text-[#e8f1ff]">Comments ({comments.length})</h2>
      <div className="mt-6">
        {session?.user ? (
          <CommentForm slug={slug} />
        ) : (
          <p className="text-sm text-[#93a7c4]">
            <a href="/api/auth/signin" className="text-[#4cc2ff] hover:underline">
              Sign in with GitHub
            </a>{" "}
            to leave a comment.
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
              <div className="h-8 w-8 rounded-full bg-[#1d3a5f]" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-[#e8f1ff]">
                <span className="font-medium">{c.user.name ?? "GitHub user"}</span>{" "}
                <span className="text-xs text-[#5a719c]">{c.createdAt.toISOString().slice(0, 10)}</span>
              </p>
              <p className="mt-1 text-sm text-[#c6d2e6] whitespace-pre-wrap break-words">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
