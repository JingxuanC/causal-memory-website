---
title: Consolidation & Distill
description: Sleep consolidation (SWR) and the causal distill pipeline
order: 8
---

# Sleep consolidation

```bash
causal-memory sleep --dry-run   # preview what would change
causal-memory sleep             # run consolidation cycle
```

Immutable SWR 2.0: produces a delta + clone (original graph untouched), with full audit log. Triple-criterion GC (weak AND dormant AND zero-access). Triggers automatically when novelty entropy exceeds threshold.

- **LTP** strengthens replayed edges
- **LTD** weakens unvisited edges
- **GC** forgets dormant ones — within a bounded forgetting budget

# Causal distill pipeline

The distiller extracts structured memories from raw conversations:

```
Raw conversation → V3 extraction prompt (130 lines, 6 rules, 5 few-shot)
                   ↓
  Fact/Preference → agent_facts table (BM25 + embedding searchable)
  Lesson/Event    → causal edges (self-referential, searchable)
  Causal          → proper directed edge: decision → outcome
                    with relation type (caused/enabled/prevented)
```

Raw turns go to `session_logs` (audit/replay only) — they never enter the retrieval pool. This write-time gatekeeping keeps BM25 precision high.
