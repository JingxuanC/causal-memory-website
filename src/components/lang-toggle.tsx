"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLang } from "@/app/actions";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const next: Lang = lang === "en" ? "zh" : "en";

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLang(next);
          router.refresh();
        })
      }
      className="rounded-md border border-[#2b4f7c] px-2.5 py-1.5 text-xs text-[#93a7c4] hover:text-[#e8f1ff] transition-colors"
      title="Switch language / 切换语言"
    >
      {lang === "en" ? "中文" : "EN"}
    </button>
  );
}
