---
title: 插件生态
description: Hermes 记忆提供者与 DeepSeek Harness 原生插件
order: 6
---

# 集成

## Hermes 记忆提供者

[Hermes 插件](https://github.com/JingxuanC/causal-memory/tree/main/hermes-plugin) 把 causal-memory 作为记忆提供者接入 Hermes agent 框架——结果产生时调用 `record_decision`，行动之前调用 `search_causal` / `intervention_query`，无需改动 prompt。

## DeepSeek Harness（DSH）原生插件

[DSH 插件](https://github.com/JingxuanC/causal-memory/tree/main/dsh-plugin) 将 causal-memory 原生集成进 DeepSeek Harness，harness 内的 agent 开箱即用全部 17 个 MCP 工具。

## 任何兼容 MCP 的客户端

causal-memory 是标准 MCP server（stdio 或 Streamable HTTP），任何支持 MCP 的 agent——Claude Code、Cursor、Kimi Code CLI、Codex、Copilot、grok-build——三行配置即可接入。见[快速上手](/docs/getting-started)。
