"use client";

import { useEffect, useRef, useState } from "react";

const CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ??
  "BAANd7gjdbo5gdoAnPcsT2cRnP2TwtjCQZfb_GAsAQh6TTZDx0IkIM7RIzVKYjijgnl42_b9yIlh2KNJRU";
const PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_MEMORY_PLAN ?? "P-6YW358576Y570370XNLLXJ5I";

type PaypalNamespace = {
  Buttons: (config: Record<string, unknown>) => { render: (target: HTMLElement) => Promise<void> };
};

declare global {
  interface Window {
    paypal?: PaypalNamespace;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadPaypalSdk(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="memory"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sdk-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&vault=true&intent=subscription`;
    script.async = true;
    script.dataset.paypalSdk = "memory";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sdk-load-failed"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function PaypalMemoryButton({ lang = "zh" }: { lang?: "zh" | "en" }) {
  const holder = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [subscriptionId, setSubscriptionId] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadPaypalSdk()
      .then(() => {
        if (cancelled || !holder.current || !window.paypal) return;
        holder.current.innerHTML = "";
        return window.paypal
          .Buttons({
            style: { shape: "rect", color: "blue", layout: "vertical", label: "paypal" },
            createSubscription: (_data: unknown, actions: { subscription: { create: (o: { plan_id: string }) => unknown } }) =>
              actions.subscription.create({ plan_id: PLAN_ID }),
            onApprove: (data: { subscriptionID?: string }) => {
              setSubscriptionId(data.subscriptionID ?? "");
              setState("done");
            },
            onError: () => setState("error"),
          })
          .render(holder.current)
          .then(() => {
            if (!cancelled) setState("ready");
          });
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-5">
      <div className="text-sm font-semibold text-[#0f172a]">
        {lang === "zh" ? "云端因果记忆 · $14/月（≈¥99）" : "Cloud causal memory · $14/mo (≈¥99)"}
      </div>
      <div ref={holder} className="mt-3" />
      {state === "loading" && (
        <p className="mt-2 text-xs text-[#94a3b8]">{lang === "zh" ? "正在加载 PayPal…" : "Loading PayPal…"}</p>
      )}
      {state === "error" && (
        <p className="mt-2 text-xs text-[#b91c1c]">
          {lang === "zh" ? "PayPal 加载失败，请刷新重试，或用微信/邮件联系开通。" : "PayPal failed to load. Refresh, or contact us to activate."}
        </p>
      )}
      {state === "done" && (
        <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-sm text-[#166534]">
          <p className="font-semibold">{lang === "zh" ? "订阅已提交，10 分钟内开通" : "Subscription received — activated within 10 minutes"}</p>
          <p className="mt-1 text-xs">
            {lang === "zh" ? "订阅号：" : "Subscription: "}
            <code className="rounded bg-white px-1.5 py-0.5">{subscriptionId || "—"}</code>
          </p>
          <p className="mt-2 text-xs">
            {lang === "zh"
              ? "开通后到 设置 → 因果记忆 粘贴我们发给你的 API key；也可先在 /dashboard 创建 token。"
              : "After activation, paste the API key in Settings → Causal Memory, or create a token in /dashboard."}
          </p>
        </div>
      )}
      <p className="mt-2 text-xs text-[#94a3b8]">
        {lang === "zh" ? "订阅由 PayPal 处理，可随时取消；开通后如需发票请联系支持。" : "Billed by PayPal, cancel anytime. Ask support for an invoice."}
      </p>
    </div>
  );
}
