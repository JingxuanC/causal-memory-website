---
title: 固化与蒸馏
description: Sleep 固化（SWR）与因果蒸馏管线
order: 8
---

# Sleep 固化

```bash
causal-memory sleep --dry-run   # 预览将要发生的变化
causal-memory sleep             # 执行一次固化循环
```

不可变 SWR 2.0：产出 delta + 克隆（原图不被修改），完整审计日志。三重判据 GC（弱 AND 休眠 AND 零访问）。当新颖度熵超过阈值时自动触发。

- **LTP** 强化被重放的边
- **LTD** 弱化未被访问的边
- **GC** 遗忘休眠的边——在有界的遗忘预算内

# 因果蒸馏管线

蒸馏器从原始对话中提取结构化记忆：

```
原始对话 → V3 提取 prompt（130 行，6 条规则，5 个 few-shot）
                   ↓
  事实/偏好 → agent_facts 表（BM25 + embedding 可检索）
  教训/事件 → 因果边（自指，可检索）
  因果      → 有向边：decision → outcome
              带关系类型（caused/enabled/prevented）
```

原始对话轮次进入 `session_logs`（仅审计/回放）——它们永远不会进入检索池。这种写入门控保证了 BM25 的高精度。
