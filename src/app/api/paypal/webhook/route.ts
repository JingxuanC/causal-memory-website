import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = (process.env.PAYPAL_API_BASE ?? "https://api-m.paypal.com").replace(/\/+$/, "");

function creds(): { id: string; secret: string; webhookId: string } | null {
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  return id && secret && webhookId ? { id, secret, webhookId } : null;
}

async function accessToken(id: string, secret: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}


async function findUserByEmail(email: string): Promise<{ id: string; plan: string } | null> {
  const exact = await prisma.user.findFirst({ where: { email }, select: { id: true, plan: true } });
  if (exact) return exact;
  const rows = await prisma.$queryRaw<{ id: string; plan: string | null }[]>`
    SELECT id, plan FROM User WHERE lower(email) = lower(${email}) LIMIT 1
  `;
  const row = rows[0];
  return row ? { id: row.id, plan: row.plan ?? "free" } : null;
}

type PayPalEvent = {
  event_type?: string;
  resource?: {
    id?: string;
    plan_id?: string;
    status?: string;
    subscriber?: { email_address?: string; payer_id?: string };
  };
};

export async function POST(request: Request): Promise<Response> {
  const config = creds();
  if (!config) {
    return Response.json({ error: "paypal_not_configured" }, { status: 503 });
  }
  const raw = await request.text();
  let event: PayPalEvent;
  try {
    event = JSON.parse(raw) as PayPalEvent;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const headers = request.headers;
  const token = await accessToken(config.id, config.secret);
  if (!token) return Response.json({ error: "paypal_auth_failed" }, { status: 502 });

  const verify = await fetch(`${API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: config.webhookId,
      webhook_event: event,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const verdict = (await verify.json().catch(() => ({}))) as { verification_status?: string };
  if (!verify.ok || verdict.verification_status !== "SUCCESS") {
    return Response.json({ error: "signature_invalid" }, { status: 401 });
  }

  const type = event.event_type ?? "";
  const subscriptionId = event.resource?.id ?? "";
  const email = (event.resource?.subscriber?.email_address ?? "").trim().toLowerCase();
  const planId = event.resource?.plan_id ?? "";

  if (!subscriptionId) return Response.json({ received: true, ignored: "no-subscription" });

  if (type === "BILLING.SUBSCRIPTION.ACTIVATED" || type === "BILLING.SUBSCRIPTION.RE-ACTIVATED" || type === "PAYMENT.SALE.COMPLETED") {
    const record = await prisma.memorySubscription.upsert({
      where: { subscriptionId },
      create: { subscriptionId, planId, email, status: "ACTIVE", lastEvent: type, activatedAt: new Date() },
      update: { planId, email, status: "ACTIVE", lastEvent: type, activatedAt: new Date(), cancelledAt: null },
    });
    if (email) {
      const user = await findUserByEmail(email);
      if (user && (user.plan === "free" || user.plan === "" || user.plan === "memory")) {
        await prisma.user.update({ where: { id: user.id }, data: { plan: "memory" } });
        await prisma.memorySubscription.update({ where: { subscriptionId }, data: { userId: user.id } }).catch(() => {});
      }
      void record;
    }
    return Response.json({ received: true, activated: true });
  }

  if (type.startsWith("BILLING.SUBSCRIPTION.CANCELLED") || type === "BILLING.SUBSCRIPTION.SUSPENDED" || type === "BILLING.SUBSCRIPTION.EXPIRED") {
    const status = type.endsWith("CANCELLED") ? "CANCELLED" : type.endsWith("SUSPENDED") ? "SUSPENDED" : "EXPIRED";
    await prisma.memorySubscription.upsert({
      where: { subscriptionId },
      create: { subscriptionId, planId, email, status, lastEvent: type, cancelledAt: new Date() },
      update: { status, lastEvent: type, cancelledAt: new Date() },
    });
    if (email) {
      const user = await findUserByEmail(email);
      if (user?.plan === "memory") {
        await prisma.user.update({ where: { id: user.id }, data: { plan: "free" } });
      }
    }
    return Response.json({ received: true, cancelled: true });
  }

  return Response.json({ received: true, ignored: type });
}
