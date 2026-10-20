/** Fire-and-forget conversion event (pageviews already tracked by PageviewTracker). */
export function trackEvent(event: string): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ path: window.location.pathname, event });
  try {
    const sent = navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
    if (sent) return;
    void fetch("/api/track", { method: "POST", body: payload, keepalive: true, headers: { "content-type": "application/json" } });
  } catch {
    /* analytics must never break the form */
  }
}
