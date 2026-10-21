/**
 * Read-only code sample. Scrolls horizontally on narrow screens instead of
 * forcing the page wide, so a 375px viewport never gets a horizontal scrollbar.
 */
export function CodeBlock({ title, language, code }: { title: string; language: string; code: string }) {
  return (
    <figure className="mt-4 overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f172a]">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] px-4 py-2">
        <span className="text-xs font-semibold text-[#e2e8f0]">{title}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">{language}</span>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-6 text-[#e2e8f0]">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
