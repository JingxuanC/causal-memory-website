---
title: Embeddings
description: Local ONNX embeddings (offline) or HTTP providers (OpenAI / ZhiPu / etc.)
order: 4
---

# Embeddings

Semantic retrieval (cosine similarity) complements BM25. Two ways to get embeddings:

## Local ONNX — no API key needed

```bash
cargo build --release --features local-embed
```

Uses `BAAI/bge-small-en-v1.5` (384 dims, ~130MB). Downloads once, then works fully offline.

## HTTP providers (OpenAI / ZhiPu / etc.)

```bash
export CAUSAL_MEMORY_EMBED_API=https://open.bigmodel.cn/api/paas/v4
export CAUSAL_MEMORY_EMBED_KEY=your-key
export CAUSAL_MEMORY_EMBED_MODEL=embedding-3
```

Any OpenAI-compatible embeddings endpoint works.
