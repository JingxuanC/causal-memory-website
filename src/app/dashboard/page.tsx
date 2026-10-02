import type { Metadata } from "next";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TokenManager } from "@/components/token-manager";
import { ByokManager } from "@/components/byok-manager";
import { PostEditor } from "@/components/post-editor";
import { isAdmin } from "@/lib/admin";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Cloud Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [session, lang] = await Promise.all([auth(), getLang()]);
  const d = t(lang);

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#0f172a]">{d.cloudSigninTitle}</h1>
        <p className="mt-3 text-sm text-[#64748b]">{d.cloudSigninSub}</p>
        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#1e293b] transition-colors"
          >
            {d.signinGithub}
          </button>
        </form>
      </div>
    );
  }

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: { id: true, name: true, prefix: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, byokKeyHint: true },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">{d.dashTitle}</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            {d.signedInAs}{" "}
            <span className="text-[#0f172a]">{session.user.name ?? session.user.email}</span>
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button className="rounded-md border border-[#cbd5e1] px-3 py-1.5 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors">
            {d.signOut}
          </button>
        </form>
      </div>

      <section className="mt-10 flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
        <p className="text-sm text-[#334155]">
          {d.currentPlan}:{" "}
          <span className="font-semibold text-[#0f172a] capitalize">{user?.plan ?? "free"}</span>
        </p>
        <Link href="/pricing" className="text-sm font-semibold text-[#0284c7] hover:text-[#0369a1]">
          {d.planUpgrade}
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[#0f172a]">{d.apiTokens}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{d.tokenSub}</p>
        <div className="mt-4">
          <TokenManager
            tokens={tokens.map((tk) => ({ ...tk, createdAt: tk.createdAt.toISOString() }))}
            labels={{
              tokenName: d.tokenName,
              createToken: d.createToken,
              creating: d.creating,
              tokenCreated: d.tokenCreated,
              copy: d.copy,
              copied: d.copied,
              revoke: d.revoke,
              noTokens: d.noTokens,
            }}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[#0f172a]">{d.byokTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{d.byokSub}</p>
        <div className="mt-4">
          <ByokManager
            hint={user?.byokKeyHint ?? null}
            labels={{
              byokPlaceholder: d.byokPlaceholder,
              byokSave: d.byokSave,
              byokSaving: d.byokSaving,
              byokSaved: d.byokSaved,
              byokClear: d.byokClear,
              byokCurrent: d.byokCurrent,
              byokNone: d.byokNone,
              byokError: d.byokError,
            }}
          />
        </div>
      </section>

      {isAdmin(session) && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[#0f172a]">{d.newPost}</h2>
          <p className="mt-1 mb-4 text-sm text-[#64748b]">{d.newPostSub}</p>
          <PostEditor
            labels={{
              fieldTitle: d.fieldTitle, fieldSlug: d.fieldSlug, fieldDesc: d.fieldDesc,
              fieldBody: d.fieldBody, publish: d.publish, publishing: d.publishing,
              published: d.published,
            }}
          />
        </section>
      )}

      <section className="mt-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
        <h2 className="text-lg font-semibold text-[#0f172a]">{d.connectAgent}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{d.connectSub}</p>
        <pre className="mt-3 text-xs bg-[#ffffff] border border-[#e2e8f0] rounded-md p-4 overflow-x-auto text-[#0369a1]">
{`{
  "mcpServers": {
    "causal-memory": {
      "url": "https://causal-memory.com/memory/mcp",
      "headers": { "Authorization": "Bearer cm_your_token" }
    }
  }
}`}
        </pre>
      </section>
    </div>
  );
}
