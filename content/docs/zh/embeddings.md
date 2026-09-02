---
title: Embeddings
description: 本地 ONNX embedding（离线）或 HTTP 服务（OpenAI / 智谱等）
order: 4
---

# Embeddings

语义检索（余弦相似度）是对 BM25 的补充。两种 embedding 获取方式：

## 本地 ONNX —— 无需 API key

```bash
cargo build --release --features local-embed
```

使用 `BAAI/bge-small-en-v1.5`（384 维，约 130MB）。下载一次，之后完全离线。

## HTTP 服务（OpenAI / 智谱等）

```bash
export CAUSAL_MEMORY_EMBED_API=https://open.bigmodel.cn/api/paas/v4
export CAUSAL_MEMORY_EMBED_KEY=your-key
export CAUSAL_MEMORY_EMBED_MODEL=embedding-3
```

任何 OpenAI 兼容的 embeddings 端点均可。
