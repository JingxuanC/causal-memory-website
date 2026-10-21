import Link from "next/link";

/**
 * Closing CTA. Three doors, matching the plan: the repo, the install guide,
 * and cloud memory. No modal, no email capture.
 */
export function CtaBlock({
  title = "Install it and record one decision",
  body = "The engine is Apache-2.0. Record a decision, let it observe the outcome, and make the next recall an experiment you can check — not a promise you have to trust.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="mt-14 rounded-2xl bg-[#0f172a] p-8 text-center">
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#cbd5e1]">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <a
          href="https://github.com/JingxuanC/causal-memory"
          className="rounded-md bg-white px-5 py-2.5 font-semibold text-[#0f172a] transition-colors hover:bg-[#f1f5f9]"
        >
          GitHub
        </a>
        <Link
          href="/docs/getting-started"
          className="rounded-md border border-white/40 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10"
        >
          Install guide
        </Link>
        <Link
          href="/pricing"
          className="rounded-md border border-white/40 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10"
        >
          Cloud memory
        </Link>
      </div>
    </section>
  );
}
