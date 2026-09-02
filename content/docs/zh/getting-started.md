---
title: 快速上手
description: 三步安装 causal-memory 并接入你的 agent
order: 1
---

# 快速上手

causal-memory 是拥有因果内核的 agent 记忆系统。事实、时序状态与 `decision → outcome` 因果边统一存储在一个 SQLite 中，位于 agent 上下文窗口之外——上下文压缩永远无法触及。

## 1. 安装

**方式 A —— pip（无需 Rust 工具链）：**

```bash
pip install causal-memory
```

安装后 `causal-memory` CLI 即可使用；不带参数直接运行就是 stdio MCP server。

**方式 B —— 从源码构建：**

```bash
git clone https://github.com/JingxuanC/causal-memory.git
cd causal-memory
cargo build --release
```

## 2. 接入你的 agent（MCP）

在 MCP 配置中添加（Claude Code、Cursor、grok-build 等）：

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

如果是源码构建，把 `command` 改为 `/path/to/causal-memory/target/release/causal-memory`。

## 3. 教会 agent 何时使用

没有明确指令时，agent 不会主动调用记忆工具。安装随项目附带的 agent skill：

```bash
npx skills add JingxuanC/causal-memory@causal-memory
```

……或者把 `skills/causal-memory/` 复制到 agent 的 skills 目录（如 `~/.agents/skills/causal-memory/`），也可以把仓库里的 `CLAUDE.md` 粘贴进你的 system prompt / `AGENTS.md`。

## 下一步

- [MCP 工具](/docs/mcp-tools)——全部 17 个工具及其调用时机
- [HTTP Transport](/docs/http-transport)——远程 agent 与多 agent 共享记忆
- [Embeddings](/docs/embeddings)——本地 ONNX 或 HTTP embedding 服务
