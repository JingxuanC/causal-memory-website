/**
 * Types shared by the admin request console (server page, client component and
 * the server-only quota proxy). This module must stay free of Node/server-only
 * imports so it can be imported with `import type` from client components.
 */

export const ADMIN_STATUS_FILTERS = ["pending", "approved", "rejected", "all"] as const;

export type AdminStatusFilter = (typeof ADMIN_STATUS_FILTERS)[number];

export type QuotaRequestEvent = {
  id: number;
  request_id: number;
  ts: number;
  actor: string;
  kind: string;
  detail: string;
};

/** Shape returned by quota-platform GET /api/requests (see _requests_list). */
export type QuotaRequest = {
  id: number;
  req_no: string;
  name: string;
  contact: string;
  purpose: string;
  product: string;
  want_groups: string[];
  granted_groups: string[];
  volume: string;
  status: string;
  created_at: number;
  decided_at: number | null;
  decided_by: string;
  reject_reason: string;
  mc_key_id: string;
  mc_key_name: string;
  picked_at: number | null;
  client_ip?: string;
  bound_user_id: string;
  tenant: string;
  claim_bound_at: number | null;
  token_pending?: boolean;
  token_age_sec?: number | null;
  events?: QuotaRequestEvent[];
};

export type QuotaListPayload = {
  requests: QuotaRequest[];
  pending_count: number;
  claimable_count: number;
  apply_groups: string[];
  tiers: string[];
  default_tier: string;
};

/**
 * Trimmed, serialisable row passed from the server page to the client table.
 * Keeping this separate from `QuotaRequest` avoids leaking fields the console
 * does not need (client_ip, raw event payloads, ...) into the RSC payload.
 */
export type AdminRequestRow = {
  id: number;
  reqNo: string;
  name: string;
  contact: string;
  purpose: string;
  product: string;
  status: string;
  createdAt: number;
  decidedAt: number | null;
  rejectReason: string;
  boundUserId: string;
  tenant: string;
  requestedGroups: string[];
  grantedGroups: string[];
  volume: string;
  mcKeyName: string;
  tokenPending: boolean;
  pickedAt: number | null;
};
