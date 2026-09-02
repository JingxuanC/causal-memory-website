"use client";

import { useState } from "react";

export function PostEditor({ labels }: { labels: Record<string, string> }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok?: string; err?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult({});
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, description, body }),
    });
    setPending(false);
    if (res.ok) {
      const data = await res.json();
      setResult({ ok: data.slug });
      setTitle(""); setSlug(""); setDescription(""); setBody("");
    } else {
      const data = await res.json().catch(() => ({}));
      setResult({ err: data.error ?? `HTTP ${res.status}` });
    }
  }

  const input =
    "w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.fieldTitle} className={input} required />
      <div className="flex gap-3">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={labels.fieldSlug} className={input} />
      </div>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={labels.fieldDesc} className={input} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={12}
        placeholder={labels.fieldBody}
        className={`${input} font-mono`}
        required
      />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1] disabled:opacity-50 transition-colors"
        >
          {pending ? labels.publishing : labels.publish}
        </button>
        {result.ok && (
          <a href={`/blog/${result.ok}`} className="text-sm text-[#059669] hover:underline">
            {labels.published} /blog/{result.ok} →
          </a>
        )}
        {result.err && <span className="text-sm text-[#dc2626]">{result.err}</span>}
      </div>
    </form>
  );
}
