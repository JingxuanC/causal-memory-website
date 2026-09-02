"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ slug }: { slug: string }) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postSlug: slug, body }),
    });
    setPending(false);
    if (res.ok) {
      setBody("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Share your thoughts…"
        className="w-full rounded-md border border-[#2b4f7c] bg-[#0e1930] px-3 py-2 text-sm text-[#e8f1ff] placeholder-[#5a719c] focus:outline-none focus:border-[#4cc2ff]"
      />
      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="mt-2 rounded-md bg-[#4cc2ff] px-4 py-1.5 text-sm font-semibold text-[#0b1220] hover:bg-[#6fd0ff] disabled:opacity-50 transition-colors"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
