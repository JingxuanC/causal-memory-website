---
title: Getting Started
description: Install causal-memory and wire it into your agent in three steps
order: 1
---

# Getting Started

causal-memory is an agent memory system with a causal core. Facts, temporal state, and `decision → outcome` causal edges live on one SQLite store, outside the agent's context window — so context compaction can never touch them.

## 1. Install

**Option A — pip (no Rust toolchain needed):**

```bash
pip install causal-memory
```

This puts the full `causal-memory` CLI on your PATH; a bare invocation is the stdio MCP server.

**Option B — build from source:**

```bash
git clone https://github.com/JingxuanC/causal-memory.git
cd causal-memory
cargo build --release
```

## 2. Wire it into your agent (MCP)

Add to your MCP configuration (Claude Code, Cursor, grok-build, etc.):

```json
{
  "mcpServers": {
    "causal-memory": {
      "command": "causal-memory",
      "env": {
        "CAUSAL_MEMORY_DB": "~/.local/share/causal-memory/causal.db"
      }
    }
  }
}
```

If you built from source, point `command` at `/path/to/causal-memory/target/release/causal-memory` instead.

## 3. Teach the agent when to use it

Agents don't call memory tools proactively without instruction. Install the bundled agent skill:

```bash
npx skills add JingxuanC/causal-memory@causal-memory
```

…or copy `skills/causal-memory/` into your agent's skills directory (e.g. `~/.agents/skills/causal-memory/`), or paste the repo's `CLAUDE.md` into your system prompt / `AGENTS.md`.

## Next steps

- [MCP Tools](/docs/mcp-tools) — all 17 tools and when to call them
- [HTTP Transport](/docs/http-transport) — remote agents and multi-agent shared memory
- [Embeddings](/docs/embeddings) — local ONNX or HTTP embedding providers
