import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { PaypalMemoryButton } from "@/components/paypal-memory-button";

export const metadata: Metadata = {
  title: "Products & install · Alpha Desk × Causal Memory",
  description:
    "Alpha Desk finance plugin (9 bots, 35 skills, market center, 6 report types) and the cloud causal-memory plugin (17 memory tools): what they do, pricing, and how to install.",
};

type Copy = {
  kicker: string;
  title: string;
  introA: string;
  introB: string;
  introC: string;
  ctaPro: string;
  ctaMemory: string;
  ctaInstall: string;
  alphaBadge: string;
  alphaDesc: string;
  alphaPrice: string;
  alphaPer: string;
  alphaBullets: string[];
  alphaCode: string;
  alphaNote: string;
  memBadge: string;
  memDesc: string;
  memPrice: string;
  memPer: string;
  memBullets: string[];
  memCode: string;
  memNote: string;
  installKicker: string;
  installTitle: string;
  installMeta: string;
  steps: { n: string; title: string; body: string; code?: string }[];
  memInstallTitle: string;
  memInstallBody: string;
  memInstallCode1: string;
  memInstallCode2: string;
  memInstallBody2: string;
  troubleTitle: string;
  troubles: { title: string; body: string }[];
  faqTitle: string;
  faqs: { q: string; a: string }[];
  finalTitle: string;
  finalBody: string;
  finalPro: string;
  finalMemory: string;
  finalActivate: string;
};

const COPY: Record<"zh" | "en", Copy> = {
  zh: {
    kicker: "DSH PLUGINS",
    title: "两个插件，一套投研工作台",
    introA: "把 9 个金融 Bot、35 个技能、行情中心和 6 种研究报告装进 DSH；",
    introB: "云端因果记忆",
    introC: "让「为什么这么判断、后来对不对」跨设备留存。都通过插件页安装，不需要命令行。",
    ctaPro: "申请 Alpha Desk Pro",
    ctaMemory: "申请云端记忆",
    ctaInstall: "安装指引",
    alphaBadge: "金融研究",
    alphaDesc: "面向 A 股的个人投研团队：主 Bot 拆活、9 个角色协作、结论必须带证据。",
    alphaPrice: "¥499",
    alphaPer: "/ 月",
    alphaBullets: [
      "9 个金融 Bot：数据官 / 事件官 / 复盘官 / 研究官 / 因子猎手 / 选股师 / 回测风控官 / 策略师 / 盯盘手",
      "35 个技能、61 个数据工具：行情、财报、公告、龙虎榜、资金流、因子、回测",
      "行情中心 + 仪表盘：K 线、指标、自选、可拖拽卡片、图上标注",
      "6 种研究报告：技术对比 / 事件点评 / 个股速览 / 财报点评 / 行业对比 / 深度个股",
    ],
    alphaCode: "deepseek-alpha-desk",
    alphaNote: "一次买断 ¥5,000 · 长期使用",
    memBadge: "记忆",
    memDesc: "决策 + 上下文 + 结果的因果三元组，跨设备、换机不丢；17 个工具直接挂进对话。",
    memPrice: "¥99",
    memPer: "/ 月",
    memBullets: [
      "17 个 MCP 工具：search_causal / record_decision / trace_cause / counterfactual_query 等",
      "租户隔离：tenant = u_<user id>，A 的 token 读不到 B 的记忆",
      "本地 + 云端：离线时工具明确报「未连接」，不伪造写入成功",
      "与 Alpha Desk 分开计费，可单独申请",
    ],
    memCode: "dsh-causal-memory",
    memNote: "API key 在 causal-memory.com 后台创建",
    installKicker: "INSTALL",
    installTitle: "安装指引 · 约 3 分钟",
    installMeta: "DSH Desktop 0.2.0-rc.2+ · macOS / Windows · 不需要命令行",
    steps: [
      { n: "01", title: "打开插件页", body: "DSH Desktop → 左下角 设置 → 插件，点右上角「+ 添加插件」。" },
      { n: "02", title: "填包名", body: "输入插件包名，注意不是 GitHub 地址。", code: "deepseek-alpha-desk" },
      { n: "03", title: "安装源切成自定义地址", body: "点「安装源」→ 自定义地址，粘贴私有 registry（公开可读，不需要账号）。", code: "https://causal-memory.com/npm/" },
      { n: "04", title: "安装并重启", body: "点「安装」，等下载完成；退出 DSH Desktop 再打开，插件才生效。" },
      { n: "05", title: "验证", body: "左侧出现 9 个 Bot、行情中心、仪表盘即安装成功；进群发一句话，Chief 会拆活。" },
    ],
    memInstallTitle: "装云端记忆（可选）",
    memInstallBody: "同一个插件页，包名换成",
    memInstallCode1: "dsh-causal-memory",
    memInstallCode2: "https://causal-memory.com/npm/",
    memInstallBody2: "装完后在 设置 → 因果记忆 粘贴 API key → 保存 → 测试连接（应显示「已连接 · 17 个工具」）→ 重启 DSH。",
    troubleTitle: "装不上？先对照这四种情况",
    troubles: [
      { title: "报 404 / 找不到包", body: "安装源没切到「自定义地址」，或包名拼错。" },
      { title: "报 TAR header / checksum", body: "用 pnpm/npm 直接装 URL 了，改用插件页安装。" },
      { title: "装完没有 Bot", body: "没重启 DSH，或插件列表里的开关没打开。" },
      { title: "卡在下载", body: "换网络/代理重试；安装源末尾要带斜杠。" },
    ],
    faqTitle: "常见问题",
    faqs: [
      { q: "需要自己准备模型 API key 吗？", a: "Alpha Desk 的 Bot 使用你在 DSH 里配置的模型（DeepSeek 官方或账号）。云端记忆额外需要一枚 causal-memory 后台创建的 cm_ token，与模型 key 无关。" },
      { q: "两个插件必须一起装吗？", a: "不必须。Alpha Desk 单独可用；云端记忆是独立加购，装了才挂 17 个记忆工具。两个都装时，设置页里分别配置。" },
      { q: "数据存在哪里？", a: "Alpha Desk 的行情缓存、Bot 配置在本机；云端记忆写在你自己的租户库（tenant = u_<你的 user id>），token 保存为 ~/.dsh/causal-memory.json（0600），网站只存 SHA-256。" },
      { q: "怎么购买 / 多久开通？", a: "在申请页提交 → 人工审批 → 用同一个 GitHub 账号领取 license 或记忆 token。当前没有在线支付，审批即确认付款。" },
    ],
    finalTitle: "先装上，再决定买不买",
    finalBody: "Alpha Desk 免费可装可长期使用；Pro 解锁全部报告与云端研究能力。云端记忆独立加购，按需开通。",
    finalPro: "申请 Pro",
    finalMemory: "申请云端记忆",
    finalActivate: "已有 license 去激活",
  },
  en: {
    kicker: "DSH PLUGINS",
    title: "Two plugins, one research desk",
    introA: "Put 9 finance bots, 35 skills, a market center and 6 report types inside DSH. ",
    introB: "Cloud causal memory",
    introC: " keeps the \"why did I decide this, and was it right?\" chain across machines. Both install from the plugin page — no command line.",
    ctaPro: "Apply for Alpha Desk Pro",
    ctaMemory: "Apply for cloud memory",
    ctaInstall: "Install guide",
    alphaBadge: "FINANCE",
    alphaDesc: "A personal A-share research team: a lead bot splits the work, 9 specialists collaborate, every conclusion needs evidence.",
    alphaPrice: "¥499",
    alphaPer: "/ mo",
    alphaBullets: [
      "9 finance bots: data, events, review, research, factor hunter, screener, backtest risk, strategist, market watcher",
      "35 skills and 61 data tools: quotes, filings, announcements, dragon-tiger list, fund flow, factors, backtests",
      "Market center + dashboard: candlesticks, indicators, watchlist, draggable cards, on-chart annotations",
      "6 report types: technical compare / event note / stock snapshot / earnings note / industry compare / deep dive",
    ],
    alphaCode: "deepseek-alpha-desk",
    alphaNote: "One-time ¥5,000 · lifetime use",
    memBadge: "MEMORY",
    memDesc: "Decision + context + outcome causal triples that survive a new laptop; 17 tools wired straight into chat.",
    memPrice: "¥99",
    memPer: "/ mo",
    memBullets: [
      "17 MCP tools: search_causal / record_decision / trace_cause / counterfactual_query and more",
      "Tenant isolation: tenant = u_<user id>, one token cannot read another tenant's memory",
      "Local + cloud: offline tools report \"not connected\" instead of faking a write",
      "Billed separately from Alpha Desk; can be bought on its own",
    ],
    memCode: "dsh-causal-memory",
    memNote: "Create the API key in the causal-memory.com dashboard",
    installKicker: "INSTALL",
    installTitle: "Install guide · about 3 minutes",
    installMeta: "DSH Desktop 0.2.0-rc.2+ · macOS / Windows · no command line",
    steps: [
      { n: "01", title: "Open the plugin page", body: "DSH Desktop → Settings → Plugins (bottom left), then \"+ Add plugin\" (top right)." },
      { n: "02", title: "Enter the package name", body: "Type the package name — not a GitHub URL.", code: "deepseek-alpha-desk" },
      { n: "03", title: "Switch the source to a custom registry", body: "Click \"Install source\" → Custom address, then paste the private registry (public read, no account needed).", code: "https://causal-memory.com/npm/" },
      { n: "04", title: "Install and restart", body: "Click Install and wait for the download; quit and reopen DSH Desktop so the plugin loads." },
      { n: "05", title: "Verify", body: "You should see 9 bots, the market center and the dashboard. Say something in the group; the lead bot will split the work." },
    ],
    memInstallTitle: "Cloud memory (optional)",
    memInstallBody: "On the same plugin page, use the package name",
    memInstallCode1: "dsh-causal-memory",
    memInstallCode2: "https://causal-memory.com/npm/",
    memInstallBody2: "Then open Settings → Causal Memory, paste the API key, save, run Test connection (expect \"Connected · 17 tools\"), and restart DSH.",
    troubleTitle: "Troubleshooting",
    troubles: [
      { title: "404 / package not found", body: "The source is not set to \"Custom address\", or the package name is misspelled." },
      { title: "TAR header / checksum error", body: "You installed the registry URL with pnpm/npm. Use the plugin page instead." },
      { title: "No bots after install", body: "DSH was not restarted, or the plugin toggle is still off." },
      { title: "Download stalls", body: "Retry on another network/proxy; the source URL needs the trailing slash." },
    ],
    faqTitle: "FAQ",
    faqs: [
      { q: "Do I need my own model API key?", a: "Alpha Desk bots use the model you configured in DSH (DeepSeek official or your account). Cloud memory additionally needs a cm_ token from the causal-memory dashboard — unrelated to the model key." },
      { q: "Must I install both plugins?", a: "No. Alpha Desk works alone; cloud memory is a separate add-on that mounts the 17 memory tools. If you install both, configure them on their own settings pages." },
      { q: "Where is the data stored?", a: "Alpha Desk keeps market caches and bot config locally. Cloud memory writes to your own tenant database (tenant = u_<user id>); the token lives in ~/.dsh/causal-memory.json (0600) and the website only stores its SHA-256." },
      { q: "How do I buy, and how fast is activation?", a: "Submit on the apply page → a human approves → claim the license or memory token with the same GitHub account. There is no online payment yet; approval confirms payment." },
    ],
    finalTitle: "Install first, decide later",
    finalBody: "Alpha Desk is free to install and use; Pro unlocks every report and cloud research. Cloud memory is a separate add-on, activated when you need it.",
    finalPro: "Apply for Pro",
    finalMemory: "Apply for cloud memory",
    finalActivate: "Activate an existing license",
  },
};

export default async function ProductsPage() {
  const lang = await getLang();
  const d = COPY[lang];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0284c7]">{d.kicker}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#0f172a] sm:text-5xl">{d.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#475569]">
          <strong className="text-[#0f172a]">Alpha Desk</strong> {d.introA}
          <strong className="text-[#0f172a]">{d.introB}</strong>
          {d.introC}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/apply?product=alpha-desk" className="rounded-md bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e293b]">{d.ctaPro}</Link>
          <Link href="/apply?product=memory" className="rounded-md border border-[#0284c7] px-5 py-2.5 text-sm font-semibold text-[#0284c7] transition-colors hover:bg-[#f0f9ff]">{d.ctaMemory}</Link>
          <a href="#install" className="rounded-md border border-[#cbd5e1] px-5 py-2.5 text-sm font-semibold text-[#0f172a] transition-colors hover:bg-[#f8fafc]">{d.ctaInstall}</a>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#e2e8f0] bg-white p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#0284c7]">{d.alphaBadge}</span>
              <h2 className="mt-3 text-2xl font-bold text-[#0f172a]">Alpha Desk</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{d.alphaDesc}</p>
            </div>
            <p className="text-right text-sm text-[#64748b]"><span className="block text-2xl font-bold text-[#0f172a]">{d.alphaPrice}</span>{d.alphaPer}</p>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-[#475569]">
            {d.alphaBullets.map((item) => (
              <li key={item} className="flex gap-2"><span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#0284c7]" />{item}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#e2e8f0] pt-5 text-sm">
            <code className="rounded-md bg-[#f8fafc] px-2 py-1 text-[#0f172a]">{d.alphaCode}</code>
            <span className="text-[#94a3b8]">{d.alphaNote}</span>
          </div>
        </article>

        <article className="rounded-2xl border border-[#ddd6fe] bg-[#faf5ff] p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7c3aed]">{d.memBadge}</span>
              <h2 className="mt-3 text-2xl font-bold text-[#0f172a]">{lang === "zh" ? "云端因果记忆" : "Cloud causal memory"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{d.memDesc}</p>
            </div>
            <p className="text-right text-sm text-[#64748b]"><span className="block text-2xl font-bold text-[#0f172a]">{d.memPrice}</span>{d.memPer}</p>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-[#475569]">
            {d.memBullets.map((item) => (
              <li key={item} className="flex gap-2"><span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-[#7c3aed]" />{item}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#ddd6fe] pt-5 text-sm">
            <code className="rounded-md bg-white px-2 py-1 text-[#0f172a]">{d.memCode}</code>
            <span className="text-[#7c3aed]">{d.memNote}</span>
          </div>
          <PaypalMemoryButton lang={lang} />
        </article>
      </section>

      <section id="install" className="mt-14 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e2e8f0] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0284c7]">{d.installKicker}</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0f172a]">{d.installTitle}</h2>
          </div>
          <p className="text-sm text-[#64748b]">{d.installMeta}</p>
        </div>

        <ol className="mt-6 space-y-3">
          {d.steps.map((step) => (
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
          <h3 className="text-lg font-semibold text-[#0f172a]">{d.memInstallTitle}</h3>
          <p className="mt-2 text-sm leading-7 text-[#475569]">
            {d.memInstallBody}{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[#0f172a]">{d.memInstallCode1}</code>
            {lang === "zh" ? "，安装源同样是 " : ", same source "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[#0f172a]">{d.memInstallCode2}</code>
            {" "}{d.memInstallBody2}
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-[#0f172a]">{d.troubleTitle}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {d.troubles.map((item) => (
              <div key={item.title} className="rounded-lg border border-[#e2e8f0] bg-white p-4 text-sm">
                <p className="font-semibold text-[#0f172a]">{item.title}</p>
                <p className="mt-1 leading-6 text-[#64748b]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold text-[#0f172a]">{d.faqTitle}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {d.faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#0f172a]">{faq.q}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl bg-[#0f172a] p-8 text-center text-white">
        <h2 className="text-2xl font-bold">{d.finalTitle}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-[#cbd5e1]">{d.finalBody}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/apply?product=alpha-desk" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f1f5f9]">{d.finalPro}</Link>
          <Link href="/apply?product=memory" className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">{d.finalMemory}</Link>
          <Link href="/alpha-desk" className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">{d.finalActivate}</Link>
        </div>
      </section>
    </main>
  );
}
