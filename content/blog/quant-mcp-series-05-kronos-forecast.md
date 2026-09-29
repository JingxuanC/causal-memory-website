---
title: "零样本 K 线预测：Kronos 不训练直接上岗（系列·伍）"
date: "2026-09-29"
description: "kronos-mcp 把时序基础模型包装成四个 MCP 工具：forecast_kline / forecast_signal / forecast_batch / forecast_compare——不微调、不用历史数据训练，直接对任意股票 OHLCV 做概率预测"
---

> 系列·伍。前面几篇都在"取数"和"挖因子"，本质上是用过去的规律做现在的判断。这篇换个思路：Kronos 是一个在百万级金融时序上预训练好的基础模型，零样本（zero-shot）就能对任意股票的 K 线做概率预测——不需要你的数据、不需要微调。我们把它包成了 kronos-mcp。

## 为什么需要"预测"这一层

因子体系回答的是"什么样的股票未来收益高"（截面排序问题），但落到一次具体交易，你还需要回答三个更细的问题：

1. **方向**：未来 N 天大概涨还是跌？
2. **幅度**：预期收益多少，值不值得冒这个险？
3. **不确定性**：这个预测有多靠谱，仓位该多重？

传统做法是再训一个 LSTM/Transformer。Kronos 的思路是：金融时序的底层模式（趋势、周期、波动聚集）是跨标的共享的，一个在百万条序列上预训练好的模型，迁移到新股票上不需要任何再训练。这就是"零样本预测"的意义——**冷启动成本为零**。

## 四个工具，各司其职

kronos-mcp 的 `tools.py` 里暴露了四个工具，签名值得逐一看：

### forecast_kline —— 看形状，不只看涨跌

输入一段历史 OHLCV（lookback 窗口），输出未来 N 天的完整 K 线预测：不只是收盘价一个数，而是**开高低收量五列的概率分布**。输出里带一个 summary：方向、预期收益、波动率，以及 uncertainty 区间。

两个实用细节：

- `model="chronos2"` 参数可以切到亚马逊 Chronos-2 后端，此时只预测收盘价，但会给出 `close_p10` / `close_p90` 分位数——适合做风险预算（"90% 概率跌不破这个位置"）。
- lookback 超过模型的 `MAX_CONTEXT` 会自动截断，遇到周末自动跳过（A 股没有周六的 K 线，模型不该被喂一个不存在的交易日）。

### forecast_signal —— 采样投票，给出置信度

单次预测有随机性，所以 `forecast_signal` 做 N≤5 次独立采样，把方向一致性变成置信度：

```
confidence = 方向一致率 × 1/(1 + 预期收益标准差%)
```

五次采样里四次看涨、且四次预期收益接近，confidence 就高；五次采样方向打架，confidence 自然低。**这个 confidence 就是后面 Laya 闸门要消费的信号**。

### forecast_batch —— 异步批处理，单票故障不炸全批

全市场 5000 只股票挨个预测，同步调用会超时。`forecast_batch` 提交异步 job 返回 job_id，用 `job_status` 轮询；关键设计是**单项容错**——某只股票数据缺失或预测失败，只标记该项失败，不拖垮整个批次。

### forecast_compare —— 双模型对拍

`forecast_compare` 串行跑两个模型（如 Kronos vs Chronos-2），对比同一 lookback 下的预测差异。同样单边失败不拖垮另一边——工程上的"隔离故障"思路和 forecast_batch 一致。

## 诚实的声明：权重这一步我没跑通

写这篇时我本打算真跑一遍 Kronos 预测，但 HuggingFace 下载预训练权重在当前网络环境下不通（这个坑在第 1 篇环境篇也出现过）。所以本文的工具签名和参数细节来自 `tools.py` 源码精读，而非实际调用输出——这是本系列第一次"讲设计多于讲运行结果"。

好在部署路径是现成的，权重问题在服务器上不存在：

```bash
# Docker 一键部署（镜像内自带权重下载逻辑）
docker build -t kronos-mcp .
docker run -p 50056:50056 kronos-mcp

# 客户端接入（Claude Desktop / Cursor 同理）
# "kronos": { "command": "docker", "args": ["run", "-i", "--rm", "kronos-mcp"] }
```

硬件要求：CPU 可以跑（Kronos-1.5B 量化后约 1 GB 内存），有 GPU 会快 10 倍以上。服务器规格参考第 1 篇的部署章节。

## 它在全家桶里的位置

到这里，本系列的四块数据拼图齐了：

```
行情/K线（astock）──┐
龙虎榜/资金流（astock）──┼──→ 因子挖掘（factor-miner）──→ 综合信号
新闻（news-mcp）──┘                            │
K 线预测（kronos）──────────────────────────────┘
```

但"信号齐了"不等于"可以下单"。一个 +3% 预期收益的预测，遇到 653% 涨幅的新股照样应该被拒绝。下一篇的主角是 Laya——一个非自回归的 System 1 决策引擎，负责在信号和下单之间放一道闸门。

> 项目地址：[github.com/JingxuanC/kronos-mcp](https://github.com/JingxuanC/kronos-mcp)
> 模型论文：[Kronos: A Foundation Model for the Language of Financial Markets（arXiv:2503.08677）](https://arxiv.org/abs/2503.08677)
