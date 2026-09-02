"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = { placeholder: string; post: string; posting: string };

export function CommentForm({ slug, labels }: { slug: string; labels: Labels }) {
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
        placeholder={labels.placeholder}
        className="w-full rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
      />
      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="mt-2 rounded-md bg-[#0284c7] px-4 py-1.5 text-sm font-semibold text-[#ffffff] hover:bg-[#0369a1] disabled:opacity-50 transition-colors"
      >
        {pending ? labels.posting : labels.post}
      </button>
    </form>
  );
}
