# Alpha Desk Pro → 云端记忆：统一签发与迁移

日期：2026-10-20  
对应审计：`reports/CLOUD-MEMORY-FLOW-AUDIT-2026-10-20.md` §8（P0-3、P1-1、P1-2、P1-3/4/5、P1-6、P1-8）

## 1. 目标与结果

一条链路：**GitHub User → LicenseClaim → ApiToken(tenant=`u_<id>`) → cloud.json → causal-memory tenant DB**。

- Pro 申请/领取需要登录；申请单在 quota-platform 侧绑定 `user.id`，领取时用 HMAC 身份头校验。
- 领取时自动生成一个 `cm_` 记忆 token，只存 SHA-256，tenant 固定 `u_<user.id>`，并原子写入 `cloud.json`。
- license 仍是 `ADK1` / `v:1`（安装端 0.1.15 只认 v1）；新增 `memory_url`、`memory_token`、`tenant`、`request`，同时保留 `cloud_key`，旧客户端不受影响。
- dashboard 签发的 token 与 Alpha Desk license 指向同一个 `u_<id>` tenant。
- 记忆 token 的创建受套餐门控（Pro/Team/Enterprise 或有效 Alpha Desk 记忆 claim）。
- 吊销：先写 DB（revokedAt + BridgeOutbox），再删 `cloud.json`；失败进入重试队列/对账脚本。
- `cloud.json` 读改写有跨进程文件锁 + 原子替换 + `.bak`；读失败抛错，绝不当成空 map 覆盖。

## 2. 环境变量

网站（Next.js）：

| 变量 | 必填 | 说明 |
|---|---|---|
| `CM_TOKENS_BRIDGE` | 生产必填 | causal-memory 的 `tokens/cloud.json` 可写路径；未配置时 token 创建/Pro 领取返回 503。 |
| `ALPHA_CLAIM_SECRET` | 生产必填 | 与 quota-platform 相同的 HMAC secret；用于 apply/pickup 身份头。 |
| `MEMORY_PUBLIC_URL` | 可选 | 写进新 license 的直连记忆端点，默认 `https://causal-memory.com/memory/mcp`。 |
| `ALPHA_LICENSE_PRIVATE_KEY_PATH` / `..._PUBLIC_KEY_PATH` | 已有 | license 签名密钥。 |

quota-platform：

| 变量 | 必填 | 说明 |
|---|---|---|
| `ALPHA_CLAIM_SECRET` | 生产必填 | 与网站一致；缺失时带身份头的请求一律 503/401（fail-closed）。 |
| `ALPHA_CLAIM_TTL_SECONDS` | 可选 | 身份头时间窗，默认 300 秒。 |
| `ALPHA_LEGACY_CLAIM` | 迁移期可选 | `1` 时允许 A 签发的旧 Alpha Desk 申请单在首次领取时绑定当前登录用户；默认 `0`（必须管理员先 bind）。 |
| `CAUSAL_MEMORY_TOKENS_FILE` | 建议 | 只给启动前检查用；quota 容器默认看不到该目录时只告警。 |
| `QUOTA_CLOUD_MEMORY_STRICT` | 建议 | `1` 时启动检查失败直接退出。 |

> 不要把 `ALPHA_CLAIM_SECRET` 写进 `config.json` 或日志。quota 只从环境变量读取。

## 3. 数据库变更

新增：

- `ApiToken.tenant`（默认空，写时 `u_<userId>`）、`expiresAt`、`source`；
- `LicenseClaim`：`reqNo @unique` → `userId`，记录 `tenant/plan/expiresAt/memoryTokenId/alphaKeyId/status`；
- `BridgeOutbox`：`cloud.json` 写失败的重试队列；
- `TenantAlias`：旧 email tenant → `u_<id>` 的读时映射。

### 3.1 新库 / 空库

`prisma/migrations/20261020000000_baseline` 是改动前的基线，
`20261020193000_alpha_claim_memory_token` 是本次变更；空库直接：

```bash
npx prisma migrate deploy
```

### 3.2 已有 SQLite 库（当前线上用 `prisma db push`）

Docker 入口已经改成：

```bash
prisma db push --skip-generate
prisma db execute --file prisma/backfill-tenants.sql --schema prisma/schema.prisma
```

手工执行等价于：

```bash
npx prisma db push
npx prisma db execute --file prisma/backfill-tenants.sql --schema prisma/schema.prisma
```

`backfill-tenants.sql` 幂等：把所有空 tenant 回填为 `u_<userId>`，并把当前 email 写入 `TenantAlias`。

> `prisma/migrations/20261020193000_alpha_claim_memory_token/migration.sql` 是完整的 schema/migration 交付；已有库走 db push + backfill，避免 baseline 冲突。

## 4. tenant 迁移（必须在上线新 claim 前完成）

新 token 写 `u_<id>`；旧 token / `cloud.json` 仍是 email。若直接上线，老用户会分裂成两个 tenant。按顺序做：

1. 备份 `quota/`、`cloud.json`、`tenants/`、网站 SQLite。
2. 回填 DB：`node scripts/migrate-tenants.mjs`（可 `--dry-run`）。
3. 打印 DB 复制命令：

   ```bash
   node scripts/plan-tenant-db-migration.mjs --tenants-dir /opt/mcp-suite/causal-memory/cm-data-home/.local/share/causal-memory/tenants
   ```

   审核后执行 `sqlite3 old "VACUUM INTO 'new.tmp'"` + `mv`。每个用户可能有多个 legacy tenant（改过邮箱）；先合并/选主库，不要静默丢弃。
4. 原子替换投影：

   ```bash
   node scripts/reconcile-memory-bridge.mjs --canonicalize-legacy
   ```

   这一步会把 `cloud.json` 全部改成 `u_<id>`；**必须先完成第 3 步**。
5. 验证：同一用户 dashboard token 与 license `memory_token` 命中同一个 `u_<id>` DB；A 的 token 读不到 B 的 fact。
6. 旧 DB 移到 `tenants/_legacy/` 只读保留 30 天。

回滚：恢复 `cloud.json` / `tenants/` / DB 备份；把 `ApiToken.tenant` 回填为 email（仅迁移窗口内），或直接用备份。不要同时保留同一个 hash 在两个 tenants 文件里。

## 5. 上线顺序（推荐）

### 5.1 环境变量

两套服务必须使用**同一个** `ALPHA_CLAIM_SECRET`（生成：`openssl rand -hex 32`）：

| 服务 | 变量 | 值 |
|---|---|---|
| website（systemd / Docker env） | `CM_TOKENS_BRIDGE` | `/opt/mcp-suite/causal-memory/tokens/cloud.json` |
| website | `ALPHA_CLAIM_SECRET` | `<32-byte hex>` |
| website | `MEMORY_PUBLIC_URL` | `https://causal-memory.com/memory/mcp` |
| quota-platform（compose environment / `.env`） | `ALPHA_CLAIM_SECRET` | 同上 |
| quota-platform | `ALPHA_LEGACY_CLAIM` | 仅迁移窗口 `1`，完成后删除/设为 `0` |
| quota-platform（可选） | `CAUSAL_MEMORY_TOKENS_FILE` / `QUOTA_CLOUD_MEMORY_STRICT` | 启动检查；strict=1 时失败退出 |

> 本次允许修改的仓库只有 website 和 `quota-platform/`；`docker-compose.yml`、systemd unit、nginx 不在改动范围，部署时需要手工把上面的 env 加进去（或由部署仓另行提交）。

网站若跑在容器里，还必须把 causal-memory 的 tokens 目录以**可写**方式挂进 web 容器
（同一路径），例如：

```yaml
volumes:
  - /opt/mcp-suite/causal-memory/tokens:/opt/mcp-suite/causal-memory/tokens
```

若网站是 systemd 裸进程（当前线上形态），直接使用宿主机路径即可，无需额外挂载。

### 5.2 顺序

1. **先修 P0-2/P0-1**：确认 `/memory/mcp` 已恢复；确认 `CAUSAL_MEMORY_TOKENS_FILE` 目录存在且非空；确认 `CAUSAL_MEMORY_ALLOW_OPEN` **未设置**。运行：

   ```bash
   python3 quota-platform/scripts/preflight_cloud_memory.py \
     --tokens-dir /opt/mcp-suite/causal-memory/tokens \
     --probe-url https://causal-memory.com/memory/mcp
   ```

   探针必须看到坏 token → 401；若 200，说明 causal-memory 处于 open 模式，先停服务修配置。
2. 部署 quota-platform（新增 `ALPHA_CLAIM_SECRET`、可选 `ALPHA_LEGACY_CLAIM=1` 仅迁移期），跑 Python 测试。
3. 网站备份 DB / `cloud.json` / `tenants/`，执行第 3、4 节 DB 与 tenant 迁移。
4. 网站配置 `CM_TOKENS_BRIDGE`、`ALPHA_CLAIM_SECRET`，`npm run bridge:check`，重建/重启。
5. 关闭 `ALPHA_LEGACY_CLAIM`（默认 0），用测试账号走一遍：未登录 claim → 401；错误账号 → 403；正确账号 → license + memoryToken；`/memory/mcp` 用该 token 可读，坏 token 401。
6. 观察：`cloud.json` 对账差异、401 率、`BridgeOutbox` 未处理数、token 过期未吊销数。建议每 5 分钟跑一次 `node scripts/reconcile-memory-bridge.mjs`（或接 cron）作为兜底对账。

### 5.3 重启顺序

1. quota-platform（先让 claim/pickup 的 HMAC 校验生效；旧网站此时仍可匿名 claim 旧式 license，但新 claim 会 403）。
2. 网站（新的 claim 路由 + bridge 生效）。
3. causal-memory 不需要重启：`cloud.json` 原子替换后 `tenant.rs` 按 mtime 热加载。若 tokens 目录本身变更，则按第 1 步 preflight 后重启。

### 5.4 回滚

1. 停止网站领取入口或回滚网站版本。
2. 恢复网站 SQLite / `cloud.json` / `tenants/` 备份（本次改动前）。
3. 从 quota 移除 `ALPHA_CLAIM_SECRET` / `ALPHA_LEGACY_CLAIM`，旧版 quota 的匿名 pickup 行为恢复；旧 license 的 `cloud_key` 不受影响。
4. `ApiToken.tenant` 若已回填，保留 `u_<id>` 不会破坏旧 token（旧 token 的 cloud.json 映射在备份里）；若要完全回到 email tenant，用备份恢复，不要手工删列。
5. `BridgeOutbox` 未处理行在回滚前先导出（`sqlite3 ... "select * from BridgeOutbox where processedAt is null"`），避免丢失重试意图。

## 6. 兼容窗口

- **旧 license**：`cloud_key` 仍保留在 payload；`/hub/mcp/memory` + 旧 `tokens.json` 映射保留到 legacy license 最大 `exp`。网站不改旧 license 的验证。
- **旧 dashboard token**：迁移时复制 DB 到 `u_<id>` 并一次性替换 `cloud.json`；token 本身不变。迁移完成前，旧 token 继续读 email tenant；迁移后读 `u_<id>`。
- **新 license**：`v` 仍为 1，新增字段只增不改；旧安装端忽略新字段，继续用 `cloud_key`。
- **CLI `issue_license.py --mint-cloud`**：不在本次可改仓库内；它不生成 `memory_token`，继续签发旧式 license。需要新式记忆 token 时走网页 claim 或后续升级 CLI。

## 7. 已知风险 / 需要部署侧配合

1. **causal-memory Rust 的启动 fail-open 无法在本仓库修**（无 cargo）。`tenant.rs:148-161` 在 tokens 目录缺失/为空/不可解析时返回 `None`，`misc.rs` 走 open 共享库。该风险只能由部署侧消除：
   - 必须设置 `CAUSAL_MEMORY_TOKENS_FILE`；
   - 启动前跑 `preflight_cloud_memory.py`；
   - 任何情况下不要设置 `CAUSAL_MEMORY_ALLOW_OPEN=1`；
   - 探针坏 token 必须 401。
2. `CM_TOKENS_BRIDGE` 未配置时网站 token/claim 返回 503（不会签发不可用 token），但 `/memory/mcp` 本身是否 401 取决于 causal-memory 的 tokens 文件。
3. 网站与 quota 是两套库：绑定采用 HMAC 身份头 + 网站侧 `LicenseClaim`；quota 不直接访问网站 DB。取舍是“申请时绑定、领取时校验”，避免跨库双写；代价是 `ALPHA_CLAIM_SECRET` 必须双端一致轮换。
4. `bridge/config` 不再返回 BYOK 明文；仓库内无消费者，若有仓库外 sidecar 依赖 `byokLlmKey`，需要改成只读 `byokConfigured` 或另做 per-tenant envelope。
5. 旧 `PendingTokens` 仍在 quota 内存；重启丢待领取 token 的问题未在本次改动（需要改发）。本次只保证新 claim 的绑定/租户/记忆 token。
6. 已发出的旧 license 里的 `cloud_key` 无法远程吊销（离线 license 的固有限制）；新 license 的 `memory_token` 可以按 DB 吊销。

## 8. 本地验证命令

```bash
# website
npm install --no-package-lock --ignore-scripts   # 或 npm ci
npx prisma generate
npx tsc --noEmit
npm run bridge:test          # 文件锁 / 原子写 / 损坏文件拒绝覆盖 / 并发 add
npm run bridge:check         # CM_TOKENS_BRIDGE 可写且 JSON 合法
# 空库迁移（临时 DATABASE_URL）
DATABASE_URL=file:/tmp/cm-test.db npx prisma migrate deploy
# 已有库升级（临时库演示）
DATABASE_URL=file:/tmp/cm-test2.db npx prisma db push
DATABASE_URL=file:/tmp/cm-test2.db npx prisma db execute --file prisma/backfill-tenants.sql --schema prisma/schema.prisma

# quota-platform
python3 -m compileall -q quota-platform
python3 -m unittest discover -s quota-platform/tests -v
python3 quota-platform/scripts/e2e_apply_flow.py
python3 quota-platform/scripts/preflight_cloud_memory.py --tokens-dir <dir> --skip-probe
```

生产验证：未登录 claim → 401；错误账号 → 403；正确账号 → license + `memoryToken`；
用该 token 调 `/memory/mcp` 的 `search_facts` 能看到自己的数据；另一个用户的 token 看不到；
坏 token / 无 token → 401，且 `tenants/` 不新增文件。
