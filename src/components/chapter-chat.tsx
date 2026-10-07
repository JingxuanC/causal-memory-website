"use client";

import { useEffect, useRef, useState } from "react";

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
type Pos = { x: number; y: number };

const POS_KEY = "cm-chat-pos";

function clampPos(p: Pos): Pos {
  if (typeof window === "undefined") return p;
  return {
    x: Math.min(Math.max(0, p.x), Math.max(0, window.innerWidth - 80)),
    y: Math.min(Math.max(0, p.y), Math.max(0, window.innerHeight - 60)),
  };
}

export function ChapterChat({ slug, labels }: { slug: string; labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<"signin" | "nokey" | "error" | null>(null);
  // Floating panel position (top-left corner). null = default dock at
  // bottom-right; set once the user drags (persisted in localStorage).
  const [pos, setPos] = useState<Pos | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; base: Pos } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      // Restoring the dragged position must happen after mount (SSR has no
      // localStorage); the one-time jump from the docked spot is intended.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPos(clampPos(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending, open]);

  function onDragStart(e: React.PointerEvent) {
    if (e.pointerType === "touch") return; // mobile: keep docked, avoid scroll fights
    const panel = (e.target as HTMLElement).closest("[data-chat-panel]") as HTMLElement | null;
    const rect = panel?.getBoundingClientRect();
    const base = rect ? { x: rect.left, y: rect.top } : (pos ?? { x: 0, y: 0 });
    dragRef.current = { startX: e.clientX, startY: e.clientY, base };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setPos(clampPos({ x: d.base.x + e.clientX - d.startX, y: d.base.y + e.clientY - d.startY }));
  }

  function onDragEnd() {
    dragRef.current = null;
    setPos((p) => {
      if (p) {
        try {
          localStorage.setItem(POS_KEY, JSON.stringify(p));
        } catch {
          /* ignore */
        }
      }
      return p;
    });
  }

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

  const panelStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: 16, bottom: 88 };

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={labels.title}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#0284c7] text-white shadow-lg hover:bg-[#0369a1] transition-colors"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5c-1.3 0-2.55-.28-3.68-.8L3 21l1.8-5.82A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z" />
          </svg>
        )}
      </button>

      {/* Floating panel (draggable via header) */}
      {open && (
        <div
          data-chat-panel
          style={panelStyle}
          className="fixed z-50 flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-2xl"
        >
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="flex cursor-move items-start justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 select-none"
          >
            <div>
              <h2 className="text-sm font-semibold text-[#0f172a]">{labels.title}</h2>
              <p className="mt-0.5 text-xs text-[#64748b]">{labels.sub}</p>
            </div>
            <div className="flex items-center gap-3">
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#94a3b8] hover:text-[#64748b]"
                aria-label="close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex min-h-32 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && !pending && (
              <p className="my-auto text-center text-xs text-[#94a3b8]">{labels.placeholder}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "self-end rounded-lg rounded-br-none bg-[#0284c7] px-3 py-2 text-sm text-white max-w-[85%] whitespace-pre-wrap break-words"
                    : "self-start rounded-lg rounded-bl-none border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#334155] max-w-[85%] whitespace-pre-wrap break-words"
                }
              >
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="self-start rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#94a3b8]">
                {labels.sending}
              </div>
            )}
          </div>

          {notice && (
            <div className="px-4 pt-2">
              {notice === "signin" && (
                <p className="mb-2 text-xs text-[#64748b]">
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a href="/api/auth/signin" className="text-[#0284c7] hover:underline">
                    {labels.signinGithub}
                  </a>
                  {labels.signin}
                </p>
              )}
              {notice === "nokey" && (
                <p className="mb-2 text-xs text-[#64748b]">
                  {labels.noKey}{" "}
                  <a href="/dashboard" className="text-[#0284c7] hover:underline">
                    {labels.noKeyCta}
                  </a>
                </p>
              )}
              {notice === "error" && <p className="mb-2 text-xs text-[#dc2626]">{labels.error}</p>}
            </div>
          )}

          <form onSubmit={submit} className="flex gap-2 border-t border-[#e2e8f0] p-3">
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
              className="rounded-md bg-[#0284c7] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0369a1] disabled:opacity-50 transition-colors"
            >
              {labels.send}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
