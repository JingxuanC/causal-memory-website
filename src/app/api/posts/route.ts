import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

const blogDir = path.join(process.cwd(), "content", "blog");

function slugify(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii || `post-${Date.now()}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { title, description, body, slug: rawSlug, date, overwrite } = await request.json().catch(() => ({}));
  if (typeof title !== "string" || !title.trim() || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }
  const slug = typeof rawSlug === "string" && rawSlug.trim() ? slugify(rawSlug) : slugify(title);
  const file = path.join(blogDir, `${slug}.md`);
  if (fs.existsSync(file) && overwrite !== true) {
    return NextResponse.json({ error: "slug exists", slug }, { status: 409 });
  }
  const postDate = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : new Date().toISOString().slice(0, 10);
  const md = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: "${postDate}"\ndescription: "${String(description ?? "").replace(/"/g, '\\"')}"\n---\n\n${body.trim()}\n`;
  fs.mkdirSync(blogDir, { recursive: true });
  fs.writeFileSync(file, md);
  return NextResponse.json({ slug }, { status: 201 });
}
