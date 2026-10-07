import { getChapters } from "@/lib/markdown";
import { BookShell } from "@/components/book-shell";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  const chapters = getChapters().map((c) => ({ slug: c.slug, title: c.title }));
  return <BookShell chapters={chapters}>{children}</BookShell>;
}
