import type { Metadata } from "next";
import { getLang } from "@/lib/i18n";
import { ApplyForm } from "@/components/apply-form";

export const metadata: Metadata = {
  title: "Apply for an API key",
  description:
    "Apply for access to the quant MCP service — market data, factor mining, causal analysis and memory. Human-reviewed; redeem your key with the request ID once approved.",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string }>;
}) {
  const lang = await getLang();
  const zh = lang === "zh";
  // ?req=REQ-XXXX 直接带出状态：在服务端读，客户端组件不必碰 window
  const { req } = await searchParams;
  const initialReq = (req ?? "").trim().toUpperCase();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
        {zh ? "申请 API Key" : "Apply for an API key"}
      </h1>
      <p className="mt-3 mb-8 text-[#475569]">
        {zh
          ? "面向 MCP 量化服务的访问申请。提交后人工审批，通过后凭申请单号自助领取密钥——不需要等我们手动把密钥发给你。"
          : "Access requests for the quant MCP service. A human reviews each submission; once approved you redeem the key yourself with your request ID — no back-and-forth."}
      </p>
      <ApplyForm lang={lang} initialReq={initialReq} />

      <section className="mt-12 border-t border-[#e2e8f0] pt-6 text-sm text-[#64748b]">
        <h2 className="mb-2 font-semibold text-[#0f172a]">{zh ? "说明" : "Notes"}</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          {(zh
            ? [
                "密钥按分组授权：你只能访问获批的分组，请使用带组名的地址（形如 /hub/mcp/<分组>）。",
                "密钥只在领取时显示一次，之后服务器不再保存，请立即存进你的客户端配置或密码管理器。",
                "丢失密钥不必重新申请：回到本页查状态，如已领取请通过申请时留的联系方式找我们重新发放。",
                "提交过于频繁会被限流；审批通常在一个工作日内。",
              ]
            : [
                "Keys are scoped per group: you can only reach the groups you were granted. Use the group-qualified URL (/hub/mcp/<group>).",
                "The key is displayed exactly once at redemption and is not stored afterwards — save it into your client config or password manager immediately.",
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
