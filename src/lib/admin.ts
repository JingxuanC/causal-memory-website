import type { Session } from "next-auth";

/** Admin = session email listed in ADMIN_EMAILS (comma-separated). */
export function isAdmin(session: Session | null): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const email = session?.user?.email?.toLowerCase();
  return !!email && list.includes(email);
}
