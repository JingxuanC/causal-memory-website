---
title: Python Bindings
description: All memory operations from Python via PyO3
order: 5
---

# Python bindings (PyO3)

All memory operations are available as a Python package, built on the same `causal_memory::memory::Memory` facade the MCP server uses:

```bash
cd crates/causal-memory-py
pip install maturin
maturin develop          # builds and installs into the active venv
```

Use it when you want causal memory inside a Python pipeline — notebooks, eval harnesses, or frameworks that are not MCP clients — without running a server.
