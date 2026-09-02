import type { Metadata } from "next";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TokenManager } from "@/components/token-manager";

export const metadata: Metadata = { title: "Cloud Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#e8f1ff]">causal-memory Cloud</h1>
        <p className="mt-3 text-sm text-[#93a7c4]">
          Sign in with GitHub to get your personal API token for the hosted memory service.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="rounded-md bg-[#e8f1ff] px-5 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-white transition-colors"
          >
            Sign in with GitHub
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e8f1ff]">Cloud Dashboard</h1>
          <p className="mt-1 text-sm text-[#93a7c4]">
            Signed in as <span className="text-[#e8f1ff]">{session.user.name ?? session.user.email}</span>
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button className="rounded-md border border-[#2b4f7c] px-3 py-1.5 text-xs text-[#93a7c4] hover:text-[#e8f1ff] transition-colors">
            Sign out
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[#e8f1ff]">API tokens</h2>
        <p className="mt-1 text-sm text-[#93a7c4]">
          Tokens authenticate your agents against the hosted endpoint. Store them like passwords — we only keep a
          hash.
        </p>
        <div className="mt-4">
          <TokenManager tokens={tokens.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))} />
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-[#1d3a5f] bg-[#0e1930] p-6">
        <h2 className="text-lg font-semibold text-[#e8f1ff]">Connect your agent</h2>
        <p className="mt-1 text-sm text-[#93a7c4]">Point your MCP client at the cloud endpoint with your token:</p>
        <pre className="mt-3 text-xs bg-[#0b1220] border border-[#1d3a5f] rounded-md p-4 overflow-x-auto text-[#a5e3ff]">
{`{
  "mcpServers": {
    "causal-memory": {
      "url": "https://cloud.causal-memory.dev/mcp",
      "headers": { "Authorization": "Bearer cm_your_token" }
    }
  }
}`}
        </pre>
        <p className="mt-3 text-xs text-[#5a719c]">
          The hosted endpoint is rolling out gradually — tokens created today will activate as capacity opens.
        </p>
      </section>
    </div>
  );
}
