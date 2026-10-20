export default function AdminLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="h-5 w-24 animate-pulse rounded bg-[#e2e8f0]" />
      <div className="mt-4 h-9 w-72 animate-pulse rounded bg-[#e2e8f0]" />
      <div className="mt-3 h-4 w-[32rem] max-w-full animate-pulse rounded bg-[#f1f5f9]" />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4">
            <div className="h-3 w-16 animate-pulse rounded bg-[#f1f5f9]" />
            <div className="mt-3 h-7 w-12 animate-pulse rounded bg-[#e2e8f0]" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[#f1f5f9]" />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <div className="h-5 w-24 animate-pulse rounded bg-[#e2e8f0]" />
          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-[#f1f5f9]" />
        </div>
        <div className="h-8 w-20 animate-pulse rounded-lg bg-[#f1f5f9]" />
      </div>

      <div className="mt-5 flex gap-1 rounded-xl border border-[#e2e8f0] bg-white p-1">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-8 w-20 animate-pulse rounded-lg bg-[#f1f5f9]" />
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
        <div className="h-11 border-b border-[#e2e8f0] bg-[#f8fafc]" />
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex gap-6 border-b border-[#f1f5f9] px-4 py-5 last:border-0">
            <div className="h-4 w-28 animate-pulse rounded bg-[#f1f5f9]" />
            <div className="h-4 w-64 animate-pulse rounded bg-[#f1f5f9]" />
            <div className="h-4 w-16 animate-pulse rounded bg-[#f1f5f9]" />
            <div className="h-4 w-24 animate-pulse rounded bg-[#f1f5f9]" />
          </div>
        ))}
      </div>
    </main>
  );
}
