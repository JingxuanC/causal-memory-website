---
title: "用 MCP 把量化研究流水线接到 AI Agent 上（系列·壹）：10 分钟跑通第一个行情查询"
date: "2026-09-29"
description: "为什么把量化工具做成 MCP 服务而不是脚本/包？装一个 astock-data-mcp，用自然语言查到茅台实时行情——本系列全部案例均为真实运行输出"
---

> 这个系列面向**懂炒股、有一点量化和 AI 基础**的朋友：不写"什么是大模型"的科普，只讲怎么用一套开源工具，把自己的研究流水线接到 AI Agent 上。系列涉及的每个项目都在 GitHub 开源，**文中所有命令输出都是真实跑出来的**（运行日期 2026-09-29，盘后），不是文档示例。

## 为什么要 MCP，而不是脚本或 Python 包？

做量化的同学大多有这样的文件夹：`fetch_data.py`、`backtest.py`、`factor_test.py`……每换一个策略就要重写一遍胶水代码。AI Agent 时代这个问题被放大了：**Agent 不会用你写的函数，但它会用工具（Tool）**。

MCP（Model Context Protocol）就是"工具的标准插座"。把一个量化数据服务做成 MCP 之后：

- Claude Code / Kimi / 任何 MCP 客户端都能直接调用，不用写接入代码
- 工具自带参数 schema，Agent 知道每个参数该传什么类型（`symbol` 是字符串、`count` 是整数）
- 45 个工具一次全挂上，Agent 自己决定查行情还是查龙虎榜

```
你的提问                    MCP 客户端                  MCP 服务（astock-data-mcp）
"茅台现在多少               ── tools/list ──▶           ┌─ market    行情/K线/资金流
 钱，放量了吗？"            ◀─ 45 个工具描述 ──          ├─ sentiment 涨停池/龙虎榜/热榜
                            ── tools/call ──▶           ├─ research  研报/公告/F10
                            ◀─ 结构化 JSON ──           └─ options   期权/希腊字母
```

## 10 分钟跑起来

```bash
git clone https://github.com/JingxuanC/astock-data-mcp.git
cd astock-data-mcp
pip install requests           # 唯一的第三方依赖
python3 server.py --port 50052
```

服务起在 `50052`，同时暴露三个入口：

- `GET /tools` —— 45 个工具的清单和参数 schema
- `POST /call-tool` —— HTTP 直连
- `/mcp` —— MCP 协议端点（Claude Code 等客户端挂这里）

挂上 Claude Code 的配置（`~/.claude.json` 或项目 `.mcp.json`）：

```json
{
  "mcpServers": {
    "astock": {
      "url": "http://127.0.0.1:50052/mcp"
    }
  }
}
```

然后就可以用自然语言问了。下面是直接调用 handler 的**真实输出**：

```
> get_a_realtime(symbol="600519,000001,300750")

600519 贵州茅台  price=1235.58  pct=-0.67  turnover=0.21  pe=18.97
000001 平安银行  price=11.35    pct=+0.44  turnover=0.36  pe=5.07
300750 宁德时代  price=286.8    pct=-1.78  turnover=0.7   pe=15.61
```

注意几个细节，这是这个服务和"随手写的爬虫"的差别：

- **代码写法全兼容**：`600519` / `sh600519` / `SH600519` / `600519.SH` 都能收，北交所 `43/83/87/92` 号段也能识别——因为调用方是 LLM，代码格式随机，必须宽容
- **批量查询**：`symbol` 支持逗号分隔一次查多只，腾讯接口一次往返
- **错误可操作**：传错代码返回 `{"error": "...", "code": "invalid_symbol", "hint": "支持 600519 / sh600519 ..."}`，Agent 看到 hint 能自己纠正，而不是对着 `IndexError` 发呆

## 这个系列的路线图

| 篇 | 主题 | 会用到的项目 |
|---|---|---|
| 壹（本篇） | 环境搭建 + 行情查询 | astock-data-mcp |
| 贰 | 数据层深入：45 工具六域实战 | astock-data-mcp |
| 叁 | 新闻链路：采集→去重→事件分类 | news-mcp |
| 肆 | 因子挖掘与回测的纪律 | factor-miner-mcp |
| 伍 | Kronos：K 线时序基础模型 | kronos-mcp |
| 陆 | Laya 决策闸门：让 AI 快判断、不胡编 | laya（开源 Jev 平替） |
| 柒 | 组装全家桶：一条完整流水线 | quant-agent-skills |

整套东西的设计哲学贯穿全系列：**数据源直连零 akshare、LLM 友好的错误信息、宁报错不返回脏数据**。下一篇先把数据层玩透。

> 项目地址：[github.com/JingxuanC/astock-data-mcp](https://github.com/JingxuanC/astock-data-mcp)
