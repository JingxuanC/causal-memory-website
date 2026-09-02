---
title: HTTP Transport 与可观测
description: 远程 agent、多 agent 共享记忆与可观测端点
order: 3
---

# HTTP transport

面向远程 agent 或多 agent 共享记忆，运行 MCP Streamable HTTP server：

```bash
causal-memory http --port 9938
```

## 可观测端点

同一端口提供服务：

```
GET /metrics                    Prometheus 文本（RED + 召回指标）
GET /healthz / /readyz          存活 / 就绪探针（就绪会探测存储）
GET /debug/recall?query=...     立即执行一次召回，返回完整 JSON 追踪
                                （种子、跳数摘要、逐结果溯源）
GET /debug/recalls              最新的召回审计记录（持久化，
                                schema v13 recall_audit 表，重启不丢）
```

## 鉴权

`/metrics` 和 `/debug/*` 会暴露召回语料，因此支持可选的 bearer 鉴权：设置 `CAUSAL_MEMORY_HTTP_AUTH_TOKEN`（环境变量或 `causal-memory setconfig`）后，这些端点要求 `Authorization: Bearer <token>`（未设置 = 开放，即旧行为）。

`/healthz` / `/readyz` 刻意保持开放——kubelet 探针无法携带 bearer 头，且不泄露任何信息。`/mcp` 不在此 token 覆盖范围内（rmcp 默认已限制为 loopback Host 头）。

> **警告：** 未设置 token 时，不要把该端口暴露到公网。

## 日志

stderr 输出结构化 JSON 日志：

```bash
CAUSAL_MEMORY_LOG_FORMAT=json
```
