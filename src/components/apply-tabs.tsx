"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApplyForm } from "@/components/apply-form";
import { MemoryApplyForm } from "@/components/memory-apply-form";
import type { ApplyProduct } from "@/lib/apply-products";

type Lang = "en" | "zh";

const T = {
  zh: {
    tabApi: "通用 MCP API Key",
    tabApiNote: "匿名申请 · 凭单号领取",
    tabAlpha: "Alpha Desk Pro",
    tabAlphaNote: "GitHub 登录 · 领取 license",
    tabMemory: "云端记忆",
    tabMemoryNote: "GitHub 登录 · 领取记忆密钥",
    priceApi: "按分组授权",
    priceAlpha: "¥499 / 月",
    priceMemory: "¥99 / 月",
    compareTitle: "三种产品的审批与领取方式不同",
    compareApi:
      "通用 API Key：无需登录，提交后人工审批，通过后匿名凭申请单号领取 MCP key（按分组授权）。",
    compareAlpha:
      "Alpha Desk Pro：需 GitHub 登录并绑定账号；审批通过后在 Alpha Desk 页面领取离线 license + 记忆 token。",
    compareMemory:
      "云端记忆：需 GitHub 登录并绑定账号；审批通过后在本页领取 cm_ 开头的记忆密钥（只显示一次）。",
    alphaTitle: "Alpha Desk Pro · ¥499 / 月",
    alphaBody:
      "Pro 解锁 4 种进阶报告，以及云端因子挖掘、Kronos 与 causal-memory。申请和领取都在 Alpha Desk 页面完成，这里只作为统一入口，不再复制第二套逻辑。",
    alphaSignedOut:
      "申请 Alpha Desk Pro 需要先用 GitHub 登录，申请单和 license 会绑定到你的账号。",
    alphaSignedInAs: "当前登录",
    alphaApply: "去申请 Pro",
    alphaNote:
      "登录后回到本页，点「去申请 Pro」；提交申请、记下单号、审批后领取 license 都在 Alpha Desk 页面。",
    alphaSessionHint: "已登录即可直接申请；如果尚未绑定账号，页面会引导你提交申请。",
    memorySignedOut:
      "申请云端记忆需要先用 GitHub 登录。申请单、租户（u_<id>）和记忆密钥都会绑定到你的账号，不能用其他账号领取。",
    signIn: "用 GitHub 登录后申请",
    loginCallbackHint: "登录后会回到本页当前产品 tab。",
    userFallback: "GitHub 账号",
  },
  en: {
    tabApi: "MCP API key",
    tabApiNote: "Anonymous · redeem by request ID",
    tabAlpha: "Alpha Desk Pro",
    tabAlphaNote: "GitHub sign-in · license",
    tabMemory: "Cloud memory",
    tabMemoryNote: "GitHub sign-in · memory key",
    priceApi: "group-scoped",
    priceAlpha: "¥499 / month",
    priceMemory: "¥99 / month",
    compareTitle: "The three products differ in review, sign-in and what you receive",
    compareApi:
      "MCP API key: no sign-in. Human review, then redeem the group-scoped MCP key anonymously with your request ID.",
    compareAlpha:
      "Alpha Desk Pro: GitHub sign-in and account binding required. After approval, claim an offline license + memory token on the Alpha Desk page.",
    compareMemory:
      "Cloud memory: GitHub sign-in and account binding required. After approval, claim a cm_ memory key here (shown once).",
    alphaTitle: "Alpha Desk Pro · ¥499 / month",
    alphaBody:
      "Pro unlocks four advanced reports plus cloud factor mining, Kronos and causal-memory. Applications and claims live on the Alpha Desk page; this tab is only the unified entry point.",
    alphaSignedOut:
      "Applying for Alpha Desk Pro requires GitHub sign-in so the request and license are bound to your account.",
    alphaSignedInAs: "Signed in as",
    alphaApply: "Apply for Pro",
    alphaNote:
      "After signing in, come back and choose “Apply for Pro”. Submission, request ID and claiming all happen on the Alpha Desk page.",
    alphaSessionHint: "You are signed in; the Alpha Desk page will let you submit and claim.",
    memorySignedOut:
      "Cloud memory requires GitHub sign-in. The request, tenant (u_<id>) and memory key are bound to your account and cannot be claimed by another account.",
    signIn: "Sign in with GitHub to apply",
    loginCallbackHint: "You will return to this product tab after signing in.",
    userFallback: "GitHub account",
  },
} as const;

const TAB_META: { id: ApplyProduct; zh: string; en: string; zhNote: string; enNote: string; zhPrice: string; enPrice: string }[] = [
  {
    id: "api",
    zh: T.zh.tabApi,
    en: T.en.tabApi,
    zhNote: T.zh.tabApiNote,
    enNote: T.en.tabApiNote,
    zhPrice: T.zh.priceApi,
    enPrice: T.en.priceApi,
  },
  {
    id: "alpha-desk",
    zh: T.zh.tabAlpha,
    en: T.en.tabAlpha,
    zhNote: T.zh.tabAlphaNote,
    enNote: T.en.tabAlphaNote,
    zhPrice: T.zh.priceAlpha,
    enPrice: T.en.priceAlpha,
  },
  {
    id: "memory",
    zh: T.zh.tabMemory,
    en: T.en.tabMemory,
    zhNote: T.zh.tabMemoryNote,
    enNote: T.en.tabMemoryNote,
    zhPrice: T.zh.priceMemory,
    enPrice: T.en.priceMemory,
  },
];

function callbackUrl(product: ApplyProduct): string {
  return `/api/auth/signin?callbackUrl=${encodeURIComponent(`/apply?product=${product}`)}`;
}

export function ApplyTabs({
  lang,
  initialProduct,
  initialReq = "",
  signedIn,
  userLabel = "",
}: {
  lang: Lang;
  initialProduct: ApplyProduct;
  initialReq?: string;
  signedIn: boolean;
  userLabel?: string;
}) {
  const t = T[lang];
  const zh = lang === "zh";
  const [product, setProduct] = useState<ApplyProduct>(initialProduct);

  // Keep ?product= in sync without re-rendering the server page. Tabs are a
  // client-side view of the same URL, so switching is instant.
  useEffect(() => {
    const onPop = () => {
      const raw = new URL(window.location.href).searchParams.get("product");
      setProduct(raw === "alpha-desk" || raw === "memory" ? raw : "api");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function selectProduct(next: ApplyProduct) {
    setProduct(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("product", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const compare = [
    { id: "api", text: t.compareApi },
    { id: "alpha-desk", text: t.compareAlpha },
    { id: "memory", text: t.compareMemory },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label={zh ? "申请产品" : "Application product"}
        className="grid gap-2 rounded-2xl border border-[#e2e8f0] bg-white p-2 sm:grid-cols-3"
      >
        {TAB_META.map((tab) => {
          const active = product === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`apply-panel-${tab.id}`}
              id={`apply-tab-${tab.id}`}
              onClick={() => selectProduct(tab.id)}
              className={`rounded-xl px-4 py-3 text-left transition-colors ${
                active
                  ? "bg-[#0f172a] text-white"
                  : "text-[#334155] hover:bg-[#f8fafc]"
              }`}
            >
              <span className="block text-sm font-semibold">{zh ? tab.zh : tab.en}</span>
              <span
                className={`mt-1 block text-xs ${active ? "text-[#cbd5e1]" : "text-[#64748b]"}`}
              >
                {zh ? tab.zhPrice : tab.enPrice} · {zh ? tab.zhNote : tab.enNote}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
        <p className="text-xs font-semibold text-[#0f172a]">{t.compareTitle}</p>
        <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-[#475569] sm:grid-cols-3">
          {compare.map((item) => (
            <li key={item.id} className="rounded-lg bg-white px-3 py-2">
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div
        role="tabpanel"
        id="apply-panel-api"
        aria-labelledby="apply-tab-api"
        hidden={product !== "api"}
        className="mt-6"
      >
        <ApplyForm lang={lang} initialReq={initialProduct === "api" ? initialReq : ""} />
      </div>

      <div
        role="tabpanel"
        id="apply-panel-alpha-desk"
        aria-labelledby="apply-tab-alpha-desk"
        hidden={product !== "alpha-desk"}
        className="mt-6"
      >
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#0284c7] px-2 py-0.5 text-xs font-semibold text-white">
              PRO
            </span>
            <h2 className="text-lg font-semibold text-[#0f172a]">{t.alphaTitle}</h2>
          </div>
          <p className="mt-2 text-sm text-[#475569]">{t.alphaBody}</p>

          {!signedIn ? (
            <div className="mt-5 rounded-xl border border-[#f59e0b]/40 bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
              <p>{t.alphaSignedOut}</p>
              <a
                href={callbackUrl("alpha-desk")}
                className="mt-3 inline-flex rounded-lg bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1]"
              >
                {t.signIn}
              </a>
              <p className="mt-2 text-xs text-[#92400e]">{t.loginCallbackHint}</p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] px-5 py-4 text-sm text-[#0c4a6e]">
              <p>
                {t.alphaSignedInAs}:{" "}
                <span className="font-semibold">{userLabel || t.userFallback}</span>
              </p>
              <p className="mt-1 text-xs text-[#0369a1]">{t.alphaSessionHint}</p>
              <Link
                href="/alpha-desk#apply"
                className="mt-3 inline-flex rounded-lg bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1]"
              >
                {t.alphaApply}
              </Link>
            </div>
          )}

          <p className="mt-4 text-xs leading-5 text-[#64748b]">{t.alphaNote}</p>
        </section>
      </div>

      <div
        role="tabpanel"
        id="apply-panel-memory"
        aria-labelledby="apply-tab-memory"
        hidden={product !== "memory"}
        className="mt-6"
      >
        {signedIn ? (
          <MemoryApplyForm
            lang={lang}
            initialReq={initialProduct === "memory" ? initialReq : ""}
            userLabel={userLabel || t.userFallback}
          />
        ) : (
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#0284c7] px-2 py-0.5 text-xs font-semibold text-white">
                MEMORY
              </span>
              <h2 className="text-lg font-semibold text-[#0f172a]">
                {t.tabMemory} · {t.priceMemory}
              </h2>
            </div>
            <div className="mt-4 rounded-xl border border-[#f59e0b]/40 bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
              <p>{t.memorySignedOut}</p>
              <a
                href={callbackUrl("memory")}
                className="mt-3 inline-flex rounded-lg bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369a1]"
              >
                {t.signIn}
              </a>
              <p className="mt-2 text-xs text-[#92400e]">{t.loginCallbackHint}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
