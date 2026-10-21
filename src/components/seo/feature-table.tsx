import type { EvidenceRow, FeatureRow, GapRow } from "@/data/seo/types";

const cellBase = "px-4 py-3 align-top";

/**
 * Head-to-head capability table. The honest-gap rows live in the same table so
 * a reader cannot take the positive rows without scrolling past the negative
 * ones — that is the whole point of shipping this component.
 */
export function FeatureTable({
  themName,
  features,
  gaps,
}: {
  themName: string;
  features: FeatureRow[];
  gaps: GapRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
      <table className="w-full min-w-[680px] text-sm">
        <caption className="sr-only">
          causal-memory compared with {themName}, including the capabilities where causal-memory is weaker
        </caption>
        <thead className="bg-[#f1f5f9] text-[#0f172a]">
          <tr>
            <th scope="col" className={`${cellBase} text-left font-semibold`}>
              Capability
            </th>
            <th scope="col" className={`${cellBase} text-left font-semibold`}>
              causal-memory
            </th>
            <th scope="col" className={`${cellBase} text-left font-semibold`}>
              {themName}
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((row) => (
            <tr key={row.label} className="border-t border-[#e2e8f0]">
              <th scope="row" className={`${cellBase} text-left font-medium text-[#0f172a]`}>
                {row.label}
              </th>
              <td className={`${cellBase} text-[#334155]`}>{row.us}</td>
              <td className={`${cellBase} text-[#64748b]`}>{row.them}</td>
            </tr>
          ))}
          <tr className="border-t border-[#e2e8f0] bg-[#f8fafc]">
            <td
              colSpan={3}
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]"
            >
              Where causal-memory is weaker — read this before the pitch
            </td>
          </tr>
          {gaps.map((row) => (
            <tr key={row.label} className="border-t border-[#e2e8f0] bg-[#f8fafc]">
              <th scope="row" className={`${cellBase} text-left font-medium text-[#0f172a]`}>
                {row.label}
              </th>
              <td className={`${cellBase} font-semibold text-[#b91c1c]`}>{row.us}</td>
              <td className={`${cellBase} text-[#64748b]`}>{row.them}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Benchmark rows. Used by /benchmarks/causaleval and by the comparison pages
 * that quote CausalEval, so the same number is never typed twice.
 */
export function EvidenceTable({
  rows,
  baselineLabel,
  caption,
  highlight,
}: {
  rows: EvidenceRow[];
  baselineLabel: string;
  caption: string;
  highlight?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#f1f5f9] text-[#0f172a]">
          <tr>
            <th scope="col" className={`${cellBase} text-left font-semibold`}>
              Capability
            </th>
            <th scope="col" className={`${cellBase} text-left font-semibold`}>
              causal-memory
            </th>
            <th scope="col" className={`${cellBase} text-left font-semibold`}>
              {baselineLabel}
            </th>
            <th scope="col" className={`${cellBase} text-left font-semibold`}>
              What it tests
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isHighlighted = highlight === row.capability;
            return (
              <tr
                key={row.capability}
                className={`border-t border-[#e2e8f0] ${isHighlighted ? "bg-[#f0f9ff]" : ""}`}
              >
                <th scope="row" className={`${cellBase} text-left font-medium text-[#0f172a]`}>
                  {row.capability}
                </th>
                <td className={`${cellBase} font-semibold text-[#059669]`}>{row.ours}</td>
                <td className={`${cellBase} text-[#64748b]`}>{row.baseline}</td>
                <td className={`${cellBase} text-[#64748b]`}>{row.tests}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
