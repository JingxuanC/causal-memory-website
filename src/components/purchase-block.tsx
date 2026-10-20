import type { Lang } from "@/lib/i18n";

const COPY = {
  zh: {
    title: "直接购买",
    intro: "微信扫码付款，付款时务必在备注里写清楚「产品 + 你的邮箱」，否则无法对账。",
    rows: [
      { name: "云端因果记忆", price: "¥99 / 月", note: "备注：记忆 + 邮箱" },
      { name: "Alpha Desk Pro", price: "¥499 / 月", note: "备注：Pro + 邮箱" },
      { name: "Alpha Desk 买断", price: "¥5,000 一次", note: "备注：买断 + 邮箱" },
    ],
    qrAlt: "微信收款码",
    stepsTitle: "付款后",
    steps: [
      "把付款截图 + 备注内容发到 963841621@qq.com（或加微信发我）",
      "10 分钟内开通：Pro 发 license；云端记忆把账号 plan 设为 memory",
      "云端记忆开通后，去 /dashboard → API tokens 创建 token，粘贴到插件设置页",
    ],
    noteTip: "个人收款码没有订单系统，备注是唯一对账依据，请务必填写。",
    paypal: "海外用户：PayPal 账单按 $14/月（记忆）或 $699（买断），联系 963841621@qq.com 获取账单链接。",
  },
  en: {
    title: "Buy directly",
    intro: "Scan with WeChat Pay and put the product + your email in the payment note — without it we cannot match your payment.",
    rows: [
      { name: "Cloud causal memory", price: "¥99 / mo", note: "note: memory + email" },
      { name: "Alpha Desk Pro", price: "¥499 / mo", note: "note: Pro + email" },
      { name: "Alpha Desk lifetime", price: "¥5,000 once", note: "note: lifetime + email" },
    ],
    qrAlt: "WeChat Pay QR",
    stepsTitle: "After paying",
    steps: [
      "Email the payment screenshot + note to 963841621@qq.com (or send it on WeChat).",
      "Activated within 10 minutes: Pro gets a license; memory sets your plan to memory.",
      "For memory, create a token at /dashboard → API tokens and paste it into the plugin settings.",
    ],
    noteTip: "A personal QR has no order system — the payment note is the only way we can match it.",
    paypal: "Outside China: PayPal invoices at $14/mo (memory) or $699 (lifetime) — email 963841621@qq.com for the link.",
  },
} as const;

export function PurchaseBlock({ lang, showPrices = true }: { lang: Lang; showPrices?: boolean }) {
  const d = COPY[lang];
  return (
    <section className="mt-8 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-6">
      <h2 className="text-xl font-bold text-[#0f172a]">{d.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#475569]">{d.intro}</p>

      {showPrices && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {d.rows.map((row) => (
            <div key={row.name} className="rounded-lg border border-[#bbf7d0] bg-white p-3">
              <p className="text-sm font-semibold text-[#0f172a]">{row.name}</p>
              <p className="mt-1 text-lg font-bold text-[#047857]">{row.price}</p>
              <p className="mt-1 text-xs text-[#64748b]">{row.note}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/payments/wechat.png" alt={d.qrAlt} className="w-48 rounded-lg border border-[#bbf7d0] bg-white" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#0f172a]">{d.stepsTitle}</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-[#475569]">
            {d.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-3 rounded-md bg-white p-3 text-xs leading-5 text-[#b45309]">{d.noteTip}</p>
          <p className="mt-3 text-xs leading-5 text-[#64748b]">{d.paypal}</p>
        </div>
      </div>
    </section>
  );
}
