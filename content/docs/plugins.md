---
title: Plugins
description: Hermes memory provider and DeepSeek Harness native plugin
order: 6
---

# Integrations

## Hermes memory provider

The [Hermes plugin](https://github.com/JingxuanC/causal-memory/tree/main/hermes-plugin) wires causal-memory into the Hermes agent framework as its memory provider — `record_decision` on outcomes, `search_causal` / `intervention_query` before actions, with no prompt surgery.

## DeepSeek Harness (DSH) native plugin

The [DSH plugin](https://github.com/JingxuanC/causal-memory/tree/main/dsh-plugin) integrates causal-memory natively into DeepSeek Harness, so harness agents get the full causal toolkit (17 MCP tools) out of the box.

## Anything MCP-compatible

Because causal-memory is a standard MCP server (stdio or Streamable HTTP), any MCP-capable agent — Claude Code, Cursor, Kimi Code CLI, Codex, Copilot, grok-build — can use it with a three-line config. See [Getting Started](/docs/getting-started).
