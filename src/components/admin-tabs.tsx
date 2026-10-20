import Link from "next/link";

const ITEMS = [
  { key: "requests" as const, href: "/admin", label: "申请审批" },
  { key: "monitor" as const, href: "/admin/monitor", label: "调用监控" },
];

export function AdminTabs({ active }: { active: "requests" | "monitor" }) {
  return (
    <nav className="mt-6 flex gap-2 border-b border-[#e2e8f0] text-sm">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={
            item.key === active
              ? "-mb-px border-b-2 border-[#0284c7] px-4 py-2 font-semibold text-[#0f172a]"
              : "-mb-px border-b-2 border-transparent px-4 py-2 text-[#64748b] transition-colors hover:text-[#0f172a]"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
