---
title: Architecture
description: One graph, one engine, one loop — the hippocampus-style memory engine
order: 7
---

# Architecture

```
  ┌───────────────────────────────────────────────┐
  │           causal-memory (Rust, MCP)            │
  │                                                │
  │  17 tools ← Agent (stdio / HTTP)                │
  │    ↓                                           │
  │  Write-time gatekeeping                        │
  │    raw turns → session_logs (audit only)       │
  │    distill → facts + causal edges (searchable) │
  │    ↓                                           │
  │  Unified retrieval (RRF fusion)                │
  │    BM25 + semantic cosine → RRF merge          │
  │    Fact layer (BM25 + embeddings)              │
  │    ↓                                           │
  │  ┌──── Hippocampus engine ──────────────────┐  │
  │  │ CSR graph + spreading activation          │  │
  │  │  caused (+1.0)   enabled (+0.5)           │  │
  │  │  prevented (−0.3) ← GABA inhibitory       │  │
  │  │  fact (+0.8)     meta (+0.6)              │  │
  │  │  co_occurrence (Hebbian, dynamic)         │  │
  │  │                                            │  │
  │  │ DG: SimHash pattern separation             │  │
  │  │ CA3: K-hop spreading (forward + reverse)   │  │
  │  │ CA1: Novelty entropy trigger               │  │
  │  │ SWR: LTP/LTD/GC (immutable delta + clone)  │  │
  │  │ Q-value: Bellman dynamics (MemRL-style)    │  │
  │  └────────────────────────────────────────────┘  │
  │    ↓                                           │
  │  SQLite (causal.db) — never compacted          │
  └───────────────────────────────────────────────┘
```

The `causal_edges` table is never compacted — it lives outside the agent's context window. That's the entire point.

## Edge types

| Edge type | Spread coeff | Biological analogue | Meaning |
|---|---|---|---|
| `caused` | +1.0 | Glutamate (strong excitatory) | "Doing X caused Y" |
| `fact` | +0.8 | Semantic association | "User is/has Z" |
| `meta` | +0.6 | Cortical top-down | Cross-task pattern link |
| `enabled` | +0.5 | Weak excitatory | "Doing X enabled Y" |
| `co_occurrence` | dynamic | Hebbian LTP | "X and Y frequently co-occur" |
| **`prevented`** | **−0.3** | **GABA (inhibitory)** | **"Doing X prevented Y"** |
| `no_effect` | 0.0 | — | No causal relationship |

## The excitatory/inhibitory duality

HeLa-Mem (ACL 2026) builds the excitatory side (Hebbian co-activation, positive spread). causal-memory adds the inhibitory side (`prevented` edges spread **negative** activation — a GABA analogue). A complete memory needs both: "what caused this" *and* "what prevents this from happening again."

Interactive version: [Architecture explorer](/playground).
