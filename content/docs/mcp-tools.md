---
title: MCP Tools
description: All 17 MCP tools — when to call them and what they do
order: 2
---

# Seventeen MCP tools

| Tool | When to call | What it does |
|---|---|---|
| `record_decision` | After acting on a decision | Logs `decision → outcome` as a causal edge with relation type; optional `context` records the world state — same task_tag + context becomes a comparable branch (fork) |
| `remember` | After any meaningful exchange | Zero-friction alternative: paste conversation text, LLM auto-extracts facts/lessons/causal edges |
| `search_causal` | Before a non-trivial decision | BM25 + semantic retrieval of past causal episodes |
| `record_fact` | When learning a stable fact | Records flat facts with scope + confidence; idempotent |
| `search_facts` | When you need "what is" info | BM25 + semantic retrieval over the fact layer |
| `search_memory` | When unsure which type | Unified: facts + causal lessons fused by RRF |
| `trace_cause` | When something fails | Single-hop reverse: which decision caused this outcome |
| `trace_cause_chain` | Deep failure analysis | Multi-hop backward traversal through the causal graph |
| `invalidate_decision` | When a lesson is wrong | Soft-invalidate (hidden from search, kept for audit) |
| `invalidate_pattern` | When a mined pattern is wrong | Soft-invalidate a meta edge (the #N handle from `search_patterns`) |
| `resolve_updates` | After contradicting outcomes | LLM-judged supersession pass over diverged repeated decisions |
| `search_patterns` | To recall cross-task lessons | Mined meta edges: similar_to / repeated / contradicts / refines |
| `causal_directory` | Pinned in system prompt | L0 compact pointer list of what the agent knows |
| `intervention_query` | **Before taking an action** | Forward simulation: predicts outcomes (safe / warning / danger) |
| `counterfactual_query` | When choosing between options | Contrastive: compares recorded outcomes of two alternatives; renders same-context branches (natural experiments) when they exist; every verdict logs a falsifiable prediction |
| `prediction_report` | Periodic calibration check | Prediction-ledger accuracy overall / per method / per task_tag + pending list |
| `reconstruct_lesson` | When you want the distilled lesson | Reconstructive retrieval: Markov-blanket subgraph → coherent narrative, with optional N-way calibration |

## The two that matter most

**`intervention_query`** runs *before* an action and simulates forward through the causal graph. If a similar past action caused a production incident, the agent gets a DANGER chain citing the exact lesson — before it runs the command, not after.

**`record_decision`** closes the loop. Every outcome — especially surprising ones — becomes a typed causal edge (`caused` / `enabled` / `prevented` / `no_effect`) that future retrieval can find.
