---
title: Python 绑定
description: 通过 PyO3 在 Python 中使用全部记忆操作
order: 5
---

# Python 绑定（PyO3）

全部记忆操作都有 Python 包，构建于 MCP server 使用的同一个 `causal_memory::memory::Memory` 门面之上：

```bash
cd crates/causal-memory-py
pip install maturin
maturin develop          # 构建并安装到当前 venv
```

适用于希望在 Python 管线中使用因果记忆的场景——notebook、评测 harness、或不支持 MCP 的框架——无需运行 server。
