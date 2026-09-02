---
title: MCP 工具
description: 全部 17 个 MCP 工具——何时调用、做什么
order: 2
---

# 17 个 MCP 工具

| 工具 | 何时调用 | 功能 |
|---|---|---|
| `record_decision` | 做出决策并行动之后 | 把 `decision → outcome` 记录为带关系类型的因果边；可选 `context` 记录环境状态——相同 task_tag + context 构成可比较的分支（fork） |
| `remember` | 任何有意义的交流之后 | 零摩擦方案：粘贴对话文本，LLM 自动提取事实/教训/因果边 |
| `search_causal` | 非平凡决策之前 | BM25 + 语义检索历史因果经验 |
| `record_fact` | 学到稳定事实时 | 记录扁平事实，带 scope + 置信度；幂等 |
| `search_facts` | 需要「是什么」的信息时 | 在事实层做 BM25 + 语义检索 |
| `search_memory` | 不确定信息类型时 | 统一入口：事实 + 因果教训经 RRF 融合 |
| `trace_cause` | 出现失败时 | 单跳回溯：哪个决策导致了这个结果 |
| `trace_cause_chain` | 深度失败分析 | 沿因果图多跳反向遍历 |
| `invalidate_decision` | 教训被证伪时 | 软失效（检索中隐藏，保留审计） |
| `invalidate_pattern` | 挖掘出的模式有误时 | 软失效一条 meta 边（`search_patterns` 返回的 #N 句柄） |
| `resolve_updates` | 结果相互矛盾后 | LLM 裁判的替代（supersession）遍历，处理发散的重复决策 |
| `search_patterns` | 回忆跨任务教训 | 挖掘出的 meta 边：similar_to / repeated / contradicts / refines |
| `causal_directory` | 固定在 system prompt 中 | L0 紧凑指针列表：agent 都知道什么 |
| `intervention_query` | **采取行动之前** | 前向模拟：预测后果（safe / warning / danger） |
| `counterfactual_query` | 在两个方案间选择时 | 对比式：比较两个选项的历史后果；存在同上下文分支（自然实验）时呈现；每个判定都会记录一条可证伪预测 |
| `prediction_report` | 定期校准检查 | 预测台账准确率：总体 / 按方法 / 按 task_tag + 待验证列表 |
| `reconstruct_lesson` | 想要提炼后的教训时 | 重构式检索：Markov 毯子图 → 连贯叙事，可选 N 路校准 |

## 最重要的两个

**`intervention_query`** 在行动*之前*沿因果图前向模拟。如果类似的过往行动曾引发生产事故，agent 会在执行命令*之前*收到 DANGER 链，并引用具体的教训——而不是事后。

**`record_decision`** 闭合循环。每一个结果——尤其是意外的结果——都会成为类型化因果边（`caused` / `enabled` / `prevented` / `no_effect`），供未来检索。
