import type { Metadata } from "next";
import { auth } from "@/auth";
import { getLang } from "@/lib/i18n";
import { parseApplyProduct } from "@/lib/apply-products";
import { ApplyTabs } from "@/components/apply-tabs";

export const metadata: Metadata = {
  title: "Apply — MCP API key, Alpha Desk Pro & cloud memory",
  description:
    "One page for three products: a group-scoped MCP API key (anonymous), Alpha Desk Pro ¥499/month (GitHub sign-in) and cloud memory ¥99/month (GitHub sign-in). Human-reviewed; each product delivers a different credential.",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string; product?: string | string[] }>;
}) {
  const [lang, session, { req, product }] = await Promise.all([
    getLang(),
    auth(),
    searchParams,
  ]);
  const zh = lang === "zh";
  // ?req=REQ-XXXX 直接带出状态：在服务端读，客户端组件不必碰 window
  const initialReq = (req ?? "").trim().toUpperCase();
  const initialProduct = parseApplyProduct(product);
  const userLabel = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
        {zh ? "申请与开通" : "Apply & activate"}
      </h1>
      <p className="mt-3 mb-8 max-w-3xl text-[#475569]">
        {zh
          ? "三种产品共用这一个入口：通用 MCP API Key、Alpha Desk Pro（¥499/月）和云端记忆（¥99/月）。提交后均需人工审批，但登录要求、审批方式和领取到的凭据各不相同。"
          : "One entry point for three products: the MCP API key, Alpha Desk Pro (¥499/month) and cloud memory (¥99/month). All submissions are human-reviewed, but sign-in requirements and the credential you receive differ."}
      </p>

      <ApplyTabs
        lang={lang}
        initialProduct={initialProduct}
        initialReq={initialReq}
        signedIn={Boolean(session?.user)}
        userLabel={userLabel}
      />

      <section className="mt-12 border-t border-[#e2e8f0] pt-6 text-sm text-[#64748b]">
        <h2 className="mb-2 font-semibold text-[#0f172a]">{zh ? "说明" : "Notes"}</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          {(zh
            ? [
                "三种产品的审批、登录要求和领取结果不同：API Key 匿名申请、凭单号领取 MCP key；Alpha Desk Pro 与云端记忆必须用 GitHub 登录并绑定账号。",
                "Alpha Desk Pro（¥499/月）审批通过后，在 Alpha Desk 页面领取离线 license + 记忆 token；本页只提供统一入口，不复制第二套申请/领取逻辑。",
                "云端记忆（¥99/月）审批通过后，在本页用申请时的 GitHub 账号领取 cm_ 开头的记忆密钥；请粘贴到插件设置页（DSH → 设置 → 云端记忆 / Memory Token）。",
                "密钥按分组授权：通用 API Key 只能访问获批的分组，请使用带组名的地址（形如 /hub/mcp/<分组>）。",
                "所有密钥/记忆 token 都只在领取时显示一次，之后服务器只保留哈希，请立即存进客户端配置或密码管理器。",
                "丢失密钥不必重新申请：回到本页查状态，如已领取请通过申请时留的联系方式找我们重新发放。",
                "提交过于频繁会被限流；审批通常在一个工作日内。",
              ]
            : [
                "The three products differ: the MCP API key is anonymous and redeemed by request ID; Alpha Desk Pro and cloud memory require GitHub sign-in and account binding.",
                "Alpha Desk Pro (¥499/month): after approval, claim the offline license + memory token on the Alpha Desk page. This page is only the unified entry point and does not duplicate that flow.",
                "Cloud memory (¥99/month): after approval, claim the cm_ memory key on this page with the GitHub account used to apply. Paste it into the plugin settings (DSH → Settings → Cloud memory / Memory Token).",
                "Keys are scoped per group: the MCP API key can only reach the groups you were granted. Use the group-qualified URL (/hub/mcp/<group>).",
                "Every key / memory token is displayed exactly once at redemption; the server keeps only a hash afterwards. Save it immediately.",
                "Lost it? Check the status here; if it was already redeemed, contact us via the details you submitted and we will re-issue.",
                "Submissions are rate-limited; review usually happens within one business day.",
              ]
          ).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
