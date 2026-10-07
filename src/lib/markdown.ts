import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";

const contentRoot = path.join(process.cwd(), "content");

export type ContentItem = {
  slug: string;
  title: string;
  description: string;
  date?: string;
  order?: number;
  body: string;
};

function readDir(kind: "docs" | "blog" | "book", sub = ""): ContentItem[] {
  const dir = path.join(contentRoot, kind, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      return {
        // Node's readdir returns NFD-normalized names on macOS; URL params
        // are NFC. Normalize so CJK slugs (book chapters) match.
        slug: f.replace(/\.md$/, "").normalize("NFC"),
        title: String(data.title ?? f),
        description: String(data.description ?? ""),
        date: data.date ? String(data.date) : undefined,
        order: typeof data.order === "number" ? data.order : undefined,
        body: content,
      };
    });
}

export function getDocs(lang = "en"): ContentItem[] {
  const base = readDir("docs").sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  if (lang === "en") return base;
  const localized = readDir("docs", lang);
  return base.map((d) => localized.find((l) => l.slug === d.slug) ?? d);
}

export function getDoc(slug: string, lang = "en"): ContentItem | undefined {
  return getDocs(lang).find((d) => d.slug === slug);
}

export function getPosts(): ContentItem[] {
  return readDir("blog").sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function getPost(slug: string): ContentItem | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function getChapters(): ContentItem[] {
  return readDir("book").sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getChapter(slug: string): ContentItem | undefined {
  return getChapters().find((c) => c.slug === slug);
}

export async function renderMarkdown(md: string): Promise<string> {
  const result = await remark().use(remarkGfm).use(remarkHtml).process(md);
  return result.toString();
}
