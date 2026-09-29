---
title: "给信号装一道闸门：Laya 决策引擎的零样本边界（系列·陆）"
date: "2026-09-29"
description: "laya 非自回归决策引擎：单次前向传播完成选择/打分/是非判断，100+ 语言。用真实输出演示交易入场检查、风险分级、买卖决策——包括它判错的地方"
---

> 系列·陆。前面的 astock / news / factor-miner / kronos 都在生产"信号"。但信号只是输入，交易是决策：这笔单该不该进？进了仓位多重？今天的市场环境允不允许？这篇的主角 Laya 是一个非自回归（non-autoregressive）的 System 1 决策引擎——一次前向传播，直接输出结构化的判断结果，不逐 token 生成，所以延迟在百毫秒级。

## Laya 是什么，不是什么

Laya 仓库的自我定位很克制：**typed choice / score / yes-no decisions over any text in a single forward pass**。

- **是**：一个"文本 → 结构化判断"的分类头。给它一段文本（比如一条客服工单、一段行情摘要）和一组问题（选择题选项 / 打分标准 / 是非题），一次前向传播返回每题的概率分布。
- **不是**：不是 LLM，不会推理、不会生成解释。它的价值恰恰在"不推理"——延迟 100 ms 以内，适合放在高频决策路径上。

三种问题类型正好对应交易决策的三个环节：

| Laya 类型 | 交易语义 | 示例 |
|---|---|---|
| `choice` | 离散决策 | 买卖决策：full / half / skip |
| `score` | 连续分级 | 风险等级：0（低）~ 2（高） |
| `noul`（非是即否） | 闸门检查 | 是否满足全部入场规则 |

## 本地部署：两条命令

Laya 可以从 HuggingFace 拉 checkpoint，也可以手动下载后完全离线加载。今天这篇的所有输出都是本地 CPU 跑的：

```python
import laya

# 直接加载本地 checkpoint 目录（手动下载 lay-models/english 和 multilingual）
agent_en = laya.load("laya-models/english")
agent_ml = laya.load("laya-models/multilingual")

questions = {
    "department": {
        "type": "choice",
        "instructions": "Which department should handle this request?",
        "criteria": {"billing": "invoices, payments, refunds",
                     "technical": "bugs, outages, system errors",
                     "other": "everything else"},
    },
    "urgency": {"type": "score", "instructions": "How urgent?",
                "criteria": ["not urgent", "soon", "blocking"]},
    "churn_risk": {"type": "noul",
                   "instructions": "Does the user threaten to cancel or leave?"},
}

r = agent_en.predict("we were billed twice for March, refund today or we cancel",
                     questions)
# r["answers"]["department"]["choice"] == "billing", confidence 0.93
```

硬件要求极低——本文所有演示在普通 CPU 上完成，单次预测 40 ~ 1000 ms。

## 先跑一次原始能力：中英混排路由

用一个客服场景（和交易无关，但最能看清模型的"母语直觉"）做冒烟测试，真实输出：

```
--- [EN] "Hi, we were billed twice for March. Please refund the duplicate
         today or we will cancel our plan."
    department : billing    (conf 0.93)
    urgency    : 1.73/2     (conf 0.41)
    churn_risk : 0.879      ← P(true)，威胁流失的概率

--- [ZH] "你们这个月重复扣费了，今天不退款我们就停用服务。"
    department : billing    (conf 0.98)
    urgency    : 1.89/2     (conf 0.68)
    churn_risk : 0.059      ← 中文语义下几乎没读出"流失威胁"!

--- [ZH] "App 一打开设置就闪退，麻烦看下。"
    department : technical  (conf 0.62)
    urgency    : 1.83/2
    churn_risk : 0.005
```

第一个值得记录的现象：英文 checkpoint 对英文案例的 churn_risk 判断很好（0.879），但 multilingual checkpoint 对语义等价的中文案例几乎漏判（0.059）。**多语言模型的"翻译等效性"远没有宣传的那么可靠**——同样的语义，换语言，概率分布可以差 15 倍。这对量化场景是直接警告：你的交易规则文本用中文写还是用英文写，会得到不同结果。

## 第一次实战：把策略规则"文本化"喂给它

最直接的用法：把 6 条交易规则和行情状态拼成一段文本，让 Laya 做三步判断——入场检查、风险分级、买卖决策。三个候选交易（模拟信号层输出，600519 应通过、300750 和 601318 应拒绝），真实输出：

```
== EN / laya-english ==

Trade A (600519)  (1028 ms)
  入场检查: P(满足全部规则) = 0.554 ⚠低置信度
  风险分级: medium (期望档位 1.32/2)
  买卖决策: buy_full (P=0.62, conf=0.25) ⚠低置信度   ← 应通过，对了

Trade B (300750)  (242 ms)
  入场检查: P = 0.271
  买卖决策: buy_full (P=0.53, conf=0.17)              ← 应拒绝，判成了买入！

Trade C (601318)  (239 ms)
  入场检查: P = 0.699 ⚠低置信度
  买卖决策: buy_full (P=0.62, conf=0.25)              ← 应拒绝，也判成了买入

== ZH / laya-multilingual ==

交易A (600519):  入场 P=0.978 | 半仓买入 (P=0.79, conf=0.47)
交易B (300750):  入场 P=0.982 | 半仓买入 (P=0.75, conf=0.41)  ← 应拒绝！
交易C (601318):  入场 P=0.718 | 半仓买入 (P=0.53, conf=0.15)  ← 应拒绝！
```

结果很不好看：**"整体判断"模式下，Laya 几乎对所有输入都输出买入**——它对"规则集合"这种复合语义不敏感，把"文本里有 Kronos bullish"当成了主要特征。两条教训：

1. 零样本模型对复合规则（6 条 AND）的忠实度很低，准确率大约七成上下，且偏向"宽松"一侧——而交易闸门恰恰不能接受宽松。
2. 模型自带 confidence，且加载时就有 RuntimeWarning 提示部分 checkpoint 的温度参数越界、"confidence 应视为未校准"。**不要把它的 confidence 当概率用，只当排序信号**。

## 第二次实战：规则逐条分解（这才是正确姿势）

把"6 条规则 AND"拆成 6 个独立的 noul 问题，每条单独问，然后在代码里做 AND——Laya 只负责单条判断，逻辑组合交还给代码：

```
Trade A (600519, 应通过)  (395 ms)
  rule1_bullish=0.97✓  rule2_factor=0.87✓  rule3_news=0.95✓
  rule4_limit=0.89✓    rule5_exposure=0.36✗  rule6_atr=0.95✓
  综合判定: ❌ 拒绝 (skip)

Trade B (300750, 应拒绝)  (259 ms)
  rule1=0.83✓  rule2_factor=0.08✗  rule3_news=0.13✗  rule4_limit=0.10✗
  综合判定: ❌ 拒绝 (skip)   ← 正确拒绝

Trade C (601318, 应拒绝)  (239 ms)
  rule1=0.68✓  rule2_factor=0.90✓  rule3_news=0.18✗  rule4_limit=0.35✗
  综合判定: ❌ 拒绝 (skip)   ← 正确拒绝
```

拆开之后，错误模式完全变了：B、C 都被正确拒绝（它们的违规项 rule2/3/4 概率确实低），但**该通过的 A 也被拒了**——rule5_exposure=0.36，明明文本写的是 "Portfolio exposure: 62%"（低于 80% 应通过），模型却给了低概率。

这就是本系列最想让你看到的一条工程结论：

> **数值比较不要让 LLM（或类 LLM 模型）做，让代码做。**"62% < 80%" 是一行 Python 的事，Laya 的职责是把"regulator inquiry announcement" 这类**语义判断**映射成概率。"监管问询"算不算重大利空、"龙虎榜的上榜原因"是不是正常波动——这些语义归类是 Laya 的强项；而换手率阈值、仓位百分比，是代码的强项。各干各的。

另外注意 A 的 rule5 误判方向是**偏严**（该通过的拦住了），而第一次"整体判断"的误判方向是偏松（该拒绝的放行了）。闸门场景下，偏严的代价是少赚钱，偏松的代价是亏钱——所以即便都错，逐条分解的错误模式也更可接受。

## Laya 在全家桶里的位置

```
信号层（astock/news/factor/kronos 的输出，拼成"状态文本"）
      ↓
Laya 语义层：把状态文本 → 每条规则的 P(true)
      ↓
代码逻辑层：数值阈值用 Python 判，语义概率用阈值判
      ↓
决策输出：通过 / 拒绝 + 风险等级
```

下一篇把整条链路串起来：用今天的真实龙虎榜数据跑一遍完整流水线，看闸门如何处置一只上市首日涨 653% 的股票。

> 项目地址：[github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)
