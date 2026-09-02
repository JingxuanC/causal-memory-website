"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Token = { id: string; name: string; prefix: string; createdAt: string };

type Labels = {
  tokenName: string; createToken: string; creating: string; tokenCreated: string;
  copy: string; copied: string; revoke: string; noTokens: string;
};

export function TokenManager({ tokens, labels }: { tokens: Token[]; labels: Labels }) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setFreshToken(null);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setPending(false);
    if (res.ok) {
      const data = await res.json();
      setFreshToken(data.token);
      setName("");
      router.refresh();
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={create} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.tokenName}
          className="flex-1 rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#0284c7] px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#0369a1] disabled:opacity-50 transition-colors"
        >
          {pending ? labels.creating : labels.createToken}
        </button>
      </form>

      {freshToken && (
        <div className="mt-4 rounded-md border border-[#059669]/40 bg-[#059669]/10 p-4">
          <p className="text-sm font-semibold text-[#059669]">
            {labels.tokenCreated}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-[#ffffff] border border-[#e2e8f0] px-3 py-2 text-xs text-[#0369a1] overflow-x-auto">
              {freshToken}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(freshToken);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-md border border-[#cbd5e1] px-3 py-2 text-xs text-[#0f172a] hover:bg-[#f1f5f9]"
            >
              {copied ? labels.copied : labels.copy}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {tokens.length === 0 && <li className="text-sm text-[#94a3b8]">{labels.noTokens}</li>}
        {tokens.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-[#0f172a]">{t.name}</p>
              <p className="text-xs text-[#94a3b8] font-mono">
                {t.prefix}… · created {t.createdAt.slice(0, 10)}
              </p>
            </div>
            <button
              onClick={() => revoke(t.id)}
              className="rounded-md border border-[#dc2626]/40 px-3 py-1.5 text-xs text-[#dc2626] hover:bg-[#dc2626]/10 transition-colors"
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
