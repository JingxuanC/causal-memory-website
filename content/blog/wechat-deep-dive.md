---
title: "causal-memory 深度拆解：唯一建模「抑制」的 Agent 记忆系统"
date: "2026-09-01"
description: "公众号分享：为什么做 causal-memory、海马体引擎原理、16 个 MCP tools、与 mem0/OpenViking 的公允对比、三分钟上手"
---

AGENT 记忆系统 · 开源项目深度分享

Rust · MCP Server · Apache-2.0 · v0.9.2-alpha · 368/368 测试全过 · `github.com/JingxuanC/causal-memory`
  现有的 agent 记忆系统都在回答「**发生了什么**」——事实、偏好、时序状态。causal-memory 回答的是另外三个问题：「**当时为什么这么做**」「**这么做会怎样**」「**换个做法会怎样**」。它把事实、时序状态、`decision → outcome` 因果边统一存进一个 SQLite，用一套仿海马体引擎驱动：带类型的扩散激活（兴奋性 **和** 抑制性）、Hebbian 共现强化、Q-value 动力学、不可变 SWR 固化。这篇文章把设计动机、引擎原理、16 个工具、查询/写入两条链路讲透，并和 mem0、OpenViking 做一次公允对比。

![](/blog/wechat/img1.gif)

30 秒演示：agent 准备 git push --no-verify → intervention_query 触发 DANGER 预警 → 引用上次「生产登录挂 40 分钟」的教训

## 01为什么做：agent 会忘记「当初为什么」

用过 coding agent 的人都有这个体验：长任务跑到一半，框架把历史对话压缩（compaction）了一轮又一轮，然后 agent 开始用**同样的错误方法反复修同一个 bug**，重新争论早已定下来的架构选型——它不是忘了「做过什么」，而是忘了「**当初为什么那么做、那么做的后果是什么**」。

这不是玄学，可以实测。我们用 grok-build 的生产压缩 prompt 做了一个真实 LLM 基准：把一段包含因果细节的对话反复压缩，每轮压缩后测两类召回——纯文本召回 vs 存在外部因果表里的同一信息：

| 压缩次数 k | 文本召回率 | 因果表召回率 |
|---|---|---|
| 1 | 100% | 100% |
| 2 | 85% | 100% |
| 3 | 55% | 100% |
| 5 | 45% | 100% |

两个值得注意的点：① 衰退不是渐进的，是 k=2→3 之间的**断崖**（85% → 55%）；② 压缩 5 次之后，文本只剩 45%，而因果表一行没丢。原因朴素得近乎无聊：**因果表活在 agent 的上下文窗口之外**，压缩作用于 messages 数组，够不着一张外部 SQLite 表。真正的问题不是「怎么让记忆活下来」（任何外部存储都能活），而是「活下来之后检索质量如何」——这是整张因果图存在的理由，后面会讲。

> 一句话：**因果信息是压缩下最脆弱的记忆类型**，所以它最不该待在上下文里。这就是整个项目的第一性原理。

## 02原理：给 agent 装一颗海马体

记忆科学的常识是：大脑不是一块硬盘。海马体至少分工成 DG（齿状回）、CA3、CA1 几个子区，再加上睡眠时的尖波涟漪（SWR）做离线巩固。causal-memory 的引擎把这套分工逐个映射成了工程组件——类比归类比，每一格都有具体的算法和参数：

       ****     ****     ****     **** ``    ****    | 脑区 / 机制 | 工程实现 | 干什么 |
|---|---|---|
| DG 齿状回（模式分离） | SimHash 128-bit 稀疏编码 | 近似重复的决策不重复播种，防止「差不多的记忆」互相污染 |
| CA3（联想 recall） | CSR 稀疏图 + K-hop 扩散激活（前向 + 反向双矩阵，≤5 hop，每 hop 衰减 ×0.7，阈值 0.1） | 从一个种子节点联想到相关的决策、结果、事实——「由彼及此」 |
| CA1（新颖性检测） | 对 replay-count 分桶算 Shannon 熵，熵 > 0.6 触发固化 | 经验足够多样时自动进入「睡眠」；千篇一律不触发 |
| SWR 尖波涟漪（睡眠巩固） | causal-memory sleep：LTP ×1.05（封顶 2.0）强化被回放的边、LTD ×0.99 全局衰减、三判据 GC 遗忘 | 离线整理记忆：常用的变强、没用的忘掉，产出不可变 delta + clone，全程审计日志 |
| Q-value（效用动力学） | Bellman 式更新（MemRL 思路），种子激活按 (0.5 + 0.5×Q) 加权 | 被证明有用的记忆，下次检索时天然排得更靠前 |

这套机制里最核心、也是和所有同类系统拉开差距的，是**兴奋 / 抑制二元性**。生物海马体里有两套神经递质：谷氨酸管兴奋（LTP，共同激活的连接变强），GABA 管抑制（压住不该激活的回路）。2026 年的记忆系统里，HeLa-Mem（ACL'26）把兴奋侧做得很完整——Hebbian 共激活、正向扩散；但抑制侧是空白。causal-memory 补上了这一侧：`prevented` 边在扩散时传播 **−0.3 的负激活**，一个工程化的 GABA 类似物。

![](/blog/wechat/img2.png)

**图 1** · 兴奋 / 抑制二元性：HeLa-Mem 做了左列，causal-memory 补齐右列

落到数据结构上，就是 7 种带类型的边，每种边有自己的扩散系数和生物学对应物：

        ``      ``      ``      ``      ``      ``  ****    ``     | 边类型 | 扩散系数 | 生物学类比 | 语义 |
|---|---|---|---|
| caused | +1.0 | 谷氨酸（强兴奋） | 「做了 X，导致了 Y」 |
| fact | +0.8 | 语义关联 | 「用户是 / 有 Z」 |
| meta | +0.6 | 皮层自上而下 | 跨任务的抽象模式链接 |
| enabled | +0.5 | 弱兴奋 | 「做了 X，使 Y 成为可能」 |
| co_occurrence | 动态（Hebbian） | Hebbian LTP | 「X 和 Y 频繁共现」，权重随共现增强 |
| prevented | −0.3 | GABA（抑制） | 「做了 X，阻止了 Y」 |
| no_effect | 0.0 | — | 无因果关系 |

值得多说一句的是合并规则：多路激活汇聚到同一节点时，取的是**绝对值最大**而非代数和最大——这意味着一条 `prevented` 边可以把一个原本「中性」的节点压成负激活。这个设计让抑制信号真的能「盖过」零激活，坏结局节点在最终排序里沉底，甚至以负值的形式作为风险提示出现。第 04 节的图会直观演示这一幕。

## 0316 个 MCP tools：按使用场景分组

16 个工具看着多，其实只有四种使用时机：**写完、查前、出事、动手前**。逐个说清「什么时候调、干什么」。

### ① 写入组 —— 事情做完之后调

record_decision

行动之后 · 核心写入

把一次「决策 → 结果」记成一条带类型的因果边，附 relation（caused/enabled/prevented/no_effect）、task_tag、confidence_source。最重要的一个工具。

remember

任何有意义的对话之后 · 零摩擦写入

不想手工整理时，把对话原文直接粘贴进来，LLM 自动提取事实 / 教训 / 因果边（走第 05 节的 distill 管线）。

record_fact

学到稳定事实时

记录扁平事实（带 scope 和 confidence），幂等——重复记同一条不会产生重复数据。

invalidate_decision

发现某条教训是错的

软失效：从检索中隐藏，但保留在库里供审计。纠错不毁证据。

invalidate_pattern

发现某条跨任务模式是错的

invalidate_decision 的 meta 边版本：把 search_patterns 挖出的模式边（similar_to / repeated 等）软失效——从检索结果和扩散激活中同时隐藏，保留审计。

resolve_updates

同一决策出现了不同结果

知识更新裁决：扫描被重新记录但结果不同的旧决策，LLM 判断新证据是否证伪旧教训；证伪则标记 superseded——旧教训带着更正注释留档，而不是被删掉。默认只预览，apply=true 才写入。

### ② 检索组 —— 需要「以前怎样」时调

search_causal

做非平凡决策之前

BM25 + 语义双路召回过去的因果片段（decision→outcome）。

search_facts

需要「是什么」的信息

只在事实层检索：用户偏好、技术栈、配置。

search_memory

不确定该查哪层

统一入口：事实 + 因果教训按 RRF 融合返回。不知道用哪个就用它。

search_patterns

想召回跨任务的抽象教训

查挖掘出的 meta 边：similar_to / repeated / contradicts / refines。

causal_directory

钉在 system prompt 里

L0 紧凑指针列表——让 agent 始终知道「我有哪些经验可查」，但不占上下文。

reconstruct_lesson

想要一条完整教训而非碎片

重建式检索：取 Markov 毯子图，让 LLM 重构成连贯叙事；支持 N 路独立重构交叉校准，重构不一致时警告「这段记忆不可靠」。

### ③ 诊断组 —— 出事之后调

trace_cause

刚翻车，找直接原因

单跳反向追溯：哪个决策导致了这个结果。

trace_cause_chain

根因不止一跳

多跳反向遍历整条因果链：服务挂了 ← OOM ← 缓存没设 TTL ← 当初配置时没加 expiry。

### ④ 决策前组 —— 动手之前调（最有记忆点的能力）

intervention_query

采取任何动作之前 · 前向模拟

从「你打算做的事」出发沿图前向遍历，收集相似历史决策造成过的后果，按极性标成 **safe / warning / danger**。Pearl 因果阶梯的第二级（干预）：不是「观察过 X」，而是「如果我现在做 X」。

counterfactual_query

两个方案二选一

对比式反事实：调出相似历史情境下两个备选方案各自的真实结果做对比。经验主义反事实，不做结构因果模型假设。

`intervention_query` 值得单独一个场景。README 里的 30 秒 demo：agent 即将执行 `git push --no-verify`，动手前调了一次 `intervention_query`，引擎沿图前向扩散，命中一条 DANGER 链——上次同样的操作被记录在案：

> **DANGER** · 相似历史动作 `git push --no-verify` 曾导致：**生产登录挂了 40 分钟，紧急回滚**（recorded as caused edge, task: release）。

注意这个能力的性质：它不是规则引擎里写死的「禁止 --no-verify」，而是**从 agent 自己的历史里长出来的预警**。换个项目、换个坑，只要上次记录过，下次动手前就会被拦住。这是「记忆」和「配置」的本质区别。

## 04重点图 1：一次查询在图中怎么走

以 `search_causal("cache stampede protection")` 为例，完整链路是：查询词 → BM25 + 语义**双路召回** → RRF 融合出种子节点 → 种子注入激活（按 Q 值加权）→ 沿带类型的边 K-hop 扩散 → 按激活值排序返回。下面这张图画出的是扩散完成后的最终状态。重点看——`prevented` 边（红色）把「死锁复发」节点压成 **−0.21 的负激活**。

![](/blog/wechat/img3.png)

**图 2** · 一次 `search_causal` 的完整传播链路（图为传播完成后的最终状态）

完整 10 步：

1.查询进入：统一检索层接收查询词。

2.双路召回：BM25 走关键词，语义走 embedding 余弦，互补漏召。

3.RRF 融合：两路排名按 Reciprocal Rank Fusion（k=60）合并。

4.种子确定：DG 的 SimHash 模式分离去掉近似重复，产出种子节点。

5.注入激活：种子按 (0.5 + 0.5×Q) 加权——被证明有用的记忆起点更高。

6.hop 1 · caused：+1.0 × 衰减 0.7 →「高负载下死锁」+0.70。

7.hop 1 · enabled：+0.5 × 0.7 →「击穿被挡住」+0.35。

8.反向扩散：fact 边沿反向 CSR 矩阵回流，双向支持种子。

9.hop 2 · 抑制：cooc 边把「锁超时+看门狗」带到 +0.14；它的 prevented 边把「死锁复发」压成 −0.21。

10.排序返回：按激活排序输出；负激活节点不作正面推荐，但作为风险提示出现。

第 9 步是整个系统最值钱的一幕。纯兴奋系统（比如只有 Hebbian 的 HeLa-Mem）里，「死锁复发」这个节点和查询高度相关，会被正常激活、正常返回——agent 看到的建议是「这些做法都和缓存击穿有关」，其中混着一个被证明没用的。而在这里，`prevented` 边把负激活打过去，合并规则取绝对值最大，**−0.21 直接盖过了它原本的 0**：坏结局沉底，真正修好的方案（锁超时 + 看门狗续期）浮上来。这就是「记住什么能阻止它再发生」的工程含义。

> 补充一个实现细节：图用 CSR（压缩稀疏行）格式存，前向、反向各一份矩阵，扩散就是稀疏矩阵乘向量（SpMV），cache 友好。反向矩阵让「从结果回溯决策」和「从决策推演结果」共用一套引擎。

## 05重点图 2：一条新记忆是怎么写进去的

写入有两条路径。**路径 A** 是显式的：agent 做完一个决策，直接调 `record_decision`，库里多出 decision 节点、outcome 节点和一条带类型的因果边，同时触发 Hebbian 共现检测——如果这次写入时有别的节点刚被激活过，就在它们之间建 `co_occurrence` 边（权重随共现动态增强）。**路径 B** 是自动的：`remember` 或 session 结束时走 distill 管线，LLM 从原始对话里提炼结构化记忆。两条路径之间有一道**写时门控**——原始对话只进 `session_logs` 审计表，永远不进检索池。

![](/blog/wechat/img4.png)

**图 3** · 两条写入路径与写时门控（写时门控架构借鉴自 mem0）

完整 8 步：

1.路径 A 入口：行动后调 `record_decision`，无 LLM 调用，零成本。

2.建节点建边：decision 节点 + outcome 节点 + 带类型因果边（relation / task_tag / confidence_source）。

3.Hebbian 共现：与本次激活过的节点建立 `co_occurrence` 边，权重随共现增强。

4.路径 B 入口：`remember` 接收原始对话全文。

5.写时门控：raw turns 只进 `session_logs` 审计表——不进检索池，BM25 精度不被噪声稀释。

6.V3 提取：130 行提取 prompt（6 条规则、5 个 few-shot）做一次 LLM 调用。

7.三路分流：fact → agent_facts 表；lesson → 自指因果边；causal → decision→outcome 有向边。

8.落库闭环：全部进检索池，下一条 `search_causal` 立刻能查到——写入到检索是同一个事务闭环。

写时门控这一点值得展开：为什么不让原始对话直接进检索池？因为对话里 90% 是噪声——客套、中间推理、被推翻的草案。它们一旦进池，BM25 的倒排索引就被稀释，精准度肉眼可见地掉。mem0 最早验证了这个架构（raw 进审计表、提炼后才进检索池），我们直接采纳了。Distill 管线的一次 LLM 调用产出三类结构化记忆，各进各的表：`agent_facts`（事实）、自指因果边（教训）、`decision→outcome` 有向边（因果）。

### 写入之后：SWR 睡眠固化

记忆写进去不是终点。生物记忆在睡眠时被「回放」并巩固，causal-memory 的 `sleep` 做同样的事——当 CA1 的新颖性熵（对 replay-count 分桶算 Shannon 熵）超过 0.6 时自动触发，也可以手动 `causal-memory sleep --dry-run` 预览：

![](/blog/wechat/img5.png)

**图 4** · SWR 2.0 固化循环：巩固不是改库，是产出一份可审查的 delta

「不可变」是刻意对齐 Anthropic Dreams API 的原则：固化的产出是**一份 delta 日志 + 原图的 clone**，原图一个字节不动。上层（人或 agent）审查 delta 后决定接受（原子切换）或丢弃（原图完好）。记忆系统改自己的记忆，和代码改自己的源码一样危险——先出 diff，再谈合入。

## 06公允对比：vs mem0，vs OpenViking

### vs mem0：它的主场我们不赢，我们的主场它没数据结构

mem0 是事实召回的标杆，这一点没有争议：LoCoMo（严格 judge）上 mem0 拿到 **91.6%**，我们是 79.1%——事实抽取和混合检索是它的主场，差距真实存在，我们不打算掩饰。LongMemEval 和 Memora MPA 上同样是它领先。

但 mem0 的数据结构里只有「what」——原子事实。它不存「这个决策导致了那个结果」，所以一切需要因果的问题它都回答不了。在专门测因果的 CausalEval 上：总分 **78% vs 65%**；C2 干预预测（「再做 X 会怎样」）**75% vs 40%**；C4 抑制（区分「根治」和「限制爆炸半径」）**80% vs 50%**。compaction 存活 **100% vs 45%**；trap-world 重复犯错率 **33% vs 67%**。另外坦承一句：我们的写时门控架构（session_logs 分离）就是从 mem0 学来的。因果不取代事实，因果填的是事实够不到的那一层——两者是叠加关系，不是替代关系。

### vs OpenViking：检索工程的顶级玩家，但同样是 notebook 架构

OpenViking（VLDB'26，27.7k★，Rust）把记忆组织成一棵可浏览的虚拟文件系统目录树，配 L0/L1/L2 分层加载：LoCoMo 80–83%，token 节省 34–91%。在检索工程和 token 效率上它是顶级玩家，分层加载的思路我们也借鉴了（L0 一行摘要 / L1 概览 / L2 全文，严格 token 预算）。

但范式的根本差异不变：目录树组织的是「知识在哪」，回答的还是 **what**；它回答不了「**为什么**当时那么做」和「**如果**换个做法会怎样」——答案不在它的数据结构里，这不是工程差距，是建模差距。有意思的是两者可以调和：我们的存储底层是可插拔的，事实层完全可以退化为对 OpenViking / LanceDB 存储的适配器，因果层作为上层语义增强运行——目录树管「找得到」，因果图管「想得明白」。

![](/blog/wechat/img6.png)

表格为图片，点击可放大查看

### 能力矩阵（数据来自项目 README）

![](/blog/wechat/img7.png)

表格为图片，点击可放大查看

HeLa-Mem（ACL'26）是最接近的学术对手：它把兴奋侧（Hebbian 共激活、正向扩散）做完整了，抑制侧空白。我们把它的 Hebbian 机制吸收为 7 种边之一（co_occurrence，动态权重），再加上它没有的抑制侧。

## 07谁该用 & 三分钟上手

**适合谁**：长期运行的 coding agent（同一项目跨几十上百个 session，重复踩坑代价最高）；跨会话的个人项目（上次为什么选这个方案，下周的自己会感谢现在记录的你）；多 agent 共享记忆（HTTP 模式起一个服务，多个 agent 读写同一份经验库，一个踩坑全队免疫）。如果你的场景是一次性问答、或者只需要记住用户偏好，mem0 那类事实库更合适——别为用不上的能力付复杂度。

**最小接入路径**（不需要 Rust 工具链）：
  # 1. 安装（pip 包自带完整 CLI，裸启动即 stdio MCP server）
 pip install causal-memory

 # 2. MCP 配置（Claude Code / Cursor / Kimi Code 等），3 行核心
 {
 "mcpServers": {
 "causal-memory": {
 "command": "causal-memory",
 "env": { "CAUSAL_MEMORY_DB": "~/.local/share/causal-memory/causal.db" }
 }
 }
 }

 # 3. 装 skill，教 agent「什么时候主动调」——不配这步它不会主动用
 npx skills add JingxuanC/causal-memory@causal-memory

多 agent 共享就用 HTTP 传输：`causal-memory http --port 9938`（MCP Streamable HTTP，同端口带 /metrics、/healthz、/debug/recall 可观测端点——注意无鉴权，别暴露公网）。embedding 可选：不配就退化为纯 BM25；配 HTTP API 或本地 ONNX（BAAI/bge-small-en-v1.5，384 维，下载一次后离线）都行。

### CausalEval v13 总表（140 题 · 20 张图 · 同模型同 judge）

![](/blog/wechat/img8.png)

表格为图片，点击可放大查看

诚实的收尾：C6 跨任务迁移 20% 是不如 mem0 的公开短板；纯事实召回打不过 mem0；前向模拟（intervention_query）已实现但还没有专门的预测准确率基准——这三条写在 README 和论文里，不藏着。但有一件事目前只有这个系统能做：让 agent 在**动手之前**，想起上次这么做的代价。

 **项目：**github.com/JingxuanC/causal-memory（Rust · Apache-2.0 · v0.9.2-alpha · 368 测试）· 研究笔记：agent-teardown insights/01–17
 **引用：**HeLa-Mem（ACL 2026，Hebbian 兴奋侧）· Anthropic Dreams API（不可变固化）· mem0（写时门控架构）· OpenViking（VLDB 2026，L0/L1/L2 分层加载）· MemRL（arXiv:2601.03192，Q-value 记忆动力学）· Pearl 2009 *Causality*
 **数据来源：**CausalEval v13（140q/20 graphs）· LoCoMo（严格 judge）· LongMemEval-S · Memora MPA · grok-build 生产压缩 prompt 实测 · trap-world agent 消融。全部基准 harness 在仓库 `benches/` 下可复现。

causal-memory · 技术深度分享 · 让 agent 不仅知道「世界什么样」，还知道「自己的每个决定，把项目推向了什么结果」