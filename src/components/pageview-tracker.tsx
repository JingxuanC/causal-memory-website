"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Cookie-less pageview beacon. Skips /admin, /api and duplicate paths. */
export function PageviewTracker() {
  const pathname = usePathname();
  const last = useRef<string>("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    const payload = JSON.stringify({ path: pathname, referrer: document.referrer.slice(0, 300) });
    try {
      const sent = navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
      if (!sent) {
        void fetch("/api/track", { method: "POST", body: payload, keepalive: true, headers: { "content-type": "application/json" } });
      }
    } catch {
      void fetch("/api/track", { method: "POST", body: payload, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
