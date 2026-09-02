---
title: HTTP Transport & Observability
description: Remote agents, multi-agent shared memory, and observability endpoints
order: 3
---

# HTTP transport

For remote agents or multi-agent shared memory, run the MCP Streamable HTTP server:

```bash
causal-memory http --port 9938
```

## Observability endpoints

Served on the same port:

```
GET /metrics                    Prometheus text (RED + recall metrics)
GET /healthz / /readyz          liveness / readiness (readiness probes the store)
GET /debug/recall?query=...     run a recall now, return the full JSON trace
                                (seeds, hop summary, per-result provenance)
GET /debug/recalls              newest-first recall audit rows (persisted,
                                schema v13 recall_audit table; survives restarts)
```

## Authentication

`/metrics` and `/debug/*` expose the recall corpus, so they accept opt-in bearer auth: set `CAUSAL_MEMORY_HTTP_AUTH_TOKEN` (env or `causal-memory setconfig`) and they require `Authorization: Bearer <token>` (unset = open, the previous behavior).

`/healthz` / `/readyz` stay open on purpose — kubelet probes cannot send bearer headers and leak nothing. `/mcp` auth is not covered by the token (rmcp restricts it to loopback Host headers by default).

> **Warning:** without the token set, do not expose the port to the public internet.

## Logging

Structured JSON logs on stderr:

```bash
CAUSAL_MEMORY_LOG_FORMAT=json
```
