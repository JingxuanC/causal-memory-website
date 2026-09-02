---
title: 架构
description: 一张图、一套引擎、一个循环——仿海马体记忆引擎
order: 7
---

# 架构

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

`causal_edges` 表永远不会被压缩——它位于 agent 上下文窗口之外。这就是全部意义所在。

## 边类型

| 边类型 | 扩散系数 | 生物学类比 | 含义 |
|---|---|---|---|
| `caused` | +1.0 | 谷氨酸（强兴奋性） | 「做 X 导致了 Y」 |
| `fact` | +0.8 | 语义关联 | 「用户是/有 Z」 |
| `meta` | +0.6 | 皮层自上而下 | 跨任务模式连接 |
| `enabled` | +0.5 | 弱兴奋性 | 「做 X 使 Y 成为可能」 |
| `co_occurrence` | 动态 | Hebbian LTP | 「X 与 Y 频繁共现」 |
| **`prevented`** | **−0.3** | **GABA（抑制性）** | **「做 X 阻止了 Y」** |
| `no_effect` | 0.0 | — | 无因果关系 |

## 兴奋/抑制二元性

HeLa-Mem（ACL 2026）构建了兴奋侧（Hebbian 共激活、正向扩散）。causal-memory 补上了抑制侧（`prevented` 边扩散**负向**激活——GABA 类比）。完整的记忆两者都需要：「什么导致了这件事」*以及*「什么能阻止它再次发生」。

交互版见[在线演示](/playground)。
