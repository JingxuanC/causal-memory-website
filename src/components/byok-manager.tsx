"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = {
  byokPlaceholder: string;
  byokSave: string;
  byokSaving: string;
  byokSaved: string;
  byokClear: string;
  byokCurrent: string;
  byokNone: string;
  byokError: string;
};

export function ByokManager({ hint, labels }: { hint: string | null; labels: Labels }) {
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/byok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setPending(false);
    if (res.ok) {
      setKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? labels.byokError);
    }
  }

  async function clear() {
    await fetch("/api/byok", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={save} className="flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          type="password"
          placeholder={labels.byokPlaceholder}
          className="flex-1 rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
        />
        <button
          type="submit"
          disabled={pending || !key.trim()}
          className="rounded-md bg-[#0284c7] px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#0369a1] disabled:opacity-50 transition-colors"
        >
          {pending ? labels.byokSaving : labels.byokSave}
        </button>
      </form>
      {saved && <p className="mt-2 text-sm text-[#059669]">{labels.byokSaved}</p>}
      {error && <p className="mt-2 text-sm text-[#dc2626]">{error}</p>}
      <div className="mt-3 flex items-center justify-between rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
        <p className="text-sm text-[#334155]">
          {hint ? (
            <>
              {labels.byokCurrent} <span className="font-mono text-[#0369a1]">{hint}</span>
            </>
          ) : (
            <span className="text-[#94a3b8]">{labels.byokNone}</span>
          )}
        </p>
        {hint && (
          <button
            onClick={clear}
            className="rounded-md border border-[#dc2626]/40 px-3 py-1.5 text-xs text-[#dc2626] hover:bg-[#dc2626]/10 transition-colors"
          >
            {labels.byokClear}
          </button>
        )}
      </div>
    </div>
  );
}
