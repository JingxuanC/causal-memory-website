import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getLang } from "@/lib/i18n";
import { memoryActivateCopy } from "./copy";
import { ActivateForm } from "./activate-form";

export const metadata: Metadata = { title: "Activate cloud memory" };
export const dynamic = "force-dynamic";

export default async function ActivateMemoryPage() {
  const [session, lang] = await Promise.all([auth(), getLang()]);
  const d = memoryActivateCopy[lang];

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">{d.kicker}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0f172a]">{d.title}</h1>
      <p className="mt-3 text-sm leading-7 text-[#475569]">{d.intro}</p>

      {!session?.user ? (
        <div className="mt-8 rounded-xl border border-[#e2e8f0] bg-white p-6">
          <p className="text-sm text-[#475569]">{d.loginHint}</p>
          <a
            href="/api/auth/signin?callbackUrl=/memory/activate"
            className="mt-4 inline-flex rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e293b]"
          >
            {d.signIn}
          </a>
        </div>
      ) : (
        <ActivateForm labels={d} signedInEmail={session.user.email ?? ""} />
      )}

      <p className="mt-6 text-xs leading-6 text-[#94a3b8]">{d.footer}</p>
      <Link href="/dashboard" className="mt-4 inline-block text-sm text-[#0284c7] hover:text-[#0369a1]">
        {d.back}
      </Link>
    </main>
  );
}
