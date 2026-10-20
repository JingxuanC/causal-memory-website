import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "产品与安装 · Alpha Desk × 云端因果记忆",
  description:
    "Alpha Desk 金融研究插件（9 Bot / 35 技能 / 行情中心 / 6 种报告）与云端因果记忆插件（17 个记忆工具）的说明、定价与安装指引。",
};

const steps = [
  {
    n: "01",
    title: "打开插件页",
    body: "DSH Desktop → 左下角 设置 → 插件，点右上角「+ 添加插件」。",
  },
  {
    n: "02",
    title: "填包名",
    body: "输入插件包名，注意不是 GitHub 地址。",
    code: "deepseek-alpha-desk",
  },
  {
    n: "03",
    title: "安装源切成自定义地址",
    body: "点「安装源」→ 自定义地址，粘贴私有 registry（公开可读，不需要账号）。",
    code: "https://causal-memory.com/npm/",
  },
  {
    n: "04",
    title: "安装并重启",
    body: "点「安装」，等下载完成；退出 DSH Desktop 再打开，插件才生效。",
  },
  {
    n: "05",
    title: "验证",
    body: "左侧出现 9 个 Bot、行情中心、仪表盘即安装成功；进群发一句话，Chief 会拆活。",
  },
];

const troubles = [
  { title: "报 404 / 找不到包", body: "安装源没切到「自定义地址」，或包名拼错。" },
  { title: "报 TAR header / checksum", body: "用 pnpm/npm 直接装 URL 了，改用插件页安装。" },
  { title: "装完没有 Bot", body: "没重启 DSH，或插件列表里的开关没打开。" },
  { title: "卡在下载", body: "换网络/代理重试；安装源末尾要带斜杠。" },
];

const faqs = [
  {
    q: "需要自己准备模型 API key 吗？",
    a: "Alpha Desk 的 Bot 使用你在 DSH 里配置的模型（DeepSeek 官方或账号）。云端记忆额外需要一枚 causal-memory 后台创建的 cm_ token，与模型 key 无关。",
  },
  {
    q: "两个插件必须一起装吗？",
    a: "不必须。Alpha Desk 单独可用；云端记忆是独立加购，装了才挂 17 个记忆工具。两个都装时，设置页里分别配置。",
  },
  {
    q: "数据存在哪里？",
    a: "Alpha Desk 的行情缓存、Bot 配置在本机；云端记忆写在你自己的租户库（tenant = u_<你的 user id>），token 保存为 ~/.dsh/causal-memory.json（0600），网站只存 SHA-256。",
  },
  {
    q: "怎么购买 / 多久开通？",
    a: "在申请页提交 → 人工审批 → 用同一个 GitHub 账号领取 license 或记忆 token。当前没有在线支付，审批即确认付款。",
  },
];

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0284c7]">DSH Plugins</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0f172a] sm:text-5xl">
          两个插件，一套投研工作台
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#475569]">
          <strong className="text-[#0f172a]">Alpha Desk</strong> 把 9 个金融 Bot、35 个技能、行情中心和 6 种研究报告装进 DSH；
          <strong className="text-[#0f172a]">云端因果记忆</strong> 让「为什么这么判断、后来对不对」跨设备留存。都通过插件页安装，不需要命令行。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/apply?product=alpha-desk" className="rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e293b]">
            申请 Alpha Desk Pro
          </Link>
          <Link href="/apply?product=memory" className="rounded-md border border-[#0284c7] px-5 py-2.5 text-sm font-semibold text-[#0284c7] transition-colors hover:bg-[#f0f9ff]">
            申请云端记忆
          </Link>
          <a href="#install" className="rounded-md border border-[#cbd5e1] px-5 py-2.5 text-sm font-semibold text-[#0f172a] transition-colors hover:bg-[#f8fafc]">
            安装指引
          </a>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#e2e8f0] bg-white p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#0284c7]">金融研究</span>
              <h2 className="mt-3 text-2xl font-bold text-[#0f172a]">Alpha Desk</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                面向 A 股的个人投研团队：主 Bot 拆活、9 个角色协作、结论必须带证据。
              </p>
            </div>
            <p className="text-right text-sm text-[#64748b]"><span className="block text-2xl font-bold text-[#0f172a]">¥499</span>/ 月</p>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-[#475569]">
            {[
              "9 个金融 Bot：数据官 / 事件官 / 复盘官 / 研究官 / 因子猎手 / 选股师 / 回测风控官 / 策略师 / 盯盘手",
              "35 个技能、61 个数据工具：行情、财报、公告、龙虎榜、资金流、因子、回测",
              "行情中心 + 仪表盘：K 线、指标、自选、可拖拽卡片、图上标注",
              "6 种研究报告：技术对比 / 事件点评 / 个股速览 / 财报点评 / 行业对比 / 深度个股",
            ].map((item) => (
              <li key={item} className="flex gap-2"><span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#0284c7]" />{item}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#e2e8f0] pt-5 text-sm">
            <code className="rounded-md bg-[#f8fafc] px-2 py-1 text-[#0f172a]">deepseek-alpha-desk</code>
            <span className="text-[#94a3b8]">一次买断 ¥5,000 · 长期使用</span>
          </div>
        </article>

        <article className="rounded-2xl border border-[#ddd6fe] bg-[#faf5ff] p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7c3aed]">记忆</span>
              <h2 className="mt-3 text-2xl font-bold text-[#0f172a]">云端因果记忆</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                决策 + 上下文 + 结果的因果三元组，跨设备、换机不丢；17 个工具直接挂进对话。
              </p>
            </div>
            <p className="text-right text-sm text-[#64748b]"><span className="block text-2xl font-bold text-[#0f172a]">¥99</span>/ 月</p>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-[#475569]">
            {[
              "17 个 MCP 工具：search_causal / record_decision / trace_cause / counterfactual_query 等",
              "租户隔离：tenant = u_<user id>，A 的 token 读不到 B 的记忆",
              "本地 + 云端：离线时工具明确报「未连接」，不伪造写入成功",
              "与 Alpha Desk 分开计费，可单独申请",
            ].map((item) => (
              <li key={item} className="flex gap-2"><span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#7c3aed]" />{item}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#ddd6fe] pt-5 text-sm">
            <code className="rounded-md bg-white px-2 py-1 text-[#0f172a]">dsh-causal-memory</code>
            <span className="text-[#7c3aed]">API key 在 causal-memory.com 后台创建</span>
          </div>
        </article>
      </section>

      <section id="install" className="mt-14 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e2e8f0] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0284c7]">Install</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0f172a]">安装指引 · 约 3 分钟</h2>
          </div>
          <p className="text-sm text-[#64748b]">DSH Desktop 0.2.0-rc.2+ · macOS / Windows · 不需要命令行</p>
        </div>

        <ol className="mt-6 space-y-3">
          {steps.map((step) => (
            <li key={step.n} className="grid grid-cols-[52px_1fr] gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eff6ff] font-mono text-sm font-bold text-[#0284c7]">{step.n}</span>
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#64748b]">{step.body}</p>
                {step.code && <code className="mt-2 inline-block rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 font-mono text-sm text-[#0f172a]">{step.code}</code>}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-6">
          <h3 className="text-lg font-semibold text-[#0f172a]">装云端记忆（可选）</h3>
          <p className="mt-2 text-sm leading-7 text-[#475569]">
            同一个插件页，包名换成 <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[#0f172a]">dsh-causal-memory</code>，安装源同样是
            <code className="ml-1 rounded bg-white px-1.5 py-0.5 font-mono text-[#0f172a]">https://causal-memory.com/npm/</code>。
            装完后在 <strong>设置 → 因果记忆</strong> 粘贴 API key → 保存 → 测试连接（应显示「已连接 · 17 个工具」）→ 重启 DSH。
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-[#0f172a]">装不上？先对照这四种情况</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {troubles.map((item) => (
              <div key={item.title} className="rounded-lg border border-[#e2e8f0] bg-white p-4 text-sm">
                <p className="font-semibold text-[#0f172a]">{item.title}</p>
                <p className="mt-1 leading-6 text-[#64748b]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold text-[#0f172a]">常见问题</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#0f172a]">{faq.q}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl bg-[#0f172a] p-8 text-center text-white">
        <h2 className="text-2xl font-bold">先装上，再决定买不买</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-[#cbd5e1]">
          Alpha Desk 免费可装可长期使用；Pro 解锁全部报告与云端研究能力。云端记忆独立加购，按需开通。
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/apply?product=alpha-desk" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f1f5f9]">申请 Pro</Link>
          <Link href="/apply?product=memory" className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">申请云端记忆</Link>
          <Link href="/alpha-desk" className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">已有 license 去激活</Link>
        </div>
      </section>
    </main>
  );
}
