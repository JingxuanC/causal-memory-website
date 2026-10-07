"use client";

import { useState } from "react";

type Labels = {
  title: string;
  sub: string;
  placeholder: string;
  send: string;
  sending: string;
  signin: string;
  signinGithub: string;
  noKey: string;
  noKeyCta: string;
  error: string;
  clear: string;
};

type Msg = { role: "user" | "assistant"; content: string };

export function ChapterChat({ slug, labels }: { slug: string; labels: Labels }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<"signin" | "nokey" | "error" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, messages: next.slice(-20) }),
      });
      if (res.status === 401) {
        setNotice("signin");
        setMessages(messages);
      } else if (res.status === 503) {
        setNotice("nokey");
        setMessages(messages);
      } else if (!res.ok) {
        setNotice("error");
        setMessages(messages);
      } else {
        const data = await res.json();
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setNotice("error");
      setMessages(messages);
    }
    setPending(false);
  }

  return (
    <section className="mt-12 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">{labels.title}</h2>
          <p className="mt-1 text-xs text-[#64748b]">{labels.sub}</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setNotice(null);
            }}
            className="text-xs text-[#94a3b8] hover:text-[#64748b]"
          >
            {labels.clear}
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end rounded-lg rounded-br-none bg-[#0284c7] px-3 py-2 text-sm text-white max-w-[85%] whitespace-pre-wrap break-words"
                  : "self-start rounded-lg rounded-bl-none border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#334155] max-w-[85%] whitespace-pre-wrap break-words"
              }
            >
              {m.content}
            </div>
          ))}
          {pending && (
            <div className="self-start rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#94a3b8]">
              {labels.sending}
            </div>
          )}
        </div>
      )}

      {notice === "signin" && (
        <p className="mt-3 text-sm text-[#64748b]">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/auth/signin" className="text-[#0284c7] hover:underline">
            {labels.signinGithub}
          </a>
          {labels.signin}
        </p>
      )}
      {notice === "nokey" && (
        <p className="mt-3 text-sm text-[#64748b]">
          {labels.noKey}{" "}
          <a href="/dashboard" className="text-[#0284c7] hover:underline">
            {labels.noKeyCta}
          </a>
        </p>
      )}
      {notice === "error" && <p className="mt-3 text-sm text-[#dc2626]">{labels.error}</p>}

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={4000}
          placeholder={labels.placeholder}
          className="flex-1 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-md bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1] disabled:opacity-50 transition-colors"
        >
          {pending ? labels.sending : labels.send}
        </button>
      </form>
    </section>
  );
}
