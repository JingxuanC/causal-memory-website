import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getLang, t } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "causal-memory — agent memory with a causal core",
    template: "%s · causal-memory",
  },
  description:
    "An agent memory system with a causal core — and the only one that models inhibition. Facts, temporal state, and decision → outcome causal edges on one SQLite store.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const d = t(lang);
  const nav = [
    { href: "/docs/getting-started", label: d.navDocs },
    { href: "/benchmarks", label: d.navBenchmarks },
    { href: "/playground", label: d.navPlayground },
    { href: "/blog", label: d.navBlog },
    { href: "/book", label: d.navBook },
    { href: "/pricing", label: d.navPricing },
    { href: "/apply", label: d.navApply },
  ];
  const hubHref = "/hub/";

  return (
    <html lang={lang === "zh" ? "zh-CN" : "en"} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[#e2e8f0] sticky top-0 z-40 bg-[#ffffff]/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-[#0f172a] tracking-tight">
              causal<span className="text-[#0284c7]">-memory</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[#64748b]">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-[#0f172a] transition-colors">
                  {n.label}
                </Link>
              ))}
              <a href={hubHref} target="_blank" rel="noopener" className="hover:text-[#0f172a] transition-colors">
                {d.navHub}
              </a>
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <LangToggle lang={lang} />
              <Link href="/dashboard" className="text-[#64748b] hover:text-[#0f172a] transition-colors">
                {d.navCloud}
              </Link>
              <a
                href="https://github.com/JingxuanC/causal-memory"
                className="rounded-md border border-[#cbd5e1] px-3 py-1.5 text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#e2e8f0] py-8 text-center text-sm text-[#94a3b8]">
          <p>
            Apache-2.0 ·{" "}
            <a href="https://github.com/JingxuanC/causal-memory" className="hover:text-[#64748b]">
              github.com/JingxuanC/causal-memory
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
