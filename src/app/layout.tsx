import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

const nav = [
  { href: "/docs/getting-started", label: "Docs" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/playground", label: "Playground" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[#1d3a5f] sticky top-0 z-40 bg-[#0b1220]/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-[#e8f1ff] tracking-tight">
              causal<span className="text-[#4cc2ff]">-memory</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[#93a7c4]">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-[#e8f1ff] transition-colors">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/dashboard" className="text-[#93a7c4] hover:text-[#e8f1ff] transition-colors">
                Cloud
              </Link>
              <a
                href="https://github.com/JingxuanC/causal-memory"
                className="rounded-md border border-[#2b4f7c] px-3 py-1.5 text-[#e8f1ff] hover:bg-[#101f3a] transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#1d3a5f] py-8 text-center text-sm text-[#5a719c]">
          <p>
            Apache-2.0 ·{" "}
            <a href="https://github.com/JingxuanC/causal-memory" className="hover:text-[#93a7c4]">
              github.com/JingxuanC/causal-memory
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
