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
          className="flex-1 rounded-md border border-[#2b4f7c] bg-[#0e1930] px-3 py-2 text-sm text-[#e8f1ff] placeholder-[#5a719c] focus:outline-none focus:border-[#4cc2ff]"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#4cc2ff] px-4 py-2 text-sm font-semibold text-[#0b1220] hover:bg-[#6fd0ff] disabled:opacity-50 transition-colors"
        >
          {pending ? labels.creating : labels.createToken}
        </button>
      </form>

      {freshToken && (
        <div className="mt-4 rounded-md border border-[#34d399]/40 bg-[#34d399]/10 p-4">
          <p className="text-sm font-semibold text-[#34d399]">
            {labels.tokenCreated}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-[#0b1220] border border-[#1d3a5f] px-3 py-2 text-xs text-[#a5e3ff] overflow-x-auto">
              {freshToken}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(freshToken);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-md border border-[#2b4f7c] px-3 py-2 text-xs text-[#e8f1ff] hover:bg-[#101f3a]"
            >
              {copied ? labels.copied : labels.copy}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {tokens.length === 0 && <li className="text-sm text-[#5a719c]">{labels.noTokens}</li>}
        {tokens.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-md border border-[#1d3a5f] bg-[#0e1930] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-[#e8f1ff]">{t.name}</p>
              <p className="text-xs text-[#5a719c] font-mono">
                {t.prefix}… · created {t.createdAt.slice(0, 10)}
              </p>
            </div>
            <button
              onClick={() => revoke(t.id)}
              className="rounded-md border border-[#f87171]/40 px-3 py-1.5 text-xs text-[#f87171] hover:bg-[#f87171]/10 transition-colors"
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
