"use client";

import { useState } from "react";
import Link from "next/link";
import { memoryActivateCopy } from "./copy";

type Labels = (typeof memoryActivateCopy)["zh"] | (typeof memoryActivateCopy)["en"];

export function ActivateForm({ labels, signedInEmail }: { labels: Labels; signedInEmail: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok?: boolean }>({ text: "" });

  async function submit() {
    setBusy(true);
    setMsg({ text: "" });
    try {
      const res = await fetch("/api/memory/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId: value.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; hint?: string; error?: string };
      if (!res.ok || !data.ok) {
        setMsg({ text: `${labels.error}: ${data.hint ?? data.error ?? res.status}`, ok: false });
        return;
      }
      setMsg({ text: labels.ok, ok: true });
    } catch {
      setMsg({ text: labels.error, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-[#e2e8f0] bg-white p-6">
      <p className="text-xs text-[#94a3b8]">{signedInEmail}</p>
      <label className="mt-4 block text-sm font-medium text-[#0f172a]">{labels.label}</label>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={labels.placeholder}
        className="mt-2 w-full rounded-md border border-[#cbd5e1] px-3 py-2 font-mono text-sm text-[#0f172a] outline-none focus:border-[#0284c7]"
      />
      <button
        onClick={submit}
        disabled={busy || value.trim().length < 6}
        className="mt-4 rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e293b] disabled:opacity-50"
      >
        {busy ? labels.activating : labels.button}
      </button>
      {msg.text && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-[#047857]" : "text-[#b91c1c]"}`}>{msg.text}</p>
      )}
      {msg.ok && (
        <Link href="/dashboard" className="mt-3 inline-block text-sm text-[#0284c7] hover:text-[#0369a1]">
          {labels.back}
        </Link>
      )}
    </div>
  );
}
